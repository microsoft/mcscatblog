---
layout: post
agent_edition: github-copilot
title: "Adopting the GitHub Copilot Harness: Cost Control and Governance in Copilot Studio"
date: 2026-08-07
categories: [copilot-studio, governance]
tags: [copilot-studio, governance, billing, licensing, cost management]
description: "The essentials and scalable controls for managing cost when enabling makers to build on Copilot Studio with consumptive billing as the option for GHCP agents. Allocate, set limits, rules and don't let users consume whatever they like without careful cost ownership."
author: lewisdoesdev
image:
  path: /assets/posts/copilot-harness-cost-governance/header.png
  alt: "A cat accountant at a desk approving AI agent funding requests. Small robot agents queue with paperwork while budget records, governance checklists, ownership folders, and maker, departmental, and enterprise agent trays represent cost management and governance controls."
---

As AI agents become more capable, consumption is becoming a more important part of how organizations plan and govern their use. The [GitHub Copilot harness in Copilot Studio]({% post_url 2026-07-07-new-orchestrator-resources %}) enables organizations to deliver high-quality agents that support complex business processes. For administrators, it increases the need to have a clear FinOps strategy and governance controls that can answer questions like:
- "Who is allowed to create an agent?"
- "Where can that agent consume Copilot Credits?"
- "How many credits can that agent consume?"
- "Who owns the consumption for that agent?"

Underpinning them all is another: "What is the build scenario we're actually talking about?". Without that context, the previous four answers become guesses or generic standards, leading to fragmented governance and no scalable model.

In this post, we take a look at a couple of risk scenarios when the build involves consumptive billing, and discuss the top priority governance controls for Copilot Studio to review and configure to ensure you have a handle on agent cost in your organization.

## Start with what you want to achieve, and then assess the risks to handle

The easiest way to approach cost control appropriately is to begin with what can go wrong. That said, simply reviewing the risk and applying a control doesn't lead to an environment that correctly balances enablement and control for safely delivering value with agents. First, begin with what you want to achieve, then assess the risk that comes with it. Are you:
- Trying to enable makers to build limited capability, simple agents to help them with small business processes in their team?
- Building more complex business process agents that work for entire departments or the organization in focused projects?

Each scenario comes with different risks, with similar controls to apply but in different ways to achieve the risk balance of control and achievable value.

### Scenario 1: Enabling makers to self-solution the problems in their own workflows

 > **The first scenario:** you want to enable makers with the autonomy to self-build agents for their use cases, while managing the bill. You might want to, or perhaps have given a large group of makers access to the platform so they can do this. 
 {: .prompt-info }

> **The potential risk:** A maker uses chat on the Copilot Studio homepage to create an agent that uses the GitHub Copilot harness, tries several instruction variants, adds knowledge and tools, and repeatedly tests the result. They reasonably run evaluations before deciding to rely on the agent going forward. Other members of the team do the same. None of these agents support a strategic business priority or are approved for formal production deployment at some point, but testing via preview and evaluation are real interactions and **contribute to consumptive-based cost.** With no control in place the maker consumes as much as they'd like, with the bill directly charging to a subscription for the owner to pay the bill against, consumption exhausting the tenant pool, or consuming all the shared credits allocated to the environment.
{: .prompt-warning }

The risk isn't solved by discouraging testing or removing access to create. This just blocks the scenario you first wanted to achieve. Instead, give makers an explicit development boundary, a limit to the credits they can consume, make the cost owner visible, and decide in advance what should happen when that boundary is reached.

### Scenario 2: Production LOB process agents

> **Another approach:** You want to share production agents delivered through intentional, focused projects out to a broad audience or group of people who jointly input to or rely on a process, while managing cost and controlling the purpose of those environments so the cost incurred, continues to only stem from what the cost owner intended to fund.
 {: .prompt-info }

> **The potential risk:** not high cost from a scaled maker audience testing out less sensible use cases, provided the environment is intentionally scoped with careful access control. It is production consumption without accountable ownership, awareness of the uptime criticality for specific agents, lack of release control against the production environment and hence the chance of either a bill more expensive that someone expected, or the consumption of credits other people were relying on for their agents.
{: .prompt-warning }

# Approaching governance controls and tooling 

## Inventory as a common baseline

Similar to most governance concepts, be it access, risk assessment, business justification understanding, feature availability and more, effectively managing cost controls for agents, starts with a reliable and extensible inventory. Your agent inventory lets you answer technical questions like which harness an agent uses, as well as business questions like what the scenario is (maker or project led) and who owns the cost.

