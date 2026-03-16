---
layout: post
title: "Open the Hood: What Your Copilot Studio Agent Is Really Doing"
description: "How to extract, read, and understand Copilot Studio conversation transcripts so you know what your agent is doing and why."
date: 2026-03-16
author: roels
categories: [copilot-studio, tutorial]
tags: [copilot-studio, transcripts, dataverse, analytics, best-practices]
image:
  path: /assets/posts/conversation-transcripts/header.png
  alt: "Copilot Studio conversation transcripts"
---

**Somewhere between the user's question and the agent's answer, a lot happens. Most people never look.**

## TL;DR

Copilot Studio conversation transcripts give you the full picture of every conversation your agent has. Not just "User says / Bot says," but the diagnostic data underneath: which topic fired, what knowledge sources were consulted, which tools were called, which agents or MCP servers were invoked, what the orchestration plan was, and how long each step took.

This post covers:

- **Why** you should look at conversation transcripts (with two real scenarios)
- **What** you can actually see: topics, knowledge sources, tool calls, agent calls, MCP server calls, orchestration plans, timing
- **Six ways** to get transcripts: the test pane, Copilot Studio UI, Power Apps table view, the Dataverse Web API, Application Insights, and the Copilot Studio Kit
- **Which roles** you need to access them
- **How** to make sense of all this data (hint: let AI do it)

---

## When do you actually need this?

Two scenarios come up again and again.

### Scenario 1: You're building and evaluating, and something won't stick

You have clear business requirements. You've created an evaluation dataset. You run evals and the agent just won't pick up the right knowledge source, or it keeps routing to the wrong topic, or the generative answer misses the point. You've tried adjusting trigger phrases, tweaking knowledge source settings, rewriting instructions. Nothing works.

It's time to open the hood. The transcript shows you exactly what the agent considered, which knowledge sources it searched, what came back, and why it chose the answer it did. You stop guessing and start debugging with data.

### Scenario 2: Your agent is live and a user reports a problem

Your agent has been running fine. Then a user reaches out: "The agent gave me the wrong answer" or "It threw some weird error." You need to see exactly what happened in that specific conversation.

Ask the user to type `/debug conversationid` in the chat. They'll get back a unique conversation ID (a GUID like `0c4ebb21-3f74-4df4-b191-812aea31273d`) that you can use to look up the full transcript for that exact session. For a detailed walkthrough on how users can retrieve their conversation ID, see [How to Get Your Conversation ID When Chatting with Agents]({% post_url 2026-01-24-conversationid-users %}).

With that ID in hand, you can pull the transcript and see exactly what went wrong: the wrong topic, a failed tool call, a knowledge source returning nothing, or an orchestration plan that didn't make sense.

In both cases, the answer is the same: look at the transcript. Not the summary. The full diagnostic data.

---

## What can you actually see in a transcript?

When you dig into the raw conversation transcript (the `Content` column in the `ConversationTranscript` [Dataverse table](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/conversationtranscript?view=dataverse-latest)), you get a JSON array of activity objects (based on the [Bot Framework protocol](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-activities?view=azure-bot-service-4.0)). Each activity has a `valueType` that tells you what happened.

Here's what's available:

| What you want to know | Where to find it |
|---|---|
| Which topic fired and how confident the agent was | `IntentRecognition` activities with `TopicName` and `Score` |
| How the agent routed between topics | `DialogRedirect` activities with target dialog IDs |
| Whether a **tool** or **action** was called (and what it returned) | Event activities for tool invocations, including connector calls and HTTP requests |
| Whether a **child agent** or **connected agent** was invoked | Event activities showing agent to agent handoffs and responses |
| Whether an **MCP server** was called | Event activities for MCP tool invocations, including request/response payloads |
| What the **orchestration plan** was | Generative orchestration trace data showing the agent's reasoning and planned steps |
| Which **knowledge sources** were searched and what was returned | `SearchAndSummarizeContent` in `nodeTraceData` activities |
| How long each step took | Timestamps on each activity in the conversation flow |
| Whether the conversation was resolved, escalated, or abandoned | `SessionInfo` activities with outcome and turn count |
| What the user rated the experience | `CSATSurveyResponse` activities |


