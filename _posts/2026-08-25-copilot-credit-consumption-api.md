---
layout: post
agent_edition: both
title: "Where Are Your Copilot Credits Going? Build a Tenant-Wide View with the Power Platform API"
date: 2026-08-25
categories: [copilot-studio, governance]
tags: [copilot-studio, governance, billing, licensing, cost management, power-platform-api, dataverse]
description: "Use the Power Platform API to retrieve daily Copilot Credit consumption per agent, persist it in Dataverse, and build tenant-wide dashboards."
author: PetrosFeleskouras
image:
  path: /assets/posts/copilot-credit-consumption-api/header.png
  alt: "Copilot Credit consumption flowing through the Power Platform API into Dataverse and a custom dashboard."
---

The Power Platform admin center provides out-of-the-box reports on your tenant's Copilot Credit consumption under **Licensing > Copilot Studio** ([Manage Copilot Credits and capacity](https://learn.microsoft.com/en-us/power-platform/admin/manage-copilot-studio-copilot-credits-capacity)). For many organizations, these reports should be the starting point. You can read them, but you can't reshape them or own the underlying rows.

That becomes a problem the moment you want anything beyond the headline: a trend line for one agent that also shows which channels drove its consumption, a billed-vs-non-billed split, or a history that outlives the reporting window. It matters even more now that the GitHub Copilot harness charges credits while makers build, preview, and evaluate agents, not only when an agent is running in production.

This post covers the Power Platform licensing endpoints that expose tenant capacity and per-resource consumption, the details that matter when calling them, and the community solution that turns the results into a daily history in Dataverse.

> **Companion piece.** For the other half of cost management, allocating capacity, setting per-agent limits, and enforcing them, my colleague **Lewis Baybutt** wrote [Adopting the GitHub Copilot Harness: Cost Control and Governance in Copilot Studio]({% post_url 2026-08-07-copilot-harness-cost-governance %}). Read it alongside this one: it shows how to put boundaries on the consumption you're about to make visible.
{: .prompt-info }

