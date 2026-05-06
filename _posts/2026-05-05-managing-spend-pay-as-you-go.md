---
layout: post
title: "Herding Clouds: Taming Pay-As-You-Go Billing Policies in Power Platform at Scale"
date: 2026-05-05
categories: [copilot-studio, licensing]
tags: [consumption, azure-paygo, copilotstudio]
description: "How do you manage Azure consumption when using Pay as you go with Copilot Studio?"
author: rranjit
image:
  path: /assets/posts/managing-spend-pay-as-you-go/header.png
  alt: "A person staring in horror at the bill ticker at a gas station"
---



# Herding Clouds: Taming Pay-As-You-Go Billing Policies in Power Platform at Scale
*The pain (in the budget) will leave once it finishes teaching you…hang tight, this might be the last lesson....*

---

So. You've embraced Pay-As-You-Go (PAYG) for Power Platform and Copilot Studio. Congratulations — you're now enjoying the beautiful freedom of consumption-based billing, where every maker in your organization can spin up AI-powered flows and agents without needing a license purchase order approved by three committees and a notary.

And then the bill arrived.

Not a *catastrophic* bill, necessarily. But enough to make you sit up straight, squint at your Azure Cost Management dashboard, and mutter something unprintable....

This is the blog post for you.

We're going to walk through two very practical things:

1. **Bulk-assigning environments to billing policies by name** — because pointing-and-clicking through the Power Platform Admin Center for 47 environments is not a career strategy.
2. **Automatically unlinking environments from billing policies when your budget threshold is breached** — because automated guardrails are more reliable than hoping someone notices the alert email before the weekend.

Let's go.

---

## A Quick Refresher: What Are Billing Policies?

Think of a billing policy as the financial passport for your Power Platform environments. It links an environment to an Azure subscription, which is how PAYG consumption — Copilot Studio message packs, AI Builder credits, and the like — gets charged back. Without a billing policy linked, an environment falls back on seeded capacity or simply can't access the premium features.

Managing these by hand is fine when you have three environments. When you have thirty? Or three hundred? That's when you start writing PowerShell at 11 PM and questioning your career choices.

---

## Part 1: Bulk-Assigning Billing Policies (Without Losing Your Mind)

### The Problem

Billing policies connect your environments to an Azure subscription for PAYG consumption. The Admin Center UI is perfectly fine for three environments. But if you're an enterprise admin staring down a CSV of 50+ environments that all need assigning — possibly to *different* billing policies — the manual approach starts to feel less like administration and more like a punishment.

### What You Need

