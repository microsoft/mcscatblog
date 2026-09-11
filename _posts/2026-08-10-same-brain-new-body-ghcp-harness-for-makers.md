---
agent_edition: github-copilot
layout: post
title: "Same Brain, New Body? A Maker’s Guide to the GitHub Copilot Harness"
date: 2026-08-10
categories: [copilot-studio, agents]
tags: [copilot-studio, github-copilot, skills, orchestration, connected-agents, agent-development, best-practices]
description: "A design guide to the GitHub Copilot harness and the harness-engineering choices that help Copilot Studio makers turn agentic reasoning into dependable business outcomes."
author: jpad5
image:
  path: /assets/posts/same-brain-new-body-ghcp-harness-for-makers/header.png
  alt: "The GitHub Copilot harness gives Copilot Studio agents the runtime to plan, use tools, adapt, and deliver business outcomes"
---

<style>
  .content .table-wrapper:has(> table.maker-guide-table) {
    max-width: 100%;
    overflow-x: auto;
  }

  @media (min-width: 577px) {
    .content table.maker-guide-table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100%;
      table-layout: fixed;
    }

    .content table.maker-guide-table th,
    .content table.maker-guide-table td {
      min-width: 0;
      padding: 0.4rem 0.65rem;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: normal;
      hyphens: auto;
    }
  }
</style>

Picture the smartest new hire you've ever met. Brilliant reasoning, great with words, and ready to help. There is just one small problem: they arrive on day one with no laptop, no email, no file access, no tools, and no memory of yesterday.

On their own, they can think. They can't do much work.

That is the difference between a model and an agent. The model supplies reasoning. The **harness** supplies the operating environment that turns that reasoning into controlled action.

If you've built an agent in Microsoft Copilot Studio, you've been building on a harness all along. You just didn't have to spend much time thinking about it. Now Copilot Studio gives you a choice, including the [GitHub Copilot harness](https://learn.microsoft.com/microsoft-copilot-studio/harnesses-overview).

But this is not a brain transplant. Changing harnesses means redesigning the agent for a different operating environment, not moving the existing agent unchanged.

For makers, this is not back-end plumbing. Your choice of harness affects how you design the agent, how much of the journey you prescribe, what the agent can do out of the box, and how you prove that it completed the job correctly.

But choosing the harness is only the first decision. A capable runtime gives your agent potential. How you arrange the context, tools, constraints, approvals, and feedback around it determines whether that potential becomes dependable business performance.

That second part is **harness engineering**, and yes, it matters to low-code makers too.

## What harness means

Microsoft describes a harness as the runtime between what you design and the model doing the reasoning. It determines:

- What context reaches the model
- When the model is called
- Which tools and other capabilities are available
- How the model's response becomes an action
- How the agent handles state, files, and failures

The model still matters, of course. A stronger model can reason better. But the model does not decide which business system a user may access, whether a payment requires approval, where a customer preference should be stored, or what evidence proves that a case is complete.

Those are harness and solution-design decisions.

> **The model provides capability. The harness provides operating discipline.**
{: .prompt-info }

This is why swapping models does not automatically make an agent reliable. Reliability comes from the complete system surrounding the model: authoritative context, well-defined capabilities, enforceable boundaries, observable results, and a way to learn from failure.

## What is new about the GitHub Copilot harness?

The **standard harness** remains the dependable choice for rule-based agents and structured, repeatable conversations. You define topics, rules, prompts, and paths so well-understood requests behave predictably. The standard harness can use [generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) too, so this is not simply "old scripted agent versus new intelligent agent."

The **GitHub Copilot harness** uses a different authoring experience and an enhanced orchestration runtime for reasoning-heavy, multistep work. You give the agent a goal, its boundaries, the knowledge it can use, and the capabilities available to it. The harness can break the request into steps, select tools, adapt when the request changes, and try a different path when a step fails.

Here is the practical difference:

> With the standard harness, you often design the route. With the GitHub Copilot harness, you define the destination, guardrails, and available capabilities, then let the agent plan the route.
{: .prompt-info }

The documented capabilities include:

- Goal decomposition and multistep reasoning
- [Tools across connectors, REST APIs, MCP servers, and connected agents](https://learn.microsoft.com/microsoft-copilot-studio/agents-overview#benefits-of-agents)
- [Skills](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/skills-overview) for reusable procedures and specialized guidance
- [Memory](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/memory-overview) for context that should persist across interactions
- [Creating, editing, and reasoning over Word, Excel, PowerPoint, and PDF files](https://learn.microsoft.com/microsoft-copilot-studio/agents-overview#benefits-of-agents)
- [Secure sandbox execution governed through Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/harnesses-overview#choose-between-harnesses)

This is a runtime within Copilot Studio, powered by GitHub Copilot technology. It is not merely a connection between a Copilot Studio agent and the GitHub Copilot product developers use in an editor.

The shift is from **"follow these steps"** to **"achieve this outcome within these boundaries."**

### Three harnesses, not two

Copilot Studio also offers the [**Copilot chat harness**](https://learn.microsoft.com/microsoft-copilot-studio/microsoft-365-copilot-extend-with-agents), designed for extending Microsoft 365 Copilot Chat with your organization's knowledge.

| Choose this harness | When the work looks like this |
|---|---|
| **Standard harness** | A known conversation or process should follow predictable topics, rules, and paths. |
| **GitHub Copilot harness** | A goal requires reasoning across several steps, tools, files, or changing conditions. |
| **Copilot chat harness** | Employees need answers grounded in organizational knowledge inside Microsoft 365 Copilot Chat. |
{: .maker-guide-table }

The message here is fit-for-purpose, not "newest is best." A structured help-desk conversation might be exactly where the standard harness shines. A process involving several files, tools, exceptions, and judgment is where the GitHub Copilot harness earns a serious look.

## Why makers should care

"Harness engineering" sounds like something the pro-code team discusses while everyone else quietly checks their email. Bear with me for a second. The decisions it describes are already maker decisions.

Keep supplier onboarding in mind as a running example. The outcome sounds simple, but the agent might need to read submitted forms, find the current policy, validate tax information, check for duplicates, request confirmation, and route an approval. That is exactly the kind of work where the surrounding system matters as much as the model.

### How much work the agent can complete

A reasoning-heavy process rarely follows one perfect path. A supplier form might arrive with a missing tax field. The current policy might contradict an older template. An approval might need to be rerouted because the usual approver is unavailable.

With a goal-oriented harness, the agent can reason across those in-between decisions instead of requiring you to draw every possible branch. That does not remove deterministic rules or human oversight. It reduces the routing logic you must encode just to handle ordinary variation.

### What comes with the runtime

File creation, Skills, memory, tool orchestration, and sandboxed task execution come with the GitHub Copilot harness. You are not expected to reproduce them with one enormous topic and a collection of hopeful variables.

A process that previously needed several topics, flows, and manual handoffs might now be expressed as a goal, a few well-defined capabilities, and explicit approval boundaries.

### Where maker effort moves

You spend less time drawing every route and more time answering questions such as:

- What does successful completion look like?
- Which information is authoritative?
- What is the agent allowed to do without asking?
- Which decisions require deterministic checks or human approval?
- What should happen when a tool fails or information is missing?
- What evidence tells us the agent did the job correctly?

That is harness engineering in maker language.

> Agents and workflows powered by the GitHub Copilot harness use Copilot Credits, including some building, testing, and evaluation activity. Standard-harness agents continue to use their existing licensing model. Check the [current billing guidance](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/billing-credit-overview) before choosing a harness for a high-volume scenario.
{: .prompt-warning }

## From a capable harness to a dependable agent

In this article, **harness engineering** means deliberately designing and improving the complete system surrounding the model. It is a working lens, not a formal Copilot Studio product discipline. [Microsoft Agent Framework describes an agent harness](https://learn.microsoft.com/agent-framework/agents/harness) as the scaffolding that surrounds a model with planning, context management, tools, memory, approvals, execution loops, and observability. Its public [Harness Agent samples](https://github.com/microsoft/agent-framework/tree/main/python/samples/02-agents/harness) show those components working together in complete agents.

Copilot Studio packages many of the same ideas into a maker-focused runtime rather than asking you to assemble them in code. The implementation is different, but the underlying lesson is the same: dependable agents require more than a capable model.

The key lesson is this: when an agent struggles, "try harder" is rarely a durable fix. Ask what is missing from the environment around it.

This does not mean every maker needs to become an engineer. It means treating the agent as a system rather than a prompt with accessories.

### Give the agent a map, not a manual

One harness-engineering lesson is especially useful in Copilot Studio: more context is not always better context.

If every policy, exception, tone rule, operating procedure, and troubleshooting note is placed in one instruction block, the agent has no useful sense of priority. Important constraints compete with situational details. The guidance also becomes difficult to maintain.

Keep the main instructions compact. Put searchable facts in knowledge. Put situational procedures in Skills. Give tools descriptions that explain exactly when and why they should be used.

When everything is important, nothing is.

### Enforce boundaries, allow freedom within them

Agentic reasoning is probabilistic. Authentication, authorization, required-field validation, approval thresholds, and regulatory rules should not depend on the model remembering a sentence in a prompt.

Use deterministic controls where the business requires certainty:

- Authentication and permissions limit which data and actions are available.
- Tool validation rejects malformed or incomplete input.
- Business rules enforce thresholds and prohibited actions.
- Approval gates keep people at consequential control points.
- Policies and data controls govern the complete solution.

Inside those boundaries, the harness can have freedom to plan, select an appropriate capability, and recover from ordinary variation.

### Turn failures into improvements

When the same mistake happens twice, do not merely correct the second conversation. Decide which part of the harness should change:

- Was an instruction unclear?
- Was relevant knowledge unavailable or difficult to retrieve?
- Did a tool have an ambiguous contract?
- Was a deterministic rule missing?
- Did the agent need a recovery path or escalation condition?
- Should the case become part of an evaluation set?

That feedback loop is how the agent becomes more dependable over time.

## What about the agent you already shipped?

Here is the important bit: you do not flip a switch on an existing agent.

You choose the harness when you create an agent. Microsoft documents that [agents cannot be transferred between the standard and GitHub Copilot harnesses](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/overview#availability). Existing standard-harness agents remain supported, and there is no prize for rebuilding one that already does its job well.

If an existing agent is a good candidate, create a new GitHub Copilot harness agent and redesign the experience around the outcomes that must survive.

Do **not** start with this checklist:

1. Turn every topic into a Skill.
2. Turn every variable into memory.
3. Copy every instruction.
4. Recreate every branch.

That is not migration. That is archaeology with YAML.

Your old design assumed you drew most of the route. The new design assumes the agent can plan from the design elements and boundaries you provide. Copying the old scaffolding one-for-one can make the new agent as rigid as the old one, only harder to understand.

Instead, start with the business outcome and place each responsibility in the smallest design element that makes it reliable and inspectable.

When you are ready to turn that redesign into something concrete, [New Harness, New Rules? CAT's Got You]({% post_url 2026-07-07-new-orchestrator-resources %}) brings together the technical deep-dive deck, a deployable sample, the migration plugin, and the CAT Agent Skills gallery.

## Think in design elements, not converted topics

| Design element | Its one job | Maker question |
|---|---|---|
| **Instructions** | What is always true | What role, tone, boundaries, and approval rules apply to every task? |
| **Knowledge** | Searchable facts | What authoritative content should the agent retrieve? |
| **Tools** | System actions | What can the agent read, create, update, send, or trigger? |
| **State placement** | Where progress belongs | What must remain available during the task, and which system should own it? |
| **Memory** | Persistent context | What appropriate context should be available in later interactions? |
| **Skills** | Situational procedures | What repeatable method should load only when this work appears? |
| **Connected agents** | Specialist domains | What responsibility needs separate expertise, permissions, and ownership? |
{: .maker-guide-table }

This is guidance, not a law of physics. Some scenarios could reasonably fit in more than one design element. The useful question is not "Where can I put this?" It is "Where will this be easiest to reason about, reuse, test, and govern?"

### Instructions: what must always be true

Instructions define the agent's role, scope, behavior, tone, and boundaries. Put guidance here when it should apply across the agent's work.

Good instruction:

> Ask the user to confirm the legal name, tax region, and payment terms before submitting a supplier record.

Poor instruction:

> To onboard a supplier, first read the form, then look up the policy, then call the validation tool, then...

The first statement is durable behavioral guidance. Enforce the confirmation requirement separately by configuring the submission tool or approval workflow to reject an unconfirmed request. The second statement is a procedure pretending to be a permanent rule.

### Knowledge: facts the agent should retrieve

Policies, product documentation, process references, and approved templates belong in knowledge. Do not paste a 20-page procurement policy into the instructions. Let the agent retrieve the relevant section when needed.

Treat approved knowledge as a source of truth, keep it current, and avoid connecting five overlapping versions of the same policy. Information that the agent cannot access during the task effectively does not exist to it. Information it cannot trust is not much better.

Knowledge tells the agent what is true. It should not quietly grant permission to perform an action.

### Tools: actions with contracts

Tools are how the agent gets work done: query Dataverse, create a record, send an email, invoke a flow, call an API, or use an MCP server.

Treat each tool as a contract. Its name and description should make its purpose clear. Its inputs and outputs should be well-defined. Its permissions should be no broader than necessary. Its failure behavior should tell the agent whether to retry, choose an alternative, request information, or escalate.

If you are deciding between MCP servers and connectors, [this maker's comparison]({% post_url 2026-01-29-compare-mcp-servers-pp-connectors %}) walks through the trade-offs.

### State and memory: make persistence intentional

Not everything that should survive the next step should survive the next conversation.

Decide where each kind of state belongs:

- **Current task state:** the plan, progress, and temporary values needed to finish the active request
- **Files:** documents and working artifacts produced or consumed during the task
- **Memory:** appropriate user context or preferences useful in later interactions
- **Business systems:** authoritative records such as supplier, invoice, or customer status
- **Audit records:** evidence of actions, approvals, exceptions, and outcomes

Memory is not a replacement for a system of record, and it is definitely not a drawer for every variable from every old topic.

### Skills: procedures for a situation

A Skill packages instructions, scripts, and resources for a particular kind of task. Think "how we review an international supplier" or "how we prepare a weekly status report," not "everything this agent might ever need to know."

Skills keep the main instructions focused while giving the harness a deeper playbook at the right moment.

For a closer look at how Skills load on demand, how to write their routing descriptions, and when to use them instead of permanent instructions, see [Agents Have Skills Now: Here's How They Work in Copilot Studio]({% post_url 2026-06-15-modern-mcs-agent-skills %}).

### Connected agents: actual specialist domains

Use a connected agent when a responsibility has its own domain, tools, instructions, security boundaries, or release lifecycle. Do not create another agent merely to hide a long prompt.

For example, an employee-services agent might delegate benefits questions to a benefits specialist and payroll corrections to a payroll specialist. That is a division of responsibility, not just a division of text.

## The maker's harness-engineering loop

A dependable agent is not assembled once and left alone. Makers operate a loop from business intent to evidence and back to improvement.

The design elements describe what you configure. The loop describes how you improve them.

![Seven-step harness-engineering feedback loop surrounding the GitHub Copilot harness](/assets/posts/same-brain-new-body-ghcp-harness-for-makers/harness-engineering-loop.png){: w="1800" h="1000" }
_The maker's harness-engineering loop turns agent capability into dependable business outcomes through boundaries, evidence, and continuous improvement._

Use the loop as a seven-step design framework.

### 1. Define the outcome

State what "done" means and what evidence proves it. "Help with supplier onboarding" is vague. "Prepare a valid supplier request, obtain confirmation, submit it for approval, and report the result" is testable.

### 2. Bound the work

Define permissions, prohibited actions, approval points, and escalation conditions. Keep humans at consequential control points and exceptions, not every routine step.

### 3. Engineer the context

Give the agent authoritative information progressively and when relevant. Remove duplicated or stale sources. Keep permanent instructions focused on what must always be true.

### 4. Design capabilities and state

Add only the tools, Skills, files, memory, and connected agents needed for the outcome. Define their contracts and decide where each piece of state belongs.

### 5. Design the agentic loop

Decide how the agent should plan, act, check results, adapt, and stop. Define when retry is appropriate, when an alternative is allowed, and when the agent must escalate.

### 6. Evaluate realistic work

Test more than the happy path:

- Normal requests
- Ambiguous requests
- Missing information
- Tool failures
- Conflicting policies
- Permission failures
- Consequential actions requiring approval

Evaluate the outcome and boundaries, not whether every response used your favorite wording.

### 7. Operate the feedback loop

Use [Preview](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/authoring-test-bot), [Evaluate](https://learn.microsoft.com/microsoft-copilot-studio/analytics-agent-evaluation-create), and [Monitor](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/analytics-overview) to convert real evidence into better instructions, knowledge, tools, constraints, and evaluation cases. Remove stale design elements before they become patterns the agent repeats.

## A practical design example: supplier onboarding

Suppose you already have a standard-harness supplier-onboarding agent with five topics:

1. Collect supplier details.
2. Look up the onboarding policy.
3. Validate tax and payment information.
4. Create the supplier record.
5. Email the requester when approval is complete.

The tempting move is to rebuild those topics as five Skills. Don't.

If you are starting from scratch, use the same framework without the conversion step: define the outcome, then design the context, capabilities, constraints, state, recovery, and evidence around it.

Start with the outcome and engineer the complete environment around it:

| Design area | Supplier-onboarding decision |
|---|---|
| **Outcome** | Prepare a compliant request, obtain confirmation, submit it for approval, and report the result. |
| **Context** | Current supplier policy, required-document guidance, submitted forms, and relevant account data. |
| **Capabilities** | File analysis, tax validation, supplier-record creation, approval initiation, and notification. |
| **Constraints** | Tool-enforced required fields, least-privilege access, duplicate checks, approval thresholds, and user confirmation. |
| **State** | Current request progress stays with the task; the supplier record belongs in the business system; approvals belong in the audit history. |
| **Recovery** | Request missing information, retry temporary failures, and escalate policy conflicts or unsupported tax cases. |
| **Evidence** | Validation result, user confirmation, created request ID, approval record, and final status. |
{: .maker-guide-table }

### Apply the design in Copilot Studio

Turn the design table into a maker workflow in Copilot Studio:

1. **Build:** In the [Build experience](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/build-overview), define the outcome and durable behavioral guidance in the instructions. Add the approved supplier policy as knowledge, configure only the tools, Skills, and connected agents needed for the process, and enforce consequential controls through tool validation, permissions, or approval workflows.
2. **Preview:** Use [Preview](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/authoring-test-bot) to run a normal supplier request, then repeat with missing documents, duplicate records, unavailable tools, and an approval threshold.
3. **Evaluate:** Create an [evaluation test set](https://learn.microsoft.com/microsoft-copilot-studio/analytics-agent-evaluation-create) from those scenarios. Check whether the agent produced the required evidence and respected confirmation and approval boundaries.
4. **Monitor:** After publishing, use [Monitor](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/analytics-overview) to inspect completed and failed tasks, then turn recurring failures into revised instructions, knowledge, tool contracts, or evaluation cases.

Notice what disappeared: the fixed routing between five topics. The harness can plan the sequence from the outcome and available design elements. Your job shifts from drawing every path to making each capability clear, bounded, and testable.

The Monitor experience provides task and activity evidence, while Copilot Credit consumption is available through product telemetry. Business outcome measures usually need to be derived from the supplier system, approval history, or other audit records. Begin with a small set:

- Completion rate
- Accuracy or validation pass rate
- Exception rate
- Human intervention rate
- Completion time

Metrics need context. A higher exception rate might expose a policy problem rather than an agent problem. The goal is not a dashboard full of numbers. It is enough evidence to decide what part of the harness should improve next.

## Same brain, new body?

The GitHub Copilot harness gives makers a more capable body for agentic work. Harness engineering is how you strengthen that body over time through better context, capabilities, constraints, evaluation, and feedback.

The model may provide the intelligence, but the engineered harness determines whether that intelligence consistently delivers a business outcome.

Keep the outcome, trusted knowledge, governed actions, and boundaries that matter. Leave behind routing that existed only because you had to draw every path yourself.

Which part of your current agent would benefit most from harness engineering: its context, its tools, its boundaries, or its feedback loop?
