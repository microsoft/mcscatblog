---  
layout: post
title: "Influencing Agent Planning with Contextual Instructions"
date: 2025-11-11 11:11:00 +0100
categories: [copilot-studio, tutorial, orchestration]
tags: [instructions, planning, knowledge, mcp-server]
description: How to provide additional context and influence agent behavior through instructions, including specific tools and knowledge consultation.
author: giorgioughini
---  

Copilot Studio allows you to orchestrate both the agent’s behavior as well as its decision to use certain tools within a plan, through instructions. These instructions can specify which tools to use, under what conditions, and even how to combine different data sources to deliver more accurate responses.

## Why Provide Context to the Agent

- Improves response quality in complex scenarios.
- Enables integration of heterogeneous sources (e.g., MCP server + knowledge).
- Reduces the risk of errors caused by outdated data.


> Instructions are especially useful when we know that the output of a tool alone isn’t enough and additional corrections or notes need to be consulted.
{: .prompt-info }

## Example Scenario
Imagine an organization that uses:

- An MCP server for real-time operational data (e.g., monthly KPIs).
- A knowledge base containing deep dives on these KPIs, including updates and corrections for specific past months.

The challenge: the MCP server provides live data but doesn’t know about corrections stored in the knowledge base. Meanwhile, the knowledge base contains those corrections but lacks the most up-to-date figures (except for the corrections themselves).

The solution: through instructions, we tell the agent to consult both sources and unify the response. However, we want this knowledge lookup to happen only when the question involves data, not by default on every interaction. For example:

- A question that doesn’t require live data should only query the knowledge base.
- A question asking for a full KPI overview should automatically include knowledge corrections.


### Step 1: A Normal Query (MCP Server Only)
First, we ask a simple question:

> Show me the NPS for 2025 so far.

![Simple Response](/assets/posts/influence-orchestration-knowledge/scr1.jpg){: .shadow w="972" h="589" }
_Agent provides a response only checking real-time data and not knowledge_

The agent, without additional instructions, queries the MCP server and returns the list of data.
Result: we get KPIs from the MCP server, but these figures haven’t been cross-checked against the knowledge base for corrections.

![Knowledge Proof](/assets/posts/influence-orchestration-knowledge/scr2.jpg){: .shadow w="972" h="589" }
_We have a knowledge document that reports some corrections in the MCP-retrieved KPI, but it was not consulted_

Let's see if by manually querying the knowledge base, we are able see if any adjustments exist...

![Knowledge Only](/assets/posts/influence-orchestration-knowledge/scr4.jpg){: .shadow w="972" h="589" }
_Agent shows that indeed there was a correction in the NPS score_

We can see that the knowledge base reports that in February 2025, there was a correction on the NPS: the correct value is 88, not 82 as reported by the MCP server.

### Step 3: Instructions for the Orchestrator
Here’s the key point: for every KPI-related question, we want the agent to:

1. Query the MCP server for live data.
2. Check the knowledge base for any corrections.
3. Merge the results into a unified response.

> Instructions act as guidelines that the orchestrator follows not only to provide context for the answer but also to plan its actions.
{: .prompt-tip }

A typical instruction might be:

> “When the question involves monthly KPIs, use the MCP tool for data and then consult the knowledge base for corrections. If corrections exist, include them in the response.”


### Final Demonstration
Let’s repeat the initial question:

> Show me last year’s KPIs.

![Knowledge and MCP](/assets/posts/influence-orchestration-knowledge/scr3.jpg){: .shadow w="972" h="589" }
_Agent now looks both at the knowledge as well in the MCP server for a omnicomprhensive response_

Thanks to the instructions:

- The agent calls the MCP server → retrieves KPIs.
- Then consults the knowledge base → finds the correction.

**Final response**: The KPI list comes from the MCP server, but the operating margin is corrected according to the knowledge base.

## Checklist for Implementing This Pattern

- Define instructions in the orchestrator (Copilot Studio → Agent → Instructions).
- Specify how, what, and when (e.g., MCP for data, knowledge for corrections, unify results).
- Test with simple questions and verify consistent behavior.
- Keep instructions clear and contextual; avoid ambiguity.


## Key Takeaways

- Instructions allow you to influence the agent’s planning.
- You can orchestrate multiple sources (MCP + knowledge) without writing code.
- This approach improves accuracy and reduces errors caused by incomplete data.


## Try It Yourself

1. Configure any tool or an MCP server and add a knowledge base in Copilot Studio.
2. Add instructions that define the desired behavior.
3. Run test queries and observe how the agent combines sources.


Questions or feedback on this pattern? Share them in the comments or in the sample repo.