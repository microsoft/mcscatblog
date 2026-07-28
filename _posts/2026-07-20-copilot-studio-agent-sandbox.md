---
layout: post
agent_edition: modern
title: "The New Copilot Studio Agent Sandbox"
date: 2026-07-20
categories: [copilot-studio, agents]
tags: [copilot-studio, skills, agent-sandbox, code-execution, python, agent-development]
description: "How the Copilot Studio agent sandbox turns model reasoning into finished files, calculations, and other executable work while keeping external access governed."
author: chrisgarty
image:
  path: /assets/posts/copilot-studio-agent-sandbox/copilot-studio-agent-sandbox-cat.png
  alt: A cat playing in a sandbox labeled Copilot Sandbox
  no_bg: true
published: true
---

A capable AI model can explain how to compare two contracts. It can identify likely changes, describe the XML that Microsoft Word uses for Track Changes, and even draft the Python you would need.

But explaining the work is not the same as finishing it. If you want a real `.docx` document with insertions and deletions that Word can accept or reject, something has to open the documents, run the comparison, write the OOXML, validate the result, and return the finished file.

That is what code creation and execution add. It lets the agent move from *describing* a result to *producing* one.

In the [new Copilot Studio experience](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/overview), that code execution and file manipulation work takes place in the agent sandbox.

## Why give an agent a sandbox?

If you have used a coding agent such as GitHub Copilot CLI on your own machine, the basic idea will feel familiar. The agent can work at a terminal: inspect files, write code, run it, read the output, make corrections, and try again.

The Copilot Studio sandbox gives an agent that kind of working environment without requiring you to provision and manage a machine. It is a container with a Python runtime, local files, preinstalled libraries, and shell tools, all managed by Copilot Studio.

The sandbox is one part of the wider agent harness. Instructions, [Knowledge](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/knowledge-copilot-studio), [Skills](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/skills-overview), and [Tools](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/tools-overview) help the model understand and act on a task. As explained in [Modern Agents Have Skills Now]({% post_url 2026-06-15-modern-mcs-agent-skills %}), a Skill can bring task-specific instructions and scripts when they are needed. The sandbox gives those scripts somewhere to perform the local, executable part of the work.

Our [document redlining example]({% post_url 2026-07-15-redlining-documents-new-copilot-studio-experience %}) shows the difference. A Skill supplies a reviewed script and the instructions for using it. The sandbox runs that script against the supplied documents and creates the finished Word file:

![A Word document with insertions and deletions displayed as tracked changes](/assets/posts/redlining-documents-new-copilot-studio-experience/document-redlined.png){: .shadow }
_A `.docx` file created in the sandbox with genuine Word tracked changes._

The agent can return the file to the user and revise it in the sandbox if further changes are needed.

## What the sandbox unlocks

The sandbox ships with libraries for working with documents, spreadsheets, PDFs, data, charts, and images. The exact package names are less important than the agentic loop they enable: the agent can create a file, run a command, inspect the result, adjust its approach, run a new command, and continue to iterate.

That means an agent can do things such as:

- Turn an uploaded spreadsheet into a cleaned workbook, calculated summary, and chart.
- Compare documents and return a redlined Word file.
- Extract content from a PDF, apply a set of checks, and produce a findings report.
- Transform supplied data into a presentation or another formatted artifact.

For makers, this removes the need to build a separate service for every calculation or file transformation. For administrators, the execution environment is managed by Copilot Studio and external access continues to use the platform capabilities, governance controls, and [data policies](https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention) you configure.

## Local capability is not external permission

Code in the sandbox does not receive an open network path. Knowledge sources provide grounded information from configured sources. Configured tools, including connectors and MCP servers, retrieve live data or perform external actions.

The `requests` Python package makes the distinction clear. The package may be installed, which means Python knows how to construct an HTTP request. Its presence does not grant permission or supported connectivity to call an arbitrary API, send an email, or write a file to SharePoint.

