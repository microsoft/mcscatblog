---
layout: post
title: "Finding every agent in your tenant (and separating the ones you actually built)"
date: 2026-06-22
categories: [copilot-studio, governance]
agent_edition: both
tags: [copilot-studio, azure-resource-graph, power-platform-admin, inventory, governance, kql, power-apps, dynamics-365]
description: "How to get an accurate count of custom Copilot Studio agents in your tenant by filtering out the 35+ pre-built system agents that Dynamics 365 and Power Platform auto-provision, using Azure Resource Graph, the Power Platform API, Power Automate, and a shareable Power Apps canvas app."
author: mmonisha
image:
  path: /assets/posts/finding-every-agent-in-your-tenant/header.png
  alt: "A cat in a tweed jacket sorting through a wall of agent cards, separating system agents from custom ones"
  no_bg: true
---

You open Power Platform Admin Center, look at the agent inventory, and see 23,000 agents. Leadership asks the one question that actually matters: "How many of those did *our* teams build?" And you can't answer it, because nothing on that screen separates the agents your makers shipped from the thousands that Dynamics 365 and Power Platform quietly provisioned on their own.

That gap sounds like a reporting nuisance. It isn't. Every governance review, every adoption readout, every "what are we actually running in here" conversation starts from that number, and right now it's wrong by an order of magnitude. The good news: the real count is sitting in the same data, one filter away. So the question isn't really *how many agents do we have*. It's *how do I make sense of the data I already have*? That's what the rest of this post is about: the exact list of system agents inflating the count, and a handful of ways to cut through them to the true number, from a five-second query to an app you can hand to your whole team.

## The problem

