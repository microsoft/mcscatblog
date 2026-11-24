---
agent_edition: both
layout: post
title: "\"Move Data Across Regions\" Doesn't Mean What You Think (If You're in the EU Data Boundary)"
date: 2026-10-01
categories: [copilot-studio, governance]
tags: [eu-data-boundary, data-residency, flex-routing, power-platform-admin-center, generative-ai-settings, compliance, models]
description: "For environments in the EU Data Boundary, the 'Move data across regions' setting in the Power Platform admin center allows processing in other EU Data Boundary locations, not outside of it. Flex routing is the setting that actually crosses the boundary. Here's how to read the two."
author: martinrinas # TODO: confirm/add key in _data/authors.yml
image:
  path: /assets/posts/move-data-across-regions-eu-data-boundary/header.png
  alt: "Connected processing locations within a protected European data boundary, with an outbound route blocked at the edge"
  no_bg: true
published: true
---

I keep having the same conversation with European customers. It usually goes something like this:

> "We'd love to use the latest model in Copilot Studio, but it isn't showing up for us."
> "Have you enabled *Move data across regions* on the environment?"
> "Absolutely not. Our data has to stay in the EU."

Totally fair instinct. The label sounds scary. If you're a compliance or security lead, a checkbox called *Move data across regions* reads a lot like *Send my data somewhere I promised it wouldn't go*.

Here's the thing though: **if your environment lives in the EU Data Boundary, that checkbox doesn't take your data out of the EU Data Boundary.** For you, it behaves much more like *"allow cross-country processing inside the EU Data Boundary"*. The setting that actually lets inferencing leave the boundary is a different one, called **flex routing**, and it sits right below it.

Let's untangle the two.

## What the setting actually controls

Copilots, agents and generative AI features in Power Platform and Dynamics 365 depend on large language model (LLM) capacity that isn't deployed in every single country or region. The [Move data across regions](https://learn.microsoft.com/power-platform/admin/geographical-availability-copilot) article on Microsoft Learn puts it plainly: even where there's some in-region capacity, data may still need to move for availability reasons or because a feature depends on other capacity or services.

When you turn *Move data across regions* on, your prompts and responses **may** be processed in the location listed for your region in the table on that page. The key part is **where** that location is. For European environments, the documented processing location for Azure OpenAI is:

| Where your environment is hosted | Where Azure OpenAI processing happens when the setting is on |
|---|---|
| Europe | In the EU Data Boundary |
| France, Germany, Norway, Sweden, Switzerland | In the EU Data Boundary |
| United Kingdom | In region, or in the EU Data Boundary |

