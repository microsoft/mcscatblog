---
layout: post
title: "Your Service, Your Auth: The Hosted Agent Service Pattern for Copilot Studio"
date: 2026-03-26 10:00:00 +0000
categories: [copilot-studio, authentication]
tags: [agents-sdk, obo, entra-id, copilot-studio, authentication, m365-agents-sdk]
description: Learn how to build a custom hosted agent service that authenticates users via Entra ID, routes prompts to Copilot Studio for AI planning and tool invocation, and securely calls enterprise APIs using the On-Behalf-Of flow.
author: jpad5
image:
  path: /assets/posts/hosted-agent-service/has-title.jpg
  alt: "Sequence diagram showing the 5-phase Hosted Agent Service authentication and orchestration flow"
  no_bg: true
---

> **This is Part 1** of a two-part series. This post walks through the **Hosted Agent Service** pattern: a custom-built service that validates user JWTs, delegates AI planning to Copilot Studio, and securely calls enterprise APIs using the On-Behalf-Of (OBO) flow. A working .NET 8 code sample with Bicep infrastructure is included. In **Part 2**, we'll convert this service into a full Agent Framework agent with channel publishing (Teams, Outlook) and distributed conversation state across stateless nodes.
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

When building AI agent experiences, one of the most common enterprise requirements is: _"I need a custom frontend, full control over authentication, API access, and response shaping, while still letting Copilot Studio handle AI planning and tool invocation, all within my existing Entra ID infrastructure."_

The **Hosted Agent Service** pattern addresses this by placing a custom ASP.NET Core service between your frontend and Microsoft Copilot Studio. **You control** hosting, auth, OBO token exchange, and how responses are composed. **Copilot Studio controls** AI planning and tool invocation. Specifically, the service:

