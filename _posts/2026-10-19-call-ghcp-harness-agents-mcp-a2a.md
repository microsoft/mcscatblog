---
layout: post
agent_edition: both
title: "Call GitHub Copilot Harness Agents from Any Copilot Studio Agent with MCP and A2A"
date: 2026-10-19
categories: [copilot-studio, orchestration]
tags: [mcp, a2a, a2a-protocol, multi-agent, connected-agents, delegated-permissions, orchestration]
description: "Publish a GitHub Copilot harness agent as an MCP server and an A2A agent, call it from standard agents and from agents in other environments, and choose between MCP, A2A and connected agents."
author: ssivaraman
image:
  path: /assets/posts/call-ghcp-harness-agents-mcp-a2a/header.png
  alt: "A GitHub Copilot harness agent in the center exposes two endpoints. A standard agent calls it through MCP as a tool, and a GitHub Copilot harness agent in another environment calls it through A2A as a peer. Both calls pass through Microsoft Entra ID as the signed-in user."
  no_bg: true
---

You've got standard Copilot Studio agents in production. They work, people use them, and nobody wants to rebuild them. Meanwhile, your new agents are being built on the [GitHub Copilot harness](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview), and they're picking up skills the old agents don't have.

So the obvious question lands: can the agents you already have call the ones you're building now? And can the new agents work together when they live in different environments?

Yes. A GitHub Copilot harness agent can be published as an **MCP server** and as an **A2A agent**:

- Your existing **standard** agents can add it as an **MCP tool**, so you bring new-harness skills into production agents without rebuilding anything.
- Other **GitHub Copilot harness** agents can call it over **MCP or A2A**, including from other environments.
- Follow-up turns keep their context either way.

The [official Learn article](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/publication-channels-mcp-agent-to-agent) explains how to expose an agent on these channels: the app registration, the permissions and the generic client settings. This post doesn't repeat those steps. It picks up where the article stops: calling the agent *from Copilot Studio*, what we found when we tested it, what the protocols look like on the wire, and how to choose between MCP, A2A and connected agents.

> The MCP and A2A channels are in preview. Everything below was tested in October 2026, and details may change before general availability.
{: .prompt-warning }

## Before you start

