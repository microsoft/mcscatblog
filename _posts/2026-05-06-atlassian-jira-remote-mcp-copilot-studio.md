---
layout: post
title: "Wiring Up the Atlassian Remote MCP Server in Copilot Studio (Skip Manual OAuth)"
date: 2026-05-06
categories: [copilot-studio, mcp]
tags: [mcp, atlassian, jira, oauth, dynamic-client-registration, authentication]
description: "The Atlassian Remote MCP server uses Dynamic Client Registration. If you try to wire it up with Manual OAuth in Copilot Studio you'll waste an afternoon. Use Dynamic discovery and you're done in five clicks."
author: hasharaf
---

I spent way longer than I'd like to admit getting Atlassian's Remote MCP server to talk to a Copilot Studio agent. The integration itself is dead simple — the issue is that the public docs (and a lot of well-meaning blog posts, including one I wrote a draft of last week) push you straight at **Manual OAuth 2.0**, and that path is a dead end for this particular MCP server.

Here's the short version: pick **Dynamic discovery** in the MCP wizard, paste the streamable endpoint, and let Copilot Studio handle the rest. That's it.

If you want the why, and a clean walkthrough that actually works in May 2026, keep reading.

## What's the Atlassian Remote MCP Server?

Atlassian ships a hosted MCP server at `https://mcp.atlassian.com/v1/sse` that exposes Jira and Confluence tools — JQL search, issue creation, page lookups, the usual suspects. It's a "Remote MCP" server, meaning you don't install anything; the server runs in Atlassian's cloud and you just point your client at the URL.

For Copilot Studio that's perfect: no Azure, no container, no custom connector. Just an MCP tool with an HTTPS endpoint.

The catch is the auth model.

## Why Manual OAuth Is the Wrong Answer

When you click **Add a tool → Model Context Protocol → New tool** in Copilot Studio, you get four authentication choices:

| Option | When to use it |
|---|---|
| None | Public servers, demos, anything without auth |
| API key | Servers that take a static bearer token |
| OAuth 2.0 | You have a pre-registered OAuth client (client ID, secret, fixed scopes) |
| Dynamic discovery | The server publishes its own OAuth metadata and supports Dynamic Client Registration |

Picking **OAuth 2.0** for Atlassian feels right. There *is* an OAuth flow. There *are* endpoints. The form is right there asking for them.

The problem is that Atlassian's MCP server doesn't have a static client to register against. Its OAuth flow is built on [RFC 7591 Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591) — every MCP client that connects creates its own ephemeral OAuth client at runtime by `POST`-ing to `/v1/register`. There is no client ID for you to paste into the Manual form, because the client doesn't exist until the handshake happens.

If you fill in the Manual OAuth form anyway with the discoverable endpoints:

- Authorization: `https://mcp.atlassian.com/v1/authorize`
- Token: `https://cf.mcp.atlassian.com/v1/token`

…you'll get past tool creation. You'll even hit the consent screen on Atlassian's side. But the connection will fail to refresh, the agent's tool calls will throw 401s on the second turn, and you'll spend an evening reading Fiddler traces wondering why a "successful" sign-in keeps logging you out. Ask me how I know.

## The Right Answer: Dynamic Discovery

**Dynamic discovery** in Copilot Studio is the option that knows how to do RFC 7591. You give it the MCP endpoint; it walks the well-known metadata, registers itself as a client on the fly, and stores the resulting credentials in the connection. From your perspective the form has exactly one auth-related decision: pick this radio button.

Here's the full setup, end to end.

### 1. Prep the agent

Create a new Copilot Studio agent (or pick an existing one). Nothing exotic — the default generative orchestration is fine. Make sure you're in an environment where you can create connections; this matters more than people realize, because the consent flow will land in the connections list of *that* environment.

### 2. Add the MCP tool

From the agent's **Tools** tab, choose **Add a tool → Model Context Protocol → New tool**. Fill in:

- **Server name:** `Atlassian` (or whatever you want — this is just a label)
- **Server description:** something like "Jira and Confluence via Atlassian's Remote MCP server"
- **Server URL:** `https://mcp.atlassian.com/v1/sse`
- **Authentication:** **Dynamic discovery**

