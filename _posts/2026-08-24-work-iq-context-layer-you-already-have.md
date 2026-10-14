---
layout: post
agent_edition: both
title: "Work IQ: How It's Used, Licensed, and Controlled"
date: 2026-08-24 09:00:00 +0200
categories: [copilot-studio, work-iq]
tags: [copilot-studio, microsoft-365-copilot, mcp, knowledge, governance, licensing, billing, declarative-agents]
description: "Understand how Work IQ is used, when Copilot Credits apply, and how to configure controls in the Microsoft 365 and Power Platform admin centers."
author: asfjordhoj
image:
  path: /assets/posts/work-iq-context-layer-you-already-have/header.png
  alt: "Work IQ connects email, meetings, chats, and files, with agent capacity and user spending controls operating in parallel."
  no_bg: true
---

[Work IQ](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/) is Microsoft's workplace intelligence layer for agents. It is included natively in Microsoft 365 Copilot's grounding, while Copilot Studio agents use it only when the relevant Work IQ tool is added.

You can also add Work IQ explicitly as a tool through the unified Work IQ MCP server, or call it through an API from a custom application. Those options use the same workplace context, but they are different execution paths. The licensing and billing controls depend on which path you use.

This guide answers three practical questions: how do you use Work IQ, when does it consume Copilot Credits, and where do you control that usage?

## Start with the scenario

Microsoft 365 Copilot uses Work IQ for **grounding**: using work information to inform its answers. Declarative agents (DAs) customize that Copilot experience through instructions, knowledge, and actions. In Copilot Studio, you choose a **harness**, the agent's build and execution experience, and can connect Work IQ explicitly as a tool through **Model Context Protocol (MCP)**.

