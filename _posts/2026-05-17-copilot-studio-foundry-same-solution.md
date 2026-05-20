---
layout: post
title: "Copilot Studio + Foundry in the Same Solution: How to Wire Them Up"
date: 2026-05-17
categories: [copilot-studio, azure-ai-foundry]
tags: [mcp, orchestration, foundry, architecture, agents, a2a, custom-connectors]
description: "When Copilot Studio handles the channel and Foundry handles the hard part, here is what the wiring looks like: MCP bridge, generative orchestration prerequisite, Foundry Agent Service Threads/Runs, and the gotchas nobody documents."
author: emargot
published: true
image:
  path: /assets/posts/copilot-studio-foundry-same-solution/header.svg
  alt: Copilot Studio orchestrating an Azure AI Foundry specialist agent via MCP
---

People keep asking the wrong question. "Copilot Studio or Foundry?" is not always the choice. After enough enterprise projects you notice the more common answer is *both*: Copilot Studio owns the orchestration, the Power Platform surface, and the channel plumbing; Foundry owns the reasoning that outgrows what Copilot Studio can do natively. The official [multi-agent patterns guidance](https://learn.microsoft.com/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns) frames the same idea: MCP and A2A are complementary, not competing.

The strategic decision framework is one thing. This post is the other: what you actually build when the answer is both, and how you wire them together without creating a maintenance problem.

If you already have a Foundry agent and want the simplest possible path - no custom code, no infrastructure - the native **connected agent** option in Copilot Studio (currently in preview) gets you there in a few clicks: **Agents > Add an agent > Microsoft Foundry**, provide your project endpoint URL and Agent ID, and Copilot Studio handles the rest. That pattern is covered in [Connect a Microsoft Foundry agent in Copilot Studio]({% post_url 2025-12-16-connect-foundry-agents-in-copilotstudio %}) on this blog, and in the [official docs](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-foundry-agent).

This post covers the other case: when you want Copilot Studio to make a **stateless tool call** to Foundry - Copilot Studio orchestrates and synthesizes the output, Foundry is a worker that does one job and returns a result. That is the MCP pattern, and it is meaningfully different from the native connected-agent path where Foundry runs its own chain-of-thought and receives the full conversation history.

## When You Are Here

You are at this decision point when:

- A capability you need in Copilot Studio (complex multi-step reasoning, a fine-tuned domain model, Python-based computation) pushes past what Copilot Studio handles natively, and adding more topics or Power Automate flows is the wrong answer
- You already have a Foundry agent and want to surface it through Teams, M365 Copilot, or a web channel without rebuilding the conversation layer
- Your org has a clear ownership split: IT Pro manages the Copilot Studio orchestration and channel layer, AI team owns the Foundry workloads

## The Architecture

The pattern that works: Copilot Studio as orchestrator, Foundry as specialist worker. Copilot Studio handles the conversation, topics, channel auth, and Power Platform surface. Foundry handles heavy computation and returns a result. The seam is a single tool call.

<div style="margin: 2rem 0; overflow-x: auto;">
<img src="/assets/posts/copilot-studio-foundry-same-solution/diagram-architecture.svg" alt="Architecture diagram: Channels feed into Copilot Studio, which calls Azure AI Foundry via MCP" style="max-width:100%;height:auto;">
</div>

The clean boundary matters. Copilot Studio does not need to know what Foundry does internally. Foundry does not need to know where the conversation came from. Keeping that seam thin makes both sides easier to test, upgrade, and hand to different teams.

## The MCP Bridge

The most Copilot Studio-native way to connect is through an MCP connector. If you have followed the [five-minute MCP connector quickstart]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}), you know the shape: Copilot Studio adds an MCP server as a tool, the agent decides when to call it, the tool runs, the agent gets the result. The full extension model is documented in [Extend your agent with Model Context Protocol](https://learn.microsoft.com/microsoft-copilot-studio/agent-extend-action-mcp).

Two prerequisites that bite the first time:

> [Generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) must be turned on for your agent. Classic orchestration does not select MCP tools at runtime.
{: .prompt-warning }

> Copilot Studio currently supports the **Streamable HTTP** transport only. SSE was deprecated in August 2025 and removed - see the [transport notes in the MCP connection docs](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent).
{: .prompt-warning }

For a Foundry agent, the MCP server is a thin Azure Function that translates MCP into a Foundry Agent Service call:

1. Copilot Studio calls the MCP tool with structured parameters
2. The Function gets a Microsoft Entra token for `https://ai.azure.com`
3. It calls the [Foundry Agent Service](https://learn.microsoft.com/azure/foundry-classic/agents/quickstart) using the **Threads + Runs** pattern
4. The agent response is shaped into MCP format and returned to Copilot Studio

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";

// Foundry Agent Service project endpoint:
//   https://{account}.services.ai.azure.com/api/projects/{project}
const FOUNDRY_PROJECT = process.env.FOUNDRY_PROJECT_ENDPOINT!;
const AGENT_ID        = process.env.FOUNDRY_AGENT_ID!;
const API_VERSION     = "2025-05-01";

// Single endpoint handles all MCP JSON-RPC messages.
// Copilot Studio supports the Streamable HTTP transport only (SSE deprecated Aug 2025).
app.http("mcp", {
  methods: ["POST"],
  authLevel: "function",
  route: "mcp",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const msg = await req.json() as { id: string; method: string; params?: Record<string, unknown> };

    switch (msg.method) {

      case "initialize":
        return ok(msg.id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "foundry-bridge", version: "1.0.0" },
          capabilities: { tools: {} }
        });

      case "tools/list":
        return ok(msg.id, {
          tools: [{
            name: "analyze_contract",
            // Be specific. The Copilot Studio orchestrator uses this description to decide whether to call
            // the tool at runtime. Vague descriptions cause it to call Foundry on every message.
            description:
              "Analyzes a contract for obligations, risks, and key dates. " +
              "Use when the user asks to review a contract, check for risks, or extract clauses.",
            inputSchema: {
              type: "object",
              properties: {
                document_text:  { type: "string", description: "Full contract text" },
                analysis_type:  {
                  type: "string",
                  enum: ["obligations", "risks", "dates", "full"],
                  description: "What aspect to focus on"
                },
                user_id: {
                  type: "string",
                  description: "Authenticated Copilot Studio user. Pass explicitly; not threaded by MCP."
                }
              },
              required: ["document_text", "analysis_type"]
            }
          }]
        });

      case "tools/call": {
        const args = (msg.params!.arguments) as Record<string, string>;
        try {
          const text = await callFoundryAgent(args, ctx);
          return ok(msg.id, { content: [{ type: "text", text }] });
        } catch (err) {
          ctx.error("Foundry call failed", err);
          // Return a user-readable message - Copilot Studio surfaces this directly in the conversation.
          return ok(msg.id, {
            content: [{ type: "text", text: "Analysis unavailable. Please try again or contact support." }],
            isError: true
          });
        }
      }

      default:
        return { status: 400, jsonBody: { error: `Unknown method: ${msg.method}` } };
    }
  }
});

