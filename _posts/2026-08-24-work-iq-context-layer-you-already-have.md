---
layout: post
agent_edition: both
title: "Work IQ: The Context Layer You Already Have"
date: 2026-08-24 09:00:00 +0200
categories: [copilot-studio, work-iq]
tags: [copilot-studio, microsoft-365-copilot, mcp, governance, licensing, declarative-agents, authentication, agent-365]
description: "What Work IQ is, when it is included or consumption-based, which admin consoles control it, and the constraints to check before a pilot."
author: asfjordhoj
image:
  path: /assets/posts/work-iq-context-layer-you-already-have/door4-renewal-risk-board.gif
  alt: A renewal risk board grounded in CRM records and Microsoft 365 evidence
---

Ask an agent a question that depends on knowing your organization, and watch what it does.

> *What is the most important thing for me to do today?*

An agent with access to your mailbox and nothing else answers confidently, and naively. It sees a message flagged high importance from someone outside your company and promotes it to the top. The flag was set by the sender, and the agent has no way of knowing that sender is a small account you speak to twice a year.

Now give the same agent your work context. It sees a three-line note from your skip-level manager, sent this morning, no flag, about a deal that appears twice in your calendar this week. It ranks that first, not because the message looked urgent, but because it knows who that person is to you, what you are spending your week on, and which thread this belongs to.

Nothing changed about the model. What changed is that the second agent knew where it was standing.

That difference is Work IQ. This guide focuses on the decision that follows: what is included with Microsoft 365 Copilot, what becomes consumption-based, and which controls matter before a pilot.

