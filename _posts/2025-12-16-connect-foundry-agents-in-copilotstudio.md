---  
layout: post  
title: "Video Demo: Connect a Microsoft Foundry agent in Copilot Studio"  
date: 2025-12-16 14:32:00 +0100  
categories: [copilot-studio, foundry-agent, connectedagent, a2a]
tags: [a2a, agent, foundry, copilotstudio, connected-agent, multi-agent, integration, orchestration]  
description: Quick illustration of integrating Foundry agents with Copilot Studio  
author: jpad5  
image:  
  path: /assets/posts/connected-agents/1.jpg
  alt: "Foundry Agent connected to Copilot Studio"  
  no_bg: true  
---  
  
> Note: This post highlights how to connect foundry agents in Copilot Studio, demonstrating a simple pattern to linking agents, along with a video walkthrough.
{: .prompt-info }  

## Building Multi‑Agent Systems in Microsoft Copilot Studio with Foundry Agents 

As AI systems grow more capable, the need for **multi‑agent collaboration** becomes essential. Microsoft Copilot Studio now makes this easier than ever through **connected agents**, a powerful capability that allows your copilots to orchestrate and collaborate with external agents, including those built in **Microsoft Foundry**, with seamless integration and enterprise‑grade security. 

This post summarizes a hands‑on demo that showcases how Copilot Studio and Foundry agents work together to deliver a scalable, flexible, and truly agentic solution. 
 

## What Are Connected Agents? 

Connected agents enable Copilot Studio to reach beyond built‑in capabilities and interact with **external data, models, and services.** They allow Copilot Studio to: 

- Call agents built using different platforms 

- Delegate tasks to specialized sub‑agents 

- Extend beyond static prompts and models 

- Enable dynamic, multi‑agent orchestration without custom routing logic 

In short: **agents become bridges between AI models and real‑world data.**


## Why Use Connected or Multi‑Agent Designs? 

As your Agent landscape grows, adding more tools or skills inside a single agent eventually becomes unmanageable. When the Agent struggles to reliably differentiate which tool to call, it’s time to break the system into multiple purpose‑driven agents. 

Multi‑agent design improves: 

- **Accuracy** — each agent specializes in its domain 

- **Maintainability** — components evolve independently 

- **Scalability** — you can add new capabilities without bloating one agent 

- **Performance** — the orchestrator routes only what’s needed 

It’s the difference between one overloaded generalist and a **team of specialists working together**. 


## Demo Overview: A Learning Assistant Powered by Multiple Agents 

The demo introduces a Learning Assistant agent that delegates questions to the appropriate domain expert: 

**✔ Algebra Agent (Foundry Agent)**

- Built and hosted in Azure AI Foundry 

- Connected using the Foundry agent service 

- Uses Microsoft Entra ID authentication 

- Accepts input parameters such as the question text 

**✔ Biology Agent (Copilot Studio Agent)**

- Built directly in Copilot Studio 

- Simple, no input parameters 

- Answers biology‑specific prompts 

**✔ Future Expansion**

A Chemistry Agent is planned using the **A2A (Agent‑to‑Agent) protocol**, enabling cross‑platform interoperability. 

## Watch the Demo    
  
<iframe width="760" height="515" 
        src="https://www.youtube.com/embed/yuvFq_dxbcM" 
        title="Video: Connect a Microsoft Foundry agent in Copilot Studio"
        frameborder="0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
</iframe>


## How the Demo Works

1. **User asks a biology question** → Copilot Studio’s orchestrator routes it to the Biology Agent. 

2. **User asks an algebra question** → The system calls the Foundry Algebra Agent. 

3. The platform automatically selects the right agent based on its metadata—no custom logic required. 

This shows how **real‑time multi‑agent collaboration** happens seamlessly across low‑code (Copilot Studio) and pro‑code (Foundry) environments. 

## Behind the Scenes: Connecting Foundry Agents 

To connect a Foundry agent: 

1. Capture two elements from your Foundry project: 

    - Agent Name 

    - Endpoint URL (https://Yourfoundryprojectname-resource.services.ai.azure.com/api/projects/Yourfoundryprojectname) 

2. In Copilot Studio, select “Connect to an external agent” → Microsoft Foundry  

3. Authenticate via Microsoft Entra 

4. Provide the endpoint URL 

Copilot Studio automatically creates the connected agent configuration 

Once connected, the Foundry agent appears in the agent list just like any other Copilot Studio agent. 


## Traceability & Observability 

When Copilot Studio calls a Foundry agent, the Foundry trace view shows: 

- Input received 

- Output generated 

- Conversation or correlation IDs 

- Completion timestamps 

This makes debugging and improving agent behavior significantly easier. 

## Key takeaways  

This end‑to‑end walkthrough demonstrates how Copilot Studio and Foundry create a unified agentic ecosystem: 

- Low‑code + Pro‑code working together 

- Secure and authenticated cross‑agent communication 

- Domain‑specific delegation 

- Scalable multi‑agent architecture 

- Foundation for A2A‑based cross‑platform agent networks 

This is how organizations can build true agentic systems that integrate data, actions, reasoning, and expertise across multiple platforms leveraging the power of connected agents in Microsoft Copilot Studio.

Happy Automating!