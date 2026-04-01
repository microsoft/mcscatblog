---
layout: post
title: "Bridging the Gap: Connecting Legacy Desktop Applications to Copilot Studio Agents"
date: 2026-04-01
categories: [copilot-studio, agents]
tags: [computer use, agents, power automate, rpa, legacy, desktop, dataverse, robotic process automation, cua]
description: "A technical deep-dive into connecting legacy desktop applications to Microsoft Copilot Studio agents — exploring why native RPA integration is blocked, how Computer Use Agents (CUA) fill the gap, and a production-ready alternative using Power Automate and Dataverse."
author: jpapadimitriou
image:
  path: /assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/header.png
  alt: ""
---

# Bridging the Gap: Connecting Legacy Desktop Applications to Copilot Studio Agents

## The Legacy Application Challenge

Many organizations still rely on legacy desktop applications that are critical to business continuity and success. In most cases, these applications do not expose an API, making modern programmatic interaction with them tedious, error-prone, and sometimes outright impossible.

RPA (Robotic Process Automation) was created precisely to bridge this gap. Power Automate enables the creation of deterministic desktop flows with sophisticated tools for UI automation, flow execution, and error handling.

We are now well into the **Hyper Automation era**. As more and more organizations move toward agentic automation, the need to surface data from legacy desktop applications and make it available to AI agents becomes increasingly apparent.

Which leads to a natural question: *What if I could connect my existing Power Automate RPA stack to Copilot Studio and amplify my agents with data that lives exclusively inside desktop apps?*

---

## The Current State: RPA and Copilot Studio Don't Mix

In its current state, Microsoft Copilot Studio — and by extension Custom Agents — **does not support RPA (Robotic Process Automation) integration**. Any attempt to invoke a "Run Desktop Flow" action, whether directly or indirectly (via a cloud flow or agent flow), is blocked.

Here are the key findings when attempting to include RPA functionality in a custom agent:

**Changing a cloud flow's plan to Copilot Studio when it internally invokes a desktop flow:** In order to invoke a cloud flow from a custom agent, you have to change its plan to **Copilot Studio**.
![Changing a cloud flow's plan to Copilot Studio when it internally invokes a desktop flow](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/error_switching_plan_to_copilot_studio.png){: .shadow w="700" }
_Changing the plan of a cloud flow to Copilot Studio is prohibited when a desktop flow is invoked internally._

> *Flow client error returned with status code "Forbidden" and details "RpaActionNotSupportedForMcs".*

**Adding a "Run a Desktop Flow" action as a Tool:**
![Adding a "Run a Desktop Flow" action as a Tool](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/error_adding_rpa_as_a_tool_actual_message.png){: .shadow w="700" }
_Attempting to add the Run Desktop flow action as a Tool is not supported._

> *Something went wrong. Please try again. An unexpected server error occurred.*

**Attempting to add a "Run a Desktop Flow" action in an agent flow:**
When clicking Publish, the agent flow returns an error, rendering it unpublishable:
![Adding a "Run a Desktop Flow" action as a Tool](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/error_adding_rap_in_agent_flows_actual_message.png){: .shadow w="700" }
_Attempting to add the Run Desktop flow action as a Tool is not supported._

> *We ran into an error while validating your flow. Please try again.*


---

## Enter Computer Use Agents (CUA): The Next Level of Automation

Microsoft has introduced a fundamentally different approach to desktop automation in Copilot Studio: **Computer Use Agents (CUA)**.

Rather than scripted, deterministic flows, CUA emulates human behavior. You set it up, provide it with objectives, and watch it interact with desktop and web applications exactly as a human user would.

> Learn more: [Automate web and desktop apps with computer use (preview) – Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use)

---

## Prerequisites

Before starting, ensure the following are in place:

- A **US-based Power Platform environment** — CUA is currently only available in US regions. See the full list of requirements for Computer Use [here](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use).
- A target machine (physical or VM) with **Power Automate Machine Runtime** installed and registered to your environment. See how to [setup a machine in Power Automate](https://learn.microsoft.com/en-us/power-automate/desktop-flows/manage-machines)
- The machine **enabled for Computer Use**: navigate to Power Automate > Machines > select your machine > Settings > toggle **"Enable for computer use"** to ON.
- A **dedicated CUA user account** on the target machine. See [best practices for securing machines](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use).

> **Important note**: Confirm that the machine has **no active desktop flow connections you depend on** — enabling Computer Use will break them.

> **Note:** For this demo, I used a Hyper-V Virtual Machine, hosted locally. Based on the recommended setup guidance for security and isolation, I then created dedicated CUA user account. I installed Power Automate's Machine Runtime as well as the **Contoso Invoicing** desktop application. 

Once your machine is registered and enabled, you are ready to proceed.

---

## Demo: Adding Computer Use to a Custom Agent

### Step 1 – Create a Custom Agent

Create a new Custom Agent in Copilot Studio. For this demo, I named mine **Contoso Invoicing Assistant**. Leave the Instructions section empty for now — we will return to it later.

### Step 2 – Add the Computer Use Tool

- Navigate to the **Tools** tab.
- Click **Add the Computer Use tool**. 
**Adding Computer Use as a Tool**
Adding Computer Use as a Tool:
![Adding Computer Use as a Tool](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/adding_cua_as_a_tool.png){: .shadow w="700" }
_Adding Computer Use as a Tool._
- Provide instructions for the tool and click **Add and configure**.
**Giving instructions to Computer Use**
Giving instructions to Computer Use:
![Adding Computer Use as a Tool](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/add_new_cua_tool_with_instructions.png){: .shadow w="700" }
_Giving instructions to Computer Use._

> **Pro tip on instructions:** Be thorough. The more descriptive you are, the more predictable CUA's behavior will be. Keep in mind that CUA automation is **outcome-based, not action-based** — every instruction is a goal, and the tool will do whatever it takes to achieve it.
>
> For example, if a desktop application isn't visible on screen, CUA will try searching for it via Windows Search, browsing the file system, locating the `.exe` directly, and more. Instructions should be tailored to the specific application you are automating.
>
> See: [Setting up instructions – Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use)

### Step 3 – Connect Your Machine

- Scroll down to the **Machines** section of the Computer Use tool.
- In the dropdown, select **Bring-your-own machine** and select the machine you registered in the Prerequisites step.
**Bring your own machine to Computer Use**
Using your own machine:
![ing your own machine to Computer Use](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/adding_a_machine_in_cua_existing_machine.png){: .shadow w="700" }
_Using your own machine for Computer Use._

> For more on where Computer Use runs: [Configure where computer use runs (preview)](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use)

### Step 4 – Create a Connection and Test

- With your machine selected, create a connection for CUA.
**Create a CUA connection**
Creating a CUA connection:
![Creating a connection for Computer Use](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/create_cua_connection.png){: .shadow w="700" }
_Creating a connection for Computer Use._

- Click **Test** — your registered machine should appear and be ready for use.
**Testing Computer Use with instructions**
Testing Computer Use with instructions:
![Testing CUA](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/testing_screen_cua.png){: .shadow w="700" }
_Testing Computer Use tool with instructions passed._

### Step 5 – Configure Agent Instructions and Run

- Return to the agent's **Instructions** section.
- Provide thorough guidance for your agent, referencing the CUA tool you configured and describing the objectives it should pursue against the target desktop application.
**Passing instructions to the agent and utilizing Computer Use tool**
Passing instructions to the agent and utilizing Computer Use tool:
![Agent instructions utilizing Computer Use tool](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/agent_details.png){: .shadow w="700" }
_Instucting the agent to use the created Computer Use tool._


- Save your changes and open the **Test** panel.

The agent will invoke the Computer Use tool, execute against the desktop application, and upon reaching its objectives, surface the retrieved data directly back into your agent conversation.

**Testing the agent**
Testing the agent that utilizes the Computer Use tool:
![Agent retrieves the data from the legacy desktop app](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/testing_the_agent.png){: .shadow w="700" }
_Testing CUA_

**Agent performs Computer Use steps**
Computer Use is iniated:
![Agent invokes the Computer Use tool](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/testing_the_agent_cua_steps.png){: .shadow w="700" }
_Computer Use is invoked._

**Computer Use retrieves the requested data**
Computer Use has retrieved all the requested data and now the agent has access to them:
![Agent now has access to the legacy desktop app data](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/testing_the_agent_cua_extracted_data.png){: .shadow w="700" }
_Data from the desktop app have now been retrieved._

**Agent can now further utilize the retrieved data**
The agent can now perform further actions involving the retrieved data:
![Using the data from the desktop app](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/testing_the_agent_agent_returns_data.png){: .shadow w="700" }
_Data from the desktop app have now been retrieved._



---

## Considerations: CUA is Still in Preview

Before committing to CUA as your production automation strategy, there are two important factors to keep in mind.

First, Computer Use is currently **in preview**, which means it may be subject to change, carries no SLA guarantees, and may not be suitable for production workloads yet.

Second, CUA's **goal-based approach**, while powerful, comes at a cost: time. Unlike deterministic RPA flows that execute a fixed sequence of actions at machine speed, CUA reasons about its objectives and navigates the UI step by step — much like a human would. For latency-sensitive scenarios, this is a meaningful tradeoff.

---

## CUA v RPA: A Quick Comparison

| **Aspect** | **RPA** | **CUA** |
|---|---|---|
| Automation type | Rule based/ Deterministic | LLM/ Outcome driven |
| Interact via | UI tree | Vision |
| Authoring | Visual Scripting | Natural language instructions |
| Decision making | Predefined rules | Autonomous visual-based decisions |
| Error handling | Predefined error handling | Self-correcting based on visual feedback |


### When to use each — today

| | **Use RPA when…** | **Use CUA when…** |
|---|---|---|
| **UI stability** | UI is stable — screens, fields, and selectors hardly change | UIs shift or vary widely — multiple apps, frequent redesigns |
| **Decision complexity** | Rules are clear — decisions can be captured in rules | Decisions are fuzzy — the agent must think to pick the next step or self-correct |
| **Speed** | Speed matters — high-volume where every second counts | Vision matters — the task depends on what's visible on screen (charts, colors, dynamic layouts) |
| **Team** | An RPA team owns it — existing RPA development and management knowledge | RPA team can't take it — the RPA team's backlog is full. Easier to build. |
| **Criticality** | GA is a must — for mission critical systems | Tolerance for errors — "misclicks" or retries are ok. E.g., read-only scenarios |


---

## A Practical Alternative: Separation of Concerns with Power Automate

While CUA is a compelling capability, there is a pragmatic alternative that leverages the **maturity and reliability of Power Automate** — and it maps cleanly to a well-established architectural principle: **Separation of Concerns**.

The idea is straightforward: let each layer do what it does best.

**Power Automate acts as the data retrieval and storage layer.** A scheduled cloud flow runs at the end of each business day. Internally, it invokes a desktop flow that connects to the legacy desktop application and extracts the relevant data using UI Automation. That data is then written to a dedicated **custom Dataverse table** using the respective Dataverse actions.

**Copilot Studio acts as the execution layer.** The Custom Agent uses the Dataverse table as a knowledge source — querying clean, structured, up-to-date data without ever needing to interact with the desktop application directly.

**Separating Concerns pattern**
Clear distinction between the Knowledge Layer and the Execution layer.
![Separating concerns](/assets/posts/connecting-legacy-desktop-apps-to-copilot-studio/separation_of_concerns.png){: .shadow w="700" }
_Each layer performs each distinct functions._

This approach offers several concrete advantages:

- **Speed** — the agent queries structured data instantly, with no UI navigation overhead
- **Robustness** — Power Automate desktop flows are deterministic and battle-tested
- **Scalability** — Dataverse handles concurrent agent queries without additional machine load
- **Auditability** — every flow run, data write, and agent query is logged and traceable
- **Decoupling** — the desktop application, the data pipeline, and the agent can each evolve independently

This pattern won't suit every scenario — if you need real-time data or truly ad-hoc UI interactions, CUA remains the right tool. But for recurring, structured data retrieval, this approach delivers production-grade reliability today, without waiting for CUA to reach general availability.