1. **Validates user JWTs** from your frontend (Teams, Portal, or any custom UI)
2. **Delegates AI planning and tool invocation** to Copilot Studio via the [`CopilotClient`](https://www.nuget.org/packages/Microsoft.Agents.CopilotStudio.Client) SDK from the [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft/agents/overview), using OBO authentication and SSE streaming
3. **Performs On-Behalf-Of (OBO) token exchanges**, first to call Copilot Studio as the user (Power Platform API scope), then to call downstream enterprise APIs as the signed-in user
4. **Returns composed responses** combining agent intelligence with enterprise data

> **Terminology note:** "Azure Hosted Agent Service" is an **architectural pattern**, not a specific Azure product. It refers to any custom-built agent service you host on Azure compute (App Service, Container Apps, etc.).
{: .prompt-warning }

## Architecture

The pattern follows 5 phases, illustrated in the sequence diagram below:

**Phase 1: Authentication** → **Phase 2: Request Submission** → **Phase 3: Orchestration** → **Phase 4: OBO / API Call** → **Phase 5: Response Delivery**

![Azure Hosted Agent Service Sequence Diagram](/assets/posts/hosted-agent-service/seq-flow.png){: .shadow w="800" }
_The full 18-step flow: User SSO → JWT validation → Copilot Studio orchestration → OBO token exchange → Enterprise API call → response delivery_

### How It Works

| Phase | What Happens | Key Component |
|---|---|---|
| **1 — Authentication** | User signs into the frontend via Entra ID (OIDC). <br>[Conditional Access](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview) policies enforced. | Microsoft Entra ID |
| **2 — Request <br>Submission** | Frontend sends the user's prompt + JWT <br>to the Agent Service. Service validates the token. | Agent Service <br>(JWT validation) |
| **3 — Orchestration** | Agent Service performs OBO exchange #1: <br>user JWT → Power Platform API token <br> (`CopilotStudio.Copilots.Invoke`). <br>`CopilotClient` SDK calls Copilot Studio <br>via SSE streaming. | `CopilotClient` SDK <br>+ Copilot Studio |
| **4 — OBO Flow** | Agent Service performs OBO exchange #2: user JWT → <br>Enterprise API token (`access_as_user`). <br>Calls the API as the user. | MSAL OBO + <br>Enterprise API |
| **5 — Response** | Enterprise API data flows back through Copilot Studio <br>and the Agent Service to the frontend. | All components |

## Watch the Demo

This 1-minute walkthrough shows the full pattern running locally, from user sign-in through the OBO token exchange to the Enterprise API response.

{% include embed/youtube.html id='Qa2qI-q1NE0' %}

## The Code Sample

The complete working sample for user sign-in, JWT validation, the On-Behalf-Of flow, Copilot Studio integration, and the downstream Enterprise API call is available at [**github.com/jpad5/azure-agent-patterns/01-hosted-agent-service**](https://github.com/jpad5/azure-agent-patterns/tree/master/01-hosted-agent-service). The Agent Service makes a **real call** to a Copilot Studio agent via the `CopilotClient` SDK with OBO authentication and SSE streaming.

| Component | Port | Purpose |
|---|---|---|
| **FrontendApp** | `5010` | Razor Pages app with MSAL / OpenID Connect SSO |
| **AgentService** | `5020` | ASP.NET Core API — JWT validation, Copilot Studio conversations API, OBO |
| **Enterprise API** | `5050` | Shared downstream API (see `shared/enterprise-api`) |

### The Dual OBO Flow — Core of the Pattern

The most critical piece is the Agent Service's `/api/agent/invoke` endpoint. The service performs **two OBO token exchanges**: first to call Copilot Studio as the user, then to call the Enterprise API as the user.

**OBO Exchange #1: Copilot Studio via `CopilotClient` SDK**

The first OBO exchange acquires a Power Platform API token so the `CopilotClient` can call Copilot Studio as the signed-in user. The SDK handles SSE streaming, returning activities as `IAsyncEnumerable<Activity>`:

```csharp
// Token provider: acquires an OBO token for the Power Platform API on each call.
async Task<string> GetCopilotTokenAsync(string _)
{
    var token = await tokenAcquisition.GetAccessTokenForUserAsync(
        new[] { "https://api.powerplatform.com/CopilotStudio.Copilots.Invoke" });
    return token;
}

var copilotClient = new CopilotClient(
    connectionSettings, httpClientFactory,
    GetCopilotTokenAsync, logger, "CopilotStudio");

// Start a conversation and collect the greeting (if any).
var responses = new List<string>();
await foreach (var activity in copilotClient.StartConversationAsync(
    emitStartConversationEvent: true))
{
    if (activity.Type == "message" && !string.IsNullOrEmpty(activity.Text))
        responses.Add(activity.Text);
}

// Send the user's prompt and collect the agent's reply.
await foreach (var activity in copilotClient.AskQuestionAsync(request.Prompt))
{
    if (activity.Type == "message" && !string.IsNullOrEmpty(activity.Text))
        responses.Add(activity.Text);
}
```

**OBO Exchange #2: Enterprise API**

With the Copilot Studio response in hand, a second OBO exchange acquires a token scoped to the Enterprise API. The user's identity flows through the entire chain:

```csharp
var enterpriseApiScope = configuration["EnterpriseApi:Scope"]!;
var oboToken = await tokenAcquisition.GetAccessTokenForUserAsync(
    new[] { enterpriseApiScope });

var client = httpClientFactory.CreateClient("EnterpriseApi");
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", oboToken);

var apiResponse = await client.GetAsync("/api/me");
apiResponse.EnsureSuccessStatusCode();
var enterpriseData = await apiResponse.Content.ReadFromJsonAsync<object>();
```

Both calls use `ITokenAcquisition.GetAccessTokenForUserAsync()` with different scopes. Each takes the user's inbound JWT, sends it to Entra ID's `/oauth2/v2.0/token` endpoint with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`, and returns a new token scoped to the target API. MSAL's in-memory cache handles token reuse automatically: subsequent calls for the same scope within a request are served from cache (24ms vs ~700ms for the initial exchange).

For more on how OBO works under the hood, see the [Microsoft identity platform on-behalf-of flow documentation](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow). For a connector-based approach to OBO in Copilot Studio, see [OBO for Custom Connectors]({% post_url 2025-12-05-obo-for-custom-connectors %}).

### Wiring Up the Agent Service

The `Program.cs` for the Agent Service configures Microsoft.Identity.Web with OBO support and registers the `CopilotClient` SDK dependencies:

```csharp
using Microsoft.Agents.CopilotStudio.Client;

// JWT Bearer authentication via Microsoft Identity Web with OBO support.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi()  // Enables OBO
    .AddInMemoryTokenCaches();                     // Cache OBO tokens

// Named HttpClient for the CopilotClient SDK.
builder.Services.AddHttpClient("CopilotStudio");

// Register ConnectionSettings for the CopilotClient SDK.
builder.Services.AddSingleton(_ =>
{
    var cs = builder.Configuration.GetSection("CopilotStudio");
    return new ConnectionSettings
    {
        EnvironmentId = cs["EnvironmentId"]!,
        SchemaName = cs["SchemaName"]!,
    };
});
```

The authentication chain registers JWT Bearer validation against your Entra ID tenant and makes [`ITokenAcquisition`](https://learn.microsoft.com/en-us/entra/msal/dotnet/microsoft-identity-web/token-acquisition) available for dependency injection. The `CopilotClient` comes from the [`Microsoft.Agents.CopilotStudio.Client`](https://www.nuget.org/packages/Microsoft.Agents.CopilotStudio.Client) NuGet package. The `ConnectionSettings` registration provides it with the `EnvironmentId` and `SchemaName` of your Copilot Studio agent (available in Copilot Studio under Settings → Advanced → Metadata).

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
| **Agent Service** | `api://<id>/access_as_user` | Enterprise API scope (for OBO) + <br>Power Platform API (`CopilotStudio.Copilots.Invoke`) | Yes |
| **Frontend App** | — | Agent Service scope (for token acquisition) | Yes (web app client secret) |

The key configuration: the Agent Service must have **API permission** for both the Enterprise API's scope and the Power Platform API's `CopilotStudio.Copilots.Invoke` delegated permission (with admin consent granted), plus a **client secret** to perform the OBO exchanges. The Frontend App (a Razor Pages server-side web app using `AddMicrosoftIdentityWebApp(...)`) must also be configured as a confidential client with its own **client secret** and delegated permission to call the Agent Service scope. If you're working with connector consent flows instead, see [Connector Consent Card OBO]({% post_url 2025-09-21-connector-consent-card-obo %}) for that approach.

> You also need a **published Copilot Studio agent** with authenticated access enabled. You'll need the agent's `EnvironmentId` and `SchemaName` (available in Copilot Studio under Settings → Advanced → Metadata) for the Agent Service configuration.
{: .prompt-info }

## Key Takeaways

- **Start simple first.** WebChat + Direct Line SSO covers most agent scenarios. Copilot Studio already enforces Conditional Access and supports connectors with OBO. Only reach for this pattern when you've hit a specific limitation.
- **OBO is the primary driver.** If your agent needs to call multiple downstream APIs as the signed-in user with custom orchestration logic between calls, this pattern gives you full control over the token exchange chain.
- **Standard Entra ID SSO.** Users sign in once via OIDC. Conditional Access policies are enforced at sign-in. No OAuth cards or backchannel hacks needed. If you're evaluating auth patterns, [You Don't Need Manual Auth]({% post_url 2025-11-18-you-dont-need-manual-auth %}) covers when SSO is sufficient.
- **On-Behalf-Of preserves user identity.** The Enterprise API sees the actual user's claims, not a service principal. This enables per-user authorization and auditing in downstream systems.
- **CopilotClient SDK handles the hard parts.** The `CopilotClient` from `Microsoft.Agents.CopilotStudio.Client` manages SSE streaming, conversation lifecycle, and token management. You just `await foreach` over `IAsyncEnumerable<Activity>` responses. Copilot Studio handles prompt planning and tool invocation while your service handles auth, OBO, and API integration.
- **Token caching matters.** MSAL's in-memory cache handles OBO token reuse automatically. The first OBO exchange for a scope costs ~700ms (network call to Entra ID). Subsequent calls for the same scope within a request are served from cache in ~24ms.
- **Deployable with `azd up`.** Bicep + azure.yaml included. One command to provision and deploy all 3 components.

This pattern trades simplicity for control. You're taking on more infrastructure (an extra service to host, monitor, and secure) in exchange for full authority over the auth chain, orchestration logic, and response composition. That trade-off is worth it when your requirements demand it.

## What's Next: From Proxy to Orchestrator Agent (Part 2)

This post demonstrated the auth plumbing (JWT validation, dual OBO token exchanges, and real Copilot Studio integration via the `CopilotClient` SDK), but the hosted service is still essentially a **proxy**. It forwards prompts and relays responses. That's useful, but there's a much more powerful version of this pattern.

In **Part 2**, we'll turn this service into a **custom orchestrator agent** built with [Microsoft Agent Framework](https://learn.microsoft.com/en-us/microsoft/agents/overview). That changes the game:

- **Channel publishing.** By implementing `ActivityHandler` and registering with Azure Bot Service, your agent becomes a first-class citizen in Teams, Outlook, and other M365 channels. No WebChat embedding required.
- **Custom orchestration.** Instead of blindly forwarding prompts to a single Copilot Studio agent, your orchestrator can route between multiple agents, call external LLMs, apply business rules, and compose responses from different sources.
- **Distributed conversation state.** How do you handle conversation state when your agent runs across multiple stateless nodes behind a load balancer? We'll cover state storage in Azure Blob/Cosmos, sticky sessions vs. distributed state, and how OBO token caching works in a multi-node deployment.

> If the full pattern with channel publishing and custom orchestration is what you're after, stay tuned for Part 2.
{: .prompt-tip }

The full code sample for this post is available at [**github.com/jpad5/azure-agent-patterns**](https://github.com/jpad5/azure-agent-patterns).

Happy Building!

> Have you hit the wall where a simple proxy wasn't enough and you needed a full orchestrator agent? What drove that decision? Let us know in the comments!
{: .prompt-tip }