- **Azure CLI** installed and authenticated (`az login`)
- A user account with **Power Platform Admin**, **Global Admin**, or **Dynamics 365 Admin** role
- Your environments in a CSV file
- This nifty little script: [bulk-assign-billing-policy.ps1](https://github.com/rranjit83/AgentDemoSamples/blob/main/CustomEngineBlogPosts/manage-paygo/scripts/bulk-assign-billing-policy.ps1)

### The CSV Format

The script expects a simple four-column CSV:

```csv
EnvironmentName,EnvironmentID,BillingPolicyName,Status
Sales-Production,,ProductionBillingPolicy,
Marketing-Sandbox,a1b2c3d4-...,DevBillingPolicy,
HR-Production,,ProductionBillingPolicy,
Finance-Sandbox,,Finance-BillingPolicy,
Legal-Production,b2c3d4e5-...,Sales-BillingPolicy,
```

A few things worth noting:

- **EnvironmentID is optional.** If you leave it blank, the script resolves it from the display name automatically by querying your tenant. Particularly useful when you're working from a list of display names rather than GUIDs.
- **BillingPolicyName must match exactly** what you see in your tenant. The script validates all policy names up front and will fail loudly — before touching anything — if a name doesn't exist.
- The **Status column** starts blank; the script fills it in with `Succeeded` or `Failed: <reason>` after each run.

### Running the Script

**Preview first (highly recommended for your blood pressure):**

```powershell
.\bulk-assign-billing-policy.ps1 -InputFile ".\environments.csv" -DryRun
```

The `-DryRun` flag shows you exactly what would happen without making a single API call:

```
Row 1 [Sales-Production]: Would link abc123... -> ProductionBillingPolicy (def456...)
Row 2 [Marketing-Sandbox]: Would link xyz789... -> DevBillingPolicy (ghi012...)
```

**Then run it for real:**

```powershell
.\bulk-assign-billing-policy.ps1 -InputFile ".\environments.csv"
```

### What the Script Actually Does

The script runs in six stages, helpfully numbered and color-coded in the console because nobody wants to guess where a failure happened:

**Step 1 — Verify Azure CLI login.** It tells you who you're logged in as, so you don't accidentally run it as the wrong account. We've all been there.

**Step 2 — Load and validate the CSV.** Checks that all four required columns are present. Missing column? Fails fast with a clear error. No silent failures.

**Step 3 — Resolve billing policies.** Fetches your full list from `https://api.powerplatform.com/licensing/billingPolicies` *once* and builds a name-to-ID lookup. You reference policies by their human-readable names in the CSV — no copy-pasting GUIDs like it's 2008. It also warns you if any referenced policy is not in `Enabled` status:

```
Found: ProductionBillingPolicy -> b1234567-... (Enabled)
Found: DevBillingPolicy        -> c2345678-... (Enabled)
```

**Step 4 — Resolve environment IDs.** For rows missing an `EnvironmentID`, it fetches all environments in your tenant with proper pagination for large tenants, then matches by display name. For rows with IDs already populated, it validates up to 20 individually; beyond that, it trusts you and lets the linking step catch errors naturally. Rate limits are real.

**Step 5 — Link environments to billing policies.** For each valid row, it POSTs to the Power Platform API to associate the environment with its billing policy. Each row gets a `Succeeded` or `Failed: <reason>` status written back immediately.

**Step 6 — Write results back to the CSV.** Your CSV now has a populated `Status` column — resolved IDs, outcome for every row. You have an audit trail. Your future self will thank you.

The final summary tells you exactly where things stand:

```
════════════════════════════════════════════════════
  SUMMARY
════════════════════════════════════════════════════
  Total rows:   5
  Succeeded:    4
  Failed:       1
  Skipped:      0
```

### The "Only Production and Sandbox" Rule

One thing worth knowing: only **Production** and **Sandbox** environments can be linked to PAYG billing policies. Developer, Trial, and Default environments are not eligible. If the script encounters an ineligible environment type, it marks the row as `Failed: EnvironmentType <type> not supported` and moves on without stopping the whole run.

This is a platform constraint, not a script limitation. Plan your CSV accordingly.

---

## Part 2: Automatically Unlinking Environments When You Hit Your Budget

### The Problem (Now With More Existential Dread)

Assigning environments to billing policies is the easy direction. The harder question is: **what happens when spend exceeds your budget?** Do you want Copilot Studio conversations to keep flowing after you've blown past your monthly limit?

The honest answer, without automation, is: someone gets an email. That email may or may not be read before Monday. 

The solution is to wire up an **automatic unlink** — when a budget threshold is breached, the system removes environments from the billing policy automatically, stopping further PAYG consumption. No human reaction time required.

We're going to show you how to do this using Azure Budgets as the tripwire, an Azure Automation Account as the bridge, and Power Automate doing the actual Power Platform heavy lifting.

---

### The Architecture

Here's the cast of characters:

| Component | Role |Link | 
|---|---|---|
| **Azure Budget** | Watches your spending and fires an alert when a threshold is crossed | [What is an Azure Budget?](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets?tabs=psbudget)
| **Azure Action Group** | Routes the alert as a webhook payload to your Automation Account | [What is an Azure Action Group?](https://learn.microsoft.com/en-us/shows/azure-friday/azure-monitor-action-groups)
| **Azure Automation Account** | Hosts the runbook; bridges the Azure alerting world and the Power Platform world | [What is an Azure Automation Account?](https://learn.microsoft.com/en-us/azure/automation/automation-security-overview)
| **Azure Automation Runbook** | Parses the alert payload, acquires a token, calls Power Automate |[UnlinkBillingPolicyRunbook.ps1](https://github.com/rranjit83/AgentDemoSamples/blob/main/CustomEngineBlogPosts/manage-paygo/scripts/UnlinkBillingPolicyRunbook.ps1)
| **Power Automate HTTP Flow** | Receives the call from the runbook; delegates to the child flow |[Download Solution](https://github.com/rranjit83/AgentDemoSamples/blob/main/CustomEngineBlogPosts/manage-paygo/solution/BillingPolicyManagement_1_0_0_3.zip)
| **Power Automate Child Flow** | Finds the billing policy by name and unlinks all environments |[Download Solution](https://github.com/rranjit83/AgentDemoSamples/blob/main/CustomEngineBlogPosts/manage-paygo/solution/BillingPolicyManagement_1_0_0_3.zip)

Each component does exactly one thing. The whole chain is event-driven — no polling, no scheduled tasks, no hoping.

---

### Step 1: The Azure Budget Alert

In Azure Cost Management, create a Budget scoped to the subscription and resource group associated with your billing policy. Set a threshold — say, 80% of your monthly budget — and configure an **Action Group** to trigger on that threshold. The Action Group is what converts "a threshold was crossed" into "something actually happens." Configure it with a **webhook action** pointing to your Azure Automation runbook's webhook URL.

When the budget fires, Azure sends a webhook payload in the **Azure Monitor Common Alert Schema**:

```json
{
  "schemaId": "azureMonitorCommonAlertSchema",
  "data": {
    "essentials": {
      "monitoringService": "CostAlerts",
      "alertId": "/subscriptions/8be5abeb-.../resourceGroups/MyResourceGroup/...",
      "firedDateTime": "2026-04-24T15:44:27Z",
      "description": "Your spend for budget prodbilling is now $4.00 exceeding your specified threshold $1.60."
    },
    "alertContext": {
      "AlertData": {
        "BudgetName": "prodbilling",
        "BudgetThreshold": "$2.00",
        "NotificationThresholdAmount": "$1.60",
        "SpentAmount": "$4.00"
      }
    }
  }
}
```

The `alertId` field encodes the subscription ID and resource group in its path — a detail the runbook exploits with some string surgery.

---

### Step 2: The Azure Automation Runbook

Your Azure Automation Account hosts a PowerShell runbook. It does four things:

**1. Parses the webhook payload**

```powershell
$alertId           = $WebhookData.data.essentials.alertId
$subscriptionId    = ($alertId -split '/')[2]
$resourceGroupName = ($alertId -split '/')[4]
```

It extracts the subscription ID and resource group directly from the alert ID path — array indexing on a split string, no regex required.

**2. Authenticates using Managed Identity**

```powershell
Connect-AzAccount -Identity
```

This is the elegant part. The Automation Account has a **System-Assigned Managed Identity** with Power Platform Admin rights. No passwords. No service principal secrets in a config file. No awkward conversations with your security team. The identity is managed by Azure, rotated automatically, and scoped to exactly what it needs.

**3. Gets an Entra token for Power Automate**

```powershell
$aud = "https://service.flow.microsoft.com/"
$EntraToken = Get-AzAccessToken -ResourceUrl $aud
$Token = $EntraToken.Token | ConvertTo-SecureString -AsPlainText
```

**4. Calls the Power Automate HTTP flow**

```powershell
$payload = [pscustomobject]@{
    resourceGroupName = $resourceGroupName
    subscriptionid    = $subscriptionId
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post -Authentication Bearer -Token $Token `
    -Uri $FlowHttpUrl -Body $payload -ContentType 'application/json'
```

It POSTs the resource group and subscription context to a Power Automate flow behind an HTTP trigger. The flow takes it from there.

---

### Step 3: The Power Automate Solution

This is where things get genuinely interesting. The Power Automate side is packaged as an **importable solution** — `BillingPolicyManagement.zip` — that you drop straight into your environment. It contains:

- A **custom connector** for the Power Platform Licensing API (for listing billing policies by name — this isn't natively in the Admin V2 connector)
- An **HTTP endpoint flow** that acts as the entry point from the runbook
- A **child flow** that does the actual unlinking work

#### The HTTP Endpoint Flow

This flow receives the resource group name and subscription ID from the runbook, then delegates immediately to the child flow. Having a separate child flow matters: it can also be triggered manually, useful for testing or for scenarios where you want to unlink a policy without the full Azure alerting path.

#### The UnlinkAllEnvironmentsFromBillingPolicy Flow

This is the workhorse. Here's exactly what it does:

1. **Lists all billing policies** via the custom connector (`GET /licensing/billingPolicies`)
2. **Finds the policy matching the name** passed as input — by friendly name, not GUID
3. **Gets all environments linked to that policy** using the Power Platform Admin V2 connector
4. **For each environment, calls `RemoveBillingPolicyEnvironment`** to unlink it
5. **Builds an audit log string** recording every operation
6. **Returns HTTP 200** with the full audit log as the response body

The result looks like this:

```
Found Policy with name: prodbilling (Guid: abc-123...).
Retrieving list of linked environments.
Unlinked Environment: env-abc-123 from prodbilling (GUID: abc-123...)
Unlinked Environment: env-def-456 from prodbilling (GUID: abc-123...)
```

From budget threshold breach to all environments unlinked — entirely automated, with a full audit trail in the flow run history.

---

### The End-to-End Picture

```
Azure Budget Alert fires (spending threshold exceeded)
        │
        ▼
Azure Action Group → Automation Account webhook receives alert payload
        │
        ▼
Runbook: Extract subscription + resource group from alertId path
Runbook: Authenticate via Managed Identity (no secrets)
Runbook: POST to Power Automate HTTP trigger
        │
        ▼
HTTP Flow: Receive subscription + resource group → resolve billing policy name
Child Flow: List all billing policies → match by name
Child Flow: List all linked environments
Child Flow: Loop → unlink each environment
Child Flow: Return operation log
        │
        ▼
Environments unlinked — Copilot Studio messages stop billing to this policy
```

The whole chain from alert to unlinked takes under a minute.

---

### Testing Without Waiting for a Real Budget Breach

You don't have to blow past an actual budget to test this. The repo includes a [Webhooktestdata.json](https://github.com/rranjit83/AgentDemoSamples/blob/main/CustomEngineBlogPosts/manage-paygo/samples/Webhooktestdata.json) file — a realistic Azure Monitor Common Alert Schema payload pre-loaded with a simulated breach scenario (budget: $2.00, threshold: $1.60, spent: $4.00) and [script](https://github.com/rranjit83/AgentDemoSamples/blob/main/CustomEngineBlogPosts/manage-paygo/scripts/TestRunbook.ps1) to trigger an alert.

Trigger the runbook manually against it:

```powershell
az automation runbook start `
    --name UnlinkBillingPolicies `
    --resource-group Azurevnetforpowerplatform `
    --automation-account-name RRANJITBillingPolicy `
    --parameters webhookData='@./Webhooktestdata.json'
```

This validates the entire chain end-to-end — runbook parses payload, calls Power Automate, flow unlinks environments — without needing to exceed an actual budget. Your finance team will appreciate this.

---

## Pros and Cons of This Approach

Let's be honest about what you're signing up for.

### Pros

| | |
|---|---|
| **No stored credentials** | The Managed Identity pattern means zero secrets to manage, rotate, or accidentally commit to git. The Azure-side identity is fully managed by the platform. |
| **Event-driven** | Nothing polls. Nothing runs on a schedule hoping to catch a breach. The budget alert fires, the chain executes, and it's done. |
| **Separation of concerns** | Azure handles budget watching; Power Platform handles environment management. Each service does what it's designed for. |
| **Name-based, not GUID-based** | Both the assignment script and the unlinking flow work with human-readable policy names. No GUIDs in your CSV, no GUIDs in your runbook parameters. |
| **Auditable at every layer** | The CSV from Part 1 is your linking receipt; the Power Automate run history is your unlinking receipt. Finance and compliance teams appreciate this. |
| **Testable without real risk** | `-DryRun` for bulk assignment, `Webhooktestdata.json` for the alert chain. You can validate the entire pipeline end-to-end before anything is live. |
| **Battle-tested infrastructure** | Azure Budgets, Automation Accounts, and Action Groups are mature, enterprise-grade services with SLAs and monitoring built in. |

### Cons

| | |
|---|---|
| **Azure expertise required** | Setting up Automation Accounts, configuring Managed Identities, wiring Action Groups to webhooks — none of this is difficult, but it does require someone comfortable in the Azure portal. Your Power Platform admin and your Azure admin may be different people. |
| **Multiple services to manage** | You now own an Automation Account, a runbook, an Action Group, a Budget alert, and a Power Automate solution. Each has its own lifecycle, update path, and failure mode. |
| **Two permission boundaries** | The Managed Identity handles Azure-side auth; the Power Automate connection credentials handle the Power Platform side. Understanding where each layer's permissions live (as we covered above) is not immediately obvious. |
| **Azure costs** | Automation Account job execution isn't free at scale. For low-frequency budget alerts it's negligible, but it's another line item to explain. |
| **PowerShell for bulk assignment** | Part 1 still requires someone to run a PowerShell script locally. Not every Power Platform admin is equally comfortable at a terminal. |
| **No self-service** | A maker or environment owner can't trigger or configure any of this themselves. It's an admin-only, infrastructure-level setup. |
| **Budget alerts are not real-time** | For the vast majority of PAYG scenarios, this architecture is a robust and reliable spending guardrail. But Azure Cost Management data carries an 8–24 hour delay, and budget alert evaluation is periodic — not continuous. Now imagine a developer who accidentally builds a flow that reasons over a large PDF in an infinite loop. That flow starts burning through Copilot Studio messages or AI Builder credits at speed, and this solution won't catch it before serious damage is done. By the time the alert fires, the overspend has already happened. This is a known ceiling on the approach, not a bug — but it's worth knowing where that ceiling is. |

---

## What You Now Have

Let's recap:

- A **PowerShell script** that bulk-assigns any number of environments to billing policies in one run, using friendly names instead of GUIDs, with dry-run preview and CSV audit output.
- An **Azure Budget + Automation Account + Power Automate** pipeline that automatically unlinks environments the moment a budget threshold is crossed — no human in the loop, no Monday morning surprises.

This is a solid, production-ready governance setup for PAYG billing in Power Platform. It handles the two biggest operational headaches: getting environments *onto* policies efficiently, and getting them *off* automatically when spending runs hot.

---

## Coming Up Next: All the Pros. None of the Cons.

Look back at that cons list. Nearly every item on it comes from the same root cause: **we brought Azure infrastructure into a Power Platform problem.**

What if we didn't?

What if the entire pipeline — cost monitoring, threshold evaluation, policy management, and environment unlinking — lived entirely within **Power Platform itself**? No Automation Accounts to provision. No runbooks to maintain. No Action Groups to wire up. No Azure portal navigation required. No PowerShell terminal. No permission boundary confusion between two different identity systems.

In the next installment, we're going to build exactly that: a fully native Power Platform solution that uses scheduled cloud flows, the Azure Cost Management API, and the Power Platform Admin connector to create a self-contained, serverless PAYG governance system. Everything a maker or admin needs lives in one importable solution.

Here's the teaser: every con on that list has an answer in the low-code version. The architecture is simpler. The setup is faster. The ongoing maintenance is lighter. And — perhaps most importantly — it puts control in the hands of Power Platform admins rather than requiring a collaboration with Azure infrastructure teams.

Think of it as the citizen developer's revenge on operational complexity.

Spoiler: it's more capable than you'd expect, and considerably more satisfying to demo to a room full of Azure engineers.

Stay tuned.

---

*Scripts, solution files, and sample data referenced in this article are available in the accompanying repository. All scripts include `-DryRun` support. Test in a non-production environment first — your billing team's mental health may depend on it.*

