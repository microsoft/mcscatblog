---
layout: post
title: "Agents and Workflows in Copilot Studio: Three Integration Patterns"
date: 2026-06-02
categories: [copilot-studio, architecture]
tags: [copilot-studio, workflows, agent-node, agent-flows, classify-node, human-review, architecture]
description: "Agents think. Workflows execute. Together they deliver more than either can alone — three patterns for pairing them in Copilot Studio, plus a decision matrix."
author: jpad5
image:
  path: /assets/posts/agents-workflows-integration-patterns/header.svg
  alt: "Agents and workflows in Copilot Studio: three integration patterns"
  no_bg: true
mermaid: false
published: true
---

You built an agent that handles expense questions beautifully in demos. Then a real user submits a 14-line report with two missing receipts and an out-of-policy meal, and your agent confidently posts it straight through to AP. By Monday morning, finance has questions.

The fix isn't a smarter prompt. It's deciding, *deliberately*, which decisions belong to the agent and which belong to a workflow. Get that line right and the rest of the architecture mostly designs itself.

The question I keep getting: *when do I use a workflow, when do I use an agent, and how do I combine them without things going sideways?* There are really only three patterns. This post walks all three, gives you a decision matrix, and ends with a concrete expense-report example. For implementation gotchas and workarounds — same wiring underneath, same surprises — see the [companion post on gotchas, errors, and patterns]({% post_url 2026-04-17-combining-agent-flows-and-agents-gotchas-errors-and-patterns %}).

> **Who this is for.** Process owners, makers, and fusion teams who already build automations in Power Platform and want to add agents without losing control of the process; architects deciding whether a workload even needs an agent in front of it. The framing is *workflow-first, agent-second*, because that's where most enterprise teams start. A full production blueprint (environments, ALM, monitoring, runbooks) is its own beast, and that's a follow-up post.
{: .prompt-info }

---

Here's what's covered:

| # | Topic | Quick summary |
|---|---|---|
| [1](#1-core-principle-the-llm-boundary) | The LLM Boundary | Where reasoning ends and<br>deterministic execution begins |
| [2](#2-two-patterns-one-architecture) | Two Patterns,<br>One Architecture | Workflows that use agents vs.<br>agents that use workflows |
| [3](#3-pattern-1-reasoning-in-the-loop-workflow-calls-agent) | Pattern 1: **Reasoning-in-the-Loop**<br>(workflow calls agent) | Deterministic orchestration<br>with embedded intelligence |
| [4](#4-pattern-2-conversation-first-automation-agent-calls-workflow) | Pattern 2: **Conversation-First Automation**<br>(agent calls workflow) | Conversational front end<br>backed by reliable automation |
| [5](#5-pattern-3-fire-and-follow-up-async-continuation) | Pattern 3: **Fire-and-Follow-up**<br>(async continuation) | When work won't finish<br>inside a chat turn |
| [6](#6-combining-patterns) | Combining Patterns | How real solutions stack<br>the three patterns |
| [7](#7-decision-framework) | Decision Framework | Picking the right pattern<br>under real constraints |
| [8](#8-scenario-walkthrough-expense-report-processing) | Scenario Walkthrough | End-to-end expense report<br>with explicit contracts |

---

## 1. Core principle: the LLM boundary

Before getting into the patterns, anchor on one principle. Everything else in this post depends on it:

> **Let the agent reason about intent, context, and language. Let the workflow own deterministic execution, integration, validation, and auditability.**
{: .prompt-tip }

That's the **LLM boundary**: the line between "model decides" and "code executes." Putting it in the wrong place is the single biggest reason solutions look great in a demo and fall over in production.

> **Anti-pattern: The Mega-Prompt.** A single 800-line agent instruction trying to be the router, the validator, the policy engine, *and* the conversation. I've watched these score perfectly in pilot and unravel in week two, when the second department onboards and the instructions can't accommodate both teams' edge cases. The fix is almost never "add more instructions." It's moving the deterministic parts out of the prompt and into a workflow.
{: .prompt-warning }

Workflows plus agents give you a clean way to draw this line on purpose, not by accident. And the way you draw it in code is by **defining contracts at every boundary crossing**: agent → workflow, workflow → agent node, async callback → agent. Treat each one like an API. We'll come back to this in every pattern below.

> Defining contracts means deciding ahead of time what fields cross each boundary, with what types, and what values are allowed. If you've ever debugged a workflow because the LLM "almost" returned valid JSON, you know why this matters.
{: .prompt-info }

---

## 2. Two patterns, one architecture

Microsoft describes [two canonical patterns](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/automate-business-processes-with-agents-plus-workflows-in-microsoft-copilot-studio/) for combining agents and workflows in Copilot Studio (plus an async continuation that layers on top of either, which we'll call out as Pattern 3):

1. **Workflows that call agents**, where the workflow is the orchestrator and the agent handles reasoning steps.
2. **Agents that call workflows**, where the agent is the conversational front end and the workflow handles structured execution.

Both enforce the same LLM boundary. They just start from different entry points. There's also a third pattern, **async continuation**, that you'll layer on top whenever a step doesn't fit inside a chat turn.

> **A note on "workflow."** Copilot Studio now has two flow formats that live side-by-side on the **Workflows** page: **agent flows** (GA, the original designer) and **workflows** (public preview, a revamped designer with native AI actions, agent handoffs, and node-level testing). Both share the same underlying runtime, and the patterns below apply to either. I'll use *workflow* as a generic term throughout, and the screenshots are from the new Workflows designer.
{: .prompt-info }

To make these easier to refer to throughout the rest of the post (and in design conversations with your team), I'm giving each one a short name:

| Pattern | Short name | One-line mental model |
|---|---|---|
| Pattern 1:<br>Workflow calls agent | **Reasoning-in-the-Loop** | The workflow drives,<br>the agent thinks |
| Pattern 2:<br>Agent calls workflow | **Conversation-First Automation** | The agent fronts,<br>the workflow executes |
| Pattern 3:<br>Async continuation | **Fire-and-Follow-up** | Respond fast,<br>complete later |

From here on I'll use the short names alongside the pattern numbers.

### How a workflow starts: triggers and identity

Before we walk through the patterns, one foundational choice that shows up in all of them: the **trigger**. The trigger you pick is the *first* LLM-boundary crossing in your architecture, and it decides what identity the rest of the workflow runs as. The trigger picker surfaces four types:

![The Workflows trigger picker, showing Manual (run on demand), Recurrence (run on a schedule), Connector (trigger from an external service), and When a HTTP request is received.](/assets/posts/agents-workflows-integration-patterns/workflows-trigger-picker.png){: .shadow w="500" h="420" }
_Trigger choices in the Workflows designer._

How each one maps to the patterns:

- **Manual:** on-demand runs. Mostly useful for testing and one-off ops scripts.
- **Recurrence:** scheduled runs. Pairs naturally with **Pattern 1** for batch reasoning jobs (think "nightly policy review of yesterday's expense reports").
- **Connector:** fires from an external service event ("when a new email arrives," "when a row is updated"). The canonical trigger for event-driven **Pattern 1** workflows.
- **HTTP request:** webhook-style. This is the inbound side of the **Pattern 3 (Fire-and-Follow-up)** callback channel: your async worker posts back here with the final result.

A fifth trigger, the **agent-call trigger**, powers **Pattern 2 (Conversation-First Automation)**. You won't see it in the generic picker above; it's wired in for you when you create a workflow as an agent tool.

> **Trigger choice picks identity.** Manual runs as the invoking user, Recurrence runs as the workflow owner, Connector/HTTP runs as the configured connection, and agent-call runs as the conversation user. Match the trigger to the identity you actually want crossing the first boundary; this is one of the easiest things to get wrong, and one of the hardest to debug after the fact.
{: .prompt-tip }

---

## 3. Pattern 1: Reasoning-in-the-Loop (workflow calls agent)

**Use this when the process is primary.** The workflow owns sequence, branching, approvals, and system calls. At points that need *judgment* (document interpretation, exception classification, summarization), the workflow hands off to an agent.

Here's the pattern on a canvas. A *Support Email Triage* workflow uses a Classify node to route incoming mail to one of several agent nodes, with the LLM boundary visible at a glance:

![A Support Email Triage workflow: a Classify node routes incoming emails to one of five agent nodes based on category.](/assets/posts/agents-workflows-integration-patterns/workflows-designer-support-triage.png){: .shadow w="1240" h="800" }
_Classify on the left is deterministic routing; the agent nodes are reasoning; the reply actions are deterministic execution._

This is enabled by the [**agent node**](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-node-workflow): the workflow pauses, the agent reasons, the workflow resumes with the result.

### What the agent node can actually do

It's more than a "call an LLM" step. You can:

- **Use an existing published agent** or **create an inline agent** scoped to the workflow, with instructions, tools, knowledge, and output all configured in place.
- **Attach tools** (MCP servers and connectors) so the agent can take action, not just reason.
- **Ground the agent in knowledge** (SharePoint, public websites) so it answers from your content.
- **Choose the output shape**: free-form text, structured output with named fields, or a custom JSON schema that downstream steps can branch on.
- **Enable human assistance**, so the agent can escalate to a person when it isn't confident enough to act alone.

See the [agent node documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-node-workflow) for the full setup walkthrough.

### Which agents you can call

There are actually two node choices in this pattern, each calling something different:

- **Agent node**: calls a Copilot Studio custom agent (existing published agent or inline agent in the node).
- **Microsoft 365 Copilot node**: calls Microsoft 365 Copilot directly, or a targeted Microsoft 365 agent (for example, Researcher, Analyst, or an Agent Builder agent).

**Quick rule of thumb:**

- Reach for the **Microsoft 365 Copilot node** when you need grounding in the connected user's M365 context (mail, files, calendar, chats) or a built-in M365 agent.
- Reach for the **agent node** when you need an automation-specific agent with custom instructions, tools, knowledge, and output contracts defined for that workflow.

### How the call actually works

Add the node, pick or build the agent, map workflow variables in, define structured output. The workflow waits on the response and continues. For work that won't fit in a chat turn, jump to Pattern 3. Don't try to fake async here.

A few things that'll save you pain:

- **Treat agent input/output as an API contract**, not a free-text prompt. This is the single highest-leverage habit in Reasoning-in-the-Loop.
- **Pick deterministic branch fields** in your output. Include things like `status`, `confidence`, and a `reason_code` so downstream steps don't have to parse prose.
- **Know which identity the agent node runs as.** The agent node inherits the workflow's run identity, which is whatever the trigger established (see §2 above). For Pattern 2 that's the conversation user; for a Recurrence-triggered batch job it's the workflow owner. Either way, if that identity doesn't have access to the referenced agent, the node fails at runtime. Helpful for least privilege, surprising when you don't expect it. Details in the [release plan](https://learn.microsoft.com/power-platform/release-plan/2026wave1/microsoft-copilot-studio/invoke-agents-as-workflow-steps-agent-node).
- **Budget latency end-to-end.** Reasoning time *plus* downstream actions has to fit inside the synchronous limit; if it doesn't, jump straight to Pattern 3 (Fire-and-Follow-up).

> **A word on `Prefer async`.** It's a routing *hint* to the orchestrator, not a hard switch. It doesn't turn a blocking node into a non-blocking one and it doesn't remove synchronous limits. For long-running work, design Pattern 3 explicitly. Don't rely on `Prefer async` to save you.
{: .prompt-warning }

### When to reach for this pattern

- Most of the process is rule-based and sequential.
- One or a few steps need reasoning, classification, or summarization.
- You need the automation to be auditable and deterministic everywhere it can be.
- The "AI part" doesn't need a conversation. It just processes input and returns a result.

**Real example:** an expense workflow uses an agent to classify line items against policy and flag exceptions (we'll build this in section 8).

### Where this pattern stops fitting

- The interaction has too many conversational turns and starts feeling unnatural in a workflow-first UX.
- Multiple agent nodes pile up cumulative latency that threatens the synchronous time budget.
- The reasoning needs shared context across many process boundaries; an agent-first surface is cleaner.

---

## 4. Pattern 2: Conversation-First Automation (agent calls workflow)

**Use this when the conversation is primary.** The agent is the user interface: it understands language, gathers context, and decides what to do next. When it needs to do something deterministic (update a record, trigger approval, generate a document), it calls a workflow as a tool.

This is often the starting point for teams: agent as front door, workflow as the reliable execution layer behind it. If you've already got [child or connected agents]({% post_url 2025-09-20-copilot-studio-child-connected-agents-inputs-outputs %}) wired up, this pattern slots in next to them.

### How it's wired

You can add workflows to an agent two ways:

- **Build a new workflow** using natural language directly inside Copilot Studio.
- **Add a pre-existing workflow** from your library and tell the agent when to use it.

The orchestrator picks the right workflow based on conversation context. The workflow runs deterministically, returns a result, and the agent keeps the conversation moving.

### When to reach for this pattern

- The user interaction is open-ended or conversational.
- The agent needs to decide *which* process to invoke from context.
- You want to reuse the same workflow across multiple agents.
- The automation steps need consistent execution regardless of how the user phrases the request.

**Real example:** an IT help desk agent diagnoses an issue conversationally, then calls a workflow to create the ticket, assign it, and notify the team.

### Where this pattern stops fitting

- The agent starts over-orchestrating and bypassing the deterministic contracts you set up.
- Tool selection becomes noisy because workflows are too broad or insufficiently scoped.
- You're hitting high-throughput workloads that need predictable call counts and strict latency budgets.

> **Anti-pattern: The 47-Tool Agent.** Every workflow in the org gets attached as a tool "just in case the agent needs it." Now orchestration is a coin flip: the agent picks the wrong tool, the right tool with the wrong arguments, or freezes deciding. Rule of thumb: if a single agent has more than about 8 tools, you probably need a second agent (or a connected/child agent) rather than a longer tool list.
{: .prompt-warning }

---

## 5. Pattern 3: Fire-and-Follow-up (async continuation)

Sometimes the work just won't fit inside the synchronous conversational window. Multi-day approvals, a human-in-the-loop wait, an external batch job, you name it. That's where Fire-and-Follow-up comes in, and it's a *layer* you add on top of Reasoning-in-the-Loop or Conversation-First Automation, not a replacement for either.

### The core idea

Split execution into two phases:

1. **Fast synchronous phase** that acknowledges the request and returns within the synchronous budget.
2. **Long asynchronous phase** that continues outside the synchronous path and calls the agent back with final results.

### Wiring the callback

The part most people get wrong isn't the *fire*. It's the *follow-up*. Here's the minimum you need end-to-end:

1. **Outbound (synchronous) workflow.** Triggered by **When an agent calls the flow**. It validates, kicks off the long work (Service Bus message, queue insert, durable function, whatever), and returns within a couple of seconds with `status: "accepted"`, a `tracking_id`, and an optional `eta_hint`. The agent acknowledges to the user ("I've submitted your expense report, I'll let you know when it's reviewed") and the conversation moves on.
2. **Async worker.** Lives outside Copilot Studio (Logic App, durable Function, partner system, human approver) and does the long work. It carries `tracking_id` and `System.Conversation.Id` through end-to-end. They're your only way back to the right user.
3. **Inbound (callback) workflow.** A *second* workflow with a **When a HTTP request is received** trigger. Your async worker posts the final payload here. Inside, the flow uses the **Microsoft Copilot Studio** connector's **Execute Agent** action with `System.Conversation.Id` to push the result back into the conversation, even if the original user is no longer actively chatting.

<details>
<summary>Sample synchronous acknowledgement and async callback payloads</summary>
<pre><code class="language-json">// Synchronous acknowledgement (outbound workflow → agent)
{
  "status": "accepted",
  "tracking_id": "EXP-2026-04188",
  "eta_hint": "~10 minutes"
}

// Async callback (worker → inbound HTTP-trigger workflow)
{
  "tracking_id": "EXP-2026-04188",
  "conversation_id": "8a3f…",
  "outcome": "approved",
  "summary": "Approved $612.40 across 14 line items. 1 item flagged for receipt follow-up.",
  "idempotency_key": "EXP-2026-04188:v1"
}
</code></pre>
</details>

> **Idempotency is non-negotiable.** Async workers retry. If your callback workflow doesn't dedupe on `idempotency_key` (or `tracking_id` + a version), you *will* eventually post the same approval twice. Cheap to add up front, painful to retrofit.
{: .prompt-warning }

> **Anti-pattern: Fire-and-Forget.** The outbound workflow kicks off the work and the agent says "all done!" because nobody wired the callback. Users find out it didn't actually finish only when they ask again hours later. Always design both halves before you ship the synchronous side.
{: .prompt-warning }

> **Designing for async** comes down to three things: a clean split point at the synchronous boundary, a stable acknowledgement payload (`status`, `tracking_id`, `eta_hint`), and idempotency on the callback so a retry doesn't double-process. Keep `System.Conversation.Id` plus your business request ID flowing end to end.
{: .prompt-tip }

### Where this pattern stops fitting

- You require strict transactional continuity across sync and async phases.
- The callback channel isn't available or isn't permitted by environment policy.
- End-user expectations require immediate completion rather than deferred fulfillment.

---

## 6. Combining patterns

Most real solutions don't use just one pattern. They combine Conversation-First Automation with Reasoning-in-the-Loop, then layer Fire-and-Follow-up on top wherever something runs long.

Here's how it usually looks:

1. A user interacts with an **agent** conversationally (Conversation-First Automation surface).
2. The agent calls a **workflow** to execute a structured process.
3. Inside that workflow, an **agent node** handles a reasoning step (Reasoning-in-the-Loop).
4. The workflow finishes and returns the result to the original agent.
5. The agent summarizes the outcome to the user.

Each layer keeps a clear job: conversation handles ambiguity, automation handles execution, embedded reasoning handles judgment.

Same three patterns, stacked. You'll see frameworks online proposing half a dozen more. You don't need them. Section 8 walks an end-to-end expense scenario that uses this exact layering.

> Keep your synchronous execution under the [100-second synchronous limit](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-flow-create). If embedded reasoning *plus* downstream actions exceed the budget, that segment needs Fire-and-Follow-up (Pattern 3). This is the single most common reason "it worked yesterday" stops working today.
{: .prompt-warning }

---

## 7. Decision framework

**Start here: do you even need an agent?**

The fastest win in this whole framework is recognizing the cases where the answer is *no*. If your process has well-defined inputs, doesn't need natural-language understanding, and your users are happy clicking a button or filling a form, **a plain workflow is the right answer**. Adding an agent in front of it adds latency, cost, and a new failure mode (the orchestrator picks the wrong tool) for no real upside. "We have an AI strategy" is not a reason to put an LLM in the request path.

Reach for one of the three patterns below only when at least one of these is true:

- The input is unstructured (free-form text, documents, images, voice).
- The user wants to *describe* what they need rather than navigate to it.
- Steps depend on judgment that's hard to encode in rules (policy interpretation, summarization, classification with fuzzy edges).
- The same backend process needs to serve multiple phrasings of the same intent.

If none of those apply, save yourself the architecture conversation and ship the workflow.

Match your need on the left to the pattern on the right; the per-pattern sections above carry the full reasoning.

| Need | Recommended pattern |
|---|---|
| Inject reasoning into a<br>deterministic process | **Pattern 1:**<br>**Reasoning-in-the-Loop** |
| Conversational UX with<br>reliable subprocess execution | **Pattern 2:**<br>**Conversation-First Automation** |
| Long-running approvals<br>or human waits | **Pattern 3:**<br>**Fire-and-Follow-up** |
| Reasoning grounded in<br>the caller's M365 context<br>(mail, files, calendar) | **Pattern 1 with**<br>**M365 Copilot node** |
| Fully deterministic,<br>no AI required | **Workflow only** |
| Retrieval and reasoning only,<br>no system writes,<br>answer fits in one turn | **Agent only** |

A few guardrails that apply across all patterns:

- Treat each workflow action exposed to an agent as an API contract, not an implementation detail.
- Keep tools narrowly scoped. Broad tools make orchestration ambiguous.
- Prefer explicit output schemas over free-form text for any downstream branching.
- Budget latency across every layer, not just the final workflow step.
- **Pick the trigger that gives you the identity you want.** Manual = invoking user, Recurrence = workflow owner, Connector/HTTP = connection identity, agent-call = conversation user. Pattern 3 typically pairs an agent-call or Connector trigger with an HTTP-request callback.

### Inline vs existing agent (Reasoning-in-the-Loop only)

When you embed an agent inside a workflow, you also pick *what kind*. Rule of thumb: **inline** when the agent is an *implementation detail* of one workflow (single solution, single owner, travels with the flow); **existing published** when the agent is a *reusable capability* shared across workflows, owned by another team, or also serving as a conversational surface (for example, in Teams).

### Agent node vs prompt node

Both let you add AI inside a workflow. They're built for different jobs:

| Capability | Agent node | Prompt node |
|---|---|---|
| Tool orchestration | MCP servers<br>and connectors | Code interpreter only |
| Knowledge sources | SharePoint, public<br>websites, and more | Dataverse only |
| Human review | Yes | No |
| Task complexity | Multi-turn reasoning<br>across tools and sources | Single-turn<br>text generation |

Reach for the **agent node** when the step needs reasoning, tool orchestration, or grounded knowledge. Reach for the **prompt node** when you just need the model to transform or generate text.

---

## 8. Scenario walkthrough: expense report processing

Time to make this concrete. Back to the expense report from the intro.

**The process:** Employees submit expense reports. The system needs to validate line items against company policy, flag exceptions, route approvals, and post to the accounting system.

### What the employee actually sees

Before the architecture, here's what changes from the user's seat, because that's what makes the case for any of this:

> **Employee:** Submit my March expenses.
>
> **Agent:** I see 14 line items totalling $612.40. Two of them are missing receipts: L3 (lunch, $42) and L7 (taxi, $38). Want to upload them now, or submit without and I'll flag them for review?
>
> **Employee:** Here's the lunch receipt. Submit the taxi without one.
>
> **Agent:** Got it. Submitted. I'll let you know once it's reviewed.
>
> *— a few minutes later —*
>
> **Agent:** Your March expenses are approved. $612.40 posted to AP. The taxi line is flagged for a receipt follow-up; HR will reach out.

What the *approver* gets, on the other end, is a single notification with the agent's risk write-up attached, not a 14-row spreadsheet to comb through. That's the business case: fewer approver clicks, fewer back-and-forth emails about missing receipts, and an audit trail that says exactly *which* policy each line was checked against and at what confidence.

### Architecture

Here's the whole thing on one canvas. The colors map to the LLM boundary: **blue** for conversation, **green** for deterministic execution, **amber** for embedded reasoning, **red** for human governance, **yellow** for the deterministic branch.

![Expense workflow architecture: conversation agent feeds a deterministic workflow with one embedded agent node for policy reasoning.](/assets/posts/agents-workflows-integration-patterns/expense-architecture.svg){: .shadow w="1240" h="960" }
_Pattern 2 wrapping Pattern 1, with a single amber agent node as the LLM boundary inside the deterministic workflow._

The diagram's built-in legend names the colors; here's what each one *means* for the architecture:

- **Blue (Agent layer):** everything that reasons about *user intent and language*. This is where the LLM is allowed to be flexible.
- **Green (Workflow steps):** deterministic execution. Same input, same output, every time. No surprises here.
- **Amber (Agent node):** the *one* place inside the deterministic workflow where you've deliberately invited reasoning back in. This is **Pattern 1 (Reasoning-in-the-Loop)** nested inside **Pattern 2 (Conversation-First Automation)**.
- **Red (Approvals):** human governance. Some decisions stay with people on purpose. The **Human review** node handles this directly, no extra connector wiring needed. If the out-of-the-box Approvals connector doesn't fit your approval shape (custom payloads, non-Teams reviewers, signed callbacks), see [Human in the loop with a custom connector]({% post_url 2026-05-20-human-in-the-loop-custom-connector %}) for a hand-rolled pattern that does.
- **Yellow (Branch):** the deterministic switch that consumes the agent node's structured output. Schema-first design is what makes this branch reliable. A **Classify** node consumes the agent's `risk_level` field directly, no nested `If/Else` to maintain.

If you can look at this diagram and immediately see *where AI is allowed to make decisions*, it's doing its job.

### Contract-first design

Define a strict output contract for the policy-checking agent node. This is what makes the downstream branch reliable:

```json
{
  "compliant": true,
  "risk_level": "low",
  "reason": "All line items map to approved categories and are within policy limits.",
  "violations": [],
  "confidence": 0.93
}
```

A non-compliant response uses the same shape, with `compliant: false`, a populated `violations[]` array (each entry naming the `line_item_id`, `rule`, and `details`), and a lower `confidence`. That's what the downstream branch keys off.

If contract validation fails or required fields go missing, route to a deterministic fallback branch:

1. Mark the request `REVIEW_REQUIRED`.
2. Attach raw agent node output for audit.
3. Notify the approver queue with the correlation ID.

> Include a `confidence` field on every structured output. When you wire your branches, *anything below your threshold goes to the fallback path*, regardless of what the model said. That single decision is what stops "the agent confidently posts garbage" from happening.
{: .prompt-tip }

---

## Key takeaways

- **Draw the LLM boundary first.** Architecture decides what prompts can't fix.
- **Three patterns cover it:** Reasoning-in-the-Loop, Conversation-First, Fire-and-Follow-up.
- **Contracts beat prose.** Schema-first outputs with a `confidence` field make branching reliable.
- **Default to deterministic.** Add reasoning only where judgment is genuinely required.
- **Make the boundary visible.** Put Classify, Human review, and Agent nodes on the canvas so reviewers can see exactly where the model is allowed to decide.

---

## Wrapping up

Most "AI agent" projects that quietly die in production don't fail because the model was bad. They fail because *nobody decided where the LLM stops and the workflow starts*. The prompts got longer, latency got worse, and someone shipped a deterministic alternative that worked on the first try.

The LLM boundary is a **design decision**. Place it deliberately, contract every crossing, and these three patterns will carry you further than any clever instruction block:

- **Reasoning-in-the-Loop (workflow calls agent):** workflow stays in control; agent handles only the judgment steps.
- **Conversation-First (agent calls workflow):** agent handles ambiguity; workflow handles execution.
- **Fire-and-Follow-up (async):** respond fast, complete slow. Essential past the synchronous budget.

Start small: one pattern, one workflow, one agent. Ship it, watch it, add the next piece only when a real user problem demands it.

For the messy stuff you'll hit wiring this together (schema drift, identity surprises, the *FlowActionBadRequest* you'll see at least once), see the [companion post on gotchas, errors, and patterns]({% post_url 2026-04-17-combining-agent-flows-and-agents-gotchas-errors-and-patterns %}). For multi-agent coordination, [Child and connected agents: inputs and outputs]({% post_url 2025-09-20-copilot-studio-child-connected-agents-inputs-outputs %}) is your next stop.

Now your turn: pull up the agent or workflow you're working on. Where's the LLM boundary, and is it where you'd draw it if you started over today? Drop a comment with the trickiest line-drawing call you've had to make.
