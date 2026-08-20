---
layout: post
title: "Increase Visibility and Control over GitHub Copilot Harness Agents with the Copilot Agent Kit"
date: 2026-08-20
categories: [copilot-studio, governance]
tags: [governance, compliance, agent-inventory, copilot-agent-kit, admin, copilot-studio]
description: "Use Copilot Agent Kit Compliance Hub thresholds, cases, and enforcement policies to identify and govern agents built with the GitHub Copilot harness."
author: emdarcy
agent_edition: github-copilot
image:
  path: /assets/posts/github-copilot-harness-agents-agent-kit/header.png
  alt: "Copilot Agent Kit Compliance Hub dashboard showing agent risk and compliance status"
---

GitHub Copilot harness (**GHCh**) agents give makers a new way to build, but they also give platform admins a new governance question: how do you identify these agents and apply your organization's controls consistently? The **Compliance Hub** in Copilot Agent Kit can play an important role in bringing peace of mind by providing additional visibility and providing extra guardrails.

If you're not familiar with Copilot Agent Kit, start with the [Copilot Agent Kit overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-overview). For a broader tour of its testing, inventory, and governance features, see [Copilot Studio Kit: Beyond Test Automation]({% post_url 2026-03-06-copilot-studio-kit %}). This post assumes the kit and Agent Inventory are already configured and focuses on using Compliance Hub to identify and govern GHCh agents in your tenant.

The [Compliance Hub](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-compliance-hub) is a key part of the Copilot Agent Kit that allows organisations to track and monitor all agents built on Copilot Studio in line with their own rules. It includes automated rules and alerts that make governance for admins a breeze, providing them with alerts when an agent is created that doesn't meet the organisation's standards. It also assists makers by giving them guidance on how to bring their agent into compliance with automated notifications and guidelines. It can even quarantine or delete any agents if a specific time period has lapsed without any action. Let's take a closer look.

## The Compliance Hub dashboard

When we first load the Compliance Hub, we get a dashboard view of our agents' current status against the compliance rules we have configured. At a glance, an admin can see agents that are high risk, missing owners, or any that require immediate action. An admin can manually trigger a **Compliance Scan** from this screen. A Compliance Scan also runs automatically after Agent Inventory finishes, typically once each day.

![Compliance Hub dashboard view](/assets/posts/github-copilot-harness-agents-agent-kit/1.png){: .shadow w="700" h="400"}
_The Compliance Hub dashboard_

## Compliance thresholds

The results of these charts all depend on our settings, starting with **Compliance Thresholds**. These can be thought of as rules or risk factors for agents. The kit comes with several out of the box, but you can add your own as we will see shortly.

![Compliance Thresholds settings](/assets/posts/github-copilot-harness-agents-agent-kit/2.png){: .shadow w="700" h="400"}
_Out-of-the-box Compliance Thresholds_

Each rule is measured as **low, medium, or high** risk. When a maker creates an agent that violates one of these rules, they will be notified and the agent will be categorized at the highest threat level of violation. Risk levels are associated with varying enforcement actions that can be customized:

![Risk levels and enforcement actions](/assets/posts/github-copilot-harness-agents-agent-kit/3.png){: .shadow w="700" h="400"}
_Risk levels mapped to enforcement actions_

When an agent matches one or more of the configured risk factors, Compliance Hub creates or updates a **case**. As an example, the default action policies give a medium-risk case five days before quarantine and a high-risk case three days before deletion, but admins can change both the SLA and action for each risk level. Quarantine disables the agent for end users while leaving it available to its owner for remediation. Delete permanently removes the agent and can't be undone.

> Only **published** agents can be quarantined. If an agent is in a draft state, it can only be deleted or manually handled.
{: .prompt-warning }

## Email notifications and intake requests

The final piece of setup I want to share before we go into our specific scenario is around the automatic sending of email notifications and intake requests. When an agent is picked up as being in violation, **the SLA timer does not start to tick down until the intake form is sent to the owner of the agent.** So depending on the outcome you wish to achieve, this next section is vitally important:

![Intake request and email notification settings](/assets/posts/github-copilot-harness-agents-agent-kit/4.png){: .shadow w="700" h="400"}
_Intake request and email notification settings_

These settings allow you to decide if you want to always automatically send an intake request for every case created, or if you want to manually send the intake request. The intake request sends an **adaptive card** to the owner of the agent asking them for their business justification for their agent. Importantly, it also kicks off the SLA timer.

This section also holds several email templates that can be customized for various purposes.

## Applying this to GHCh agents

Now that we have the basics, let's apply them to agents created with GHCh.

First, we will need to create a new Compliance Threshold violation by clicking on the **Add threshold** button. This will open the following screen:

![Add custom threshold screen](/assets/posts/github-copilot-harness-agents-agent-kit/5.png){: .shadow w="700" h="400"}
_Creating a custom Compliance Threshold_

