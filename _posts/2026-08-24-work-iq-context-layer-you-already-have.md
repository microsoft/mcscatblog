---
layout: post
agent_edition: github-copilot
title: "Work IQ: The Context Layer You Already Have"
date: 2026-08-24 09:00:00 +0200
categories: [copilot-studio, work-iq]
tags: [copilot-studio, microsoft-365-copilot, mcp, knowledge, governance, licensing, billing, declarative-agents]
description: "How Work IQ is used across Copilot experiences and custom agents, what's included versus metered, and where MAC and PPAC controls apply."
author: asfjordhoj
---

When is Work IQ included, when does it consume Copilot Credits, and where do you control that usage? This guide answers those questions across Microsoft 365 Copilot, declarative agents, Cowork, Copilot Studio, and custom applications. Those distinctions matter before you connect a tool or ask someone to approve a budget.

Ask a mailbox-only agent *"What matters today?"* and it might overvalue an email because the sender marked it high importance. With broader work context, it could connect a quiet note from your manager to this week's meetings and deal priorities, answering like an agent that knows where it is standing.

[Work IQ](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/) is the intelligence layer that connects work context across Microsoft 365, including mail, meetings, chats, and files. The scenario determines how you use it and how that usage is billed.

## Start with the scenario

The useful first question isn't "Does this product have Work IQ?" It's "What is the user or agent doing to invoke it?" Native grounding, an explicitly added tool, and a Cowork task don't have the same licensing treatment, even when they draw on similar work context.