The comparison below uses the **September 2026** [Copilot Credits Licensing Guide](https://aka.ms/CopilotCredits/LicensingGuide) and [Copilot Studio Licensing Guide](https://go.microsoft.com/fwlink/?linkid=2320995). Metered usage means usage billed in Copilot Credits.

| Scenario | How Work IQ is used and configured | Licensing: included or metered? |
| --- | --- | --- |
| **Microsoft 365 Copilot** for a licensed user | The user asks a work-related question. Work IQ grounding is built in; no separate connection is needed. | Native Work IQ grounding is included in the Microsoft 365 Copilot experience. |
| **Declarative agent built with [Agent Builder](https://learn.microsoft.com/microsoft-365-copilot/extensibility/agent-builder)** | Select supported knowledge sources in Agent Builder, such as SharePoint or Copilot connectors. The agent uses Copilot's built-in grounding; no separate Work IQ connection is required. | Included for eligible Microsoft 365 Copilot licensed users in Microsoft channels, subject to documented conditions and fair usage. |
| **Declarative agent built with [Microsoft 365 Agents Toolkit](https://learn.microsoft.com/microsoft-365-copilot/extensibility/declarative-agent-tool-comparison) (pro-code)** | Declare the Microsoft 365 capabilities the agent needs in its [manifest](https://learn.microsoft.com/microsoft-365/copilot/extensibility/declarative-agent-manifest-1.8), such as SharePoint, email, or Teams messages. This configures its grounding; no separate Work IQ API or tool connection is required. | Included for eligible Microsoft 365 Copilot licensed users in Microsoft channels, subject to documented conditions and fair usage. |
| **Cowork** | A user starts a task that draws on their work context. Work IQ is built in; no separate connection is required. | Consumes Copilot Credits. Requires a Microsoft 365 Copilot license **and** usage-based billing enabled. |
| **Copilot Studio, Standard harness** | The unified Work IQ integration isn't supported. | Not applicable. |
| **Copilot Studio, GitHub Copilot harness** | Add the unified Work IQ MCP tool. The agent invokes it when needed for a task. | Consumes Copilot Credits, including for users with a Microsoft 365 Copilot license. |
| **Custom client or own solution** | Your application calls a Work IQ API to use work context in its own experience. | Consumes Copilot Credits. A Microsoft 365 Copilot license isn't required; [usage-based billing must be enabled for the user](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/enable-work-iq#prerequisites). |
{: #work-iq-scenarios .work-iq-comparison }

The declarative-agent rows describe usage by eligible Microsoft 365 Copilot licensed users. For users without that license, an agent that accesses SharePoint or Copilot connector data consumes Copilot Credits when usage-based billing is enabled. These charges are for using the declarative agent, not for a separate Work IQ API call. This applies to agents built with either Agent Builder or Agents Toolkit. See the [declarative-agent licensing guidance](https://learn.microsoft.com/microsoft-365/copilot/extensibility/cost-considerations#declarative-agents) and [supported users for each authoring tool](https://learn.microsoft.com/microsoft-365/copilot/extensibility/declarative-agent-tool-comparison#tool-requirements-and-access).

<style>
  .content table.work-iq-comparison {
    width: 100%;
    min-width: 36rem;
    table-layout: fixed;
  }
  .content .table-wrapper > table.work-iq-comparison th,
  .content .table-wrapper > table.work-iq-comparison td {
    white-space: normal;
  }
</style>

## Where to manage Work IQ consumption

When a Copilot Studio agent uses Work IQ, two sets of controls apply in parallel. The **Power Platform admin center (PPAC)** is where you configure the agent's environment capacity and usage limits. The **Microsoft 365 admin center (MAC)** is where you configure the users' Work IQ spending policy, which controls access and spending limits for Work IQ. Configuring one doesn't configure the other.

For the metered scenarios in the comparison, these are the controls to configure:

| Applies to | Admin center | Controls |
| --- | --- | --- |
| **Copilot Studio, GitHub Copilot harness with Work IQ** | [**PPAC**](https://learn.microsoft.com/power-platform/admin/manage-usage-github-copilot-harness) and [**MAC**](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-manage-copilot-credits) | Use PPAC to manage the agent's environment capacity and limits. Use MAC to configure the required Work IQ spending policy for its users. |
| **Custom client or own solution calling Work IQ APIs** | [**MAC**](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-manage-copilot-credits) | The calling user's **Work IQ spending policy**: user/group scope, billing method, policy and per-user spending limits, and threshold alerts. |
| **Cowork** | [**MAC**](https://learn.microsoft.com/microsoft-365/copilot/cowork/cowork-admin-governance) | A spending policy that selects **Cowork**, scoped to the intended users/groups, with a billing method, spending limits, and alerts. |
{: #work-iq-controls .work-iq-comparison }

Prepaid Copilot Credit capacity packs can [fund experiences managed through either admin center](https://learn.microsoft.com/power-platform/admin/manage-usage-github-copilot-harness#coordinate-capacity-across-admin-centers). Capacity allocated to Power Platform environments or consumed by Copilot Studio reduces what's available to supported Microsoft 365 experiences. The controls remain separate.

Estimate usage by trying representative tasks, then accounting for how many users will repeat them and how often. A short question and a multi-step task can consume different amounts of credits.

## How to configure the controls

### MAC: Work IQ and Cowork spending policies

Follow the [spending-policy setup guide](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-manage-copilot-credits) to enable usage-based billing, then configure who can use each service:

1. In **Copilot > Cost Management > Configuration**, add or edit a spending policy.
2. Choose **All users** or specific security groups. Select **Work IQ**, **Cowork**, or both under **Select agents and services**, according to the intended use.
3. Select a billing method and set the policy's monthly spending limit and optional per-user limit. A Global or Billing administrator manages the billing method.
4. Configure threshold alerts and assign someone to review them. Review any other policies covering the same users.

This Work IQ policy applies to custom applications and to the Copilot Studio MCP integration. The [Studio setup guide](https://learn.microsoft.com/microsoft-copilot-studio/add-work-iq) explicitly requires a separate spending policy for Work IQ usage.

Spending policies set limits; they don't reserve a portion of your credits. Prepaid credits or pay-as-you-go provide the funding.

> A [Cowork spending policy grants access to everyone in its scope](https://learn.microsoft.com/microsoft-365/copilot/cowork/cowork-access), even with a very low limit. To prevent access, keep the user out of every policy that selects Cowork. Limit enforcement can lag behind consumption, so additional tasks may start after a limit is reached.
{: .prompt-warning }

Spending approval doesn't grant data access; [tenant enablement and consent](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/enable-work-iq) remain separate prerequisites.

### PPAC: Studio environment capacity and agent limits

Building, testing, evaluating, and running a GitHub Copilot harness agent can consume credits. Configure the [environment and agent controls](https://learn.microsoft.com/power-platform/admin/manage-usage-github-copilot-harness) before testing:

1. Go to **Licensing > Copilot Studio > Manage Copilot Credits**, select the environment, and set its prepaid credit allocation.
2. Review **Capacity overages**. Clear **Draw from the available capacity in my tenant** to prevent the environment from using unallocated tenant credits after its allocation runs out.
3. Check whether the environment has a pay-as-you-go billing plan. That plan can fund continued usage even when prepaid credits run out.
4. Under **Licensing > Copilot Studio > Manage Agents**, select the agent, set its monthly limit, and configure notifications. Turn on **Stop usage** to enforce the agent limit.

The environment allocation is capacity shared by its agents; the agent limit constrains one agent's usage. Azure budget alerts send notifications but don't stop Copilot Studio consumption.

Our guide to [cost control for the GitHub Copilot harness]({% post_url 2026-08-07-copilot-harness-cost-governance %}) covers these settings in more detail.

If different teams manage the two admin centers, share the agent name, environment, intended users, and Work IQ use case with both teams.

## Frequently asked questions

### How do I add Work IQ in Copilot Studio?

In Copilot Studio, the [unified Work IQ integration (preview)](https://learn.microsoft.com/microsoft-copilot-studio/add-work-iq) is available only in the **GitHub Copilot harness**.

In your agent, go to **Tools > Add tool > Model Context Protocol**, choose **Work IQ (preview)**, and create or select a Work IQ connection. Follow the linked setup guide for the connection procedure and prerequisites.

Use the agent's instructions to describe when it should consult Work IQ, then test with a prompt that needs context from email, meetings, chats, or files. Adding the tool makes it available, rather than requiring a call on every message.

### What about the Standard harness?

The Standard harness doesn't support the unified Work IQ integration. Two things can make this confusing.

[**Tenant graph grounding with semantic search**](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio#tenant-graph-grounding-with-semantic-search) appeared as a Work IQ-related toggle on the agent's **Generative AI** page. It improves knowledge retrieval and was always separate from the unified Work IQ integration. When enabled, its usage is zero-rated for Microsoft 365 Copilot licensed users, meaning no Copilot Credits are charged. Usage by users without those licenses consumes credits under the [Copilot Studio billing rates](https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management#copilot-credits-billing-rates).

Some individual MCP tools available in the Standard harness also still mention Work IQ in their descriptions. Those descriptions refer to individual tools, not support for the unified Work IQ integration. These individual tools are likely to be deprecated in the future.

### Native grounding or the Work IQ MCP tool?

A DA running in a Microsoft 365 Copilot experience can use Work IQ natively as part of its grounding. In other words, the DA can retrieve relevant content from the user's permitted work sources and use that context to generate a response. Adding the unified Work IQ MCP server is different: it gives the agent an explicit Work IQ tool, including the conversational [`ask` tool](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference), which reasons across the signed-in user's work context and returns a processed response to the agent.

Consider a simple calendar question: **"List my meetings from today."** A calendar knowledge path could return every matching calendar entry, including metadata such as attendees and meeting URLs. Work IQ can process that same context and return a more useful summary, such as: **"Today you have a 9AM standup, an 11AM review with Dana, and a 2PM customer call."** The first path retrieves calendar data; the second applies additional processing and context to the answer.

The same DA can use both approaches. For example, a meeting-preparation agent could use native grounding or a knowledge source for an approved briefing format, then call Work IQ through MCP when it needs a concise summary of the user's recent work context. Use [instructions to describe when to use tools and knowledge]({% post_url 2025-11-11-influence-orchestration-knowledge %}).

## Putting it into practice

Start with one task, choose how your agent will use Work IQ, and configure the controls for that scenario before testing.

What task still has you piecing together emails, meeting notes, and files by hand? Could that be your first Work IQ use case? Share it in the comments.