Here is where we can create custom thresholds that match against any data we collect within the **Agent Details** table. The Filter section of the form allows us to select a column from the table and create a query against that column. In our scenario, we want all agents where the harness is GitHub Copilot.

First, we're going to set the risk level to **high** (to match the SLA with a `-1` and an action of **Quarantine** as per our SLA setup previously). Then we need to fill out our filter query.

> In the August 2026 version used for this walkthrough, the **Powered By** column in the Agent Details table has the logical name `cat_poweredbycode`, and its GitHub Copilot choice value is `1`. Before creating the threshold, confirm the column name and choice value in your environment's Dataverse table metadata because solution updates can change implementation details.
{: .prompt-tip }

Be sure to name the threshold rule something clear that the maker can understand, with guidance on what the maker needs to do next to resolve the violation. Save the rule and go back to the Settings page.

> Custom logic can always be created or added into the flows if additional data sources need to be checked. This is not covered within this blog post.
{: .prompt-info }

Make sure your corresponding risk level (I chose **high** here) is set to `-1` with an enforcement action of **Quarantine**. Other actions include **Manual** and **Delete**. See [Set up and configure Copilot Agent Kit Compliance Hub](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-configure-compliance-hub) for the documented action-policy behavior. You can also edit the description to clearly indicate to the maker what will happen to their agent:

![Risk level set to high with Quarantine action](/assets/posts/github-copilot-harness-agents-agent-kit/6.png){: .shadow w="700" h="400"}
_Setting the high risk level to an SLA of -1 with a Quarantine action_

> As this blog is focused on GHCh agents, it is also important to highlight that even quarantined agents can consume credits if the maker is testing. For a comprehensive look at managing cost and credits for agents, I highly recommend my colleague Lewis Baybutt's blog here: [Adopting the GitHub Copilot Harness: Cost Control and Governance in Copilot Studio | The Custom Engine](https://microsoft.github.io/mcscatblog/posts/copilot-harness-cost-governance/).
{: .prompt-warning }

Finally, remember that the SLA countdown doesn't start until the intake form is sent to the maker. If you want these agents to enter the enforcement lifecycle automatically, disable the **Admin Approval Before Maker Notification** flag after you validate your thresholds. Otherwise, an admin must open each compliance case and send its notification.

![Admin approval requirement flag](/assets/posts/github-copilot-harness-agents-agent-kit/7.png){: .shadow w="700" h="400"}
_Disable the admin approval requirement to auto-start the SLA timer_

Another recommendation is to modify the **quarantine email** to clearly communicate your organization's policy on GHCh agents. I added the following line to mine to make it easier for makers to understand what happened:

![Customized quarantine email](/assets/posts/github-copilot-harness-agents-agent-kit/8.png){: .shadow w="700" h="400"}
_A customized quarantine email explaining the GHCh policy_

Once this configuration is in place, run a Compliance Scan. Published agents that match the GHCh threshold enter the compliance lifecycle and are quarantined when their cases are past the configured SLA.

## Understanding when enforcement happens

> The Compliance Case must be **past SLA** before an enforcement action can be taken.
{: .prompt-warning }

A compliance case happens when:

1. **Agent Inventory** is run and a new agent is picked up that violates a threshold rule.
2. **Compliance Scan** is run and an existing agent now violates a threshold rule, either because the agent changed or because an admin created a new rule.

Once that compliance case is created, sending the intake notification starts the SLA countdown. A later Compliance Scan evaluates the case again and applies the configured enforcement action if the SLA has expired. You can run a scan manually from the dashboard, and one runs automatically after the typically daily Agent Inventory update.

![Compliance Scan enforcement flow](/assets/posts/github-copilot-harness-agents-agent-kit/9.png){: .shadow w="700" h="400"}
_The Compliance Scan enforcement sequence_

## Automating the scan

To further automate this process, I created a custom flow that triggered when a Compliance Case with a violation containing GHCh was created. I leveraged a simple **"When a record is added"** trigger paired with an **unbound action** to call the Compliance Scan flow:

![Custom automation flow](/assets/posts/github-copilot-harness-agents-agent-kit/10.png){: .shadow w="700" h="400"}
_A custom flow to auto-run the Compliance Scan on new GHCh cases_

## Wrapping up

Copilot Agent Kit Compliance Hub gives admins a practical way to identify GHCh agents, notify their owners, and enforce a deliberate governance policy. Start with quarantine in a nonproduction environment, verify the complete case lifecycle, and only then decide how aggressively to automate enforcement.

This control complements broader governance decisions. [The Admin Control That Closes the Door Before "Hello"]({% post_url 2026-06-14-agent-authentication-controls %}) covers environment-level authentication requirements, while [Why Your E3 Users Can Suddenly Build Agents in Copilot Studio]({% post_url 2026-07-09-e3-users-build-agents-turn-it-off %}) looks at controlling who can create agents in the first place.

How is your organization identifying and governing agents built with the GitHub Copilot harness today?