[Power Platform Admin Center](https://learn.microsoft.com/en-us/power-platform/admin/power-platform-inventory) (PPAC) inventory counts _everything_. Every environment running Dynamics 365 Sales, Customer Service, or Contact Center comes pre-loaded with system agents: sub-agents for research, outreach, email validation, quality evaluation, and more. Nobody on your team built them, but they all land in the inventory. Multiply that by every D365 environment in the tenant and the count balloons long before a single real agent enters the picture.

The math gets ugly fast (the numbers below are illustrative, from one representative large tenant). Picture a tenant with roughly 2,500 environments. Every one running D365 carries up to 35 of these pre-built agents, and that alone throws thousands of phantom entries into the count. It's how you end up staring at ~23,000 agents in PPAC, of which only ~7,867 are Copilot Studio agents to begin with, and only a fraction of *those* are anything your team actually built.

There is no "system vs. custom" toggle in the Admin Center today. No `agentType` column, no flag to filter on. So the inflated number is the only one it will hand you. To get a real one, you have to ask the data yourself.

## The exclusion list: 35 pre-built agents you didn't create

Nothing in the data marks an agent as "system-provisioned," so we did the tedious part for you. We catalogued every pre-built agent that shows up in PPAC once Dynamics 365 and Power Platform are deployed. The [Copilot Studio agent inventory schema](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-agent-inventory) documents the fields on each agent, but not which ones Microsoft created, so the list below is hand-built. It comes to 35 agents in total, grouped by the product that ships them:

<details>
<summary><strong>Full list of 35 pre-built agent names (click to expand)</strong></summary>

**Dynamics 365 Sales (24)**

- Copilot in Dynamics 365 Sales
- D365 Sales - Sales Close Agent - Engage
- D365 Sales - Configuration Agent
- D365 Sales - Data Enrichment
- D365 Sales Agent - Company Resolver
- D365 Sales Agent - Competitor
- D365 Sales Agent - Custom Research
- D365 Sales Agent - Email Validation
- D365 Sales Agent - Engage Autonomous
- D365 Sales Agent - Outreach
- D365 Sales Agent - Readiness
- D365 Sales Agent - Research
- D365 Sales Agent - Stakeholder Research
- D365 Sales Agent - Summary Synthesizer
- D365 Sales Agent - TCP Prefill Agent
- D365 Sales FIRE Agent - Rating Generator
- Sales Close Agent
- Sales Opportunity Agent
- Sales Opportunity Agent - Account Research
- Sales Opportunity Agent - Compete Research
- Sales Opportunity Agent - Custom Research
- Sales Opportunity Agent - Stakeholder
- Sales Profiler Agent
- Sales Qualification Agent Config Assistant

**Dynamics 365 Customer Service (10)**

- Customer Service Copilot Bot
- Case Management Agent
- Case Enrichment Onboarding Agent
- Customer Service Email Sentiment Generator
- Customer Service Onboarding Agent
- Customer Service Operations Agent
- CustomerServiceKnowledgeHarvest
- Quality Evaluation Agent
- Quality Evaluation Agent - Incident
- QualityEvaluationAgentForConversation

**Dynamics 365 Contact Center (1)**

- D365 Contact Center Admin AI Agent

**Power Platform (1)**

- Copilot in Power Apps

</details>

> This list is current as of June 2026. Microsoft may add new system agents with future D365 releases, so revisit periodically or use pattern-based filtering (Query 3 below) to future-proof.
{: .prompt-info }

## Four ways to ask, only two worth your time

There are four ways to pull your [agent inventory](https://learn.microsoft.com/en-us/power-platform/admin/inventory-schema), and they are not equally good at this one job. Two of them can't cleanly tell system agents from yours, so we'll spend our time on the two that can: Azure Resource Graph and the Power Platform API sitting behind it.

| Method | Best for | Filtering power |
|--------|----------|----------------|
| PPAC UI (Manage → Inventory) | Quick visual scan | Limited, no system/custom distinction |
| [Copilot Studio Kit]({% post_url 2026-03-06-copilot-studio-kit %}) | Governance workflows in Dataverse | Moderate, requires setup |
| **Power Platform API** | **Developer integrations, custom dashboards** | **Full: same data as ARG** |
| **Azure Resource Graph (ARG)** | **Ad-hoc queries, leadership numbers** | **Full: KQL, joins, exports** |

## Azure Resource Graph: my favorite queries

If you only take one tool away from this post, make it [Azure Resource Graph](https://learn.microsoft.com/en-us/azure/governance/resource-graph/overview) (ARG). It's the fastest path from "I have no idea" to a hard number you can defend. Open [portal.azure.com](https://portal.azure.com), search for **Resource Graph Explorer**, paste a query, and hit Run. That's the whole ceremony: no project to spin up, no setup, no ticket to file. The four queries below walk from "what's even in here?" all the way to "here's the exact custom-agent count," and you can run every one of them before your coffee gets cold.

### Prerequisites

- Azure Portal access with **Power Platform Admin**, **Dynamics 365 Admin**, or **Global Reader** role
- Azure subscription linked to the same tenant as Power Platform

### Query 1: Discover available fields

Before you filter anything, see what your tenant actually exposes. Field names drift a little between tenants, so start here and confirm what you're working with:

```kql
PowerPlatformResources
| where type == "microsoft.copilotstudio/agents"
| take 1
| extend props = parse_json(properties)
| extend key = bag_keys(props)
| mv-expand key to typeof(string)
| project FieldName = key, SampleValue = props[key]
| order by FieldName asc
```

Key fields you'll find: `displayName`, `createdBy`, `createdAt`, `createdIn`, `isManaged`, `orchestration`, `model`, `channels`, `lastPublishedAt`, `environmentId`.

### Query 2: All custom agents (exclude pre-built by name)

This is the workhorse. Paste in the exclusion list and what comes back is only what your teams actually built:

```kql
PowerPlatformResources
| where type == "microsoft.copilotstudio/agents"
| extend props = parse_json(properties)
| extend agentName = tostring(props.displayName)
| where agentName !in (
    "Case Enrichment Onboarding Agent",
    "Case Management Agent",
    "Copilot in Dynamics 365 Sales",
    "Copilot in Power Apps",
    "Customer Service Copilot Bot",
    "Customer Service Email Sentiment Generator",
    "Customer Service Onboarding Agent",
    "Customer Service Operations Agent",
    "CustomerServiceKnowledgeHarvest",
    "D365 Contact Center Admin AI Agent",
    "D365 Sales - Configuration Agent",
    "D365 Sales - Data Enrichment",
    "D365 Sales - Sales Close Agent - Engage",
    "D365 Sales Agent - Company Resolver",
    "D365 Sales Agent - Competitor",
    "D365 Sales Agent - Custom Research",
    "D365 Sales Agent - Email Validation",
    "D365 Sales Agent - Engage Autonomous",
    "D365 Sales Agent - Outreach",
    "D365 Sales Agent - Readiness",
    "D365 Sales Agent - Research",
    "D365 Sales Agent - Stakeholder Research",
    "D365 Sales Agent - Summary Synthesizer",
    "D365 Sales Agent - TCP Prefill Agent",
    "D365 Sales FIRE Agent - Rating Generator",
    "Quality Evaluation Agent",
    "Quality Evaluation Agent - Incident",
    "QualityEvaluationAgentForConversation",
    "Sales Close Agent",
    "Sales Opportunity Agent",
    "Sales Opportunity Agent - Account Research",
    "Sales Opportunity Agent - Compete Research",
    "Sales Opportunity Agent - Custom Research",
    "Sales Opportunity Agent - Stakeholder",
    "Sales Profiler Agent",
    "Sales Qualification Agent Config Assistant"
)
| project agentName,
    environmentId = tostring(props.environmentId),
    createdBy = tostring(props.createdBy),
    createdAt = tostring(props.createdAt),
    createdIn = tostring(props.createdIn),
    lastPublished = tostring(props.lastPublishedAt)
| order by agentName asc
```

Need only the headline figure for a leadership slide? Append `| count` to the query above and you'll get a single number instead of the full list. To show the inflation rather than just assert it, replace the final `project` with a `summarize` that counts total versus custom side by side.

### Query 3: Pattern-based filtering (future-proof)

Instead of maintaining an explicit name list, filter by naming prefixes that Microsoft uses for system agents:

```kql
PowerPlatformResources
| where type == "microsoft.copilotstudio/agents"
| extend props = parse_json(properties)
| extend agentName = tostring(props.displayName)
| where agentName !startswith "D365"
    and agentName !startswith "Customer Service"
    and agentName !startswith "Sales"
    and agentName !startswith "Quality Evaluation"
    and agentName !startswith "Copilot in"
    and agentName != "CustomerServiceKnowledgeHarvest"
    and agentName !contains "Case Enrichment"
    and agentName !contains "Case Management"
| project agentName,
    environmentId = tostring(props.environmentId),
    createdBy = tostring(props.createdBy),
    createdAt = tostring(props.createdAt)
| order by agentName asc
```

> Pattern matching catches future D365 agents automatically but risks false positives if your team names agents starting with "Sales" or "Customer Service". Validate against your tenant before relying on this exclusively.
{: .prompt-tip }

## Put it on autopilot with Power Automate

Running the query once is satisfying. Running it by hand every Monday morning is not. If leadership wants the number on a schedule, hand the whole job to a flow and stop thinking about it:

1. Create a **Scheduled cloud flow** (e.g., weekly on Mondays)
2. Add the **[Power Platform for Admins V2](https://learn.microsoft.com/en-us/connectors/powerplatformadminv2/)** connector → **"Query Power Platform resources"** action
3. Set `Api-version` to `2024-10-01`, `TableName` to `PowerPlatformResources`
4. Paste the filtering query from Query 2 above
5. Add a **Create CSV table** action downstream
6. Write to SharePoint or send via email

The connector is **Standard** and uses the same Power Platform Admin role you already need. Under the hood it's calling the same [inventory API](https://learn.microsoft.com/en-us/power-platform/admin/inventory-api) behind Resource Graph Explorer, so the exact KQL you prototyped in ARG drops straight into the action. Build it once and the report shows up on its own, landing in an inbox or a SharePoint library before anyone thinks to ask for it.

## Filtering strategies compared

| Strategy | Pros | Cons |
|----------|------|------|
| **Explicit name list** (Query 2) | Precise, zero false positives | Requires maintenance as D365 adds agents |
| **Pattern prefix** (Query 3) | Future-proof for new D365 agents | Risk of false positives on custom agents with similar names |
| **Combined** (name list + patterns) | Best coverage | Slightly more complex query |

Our recommendation: start with the explicit name list for accuracy, then layer pattern matching on top as a safety net for whatever Microsoft ships next.

## Give everyone the number, not just the query

Queries are great when you're the one running them. But leadership doesn't open Resource Graph Explorer, and your makers shouldn't have to either. Once that filtering query is returning a clean list, there are two easy ways to turn it into something the rest of your org can actually look at.

### Option 1: A static dashboard you drop your export into

Run the filtering query, hit **Download as CSV** in Resource Graph Explorer, and drop that file into a single-page dashboard. No auth, no backend, no setup. It parses the CSV right in the browser and gives you KPI cards, top environments, an authoring-tool breakdown, and a filterable table.

![A static HTML dashboard showing KPI cards, environment and authoring-tool charts, and a filterable table of custom agents](/assets/posts/finding-every-agent-in-your-tenant/dashboard-preview.png){: .shadow w="800" }
_The static dashboard: drop in a CSV export and get instant KPIs, charts, and a searchable table. Nothing leaves the browser, which makes it easy to share or screenshot for a deck._

It's a snapshot rather than a live view, but that's exactly what you want for a quick leadership readout. Try the [live demo](https://mmonisha.github.io/agent-inventory-explorer/) (it loads with sample data), or grab the [single HTML file from GitHub](https://github.com/mmonisha/agent-inventory-explorer) and drop in your own CSV export.

### Option 2: A live canvas app

When a snapshot won't cut it and people need numbers that are current to the minute, wrap the same query in a **Power Apps canvas app** that anyone with the right admin role can open and run on demand. No KQL, no portal, just a button.

![The Agent Inventory Explorer canvas app showing KPI cards, filters, and a gallery of custom agents](/assets/posts/finding-every-agent-in-your-tenant/app-preview.png){: .shadow w="800" }
_The canvas app: five KPI cards up top, live filtering by authoring tool and orchestration, and a gallery of every custom agent in the tenant, pulled live rather than from a snapshot._

Same filter, same insight, but now it's a thing you can hand to someone. Click **Run Query**, get live counts, filter by environment or authoring tool, and read off the leadership number without anyone touching Azure. Whoever opens it needs their own Power Platform admin role, since the query runs as the calling user, so it's worth making sure [users can create the connection it relies on]({% post_url 2025-11-14-unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents %}).

To run it in your own tenant, grab the [managed solution from GitHub](https://github.com/mmonisha/agent-inventory-explorer/releases/tag/canvas-app-v1.0.0.1), import it, and create your own connection on the way in. Nothing tenant-specific travels with it, so it scopes straight to your agents on the first run.

#### One gotcha worth knowing: wrap the connector in a flow

You'd think you could drop the **Power Platform for Admins V2** connector straight into the canvas app and call it a day. You can't. Canvas apps translate connector metadata to WADL, which can't represent the array-typed parameters that the `QueryResources` action needs. You'll hit this:

```text
Error retrieving WadlMetadata
DocumentParsingException: Parameter with type='array' is not currently supported
```

> The fix: put the connector in a **Power Automate flow** (flows use Swagger directly, so arrays work fine) and have the app call the flow with `AgentInventoryFlow.Run()`. The flow runs the query, returns the JSON, and the app parses it. Same data, one extra hop. If you want to go further with building UI on Copilot Studio, we've also covered [embedding agents directly in canvas apps]({% post_url 2026-04-17-embed-copilot-studio-agents-canvas-apps %}).
{: .prompt-tip }

## What's next

1. **Try the queries yourself.** Open [Azure Resource Graph Explorer](https://portal.azure.com/#view/HubsExtension/ArgQueryBlade) and paste any of the queries above. You'll have accurate custom agent counts in minutes.

2. **Automate with Power Automate.** Use the [Power Platform for Admins V2](https://learn.microsoft.com/en-us/connectors/powerplatformadminv2/) connector's "Query Power Platform resources" action with the same filtering query. Schedule it weekly so leadership gets a clean report without anyone logging into a portal.

3. **Make it visual.** Turn the query into something your org can actually use: a static dashboard you feed with a CSV export, or a live canvas app that pulls on demand. Either way, leadership gets accurately-filtered counts without running a single line of KQL.

The data to answer "what did we actually build?" has been in your tenant the whole time. What's been missing is a clean way to separate the agents your teams shipped from the system noise around them, and until Admin Center grows a native "system vs. custom" split, the exclusion list and the queries here are how you get an honest number today. One filter, applied wherever the person asking happens to be looking.

So point the filtering query at your own tenant. The first time the real count comes back as a rounding error next to what PPAC was reporting, you'll see why it's worth the ten minutes. When it does, tell us what turned up: an agent we haven't catalogued, a tenant that surfaced something odd, or the number that finally made a governance conversation easy. The picture only gets sharper with more tenants looking.