// Calls a Foundry Agent Service agent using the Threads + Runs pattern.
// See: https://learn.microsoft.com/azure/foundry-classic/agents/quickstart
async function callFoundryAgent(
  args: Record<string, string>,
  ctx: InvocationContext
): Promise<string> {
  const cred  = new DefaultAzureCredential();
  const token = (await cred.getToken("https://ai.azure.com/.default")).token;

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
    // Custom header forwarded to your Foundry agent for audit logging.
    "x-cs-user-id":  args.user_id ?? "anonymous"
  };

  // 1. Create a thread
  const thread = await fetch(
    `${FOUNDRY_PROJECT}/threads?api-version=${API_VERSION}`,
    { method: "POST", headers, body: "{}" }
  ).then(r => r.json()) as { id: string };

  // 2. Add the user message
  await fetch(
    `${FOUNDRY_PROJECT}/threads/${thread.id}/messages?api-version=${API_VERSION}`,
    { method: "POST", headers, body: JSON.stringify({
        role: "user",
        content: `${args.analysis_type}:\n\n${args.document_text}`
    })}
  );

  // 3. Run the thread against the agent and poll
  const run = await fetch(
    `${FOUNDRY_PROJECT}/threads/${thread.id}/runs?api-version=${API_VERSION}`,
    { method: "POST", headers, body: JSON.stringify({ assistant_id: AGENT_ID }) }
  ).then(r => r.json()) as { id: string; status: string };

  await pollUntilComplete(thread.id, run.id, headers);

  // 4. Retrieve the assistant response
  const messages = await fetch(
    `${FOUNDRY_PROJECT}/threads/${thread.id}/messages?api-version=${API_VERSION}`,
    { headers }
  ).then(r => r.json()) as { data: Array<{ role: string; content: Array<{ text: { value: string } }> }> };

  return messages.data.find(m => m.role === "assistant")!.content[0].text.value;
}

