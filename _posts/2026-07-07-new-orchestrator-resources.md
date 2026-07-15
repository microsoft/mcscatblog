---
agent_edition: modern
layout: post
title: "New Orchestrator, New Rules? CAT's Got You"
date: 2026-07-07
categories: [copilot-studio, orchestration]
tags: [copilot-studio, modern-agents, orchestration, upgrade, skills, agent-development]
mermaid: false
pin: true
description: "The new Copilot Studio experience is a big shift. We shipped three resources so you can understand it, see it run, and upgrade to it. Here's how to use each one."
author: [giorgioughini, roels, adilei, henryjammes, chrisgarty, lewisdoesdev, adrianatruji]
image:
  path: /assets/posts/new-orchestrator-resources/header.png
  alt: "Three new resources to get started with modern agents: migrations, samples, and a deep-dive deck for the new stack"
---

The new Copilot Studio experience, and the orchestration stack underneath it, is a big shift. It's a new paradigm for agents and workflows: agents are far more adaptive and sophisticated, and workflows let you build automated processes on a visual canvas with much more control over which steps are handled by AI. That's a lot of new capability, and it changes how you design.

New design space, new stack, new questions: What changed? What do I build? What about my existing classic agents? We shipped three resources to answer exactly those. Here's how to use each one.

| Want to... | Use... |
| --- | --- |
| Understand and explain what changed | The **[Deep Dive deck](https://aka.ms/CopilotStudioDeepDiveDeck)** |
| See it running end to end | The **[mini-site](https://aka.ms/MCSTechGuide)** |
| Upgrade a classic agent | The **[plugin](https://github.com/microsoft/copilot-studio-plugin)** |

## Understand it: the Technical Deep Dive deck

**Use it when** you need to learn, or explain, *what* changed and *why*. Grab the [Copilot Studio Technical Deep Dive deck](https://aka.ms/CopilotStudioDeepDiveDeck). It's built for agent and workflow builders and architects, and it works as a decision framework more than a feature tour. It walks through where to build what (agent vs. workflow, and which pieces belong where), how to build modern agents and workflows, how to upgrade from classic to modern without just porting the old design, and an honest read on what's improved and what isn't supported yet.

**The one idea to take away:** every behavior belongs in the smallest component that makes it reliable and inspectable. Instructions carry what's always true, Knowledge the searchable facts, Tools the system actions, Memory the persistent context, Skills the situational procedures, and connected agents the real specialist domains.

![The component model slide from the deep dive deck](/assets/posts/new-orchestrator-resources/componentslide.png){: .shadow }
_A slide from the Technical Deep Dive deck showing the new component model: instructions, knowledge, tools, memory, Skills, and connected agents each with their own job._

## See it: the mini-site and samples

**Use it when** you're ready to move from "I get the slide" to "show me it running." Open the [technical guide mini-site](https://aka.ms/MCSTechGuide), read the building blocks, run the scenario transcripts, then download the solution and deploy it into your own Power Platform environment.

![The mini-site homepage](/assets/posts/new-orchestrator-resources/minisite.png){: .shadow }
_The mini-site homepage, built around the BlastBox Omega sample and its two scenarios._

It's a real, deployable sample, not screenshots with a story. **BlastBox Omega**, a retro-future game store run by agents, shows the new experience doing the things a slide can only promise: agents that reason across multiple turns, delegate to specialists, take real actions, and produce actual deliverables. Its two scenarios make that concrete:

- **Self-Serve Card Reissue** — an agent handles a member request end to end, gating a real write action behind an identity check and handing back a generated file.
- **Block Party Trade-Up** — the flagship, where a parent agent coordinates specialist agents to untangle a messy, multi-part request and settle it with a downloadable document.

The value is seeing where each responsibility lives: specialist reasoning in connected agents, actions in tools, repeatable procedures in Skills, exact math in code. That's the real lesson. A modern agent shouldn't be one instruction blob with 43 tools and a prayer.

## Upgrade it: the Copilot Studio plugin

**Use it when** you have a classic agent and want a head start on a modern version. Install the [Copilot Studio plugin for AI coding agents](https://github.com/microsoft/copilot-studio-plugin), then send `/migrate` with the agent's environment, tenant, and Copilot Studio URL plus any constraints. It pulls the classic agent, analyzes its structure, proposes a modern architecture, and builds an upgraded agent you can test. (Same local-first idea as the earlier [Claude Code plugin demo]({% post_url 2026-03-26-claude-copilot-skills-copilot-studio-plugin-demo %}), now with support for the new stack.)

![The plugin upgrade flow](/assets/posts/new-orchestrator-resources/plugin.png){: .shadow }
_The plugin analyzes a classic agent, proposes a modern architecture, and generates an upgraded agent for testing._

> Starter prompt: `/mcs-assistant:migrate Upgrade this agent to modern orchestration: https://copilotstudio.microsoft.com/environments/<ENV_ID>/bots/<BOT_ID> from tenant <TENANT_ID>`. Use a capable AI model.
{: .prompt-info }

The key word is **propose**. It performed well in testing, but it's a fast assistant, not a "make my architecture correct" button. Don't turn every topic into a Skill and every variable into memory just because they existed, that's archaeology with YAML. Understand the task, keep the outcomes that must work, map each responsibility to a modern component, then run evals against the core journeys.

> Treat the output as a first draft: run it, inspect it, compare against your old evals, decide if it's good enough.
{: .prompt-warning }

## That's the on-ramp

The new experience is a different mental model, not just a new UI, and that can feel like a lot. So CAT turned it into three steps: **deck** to get the concepts, **mini-site** to see them run, **plugin** to try them on a real agent. We got you.

Tried the samples or the plugin's upgrade workflow? We'd love to hear what surprised you, and whether the proposed architecture matched how you'd have redesigned the agent.
