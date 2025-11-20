---  
layout: post  
title: "Bringing Microsoft 365 Copilot into Copilot Studio with Agent 365 MCP Servers"  
date: 2025-11-19 09:00:00 +0100  
categories: [copilot-studio, frontier, mcp]  
tags: [A365, Agent 365, frontier, copilot, sharepoint, outlook]  
description: Use the new Agent 365 tooling servers to bring Microsoft 365 Copilot Search, SharePoint & OneDrive, Outlook Mail, Outlook Calendar, Word and more directly into your Copilot Studio agents. 
author: giorgioughini
image:
  path: /assets/posts/a365-mcp-frontier/header.png
  alt: "Common image used by Giorgio Ughini in all his posts, with the Copilot Studio icon that is linked to M365 Copilot shown into a laptop"
  no_bg: true
---  
  
Microsoft just dropped one of the **biggest power-ups** for Copilot Studio makers: **Agent 365 tools**, and in particular, **MCP servers**.  
  
If you're in the [Frontier program](https://adoption.microsoft.com/en-us/copilot/frontier-program/) and you have a **full Microsoft 365 Copilot license**, you can now plug **Microsoft 365 Copilot–style capabilities** directly into your own agents in Copilot Studio.  
  
Think of it as: _"Using Microsoft 365 Copilot inside Copilot Studio"_ — but with your own conversation flows, custom tools, and business logic wrapped around it.  
  
In this post:  
  
- **What** Agent 365 MCP servers are and **why** they matter    
- **Prerequisites** you must have in place    
- The **core Agent 365 tooling servers** we'll focus on: Copilot Search, SharePoint & OneDrive, Outlook Mail, Outlook Calendar      
- A **full example**: a _"Briefing Assistant"_ that researches with Copilot Search, drafts in Word, sends mail, and schedules meetings   
  
## What are Agent 365 MCP servers?  
  
**Agent 365 MCP servers** (Agent 365 tooling servers) are **enterprise-grade** Model Context Protocol (MCP) servers that expose **deterministic, auditable tools** for Microsoft 365 workloads—Outlook, Teams, SharePoint, OneDrive, Dataverse, Word, and more—through the Agent 365 tooling gateway.    

> Agent 365 isn't an "unregulated shortcut" to Microsoft 365 data. It respects the same security, licensing, and compliance boundaries that apply to Microsoft 365 Copilot itself.  
{: .prompt-info }  
  
They give your agents **secure, user-scoped access** to work content and actions, such as:  
- **Files and sites** in SharePoint and OneDrive    
- **Emails, threads, and calendar items** in Outlook Mail and Outlook Calendar    
- **User profiles and org hierarchy** via Microsoft 365 User Profile    
- **Line-of-business data** via Dataverse    
- The **Microsoft 365 Copilot chat experience** via the Microsoft 365 Copilot Search MCP server, including multi-turn conversations and file grounding  
  
You still design and orchestrate everything in Copilot Studio, but when your agent needs to **reason over a user's work data** or take **concrete actions** (send an email, schedule a meeting, create a document), it can call the relevant Agent 365 tooling server behind the scenes.  
  
Conceptually:  
  
- **Copilot Studio** = where you _design_ the agent, conversation, instructions, and extra tools.    
- **Agent 365 tooling servers** (A365 MCP servers) = how your agent _taps into_ Microsoft 365 content and intelligence, with deterministic, auditable tools, on behalf of the signed-in user—under centralized governance and policy enforcement.  
  
## Frontier and licensing: what you MUST have

> As of today (November 19, 2025), this capability requires a full Microsoft 365 Copilot license for users of the agent. Without a full Microsoft 365 Copilot license, users will NOT be able to use Agent 365 MCP servers from Copilot Studio.  
{: .prompt-warning }  
  
Before you even look for A365 in Copilot Studio, make sure these boxes are checked:  
  