### A practical example: Diagnosing a slow agent

Imagine your agent takes 15 seconds to respond to "How do I submit an expense report?" You suspect something is off but aren't sure where. Here's what the transcript reveals:

1. **User message**: "How do I submit an expense report?"
2. **IntentRecognition**: Topic `ExpenseSubmission` triggered with confidence 0.92. Good, correct topic.
3. **Orchestration plan** (from nodeTraceData): The agent planned to search knowledge sources, then call the `expense_lookup` tool, then summarize.
4. **Knowledge source search**: The agent searched 3 SharePoint sites and 2 uploaded PDFs. You can see each source that was evaluated and how long the search took. One source took 11 seconds. That's your bottleneck. Time to investigate that specific knowledge source.
5. **Tool call**: The `expense_lookup` connector was called successfully, returned in 0.8 seconds.
6. **SessionInfo**: Conversation resolved after 2 turns, total duration 16.4 seconds.

Without the transcript, you'd be guessing. With it, you can see the exact step that's slow, which knowledge source is causing it, and whether the agent's plan made sense in the first place.

You get the full turn by turn conversation, but also the "behind the scenes" view: what the agent considered, what it called, what came back, and how it stitched the answer together.

---

## Six ways to get conversation transcripts

### Option 1: The test pane in Copilot Studio

The quickest way to see what's happening. When you test your agent in the authoring canvas, the test pane shows you the conversation flow in real time, including which topics fired and how the agent routed. Great for development and quick debugging, but it only shows the current test conversation.

> Click the **...** (three dots) in the test pane next to "Test your agent" and select **Save snapshot**. It downloads a zip file called `botcontent` containing both the conversation transcript and the full build configuration of that specific agent. Very useful for offline analysis or sharing with colleagues.
{: .prompt-tip }

### Option 2: Download from the Copilot Studio Analytics UI

No code required.

1. Open your agent in Copilot Studio
2. Go to **Analytics**
3. Select your date range
4. Above the **Overview** card, select **Download Sessions**
5. On the Download Sessions pane, select a row to download the session transcripts for the specified time frame

**What you get:** A CSV with session outcomes, turn counts, chat transcripts in "User says / Bot says" format, and basic metadata like `SessionOutcome` (Resolved, Escalated, Abandoned), turn counts, and the initial user message.

**What you don't get:** The rich JSON with knowledge source details, intent scores, tool calls, and node traces. For that, you need Dataverse or Application Insights.

> The `ChatTranscript` field in the CSV has a **512 character limit per bot response**. Longer responses get truncated. This is per response, not per session. If you're seeing cut off answers in the CSV, that's why. Use the Power Apps table view or Dataverse API for the full content.
{: .prompt-warning }

**Limitations:** Only the last 29 days of data. See [Download conversation transcripts in Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-transcripts-studio) for details.

### Option 3: Browse the table directly in Power Apps

You can view the raw transcript data right in the Power Apps maker portal. No code, no downloads.