The comparison below uses the **September 2026** [Copilot Credits Licensing Guide](https://aka.ms/CopilotCredits/LicensingGuide) and [Copilot Studio Licensing Guide](https://go.microsoft.com/fwlink/?linkid=2320995). "Included" refers to the qualifying licensed-user scenario described, not every user, channel, or tool the product supports. The standalone GitHub Copilot CLI is a developer host here, not Copilot Studio's GitHub Copilot harness.

| Scenario | What triggers Work IQ | Licensing: included or metered? |
| --- | --- | --- |
| **Microsoft 365 Copilot** for a licensed user | The user asks a work-related question; Copilot uses its native Work IQ grounding. No separate Work IQ API integration is needed. | Native Work IQ grounding is included in the Microsoft 365 Copilot experience. It doesn't add a separate Work IQ API charge. |
| **[Declarative agent](https://learn.microsoft.com/microsoft-365-copilot/extensibility/build-declarative-agents) in Microsoft 365 Copilot**, built with Agent Builder or pro-code tooling | A request to the agent uses Microsoft 365 Copilot's native grounding. The two build methods don't change this scenario. | For eligible Microsoft 365 Copilot licensed users in Microsoft channels, qualifying usage is included under the documented conditions and fair usage. An explicit Work IQ API call is still consumption-based. |
| **Cowork** | A user starts a Cowork task that draws on their work context. | Task activity consumes Copilot Credits. Requires a Microsoft 365 Copilot license **and** usage-based billing enabled, per the [September 2026 Copilot Credits Licensing Guide](https://aka.ms/CopilotCredits/LicensingGuide). |
| **Copilot Studio, GitHub Copilot harness** | The agent invokes the unified Work IQ MCP tool that a maker explicitly added. | GitHub Copilot harness runtime consumes Copilot Credits regardless of the user's Microsoft 365 Copilot license. Work IQ API calls are consumption-based too. |
| **Developer or custom host:** [Foundry](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/work-iq#prerequisites), standalone GitHub Copilot CLI, or your own app | The host explicitly calls the unified Work IQ APIs, including through MCP. | Work IQ API consumption uses Copilot Credits and doesn't itself require a Microsoft 365 Copilot license. Microsoft 365 user access and consumption setup are still required. The host's own charges or licensing still apply. |
{: #work-iq-scenarios }

<style>
  .content #work-iq-scenarios {
    width: 100%;
    min-width: 36rem;
    table-layout: fixed;
  }
  .content #work-iq-scenarios th,
  .content #work-iq-scenarios td {
    white-space: normal;
  }
</style>

### Adding Work IQ in Copilot Studio

The supported [unified Work IQ MCP integration in Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/add-work-iq) is available for the **GitHub Copilot harness**. This tool integration is in **preview**. The **Standard harness does not support it**, and neither harness automatically inherits Work IQ. Choosing the GitHub Copilot harness makes this integration available to add; it doesn't connect the agent to your work context by itself.

In a GitHub Copilot harness agent, go to **Tools > Add tool > Model Context Protocol**, choose **Work IQ (preview)**, and add a Work IQ connection. Follow the linked setup guide for the full connection procedure and prerequisites. That's an explicit tool choice, not a knowledge setting hidden elsewhere in the agent.

Then make the intended use clear in the agent's instructions. For a meeting-preparation agent, that might mean consulting Work IQ when a user asks for context from their recent conversations and upcoming meetings. Adding the tool makes it available; it doesn't mean every message must call it. Test a question that actually needs work context so you can see whether the agent invokes the tool, rather than judging the connection only by whether an answer sounds convincing.

What about Standard's [**Tenant graph grounding with semantic search**](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio#tenant-graph-grounding-with-semantic-search)? This setting on the agent's **Generative AI** page improves knowledge retrieval; it doesn't enable unified Work IQ MCP. Licensed Microsoft 365 Copilot users use tenant graph grounding by default. Enabling it for users without those licenses adds consumption under the [Copilot Studio billing rates](https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management#copilot-credits-billing-rates). Standard supports generative orchestration and generated answers; this particular Work IQ tool integration is what's unavailable.

There's also a licensing distinction within Studio. Qualifying Standard or Copilot Chat harness runtime in Microsoft channels for authenticated, eligible Microsoft 365 Copilot licensed users can be included, subject to fair usage. That inclusion doesn't extend to GitHub Copilot harness runtime or explicit Work IQ API calls. Don't use a user's Copilot seat as the budget for a GitHub Copilot harness agent.

## Billing controls: follow the usage to its owner

Now take the scenario you've chosen to the people who manage its consumption. The **Microsoft 365 admin center (MAC)** manages spending policies for Work IQ API usage and Cowork. The **Power Platform admin center (PPAC)** manages Copilot Studio environment capacity and agent limits. A Studio agent using Work IQ needs attention in **both**, not just the console where you manage the agent.

> Agent consumption draws from the environment's allocated Copilot Credits or the tenant pool, as configured in PPAC. Work IQ consumption is managed through the user's Work IQ spending policy in Microsoft 365 admin center (MAC).
{: .prompt-info }

These are different management paths, not a reason to assume each console has an isolated pool of credits. The practical question is which control governs the activity you want to allow, limit, or investigate.

For metered scenarios, estimate usage from representative tasks, not the number of people who can open the agent. A short question and a multi-step task can involve different amounts of work. Observe what the agent actually invokes during testing, then size the limit around the tasks you expect people to repeat.

### MAC: Work IQ API usage and Cowork

Start in **Copilot > Cost Management** and review the applicable [spending policy](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-manage-copilot-credits). The policy connects users or groups, the relevant service, a billing method, and spending limits. For a Work IQ integration, check that the people who will use it are covered for **Work IQ**. For Cowork, [policy scope grants service access](https://learn.microsoft.com/microsoft-365/copilot/cowork/cowork-access): a very low credit limit doesn't keep a user out. To prevent access, don't include that user in any spending policy that selects Cowork.

This applies when the Work IQ caller is Foundry or your own application, but also when it's a Copilot Studio agent. The [Studio setup documentation](https://learn.microsoft.com/microsoft-copilot-studio/add-work-iq) explicitly requires a separate Work IQ spending policy. An environment with available Copilot Credits is therefore not the whole setup story: the user's Work IQ consumption still needs its MAC policy.

Spending limits don't reserve credits. Giving a department a monthly spending limit doesn't set aside that many credits exclusively for it. The policy sets spending limits against the configured billing method. Prepaid credits and pay-as-you-go provide funding; the policy expresses how much usage you're willing to allow. Don't mistake money available to spend for permission to spend without a limit.

Use policy and per-user spending limits to manage consumption, and threshold alerts to notify the owner as usage grows. Don't treat a credit limit as an immediate access cutoff. [Cowork's credit consumption and limit enforcement are evaluated asynchronously](https://learn.microsoft.com/microsoft-365/copilot/cowork/cowork-access#decide-who-can-access-cowork), so a user may start additional tasks after reaching the limit before enforcement takes effect.

For example, a team might use Cowork directly while its meeting-preparation agent calls Work IQ from Studio. The MAC administrator needs to know about both services and the intended users, rather than receiving a request to "enable AI spending" with no scope. Agree who reviews the alerts and who can approve a change when real usage differs from the original budget.

Spending approval doesn't grant data access; [tenant enablement and consent](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/enable-work-iq) remain separate prerequisites.

### PPAC: Studio environment capacity and agent limits

For the Studio side, use [**Licensing > Copilot Studio > Manage Copilot Credits**](https://learn.microsoft.com/power-platform/admin/manage-usage-github-copilot-harness) to review the environment's allocation and access to other capacity. An allocation isn't inherently a hard cap. If tenant-pool draw is available, the environment can consume unallocated tenant capacity; if pay-as-you-go is configured, usage can continue through that billing path.

So don't stop at the allocation number. Check what happens when the environment uses it up. A team that expects its agent to stop at the allocation needs different settings from a team that has approved continued consumption. The [Studio billing overview](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/billing-credit-overview) provides the broader consumption model; the environment settings determine which funding paths are available to your agent.

For an individual agent, go to **Manage Agents**, set its monthly limit, and choose **Stop usage** if you want the limit enforced, rather than only receiving alerts. Configure notifications so the responsible administrators can act before that happens. An Azure budget alert is different: it notifies you about spending but doesn't itself stop Copilot Studio consumption. An alert-only budget isn't a substitute for the agent's enforcement setting.

Environment and agent controls answer different operational questions. The environment allocation concerns capacity shared by its agents; an agent limit lets you constrain one use case within it. For a department's meeting-preparation agent, that means agreeing how much it may consume without assuming every other agent in the environment has the same priority or budget. Our guide to [cost control for the GitHub Copilot harness]({% post_url 2026-08-07-copilot-harness-cost-governance %}) walks through those PPAC controls in more detail.

If different teams own MAC and PPAC, give them the same scenario description: which agent, which environment, which users, and why it calls Work IQ. The Studio owner can then manage agent consumption while the MAC owner manages those users' Work IQ spending policy. Neither has to infer the other half from the name of a tool.

## Two questions that usually come next

### Isn't this just adding a knowledge source?

A [knowledge source](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio) supplies retrieved content that the agent uses to generate its response. That's a useful fit when you want answers grounded in chosen sources, such as a curated set of policies. Conversational Work IQ is useful when the question depends on the user's work context across mail, meetings, chats, and files, such as what they should know before a customer meeting.

The response shape matters too. The Work IQ [`ask` tool](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference) returns a generated response and a conversation ID for follow-up questions. That doesn't mean every Work IQ tool generates an answer: tools such as `fetch` return structured Microsoft Graph JSON. The calling agent can still synthesize tool results and combine them with other information.

You don't have to choose one approach for every question. A meeting-preparation agent could consult curated guidance for the approved briefing format and Work IQ for the user's recent work context. The general pattern of [using instructions to combine tools and knowledge]({% post_url 2025-11-11-influence-orchestration-knowledge %}) helps make that division intentional. Neither source is a universal replacement for the other.

### Does saving a connection start consuming credits?

No. Manual, non-LLM configuration, such as changing a setting or adding a connection, doesn't consume credits merely because you save it. The September 2026 licensing guides distinguish that setup work from activity that invokes models or tools.

Work IQ tool calls consume credits. In the GitHub Copilot harness, natural-language authoring, testing, previewing, and evaluations can also consume credits **before the agent is published**. Manually attaching a connection and asking an AI-assisted builder to create and try a workflow are not the same activity. Put the relevant controls in place before those tests, not only before production use.

The right to create an agent is a separate question from what running or testing it consumes. If your immediate concern is why basic-licensed users can create agents at all, our post on [E3 users' agent-creation access]({% post_url 2026-07-09-e3-users-build-agents-turn-it-off %}) covers that entitlement and its control. It doesn't make GitHub Copilot harness activity or Work IQ API calls included.

Work IQ can help an agent know where it is standing. You should be just as clear about where its consumption is managed. Which scenario are you building for, and who owns its spending controls in your organization?
