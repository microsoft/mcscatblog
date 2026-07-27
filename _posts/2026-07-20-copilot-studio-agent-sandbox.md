---
layout: post
agent_edition: modern
title: "The New Copilot Studio Agent Sandbox"
date: 2026-07-20
categories: [copilot-studio, agents]
tags: [copilot-studio, skills, agent-sandbox, code-execution, python, agent-development]
description: "What the modern Copilot Studio agent sandbox is, how it fits into the agent harness, why it cannot reach the internet, and when to use generated code versus a packaged Skill script."
author: chrisgarty
image:
  path: /assets/posts/copilot-studio-agent-sandbox/copilot-studio-agent-sandbox-cat.png
  alt: A cat playing in a sandbox labeled Copilot Sandbox
  no_bg: true
published: false
---

A capable AI model can look at a problem and reason through it. It can explain how to clean a spreadsheet, describe the Python you would need, or tell you how to assemble a report.

Reasoning alone, however, cannot inspect the spreadsheet, run the Python, or create the report file. Something has to give the model the right context, connect it to approved capabilities, and provide somewhere for code to execute.

If you read our post about how [Modern Agents Have Skills Now]({% post_url 2026-06-15-modern-mcs-agent-skills %}), you know a Skill can give an agent task-specific instructions and scripts. That raises a practical question: when the agent needs to run code, where does that work happen, and what can the code actually reach?

The answer is easier to understand if we separate three layers. The **model** supplies reasoning and generation. The **runtime harness** surrounds the model with instructions and context, Knowledge, Skills, Tools, and orchestration. The **sandbox** is the isolated execution environment where the agent can perform supported local work, including running generated code or a script packaged in a Skill. Evals sit outside that runtime loop and test whether the assembled agent still behaves as expected.

In short, the harness adds capabilities and the sandbox provides a controlled place to execute some of them. If the model is the engine and the harness is the rest of the vehicle that makes it useful, the sandbox is an island it is driving on: equipped for a defined set of jobs, but separated from the outside world, unless you add a bridge.

## So what is the sandbox?

The sandbox is a small container with a Python runtime, local files, preinstalled libraries, and shell tools. In the [modern Copilot Studio experience](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/overview) and environments tested for this post, agents had one available by default. Treat its workspace as ephemeral rather than relying on files to remain available across runs.

| Layer | What it contributes |
| --- | --- |
| Model | Reasoning and generation |
| Runtime harness | Instructions and context, Knowledge, Skills, Tools, and orchestration |
| Sandbox | An isolated runtime, libraries, local files, shell access, and execution boundaries |

That distinction matters. Instructions and Skills guide what the agent should do. Knowledge supplies approved content and context for that work. Tools can provide governed ways to work with systems outside the sandbox. The sandbox itself is a temporary place for supported local execution: read a file, do the math, build a spreadsheet, or draw a chart.

Do not rely on the sandbox workspace carrying over to the next run. That is useful when you remember that the agent may have written the code only moments before executing it. [Agent Memory](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/memory-overview), when enabled, persists separately from sandbox files.

## Why should you care about the sandbox?

That depends on who you are:

- If you are a **user** of an agent, the agentic loop can finish more jobs instead of merely describing them. Ask for a summary table from a messy CSV and you can get the table back, not a recipe for making it yourself.
- If you are a **maker**, you get a useful toolbox without building a custom service for every calculation or file transformation. The agent can write a few lines of Python for a one-off task, or run a script from a Skill that you have provided. It can leverage those capabilities inside the isolated sandbox and can only reach outside of the sandbox via the tools and knowledge sources provided to the agent.
- If you are an **admin**, the keyword is **isolated**. Local code runs in a throwaway container with no open door to the internet.

> By default, agents created in the new Copilot Studio experience can 'Search all websites' via [Knowledge](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/knowledge-copilot-studio), but that can be turned off.
{: .prompt-info }

## What is in the sandbox

The sandbox ships with close to a hundred Python libraries. The exact inventory matters less than the kinds of local work it supports:

- **Documents and data:** python-docx, python-pptx, openpyxl, pypdf, pandas, and numpy.
- **Charts and images:** matplotlib, plotly, seaborn, Pillow, OpenCV, and OCR support.
- **Parsing and utilities:** BeautifulSoup and lxml for content already provided to the agent, plus common date, math, validation, and text-handling tools.

Alongside those libraries are shell and file tools. The agent can create a file, run a command, inspect the result, adjust its approach, and try again within the same container. That read-run-read loop is the important part. The agent is not limited to one clever function call; it can react to what its own code produced.