*Source: [Move data across regions for Copilots, AI agents, and generative AI features](https://learn.microsoft.com/power-platform/admin/geographical-availability-copilot), as of October 2026. Always check the live table, it changes as capacity grows.*

The docs also call out that if your environment is hosted in the EU Data Boundary, an Azure OpenAI endpoint **in the same boundary** is used.

So for a German environment, turning the setting on means: "you may also process my prompts in other EU Data Boundary locations, not just in Germany." It does **not** mean "you may process my prompts in the US."

A few more facts from the docs that tend to calm the room:

- Cross-region processing only happens when the required model isn't deployed locally, when local capacity is maxed out, or when there's a reliability issue with the local model.
- Microsoft doesn't log, store or retain the input or output data during this process. There's no persistence.
- For Core Online Services, the setting doesn't change the Product Terms commitments about where Customer Data is stored at rest.

## What happens if you leave it off

This is the part people usually don't expect. Turning the setting off doesn't disable Copilot Studio or every generative AI feature. It limits the environment to whatever capacity exists **inside your specific region**, however, so some models and features may be unavailable. Newer models also tend to land in fewer locations first.

I saw exactly this with a UK customer earlier this year. Their environment was in the UK with the setting off, and they couldn't use a newly released model they wanted. Their actual requirement was "keep data in Europe", not "keep processing strictly inside the UK". With the setting off, processing could only happen in the UK. Turning it on also allowed processing in other EU Data Boundary locations, which met their requirement and unlocked the model.

That's the pattern I see over and over: the setting is off because of a requirement it doesn't actually affect, and the customer pays for it with a reduced feature set.

## Flex routing: the setting that does cross the boundary

If your environment is in the EU Data Boundary, the same *Generative AI features* pane shows an extra checkbox: **Allow flex routing during periods of peak load**.

This is the one that matters for the boundary. Per the docs, flex routing lets LLM inferencing, and the storage of associated pseudonymized data, happen **outside** the EU Data Boundary during periods of peak demand. If you clear it, all LLM inferencing stays inside the EU Data Boundary, even at peak.

A few details worth knowing:

- Flex routing is only available when *Move data across regions* is on. If the flex routing checkbox is visible but greyed out, either it's turned off in the Microsoft 365 admin center or *Move data across regions* isn't enabled.
- For tenants managed through the Microsoft 365 admin center, the Power Platform default follows the Microsoft 365 admin center toggle.
- **Flex routing is on by default for eligible tenants created after March 25, 2026.** For tenants that existed before that date, check Message Center for your tenant's default.
- Wherever inferencing happens, data is encrypted in transit and at rest. Data at rest stays in the EU Data Boundary, except limited pseudonymized data stored outside for security and operational purposes.

> Because flex routing can be on by default for newer tenants, don't assume it's off. If your requirement is "nothing leaves the EU Data Boundary", go and check the checkbox explicitly, in both the Power Platform admin center and the Microsoft 365 admin center.
{: .prompt-warning }

## Choose the settings in two steps

These settings answer two different questions. Decide how far processing can move during normal operation first, then decide what can happen during peak demand.

### 1. Choose whether data can move across regions

For an environment in the EU Data Boundary or the UK:

| Processing requirement | Move data across regions |
|---|---|
| Must stay in the environment's country or region | **Off** |
| Can use other locations within the EU Data Boundary | **On** |

With the setting **off**, processing uses only the models and capacity available in the environment's local region. With it **on**, processing can also use other EU Data Boundary locations. For UK environments, that means the UK or EU Data Boundary locations.

For environments elsewhere, check the [region table in the Learn article](https://learn.microsoft.com/power-platform/admin/geographical-availability-copilot) for the applicable processing locations.

### 2. For eligible EU Data Boundary environments, choose what happens at peak

| Peak-demand requirement | Allow flex routing |
|---|---|
| LLM inferencing must stay within the EU Data Boundary | **Off** |
| LLM inferencing can temporarily leave the EU Data Boundary | **On** |

If you turn flex routing off, check the setting in both the Power Platform admin center and the Microsoft 365 admin center.

## Watch out for the other checkboxes

The *Generative AI features* pane has a couple more options that depend on *Move data across regions* being on. They're not the same thing, so read them separately:

- **Bing search.** Lets agents use Bing's APIs to improve answers from your data sources. The table in the docs lists **United States** as the location where data is stored and processed for Bing Search, for every region, including Europe. If that's a problem for your use case, leave Bing search off. Turning on *Move data across regions* doesn't force you to turn it on.
- **Microsoft 365 services.** Enables features powered by Microsoft 365 services, which store data according to Microsoft 365 terms and data residency commitments.

> Rule of thumb: *Move data across regions* is the prerequisite, not the decision. Each checkbox after it is its own decision.
{: .prompt-tip }

### Where to find it

1. Sign in to the [Power Platform admin center](https://admin.powerplatform.microsoft.com).
2. Go to **Manage** > **Environments** and select your environment.
3. On the **Generative AI features** card, select **Edit**.
4. Review the terms and set **Move data across regions**, **Bing search**, **Microsoft 365 services** and **Allow flex routing during periods of peak load** as needed.
5. Select **Save**.

<!-- TODO: add screenshot of the Generative AI features pane -->
<!-- ![Generative AI features pane in the Power Platform admin center](/assets/posts/move-data-across-regions-eu-data-boundary/genai-features-pane.png){: .shadow w="700" h="400" } -->

Managing many environments? You can set this at scale with the **Generative AI settings** environment rule, instead of clicking through each environment.


## Key takeaways

- For environments in the EU Data Boundary, **Move data across regions keeps processing inside the EU Data Boundary**. Read it as "allow cross-country processing within the boundary".
- **Flex routing** is the setting that lets LLM inferencing leave the EU Data Boundary at peak load. Turn it off if that's your requirement, and check the default, since it's on for eligible tenants created after March 25, 2026.
- Leaving *Move data across regions* off doesn't add protection for an EU Data Boundary-only requirement. It is appropriate when processing must remain in the environment's country or region, but it limits available capacity, models and features.
- **Bing search** is processed in the United States per the docs. Decide on it separately.
- UK environments are a special case: processing is in the UK or in the EU Data Boundary.



Has the label on this setting caused confusion with your customers or your compliance team? Let me know in the comments how you explain it.