The library provides a **capability**. The agent configuration and platform policies determine what the agent has **permission** to reach.

## Live code, or a script you packed yourself?

Code reaches the sandbox in two main ways:

- **Code generated for the task.** The model can write Python, run it, inspect the result, and revise it. This works well for novel work, such as understanding an unfamiliar export or finding a useful way to chart a newly uploaded file. The trade-off is that writing and iterating on code takes time, and the implementation may vary between runs.
- **A script packaged in a Skill.** A pre-written script is ready to run immediately. It is usually faster and more consistent for repeatable work, and your team can test and version it like any other code asset.

The maker does not choose between those paths for every conversation. You give the model good options, including Skills with clear descriptions, and the model decides what to use at runtime.

The practical rule is: give the model room to generate code for novel work. For repeatable work, provide a well-described Skill with a reviewed script so the agent can run it immediately and consistently. Then use [evals](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/analytics-agent-evaluation-intro) to verify that the complete agent still behaves as intended. The [quality-gate pattern]({% post_url 2026-04-19-copilot-studio-eval-gate-azure-devops %}) shows one way to automate that check. Packaged Skills travel with the agent and follow your normal [application lifecycle management](https://learn.microsoft.com/microsoft-copilot-studio/guidance/alm) process.

## The sandbox is temporary

The sandbox is a working area, not permanent storage. If the redlining agent creates `contract-redlined.docx`, it needs to return that file to the user or use a configured Tool to save it somewhere durable. Do not design the next conversation around finding that same file in the sandbox.

[Agent Memory](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/memory-overview), when enabled, persists separately from files in the sandbox workspace.

## How do I know what is available in the sandbox?

While you are building, start with the simplest option: ask the agent which runtime, libraries, Tools, and Skills it can access.

For a repeatable and detailed inventory, the [agent-harness-explorer](https://microsoft.github.io/cat-agent-skills/skills/agent-harness-explorer/) Skill automates that check and creates a self-contained HTML report. A report from an otherwise empty Copilot Studio agent on 2026-07-21 found **Python 3.12.9** in a **container**, with **99 Python libraries**, **11 built-in tools**, **8 Skills**, and **no MCP servers** configured for that agent. 

![Example Agent Harness Capability Report showing the runtime, available capabilities, tools, Skills, and Python libraries](/assets/posts/copilot-studio-agent-sandbox/agent-harness-explorer-report-example.png){: .shadow }
_An example report generated by the agent-harness-explorer Skill._

To create an agent and generate an agent harness explorer report:
1. Download the [agent-harness-explorer](https://microsoft.github.io/cat-agent-skills/skills/agent-harness-explorer/) bundle (zip) from the [cat-agent-skills](https://microsoft.github.io/cat-agent-skills/) skills library
2. In [the new Copilot Studio experience](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/overview), create or open an agent
3. On the Build tab, in the right panel, click "Skills +" to [add an existing Skill](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/skills-add-existing)
4. Upload the zip file and wait for the Skill to load
5. Open the [Preview](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/preview-overview) tab
6. In the agent chat, enter "Please inspect the harness" (harness/sandbox/environment)
7. Review the [activity trace](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/authoring-activity-trace) to see the tools and scripts used to generate the report. 
8. Open and review the "harness-inspection-report" HTML report

If [Agent Memory](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/memory-overview) is enabled, then a snapshot can be saved for later comparison by asking the agent to "Capture a snapshot". These comparisons can highlight additional capabilities added over time.

## Ready for action

The sandbox is what lets a Copilot Studio agent inspect, calculate, create, and iterate instead of stopping at an explanation. The wider harness gives the model instructions and capabilities; the sandbox gives it a managed place to do the executable work; and evals help confirm that the combined behavior still works as intended.

Now that Copilot Studio agents are so much more capable, what business problems will your next Copilot Studio agent help solve?