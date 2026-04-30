---
layout: post
title: "Conversational Filtering of SharePoint Lists in Copilot Studio: The One-Tool Agent"
date: 2026-04-30
categories: [copilot-studio, connectors]
tags: [sharepoint, connectors, orchestration, retrieval-patterns, odata, tools, inputs, decision-guide]
description: "How to conversationally filter structured SharePoint list data from a Copilot Studio agent using the Get Items connector with dynamic OData filter inputs. No flows, no code, no knowledge, just one tool."
author: KarimaKT
image:
  path: /assets/posts/tool-inputs-sharepoint-list/header.png
  alt: Copilot Studio agent querying a SharePoint list with tool inputs
  no_bg: true
published: true
---

If you've ever tried to get a Copilot Studio agent to answer questions about **structured data** in a SharePoint list, you know the frustration. "Show me all pending shipments from Chicago." "Which orders have been in transit for more than 3 days?" "Give me a summary of shipments heading to Dubai." Simple questions, and yet the answers are... disappointing.

The usual advice? "Just add SharePoint as a Knowledge source!" But here's the thing: Knowledge sources in Copilot Studio are designed for **unstructured content**, documents, pages, files. They're great for looking up policies, finding FAQs, searching through manuals. They're *not* designed for querying rows and columns in a structured list. And even if you try to force it, you hit the wall fast: truncated results, no filtering, and an agent that confidently summarizes three rows out of three thousand.

## The Pain Is Real

If you've spent any time on forums, community posts, or other channels, you've seen the same questions over and over:

- *"How do I get my Copilot Agent to query a SharePoint list with 10,000+ items?"*
- *"My agent keeps returning the same 5 rows no matter what I ask."*
- *"I built a Power Automate flow for every possible filter combination and now I have 15 flows."*
- *"The agent can't even tell the difference between 'Pending' and 'In Transit' when filtering."*
- *"I need my users to ask natural language questions about list data without building a custom app."*

People build elaborate workarounds: chaining Power Automate flows, exporting to Excel and re-importing, writing custom APIs that wrap SharePoint's REST endpoints, even building entire Power Apps just to give users a search interface. All because they assume there's no way to do filtered, structured retrieval from a SharePoint list inside Copilot Studio without writing code.

But there is.

## The Secret: Connector Tools With Dynamic Inputs

Here's the key insight: when you add a connector action as a **tool** in Copilot Studio, the orchestrator wraps it in an AI layer. It reads the tool's input descriptions, understands the user's natural language request, and generates the right parameter values automatically.

That means you can use the SharePoint connector's **Get Items** action, set the `$filter` parameter as a **dynamic input** with a rich description of your list's columns, and let the orchestrator generate OData filter queries from plain English.

No Power Automate flows. No custom code. No API wrappers. One tool. One agent.

## The Scenario: A Shipping Tracker

Let's walk through this with a concrete example. Say you have a SharePoint list tracking shipments:

![SharePoint list with shipment data showing columns for Title, Tracking, Origin, Destination, Status, and Days in transit](/assets/posts/tool-inputs-sharepoint-list/sharepoint-list.png){: .shadow w="700" }
_A SharePoint list with shipment tracking data_

The list has columns like `Title` (shipment ID), `Tracking` (tracking number), `Origin`, `Destination`, `Status` ("Pending" or "In Transit"), and `Daysintransit`. A typical enterprise list with dozens or hundreds of rows.

You want users to ask questions like:

- "Show me all pending shipments from Chicago"
- "Which shipments are heading to Dubai with more than 3 days in transit?"
- "Find shipments originating from Miami or destined for Tokyo"

## Step 1: Add the SharePoint Connector as a Tool

In Copilot Studio, [add a new tool](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-connectors-as-tools) and select the **SharePoint** connector's [Get Items](https://learn.microsoft.com/en-us/connectors/sharepointonline/#get-items) action.

![Selecting the Get Items action from the SharePoint connector](/assets/posts/tool-inputs-sharepoint-list/getitems-tool-setup.png){: .shadow w="700" }
_Adding the SharePoint Get Items action as a tool_

Give it a name and description that tells the orchestrator what this tool is for:

- **Tool name:** `Get Shipping Info`
- **Tool description:** `Answer questions about order and shipping information`

> Tool names and descriptions are not for the end user, they're for the **orchestrator**. They help the LLM decide *when* to call the tool and *how* to fill in its inputs.
{: .prompt-info }

## Step 2: Configure Fixed Inputs

Some inputs should be fixed, they're the same every time the tool is called:

| Input | Type | Value |
|-------|------|-------|
| **Site Address** (`dataset`) | Fixed | Your SharePoint site URL |
| **List Name** (`table`) | Fixed | Your list's GUID |
| **Top Count** (`$top`) | Fixed | `50` (or whatever max you want) |
| **View** (`view`) | Fixed | Your list view GUID |

These ensure the tool always queries the right list and caps the number of returned items.

> **Be judicious with the data you send back.** The orchestrator reasons over the returned rows, but it has a context window limit. If your filter is too broad and returns hundreds of rows, the LLM won't magically analyze them all. It may truncate, hallucinate, or just ignore most of the data. The whole point of this pattern is to **filter down to the relevant subset before the orchestrator ever sees it**. Keep `$top` reasonable, write descriptive filter inputs that encourage narrow queries, and if a user's question is too vague, the agent should be designed to ask for clarification. Don't try to dump a 5,000-row list into a chat response.
{: .prompt-warning }

## Step 3: Configure the Dynamic Input (The Magic Part)

Here's where it gets interesting. The `$filter` parameter should be set as a [dynamic input](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-connectors-as-tools#add-tool-inputs), meaning the orchestrator will generate its value at runtime based on the user's question.

But the orchestrator needs to know *how* to generate a valid [OData filter](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests#odata-query-operators-supported-in-the-sharepoint-rest-service). That's what the **input description** is for. You need to describe your list's schema, column names, data types, and provide example queries.

> Pro tip: You can use M365 Copilot to help generate this description! Take a screenshot of your SharePoint list and ask Copilot to describe the columns and generate example OData queries.
{: .prompt-tip }

![Using M365 Copilot to generate the filter field description from a screenshot of the SharePoint list](/assets/posts/tool-inputs-sharepoint-list/m365-copilot-description.png){: .shadow w="700" }
_Using M365 Copilot to generate the OData filter description from a screenshot of the list_


## Step 4: Review the Final Configuration

Here's what the complete tool looks like in the Copilot Studio UI:

![Final tool configuration showing fixed and dynamic inputs](/assets/posts/tool-inputs-sharepoint-list/tool-configuration.png){: .shadow w="700" }
_The complete tool configuration with fixed site/list inputs and a dynamic OData filter_

And here's the corresponding YAML for the tool definition:

<details>
<summary>Full Tool YAML</summary>

<pre><code>kind: TaskDialog
inputs:
  - kind: ManualTaskInput
    propertyName: dataset
    value: https://contoso.sharepoint.com/sites/retailers
  - kind: ManualTaskInput
    propertyName: table
    value: 05b4156a-317e-4ff9-83f0-7e0663531004
  - kind: AutomaticTaskInput
    propertyName: "'$filter'"
    name: User request about order and shipping
    description: "A generated ODATA filter query for sharepoint getitems 
      to restrict the entries returned (e.g. stringColumn eq 'string' 
      or numberColumn lt 123). Each row represents one shipment. 
      Columns (internal names without spaces): Title (text, e.g., 
      'SHIP-1'), Tracking (text, e.g., '5FP4PIFGSV'), Origin (text, 
      e.g., 'Chicago'), Destination (text, e.g., 'Dubai'), Status 
      (text, e.g., 'Pending' or 'In Transit'), Daysintransit (number, 
      e.g., 2). Build OData filters using exact column names, single 
      quotes for strings, and lowercase logical operators (and, or). 
      Example queries: Status eq 'Pending', Origin eq 'Chicago' and 
      Status eq 'Pending', Daysintransit gt 3, Destination eq 'London' 
      and Daysintransit ge 3, Status eq 'In Transit' and 
      Daysintransit lt 2, Origin eq 'Miami' or Destination eq 'Tokyo'."
  - kind: ManualTaskInput
    propertyName: "'$top'"
    value: 50
  - kind: ManualTaskInput
    propertyName: view
    value: 800eb42c-c1dc-474f-8baf-3e023ccfd40c
modelDisplayName: Get Shipping Info
modelDescription: Answer questions about order and shipping information
outputs:
  - propertyName: value
    name: value
    description: List of Items
outputMode: All
</code></pre>

</details>

## Step 5: That's It. Seriously.

The agent needs **no custom toplevel instructions**. No topics. No flows. Just one tool.

![Agent overview showing a single tool and no custom instructions](/assets/posts/tool-inputs-sharepoint-list/agent-one-tool.png){: .shadow w="700" }
_A one-tool agent with no instructions, the orchestrator handles everything_

## Let's See It In Action

Here are real conversations with this agent:

**Query 1:** "Show me a report of which shipments from Miami or LA are busting my limit of 3 days in transit"

![Agent answering a query about shipments from Miami or LA exceeding 3 days in transit](/assets/posts/tool-inputs-sharepoint-list/chat-query-1.png){: .shadow w="700" }
_The orchestrator combines origin, status, and numeric filters into a single OData query_

**Query 2:** "What's the status of my shipments titled SHIP-10 and SHIP-12"

![Agent answering a query about specific shipments by title](/assets/posts/tool-inputs-sharepoint-list/chat-query-2.png){: .shadow w="700" }
_The orchestrator generates `Title eq 'SHIP-10' or Title eq 'SHIP-12'` and even offers follow-up actions_

**Query 3:** "Compare my shipments to London versus Sydney"

![Agent comparing shipments to London versus Sydney with analysis](/assets/posts/tool-inputs-sharepoint-list/chat-query-3.png){: .shadow w="700" }
_The orchestrator calls the tool twice, once per destination, then reasons across both result sets to produce a comparison_

## Bonus: Keyword Search in a Text Field

OData filtering isn't limited to exact matches. You can also use the `substringof` function for keyword searches across text columns. The trick is adjusting the filter description to teach the orchestrator this pattern.

Say your SharePoint list has a `Description` column with free-text entries:

![SharePoint list with a Description text column](/assets/posts/tool-inputs-sharepoint-list/keyword-search-list.png){: .shadow w="700" }
_A SharePoint list with a free-text Description column_

Update the dynamic input description to include substring search syntax:

![Updated description including substringof syntax for keyword search](/assets/posts/tool-inputs-sharepoint-list/keyword-description-change.png){: .shadow w="700" }
_Adding substringof examples to the filter description_

Now the agent can handle queries like "Which Tokyo and Sydney shipments have Customs information?":

![Agent performing a keyword and destination search across the list](/assets/posts/tool-inputs-sharepoint-list/keyword-test.png){: .shadow w="700" }
_The orchestrator combines a destination filter with `substringof('Customs', Explanation)` to find relevant entries_

## Bonus: Scoped Tools for Precision

You don't have to leave the entire filter query generation up to the LLM. You can create **scoped tools** that fix some filter values and only generate the rest:

- **One tool per region:** A "Get Chicago Shipments" tool where `Origin eq 'Chicago'` is baked in, and only the remaining filters are dynamic.
- **One tool per query pattern:** A "Track Shipment by ID" tool where the description says: *"Fetch the tracking ID in the form of a 10-character string and generate the filter: `Tracking eq '<ID>'`"*

Scoped tools reduce the LLM's decision space and improve accuracy for common query patterns.

## Why Does This Work?

A connector tool's inputs and outputs aren't meant for the end user or even the connector itself. They're instructions for the **orchestrator**. The orchestrator reads them, fills in the connector's actual parameters, calls the action, and interprets the response. This AI wrapper can be tailored to your specific use case, which is what makes this pattern so powerful.

![Diagram showing how connector tools act as AI-wrapped mini-agents for the orchestrator](/assets/posts/tool-inputs-sharepoint-list/connector-tool-diagram.png){: .shadow w="700" }
_Connector tools are AI-wrapped actions, not raw API calls_

If you've worked with the [Dataverse retrieval patterns]({% post_url 2026-04-10-dataverse-retrieval-patterns-copilot-studio %}), the connector "List Rows" approach is very similar, just applied to SharePoint. And if you need structured data retrieval without user authentication, the [Dataverse searchQuery approach]({% post_url 2026-03-20-dataverse-search-in-copilot-studio-unauthenticated-structured-data %}) is worth a look.

> MCP servers are collections of tools with a general-purpose AI wrapper optimized by their maker. When you configure a connector as a tool in Copilot Studio, you're building your own wrapper optimized for *your* use case. That's a feature, not a limitation.
{: .prompt-info }

## Key Takeaways

- **SharePoint Knowledge sources are for documents, not structured list data.** SharePoint list filter queries through Knowledge may disappoint, but a semantic unstructured search could return IDs that can then be used by Get Items to retrieve the rest of the data.  
- **The SharePoint connector's Get Items action + dynamic `$filter` input = natural language queries over lists.** No code, no flows, no custom APIs.
- **The input description is your secret weapon.** The more specific you are about column names, data types, valid values, and example queries, the better the orchestrator performs.
- **You can use M365 Copilot to generate the description.** Screenshot your list, ask for OData examples, and paste the result.
- **Scoped tools reduce LLM decision space.** Fix what you can, generate only what you must.
- **This pattern works for any connector, not just SharePoint.** Any action with filterable inputs can become a natural language query tool.

Have you tried using connector tools with dynamic inputs for structured data retrieval? I'd love to hear what connectors you've wrapped this way. Drop a comment below!
