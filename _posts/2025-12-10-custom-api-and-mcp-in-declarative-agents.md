---      
layout: post      
title: "VIDEO TUTORIAL: Add Custom APIs and MCP Servers to Declarative Agents"      
date: 2025-12-10 9:00:00 +0100      
categories: [copilot-studio, declarative-agents, video]      
tags: [custom-api, mcp-server, agent-builder, m365-copilot, tutorial]      
description: Short video walkthrough on how to plug custom HTTP APIs and MCP servers into Declarative Agents.      
author: giorgioughini      
image:  
  path: /assets/posts/custom-api-and-mcp-in-declarative-agents/header-da.png  
  alt: "Cover image for the tutorial on wiring custom APIs and MCP servers into declarative agents in Microsoft 365 Copilot"  
  no_bg: true  
---    
  
> **Heads up**: This is a **video-first** tutorial. The post just sets the context: everything interesting happens in the recording below.    
{: .prompt-info }  
  
If you've tried **Agent builder inside Microsoft 365 Copilot**, you know how fast it is to spin up a declarative agent: define its purpose, add a few knowledge sources, publish, done.    
  
But there's a catch today:    
- You **can't directly add custom HTTP APIs** from the Agent builder UI    
- You **can't directly add MCP servers** either    
  
So many people assume: "I guess declarative agents can't call my backend or MCP tools yet."    
  
This video shows how to get around that assumption and **wire custom APIs and MCP servers into a declarative agent anyway**, in a way that is:    

- Quick to set up    
- Repeatable    
- Demo‑friendly (we do it live, end-to-end)    
  
---    
  
## Watch the tutorial    
  
{%  include embed/video.html    
  src='https://github.com/GiorgioUghini/WebVideos/releases/download/video-1-1.0.0/Custom-API-for-DA.mp4'    
  poster='/assets/posts/custom-api-and-mcp-in-declarative-agents/header-video.png'    
  title='Video: Add custom APIs and MCP servers to declarative agents in Microsoft 365 Copilot'    
  autoplay=false    
  loop=false    
  muted=false    
%}  
  
> Tip: Watch in fullscreen and pause as you follow along in your own tenant—the video is paced so we can build everything together.    
{: .prompt-tip }  
  
---    
  
## What you'll see in the video    
  
In the recording we walk through, step by step:  
  
- Creating a **plain declarative agent** to be used in Microsoft 365 Copilot (PAYG with Copilot Credits is possible)
- Introducing a **custom HTTP API** so the declarative agent can talk to your own backend logic 
- Testing the whole flow live so you can see:    
  - The agent calling your custom API    
  - How the end‑user experience looks inside Microsoft 365 Copilot    
  
No slides, no theory-only content but instead a **practical, live build** you can replicate.    
  
---    
  
## Who is this for?    
  
This video is useful if you:    
  
- Already build agents with **Agent builder** and feel limited by the current UI    
- Want your declarative agents to call **your own APIs** or **MCP servers**    
- Prefer to **watch** a complete setup rather than following our engineering docs    
  
If that's you, hit play and build along. **Already watched?** Tell me if you liked or not in the comments: it's my first video and I'm not sure if you prefer more blog content or videos.