> These libraries are preinstalled today. The exact list and versions will change over time. Use the [agent-harness-explorer](https://microsoft.github.io/cat-agent-skills/skills/agent-harness-explorer/) described below to inspect the current environment.
{: .prompt-info }

## The sandbox does not get an open internet connection

Agents can use the local runtime and installed libraries, but supported external access needs to go through [Tools](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/tools-overview): connectors and MCPs. Configured [Knowledge](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/knowledge-copilot-studio) can supply grounded content, while [Skills](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/skills-overview) can provide task-specific instructions and scripts.

This keeps local execution and external access as separate concerns. Connections outside the sandbox via [Tools](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/tools-overview) are subject to Copilot Studio [security and governance](https://learn.microsoft.com/microsoft-copilot-studio/security-and-governance) controls, including applicable [data policies](https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention) for connectors.

Here is a practical distinction to make: an installed networking library provides a **capability**, not **permission**. The sandbox includes `requests`, in part because other installed libraries depend on it. Its presence means Python code knows how to make an HTTP request. However, that does not mean the sandbox is allowed to send that request beyond its boundary.

So the presence of `requests` does not establish permission or supported connectivity to send an email, write a file to SharePoint, call an arbitrary API, or order lunch. The library supplies code-level capability but the agent definition operating within configured platform capabilities determines what the agent can reach.

The sandbox is a space where local code cannot assume an open inbound or outbound network path. Files and content can still be supplied through the user chat experience and configured agent capabilities, but the sandbox is designed as a safe and isolated execution environment. That sandbox is an ideal place to execute the code an agent may have generated seconds ago to try to solve a problem the user gave it.

## Live code, or a script you packed yourself

There are two ways code ends up running in the sandbox:

- **Code the agent writes on the fly.** After receiving a user prompt, the agent may reason, write some Python, and run it in the sandbox. This works well for a one-off or when you cannot predict the task's shape in advance: parse this oddly formatted export, reconcile these two lists, chart whatever is in this file, or generate a report. The code can adapt to the specifics in front of it, but the code may be different on the next run.
- **A script you packaged into a Skill.** If you supply the agent with a skill, potentially containing pre-written scripts, then that can make the required steps easier to complete and they can be completed in a standard repeatable way. The harness helps the agent select the Skill when it is relevant; the sandbox provides the controlled place to run its script.

The rough rule is simple: if the work is **novel**, the agent can improvise; if the work is **repeatable**, then use a reviewed Skill with scripts can improve consistency and validate the end-to-end behavior with evals. Most useful agents do both, relying on packaged skills and scripts for the steps that should stay stable and improvising around the edges.

## Where the edges are

Once you know where the harness ends and the sandbox begins, a few next-level considerations become clearer:

- **Libraries change.** The preinstalled library set is a snapshot, and snapshots change between releases. A version change can shift behavior. If a script depends on a library doing something specific, treat that dependency like any other and regression-test the agent [with evals](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/analytics-agent-evaluation-intro). For one way to make that check part of delivery, see [Quality Gates for Copilot Studio]({% post_url 2026-04-19-copilot-studio-eval-gate-azure-devops %}).
- **Skills are part of the agent.** A Skill is an agent asset that moves between environments with the agent. As you rely on packaged scripts, you inherit ordinary lifecycle questions: how the approved version moves from development to production, and how you verify that it still behaves as expected. Copilot Studio has broad [application lifecycle management (ALM) support](https://learn.microsoft.com/power-platform/architecture/reference-architectures/enterprise-power-platform-alm), including [Power Platform Pipelines](https://learn.microsoft.com/power-platform/alm/pipelines) for solution movement and [evals](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/analytics-agent-evaluation-intro) for ensuring that agents are running as expected.

## What this actually gets you

A few examples from conversations we keep having with customers:

- **Document generation.** The harness gives the agent the request, instructions, and source content. The agent uses python-docx or python-pptx to assemble a report or presentation and return the finished file. The sandbox ensures that the document is only leveraging the information it has access to.
- **Content review.** Knowledge, files, or Tools supply the content and rules. The agent can extract text from a provided PDF or HTML document, reshape the results, and run local checks within the sandbox. A packaged Skill script is a good fit for checks that must be repeated consistently.
- **Data analysis.** The agent receives a messy spreadsheet, cleans it with pandas in the sandbox, calculates the numbers, and creates a chart with matplotlib. The model can then explain what the computed results mean or generate a file within the sandbox and pass it to the user.

Those examples highlight how the agent, it's model, and the agent harness work within the sandbox. The model reasons, the harness supplies the right context and capabilities, and the agent performs the supported local work within the boundaries of the sandbox.

## "How do I know which libraries and capabilities are available in the agent sandbox?"

We built a small Skill for exactly this. The [agent-harness-explorer](https://microsoft.github.io/cat-agent-skills/skills/agent-harness-explorer/) inspects the running environment and creates a self-contained HTML report of the Python runtime, installed libraries, and the Tools and Skills visible to the agent.

A report from an otherwise empty Copilot Studio agent on 2026-07-20 found **Python 3.12.9** in a **container**, with **97 Python libraries**, **11 built-in tools**, **8 Skills**, and **no MCP servers** configured for that agent. The numbers provided dated snapshot, not a permanent contract. The [agent-harness-explorer](https://microsoft.github.io/cat-agent-skills/skills/agent-harness-explorer/) stays passive by default, so checks that would write to the filesystem or probe outbound HTTPS can remain unverified, but the agent can be encouraged to perform deeper inspection if needed.

![Example Agent Harness Capability Report showing the runtime, available capabilities, tools, Skills, and Python libraries](/assets/posts/copilot-studio-agent-sandbox/agent-harness-explorer-report-example.png){: .shadow }
_An example report generated by the agent-harness-explorer Skill._

Now, when someone asks whether a library is available in the sandbox, you can inspect the environment instead of guessing.

## Ready for action

The model supplies reasoning. The runtime harness adds instructions, Knowledge, Skills, Tools, and orchestration. The sandbox supplies an isolated place to run supported local code with useful libraries and file tools. And ideally evals help confirm that the agent behaves as intended.

For users, that means an agentic loop can finish more of the job. For makers, it means generated code and packaged Skill scripts can share a capable local runtime. For admins, it means local execution stays contained while external actions use the governed routes you allow.

So now that Copilot Studio agents are so much more capable, what business problems will your next Copilot Studio agent help solve?