> **The sample.** This community solution is not a replacement for PPAC reporting. It is intended for organizations that have a specific reason to retrieve the API data, retain it in Dataverse, and build their own reports. Everything here is implemented in [copilot-credit-consumption](https://github.com/PetrosFeleskouras/copilot-credit-consumption), a daily flow, three Dataverse tables, a security role, and a Power Apps Code App, deployable from a single solution import. The validated V2 packages are available in the [v2.0.0 release](https://github.com/PetrosFeleskouras/copilot-credit-consumption/releases/tag/v2.0.0).
{: .prompt-tip }

What's covered:

| | Topic | In short |
|---|---|---|
| 1 | The Power Platform API | Retrieve tenant capacity and daily per-agent consumption |
| 2 | The community solution | Keep the data in Dataverse and turn it into dashboards |

## #1 Retrieve and understand Copilot Credit consumption per agent

When you need to build your own reporting experience, the [Microsoft Power Platform API](https://learn.microsoft.com/rest/api/power-platform/) exposes tenant capacity and daily resource consumption through `https://api.powerplatform.com`.

**[Tenant capacity](https://learn.microsoft.com/rest/api/power-platform/licensing/entitlement/get-entitlement).** This route returns entitled, allocated, consumed, available, status, and pay-as-you-go values for Copilot Credits:

```http
GET https://api.powerplatform.com/licensing/entitlements/MCSMessages?api-version=2024-10-01
```

The response also includes the latest completed usage date, which tells your integration how current the detailed consumption data is.

**[Per-agent consumption](https://learn.microsoft.com/rest/api/power-platform/licensing/entitlement-insight/get-tenant-resources-across-environments).** This route returns resource-level consumption for a date range. Requesting one date at a time gives you a clean daily history:

```http
GET https://api.powerplatform.com/licensing/entitlements/MCSMessages/resources
    ?fromDate={yyyy-MM-dd}
    &toDate={yyyy-MM-dd}
    &includeFields=users%2Ctags%2CasOfDate
    &pageSize=5000
    &continuationtoken={token}
    &api-version=2024-10-01
```

The API can return multiple rows for an agent on the same day when dimensions such as channel, feature, model, or environment differ. Follow the continuation token until all pages have been retrieved, then aggregate the rows according to the question your report needs to answer.

**What you get back.** The resource response can provide:

| Information | How it helps |
|---|---|
| Agent ID and display name | Identify and compare individual agents |
| Environment ID | Group consumption by environment |
| Usage date | Build daily trends and retain history |
| Billed and non-billed credits | Understand what draws down capacity and what the API reports separately |
| Reported users | Add adoption context at the returned row's grain |
| Feature, tool, model, channel, and knowledge source | Explain what contributed to consumption when the source supplies those dimensions |

Environment names are not included in the consumption rows, but you can resolve their IDs with the [environment-management route](https://learn.microsoft.com/rest/api/power-platform/environmentmanagement/environments/list-environments-for-user):

```http
GET https://api.powerplatform.com/environmentmanagement/environments?api-version=2024-10-01
```

Together, these endpoints let you build a tenant-wide daily history, compare agents and environments, separate billed from non-billed consumption, and add channel or other dimensional context where it is available.

> **Harness-specific telemetry.** Standard harness agents can provide feature, tool, model, channel, and knowledge-source detail. GitHub Copilot harness agents currently report the feature as `Process Agent` and do not provide tool, model, or knowledge-source values. Blank values for those fields reflect the source telemetry, not missing data in your integration.
{: .prompt-info }

> **Support boundary.** The core routes and response models are documented by Microsoft. Some optional rich metadata is not fully described in the public reference, so test the fields your reporting depends on when you update the integration.
{: .prompt-info }

## #2 Persist the data and build dashboards with the community solution

Calling the API answers today's questions. Persisting its responses gives you a history you can reuse, compare, and report on over time. The [copilot-credit-consumption community solution](https://github.com/PetrosFeleskouras/copilot-credit-consumption) packages that pattern into Power Platform.

At a high level, it works like this:

1. A scheduled Power Automate flow calls the capacity, resource-consumption, and environment endpoints each day.
2. The first run brings in up to 180 days of history. Later runs refresh the most recent seven days so source updates are reflected automatically.
3. Dataverse stores the detailed consumption history, tenant capacity snapshots, and the latest sync status in three purpose-built tables.
4. The included Power Apps Code App reads those tables and turns the stored data into an interactive dashboard.

Because the data now lives in Dataverse, it is no longer limited to one API response or one fixed report. You can retain the history according to your own policy, control access through a read-only security role, and connect Power BI, Excel, or another application to the same tables.

The included dashboard provides capacity status, billed and non-billed trends, leading agents and environments, flexible filters, detailed records, and Excel export. Where the API supplies channel or other rich metadata, those dimensions can also be used to explain an agent's consumption over time.

The full solution, including the daily flow, Dataverse tables, security role, and Code App, is available in the [v2.0.0 release](https://github.com/PetrosFeleskouras/copilot-credit-consumption/releases/tag/v2.0.0).

> **Community solution.** Built entirely with standard Power Platform components, the package can be inspected during import and deployed through your organization's usual Power Platform process.
{: .prompt-tip }

## Wrapping up

- **Start with PPAC.** Its out-of-the-box reports should meet the needs of many organizations.
- **Build when you need something different.** If you need your own reporting experience, the API and community solution provide a path to create it.
- **The Power Platform API provides the source.** It exposes tenant capacity, daily per-agent consumption, and the dimensions needed to understand where credits are being used.
- **The available detail depends on the harness.** Standard harness agents can provide richer dimensions, while GitHub Copilot harness agents currently provide a more limited view.
- **The community solution makes the data reusable.** Its daily flow stores consumption, capacity, and sync information in Dataverse so the history remains available beyond a single API call.
- **You choose the reporting experience.** Use the included Code App or connect Power BI, Excel, or another application to build the views your administrators need.

Running Copilot Studio at scale? How are you tracking consumption today, the admin center or a history you've built yourself?