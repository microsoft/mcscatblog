---
layout: post
agent_edition: github-copilot
title: "Is It the Platform or My Agent? Troubleshooting Microsoft Copilot Harness Agents in Copilot Studio"
date: 2026-12-07
categories: [copilot-studio, governance]
tags: [copilot-studio, monitoring, observability, power-platform, application-insights, agent-365, governance]
description: "Troubleshoot Microsoft Copilot harness agents by symptom. Makers investigate sessions, answers, and tool calls; admins investigate access, capacity, shared failures, and fleet activity."
author: jpad5
image:
  path: /assets/posts/troubleshoot-copilot-studio-harness-agents/header.svg
  alt: "Five monitoring layers for Microsoft Copilot harness agents and the people responsible for each."
---

“The claims agent is broken.” It still answers questions about policy, but when someone asks it to submit a claim, no claim number comes back. Should the maker change the instructions, or should the platform team investigate the submission service?

For Copilot Studio agents built with the **Microsoft Copilot harness**, those investigations start in different places. The maker can see what the agent tried to do in a session. The admin can see whether the same failure affects other agents, whether a limit was enforced, or whether there's a service incident. Start with what the user observed; switch owners when the evidence points outside your scope.

## Find your symptom
{: #symptoms }

| What are you seeing? | Start here |
|---|---|
| The agent answers questions, but one action fails or stalls. | [Maker: trace the failed action](#maker-tool) |
| The action ran, but the answer was wrong or the agent claimed success too soon. | [Maker: check the answer against the result](#maker-answer) |
| A session is missing, or credits look higher than expected after testing. | [Maker: reconcile sessions and credits](#maker-usage) |
| A user or group can't open the agent, or a request reports a capacity limit. | [Admin: distinguish access from enforcement](#admin-access) |
| Several agents or users started failing around the same time. | [Admin: check service health and shared dependencies](#admin-shared) |
| A success-rate alert fired, but individual sessions look healthy now. | [Admin: interpret the alert window](#admin-alert) |
| An agent appears idle, but its owner reports traffic. | [Admin: check fleet coverage](#admin-fleet) |
{: .monitoring-guide-table }

Prefer to read by role? Go to the [maker playbook](#maker), the [admin playbook](#admin), or the [incident handoff example](#handoff).

## Part 1: Maker playbook
{: #maker }

### The agent answers, but one action fails
{: #maker-tool }

Open the published agent in **Copilot Studio > Monitor**. On the **Sessions** card, select **See all**. Use the reported time and channel to locate the interaction. If the list offers a status filter, start with **Failed**, then check completed sessions too: the conversation can end normally even when the user didn't get a claim number. The [Monitor guide](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/analytics-overview) shows how to open the transcript and inspect tool calls.

Compare the affected session with one where the same action worked. For the claims agent, three observations lead to different next steps:

| What the session shows | What to investigate next |
|---|---|
| The agent answered with instructions for filing a claim. It never called the submission tool. | Check the tool description, agent instructions, and whether the user supplied the required information. |
| The agent called the submission tool, which returned an authentication error. | Record the tool name, time, and session ID. Ask the connection owner to check the identity used for that call. If other agents use the connection, follow the [shared-dependency path](#admin-shared). |
| The tool returned a claim number, but the agent didn't give it to the user. | Inspect the [response after the tool call](#maker-answer) before changing the connection. |
{: .monitoring-guide-table }

<style>
  .content table.monitoring-guide-table {
    width: 100%;
    table-layout: fixed;
  }
  .content .table-wrapper > table.monitoring-guide-table :is(th, td) {
    white-space: normal;
    overflow-wrap: anywhere;
  }
</style>

If the operation creates a record and its outcome is unclear, check the downstream system before retrying. A missing confirmation in chat doesn't mean the claim wasn't filed. For agents that call another agent, identify which side of the call returned the error; our [guide to calling harness agents from Copilot Studio]({% post_url 2026-11-12-call-ghcp-harness-agents-mcp-a2a %}) illustrates that boundary.

### The agent gives a wrong answer or reports success too soon
{: #maker-answer }

Start with the exact turn in the transcript. Write down what the user needed, what evidence was available to the agent, and what the response actually said. A thumbs-down helps you find a session worth reading; it doesn't tell you what to fix.

Suppose the submission tool returned “approval pending,” but the agent said “Your claim was approved.” The connection worked; the agent misreported the result. In a test environment, use a test claim that you know will return “approval pending.” Run the submission request as an [evaluation case](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/analytics-agent-evaluation-intro). Pass it only if the answer says approval is pending and promises neither approval nor payment. Repeat with test claims that return approved and rejected outcomes so a fix for one answer doesn't break the others.

After the change, verify the user-visible response in a controlled interaction. If the underlying operation still fails, route the execution error separately. Improving the wording of a failure message doesn't restore the service.

### A session is missing or credit usage looks unexpected
{: #maker-usage }

First check which question you're answering. **Did the interaction happen?** Use the published agent, channel, time zone, and session ID. The [session list](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/analytics-overview#download-session-transcripts) covers the last 28 days; analytics can take up to an hour after a session ends to appear.

**What did it consume?** Open **Monitor > Overview** and find **Total credits used** for the selected period. [Microsoft Learn calls this card **Total estimated credits used**](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/billing-credit-understand-display). Use Monitor for finalized consumption **for events processed so far**; it updates a few times daily. Use Preview and Evaluate for near-real-time estimates. Where the card offers a breakdown, separate production activity from previews and evaluations before attributing an increase to users.

If a request returned a limit error, send it to the [admin capacity check](#admin-access) with its timestamp. Waiting for the credit card to refresh won't establish whether a limit blocked that request.

[Back to the symptom index](#symptoms)

## Part 2: Admin playbook
{: #admin }

### A user can't open the agent, or a request hits a limit
{: #admin-access }

**Before a conversation started?** Check the channel the user tried. For an agent published to **Teams + Microsoft 365**, open the agent in Copilot Studio and use its [sharing settings](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/authoring-share-agent) to check whether the user has access individually, through a security group, or through organization-wide sharing. For another channel, check that channel's access settings. Compare with a colleague who should have the same access in the same channel.

**After the agent answered, when a tool ran?** Inspect that tool's connection with the maker using the [failed-action path](#maker-tool). Granting broader access to the agent won't repair a downstream connection.

For a capacity error, open **Power Platform admin center (PPAC) > Licensing > Copilot Studio**. Identify the environment and agent, then check their consumption, allocation, applicable limits, and enforcement settings. Match the error and time to the control before requesting more capacity. High consumption and a blocked request are different findings.

Microsoft documents [usage controls for Microsoft Copilot harness agents](https://learn.microsoft.com/en-us/power-platform/admin/manage-usage-microsoft-copilot-harness) and the [PPAC consumption reports](https://learn.microsoft.com/en-us/power-platform/admin/manage-copilot-studio-copilot-credits-capacity). For examples of setting boundaries for maker development versus funded production, see our [harness cost and governance guide]({% post_url 2026-08-07-copilot-harness-cost-governance %}).

### Several agents started failing together
{: #admin-shared }

1. **Check tenant service health.** Open **Microsoft 365 admin center > Health > Service health** or [Power Platform service health](https://learn.microsoft.com/en-us/power-platform/admin/check-online-service-health). Compare the advisory's affected workload, start time, and user impact with the report. If they match, share the incident ID, workaround, and next update time. If the admin portals are unavailable, check [Microsoft service status](https://status.cloud.microsoft).
2. **Compare agents in the affected environment.** Open **PPAC > Monitor > Products > Copilot Studio**. Look for an unaffected agent as well as affected ones. If agents that share the claims connection fail while other agents in the same environment work, investigate the connection before making an environment-wide change. [PPAC Monitor](https://learn.microsoft.com/en-us/power-platform/admin/monitoring/monitoring-overview) requires tenant-level analytics; its aggregate metrics can lag the incident.
3. **Correlate one failure with dependency evidence.** Give the connection, flow, or API owner the agent ID, operation name, and time in UTC. Ask whether their system received the request and what result it returned. Two agents failing at the same time is a clue; two requests rejected by the same dependency for the same reason is evidence you can act on.

If your team uses [environment-level Application Insights export (Preview)](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-environment-level-agent-telemetry), confirm that a known test interaction from **this harness** produces the expected spans in your managed environment before using the export for alerts. In the documented schema, `operation_Id` groups agent and tool spans for one turn in `dependencies`; `gen_ai.conversation.id` connects turns. A new export can take up to 24 hours to start delivering data. If it wasn't configured when the incident began, use the session and downstream logs you already have.

### A success-rate alert fired, but the agent works now
{: #admin-alert }

In **PPAC > Monitor > Products > Copilot Studio**, read **Agent session success rate** alongside **Recent agent sessions** and note the reporting window. Four failures out of five sessions call for a different investigation from four hundred failures out of five hundred, even though the percentages match.

For conversational Microsoft Copilot harness agents, [PPAC analyzes outcomes after sessions end](https://learn.microsoft.com/en-us/power-platform/admin/monitoring/monitor-copilot-studio). A maker-configured, intended escalation counts as success. A user-requested escalation counts as failure for this metric, even when reaching a person was the right outcome for that user. Unengaged and unanalyzed sessions are excluded. Results can arrive **up to 48 hours after usage**.

Compare the alert's time window with the repair time. Verify recovery by completing the affected task now, then review outcomes from sessions **after** the repair as they become available. For [custom PPAC alerts](https://learn.microsoft.com/en-us/power-platform/admin/monitoring/alerts), choose a threshold based on normal traffic, name a responder, and record the review period. The default aggregation is 24 hours; supported metrics offer hourly review. An hourly rule doesn't make delayed session outcomes available sooner.

### Fleet activity looks lower than the owner expects
{: #admin-fleet }

Use [Agent 365 observability](https://learn.microsoft.com/en-us/microsoft-agent-365/builder/observability) in the Microsoft 365 admin center to look across agents. Copilot Studio emits this telemetry automatically. Microsoft documents that it can appear within minutes, but covers **authenticated sessions only** and excludes multi-tenant agents.

Before calling an agent idle, confirm its ID and environment, use the same time window as its owner, and check how users authenticate. For example, an anonymous channel can explain why the maker sees usage that isn't in Agent 365. Record the report's coverage alongside any recommendation to retire an agent. If the question is whether users completed a task successfully, return to the [session evidence](#maker-tool).

[Back to the symptom index](#symptoms)

## What a useful handoff looks like
{: #handoff }

Here's how the claims example could end. **Maker to connection owner:** “Two users can ask about policy, but claim submission failed at 09:12 and 09:16 UTC. Both sessions reached the submission tool and returned an authentication error. The session IDs are in the restricted incident record. Can you check the connection used by that operation?”

**Connection owner back to maker:** “I repaired the connection and confirmed the downstream service accepted a test submission. Can you verify that the agent returns the claim number?” The maker checks the confirmation against the test record and keeps a separate evaluation case for rejected submissions. Raw transcripts and claim details stay in the approved diagnostic system.

That gives each owner a concrete recovery check: the service accepted the claim, and the user received the right result. For your most important agent, who can verify each half?
