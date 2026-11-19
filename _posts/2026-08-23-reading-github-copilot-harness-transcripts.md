---
agent_edition: github-copilot
layout: post
title: "Inside Microsoft Copilot harness Transcripts: Reasoning, Tools, and Turn Lifecycles"
date: 2026-08-23 09:00:00 +0530
categories: [orchestration]
tags: [copilot-studio, orchestration, agent-development, dataverse, debugging, troubleshooting, skills]
description: "Read Microsoft Copilot harness transcript events, correlate tool calls, and merge available records, starting with the built-in history and Kit tools."
author: patilravikiran
image:
  path: /assets/posts/reading-github-copilot-harness-transcripts/header.svg
  alt: "A CAT investigator traces reasoning, tool calls, results, and turn completion across split Microsoft Copilot harness transcript pages."
mermaid: true
---

A user tells you the agent gave them the wrong answer yesterday. You ask the same question today and get a perfectly good response.

Reproducing the question is useful, but it doesn't tell you what happened in that earlier exchange. Which tool did the agent pick? What came back? Did it stop because something failed, or because it needed the user's permission?

Agents powered by the [Microsoft Copilot harness](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/overview) use a different set of transcript events. Rather than following topic routing, you trace reasoning, tool selection, and execution results. This post explains how to find those events, reassemble the conversation, and interpret what happened.

## Start with the tools, not the JSON

For a conversation available in **Preview**, start with [**Preview > History**](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/preview-history). Select the conversation, or use **Find by ID**, and turn **End user preview** off to see the activity trace for each message. You can review past interactions there; the trace isn't limited to the conversation currently running.

The [Copilot Studio Kit overview]({% post_url 2026-03-06-copilot-studio-kit %}) introduces another useful starting point. Two tools are worth distinguishing:

- **[Agent Debugger](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit/blob/main/AGENT_DEBUGGER.md)** is the closer fit for investigating an individual recorded conversation. The Kit's [published harness parser](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit/blob/db22736e71bf6acb813e2e9dd2491e489a8c0f92/mcp-apps/copilot-agent-kit/src/agent-debugger/utils/transcript/parse-generative-transcript.ts) handles `ThinkingTrace`, tool-call starts, completions and failures, and connected-agent markers. That confirms event-level support in that implementation, not in every older installed Kit version. Dataverse mode needs access to the records, including child records. Offline snapshot mode can't fetch a connected agent's transcript from Dataverse.
- **[Conversation Analyzer](https://learn.microsoft.com/microsoft-copilot-studio/guidance/kit-conversation-analyzer)** applies sentiment, personal-data, or custom prompts to conversations. Use it for message-level questions. In the Code App implementation I checked, its input formatter keeps `message` activities, not reasoning or tool traces, and labels numeric role `0` as the agent and other roles as the user. That supports analysis of ordinary message text, but can misattribute connected-agent messages where both sides use role `1`. Check speaker labels and batch completeness in your installed version before trusting those results.

Raw JSON is the next step when you need to investigate a particular payload, correlate parent and child conversations, or write your own analysis. You don't need to start there.

> **Check availability before looking in Dataverse.** As of November 2026, the [transcript access guidance](https://learn.microsoft.com/microsoft-copilot-studio/admin-transcript-controls) says conversation transcripts aren't written to the Dataverse transcript table for Microsoft Copilot agents. The Dataverse examples below describe harness records inspected in August 2026, not a promise that a new conversation will create one today. Use Preview history for conversations available there. The Kit and the manual steps below can work with records you already have; neither can retrieve a record that wasn't stored.
{: .prompt-warning }

## What to look for in an available transcript

[Open the Hood]({% post_url 2026-03-19-open-the-hood-copilot-studio-transcripts %}) covers topic and routing events such as `IntentRecognition`, `DialogRedirect`, and `nodeTraceData`. Here the useful questions are what the agent was reasoning about, which capability it selected, what arguments it supplied, what came back, and whether the turn finished.

An agent on the Copilot harness can choose [knowledge](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/knowledge-copilot-studio) and [tools](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/tools-overview), activate [skills](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/skills-overview), and adapt to the results. Follow that sequence rather than expecting an authored topic path.

Look for `ToolCallTrace` and `ThinkingTrace` in both `name` and `valueType`. They identify the event family covered here. `DynamicPlan` events call for the topic-and-plan analysis described in the earlier post. A message-only or mixed transcript needs closer inspection; one missing marker doesn't establish which harness produced it.

> The event shapes below are observations from August 2026 transcripts, cross-checked against the Kit parser. Treat them as parsing examples, not a guaranteed public schema. Keep the raw JSON so you can investigate unfamiliar fields or events.
{: .prompt-warning }

## Finding the record

Ask the user to type `/debug conversationid` in the chat. That returns a GUID, and it is by far the fastest route to a specific conversation (see [How to Get Your Conversation ID]({% post_url 2026-01-24-conversationid-users %})). Declarative agents use plain `/debug` instead.

For an existing Dataverse record, open [Power Apps](https://make.powerapps.com/) in the right environment, then **Tables > All**, search for **ConversationTranscript**, and select **Export > Export data**. When the export is ready, select **Download exported data**. The [Power Apps transcript instructions](https://learn.microsoft.com/microsoft-copilot-studio/analytics-transcripts-powerapps#view-and-export-conversation-transcripts-from-the-power-apps-portal) walk through those steps. Treat the exported content as sensitive conversation data.

You need the **Bot Transcript Viewer** role to view transcripts in Power Apps; **Environment maker** alone doesn't grant access. Check the environment's [recording and download settings](https://learn.microsoft.com/microsoft-copilot-studio/admin-transcript-controls#configure-transcript-recording-and-download), retention, and the harness availability limitation above before treating a missing row as a timing issue.

The [`conversationtranscript`](https://learn.microsoft.com/power-apps/developer/data-platform/reference/entities/conversationtranscript) columns that matter are `Name`, which holds the conversation ID joined to the agent ID, `Content`, which holds the activity JSON, `Metadata`, which carries `BotId`, `BotName`, and `BatchId`, and `ConversationStartTime`. Use the conversation ID to locate matching `Name` values in the export.

For conversations eligible for Dataverse recording, the [documented save behavior](https://learn.microsoft.com/microsoft-copilot-studio/analytics-transcripts-powerapps#understand-conversation-transcripts) is a record after 30 minutes of inactivity. For agents published to the Telephony channel, the timeout is three minutes after an *End Conversation* event. Those timings don't override recording settings or make an unsupported conversation appear.

### One conversation, several rows

Before interpreting a record, check whether you have the whole conversation. Rows sharing the same `Name` arise for two independent reasons:

- After 30 minutes of inactivity, resumed activity is written to a new row with the same `Name` and a new `ConversationStartTime`.
- `Content` is capped at 1 MB. When one session exceeds that limit, the platform splits it across rows with the same `Name` and `ConversationStartTime` but different `BatchId` values.

In the harness transcripts I inspected, file operations and skill execution produced long streams of status events. One session could span several batches.

Merge before you analyze anything. Group by `Name`, order the sessions by `ConversationStartTime`, then order each session's batches by `BatchId`:

```text
Name = {ConversationId}_{BotId}
  ├── ConversationStartTime T1
  │   ├── BatchId 0   ← activities part 1
  │   ├── BatchId 1   ← activities part 2
  │   └── BatchId 2   ← activities part 3
  └── ConversationStartTime T2   ← resumed after inactivity
      └── BatchId 0
```

Read just one batch and you can mistake a missing piece for a failed operation.

> **Do not parse `Name` by splitting on `_`.** That works only when the conversation ID is a plain GUID. Teams and Direct Line conversation IDs contain underscores of their own, so values like `19:…@thread.v2_{BotId}` are normal and a naive split misidentifies the agent. Match on the whole value, or split from the right using the known `BotId`.
{: .prompt-warning }

### Connected agents write their own rows

In the connected-agent examples I checked, the delegated conversation had separate transcript rows, with `Name` values containing the parent conversation ID plus a child segment. The parent recorded the handoff and result, not the child's complete activity history.

You can spot that delegation in the parent transcript through `ConnectedAgentInitializeTraceData` and `ConnectedAgentCompletedTraceData`. Those markers confirm that a connected agent was invoked, but the child's reasoning and tool calls still live in the child transcript row.

That has a practical consequence during triage. Pull the parent row alone and the delegated work looks like a gap: the parent hands off, some time passes, and an answer comes back with nothing in between to explain it. The reasoning and tool calls that produced that answer are sitting in a row you have not fetched. When a conversation involves connected agents, search for rows whose `Name` starts with the parent conversation ID, then verify the child identifiers against the delegation events or the agent tool call's result. The Kit's [connected-agent service](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit/blob/main/mcp-apps/copilot-agent-kit/src/agent-debugger/services/connected-agent-service.ts) shows how those links are resolved.

Check speaker attribution in those child records too. The numeric role alone can be misleading, as the example below shows.

### Separate authoring tests from autonomous runs

For available records, the documented way to identify authoring test conversations is [`ConversationInfo.isDesignMode`](https://learn.microsoft.com/microsoft-copilot-studio/analytics-transcripts-powerapps#common-activity-value-types). A value of `true` identifies a test-pane conversation. Keep records where the flag is missing in an unknown group rather than silently treating them as production.

Keep that separate from the channel. The sample included `pva-studio` and `pva-autonomous`, as well as `msteams` and `directline`. An autonomous run can be production activity: **don't exclude it just because its channel is `pva-autonomous`**. For a production-usage report, separate confirmed authoring tests from other traffic, then decide whether autonomous runs belong in the metric you're measuring.

## Key fields to focus on

Start with the activity envelope. These fields let you find the diagnostic events, order them, and connect them to the messages around them.

| Field | What to know |
| --- | --- |
| `type` | `message` for user and agent turns, `trace` or `event` for everything diagnostic |
| `name` / `valueType` | The event marker. Some events populate only one of the two, so always check both |
| `value` | The payload, and where nearly all diagnostic detail lives |
| `timestamp` | Epoch seconds in the inspected Dataverse records; use `timestampMs` when present for finer timing, and handle ISO strings in other exports |
| `channelId` | Real values include `pva-studio`, `pva-autonomous`, `pva-published-engine-direct`, `directline`, `msteams`, and other channel-specific names |
| `replyToId` | Ties a trace event back to the message that triggered it |
| `from.role` | Commonly `0` for the agent and `1` for the user in these records; check the speaker pattern before relying on numeric roles |

The `name` and `valueType` split is easy to miss. In the inspected records, the `ToolCallTrace` family and `ThinkingTrace` populated `name`, while `SessionInfo` and `ConversationInfo` populated `valueType`. A scan that checks only one field misses events recorded in the other.

### Check who is speaking

The Kit's parser handles a connected-agent pattern where both sides use `role: 1`. In that pattern, the user message has a `from.aadObjectId`, while the agent message doesn't. Here's an illustrative, sanitized pair; the identifiers and message text are placeholders:

```json
[
  { "type": "message",
    "from": { "role": 1, "id": "speaker-a",
              "aadObjectId": "11111111-1111-1111-1111-111111111111" },
    "text": "Check the order status." },
  { "type": "message",
    "from": { "role": 1, "id": "speaker-b" },
    "text": "The order has shipped." }
]
```

In this example, the identity field helps distinguish the user from the agent even though the numeric roles match. It doesn't mean every message without `aadObjectId` is an agent message: anonymous users or channels that omit identity can leave it out too.

Treat this as a heuristic, not a role contract. The parser checks for `role: 0` messages to choose the usual numeric convention; otherwise it uses the identity field to distinguish `role: 1` messages. For your own analysis, first merge all batches, honor explicit string roles such as `user` and `bot` where present, and compare sender IDs with known conversation context. If identity is missing on both sides, present on both, or inconsistent, preserve the sender fields and label the speaker **unknown** rather than guessing. You don't need to resolve or publish the person's identity to group messages by speaker.

## Anatomy of a turn

The typical shape of a turn looks like this.

```mermaid
sequenceDiagram
    participant U as User
    participant H as Copilot harness
    participant K as Knowledge / Skill / Tool

    U->>H: message
    H->>H: ThinkingTrace
    H->>K: ToolCallTrace:Started
    K-->>H: ToolCallTrace status stream
    K-->>H: ToolCallTrace:Completed or Failed
    H->>H: More reasoning if needed
    H-->>U: message
    H->>H: turn.complete
```

Treat that as the common case rather than a contract. Reasoning can arrive in several chunks rather than once. In the inspected turns, calls could also fire back to back with nothing between them, immediately after a failure, or as the very first event of a turn. Some tool calls include an intermediate status stream. A skill can produce a great many sandbox events, and a completion can land in a later split row.

## The events that matter

### `ThinkingTrace`

`ThinkingTrace` carries the reasoning text that the [activity trace](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/authoring-activity-trace) surfaces, in a `thinkingText` field.

The text does not arrive in one piece. It streams as delta fragments, then a cumulative snapshot equal to those fragments combined, and a later segment can follow in the same turn. To read it correctly, buffer the deltas, recognize the snapshot rather than appending it a second time, and flush any incomplete buffer before the next tool call so the reasoning does not drift out of order.

Reasoning is narrative rather than a timed operation, so it reads best as inline text next to the steps it preceded. It is also not a complete record of every internal model operation. It is the trace the product exposes for debugging, and its granularity varies.

### The `ToolCallTrace` family

Four distinct events share this prefix, and the difference between them matters.

The generic `ToolCallTrace` carries incremental `status` strings such as `Running Bash...`, `Reading a file...`, `Loading skill...`, and `Calling KnowledgeSearch`. In file-heavy turns these can dominate the record. Use them to understand progress, and use the lifecycle markers to reconstruct the calls.

`ToolCallTrace:Started` is the most valuable event in the transcript. It records what the harness chose and what it prepared:

| Field | Meaning |
| --- | --- |
| `toolCallId` | Correlation ID shared by the start, completion, and failure |
| `toolName` | Internal tool identifier |
| `toolDisplayName` | Human readable name shown in the activity trace |
| `toolKind` | Capability category: `search`, `tool`, or `agent` |
| `filledParameters` | Inputs the agent supplied |
| `unfilledParameters` | Inputs still missing |
| `hiddenFilledParameters` | Runtime supplied values not shown as user inputs |

Skills need special handling. The Kit parser recognizes a loaded skill by `toolName: "skill"` and uses `toolDisplayName` for its name. Don't rely on `toolKind` being present, or group every skill under the generic name `skill`.

`ToolCallTrace:Completed` closes a call successfully, carrying the same `toolCallId`, a `durationMs`, and a `result` that may be text or JSON. The `result` is where the step's observation lives.

`ToolCallTrace:Failed` is the first place to look for connector authentication problems, invalid parameters, timeouts, and MCP or sandbox errors. Check both `status` and `errorMessage`. A `status` string can include the diagnosis directly, as in this illustrative example:

```text
list_records_with_organization failed: Connector returned 403:
{"error":{"code":"0x80072560","message":"The user is not a member of the organization."}}
```

Here, the HTTP status and connector message are visible without opening a separate error field. Other failures may put the useful detail in `errorMessage`.

### `turn.complete` and `turn.awaitConsent`

`turn.complete` marks the end of the harness work for a turn. Its payload is empty, so the marker itself is the whole signal. In the inspected examples it followed the agent's reply, but it wasn't emitted on every turn. Treat it as positive confirmation that a turn closed, never as a required boundary, and do not read its absence as a failure.

`turn.awaitConsent` appears when a tool needs the user to authorize it, for example a connector action that surfaces a consent card. Its payload carries `requestId`, `toolName`, and the `connectors` awaiting authorization. A turn sitting on this event is waiting on the user rather than the agent, which is worth knowing before you go hunting for a performance problem that does not exist.

### `SessionInfo`

`SessionInfo` is a useful first stop when you're triaging several sessions. Start with `startTimeUtc`, `endTimeUtc`, `turnCount`, `type`, `outcome`, and `outcomeReason`. The inspected records also included fields such as `impliedSuccess`, `csatScore`, and `lastUserIntentId`; don't assume every record has them.

Keep **session type** and **session outcome** in separate columns. The [transcript reference](https://learn.microsoft.com/microsoft-copilot-studio/analytics-transcripts-powerapps#common-activity-value-types) lists `unengaged` and `engaged` as types, and `Escalated`, `Resolved`, and `Abandon` as outcomes. The August sample also contained `Engaged` and `Unengaged` types, and outcomes including `Abandoned`, `HandOff`, and the literal string `None`.

Case-insensitive comparison handles `engaged` versus `Engaged`. It does **not** make `Abandon` equal to `Abandoned`. If you're grouping these values for a report, use explicit mappings:

| Field | Raw value, matched case-insensitively | Reporting label |
| --- | --- | --- |
| `type` | `engaged` | `engaged` |
| `type` | `unengaged` | `unengaged` |
| `outcome` | `Resolved` | `resolved` |
| `outcome` | `Escalated` | `escalated` |
| `outcome` | `Abandon` or `Abandoned` | `abandoned` |
| `outcome` | `HandOff` | `handoff`, kept separate from `escalated` |
| `outcome` | Literal string `None` | `none`, kept separate from a missing field |
| Either | Missing or unfamiliar value | `unknown`, with the original value retained |

These are reporting labels for the documented and observed spellings, not replacement values to write back into the transcript. Store the raw value alongside the label. In particular, don't silently turn `HandOff` into `Escalated`, or treat `None` as proof that the conversation succeeded.

The companion `outcomeReason` explains why a session ended and is usually more useful than the outcome by itself. Example values include `NoError`, `UserExit`, `Resolved`, `UserError`, `SystemError`, `AgentTransferConfiguredByAuthor`, `AgentTransferRequestedByUser`, and `AgentTransferFromQuestionMaxAttempts`.

## A trimmed turn

This illustrative turn leaves out the status stream and uses invented messages and identifiers:

```json
[
  { "type": "message", "from": { "role": 1 }, "text": "Any open orders for Contoso?" },
  { "type": "trace", "name": "ThinkingTrace",
    "value": { "thinkingText": "I need to look up open orders for this account." } },
  { "type": "trace", "name": "ToolCallTrace:Started",
    "value": { "toolCallId": "call_01", "toolName": "list_records",
               "toolKind": "tool", "filledParameters": { "table": "orders" } } },
  { "type": "trace", "name": "ToolCallTrace:Completed",
    "value": { "toolCallId": "call_01", "durationMs": 812, "result": "{\"count\":3}" } },
  { "type": "message", "from": { "role": 0 }, "text": "Contoso has 3 open orders." },
  { "type": "trace", "name": "turn.complete", "value": {} }
]
```

Read it as a loop rather than a script. Reasoning sets up a call, the call returns an observation, and the observation either produces an answer or feeds the next round of reasoning.

## What to trust

A few habits keep this from going wrong.

Merge split rows before counting anything, because a missing completion can be a completion that landed in the next row. Match `name` and `valueType` on every scan. Correlate tool calls by `toolCallId` rather than by adjacency. Read `SessionInfo` first when triaging in bulk, and use `outcomeReason` to help distinguish failures from ordinary handoffs.

Be careful about inferring order from the diagram. A call with no reasoning in front of it isn't evidence that the agent skipped a step. A completion can also be present without its start in the records you retrieved; the Kit parser handles that case rather than discarding it.

And treat the absence of a lifecycle marker as weak evidence. Completions trail their triggers, `turn.complete` is optional, and reasoning appears only where the product chose to expose it. A recorded completion is useful evidence of what the platform reported, not proof that the user's goal was met. Missing or redacted content needs context too.

## Wrapping up

Start with Preview history or Agent Debugger when the conversation is available there. When you need to go deeper into a Copilot harness transcript, get all the records first, check who is speaking, then follow the tool-call IDs through arguments and results. That is usually more useful than reading thousands of status lines from top to bottom.

Next time an agent surprises you, the messages will only tell you what it said. What will the reasoning behind them tell you?