1. Sign in to [make.powerapps.com](https://make.powerapps.com)
2. In the side pane, select **Tables**, then **All**
3. Search for "ConversationTranscript"
4. Select the **ConversationTranscript** table
5. Browse the records directly, or select **Export > Export data** to download as CSV

This gives you access to the full `Content` column with all the raw JSON, the `Metadata` column, conversation start times, and bot identifiers. You can filter and sort right in the UI.

You can also set up **views** to filter by specific agents or date ranges, making it easy to monitor specific agents over time.

> From here you can also export to Excel, connect Power BI directly to this table, or set up a Power Platform dataflow for ongoing processing.
{: .prompt-tip }

### Option 4: Query the Dataverse Web API

This is the programmatic path. Use it when you want to pull transcripts into a script, feed them into a pipeline, or build your own analysis tooling. No client secret needed: you sign in through the browser and the token uses your identity. You need the **Bot Transcript Viewer** role on your Dataverse account and your app registration must have **"Allow public client flows"** set to Yes in Azure AD.

```python
import msal, requests, json

# --- Configuration ---
client_id = "your-app-registration-client-id"  # Must allow public client flows
tenant_id = "your-azure-ad-tenant-id"
org = "your-dataverse-org-name"          # e.g. "contoso" (from contoso.crm.dynamics.com)
bot_guid = "your-copilot-studio-bot-id"  # Find in Copilot Studio > Settings > Session details > Copilot Id

# Interactive browser login (delegated permissions, no secret)
app = msal.PublicClientApplication(
    client_id,
    authority=f"https://login.microsoftonline.com/{tenant_id}"
)
token = app.acquire_token_interactive(
    scopes=[f"https://{org}.crm.dynamics.com/user_impersonation"]
)

# Query recent transcripts for a specific agent
response = requests.get(
    f"https://{org}.crm.dynamics.com/api/data/v9.2/conversationtranscripts",
    headers={
        "Authorization": f"Bearer {token['access_token']}",
        "OData-Version": "4.0",
        "Accept": "application/json"
    },
    params={
        "$filter": (
            f"_bot_conversationtranscriptid_value eq '{bot_guid}'"
            " and conversationstarttime ge 2026-02-01T00:00:00Z"
        ),
        "$select": "name,content,metadata,conversationstarttime",
        "$orderby": "conversationstarttime desc",
        "$top": "100"
    }
)

transcripts = response.json().get("value", [])
```

> The `_bot_conversationtranscriptid_value` lookup property is the correct way to filter transcripts by agent. You can verify this in the [ConversationTranscript entity reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/conversationtranscript?view=dataverse-latest). The `bot_guid` is the Copilot ID from **Settings > Session details** in Copilot Studio.
{: .prompt-info }

**Things to know:**

- Transcripts are written **30 minutes after conversation inactivity**, not in real time. See [how transcripts are retained](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-transcript-controls) for details.
- Default retention is **30 days**. A bulk delete job in Power Apps removes older records automatically. You can [change this schedule](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-transcripts-powerapps) by cancelling the existing bulk delete job and creating a new one with a different retention period. For long term storage, use [Azure Synapse Link for Dataverse](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/custom-analytics-strategy) to export to Azure Data Lake Storage Gen2.
- Each record has a **1 MB limit** on the `Content` column. Longer conversations get split across multiple records sharing the same `Name` and `ConversationStartTime`, differentiated by `Metadata.BatchId`. Merge them by sorting on `BatchId`.

### Option 5: Application Insights

If your Copilot Studio agent is connected to **Azure Application Insights**, you get telemetry data that complements (and in some cases goes beyond) what Dataverse transcripts provide.

Application Insights captures:

- Request and response timings for each conversation turn
- Dependency calls (knowledge source lookups, tool calls, connector invocations)
- Error and exception details
- Custom events and traces from your agent's execution

The key advantage: **Application Insights data is available in near real time**, unlike Dataverse transcripts which have a 30 minute delay. If you need to monitor agent performance live or set up alerts when error rates spike, this is the way.

You can query Application Insights data using **KQL (Kusto Query Language)** in the Azure portal, connect it to Power BI, or export to Log Analytics for long term retention.

To connect your agent, go to **Settings > Advanced > Application Insights** in Copilot Studio and configure the connection string. See [Connect your agent to Application Insights](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-bot-framework-composer-capture-telemetry) for the full walkthrough.

### Option 6: The Copilot Studio Kit

If you don't want to build your own tooling, someone already did. The [Copilot Studio Kit](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit) is a free, open source Power Platform solution from Microsoft's Power CAT team. Install it in your environment and you get transcript analysis (and a lot more) out of the box.

What it gives you for transcripts specifically:

- **[Conversation KPIs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-conversation-kpi)** automatically parse transcripts and generate aggregated outcome data in Dataverse: sessions, turns, outcomes (resolved, escalated, abandoned), with optional full transcript storage and a built in transcript visualizer. KPIs are generated twice daily automatically, or on demand.
- **[Conversation Analyzer](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-conversation-analyzer)** lets you run custom AI prompts against transcripts to surface insights like sentiment analysis, personal data detection, or any pattern you define. Comes with two built in prompts and supports custom ones you create and reuse.
- **[Agent Insights Hub](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit)** is a full analytics dashboard that aggregates telemetry from both Application Insights and Conversation Transcripts into a single view with KPI cards, trend charts, CSAT scores, and filtering by agent, channel, and date range. Supports up to 365 days of historical data.

But the Kit goes well beyond transcripts. It includes test automation with AI graded rubrics, agent inventory for tenant wide visibility, compliance hub for governance policies, webchat playground for customizing chat appearance, and more. If you're running agents in production, it's worth the install. See the [Copilot Studio Kit overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-overview) for the full feature list.

---

## Which roles do you need?

This trips people up. Here's the breakdown:

| What you want to do | Role required |
|---|---|
| View transcripts in the Copilot Studio test pane | Agent maker or editor access |
| View and download transcripts from Copilot Studio Analytics | **Bot Transcript Viewer** security role (Dataverse). Only admins can grant this during agent sharing. |
| View and download transcripts from Power Apps | **Bot Transcript Viewer** security role (Dataverse) |
| Query transcripts via the Dataverse Web API | **Bot Transcript Viewer** security role on your Dataverse user |
| Configure transcript settings for an environment | **Environment administrator** or **System administrator** role |

> The **Bot Transcript Viewer** is a Dataverse environment security role, not an Azure AD app registration setting. Makers with the Environment Maker role do **not** automatically get transcript access. An admin must explicitly assign Bot Transcript Viewer during agent sharing. See [Transcript access controls](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-transcript-controls) for the full picture.
{: .prompt-warning }

---

## Beyond transcripts: Let AI help

Reading raw JSON transcripts at scale isn't fun. And you shouldn't have to.

You can use **Copilot itself** to analyze your transcripts. Drop a transcript (or a batch of them) into a Copilot with researcher or analyst capabilities, and ask it to:

- Identify conversations where the wrong topic fired
- Find patterns in escalated or abandoned sessions
- Spot tool calls that are failing or timing out
- Flag knowledge source searches that return no results
- Summarize the most common user intents that aren't covered by your agent

This turns transcript analysis from a manual chore into a conversation. Instead of writing queries and building dashboards, you ask questions and get answers. And if you want to go deeper and build a full automated evaluation pipeline, the data is all there to support it.

> **Analyze your agent's structure, not just its conversations.** If you want to understand _how_ your agent is built (its topics, trigger phrases, knowledge sources, actions, and configuration) alongside what it's doing in production, check out the [MCS Agent Analyser](https://github.com/Roelzz/mcs-agent-analyser). It's an open source Python tool that parses Copilot Studio agent exports (`botContent.yml`, `dialog.json`) and conversation transcripts, giving you a visual breakdown of your agent's architecture. You can run it locally, deploy it as a container, or use it as a tool in your own agent. It's handy for spotting configuration issues, overlapping triggers, or unused topics before they show up as problems in your transcripts.
{: .prompt-tip }

---

## What to do next

1. **Pick your access method**: test pane for quick checks, Analytics UI for session summaries, Power Apps table view for browsing raw data, Dataverse Web API for automation, Application Insights for real time monitoring, or the [Copilot Studio Kit](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit) if you want it all built in.
2. **Look at a few transcripts**. Seriously. Open the `ConversationTranscript` table in Power Apps and read the raw JSON of a few conversations. You'll be surprised what's in there.
3. **Connect Application Insights** if you haven't already. The near real time data and alerting capabilities are worth the setup.
4. **Let AI do the heavy lifting.** Use the Copilot Studio Kit's [Conversation Analyzer](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-conversation-analyzer) and [Agent Insights Hub](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit), or feed transcripts to a Copilot to identify patterns and issues at scale.

The gap between "I think my agent is working" and "I know my agent is working" is exactly one transcript analysis away.

Happy investigating, and may your topic routing always fire correctly on the first try.
