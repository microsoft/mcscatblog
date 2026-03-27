---
layout: post
title: "[Demo] Your Service, Your Auth: The Hosted Agent Service Pattern for Copilot Studio"
date: 2026-03-26 10:00:00 +0000
categories: [copilot-studio, authentication]
tags: [agents-sdk, obo, entra-id, copilot-studio, authentication, sso]
description: Learn how to build a custom Azure-hosted agent service that authenticates users via Entra ID, routes prompts to Copilot Studio for AI planning and tool invocation, and securely calls enterprise APIs using the On-Behalf-Of flow.
author: jpad5
image:
  path: /assets/posts/hosted-agent-service/has-title.jpg
  alt: "Sequence diagram showing the 5-phase Hosted Agent Service authentication and orchestration flow"
  no_bg: true
---

> This post walks through the **Hosted Agent Service** pattern, a custom-built agent service hosted on Azure that delegates AI planning and tool invocation to Microsoft Copilot Studio and securely calls enterprise APIs using the On-Behalf-Of (OBO) flow. A working .NET 8 code sample with Bicep infrastructure is included.
{: .prompt-info }

## Before You Reach for This Pattern

Let's be upfront: **Copilot Studio already handles a lot of this out of the box.** If you embed your agent with [WebChat](https://github.com/microsoft/BotFramework-WebChat), you get a fully customizable chat UI, SSO via Direct Line token exchange, and Conditional Access enforcement through the M365 Agents SDK's native Entra ID integration. For many scenarios, that's all you need.

So when would you reach for the Hosted Agent Service pattern instead?

**You hit one of these walls:**

- **You need the On-Behalf-Of (OBO) flow to call downstream APIs as the user.** This is the big one. WebChat + Direct Line gives your agent an auth token, but if your agent needs to call enterprise APIs that enforce per-user authorization (think: "show me _my_ expense reports"), you need OBO to exchange the user's token for one scoped to each downstream API. Copilot Studio connectors can do OBO ([see this post]({% post_url 2025-12-05-obo-for-custom-connectors %})), but if you need to orchestrate multiple API calls with custom logic between them, a hosted service gives you full control over that chain.
- **You need custom orchestration logic between prompts and Copilot Studio.** Maybe you're enriching prompts with data from a user profile service, routing to different agents based on business rules, or filtering responses before they reach the user. A proxy service lets you inject logic at every step.
- **Your frontend isn't a web app.** If you're building a native mobile app, a desktop client, or integrating into an existing SPA framework that doesn't use WebChat, you need a service endpoint your app can call directly over HTTP.
- **You need to compose responses from Copilot Studio with data from other services.** If the final response to the user combines agent intelligence with data from enterprise APIs, and that composition logic lives in your service tier rather than in Copilot Studio topics.

If none of these apply, you probably don't need this pattern. Start with WebChat + SSO and see how far it gets you. If you've tried that and hit the wall, read on.

## What Is the Hosted Agent Service Pattern?

### Overview

When building AI agent experiences, one of the most common enterprise requirements is: _"I need a custom frontend, full control over authentication, API access, and response shaping — while still letting Copilot Studio handle AI planning and tool invocation — all within my existing Entra ID infrastructure."_

The **Hosted Agent Service** pattern addresses this by placing a custom ASP.NET Core service between your frontend and Microsoft Copilot Studio. **You control** hosting, auth, OBO token exchange, and how responses are composed. **Copilot Studio controls** AI planning and tool invocation. Specifically, the service:

1. **Validates user JWTs** from your frontend (Teams, Portal, or any custom UI)
2. **Delegates AI planning and tool invocation** to Copilot Studio via the [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft/agents/overview) (see [Integrate Copilot Studio with the Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft/copilot-studio/integrate-m365-agents-sdk) for setup and connection-string configuration)
3. **Performs On-Behalf-Of (OBO) token exchange** to call downstream enterprise APIs as the signed-in user
4. **Returns composed responses** combining agent intelligence with enterprise data

> **Terminology note:** "Azure Hosted Agent Service" is an **architectural pattern**, not a specific Azure product. It refers to any custom-built agent service you host on Azure compute (App Service, Container Apps, etc.).
{: .prompt-warning }

## Architecture

The pattern follows 5 phases, illustrated in the sequence diagram below:

**Phase 1: Authentication** → **Phase 2: Request Submission** → **Phase 3: Orchestration** → **Phase 4: OBO / API Call** → **Phase 5: Response Delivery**

![Azure Hosted Agent Service Sequence Diagram](/assets/posts/hosted-agent-service/architecture.png){: .shadow w="800" }
_The full 18-step flow: User SSO → JWT validation → Copilot Studio orchestration → OBO token exchange → Enterprise API call → response delivery_

### How It Works

| Phase | What Happens | Key Component |
|---|---|---|
| **1 — Authentication** | User signs into the frontend via Entra ID (OIDC). <br>[Conditional Access](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview) policies enforced. | Microsoft Entra ID |
| **2 — Request Submission** | Frontend sends the user's prompt + JWT <br>to the Agent Service. Service validates the token. | Agent Service <br>(JWT validation) |
| **3 — Orchestration** | Agent Service calls Copilot Studio via the M365 <br>Agents SDK. Copilot Studio determines <br>a tool invocation is needed. | M365 Agents SDK <br>+ Copilot Studio |
| **4 — OBO Flow** | Agent Service exchanges the user's JWT for a <br>downstream token scoped to the Enterprise API. <br>Calls the API as the user. | MSAL OBO + <br>Enterprise API |
| **5 — Response** | Enterprise API data flows back through Copilot Studio <br>and the Agent Service to the frontend. | All components |

## Watch the Demo

This 1-minute walkthrough shows the full pattern running locally, from user sign-in through the OBO token exchange to the Enterprise API response.

{% include embed/youtube.html id='Qa2qI-q1NE0' %}

## The Code Sample

