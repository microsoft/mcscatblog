---
layout: post
title: "Combining Workflows with Agents: Gotchas, Errors, and Patterns"
date: 2026-04-17
categories: [copilot-studio, tutorial]
tags: [power-automate, agent-flows, workflows, troubleshooting, async-pattern, maker-credentials, approvals, flow-timeout]
description: "Best practices and common issues when deploying solutions that combine workflows with agents in Copilot Studio — timeouts, credentials, schema mismatches, collaboration, and more."
author: PetrosFeleskouras
image:
  path: /assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/header.png
  alt: Combining workflows and agents in Copilot Studio
mermaid: false
published: true
---

Workflows and agents are a powerful combination in Copilot Studio. Need to automate a multi-step business process while keeping a conversational front end? Workflows deliver the automation muscle, and your agent delivers the natural language interface. In theory, they complement each other perfectly.

In practice, you'll probably hit a few walls — and some of them are not obvious at all.

This guide covers the most common issues teams run into when deploying solutions that combine agents with workflows in Copilot Studio. Some of these are gotchas that'll have you scratching your head for hours the first time you see them. Others are architectural decisions you'll want to get right before you build too much on top of the wrong foundation.

Here's what's covered — jump to whichever section you need:

| # | Topic | Quick answer |
|---|-------|-------------|
| [1](#1-why-isnt-my-workflow-showing-up) | Workflow not showing up in the agent | Missing trigger/action, async toggle, or not in a Solution |
| [2](#2-the-100-second-wall-and-how-to-get-past-it) | 100-second timeout (`FlowActionTimedOut`) | Async continuation pattern — respond early, run long logic in background |
| [3](#3-keeping-your-schema-in-sync-flowactionbadrequest) | Schema mismatch (`FlowActionBadRequest`) | Refresh the workflow node; check for unsupported parameter types |
| [4](#4-running-workflow-actions-with-maker-credentials) | Workflow actions not using maker credentials | Update Connection References in Power Automate, not just the Copilot Studio setting |
| [5](#5-collaborating-on-agents-and-workflows) | Sharing a workflow with another maker | Add a co-owner directly in Power Automate |
| [6](#6-getting-images-out-of-a-workflow-and-into-the-chat-window) | Displaying images from a workflow in chat | Base64 inline for small images; cloud storage + link for larger ones |
| [7](#7-calling-an-agent-from-inside-a-workflow) | Calling an agent from inside a workflow | Use the "Add an agent" step in Power Automate |

---

## #1 Why isn't my workflow showing up?

Before troubleshooting anything else, make sure your workflow actually shows up as a tool in your agent. If it doesn't appear, you can't do anything else. Here are the main reasons it won't:

**Missing the right trigger or action.** For a workflow to appear as an agent tool, it needs two things: the **"When an agent calls the flow"** trigger at the start, and the **"Respond to the agent"** action at the end. Miss either one, and the workflow won't surface in the agent tool picker.

**Async response toggle is on.** Under the "Respond to the agent" action settings, there's an **Asynchronous response** toggle. It must be set to **Off**. If it's On, the workflow won't appear as a tool the agent can invoke synchronously.

**The flow lives outside a Solution.** Flows created directly in Power Automate and not placed inside a solution frequently fail to show up when called from an agent. Always create or move your workflow into a Solution before trying to use it in Copilot Studio.

**The workflow is not running under the Copilot Studio plan.** Make sure the workflow is set to run under the Copilot Studio plan, or it won't show up as an agent tool.

---

## #2 The 100-second wall (and how to get past it)

This is the one that catches teams most off guard. Agent-triggered workflows in Copilot Studio have a **hard synchronous response limit of 100 seconds**. If your workflow doesn't return a response to the agent within that window, you'll see a `FlowActionTimedOut` error.

> For the full list of Copilot Studio error codes, see the [official error codes reference](https://learn.microsoft.com/troubleshoot/power-platform/copilot-studio/authoring/error-codes).
{: .prompt-info }

For many workflows this is fine — a few API calls, some data transformations, a quick response. But two of the most powerful features of workflows are, by definition, incompatible with a 100-second limit:

- **Multistage and AI approvals** — a manager might approve in 2 minutes or 2 days.
- **Request information from humans in the loop** — same story. A human waits for no timer.

Both of these pause the workflow and wait for human input before continuing. That's exactly what makes them useful, and exactly why they'll always exceed 100 seconds when triggered synchronously from a chat window.

This means that today, there is no way to call "Run a multistage approval" or "Request for information" through a synchronous conversational experience. These features are only available in autonomous scenarios — unless you restructure your workflow with the async pattern described below.

### The async continuation pattern

The solution is elegant once you see it. The workflow is split into two phases — a fast synchronous part and a slow asynchronous part — with the agent freed up as soon as the first phase is done:

1. The agent triggers the workflow as a tool call.
2. The workflow handles any quick, short-running logic and responds back to the agent within the 100-second window.
3. The agent and the workflow now continue **independently**. The agent processes the quick response and carries on with its conversation. The workflow moves on to the long-running part — approvals, human-in-the-loop steps, whatever it needs.
4. When the long-running work is done, the workflow asynchronously invokes the agent again, passing the results as a payload.
5. The agent is triggered by the workflow, receives the results, and continues its execution from there.

Here's what the workflow looks like:

![Diagram showing an agent-invoked workflow split into a short-running synchronous phase and a long-running asynchronous phase, with the workflow invoking the agent again at the end](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/async-workflow-pattern-diagram.png){: .shadow w="650" }
_The workflow split into a fast synchronous phase (before "Respond to the agent") and a long-running asynchronous phase, ending with an "Execute Agent" callback_

The key ingredients:

- **Split at the "Respond to the agent" action.** Short-running logic goes before it (must complete within 100 seconds); long-running logic goes after it. Once the workflow responds, the agent is unblocked and both sides continue on their own.
- **Use the "Execute Agent" action** (from the Microsoft Copilot Studio connector) to asynchronously trigger the agent with the long-running results. This is a new, independent invocation — not a continuation of the original agent session.
- **Pass the Conversation ID.** When the agent first invokes the workflow, pass `System.Conversation.Id` as an input. When the workflow later calls "Execute Agent," use the same Conversation ID so the new agent session can be correlated with the original one — essential for tracing and a coherent user experience.
- **Update the agent instructions** to handle both the initial workflow invocation and the eventual asynchronous callback with results.


> **Expense approval example:** A user starts a claim through chat. The agent invokes the workflow, which immediately acknowledges the request and responds within 100 seconds. The agent tells the user their request is submitted and moves on. Meanwhile, the workflow sends an approval to the manager — which may arrive days later. Once the manager approves, the workflow asynchronously triggers the agent again with the outcome, and the agent resumes to deliver the news to the user.

> Express mode can speed up the synchronous portion of your workflow. See the [Express mode documentation](https://learn.microsoft.com/microsoft-copilot-studio/agent-flow-express-mode) for details.
{: .prompt-tip }

### Quick summary of your options

If you're dealing with a 100-second timeout, you have three paths:

1. **Optimize the flow** to finish under the limit — works for flows that are slow but not inherently long-running.
2. **Use the async continuation pattern** described above — the right approach for approvals and human-in-the-loop scenarios.
3. **Simplify the flow and move heavy processing outside the synchronous action call** — sometimes a redesign is the cleanest answer.

---

## #3 Keeping your schema in sync (FlowActionBadRequest)

`FlowActionBadRequest` is the most common runtime error you'll see when working with agent-triggered workflows. It almost always means there's a **schema mismatch** — the input or output parameters the agent expects don't match what the workflow actually provides.

The most common triggers:

- You modified the workflow's input or output parameters after already adding it to the agent, without refreshing the tool configuration in Copilot Studio.
- You're passing an unsupported variable type. Agent flows [natively support only **Text**, **Boolean**, and **Number**](https://learn.microsoft.com/microsoft-copilot-studio/advanced-flow-input-output). Passing a Table, Record, or complex object directly won't work without conversion.

### How to fix it

The most common fix is to refresh the flow in Copilot Studio:

1. Open the topic that contains the workflow action.
2. Select the **ellipsis (...)** on the Action node, then select **Refresh**.

![The Action node ellipsis menu in Copilot Studio with the Refresh option highlighted](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/refresh-workflow-node.png){: .shadow w="500" }
_Refreshing the workflow node to pull in the latest input/output schema_

3. Verify that the input and output parameters in Copilot Studio now match what's in the workflow.

If the error persists after refreshing, compare the actual values being passed from Copilot Studio against what the workflow expects:

![Input parameter values in Copilot Studio compared to workflow inputs — first view](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/compare-inputs-1.png){: .shadow w="350" }
_Reviewing input values on the agent side_

![Input parameter values in Copilot Studio compared to workflow inputs — second view](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/compare-inputs-2.png){: .shadow w="600" }
_Reviewing the corresponding input values in workflow_

Look for type mismatches (e.g., a number where a string is expected), missing required parameters, and extra parameters that no longer exist in the workflow.

> A quick way to spot the mismatch is to look at the run history in workflows. The failed run will show exactly what inputs it received — compare those against what you intended to send.
{: .prompt-tip }

---

## #4 Running workflow actions with maker credentials

When you add a workflow as a tool in an agent and want it to run with the maker's credentials, you'll find the setting quickly: go to the tool configuration, expand **Credentials**, and set it to **Maker-provided credentials**.

![Workflow tool configuration showing the Credentials to use setting set to Maker-provided credentials](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/maker-credentials-setting.png){: .shadow w="500" }
_Setting Maker-provided credentials on the workflow tool in Copilot Studio_

Done, right?

Not quite.

Changing the credentials setting on agent side affects how the agent invokes the workflow, but it doesn't change how the actions *inside* the workflow authenticate. Each action in the workflow uses its own **Connection Reference**, and those are separate from the agent tool configuration.

To make the actions inside the workflow actually run with maker credentials, you need to **update the Connection References in the workflow itself** to use the maker's connections.

![Connection References configuration showing maker connections assigned to each connector](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/connection-references-maker.png){: .shadow w="500" }
_Updating Connection References to use the maker's own connections_

---

## #5 Collaborating on agents and workflows

Here's something that trips up teams once they start working in a shared environment: sharing and collaboration behavior is different for agents versus workflows.

**Sharing an agent with editor permissions does also share the workflows it uses.** If you add another maker as an editor of the agent in Copilot Studio, they'll get access to the associated workflows as well. No extra steps needed for that scenario.

**Sharing just a workflow is a different story — and it comes with a useful benefit.** This isn't currently possible directly from Copilot Studio. To share a workflow with another maker independently, you need to:

1. Go to [make.powerautomate.com](https://make.powerautomate.com).
2. Find the workflow in question.
3. Open the flow's settings and add the other maker as a **co-owner**.

![Power Automate flow settings showing the co-owners configuration panel with a maker being added](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/workflow-co-owners.png){: .shadow w="700" }
_Adding a co-owner to a workflow directly in Power Automate_

The benefit of this approach is **scoped access**: the co-owner gets full edit access to the workflow, but gains no access to the agent at all. This is useful when you want a maker to own and maintain the automation logic without exposing the agent's configuration, instructions, or other tools to them.

---

## #6 Getting images out of a workflow and into the chat window

When your workflow generates or retrieves an image and you want to display it in the agent's chat window, you have two options depending on the image size and your setup.

For the reverse scenario — passing files from the user to a workflow — check out [Tutorial: Passing Files from Copilot Studio to Agent Flows, Connectors and Tools]({% post_url 2025-10-15-copilot-studio-passing-files-flows-connectors %}).

### Option 1: Return as Base64 and display inline

Have the workflow output the image as a Base64-encoded string via the "Respond to the agent" action. Configure a Text output parameter and set its value to the Base64 representation of the file.

![The Respond to the agent action configured with a Text output containing the Base64-encoded image content](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/respond-with-base64.png){: .shadow w="700" }
_Returning the Base64-encoded image as a Text output from the workflow_

The agent receives the Base64 string (as `Topic.Base64output`) and can display it inline in two ways:

**Send as a message.** Set a variable to the following Power Fx expression and send it as a message:

```text
$"<img src='data:image/png;base64,{Topic.Base64output}'/>"
```

![Workflow configured to send a plain message containing a base64-encoded Data URI for the image](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/send-message-data-uri.png){: .shadow w="700" }
_Sending a simple message with an inline image_

**Send as a message with a Basic card.** Use the following Power Fx expression as the image URL in the Basic card:

```text
"data:image/png;base64," & Topic.Base64output
```

![Workflow configured to send a Basic card with a base64-encoded Data URI for the image](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/basic-card-data-uri.png){: .shadow w="700" }
_Sending a Basic card with an inline image_

### Option 2: Store in cloud storage and return a link (recommended for large images)

Base64 encoding inflates file size by roughly 33%, and embedding large Base64 strings in responses adds overhead. For larger images, a better approach is:

1. Store the generated image in cloud storage — Azure Blob, SharePoint, or a Dataverse File column all work well.
2. Create an access link: use a public or SAS (Shared Access Signature) URL for Azure Blob Storage, a sharing link for SharePoint, or an authenticated API endpoint (or proxy) for Dataverse.
3. Return that URL to the agent and render the image via HTTPS.

This keeps your response payload small and gives you proper access control over the image.

> Both options work well for different scenarios. The Base64 approach is simpler to implement and requires no external storage setup. The cloud storage approach fits better when you're working with larger images or already have a storage layer in your solution.
{: .prompt-tip }

---

## #7 Calling an agent from inside a workflow

You have a deterministic workflow doing structured automation, and at one specific point you need AI reasoning. Rather than rebuilding the workflow as an agent or calling an external API, you can drop an agent node directly inside the workflow. The workflow stays fully in charge — the agent just handles the one step that needs it — so you don't give up the reliability and predictability of a structured flow.

This is a great pattern when:
- Most of your process is rule-based and reliable as a workflow
- There's one step that benefits from natural language understanding or generative reasoning
- You want to keep the automation deterministic everywhere it can be

If you've explored triggering agents from *outside* a workflow — say, from an HTTP call or an external system — check out [Triggering Copilot Studio Agents with HTTP Calls]({% post_url 2025-09-25-triggering-copilot-studio-http %}) for a different angle on the same idea.

### How to set it up

1. In your workflow, add a new step: [**Add an agent**](https://learn.microsoft.com/microsoft-copilot-studio/agent-node-workflow).
2. Select the Copilot Studio agent you want to invoke.
3. Provide the instructions or task the agent needs to fulfill. You can include context from earlier workflow steps and specify who the agent should contact if it needs clarification.
4. Add the rest of your workflow steps after the agent node.

When the workflow runs, execution reaches the agent node, hands off to the agent, waits for the result, and then continues with the next workflow step automatically. The agent does its reasoning, returns a structured output, and the workflow continues as if nothing unusual happened.

![A workflow with an agent node mid-sequence, showing the agent being invoked and its output used in subsequent workflow steps](/assets/posts/combining-workflows-and-agents-gotchas-errors-and-patterns/invoke-agent-from-workflow.png){: .shadow w="700" }
_An agent node inside a workflow — the workflow pauses, the agent reasons, the workflow continues with the result_

> This is different from the async continuation pattern in #2. Here, the *workflow* is calling the *agent* — the flow of control is inverted. The workflow waits for the agent response before continuing.
{: .prompt-info }

---

## Wrapping up

Workflows and agents unlock genuinely powerful automation patterns in Copilot Studio, but the integration has some sharp edges. A quick summary of what to watch for:

- **Can't see your flow?** Check for the agent trigger, the "Respond to agent" action, the async toggle, and whether it's in a Solution.
- **100-second timeout?** Restructure with the async continuation pattern — respond early, run long logic in the background, call back with "Execute Agent."
- **FlowActionBadRequest?** Refresh the workflow node in Copilot Studio and verify your parameter types are Text, Boolean, or Number.
- **Actions running as the wrong identity?** Update the Connection References in the Power Automate portal, not just the credentials setting in Copilot Studio.
- **Sharing a workflow independently?** Add a co-owner directly in Power Automate — they get workflow access without touching the agent.
- **Displaying images?** Return Base64 from the workflow and display inline, or store in cloud storage and return a link.
- **Need AI reasoning inside a workflow?** Use the "Add an agent" step to drop an agent node right into your flow.

Have you run into any of these in production? Which one took you the longest to figure out? Drop a comment below — especially if you've found a cleaner workaround than the ones above.