![MCP tool configured with Dynamic discovery](/assets/posts/atlassian-jira-remote-mcp-copilot-studio/mcp-tool-dynamic-discovery.png){: .shadow w="700" }
_The only configuration that matters: the streamable endpoint and Dynamic discovery._

Click **Create**. Copilot Studio will spin for a few seconds while it discovers and registers, then drop you into the tool's detail view with the full list of Atlassian-provided tools (`getAccessibleAtlassianResources`, `searchJiraIssuesUsingJql`, `createJiraIssue`, the Confluence equivalents, etc.).

> If the tool list comes up empty, the discovery probably hit a transient 5xx on Atlassian's side. Refresh the tool detail page once and the list usually populates.
{: .prompt-tip }

### 3. Authorize from the test pane

Open the test pane and ask the agent something Jira-shaped, like:

> *"List the Jira sites I have access to."*

The orchestrator picks `getAccessibleAtlassianResources`, sees there's no connection yet, and surfaces a consent card. Click through it; you'll be bounced to Atlassian's standard OAuth consent screen.

![Atlassian consent screen](/assets/posts/atlassian-jira-remote-mcp-copilot-studio/atlassian-consent.png){: .shadow w="500" }
_The same consent UI you'd see authorizing any third-party Atlassian app — except the "app" here was registered ten seconds ago by Copilot Studio._

Accept, get redirected back, and ask the question again. This time you should see something like:

```json
{
  "cloudId": "51962754-33b5-4baa-a1b5-b70f5eadcd72",
  "url": "https://pplatform.atlassian.net",
  "name": "PPlatform"
}
```

Now run a JQL search to confirm tool calls actually work past auth:

> *"Find all open issues in my Jira site."*

You should get an HTTP 200 with a real (possibly empty) issue list:

![Successful JQL response](/assets/posts/atlassian-jira-remote-mcp-copilot-studio/jql-search-success.png){: .shadow w="700" }
_HTTP 200 from `searchJiraIssuesUsingJql` — empty `issues` array because the test project has no work items, but the call itself round-tripped end to end._

Empty array, `isLast: true`, no errors. That's the whole game.

### 4. Publish

Once the connection is healthy in test, publish the agent and add whatever channels you need. The connection moves with the agent — end users get prompted to consent the first time they trigger a Jira tool, and from then on it's transparent.

## Things That Bit Me

A handful of footguns, in case you're hitting them right now:

- **The connection lives in the environment, not the agent.** If you delete the connection from Power Platform admin (or someone with broader perms does it for "cleanup"), every agent in that environment using Atlassian MCP will silently start failing. The fix is one re-consent, but the failure is silent until a user complains.
- **Refresh tokens have a real expiry.** If your agent goes idle for a long time, the first call after the gap may need a re-consent. This isn't a bug, it's just OAuth.
- **`cloudId` is required for almost every Jira tool call.** The orchestrator usually figures this out by calling `getAccessibleAtlassianResources` first, but if you're authoring topics manually and calling tools directly, remember to thread that ID through.
- **Don't try to "save time" by reusing an Atlassian app registration you already have.** Even if you've built custom Jira integrations in the past with a real client ID and secret, those credentials are for the **REST API**, not the MCP server. The MCP server only does Dynamic Client Registration. Manual OAuth with old credentials will look like it works and then fail in subtle ways.

## When You'd Actually Use Manual OAuth

Just to close the loop: Manual OAuth in the MCP wizard is the right pick when you control the OAuth server (or the server's owner has handed you a client ID and secret to register against). For example, an internal MCP server fronted by your own Entra app registration. If the server uses Dynamic Client Registration, ignore Manual OAuth and let Dynamic discovery do its job.

## TL;DR

- Atlassian's Remote MCP server uses RFC 7591 Dynamic Client Registration.
- In Copilot Studio's MCP wizard, pick **Dynamic discovery**, not OAuth 2.0.
- Server URL: `https://mcp.atlassian.com/v1/sse`.
- Consent once from the test pane, verify with a JQL search, publish.

Five minutes, one radio button, and you're done. Wish I'd known that on Monday.