Evaluating Work IQ? Start with [the boundary that determines cost](#the-boundary-that-determines-cost). Tenant administrators can skip to [billing controls](#billing-controls-and-where-they-live). Architects should not miss [the three design constraints](#three-constraints-that-reshape-designs).

## What Work IQ is

Work IQ is not a product you buy. It is the [workplace intelligence layer](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq) that continuously builds a semantic understanding across Microsoft 365 and external systems, with permission-aware governance built in. It reasons over mail, meetings and calendar, OneDrive and SharePoint documents, Teams messages, Planner plans, enterprise search results, and the people and org context tying them together.

### Where the data actually lives

This is the question that arrives ninety seconds into every architecture conversation, and the answer is more reassuring than people expect: **Work IQ is not another store that copies your Microsoft 365 content.**

It reasons over content already in Microsoft 365, where you already govern it. Your mail is still in the mailbox, your documents still in SharePoint and OneDrive. On top of that sits the semantic index, which makes content searchable by meaning rather than keyword. External connector data and agent working data follow the separate paths below.

External data reaches it two ways, and the difference matters:

- **Copilot connectors** ingest external content into Microsoft Graph, so it joins the indexed picture alongside your Microsoft 365 content.
- **Federated connectors** skip indexing entirely. They read the source in real time over MCP, making live or sensitive systems discoverable *without* their content ever entering the semantic index. If legal will not allow you to index a system, this is the mechanism to reach for.

Where an agent needs somewhere to put working notes, Work IQ provides [Workspaces](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq#workspaces): persistent storage on SharePoint Embedded, inside the tenant boundary, for intermediate results and handing work between agents.

> Work IQ operates within the Microsoft 365 trust boundary, and its data residency follows your Microsoft 365 tenant configuration rather than the region of whatever service you provisioned.
{: .prompt-info }

That last clause catches people out. Stand up an Azure AI Search service in one region, assume that decides residency, and you have it backwards.

### The Microsoft Graph question

If all of that sounds familiar, it should. Work IQ reasons over the same tenant data that Microsoft Graph exposes, and the resemblance is not accidental. Reach it over **Work IQ MCP** and you address resources by paths you already know:

```text
/me
/me/messages
/me/events
/search/query
```

Those paths belong to the MCP server's generic tools. The REST and A2A contracts are conversational: you ask them questions rather than address resources. Either way, think of Work IQ as reasoning that sits above the data Graph has always exposed rather than a separate store beside it. When you know exactly what you want, Graph is still the better instrument. Work IQ is for when you do not.

## The boundary that determines cost

Work IQ shows up in two ways, billed on completely different principles.

|  | **Work IQ as the layer** | **Work IQ as an API** |
| --- | --- | --- |
| How you get it | It is already underneath you | You explicitly call it |
| Where | Microsoft 365 Copilot, Microsoft 365 apps and declarative agents | Your agent, your app or a third-party host |
| Cost | Included for qualifying Microsoft 365 Copilot licensed users, subject to fair usage | Consumption-based |
| Auth | Implicit, in-product | Delegated Entra ID |

Microsoft's own licensing wording is direct:

> Microsoft 365 Copilot is natively built on Work IQ and does not need to leverage Work IQ APIs. [...] The usage charges described above only apply to access to Work IQ using the Work IQ APIs.

Which reduces to one sentence:

> **The same intelligence is included when it is underneath you, and consumption-based when you reach for it.**
{: .prompt-tip }

Declarative agents built in Agent Builder or with [pro-code tooling](https://learn.microsoft.com/microsoft-365-copilot/extensibility/build-declarative-agents) inherit Work IQ from Microsoft 365 Copilot. Licensed users are not separately charged for that grounding. If the same agent explicitly calls Work IQ through MCP, an API plugin or another custom tool, that call crosses onto the consumption-based side.

**Cowork sits across the line.** Work IQ is underneath it, but Cowork itself uses [usage-based billing](https://learn.microsoft.com/microsoft-365-copilot/cowork/cowork-admin-governance). Being underneath a surface explains how Work IQ reaches it, not whether the surface is included.

Two qualifiers matter. Included usage is subject to **fair usage limits**, for which Microsoft publishes no fixed threshold. It also assumes the agent operates under the signed-in user's identity, a design constraint we return to below.

> The Work IQ overview states that API access is independent of Copilot licensing, while Agent 365 tooling documentation states that a Copilot license is required for Work IQ MCP servers. If your plan depends on API access without Copilot licenses, confirm the entitlement for the specific surface first.
{: .prompt-warning }

Microsoft 365 Copilot is an add-on to a [wide range of base plans](https://learn.microsoft.com/microsoft-365-copilot/microsoft-365-copilot-licensing), including frontline F1 and F3, and is bundled with Microsoft 365 E7. For edge cases, [what E3 users can and cannot build]({% post_url 2026-07-09-e3-users-build-agents-turn-it-off %}) goes deeper.

## Choose the route before the tool

The route determines who builds, where usage is governed and how much responsibility your team owns. Pick the first route that solves the problem.

| Route | Primary audience | How Work IQ arrives | Billing and control |
| --- | --- | --- | --- |
| **Microsoft 365 Copilot** | Licensed users | Built in | Included subject to fair usage |
| **Declarative agent, Agent Builder** | Makers | Inherited from Microsoft 365 Copilot | Included for licensed users |
| **Declarative agent, pro code** | Developers | Inherited through source-controlled manifests | Same included model |
| **Cowork** | Users | Built in | Usage-based; Microsoft 365 admin center |
| **Copilot Studio agent** | Makers | [Work IQ MCP tool](https://learn.microsoft.com/microsoft-copilot-studio/use-work-iq) (preview) | Agent usage governed in PPAC |
| **Foundry, GitHub Copilot or your own host** | Developers and architects | [A2A, MCP or REST](https://learn.microsoft.com/microsoft-365-copilot/extensibility/work-iq/api-overview) | Work IQ API usage; Microsoft 365 admin center |

Agent Builder and pro-code tooling are two ways to create the same kind of declarative agent. The former is guided; the latter gives developers manifests and a source-controlled workflow. The choice changes how you build, not how Work IQ is inherited.

Copilot Studio has its own billing model in PPAC. The standard harness has a published per-message rate, while the GitHub Copilot harness is billed by usage. Neither model should be used to forecast Cowork or direct Work IQ API consumption. For a closer look, see [cost control and governance for the GitHub Copilot harness]({% post_url 2026-08-07-copilot-harness-cost-governance %}).

### What the choice changes

Our renewal risk board belongs in the final row because the account team works in a CRM portal. The CRM holds each renewal record; Work IQ searches Microsoft 365 for contradictory evidence. Embedding that capability meets users where they work, but the team now owns delegated authentication, end-to-end residency and the governance decisions earlier routes make for them.

![The renewal board scans eight CRM records, flags three contradictions and opens the supporting evidence for Litware Chemical.](/assets/posts/work-iq-context-layer-you-already-have/door4-renewal-risk-board.gif){: .shadow }
_The renewal risk board compares CRM records with evidence from Microsoft 365._

The same business question may not require a custom host. A licensed account manager can ask Microsoft 365 Copilot directly, a declarative agent can make the preparation repeatable, and Cowork can produce the brief as an artifact. Control and responsibility move together. Stop at the first route that solves the problem.

## Billing controls and where they live

The most useful orienting fact is that billing is governed in two consoles. Cowork and direct Work IQ API usage sit in the **Microsoft 365 admin center**. Copilot Studio and Power Platform capacity sit in **PPAC**. They may use the same currency, but their controls are separate.

### Microsoft 365 admin center

| Billing control | Default | What it does |
| --- | --- | --- |
| Usage-based billing | Not configured | Prerequisite for metered Work IQ and Cowork usage |
| Unlimited spending policy | Not set | Allows spend to follow usage without a ceiling |
| **Limited** spending policy | Not set | Sets a hard monthly stop |
| Per-user monthly limit | Optional | Prevents one user from draining a shared pool |
| Threshold alert | Optional | Warns nominated owners before the ceiling |
| Consumption view | Available | Breaks usage down by user, group, service or agent |

> A limited monthly budget is a hard stop, not an alert. Users lose access to affected agents and services until the first day of the following month.
{: .prompt-danger }

Before a pilot, set a budget, per-user limits and threshold alerts that point to somebody who will act on them. Then observe real tasks rather than inventing an average request: a sales manager researching a deal and a support lead triaging mail do not consume the same amount.

### Power Platform admin center

| Billing control | Default | What it does |
| --- | --- | --- |
| Credit allocation per environment | Not set | Reserves prepaid capacity and ring-fences usage |
| Tenant-pool draw | Often enabled on new environments | Lets an environment consume unallocated tenant capacity |
| Enforcement rules | Not set | Decide whether usage stops or continues when capacity runs out |
| 125% of purchased capacity | Automatic | Disables affected custom agents and notifies administrators |

Prepaid capacity is drawn down before pay-as-you-go, but the [expiration period depends on what you bought](https://learn.microsoft.com/microsoft-365-copilot/usage-based-billing-manage-copilot-credits). Copilot Studio monthly capacity and Copilot Credit P3 commit units do not share a renewal cycle, so check each pool rather than assuming unused credits reset monthly.

## Governance controls are not billing controls

Provisioning, consent and tool policy determine whether a request may run. They do not set its budget.

| Governance control | Owner | Default | Why it matters |
| --- | --- | --- | --- |
| Work IQ service principals | Entra ID administrator | Not present | Must exist before consent can be granted |
| `WorkIQAgent.Ask` admin consent | Entra ID administrator | Not granted | Allows delegated Work IQ requests for signed-in users |
| Work IQ MCP tool policy | Microsoft 365 administrator | Reads allowed, writes denied | Controls data paths, retrieval limits and mutation operations |
| Add Work IQ to an agent | Maker | Not added | Makes the tool available to that agent |

Follow the current [Work IQ enablement guide](https://learn.microsoft.com/microsoft-365-copilot/extensibility/work-iq/enable-work-iq) for provisioning and consent, and review the published [permissions](https://learn.microsoft.com/microsoft-365-copilot/extensibility/work-iq/permissions) with your security team. Those procedures belong in Learn because service names and preview setup can change. The decisions this article adds are who owns each control, which tenant-wide posture you will accept and how you will contain usage.

Adding the tool does not grant access to data, enable writes or configure billing. Those decisions remain with administrators, and every result is still trimmed to the signed-in user's permissions.

## Three constraints that reshape designs

### 1. There is no application-only authentication

> Work IQ uses Microsoft Entra ID delegated authentication. [...] On-behalf-of (OBO) flows are supported. **Application-only authentication isn't supported.**

Every Work IQ request runs in the context of a signed-in user. There is no daemon identity or service principal calling Work IQ on its own account.

This constrains identity, not presence. Work can run while nobody is watching if it carries a user's identity: Cowork schedules recurring tasks this way, and on-behalf-of lets a service act within a user's permissions after authentication. A background service with no user behind it does not fit.

[Microsoft Agent 365](https://learn.microsoft.com/microsoft-agent-365/overview) does not remove this requirement. Agent 365 governs the agent as an entity; Work IQ still resolves data access against a signed-in human. [Agent authentication controls]({% post_url 2026-06-14-agent-authentication-controls %}) is a useful companion.

### 2. Mutations are blocked by default

> By default, mutation operations aren't allowed for safety. This restriction includes create, update, delete, and action requests that modify data, such as sending email.

Work IQ MCP is read-only until an administrator enables writes. The write tools are present, but policy refuses them until the tenant opts in. Include that decision in the pilot plan, and allow up to 24 hours for policy changes to propagate.

### 3. Policy control is tenant-level only, for now

Work IQ [MCP policy](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/mcp/policy-governance-mcp) lives in the Microsoft 365 admin center under **Agents -> Tools -> Work IQ MCP -> Policy**. The initial administrative scope is tenant-wide:

> Per-user, per-app, per-agent, or scenario-specific policy templates aren't part of the initial policy control surface.

You cannot yet allow one agent to write and deny another. Policy approval also does not guarantee success because the user's own permissions are checked on every request. Policy can restrict access, but it cannot elevate it.

## Residency, in one paragraph

Work IQ operates within the Microsoft 365 trust boundary, does not use customer content to train models, and follows the tenant's Microsoft 365 residency configuration. **But retrieval residency is not solution residency.** A Foundry workflow or custom host can send prompts and results downstream, where processing has its own geography. Inside the EU Data Boundary, Copilot is an EU Data Boundary service; [outside it](https://learn.microsoft.com/microsoft-365/copilot/microsoft-365-copilot-privacy), queries may be processed in the US, EU or other regions. Assess the whole path, not the Work IQ leg alone.

## When Work IQ is the wrong tool

A guide that only explains when to say yes is a brochure. Work IQ reasons over work context on behalf of a person, and several jobs belong elsewhere.

**When the answer is already underneath you.** If licensed users only need to ask about their own mail, meetings and documents, Microsoft 365 Copilot already does that. Call the API when you need Work IQ somewhere Copilot is not.

**When you need determinism.** *"Return this user's calendar for next Tuesday"* is a Microsoft Graph request. *"What should I know before Tuesday's meeting?"* is a Work IQ question. Use Graph when the same input must produce the same result.

**When there is no user identity.** Batch jobs and system-owned syncs need application permissions. Work IQ does not support them, so that leg belongs to Graph.

**When you are moving volume.** Work IQ is designed for relevance, not exports, migrations or backups. MCP policies can cap reads and page sizes; Graph is the better bulk instrument.

**When simple retrieval would do.** If a SharePoint search box or a well-placed link answers the question, use it.

## Before a pilot

Learn owns the enablement sequence. Your project team owns the decisions around it:

1. Choose the route and confirm whether it is included or consumption-based.
2. Name the billing owner in the correct console.
3. Set budgets, per-user limits and alerts before inviting users.
4. Follow the [enablement guide](https://learn.microsoft.com/microsoft-365-copilot/extensibility/work-iq/enable-work-iq) for service principal provisioning and consent.
5. Agree on the tenant-wide MCP read and write posture.
6. Test with representative users, not administrators, after policy changes have propagated.
7. Assess residency and model availability across the complete solution.

> The Copilot Studio tool, Foundry tool and AI Search knowledge source are in preview. The Work IQ REST API also has [documented limitations](https://learn.microsoft.com/microsoft-365-copilot/extensibility/work-iq/rest/overview#known-limitations) worth reading before shipping.
{: .prompt-warning }

If two tenants behave differently, check provisioning, consent, policy propagation, the signed-in user's permissions and the available budget before blaming the API. Then account for the final variable: retrieval is non-deterministic. In our testing, the same question against unchanged data sometimes found the evidence and sometimes did not. Never design a critical step around one document always being returned.

## The short version

- Work IQ is a layer, not another content store.
- It is included when inherited through Microsoft 365 Copilot and consumption-based when explicitly called through an API.
- Cowork and direct Work IQ API usage are governed in the Microsoft 365 admin center; Copilot Studio capacity is governed in PPAC.
- Provisioning, consent and MCP policy are governance controls, not billing controls.
- Work IQ requires a user's delegated identity, denies writes by default and currently applies MCP policy tenant-wide.
- Use Microsoft Graph for deterministic retrieval, application identities and bulk movement.
- Follow Learn for enablement steps; use this framework to decide what to enable and who should own it.

Most agents come up short on work-aware questions not because the model is weak, but because they have no idea where they are standing. What is the first question you would want your agent to answer properly, and what would it need to know about your organization to get it right?