Create the app registration and add the delegated permissions by following [Prerequisite: Create an app registration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/publication-channels-mcp-agent-to-agent#prerequisite-create-an-app-registration) in the Learn article. A few things the article doesn't spell out:

- **Only the caller registers.** The called agent's endpoint is protected by the Copilot Studio channel API, which already exists in your tenant, the same way any app calling Microsoft Graph needs a registration but Graph doesn't.
- **The API name varies.** Depending on your tenant, the channel API may appear as *Microsoft Copilot Studio Agent as MCP channel* or *Microsoft Copilot Studio Agent MCP and A2A channels*. Searching by its application ID finds it either way.
- **Each call runs as the signed-in user** of the calling agent, so the caller can't reach an agent that user couldn't reach.
- **Callers always get the published version** of the called agent, and Copilot Credits are consumed in the **called** agent's environment.

### Why the setup looks the way it does

The MCP and A2A endpoints sit behind Microsoft Entra ID, like any Microsoft API. Every call must carry an access token, and Entra issues tokens only to applications it knows about. The app registration is how the **calling side** becomes one of those applications. Each token answers two questions:

| Question | Answered by |
|---|---|
| **Who** is asking? | The signed-in **user**, so the agent runs with that user's identity and access |
| **Through what** are they asking? | The **app registration**: your Copilot Studio agent's connector, or your own client |

That explains each piece you configure:

- **Two permissions instead of one.** `MCS.InvokeAsMCP` and `MCS.InvokeAsA2A` are separate so admins can allow one protocol without the other. For example, an admin can allow MCP for one set of callers but keep A2A off until the orchestration design is approved. Add only the one you need.
- **Delegated, not application.** The app can call an agent only **on behalf of a signed-in user**, never on its own.
- **A client secret.** A Copilot Studio connector is a server-side web app. It exchanges the sign-in code for a token on the server, and the secret proves the request really comes from your registration.
- **A redirect URL.** Entra only returns the sign-in result to addresses registered on the app. That stops anyone else from receiving your users' tokens.
- **OAuth mode "Manual".** Entra doesn't support dynamic client registration, so you enter the registration's details yourself. If you've wired up a server that *does* support it, like the one in [the Jira remote MCP post]({% post_url 2026-05-15-atlassian-jira-remote-mcp-copilot-studio %}), this is the step that's different.

## Where to find the endpoints

Open the published GitHub Copilot harness agent in its Early environment and go to **Triggers**, then pick **MCP protocol** or **A2A protocol**. Each dialog shows the agent's URL:

```text
MCP:  https://api.powerplatform.com/copilotstudio-mcp/tenants/{tenantId}/environments/{environmentId}/agents/{agentSchemaName}
A2A:  https://api.powerplatform.com/copilotstudio-a2a/tenants/{tenantId}/environments/{environmentId}/agents/{agentSchemaName}
Card: {A2A URL}/.well-known/agent-card.json
```

In the A2A dialog, add **skills**: a name and a description for each thing the agent is good at. These are published in the agent card, and other agents use them to decide when to call yours.

![The A2A client dialog showing the agent's A2A URL, agent card URL, and one skill named hr-policy-questions](/assets/posts/call-ghcp-harness-agents-mcp-a2a/a2a-endpoint-dialog.png){: .shadow w="700" }
_The A2A dialog: the endpoint, the agent card URL, and the skills that other agents see._

> The [official docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/publication-channels-mcp-agent-to-agent) describe the same entries under **Channels → Add a channel → MCP client / A2A client**, and you may see them there instead. Either way, the called agent must be in an Early release environment.
{: .prompt-info }

## Scenario 1: Standard agent → GitHub Copilot harness agent (MCP)

This is the "don't rebuild the production agent" scenario. Your standard agent gets the new agent as one more tool.

1. **App registration:** create it, add the `MCS.InvokeAsMCP` delegated permission, and create a client secret.
2. **In the standard agent:** go to **Tools → Add a tool → Model Context Protocol** and paste the MCP URL.
3. **Authentication:** choose **OAuth 2.0 → Manual**. Enter the client ID and secret, and take the authorization, token and refresh URLs and the MCP scope from [Configure the client](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/publication-channels-mcp-agent-to-agent#configure-the-client) in the Learn article. The scope must include `offline_access`, so the connection can refresh its token.

4. **Redirect URL:** Copilot Studio shows a URL that starts with `https://global.consent.azure-apim.net/redirect/`. Add it to the app registration as a **Web** redirect URI, exactly as shown.
5. **Connection:** create the connection, sign in, and add the tool.
6. **Test:** the tool panel shows a single tool, **Send message**. Ask your standard agent something the GitHub Copilot harness agent knows, and the activity trace shows `send-message` being called.

![A standard agent's MCP tool details page, showing the connection and a single send-message tool](/assets/posts/call-ghcp-harness-agents-mcp-a2a/standard-agent-mcp-tool.png){: .shadow w="700" }
_A standard agent with the GitHub Copilot harness agent added as an MCP tool. The server exposes one tool: `send-message`._

One connector and connection can serve several agents in the same environment. If MCP connectors are new to you, [Five Minutes to Your First MCP Connector]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}) walks through the basics.

## Scenario 2: GitHub Copilot harness agent → GitHub Copilot harness agent (A2A)

This is the "new agents working together across environments" scenario.

1. **App registration:** add the `MCS.InvokeAsA2A` delegated permission. You can reuse the same registration from Scenario 1.
2. **In the calling agent:** go to **Connected agents → + Add → Add A2A agent** and paste the **agent card URL**.
3. Copilot Studio reads the card and **fills the OAuth fields automatically**. Enter the client ID and secret, and give the connection a name (30 characters or fewer, using only letters, numbers, `-` and `_`).

   ![The Connect to an A2A agent form with the authorization, token and refresh URLs and the MCS.InvokeAsA2A scope filled in from the agent card](/assets/posts/call-ghcp-harness-agents-mcp-a2a/add-a2a-agent.png){: .shadow w="650" }
   _Everything below Client secret came from the agent card. You supply the name, description, client ID and secret._

4. Add the redirect URL shown to the app registration, then create the connection and sign in.
5. **Review the description.** It defaults to the card's generic text, so rewrite it to say when the agent should be used. This is what the calling agent routes on.
6. **Publish and test.** The trace shows *Used tool: {your A2A agent}*, with the input and output.

   ![Activity trace in the calling agent showing the A2A tool call, its task input, and an output with task_state completed, task_id, context_id and the agent's reply](/assets/posts/call-ghcp-harness-agents-mcp-a2a/a2a-call-trace.png){: .shadow w="650" }
   _The calling agent's trace. The output shows the A2A task: its state, task and context IDs, and the reply as an artifact._

This works across environments: in our test, a caller in the default environment called an agent in an Early environment. For the general A2A flow in Copilot Studio, see [Quickstart: Connect an A2A Agent to Copilot Studio]({% post_url 2025-12-02-copilot-studio-a2a-multi-agents %}) and the [A2A connected agent docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-agent-connected).

## Scenario 3: Same environment? Use connected agents

If both agents are GitHub Copilot harness agents in the **same environment**, you don't need either channel. **Connected agents** lists them directly, with no URL, app registration or OAuth. See [Add other agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/authoring-add-other-agents) for the setup, and [Using Inputs and Outputs in Child and Connected Agents]({% post_url 2025-09-20-copilot-studio-child-connected-agents-inputs-outputs %}) for passing data between them.

## MCP, A2A or connected agents?

The rule of thumb is short: **MCP makes your agent a tool. A2A makes it a peer. Connected agents skip the plumbing when both agents live in the same environment.**

It's easier to see with a real organization. Contoso is made up, but its requests are typical. It's a manufacturer with about 8,000 employees, and like most Copilot Studio customers it doesn't have one environment. IT, Finance and HR each own their own, with their own makers, data policies and capacity. Contoso has built standard agents over the last two years, and this year its teams started building on the GitHub Copilot harness. Here are four requests that reached the platform team in one month.

### "Our helpdesk agent needs to know about device compliance" → MCP

The *IT Helpdesk* agent is a standard agent, published to Teams, and it handles thousands of conversations a week. The security team has just built a *Device Compliance* agent on the GitHub Copilot harness. It reads Intune compliance state and explains, in plain language, why a laptop is blocked and what the employee has to do about it.

The tempting fix is to rebuild the helpdesk on the new harness so it can use connected agents. That means re-testing every topic, re-publishing to Teams and briefing the support team, all to add one capability. Instead, IT adds the compliance agent as an MCP tool, as in Scenario 1. The helpdesk keeps its topics, and when someone asks "why can't I open SharePoint on my laptop?", it calls `send-message` and passes the answer back. The call runs as the signed-in employee, so tools set to *End user account* run with that employee's access. For example, the compliance agent's device lookups could then return only that employee's devices.

**Choose MCP when** the caller is a standard agent, or anything else that just needs an answer back.

### "Sales needs Finance's discount rules, but Finance won't hand them over" → A2A

The *Sales Quote* agent lives in the Sales environment. Any discount over 10% has to be checked against rules that Finance owns and revises every quarter. Finance has already built a *Discount Approval* agent on the GitHub Copilot harness in its own environment, connected to margin data that Sales isn't allowed to see.

Copying that agent into the Sales environment would leave two sets of rules that drift apart by next quarter. Instead, Finance publishes its agent on the A2A channel with one skill, *discount-approval: checks whether a discount is within policy for a customer and product line*, and Sales adds it as an A2A agent, as in Scenario 2. The quote agent routes on that skill and description. MCP would also reach across environments, but A2A gives the caller the skills to route on.

Finance keeps control of its agent:

- Entra decides who can call it.
- Its hooks see `mcs-agent-as-a2a` on every call, so they can hold machine callers to stricter rules than people chatting directly.
- Consumption lands in Finance's environment, where Finance already plans capacity.

**Choose A2A when** the agents are GitHub Copilot harness agents in different environments, especially when another team owns the agent you're calling.

### "Travel and expenses should talk to each other" → connected agents

HR's *Travel Booking* and *Expense Claims* agents are both GitHub Copilot harness agents in the HR environment, built by the same team. When a trip is booked, the travel agent should open the expense claim with the booking reference already filled in.

Neither channel is needed. HR adds the expense agent as a connected agent by picking it from the list. There's no URL, no app registration, no OAuth, and nothing extra to maintain.

**Choose connected agents when** both agents are GitHub Copilot harness agents in the same environment.

### "We want the policy agent on our intranet, not in another chat window" → MCP from your own app

The intranet team wants an "Ask HR policy" box on the leave-request page, answered by the *HR Policy* agent. It's a server-side web app, so it signs the employee in with a pre-registered Entra app (client ID and secret), calls `send-message` with the question, and shows the reply. One tool and one call keep the code small, and `conversationId` handles follow-up questions.

We tested this pattern with a custom client. Off-the-shelf MCP clients work only if they let you enter a pre-registered Entra app, because Entra doesn't support dynamic client registration.

If the intranet team were building an orchestrator that coordinates several agents instead, A2A would fit better. Agent cards publish each agent's skills for discovery, and `SendStreamingMessage` streams long answers as they're written. The orchestrator's A2A client must speak **1.0**, and many SDKs still use 0.x (see [the 1.0 warning](#versions-at-a-glance)).

**Choose MCP when** you're writing your own client and just want a question in and an answer out.

### Quick reference

| Situation | Choose | Contoso example |
|---|---|---|
| A standard agent needs a new agent's skill | **MCP tool** | IT Helpdesk → Device Compliance |
| Different environments, another team's agent | **A2A** | Sales Quote → Discount Approval |
| Same environment | **Connected agents** | Travel Booking → Expense Claims |
| Your own app or script | **MCP** | Intranet → HR Policy |

## Governance

- **Hooks still run.** [Agent hooks](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/hooks-overview) fire for MCP and A2A calls, and `metadata.channel` is `mcs-agent-as-mcp` or `mcs-agent-as-a2a`. A hook can apply different rules to machine callers, for example allowing a sensitive tool only in direct chat. If you haven't used hooks yet, start with [Hooks in Copilot Studio]({% post_url 2026-10-12-hooks-in-copilot-studio %}).
- **Calls run as the user.** Every call carries the signed-in caller's Entra identity, which appears as `userAadObjectId` in hook metadata. Tools set to *End user account* run with that user's access.
- **Consumption follows the called agent.** Credits are consumed in the called agent's environment, so plan capacity there, not in the caller's.
- **Access is controlled in Entra.** Who can call is decided by the app registration, consent, and the user's access to the agent. There's no anonymous access.

## Under the hood

You don't need any of this if your callers are Copilot Studio agents, because Copilot Studio handles the protocol for you. It matters when you build your own client, or when you want to know what's in the trace.

### Versions at a glance

| Item | Version observed (October 2026) |
|---|---|
| MCP protocol | `2025-06-18` (Streamable HTTP, JSON-RPC 2.0) |
| MCP server | `Microsoft.CopilotStudio.AgenticRuntime.Service` |
| A2A protocol | **1.0** (JSON-RPC 2.0) |
| A2A agent card | 1.0 format |
| Authentication | Entra ID OAuth 2.0, auth code + PKCE, delegated only |
| Protected-resource metadata | RFC 9728 |

> A2A clients must speak **1.0**: PascalCase method names (`SendMessage`, …), roles `ROLE_USER` / `ROLE_AGENT`, and parts shaped as `{ "text": … }`. The 0.x method names, such as `message/send`, aren't accepted.
{: .prompt-warning }

### The MCP channel

**Discovery and authentication.** An unauthenticated request returns `401` with a `WWW-Authenticate: Bearer resource_metadata=…` header that points to the protected-resource metadata (RFC 9728). That metadata names the tenant's Entra v2.0 issuer as the authorization server, so a client can discover where to sign in. Because Entra doesn't support dynamic client registration, it still needs a pre-registered app.

**Session.** `initialize` returns server `Microsoft.CopilotStudio.AgenticRuntime.Service`, protocol version `2025-06-18`, and the capabilities `tools` and `logging`. Calls are stateless HTTP: the conversation is carried in a tool argument, not in the MCP session.

**One tool.** Here's the complete definition that `tools/list` returns. Notice the `conversationId` property, because that's how follow-up turns keep their context:

```json
{
  "name": "send-message",
  "description": "Send a message to the <Agent name> agent and receive its reply. Pass the returned conversationId on subsequent calls to continue the same conversation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "message":        { "type": "string" },
      "conversationId": { "type": "string", "description": "GUID" }
    },
    "required": ["message"]
  }
}
```

**Result.** The agent's reply comes back as a JSON object serialized into a text part:

```json
{
  "content": [{
    "type": "text",
    "text": "{\"conversationId\":\"94389d9a-…\",\"response\":[\"I can answer general questions.\"]}"
  }]
}
```

Send the `conversationId` back on the next call to continue the same conversation. Copilot Studio callers do this automatically. Custom clients should parse the `text` as JSON.

### The A2A channel

The channel implements **A2A protocol 1.0** over JSON-RPC 2.0.

**Agent card.** Served at `/.well-known/agent-card.json`, it declares `protocolVersion: "1.0"`, the endpoint in `supportedInterfaces[].url`, an Entra **authorization code + PKCE** security scheme, and the capabilities `streaming: true` and `extendedAgentCard: true`. The public card is generic. A signed-in client calls `GetExtendedAgentCard` to get the display name and the **skills** you defined.

**Methods**

| Method | Use |
|---|---|
| `SendMessage` | Send a message and get back a task with the reply |
| `SendStreamingMessage` | The same reply delivered as server-sent events: `WORKING` → artifact chunks → `COMPLETED` |
| `GetTask` / `ListTasks` | Read a task, or list the caller's tasks |
| `CancelTask` | Cancel a task |
| `GetExtendedAgentCard` | Get the full card with skills (signed in) |

Here's a `SendMessage` request. Note the 1.0 shapes: `ROLE_USER` instead of `user`, and parts with a plain `text` property:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "SendMessage",
  "params": {
    "message": {
      "role": "ROLE_USER",
      "messageId": "5f0c…",
      "parts": [{ "text": "What can you do?" }]
    }
  }
}
```

And the response, trimmed to the parts you'll read:

```json
{
  "result": {
    "task": {
      "id": "4d677626…",
      "contextId": "d0afccd2…",
      "status": { "state": "TASK_STATE_COMPLETED" },
      "artifacts": [{ "parts": [{ "text": "I can answer general questions." }] }]
    }
  }
}
```

**Multi-turn.** Each reply is a completed task. To continue the conversation, send the next message with the same `contextId` in the message. Copilot Studio callers do this for you.

## Key takeaways

- The MCP and A2A channels turn every GitHub Copilot harness agent into a reusable service: **standard agents use it as an MCP tool**, and **other GitHub Copilot harness agents use it as an A2A peer**, across environments.
- **MCP makes your agent a tool. A2A makes it a peer.** In the same environment, connected agents skip the channels entirely.
- The setup is four things: an Early environment with credits, a published agent, an app registration for the caller, and one OAuth connection.
- Every call runs as the signed-in user, hooks still fire, and consumption lands in the called agent's environment.
- After that, the calling agent decides when to delegate, based on the description and skills you give it. Spend time on those, because they're your routing logic now.

Which of your production agents would you plug a new GitHub Copilot harness agent into first? Let us know in the comments.