1. **Your tenant is enrolled in Frontier**    
   - A365 servers are **only available** to Frontier organizations.    
   - Ask your admin / product owner to enroll via the Frontier program.    
   - Link: [Frontier program](https://adoption.microsoft.com/en-us/copilot/frontier-program/).
  
2. **Admin consent is in place** (depending on your tenant policies)    
   - Your IT admins might have to allow:  
     - The Frontier features (Microsoft Admin Center -> Copilot -> Settings -> Copilot Frontier -> Turn on).
     - Wait a few minutes after you turn on those features and you'll see a new "Agents" section in the MAC. Access to the A365 servers will be available as soon as you see the "Agents" submenu, after turning on Frontier Tooling.  

![Image 3: MAC after having enabled the Frontier features](/assets/posts/a365-mcp-frontier/img3-mac-enablement.jpg){: .shadow w="972" h="589" }
_Here's the section you'll be able to see within a few minutes of turning on the Frontier features_
  
## Meet the Agent 365 tooling servers  
  
Today, Frontier tenants see a set of Agent 365 MCP servers that map to **familiar Microsoft 365 experiences** and expose **granular, auditable tools**. In this article we'll focus on a few, but the catalog is broader.  
  
**Core servers** we'll refer to in examples:  
  
- **Microsoft 365 Copilot Search MCP server**: The Microsoft 365 Copilot chat experience exposed as an MCP server.   
  - Start or continue _multi-turn conversations_ with Microsoft 365 Copilot, ground responses with files and attach contextual resources.  
  
- **Microsoft SharePoint and OneDrive MCP server**: Access and manage files the user can see in SharePoint and OneDrive.    
  - Searching and reading files and folders
  
- **Microsoft SharePoint Lists MCP server**: Work with structured data in SharePoint lists:
  - Create lists, columns, and items; query with filters and pagination.
  
- **Microsoft Outlook Mail MCP server**: Email composition and management
  - Create and send emails  
  - Search and filter with KQL-style queries and OData.  
  
- **Microsoft Outlook Calendar MCP server**: Event and meeting management  
    - Create, read, update, and delete events, including finding free/busy slots.    
    - Accept, decline, and cancel invitations.
  
You can **combine these in a single Copilot Studio agent**. That's where it gets really interesting.  
  
Beyond these, the Agent 365 catalog also includes the below servers:  
  
- **Microsoft 365 User Profile MCP server** – get user profiles, manager/direct reports, and search users.    
- **Microsoft Dataverse MCP server** – CRUD operations and domain-specific actions on Dataverse and Dynamics 365 data.    
- **Microsoft Teams MCP server** – manage chats, messages, channels, and membership.    
- **Microsoft Word MCP server** – create and read Word documents, manage comments, and work with DOCX content.    
- **Microsoft MCP Management MCP server** and **Microsoft 365 admin center MCP server** – for governance and admin-focused tools.  
  
These servers all share the same DNA: **deterministic tools**, **centralized governance**, and **enterprise-grade observability**. 

> Looking for Agent 365 MCP Servers documentation? Find it [by clicking here](https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview).  
{: .prompt-info }  
  
## Example: Build a _"Briefing Assistant"_ agent with Agent 365  
  
Now let's make things concrete and build an **end-to-end** and **task-oriented** agent.  
  
**Goal**: A _"Briefing Assistant"_ agent that can:  
  
- Use the **Microsoft 365 Copilot Search MCP server** to research a topic across your organization's content.    
- Create a **Word document** summarizing the findings with the **Microsoft Word MCP server**.    
- **Email** that doc to your manager using the **Microsoft Outlook Mail MCP server**.    
- Optionally, **schedule a follow-up meeting** with your manager via the **Microsoft Outlook Calendar MCP server**.    
- Use the **Microsoft 365 User Profile MCP server** to resolve "my boss" into the right person.  
  
Think of it as: _"Do the research, draft the doc, share it, and book time with my boss – all from one prompt."_  
  
### 1. High-level flow  
  
1. **User**:    
   _"Find everything I should know about the Fabrikam renewal this quarter, put it into a Word briefing, send it to my boss, and schedule 30 minutes with them this week to review."_  
  
2. **The agent**:  
   - Uses the **Microsoft 365 Copilot Search MCP server** to: 
     - Ground the conversation with relevant files (contracts, emails, meeting notes) about "Fabrikam renewal this quarter".  
   - Uses the **Microsoft Word MCP server** to:  
     - Create a new briefing document in OneDrive. 
   - Uses the **Microsoft 365 User Profile MCP server** to:  
     - Resolve "my boss" → the user's manager (UPN/email).  
   - Uses the **Microsoft Outlook Mail MCP server** to:  
     - Draft an email to the manager with the Word doc attached/linked.  
   - Uses the **Microsoft Outlook Calendar MCP server** to:  
     - Find a 30-minute free slot for both people this week and create a Teams meeting with the doc link in the invite.  
  
### 2. Configure the right Agent 365 tooling servers  
  
In your **Frontier tenant**:  
  
1. Open **Copilot Studio** and edit your agent (e.g., _"Briefing Assistant Agent"_).    
2. Go to the **Tools / MCP section**.    
3. **Enable** these MCP servers:  
   - **Microsoft 365 Copilot Search MCP server**    
   - **Microsoft Word MCP server**    
   - **Microsoft 365 User Profile MCP server**    
   - **Microsoft Outlook Mail MCP server**    
   - **Microsoft Outlook Calendar MCP server**    
   
![Image 5: Copilot Studio "Tools" pane with the five MCP servers toggled ON: Copilot Search, Word, User Profile, Outlook Mail, Outlook Calendar.](/assets/posts/a365-mcp-frontier/img5-briefing-tools.jpg){: .shadow w="972" h="589" }
_Agent 365 tooling servers enabled for Briefing Assistant_
  
### 3. Add planning instructions for orchestration  
  
Add something like this to your **agent instructions**:  
  > When the user asks you to research a topic and then produce follow-up actions such as creating a document, sending an email, or scheduling a meeting:  
  >  
  > - Leverage Microsoft 365 Copilot Search MCP server to explore the topic conversationally, grounding responses with relevant files when appropriate. Aim to return a clear, executive-ready summary that highlights context, risks, and recommended actions.  
  > - Use Microsoft Word MCP server when a document is needed. Create a well-structured briefing in OneDrive with headings and sections that make the content easy to consume.  
  > - Resolve recipients intelligently using Microsoft 365 User Profile MCP server (e.g., “my boss” or “my manager”). If no match is found, ask the user who should receive the output.  
  > - Communicate outcomes via Microsoft Outlook Mail MCP server when the user wants to share information. Draft a concise email with the document link and a short explanation.  
  > - Handle scheduling requests with Microsoft Outlook Calendar MCP server. Find a suitable time slot for all parties and create an online meeting that includes the briefing link.  
  > - Always confirm what you did—such as document name, recipients, and meeting details—so the user stays informed and in control.

![Instructions guiding Briefing Assistant orchestration with Agent 365 MCP servers](/assets/posts/a365-mcp-frontier/img6-briefing-instructions.jpg){: .shadow w="972" h="589" }
_Instructions guiding Briefing Assistant orchestration with Agent 365 MCP servers_
  
### 4. Example conversation  
  
**User**:  
  
> Find everything I should know about the Fabrikam renewal this quarter, create a briefing document, send it to my boss, and book 30 minutes with them this week to review.  
  
**Behind the scenes**, the orchestrator uses **Microsoft 365 Copilot Search** to gather and summarize key details about the Fabrikam renewal, then creates a **structured Word briefing** in OneDrive. It resolves the user's manager, sends the document link via Outlook, and schedules a **Teams meeting** through Outlook Calendar for a review.
  
And the agent responds something like in the screenshot below:  

![Briefing Assistant using Copilot Search, Word, Outlook Mail and Calendar MCP servers](/assets/posts/a365-mcp-frontier/img7-briefing-chat.jpg){: .shadow w="972" h="589" }
_Copilot Studio test chat showing the long user prompt and the agent's confirmation, with the trace pane indicating calls to Copilot Search, Word, User Profile, Outlook Mail, and Outlook Calendar MCP servers._
  
## Why this is a big deal for Copilot Studio makers  
  
Agent 365 MCP servers basically **remove the wall** between:  
  
- _"My custom Copilot Studio agent"_    
- _"The rich Microsoft 365 context and actions that previously only first-party experiences had"_  
  
Now you can:  
  
- **Keep** your custom domain logic, flows, and tools in Copilot Studio.    
- Still **benefit** from:  
  - Access to **actual work content** (SharePoint, OneDrive, Outlook, Teams, Dataverse, etc.).    
  - **Deterministic, auditable tools** for sending emails, scheduling meetings, creating documents, and updating records.    
  - **Microsoft 365 Copilot's conversational reasoning** via the Microsoft 365 Copilot Search MCP server.  
  
## Key takeaways  
  
- **Agent 365 MCP servers** (Agent 365 tooling servers) let Copilot Studio agents act with the **same depth of context and actionability** you expect from Microsoft 365 — but **under your rules** (aka orchestrator).    
- You **must** be in **Frontier** and have a **full Microsoft 365 Copilot license** to use them today in this preview.    
- In this article we focused on:  
  - **Microsoft 365 Copilot Search MCP server**   
  - **Microsoft Outlook Mail MCP server**    
  - **Microsoft Outlook Calendar MCP server**    
  - **Microsoft Word MCP server**    
  - **Microsoft 365 User Profile MCP server**    
- The broader Agent 365 catalog also includes MCP servers for **Teams**, **SharePoint**, **Dataverse/Dynamics 365**, **MCP management**, and the **Microsoft 365 admin center**.    
- With a bit of planning in your agent instructions, you can:  
  - **Search** across user work content.    
  - **Analyze** decisions and risks.    
  - **Produce** highly contextual, structured responses.    
  - **Automate real work**: sending emails, scheduling meetings, creating documents, and more—directly inside your Copilot Studio experiences.  
  
If you build your own _"Briefing Assistant"_, or a similar pattern with Agent 365 MCP servers, share your results, patterns, and gotchas, we're at the **very beginning** of what these Agent 365 integrations can do.