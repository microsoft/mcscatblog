---
layout: post
title: "Copilot Studio Skills: Procedural Memory and Just-in-Time Guidance"
date: 2026-06-08
categories: [copilot-studio, skills]
tags: [copilot-studio, skills, orchestration, testing, agent-development, mcp]
description: "An introduction to Copilot Studio Skills as reusable instructions that help enterprise agents load the right guidance, procedure, and tool-use context at the right moment."
author: roels
image:
  path: /assets/posts/copilot-studio-skills-procedural-memory/header.png
  alt: "Copilot Studio agent using skills as procedural memory"
mermaid: true
---

Enterprise agents rarely fail only because they lack facts. They fail because the organization has a specific way of doing the work, and that guidance is usually scattered across prompts, policy pages, tool descriptions, topic logic, and maker intuition.

Copilot Studio Skills give makers a dedicated place to package that procedure.

That is why Skills matter more than their simple shape suggests. The new Copilot Studio authoring experience is the visible change. The new orchestrator is the architectural change. Skills are the maker-facing building block that lets that orchestrator bring the right instructions into the conversation when a task needs them.

Not just what the agent should know.
Not just which tools it can call.
Not just what tone it should use.

Skills are where task-specific guidance can live until the agent actually needs it.

## The short version

A Copilot Studio Skill is an instructional asset based on the [Agent Skills open format](https://agentskills.io/), an open standard originally developed by Anthropic and covered well in this [overview](https://www.unite.ai/anthropic-opens-agent-skills-standard-continuing-its-pattern-of-building-industry-infrastructure/). It uses the `SKILL.md` pattern, with metadata and instructions that describe what the skill is for, when it should be used, and how the agent should approach the task.

In the current Copilot Studio experience, Skills are primarily **instructional and procedural**. They are not executable script bundles today. Script and executable asset support should not be assumed until it is officially available.
{: .prompt-info }

A Skill starts with metadata that helps the orchestrator decide when to use it, then adds the procedural instructions the agent should follow when that Skill is selected.

In Copilot Studio, makers work with Skills through the **Skills** tab in the builder experience. Today, that means two entry points: create a Skill from blank or upload a `SKILL.md` file. Once added, the Skill becomes part of the agent and is available to the orchestrator at runtime.

```mermaid
flowchart LR
    Maker[Maker] --> SkillsTab[Skills tab]
    SkillsTab --> Choice{Add a Skill}
    Choice -- Create from blank --> Blank[Write name, description, and instructions]
    Choice -- Upload --> Upload[Upload SKILL.md]
    Blank --> AgentSkill[Skill added to agent]
    Upload --> AgentSkill
    AgentSkill --> Runtime[Available to the orchestrator]
    Runtime --> Selected[Selected when relevant]
```

_In Copilot Studio, Skills are added through the builder experience. The authoring entry point is simple, but the metadata and instructions still matter because they influence when the orchestrator selects the Skill._

Here is the same idea in two forms: what a maker writes in the builder, and what an uploaded `SKILL.md` could contain.

### Builder view: the pieces that matter

![Copilot Studio Add skill dialog showing the Create from blank experience](/assets/posts/copilot-studio-skills-procedural-memory/add-skill-create-from-blank.png){: .shadow }
_The Create from blank experience in Copilot Studio asks for the same core pieces: name, description, and instructions._

### Upload a skill: collapsible example SKILL.MD

For upload, the file must start with YAML front matter. In Copilot Studio, keep the front matter focused on the required `name` and `description` fields. Put ownership, versioning, source policy, and other governance notes in the body of the Skill.

<details>
<summary><strong>Expand the example SKILL.md file</strong></summary>
<pre><code class="language-markdown">---
name: hr-leave-eligibility-triage
description: |-
  Use this skill when an employee asks about leave eligibility, leave policy,
  or what information HR needs to assess a leave request.
---

## Overview

Use this procedure to help employees understand what information is needed for a leave-related question.

## Ownership and versioning

- **Owner**: HR Operations
- **Skill version**: 1.0.0
- **Last reviewed**: 2026-06-08
- **Source policy**: Global Leave Policy v4.2

## Procedure

1. Identify the employee's country or region.
2. Identify the leave type.
3. Ask for employee type if needed.
4. Check the relevant policy knowledge source.
5. Do not make legal or final HR determinations.
6. Escalate exceptions, personal cases, and unclear eligibility questions to HR.

## Output format

- What we can confirm
- What information is still needed
- Recommended next step

## Guardrails

- Do not provide legal advice.
- Do not make a final HR determination for personal cases.
- Escalate exceptions, unclear eligibility questions, and sensitive employee situations to HR.
</code></pre>
</details>

That is not a tool. It is not a topic. It is not a knowledge source.

It is a reusable procedure.

## Why procedural memory matters

There are different kinds of knowledge an agent needs.

Some knowledge is factual: a policy, a product page, an invoice, a customer record. Copilot Studio already has strong patterns for grounding answers in knowledge sources and connected data.

Some knowledge is conversational: how the agent should introduce itself, what tone it should use, what topics it can handle, and where it should hand off.

Some knowledge is operational: which tools, actions, flows, connectors, or MCP servers are available to the agent.

Skills address a different layer: **procedural knowledge**.

That is why I use the phrase procedural memory. It is a metaphor, not a new Copilot Studio object. Factual knowledge tells the agent what is true. Procedural memory tells the agent how to do the work when a certain kind of task appears.

Procedural knowledge is the "how":

- How to triage a request.
- Which questions to ask first.
- Which policy to check before answering.
- When to call a tool.
- When not to call a tool.
- When to escalate.
- How to shape the final response.
- Which boundaries the agent must respect.

Humans use procedural memory all the time. A support specialist does not just know the refund policy; they know the sequence: check the purchase date, confirm the channel, inspect the exception rules, look for abuse signals, then decide whether to approve, deny, or escalate.

That sequence is not just a fact. It is a procedure.

Skills are a way to give that procedure to the agent without stuffing it into every prompt or every global instruction.

## The new orchestrator changes why this works

The new Copilot Studio experience is tied to a new orchestrator. The important concept is the agent loop.

At a high level, an agent loop works like this:

1. The user sends a message.
2. The model receives the conversation context.
3. The model decides whether it needs more context, a tool, a skill, or a final answer.
4. The orchestrator executes the requested step.
5. The result comes back into context.
6. The loop continues until the agent has enough information to respond.

```mermaid
flowchart TB
    User[User message] --> Context[Conversation context]
    Context --> Model[Model reasons over the task]
    Model --> Decision{Need more before answering?}

    Decision -- Use a Skill --> Skill[Select relevant Skill]
    Skill --> Procedure[Apply procedural instructions]
    Procedure --> Work[Ask, retrieve, or call tools]

    Decision -- Use knowledge or tools --> Work
    Work --> Result[Result returned to context]
    Result --> Context

    Decision -- Ready to answer --> Response[Final response]
```

_The new orchestrator runs the loop: the model reasons, the orchestrator executes the requested step, the result returns to context, and the loop continues until the agent is ready to answer._

That loop is what makes Skills useful. The agent does not need every procedure loaded all the time. The orchestrator can select the relevant skill based on the skill name, description, and instructions, then bring that procedure into context when the task calls for it.

Think of it as moving from:

> "Put everything the agent might ever need into the system instructions."

to:

> "Give the agent a library of task-specific procedures and let the orchestrator bring in the right one at the right time."

That is a big difference for maintainability.

## Copilot Studio Skills and coding-agent skills are related, but not identical

If you have used skills in coding agents, the idea will feel familiar: package instructions so the agent can load the right guidance only when it is relevant.

The important difference is the degree of freedom. Coding-agent skills often live close to a developer's local environment. They may include repository conventions, helper scripts, command patterns, file templates, or automation that assumes the agent can inspect files, run commands, and change code.

Copilot Studio Skills are more constrained. They are added through the Copilot Studio authoring experience, scoped to the agent, and used by the orchestrator as part of that agent's runtime behavior. In the current experience, treat them as reusable instructions, not arbitrary executable bundles.

In a coding agent, a skill might say, "Run this script and patch this module." In Copilot Studio, a Skill is closer to, "When this kind of user task appears, load this guidance so the agent asks the right questions and uses available knowledge and tools correctly."

## Where Skills fit in Copilot Studio

Skills sit between knowledge and actions.

They do not replace either.

Knowledge sources tell the agent what information is available. Actions, flows, connectors, and [MCP servers](https://microsoft.github.io/mcscatblog/posts/hello-world-mcp-copilot-studio/) tell the agent what it can do. Skills tell the agent how to approach a class of work.

For example:

- A knowledge source may contain the leave policy.
- A flow may create an HR case.
- A skill tells the agent which clarifying questions to ask, when to check the policy, when to create the case, and when to avoid making a final determination.

A Skill can instruct the orchestrator to use available tools, actions, flows, connectors, or MCP servers. But a Skill does not grant capabilities by itself. If the agent does not already have access to the tool, the Skill cannot magically call it.

Good mental model:

> MCP and tools provide reach. Knowledge provides facts. Skills provide the operating procedure: both the business procedure and the tool-use procedure.

## When to use a Skill

Use a Skill when the agent needs task-specific guidance that should not live in the global instructions all the time.

That includes procedural knowledge, but not only procedural knowledge.

Good Skill candidates include:

- **Business procedure**: the task has a repeatable sequence, such as triage, eligibility checks, exception handling, or escalation.
- **Tool-use procedure**: the agent has the right tool, but needs guidance on when to call it, which parameters matter, and what to do with the result.
- **Context economy**: the instructions are important for some conversations, but irrelevant noise for most conversations.
- **Scenario-specific output format**: a particular task needs a specific response structure, such as an incident intake summary, a refund decision explanation, or a readiness checklist.
- **Governance and boundaries**: the scenario has approvals, compliance constraints, privacy limits, or handoff rules that the agent must follow.

The output-format point is easy to overuse. If every answer from the agent should follow the same format, put that in the agent's general instructions. If only one class of work needs a particular structure, put that structure in the Skill for that class of work.

## Skills can also improve tool-use success

Procedural knowledge is not only business procedure. It can also be technical procedure.

That matters when an agent has access to powerful tools, actions, flows, connectors, or MCP servers. A tool may be available to the agent, but availability does not guarantee the agent will call it well.

For example, an MCP server may expose tools that search customer records, create tickets, retrieve documents, or update structured data. The model still needs to know:

- which tool to use for which scenario
- which parameters are required
- how to shape the query
- which fields to include
- what to validate before calling the tool
- what to do if the tool returns no results
- when not to call the tool

A Skill can package those instructions. It does not grant access to the MCP server, but it can improve the quality and consistency of how the agent uses that MCP server.

This is where Skills become valuable for pro-code and maker teams working together. Pro-code teams can expose robust tools. Makers and subject matter experts can use Skills to describe the right operating procedure around those tools.

## When to avoid a Skill

Do not create a Skill just because you can describe a scenario. An agent should often be able to interact with a well-described tool without extra guidance. If the action, flow, connector, or MCP tool has a clear name, precise description, strong parameter names, and useful response shape, the orchestrator may already have enough signal.

Before creating a Skill, ask:

1. Is this guidance needed only sometimes, or should it be global?
2. Is the failure caused by missing procedure, or by a poorly described tool or knowledge source?
3. Would a Skill make the agent more reliable, or duplicate instructions the agent can already infer?

This is where evals matter. Do not create one Skill for every eval scenario by default. Create a Skill when failures show a repeatable missing procedure or task-specific guidance that should be loaded on demand.

## Skills are part of the agent

In the current Copilot Studio experience, Skills are scoped to an agent.

There is a **Skills** tab in the authoring experience where makers can create a skill from blank or upload a skill file. Once added, the skill becomes part of that agent's configuration.

Skills are also solution-aware at the agent level. If you add a Skill to an agent and add that agent to a [Power Platform solution](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-solutions-overview), the Skill transfers with the agent. That is the right level of ALM framing for now: Skills move as part of the agent asset in the solution.

If you are already thinking about environment promotion, managed solutions, and production-safe deployment, the same foundation still applies. Skills do not remove the need for agent ALM; they become one more part of the agent asset you move through that lifecycle. For the broader foundation, see [ALM for Copilot Studio Agents: The Foundation](https://microsoft.github.io/mcscatblog/posts/alm-copilot-studio-agents-foundation/).

This is important because it keeps Skills close to the thing they influence: the agent's behavior.

It also means you should not think of Skills today as a tenant-wide skill marketplace or shared enterprise catalog. That may become an interesting pattern over time, but the current model is much simpler: a Skill belongs to an agent and travels with that agent.

## A simple architecture view

```mermaid
flowchart LR
    User[User asks a question] --> Orchestrator[Copilot Studio orchestrator]

    subgraph Agent[Agent configuration]
        Instructions[Global instructions]
        SkillIndex[Skill names and descriptions]
        Knowledge[Knowledge sources]
        Tools[Actions, flows, connectors, MCP tools]
    end

    Orchestrator --> Instructions
    Orchestrator --> SkillIndex
    SkillIndex --> Decision{Relevant skill?}

    Decision -- No --> Knowledge
    Decision -- Yes --> Skill[Load matching Skill instructions]
    Skill --> Procedure[Apply procedure]
    Procedure --> Tools
    Procedure --> Knowledge

    Tools --> Response[Grounded answer or action]
    Knowledge --> Response
```

_The orchestrator does not need every procedure in context all the time. It can use skill metadata to select the relevant procedure, then combine that guidance with knowledge and tools._

The point is not that Skills are another place to put random instructions. The point is that Skills become a modular procedure layer that the orchestrator can select when the task requires it.

## Three examples that make Skills concrete

The easiest way to understand Skills is to look for repeatable work where the answer depends on a sequence: ask the right questions, check the right source, use the right tool, and stop or escalate at the right boundary.

Here are three examples. Each one uses Skills for procedure, not for raw knowledge or system access. **Select any example below to expand the full scenario.**

<details>
<summary><strong>Expand example 1:</strong> HR leave eligibility triage — collect context, check policy, and escalate exceptions before answering.</summary>

<p>Leave questions are rarely answered well by policy lookup alone. The agent may need country, leave type, worker type, whether the user is asking a general or personal question, and whether HR escalation is required.</p>

<p>A Skill can define that procedure: ask for missing context, check the right policy source, avoid legal or final HR determinations, and escalate exceptions. The value is not just retrieving the policy. The value is applying the right process before responding.</p>

</details>

<details>
<summary><strong>Expand example 2:</strong> Customer service refund and exception handling — apply policy windows, exception rules, and tool guidance before promising anything.</summary>

<p>Refund handling often depends on product, purchase date, channel, reason, policy window, exception rules, abuse signals, and whether order lookup is available.</p>

<p>A refund Skill can guide the sequence: when to use order lookup, when not to promise approval, when to escalate high-value exceptions, and how to write a customer-safe response. The Skill is not the refund tool. It is the playbook for using policy, context, and tools correctly.</p>

</details>

<details>
<summary><strong>Expand example 3:</strong> IT incident intake and routing — classify the issue, ask the right triage questions, and escalate risky cases.</summary>

<p>IT support often starts with classification: access, device health, network connectivity, application issue, data loss, or suspected compromise.</p>

<p>A Skill can ask the right triage questions, suggest safe self-service steps only for low-risk issues, create a ticket when the ITSM action is available, and escalate security-sensitive scenarios. This can reduce agent sprawl without turning one agent into a boundaryless mega-agent.</p>

</details>

## What makes a good Skill

A good Skill is specific.

The name and description are not just documentation for humans. They are orchestration signals. The orchestrator uses them to decide when the Skill is relevant.

Prefer names like:

```text
HR Leave Eligibility Triage
Customer Refund Exception Handling
IT Incident Intake and Routing
```

Avoid names like:

```text
HR Help
Support Stuff
IT Process
```

The description should explain when to use the Skill. If needed, it should also say when not to use it.

For example:

```text
Use this skill when an employee asks about leave eligibility, required leave documentation, or the next step for a leave request. Do not use it for payroll, benefits enrollment, or performance management questions.
```

That is better than:

```text
Helps with HR questions.
```

The first description gives the orchestrator a clear routing signal. The second one invites ambiguity.

## A practical starter checklist

When designing a Skill, start with these questions:

1. **What repeatable task is this Skill for?**  
   If you cannot describe the task clearly, the Skill will be vague.

2. **When should the Skill be used?**  
   Write the description like routing metadata, not marketing copy.

3. **When should it not be used?**  
   This helps avoid accidental invocation and overlapping Skills.

4. **What information must the agent collect first?**  
   List required clarifying questions.

5. **Which knowledge sources should be checked?**  
   Point the agent to the right type of grounding.

6. **Which tools may be used?**  
   Only reference tools, actions, flows, connectors, or MCP servers that the agent actually has.

7. **What are the escalation rules?**  
   Be explicit about exceptions, uncertainty, approvals, privacy, legal, or security boundaries.

8. **What should the final response look like?**  
   Define the expected structure so outputs are consistent.

9. **Who owns the procedure?**  
   Add owner and review information inside the Skill instructions if needed.

10. **How will you test it?**  
   Create evals that check both selection and outcome quality.

## Testing Skills with evals

Testing a Skill with [Copilot Studio evaluations](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro) is not only testing whether the final answer sounds good.

You need to test whether the Skill is selected at the right time and whether the agent follows the intended procedure after it is selected.

There are several layers worth testing:

| Eval area | What to check |
| --- | --- |
| Trigger precision | Does the Skill activate only when it should? |
| Trigger recall | Does it activate across different phrasings of the same task? |
| Non-trigger behavior | Does it stay out of the way for unrelated requests? |
| Procedure adherence | Does the agent ask required questions, follow the sequence, and respect boundaries? |
| Tool behavior | Does the agent only use available and appropriate tools? |
| Output quality | Is the response complete, grounded, formatted correctly, and appropriately caveated? |

For example, an HR leave Skill should trigger when the user asks, "What do I need to provide for parental leave in Germany?" It should not trigger when the user asks about updating their home address.

That is trigger precision.

It should also trigger for different phrasings of the same intent:

- "Am I eligible for parental leave?"
- "What documents do I need for leave?"
- "Can I take time off after my child is born?"

That is trigger recall.

Once selected, the Skill should guide behavior. If the procedure says the agent must ask for country or region before answering, your evals should check that it does not skip that step.

Add adversarial cases as well: user attempts to override the Skill, bypass escalation, force an unavailable tool, or make the agent ignore required checks. Skills are procedural instructions, so evals should prove the procedure is followed under pressure, not only in the happy path.
{: .prompt-warning }

For more on testing patterns, see [Closing the Loop: Automated Agent Improvement with Publish and Test]({% post_url 2026-03-29-agentic-improvement-loop %}), [Bulk File-Based Testing for Copilot Studio: Beyond Standard Evals](https://microsoft.github.io/mcscatblog/posts/bulk-file-testing-copilot-evals/), and [Quality Gates for Copilot Studio: Automated Evaluations in Azure DevOps](https://microsoft.github.io/mcscatblog/posts/copilot-studio-eval-gate-azure-devops/).

Testing tells you whether a Skill works. The next step is using failed scenarios to decide which Skills to create or improve.

## A practical workflow: build Skills from eval failures

The best way to create a useful Skill is often not to start with the Skill.

Start with the eval.

Before you decide what Skills an agent needs, write down the scenarios the agent must handle. Treat those eval scenarios as the working specification for the agent:

- What should the agent be able to do?
- What does a good answer look like?
- Which knowledge sources should it use?
- Which tools should it call?
- Which boundaries should it respect?
- What should count as failure?

That gives you a concrete target. You are not writing a Skill because the agent needs more instructions. You are writing a Skill because a scenario proves the agent needs a repeatable procedure.

Once the scenarios are clear, add the capabilities the agent needs: the right knowledge sources, the right tools, and precise descriptions for each of them. Those descriptions matter. They are not only documentation for makers; they are routing signals for the orchestrator. If the descriptions are vague, overlapping, or disconnected from the user language in your evals, the agent has less signal to select the right capability at the right moment.

Then run the evals.

For each failed scenario, inspect what happened. Did the agent miss the right knowledge source? Did it choose the wrong tool? Did it skip a required question? Did it answer before checking policy? Did it use the right capability but produce the wrong output structure?

This is where agent development becomes an eval loop.

```mermaid
flowchart LR
    Specs[Eval scenarios as specs] --> Capabilities[Add knowledge and tools]
    Capabilities --> Run[Run evals]
    Run --> Analyze[Analyze failures]
    Analyze --> Converse[Work through the right procedure]
    Converse --> Skill[Convert procedure into a Skill]
    Skill --> Upload[Upload Skill to agent]
    Upload --> Run
```

When a scenario fails, do not immediately add another paragraph to the agent instructions. Work through the scenario with the agent. Ask it to reason through what information it needed, which tools or knowledge sources should have been used, what sequence should have been followed, and what the final answer should have looked like.

When that conversation produces the right outcome, ask the agent to review the procedure and turn it into a focused Skill. That Skill should capture the reusable playbook:

1. When the Skill applies.
2. What information to collect first.
3. Which knowledge sources to check.
4. Which tools may be used.
5. Which decisions or approvals the agent must not make.
6. What the final response should include.
7. Which edge cases require escalation.

Then upload the Skill into the agent and rerun the evals.

This is the practical version of "hill climbing" on agent quality: create scenarios, measure the baseline, diagnose failures, extract the missing procedure, package it as a Skill, and measure again. Each Skill becomes a small piece of procedural memory that is justified by a real scenario, not by guesswork.

It also keeps the agent cleaner. Instead of turning the system prompt into a 400-line collection of accumulated business rules, keep the always-needed instructions short and move task-specific procedures into Skills. The agent can then pull the right procedure into context when the task needs it, without carrying every possible process in every conversation.

## Inspecting why a Skill was selected

Makers can inspect why a Skill was selected in the builder experience. The reasoning view shows how the agent reasoned through the request, whether a Skill was executed, why it was selected, and what output came back from that execution.

This is important because Skills introduce a new design surface: metadata quality. If a Skill fires too often, the description may be too broad. If it does not fire when expected, the description may be too narrow, too generic, or missing the language users actually use.

If you want to inspect the full conversation transcript, turn on user feedback under **Settings > Safety and access > Feedback**. After a conversation, submit feedback at the end of the chat. That feedback flow gives you a way to extract the conversation transcript for deeper analysis.

For more background on how the Copilot Studio orchestrator reasons through a request, see [Open the hood: Copilot Studio transcripts]({% post_url 2026-03-19-open-the-hood-copilot-studio-transcripts %}).

## Anti-patterns to avoid

### Do not use Skills as a dumping ground

If everything goes into a Skill, nothing is really a Skill.

Keep Skills focused on repeatable procedures. Do not copy entire policy manuals into them. Put factual reference material in knowledge sources and use the Skill to explain how to apply that knowledge.

### Do not create overlapping Skills with vague descriptions

If you create three Skills called "HR Help," "Employee Questions," and "Policy Support," the orchestrator has little signal to work with.

Skill descriptions should be precise enough that two reasonable makers would agree on when each Skill applies.

### Do not reference tools the agent does not have

A Skill can instruct an agent to use an action or flow, but it does not make that action or flow available.

If the Skill says "look up the order in Dynamics" and the agent has no order lookup tool, the instruction cannot be fulfilled.

### Do not treat Skills as a security bypass

Skills influence agent behavior. That makes them powerful, but it also means they need review.

Be especially careful with Skills copied from community sources, generated by AI, or reused from another environment. Review them for prompt injection, unsafe instructions, tool misuse, stale procedures, and hidden assumptions.

## Versioning and ownership

Skills should be treated as living procedural assets.

Even if your current process is lightweight, add enough metadata inside the Skill to know who owns it and when it changed.

Useful fields to include in the Skill body:

```markdown
## Ownership

- Owner: HR Operations
- Review cadence: Quarterly
- Last reviewed: 2026-06-08
- Source policy: Global Leave Policy v4.2
- Skill version: 1.0.0

## Change notes

- 1.0.0: Initial procedure for leave eligibility triage.
```

This is not about adding bureaucracy. It is about avoiding stale procedures.

Enterprise processes change. Policies change. Escalation paths change. Tool availability changes. If the Skill is procedural memory, then outdated Skills become outdated memory.

## Why this reduces agent sprawl

Before Skills, it was tempting to solve every complex process by creating another specialized agent.

One agent for HR leave.
One agent for HR benefits.
One agent for IT incidents.
One agent for device support.
One agent for refund handling.
One agent for order status.

Sometimes that separation is correct. Security boundaries, audience boundaries, and business ownership still matter.

But many times, the real need is not a new agent. The real need is a new procedure.

Skills make that distinction clearer.

If the same agent can serve the same audience, use the same knowledge boundary, and access the same toolset, then a Skill may be the better unit of modularity. You are not building another agent; you are teaching the existing agent another repeatable way of working.

That is the shift.

## From classic topics and flows to Skills and code-first development

Classic Copilot Studio agents often start with topics and flows. Topics are still useful for deterministic paths, explicit trigger phrases, or designed dialogs. Flows are still useful for business process automation.

Skills do not make topics or flows obsolete. They change where some of the guidance should live.

Instead of putting every variation into topic branching, or adding more global instructions each time the agent learns a new process, move repeatable task guidance into Skills. The agent can use orchestration to decide when that guidance is relevant, while still using topics for deterministic experiences and flows or actions for execution.

As agent development matures, more teams want agent assets to be reviewable, repeatable, and testable. Topics, actions, knowledge configuration, Skills, and eval scenarios should increasingly be treated as source-controlled assets. Code generation can help produce or update those assets; evals decide whether the generated behavior is good enough.

A practical transition path looks like this:

1. Keep existing topics and flows where deterministic routing or automation is still the right fit.
2. Identify instructions that only apply to specific classes of work.
3. Move those instructions into focused Skills instead of growing the global prompt.
4. Improve tool, action, and knowledge descriptions before assuming a Skill is needed.
5. Add eval scenarios that prove the right knowledge, tools, topics, flows, and Skills are selected.
6. Store the resulting assets in source control so changes can be reviewed like code.

The destination is a cleaner architecture: topics for designed conversations, tools and flows for capabilities, knowledge for facts, Skills for just-in-time guidance, and evals to prove the pieces work together.

## What to watch next

Skills are early, and the current implementation is intentionally focused. Watch the areas that turn Skills from a promising authoring feature into a mature enterprise building block: better authoring ergonomics, clearer trace visibility, stronger versioning patterns, richer package support, and deeper evaluation workflows.

Skills are not magic. They are not tools, knowledge sources, or a replacement for good agent design.

They are reusable instructions that the orchestrator can select when a task needs extra guidance: sometimes procedural knowledge, sometimes tool-use guidance, sometimes just context that should not live in the global prompt all the time.

That is why they matter. The next generation of Copilot Studio agents will be grounded in enterprise knowledge, connected to enterprise systems, and equipped with the right instructions at the right moment.