Start with the [Power Platform Inventory](https://learn.microsoft.com/en-us/power-platform/admin/power-platform-inventory), which Microsoft make available through the Power Platform admin center (PPAC), and [programmatic options](https://learn.microsoft.com/en-us/power-platform/admin/power-platform-inventory#programmatic-access) like [ARG](https://learn.microsoft.com/en-us/power-platform/admin/inventory-sample-queries) and the [Power Platform API](https://learn.microsoft.com/en-us/power-platform/admin/inventory-api). For organizations with a couple of environments and small collection of agents, PPAC is the best place to start. For enterprises managing several hundreds of environments and even more agents, programmatic methods are necessary.

### What inventory enables for governance and cost management

With access to an inventory of environments in your tenant, and agents that sit within them, you can more easily build the view of purpose and control against both of those scopes. Without it, it isn't feasible at scale to manage and automate where limits are placed, credits are assigned and base those and other controls on the actual scenario at hand instead of a generic approach that doesn't fit the real building you want to enable.

The example below uses a simple **zoned governance** model. A shared maker environment sits in a green zone with a development-oriented policy profile, while an enterprise production environment sits in a more restrictive red zone. The zone is not the control itself. It is inventory metadata that lets policy automation select the governance controls, funding compliance guardrails, and billing processes for that environment and the agents inside it. An example could be whether or not the environment adopts the organization's chargeback model and to what scope depending on the zone and purpose.

![Environments and agents connected through inventory to the agent owner, cost owner, and budget.](/assets/posts/copilot-harness-cost-governance/inventory-ownership-model.png){: .shadow w="1200" }
_Inventory combines zone, scenario, ownership, and funding metadata so repeatable processes can apply the appropriate controls._

[Copilot Studio Kit]({% post_url 2026-03-06-copilot-studio-kit %}) and [Compliance Hub](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-compliance-hub) provide a ready to use and extendable example of how Power Platform Inventory can be used in conjunction with additional governance metadata and questions to define the controls that apply to each agent specifically, while doing it at scale. Governance at scale only works with automation and scenario-based rules, like those set with [environment group rules](https://learn.microsoft.com/en-us/power-platform/admin/environment-groups-rules).

## Enable and govern with PPAC & Power Platform API 

Once you have a view of the environments in the organization and those operating with agents in them, it's time to [enable usage with credits](https://learn.microsoft.com/en-us/power-platform/admin/manage-copilot-studio-messages-capacity). Organizations use Copilot credit capacity packs, the pre-purchase plan or PAYG to enable and fund credit consumption for agents and other AI workloads. Each are configured and managed differently.

If you have pre-paid credit packs, these operate on an allocation model, so the first step is allocating credits to environments, so that those credits become reserved for their intended use. Don't just allow anyone to consume whatever you paid for from the tenant pool.

> **Potential risk**: Acknowledge that when environments are created, they can default to having draw from the tenant pool enabled, so managing the tenant pool, as well as those environments is key to reducing the risk of capacity exhaustion.
{: .prompt-danger }

 Now with your view of environments, their purpose and cost owner, you're able to support a request for credits with:
 1. allocation to that environment and,
2. the additional steps that makes sense for your governance process, like chargeback for example.


> The person who can allocate credits depends on the tenant setting for add-on capacity assignments, set by the tenant administrator in PPAC. When set to 'any environment admin', both tenant and environment system administrators can update add-on assignments in the tenant. To avoid broad control over where credits get used, only allow tenant admins to allocate them. 
{: .prompt-danger }

### Assigning credits to an environment can be done in two ways:

The first way to assign credits to an environment is via PPAC. Head to https://admin.powerplatform.microsoft.com/billing/licenses/copilotStudio or PPAC ➡️ Licensing ➡️ Copilot Studio. From here, administrators can review the credits available to assign under 'Prepaid capacity' and can then reserve their usage for an environment by allocating them. Selecting 'Manage Copilot Credits' opens a pane where administrators can select an environment and then allocate credits to that environment.

![PPAC Manage capacity pane for allocating Copilot Credits and configuring environment overage controls.](/assets/posts/copilot-harness-cost-governance/manage-environment-capacity.png){: .shadow }
_Administrators can reserve prepaid Copilot Credits for a selected environment._

Allocating credits in enterprises or high scale scenarios can be better achieved with automation by using the Power Platform API. [Update Allocations By Environment](https://learn.microsoft.com/en-us/rest/api/power-platform/licensing/allocations-by-environment/update-allocations-by-environment) can be used to allocate credits to the environment needed.

In the request you must provide two things: the environmentId and a CurrencyAllocationModel object nested in a currencyAllocations array. That object should be provided with the allocation, and the currencyType which in this case is 'MCSMessages'.
```http
PATCH https://api.powerplatform.com/licensing/allocationsByEnvironment?api-version=2024-10-01
Content-Type: application/json

{
  "environmentId": "<environment-id>",
  "currencyAllocations": [
    {
      "currencyType": "MCSMessages",
      "allocated": 10000
    }
  ]
}
```
{: .nolineno}

### Set alerts, control draw down and switch to PAYG

Still working with allocated credits, one of the most important rules both for the environment itself and its cost owner, but also the wider tenant and organization are the enforcement rules used. These include:
- the alert to send admins when the environment is nearing usage,
- whether or not the environment should draw from the available capacity in the tenant,
- whether PayGo should be used as the fallback to charge usage to,
- or if agents should be denied further consumption and should stop working.

These rules can be configured both in PPAC, and using the [Power Platform API](https://learn.microsoft.com/en-us/rest/api/power-platform/licensing/allocations-by-environment/update-allocations-by-environment#enforcementrule), when allocating credits to an environment with the same [Update Allocations By Environment](https://learn.microsoft.com/en-us/rest/api/power-platform/licensing/allocations-by-environment/update-allocations-by-environment) endpoint.

> For organizations that use pre-paid credits, understanding when to use the option to draw down from the tenant pool is essential. Enabled by default, it's key to decide whether you want environments to consume available capacity or whether you want to disable that based on the types of environments people are working in. Your environment inventory will help to target the environments that this should be turned off in, like shared development environments.
{: .prompt-danger }

This example request allocates 10,000 credits similar to the previous example but also sets the enforcement rules as follows:

| Enforcement Rule | Configuration |
|------------------|---------------|
| Alert | Enabled |
| Tenant Pool Draw | Disabled |
| PayGo | Enabled |
| Deny further usage | Disabled |

```http
PATCH https://api.powerplatform.com/licensing/allocationsByEnvironment?api-version=2024-10-01
Content-Type: application/json

{
  "environmentId": "<environment-id>",
  "currencyAllocations": [
    {
      "currencyType": "MCSMessages",
      "allocated": 10000,
      "enforcementRules": [
        {
          "ruleType": "Alert",
          "enabled": true
        },
        {
          "ruleType": "TenantPool",
          "enabled": false
        },
        {
          "ruleType": "PayGo",
          "enabled": true
        },
        {
          "ruleType": "Deny",
          "enabled": false
        }
      ]
    }
  ]
}
```
{: .nolineno}

### When limits make more sense, and how to apply them 

Resource limits control how many credits an individual resource, like an agent, can consume each month. Reource limits are available today and can complement credits allocated to an environment or apply when the environment uses pay-as-you-go billing. Environment-level limits will be supported soon ([MC1451872](https://portal.office.com/adminportal/home/?l=en-US&ref=MessageCenter/:/messages/MC1451872)). 

> Looking for a way to limit environment usage when working with pay-as-you-go or pre-purchase plan billing? Environment-level limits will be supported soon and in the meantime, you can [review usage and unlink a billing policy to prevent further environment level consumption]({% post_url 2026-05-13-managing-spend-pay-as-you-go %}).
 {: .prompt-info }

Resource limits make sense when you want to target specific scenarios for an agent not consuming more than a certain amount of credits, for example:
- Balancing cost control and enablement for GHCP harness agents, where admins might detect creation of a new agent by a maker for the first time, and automatically assign an agent-limit to enable limited discovery and testing by the maker(s). They might provide communication to the owner on the governance approach and limit, and may set a lower limit for the second agent created by the maker or simply limit the subsequent agents from consuming any credits until the use case is more established and funded appropriately.
- Wanting to fairly distribute a credits budget based on a general expectation of consumption for each use case in an environment. A team may jointly use 5 production agents in their roles, one of which they may use once a month and has a critical uptime requirement. If they use the other 4 agents every day throughout the month but their availability isn't as critical based on other factors, and they consume all the allocated credits available, it's an agent limit on the 4 agents that keep the first one available as needed.

> If you're enabling makers in the organization to build agents with Copilot Studio, a well balanced way to approach enablement and cost control as a starting point is the first example described above, allowing a small amount of credits for a use case, driven by the creator, then further limiting usage while providing communications. Keep in mind user-scoped limits are not supported in the platform so this is a workaround approach to enabling some discovery.
 {: .prompt-info }

To set a credit limit against an agent, **tenant administrators** can go to PPAC ➡️ Licensing ➡️ Copilot Studio ➡️ Manage Agents, where they can select specific agents and set the credit limit for them. One a limit has been set, administrators control the behavior for what happens when the agent hits that limit. They can decide to enforce the limit by preventing further usage, and/or send a notification at a set percentage of credits used.

![PPAC agent capacity settings showing a Copilot Credit limit, stop-usage control, and notification threshold.](/assets/posts/copilot-harness-cost-governance/set-agent-limit.png){: .shadow w="900" }
_Administrators can set an agent-level credit limit and choose what happens as consumption approaches or reaches it._

> **Notifications for when an agent hits the specified percentage against the set limit are sent to tenant and environment administrators.** You should factor this in when designing your governance process for handling what happens when a limit is reached and an agent potentially denies further usage, in case you have additional steps you'd like to take to handle this or repeated cases of it.
{: .prompt-warning }

Administrators in scaled tenants may also have one of the following scenarios to handle:
- Large numbers of requests to a CoE or IT team to add agent-level limits to agents owned by makers in the business.
- A distributed or 'hub' CoE model where delegated administration for agents needs to be provided.

The [Power Platform API Update Resource Threshold endpoint](https://learn.microsoft.com/en-us/rest/api/power-platform/licensing/resource-threshold/upsert-resource-threshold) lets administrators handle these scaled scenarios. This example sets a limit of 1000 credits for a specific agent, sends a notification when 80% of those have been consumed, and prevents further consumption once the limit is reached:

```http
PUT https://api.powerplatform.com/licensing/environments/<environment-id>/entitlements/MCSMessages/resources/<agent-resource-id>/threshold?api-version=2024-10-01
Content-Type: application/json

{
  "stopResource": false,
  "limit": 1000,
  "stopIfOverCapacity": true,
  "notifyIfOverCapacity": true,
  "notificationThreshold": 80
}
```
{: .nolineno}

> Ensure you set stopResource to false to prevent stopping the agent from being used immediately. This is used to stop usage irrespective of a limit when the request is made, and works in the same way as the stop agent action in PPAC via 'Manage agents'.
{: .prompt-danger }

## How zoned governance applies 

Zoned governance groups environments and agents by purpose, risk, and complexity so that each group can inherit an appropriate and repeatable set of controls. A zone is not a control itself, but it selects a policy profile based on the agent’s purpose, ownership, risk, criticality and other variables. Zoned governance varies by organization and industry, particularly where regulation introduces additional requirements. This is an example of how cost control fits into zoned governance at a high level:

| Example profile | Intended use | Cost-control profile | Review or escalation trigger |
|---|---|---|---|
| **Green: shared maker development** | Maker-led experimentation and limited team use | Apply a default agent limit, allocate development capacity intentionally, and restrict access to tenant-pool or pay-as-you-go overage unless approved | The limit is approached, the use case needs more capacity, or the agent is ready to enter a managed production lifecycle |
| **Red: enterprise production** | Approved departmental or organization-wide agents with accountable ownership | Align allocation or billing to the cost owner, set agent limits according to expected use and criticality, and make tenant-pool or pay-as-you-go access an explicit continuity decision | Consumption changes materially, ownership or criticality changes, or enforcement could interrupt a production service |

In future posts, we'll cover further considerations for managing and automating credit consumption control at scale around zoned governance.

## Governance should always be iterative

There's one task in understanding the things an environment is being used for, the agents that require access to credits, and the controls that should be wrapped around those use cases. The more important part after the first job is continuing to stay on top of changing needs and requirements. With platform developments, iterative improvements by developers on use cases themselves and other changing factors, simply applying an allocation of credits, or setting a limit once, isn't future proof. 

While considering your cost management and governance strategy for agents, acknowledge the fact that building it isn't a one time application of processes and controls. Think about how agents may need to consume more or less credits in the future. If colleagues move from one department to another, leaving only 75% of the people in the department they moved from then still using an agent, likelyhood is it may not need as many credits as it had before, and in an allocation scenario, leaving credits behind means missed value from what the organization invested in. We'll cover how to approach review processes and iterative governance in future posts.

## Key takeaways

- Start with the build scenario. Maker-led development and production agents carry different risks and should not inherit the same cost-control profile.
- Use inventory to connect each agent and environment to its purpose, owner, funding model, and governance zone.
- Allocate prepaid credits intentionally, then decide whether each environment can draw from the tenant pool, use pay-as-you-go, or deny further consumption.
- Use environment controls to govern shared capacity and agent (resource) limits to place tighter boundaries around individual use cases.
- Treat limits as guardrails, not one-time configuration. Define how to handle thresholds that get approached or met and review allocations and limits as ownership and usage change.
- Apply controls through repeatable, scenario-based governance patterns so enablement can scale without relying on a single standard for every agent.