async function pollUntilComplete(
  threadId: string, runId: string, headers: Record<string, string>
): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const status = await fetch(
      `${FOUNDRY_PROJECT}/threads/${threadId}/runs/${runId}?api-version=${API_VERSION}`,
      { headers }
    ).then(r => r.json()) as { status: string };
    if (status.status === "completed") return;
    if (["failed", "cancelled", "expired"].includes(status.status)) {
      throw new Error(`Foundry run ${status.status}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error("Foundry run timed out after 15s");
}

function ok(id: string, result: unknown): HttpResponseInit {
  return { status: 200, jsonBody: { jsonrpc: "2.0", id, result } };
}
```

To register this in Copilot Studio: **Tools** > **Add a tool** > **Model Context Protocol**, paste your Azure Function URL (the route ending in `/api/mcp`), and follow the [onboarding wizard](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent). The wizard creates a custom connector for you with the required `x-ms-agentic-protocol: mcp-streamable-1.0` property set automatically. If you build the connector by hand instead (Power Apps > Custom connectors > Import OpenAPI), see the [Azure MCP Server sample](https://github.com/Azure-Samples/azmcp-copilot-studio-aca-mi/blob/main/custom-connector-swagger-example.yaml) for the OpenAPI definition. The full connection reference ALM pattern is covered in the [MCP quickstart post]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}).

> The Function uses `authLevel: "function"`, which requires an `x-functions-key` header. Copilot Studio handles this via the connection you create in the MCP wizard. Use OAuth 2.0 with Dynamic Client Registration discovery if your Function App is fronted by APIM and you want per-user delegated auth - see [OAuth options in the wizard docs](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent).
{: .prompt-tip }

## The Context Problem

Here is what does not cross the Copilot Studio/Foundry boundary when you use MCP.

<div style="margin: 2rem 0; overflow-x: auto;">
<img src="/assets/posts/copilot-studio-foundry-same-solution/diagram-context.svg" alt="Two-column diagram: what does not cross the Copilot Studio-Foundry boundary vs what to pass explicitly" style="max-width:100%;height:auto;">
</div>

**User identity** does not cross unless you pass it. Copilot Studio knows who the authenticated user is (if auth is configured), but the Foundry endpoint receives an anonymous call. Pass `user_id` as a tool parameter if Foundry needs it for personalization, filtering, or audit logging.

**Conversation history** is Copilot Studio's property. With MCP, Foundry gets a single tool call, not the transcript. If your Foundry agent needs prior context, summarize it in a `context_summary` parameter set earlier in the topic flow. (This is the main behavioral difference from A2A, where conversation history *is* passed by default - more on that below.)

**The Copilot Studio system prompt** stays in Copilot Studio. Foundry's deployment prompt is separate. If both layers share policy (tone, scope, prohibited topics), maintain it in both places or reference a shared document.

> Do not pass the full conversation transcript on every call. You will burn tokens and hit payload limits fast. Pass only what the Foundry task actually requires.
{: .prompt-warning }

## Gotchas

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| "Tool call failed" with no useful message | Foundry returned non-200 that the Function did not catch | Wrap the Foundry call in try/catch; return a human-readable `isError: true` MCP response |
| Tool never gets called even though it is added | [Generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) is off | Turn it on in the agent's **Overview** settings; MCP tools only work with generative orchestration |
| Latency spikes above 15s, or Copilot Studio tool times out | Two orchestrators in series plus a thread/poll loop on the Foundry side - Copilot Studio tool calls have their own execution ceiling (similar to the [100-second wall](https://learn.microsoft.com/microsoft-copilot-studio/advanced-flow-actions#asynchronous-flow-actions-using-the-continuation-pattern) on Power Automate actions) | Keep Foundry tasks narrow; for stateless single-turn analysis, prefer the simpler [hosted-agent endpoint](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent) (`/agents/{name}/endpoint/protocols/openai/responses`) over the Threads+Runs poll loop |
| Foundry response cut off mid-sentence | Copilot Studio context window overflowed on a large Foundry response | Instruct Foundry to return structured summaries, not full prose dumps |
| Agent calls Foundry on every user message | Tool description is too broad | Tighten the description with explicit trigger conditions ("Use when the user asks to review a contract...") - the orchestrator reads this verbatim |
| Works in DEV, breaks after solution import | Connection reference not mapped in target environment | After each pipeline deploy, map the connection reference per the [ALM guidance]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}) |

## The Other Patterns

MCP is the right default, but three alternatives are worth knowing. The official [MCP vs A2A comparison](https://learn.microsoft.com/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns#evaluating-mcp-and-a2a-in-agent-architectures) covers the trade-offs in detail.

| Pattern | Best for | Key difference vs MCP |
|---------|---------|-----------|
| **MCP connector** | AI-selected invocation; the tool description does the routing | This post's default |
| **[Connected agent - native Foundry](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-foundry-agent)** (preview) | No-code path; you want Foundry to run as an opaque sub-agent with its own orchestration and conversation history | Zero custom infrastructure. From the Copilot Studio UI: **Agents > Add an agent > Microsoft Foundry**, provide endpoint URL + Agent ID, Entra auth handled automatically. Foundry runs its own chain-of-thought; the full conversation contextId passes through. **Note**: only works with agents in the new Foundry portal - agents from the previous portal return a 404. Trade-off: Copilot Studio does not control Foundry's reasoning or filter its output. |
| **Custom connector** | Deterministic invocation where a topic always calls Foundry at step X | No dynamic tool selection; you author the call explicitly in a topic |
| **[A2A (Agent-to-Agent)](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-agent-to-agent)** | An *A2A-enabled* external agent that maintains its own conversation state | **A2A passes the full conversation history (contextId + chat history) automatically**, unlike MCP. Use when the external agent needs continuity, not one-off tool calls. Note: a Foundry Agent Service deployment does not expose an A2A endpoint by default - you wrap it (see the [Simple-A2A-Sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/extensibility/a2a/Simple-A2A-Sample) for the .NET pattern). Toggle off **Pass conversation history to this agent** for a thinner boundary. |

If you are connecting to another Copilot Studio agent rather than a Foundry one, see [Connect to an existing Copilot Studio agent](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-copilot-studio-agent) - it follows the same A2A model with conversation-history passing controllable per connection.

## Is This the Right Pattern?

Three questions before you commit:

1. **Does the capability genuinely belong in Foundry?** If complex retrieval is the need, a Power Automate flow, Copilot Studio knowledge source, or [Azure AI Search grounded Foundry tool](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/ai-search) often covers it. Fine-tuned models, Python-based agent tools, and multi-step agentic chains belong in Foundry.

2. **Is the team ready to maintain two systems?** The Copilot Studio/Foundry split only scales when two teams own the two layers. One person owning both adds overhead without adding capacity. In that case, keep everything in one tool.

3. **Can the seam stay thin?** If Foundry needs full conversation state to function, you do not have a clean MCP boundary - you have a dependency. That is the signal to switch to the native connected-agent path or A2A (where conversation history flows automatically) or to keep more of the logic in Copilot Studio.

## Resources

**Copilot Studio**

- [Extend your agent with Model Context Protocol](https://learn.microsoft.com/microsoft-copilot-studio/agent-extend-action-mcp) - the MCP integration overview
- [Connect your agent to an existing MCP server](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent) - the onboarding wizard
- [Add tools and resources from an MCP server](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-components-to-agent) - tool selection and configuration
- [Connect to a Microsoft Foundry agent (preview)](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-foundry-agent) - the no-code native path; start here if you don't need stateless tool-call semantics
- [Connect an agent over A2A](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-agent-to-agent) - the alternative when you need conversation history threading
- [Multi-agent patterns: MCP vs A2A](https://learn.microsoft.com/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns) - the official architecture guidance
- [Generative orchestration best practices](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) - why your tool descriptions matter
- [MCP troubleshooting](https://learn.microsoft.com/microsoft-copilot-studio/mcp-troubleshooting)

**Azure AI Foundry**

- [Foundry Agent Service quickstart (REST)](https://learn.microsoft.com/azure/foundry-classic/agents/quickstart) - the GA Threads + Runs pattern used in the code sample
- [Deploy a hosted agent](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent) - newer single-shot invocation (`/agents/{agent}/endpoint/protocols/openai/responses`); preview, but simpler for stateless tasks
- [Connect an Azure AI Search index to Foundry agents](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/ai-search) - grounding pattern for the specialist layer
- [Simple A2A sample (.NET)](https://github.com/microsoft/CopilotStudioSamples/tree/main/extensibility/a2a/Simple-A2A-Sample) - reference for wrapping an external agent with the A2A protocol if you choose that pattern

**Related CAT blog posts**

- [Five Minutes to Your First MCP Connector in Copilot Studio]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}) - the MCP setup pattern this post builds on
- [Connect a Microsoft Foundry agent in Copilot Studio]({% post_url 2025-12-16-connect-foundry-agents-in-copilotstudio %}) - video walkthrough of the native connected-agent path; start here before reaching for MCP
- [Combining Agent Flows with Agents: Gotchas, Errors, and Patterns]({% post_url 2026-04-17-combining-agent-flows-and-agents-gotchas-errors-and-patterns %}) - same multi-component mindset applied to agent flows

---

*Have you shipped a Copilot Studio + Foundry hybrid in production? What did the context-passing look like in your case, and what surprised you about the boundary? Drop it in the comments.*
