---
layout: post
agent_edition: github-copilot
title: "Hooks in Copilot Studio: Give Your Agent More Than Instructions"
date: 2026-10-01
categories: [copilot-studio, automation]
tags: [copilot-studio, hooks, github-copilot-harness, workflows, governance]
description: "Choose the right checkpoint for context, tool checks, and data protection. See runtime inputs and practical use cases for every hook."
author: PetrosFeleskouras
image:
  path: /assets/posts/hooks-in-copilot-studio/hooks-in-copilot-studio.png
  alt: "Abstract illustration of hooks as colorful checkpoints along an agent's run in Copilot Studio."
mermaid: false
---

> **Availability.** Hooks are currently available only in **First Release environments**. Access the experience through [copilotstudio.preview.microsoft.com](https://copilotstudio.preview.microsoft.com/).
{: .prompt-info }

A travel assistant can help an employee choose a flight. But choosing a flight, deciding whether it can be booked, and deciding what gets recorded about it are three different jobs.

The agent can compare options and explain trade-offs. A workflow can check the proposed fare against the approved budget. Another can remove unnecessary contact details before the request reaches an analytics log.

**Hooks give those workflows a predictable place to run.**

## #1 Start with the checkpoint

A hook connects an event in the agent's execution to a workflow. The runtime supplies inputs, runs the workflow, and applies its outputs. That might add context, replace information, or block a proposed tool call.

**The invocation is deterministic:** when the configured event occurs, the runtime invokes the hook. The model doesn't have to choose the workflow or remember an instruction to call it.

This leaves the agent free to reason about the task. Instructions and [skills](https://microsoft.github.io/mcscatblog/posts/modern-mcs-agent-skills/) guide that reasoning; hooks give your own logic a defined execution point.

> **Keep critical safeguards in the tool or underlying system too.** If a hook's workflow fails, times out, or returns an unreadable response, the agent continues as though the hook returned nothing.
{: .prompt-warning }

From **More options (...) > Hooks**, choose an event and select or create its workflow.

![The Add hook dialog for HR Buddy, with the event dropdown expanded](/assets/posts/hooks-in-copilot-studio/hr_buddy_hooks.png){: .shadow w="850" }
_The hook picker shows the points where a workflow can run._

The choices cover session start, incoming user prompts, tool calls, and errors. Choose the checkpoint that changes the outcome you care about.

## #2 Match the hook to the outcome

Hooks can prepare context, clarify a request, check an action, or shape a result. Each intervention serves a different purpose.

### Prepare HR Buddy with employee context

A **Start (pre-loop)** workflow can use `metadata.userAadObjectId` to find the employee's profile in an authorized HR system and return a few useful facts as `additionalContext`.

Here, the hook supplies **Greece**, **Full-time**, **Greek**, and **First month**. After the user says "Hi," HR Buddy replies in Greek and acknowledges the onboarding stage.

![HR Buddy's SessionStart trace showing employee context in additionalContext and a subsequent personalized response in Greek](/assets/posts/hooks-in-copilot-studio/HR_Buddy_SessionStart.png){: .shadow w="850" }
_Session-start context includes the employee's country, employment category, language, and onboarding stage._

Give HR Buddy the employee details that help it tailor its guidance — not the entire personnel record.

### Clarify company terminology before answering

An employee asks:

> "Can I carry my FlexBank hours into next year?"

A **User prompt submitted** workflow can look up approved company terms, preserve the original question, and append relevant definitions through `modifiedPrompt`. In this example, it adds: **"FlexBank: the organization's term for time off in lieu."**

![HR Buddy's UserPromptSubmitted trace highlighting the original FlexBank question and the modifiedPrompt containing a terminology clarification](/assets/posts/hooks-in-copilot-studio/HR_Buddy_UserPromptSubmitted.png){: .shadow w="850" }
_The hook keeps the original question and adds the approved meaning of FlexBank before the agent processes it._

If no term matches, leave the prompt unchanged. The hook clarifies the language; HR Buddy still needs the actual policy to answer whether carryover is allowed.

### Check the proposed action, not just the user's wording

Suppose the approved flight budget is $500, but the selected fare is $650. A pre-tool workflow can inspect the proposed booking arguments, retrieve the current budget, and return a denial before the booking tool runs.

That is stronger than putting "stay within budget" in the agent's instructions. It checks what the agent is actually about to submit, including the amount and currency, rather than a summary of the request.

The same approach fits refunds, restricted record updates, and maintenance freezes. A good refusal also gives the agent enough information to suggest an allowed next step.

### Transform the data at the point where it matters

A travel agent may need an email address to complete a booking. Its analytics log may need only the request category and outcome.

A pre-tool workflow can remove the email address from the **logging tool's inputs** without rewriting the whole conversation. For example:

> Before logging: "Please send the itinerary to alex@example.test."
>
> Stored text: "Please send the itinerary to [EMAIL]."

If the problem is instead a lookup returning too much information, use a **post-tool workflow** to shape the successful result before the model receives it. A booking lookup could return itinerary details without unnecessary passenger fields.

## #3 Use the inputs to make the decision

Hooks receive data the workflow can inspect and act on.

Every hook gets `event`, `timestamp`, and a `metadata` object containing:

- **Session:** `conversationId`.
- **User:** `userId`, `userAadObjectId`, and `userDisplayName`.
- **Channel:** `channel`.
- **Agent:** `agentId`, `agentName`, and `agentSchemaName`.

Some metadata fields can be empty, particularly when the user isn't signed in, so workflows should handle missing values explicitly.

The event adds the information needed for that checkpoint:

| Checkpoint | Inputs the workflow can use | Practical question |
|---|---|---|
| User prompt submitted | `prompt` | Should an abbreviation be expanded or sensitive text removed before processing? |
| Pre tool use | `toolName`, `parameters` | Is this the booking tool, and what fare is it about to submit? |
| Post tool use | `toolName`, `parameters`, `result` | Which fields from the successful result does the agent need? |
| After tool failure | `toolName`, `parameters`, `error` | What failed, and what guidance can help the agent respond? |
| Error outside a tool call | `error`, `errorContext`, `recoverable` | Where did processing fail, and is recovery appropriate? |

Session start uses the common inputs without additional event-specific ones. The `recoverable` value on Error is advisory, not a guarantee that retrying is safe.

A hook's workflow returns the outcome through its outputs. Context helps the agent reason; replacement values change what is passed onward; a pre-tool denial stops that proposed call.

## #4 More ways to use each hook

The same checkpoints can support very different business needs:

**Start (pre-loop).** Give a support agent the customer's open cases and service tier before the conversation gets going. Or load an active outage notice so an IT assistant knows about the problem without asking the user to explain it again.

**User prompt submitted.** Standardize known product codes or legacy department names before the agent processes a request. Preserve the user's meaning rather than rewriting it into a different task.

**Pre tool use.** Check recipients before sending confidential information outside the organization. For a bulk record update, deny the call if the required approval is missing or has expired.

**Post tool use.** Turn a verbose order lookup into a concise result containing status, delivery date, and tracking link. Or remove internal-only annotations from a successful response before the model sees it.

**After tool failure.** If a carrier lookup times out, record the failure and give the agent guidance for offering an alternative tracking route. If a connection has expired, help it explain the need to reconnect rather than repeatedly attempting the same action.

**Error.** When a processing failure outside a tool call is safe to retry, return `errorHandling` set to `retry` with a small `retryCount`. If recovery isn't appropriate, stop processing and provide a short, useful message instead of exposing diagnostic details.

These are workflow patterns to adapt to your own tools and policies.

## Wrapping up

Hooks are useful when you can name both the checkpoint and the outcome.

Start with one requirement, follow the data to the right hook, and verify the result where it matters. That is how a hook becomes part of a reliable process rather than just another instruction.

Which requirement in your agent would benefit most from a check at the right moment?