The complete working sample for user sign-in, JWT validation, the On-Behalf-Of flow, and the downstream Enterprise API is available at [**github.com/jpad5/azure-agent-patterns/01-hosted-agent-service**](https://github.com/jpad5/azure-agent-patterns/tree/master/01-hosted-agent-service). In this repo, the Copilot Studio call is simulated so you can run everything locally without a Copilot Studio environment.

| Component | Port | Purpose |
|---|---|---|
| **FrontendApp** | `5010` | Razor Pages app with Entra ID SSO (OIDC) |
| **AgentService** | `5020` | JWT validation + simulated Copilot Studio orchestration + OBO |
| **Enterprise API** | `5050` | Mock downstream API that validates OBO tokens |

### The OBO Flow — Core of the Pattern

The most critical piece is the Agent Service's `/api/agent/invoke` endpoint. Here's the key section that performs the OBO token exchange and calls the Enterprise API:

```csharp
// --- OBO Token Exchange ---
// Exchange the user's incoming JWT for a token scoped to the Enterprise API.
// ITokenAcquisition (from Microsoft.Identity.Web) handles the OBO flow automatically.
var enterpriseApiScope = configuration["EnterpriseApi:Scope"]!;
var oboToken = await tokenAcquisition.GetAccessTokenForUserAsync(
    new[] { enterpriseApiScope });

// --- Call Enterprise API as the user ---
var client = httpClientFactory.CreateClient("EnterpriseApi");
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", oboToken);

var apiResponse = await client.GetAsync("/api/me");
apiResponse.EnsureSuccessStatusCode();
var enterpriseData = await apiResponse.Content.ReadFromJsonAsync<object>();
```

The `ITokenAcquisition.GetAccessTokenForUserAsync()` method does the heavy lifting — it takes the user's inbound JWT, sends it to Entra ID's `/oauth2/v2.0/token` endpoint with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`, and returns a new token scoped to the Enterprise API. The user's identity flows through the entire chain. For more on how this works under the hood, see the [Microsoft identity platform on-behalf-of flow documentation](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow). For a connector-based approach to OBO in Copilot Studio, see [OBO for Custom Connectors]({% post_url 2025-12-05-obo-for-custom-connectors %}).

### Wiring Up the Agent Service

The `Program.cs` for the Agent Service configures Microsoft.Identity.Web with OBO support in just a few lines:

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi()  // Enables OBO
    .AddInMemoryTokenCaches();                     // Cache OBO tokens
```

This single chain registers JWT Bearer authentication, validates tokens against your Entra ID tenant, and makes [`ITokenAcquisition`](https://learn.microsoft.com/en-us/entra/msal/dotnet/microsoft-identity-web/token-acquisition) available for dependency injection anywhere in your app.

### Where Copilot Studio Plugs In

The sample simulates the Copilot Studio call, but the integration point is clear and well-documented in the code:

> The code below is **pseudocode** showing where the M365 Agents SDK plugs in. The sample uses a mocked response for local testing.
{: .prompt-warning }

```csharp
// In a real implementation, you would use the M365 Agents SDK here:
//   var agentClient = new AgentsClient(connectionSettings);
//   var activity = MessageFactory.Text(request.Prompt);
//   var response = await agentClient.GetResponseAsync(activity);
// The SDK routes the prompt to a Copilot Studio agent and returns its response.
```

When ready for production, replace the simulation with the actual M365 Agents SDK call — the rest of the flow (OBO, Enterprise API call, response composition) remains unchanged.

### The Frontend — Razor Pages + MSAL

The frontend uses [`Microsoft.Identity.Web`](https://learn.microsoft.com/en-us/entra/msal/dotnet/microsoft-identity-web/) for OIDC sign-in and acquires a token scoped to the Agent Service:

```csharp
builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi()
    .AddInMemoryTokenCaches();
```

The `Index.cshtml.cs` page model acquires the token and exposes it to the frontend JavaScript, which calls the Agent Service via `fetch()`:

```javascript
const response = await fetch('http://localhost:5020/api/agent/invoke', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: userMessage })
});
```

## Deploying to Azure

The sample includes Bicep infrastructure and an `azure.yaml` for deployment with Azure Developer CLI:

```bash
cd 01-hosted-agent-service
azd up
```

> [`azd up`](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/reference#azd-up) provisions infrastructure and deploys code in a single command.
{: .prompt-tip }

This provisions:
- **App Service Plan** (B1 Linux)
- **3 Web Apps** — frontend, agent-service, enterprise-api
- App settings pre-wired with Entra ID configuration and service URLs

The Bicep template uses `azd-service-name` tags so `azd` automatically maps each service to its Web App.

## App Registration Setup

You need **3 Entra ID app registrations**. Here's the minimal setup:

| Registration | Expose API Scope | Permissions Needed | Secret |
|---|---|---|---|
| **Enterprise API** | `api://<id>/access_as_user` | — | No |
| **Agent Service** | `api://<id>/access_as_user` | Enterprise API scope (for OBO) | Yes |
| **Frontend App** | — | Agent Service scope (for token acquisition) | Yes (web app client secret) |

The key configuration: the Agent Service must have **API permission** for the Enterprise API's scope and a **client secret** to perform the OBO exchange, and the Frontend App (a Razor Pages server-side web app using `AddMicrosoftIdentityWebApp(...)`) must also be configured as a confidential client with its own **client secret** and delegated permission to call the Agent Service scope.

## Key Takeaways

- **Start simple first** — WebChat + Direct Line SSO covers most agent scenarios. Copilot Studio already enforces Conditional Access and supports connectors with OBO. Only reach for this pattern when you've hit a specific limitation.
- **OBO is the primary driver** — If your agent needs to call multiple downstream APIs as the signed-in user with custom orchestration logic between calls, this pattern gives you full control over the token exchange chain.
- **Standard Entra ID SSO** — Users sign in once via OIDC. Conditional Access policies are enforced at sign-in. No OAuth cards or backchannel hacks needed. If you're evaluating auth patterns, [You Don't Need Manual Auth]({% post_url 2025-11-18-you-dont-need-manual-auth %}) covers when SSO is sufficient.
- **On-Behalf-Of preserves user identity** — The Enterprise API sees the actual user's claims, not a service principal. This enables per-user authorization and auditing in downstream systems.
- **Copilot Studio as orchestrator** — Copilot Studio handles prompt planning and tool invocation. Your service handles auth, OBO, and API integration — a clean separation of concerns.
- **Deployable with `azd up`** — Bicep + azure.yaml included. One command to provision and deploy all 3 components.

This pattern trades simplicity for control. You're taking on more infrastructure (an extra service to host, monitor, and secure) in exchange for full authority over the auth chain, orchestration logic, and response composition. That trade-off is worth it when your requirements demand it.

The full code sample is available at [**github.com/jpad5/azure-agent-patterns**](https://github.com/jpad5/azure-agent-patterns).

Happy Building!

> How would the On-Behalf-Of flow change your approach to building enterprise agent experiences that need secure, user-delegated access to internal APIs? Let us know in the comments!
{: .prompt-tip }
