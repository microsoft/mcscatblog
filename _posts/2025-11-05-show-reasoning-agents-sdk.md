---  
layout: post  
title: "Showing Agent Reasoning in Custom UIs (Anthropic + Agents SDK)"  
date: 2025-11-04 22:00:00 +0100  
categories: [copilot-studio, tutorial, agents-sdk]
tags: [anthropic, reasoning, agents-sdk]  
description: Surface Anthropic reasoning process as informative activities via the Microsoft 365 Agents SDK and render summarized reasoning steps in your app.  
author: giorgioughini  
---  
  
Copilot Studio agents using Anthropic models can expose their reasoning steps—the "why" behind decisions—in custom UIs. Using the Microsoft 365 Agents SDK, reasoning arrives as incremental typing activities that can be rendered live, summarized, and archived for traceability.
  
## Why Show Reasoning

- Builds user trust in automated decisions.
- Improves operator oversight in semi-autonomous workflows.
- Helps end users gauge the appropriateness of responses.

> Reasoning visibility is especially valuable in multi-step, decision-heavy scenarios.  
{: .prompt-info }

## Our example
In some steps of this tutorial, we will refer to a fully working example that can be found here: [Thinking-Activities-Sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/ShowReasoningSample).  
This example shows a Copilot Studio agent triggered via the Microsoft 365 Agents SDK directly from a custom UI. To keep things simple, we used a static HTML+JS website.  
The demo scenario features an organization that uses monday.com to log its tickets. They implemented an intake form for receiving tickets and an agent that triages them using the monday.com certified MCP server. If a similar ticket is found, the new intake request is merged as an update to the existing ticket; otherwise, a new ticket is opened.

Here's a video of our sample scenario, including the thinking process. In this video:
- At the beginning, we have just submitted a ticket for a VPN issue in Italy.
- We open our ticket intake UI and submit a new ticket for a VPN issue in Spain.
- The triage agent is triggered, and thinking activities are shown in the UI.
- Since this ticket is similar to the previous one, instead of opening a duplicate, the two are merged.

{%
  include embed/video.html
  src='assets/video/Demo-SDK-Thinking-Small.mp4'
  poster='assets/img/Demo-SDK-Thinkingcover.jpg'
  title='Video of our sample triaging agent emitting thinking activities'
  autoplay=false
  loop=true
  muted=true
%}

## Prerequisites

- Copilot Studio agent configured to use an Anthropic model (Settings → Agent model).
- Custom UI where you want reasoning to appear, integrated with the Microsoft 365 Agents SDK.
- Optional backend endpoint for summarization (recommended for UX; reasoning can be long and you might want to summarize it).

> GPT-family models in Copilot Studio do not emit "thinking" traces yet. Use Anthropic models to access reasoning.  
{: .prompt-warning }

## What to Listen For in the Activity Stream

Anthropic reasoning appears as incremental typing events in the activity stream. Among others, a distinction should be made between these two types of activities:

- Reasoning activity  
  - `type: typing`
  - `channelData.streamType: informative`
  - `channelData.streamId`, a stable identifier for a single reasoning stream
  - `text`, a partial reasoning text (that grows over time)

- Agent-sent answers  
  - `type: message`
  - `text`, the agent's user-facing response

To show the agent's reasoning somewhere in your custom UI, detect these informative activities and render updates as they arrive.  
Minimal detection:

```javascript
const isReasoningTyping = (activity) =>
  (activity?.type || '').toLowerCase() === 'typing' &&
  activity?.channelData?.streamType === 'informative';
```

Typical timeline:
1) One or more typing + informative events (incremental reasoning)
2) A message event sent by the agent (the usual final answer emitted after reasoning)

> Treat typing/informative as incremental reasoning; treat message as the finalized agent response.  
{: .prompt-tip }

## Implementation Walkthrough

The snippets below show the core pattern. Not all function implementations are shown here. A complete, runnable sample demoing a ticket triage system is available at [Thinking-Activities-Sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/ShowReasoningSample).

### 1) Initialize the client

First, create a Copilot Studio client using the SDK. This handles authentication and session setup.
  
```javascript  
import { CopilotStudioClient } from '@microsoft/agents-copilotstudio-client';  
import { acquireToken } from './acquireToken.js';  
import { settings } from './settings.js';  
  
export const createCopilotClient = async () => {  
  const token = await acquireToken(settings);  
  return new CopilotStudioClient(settings, token);  
};  
```  
  
### 2) Start a conversation

Before sending prompts, you need a conversation context. You can do this as soon as the page loads (like in the triaging sample) or when you want to send data to the agent.
  
```javascript  
const copilotClient = await createCopilotClient();  
let conversationId;  
  
for await (const act of copilotClient.startConversationAsync(true)) {  
  conversationId = act.conversation?.id ?? conversationId;  
  if (conversationId) break;  
}  
```  
> `startConversationAsync(true)` streams initial activities until you get a conversation ID. This ID ties all subsequent messages to the same session.
{: .prompt-info }

### 3) Send a prompt

Now, send the user's input to the agent. Our triage agent expects something like this:

```javascript  
const prompt = `Create the following ticket:  
  
Title: ${shortTitle}  
Description: ${longDescription}`;  
  
const activityStream = copilotClient.askQuestionAsync(prompt, conversationId);  
```  

> Reasoning steps arrive incrementally; you need to implement your awaiting logic or reuse the one implemented in the sample repo.
{: .prompt-tip }

  
### 4) Capture reasoning and the final answer

The following pattern groups incremental chunks by `streamId`. Once a new "thought" starts, the previous one is marked as completed and flushed in the UI.

> Since emitted reasoning thoughts are long sequences of text, you can define your own shortener in the function `flushActivity`. See the next step for an example. 
{: .prompt-tip } 
  
```javascript  
for await (const activity of activityStream) {
    if (!activity) continue;

    const activityType = activity.type?.toLowerCase();

    if (activityType === "typing" && activity.channelData?.streamType === "informative") {
        // This is the thinking activity you want to catch!
        const streamKey = resolveStreamKey(activity);
        const previousActivity = streamLastActivity.get(streamKey);

        if (previousActivity && isContinuationOfPrevious(previousActivity, activity)) {
            streamLastActivity.set(streamKey, activity);
            continue;
        }

        // The agent thought is complete: process and show it
        await flushActivity(previousActivity, false);
        streamLastActivity.set(streamKey, activity);
        continue;
    }

    if (activityType === "message") {
        agentMessages.push(activity.text);  // Normal agent response
        continue;
    }
}
```  
  
## Summarize Long Reasoning into One‑liners

Raw thinking can be very verbose. Sometimes the user wants to see the full thinking and it makes sense to show the raw thoughts; however, in other cases a summary made of short, readable updates (fewer than 10 words) keeps the UI clean.

> If you want to rely on a cloud LLM for shortening the reasoning text, do not call model APIs directly from the browser. Proxy through a backend, store keys in environment variables, and apply rate limiting.  
{: .prompt-danger }

Recommended architecture:
- Frontend: capture reasoning chunks, group them, and as soon as they are complete, POST them to a backend summarization endpoint.
- Backend: call your favorite LLM to compress into a single sentence and return sanitized text.

To avoid unnecessary complexity in a sample while keeping the code secure, the repository includes an input field in the HTML that the end user should populate. Never embed API keys in the browser; instead, enforce rate limits and logging on the server, or avoid the shrinking process entirely.
  
### Example frontend call (executed inside flushActivity)  
  
```javascript  
async function summarizeSafely(text) {  
  try {  
    const res = await fetch('/api/summarize', {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ text })  
    });   
    const { summary } = await res.json();  
    return summary.trim();  
  } catch {  
    return null; // Fallback to raw text if summarizer is unavailable  
  }  
}  
```
  
## UI Pattern: Calm, Informative Thinking

In our ticket triaging example, the end user is free to leave the page as soon as the intake request has been submitted. If the user chooses to wait until the agent triages it (to save the ticket ID, or for any other reason), this is the process we implemented:
- As soon as the submit button is pressed, show a rotating label (e.g., "Reviewing possible options...")
- Keep the spinning icon active while reasoning is active.
- Prepend the newest summarized update to the top; keep only the latest 5.
- Use a subtle entrance animation and collapse the panel on the final answer, with an optional "Show details" toggle.

Refer to the [demo video](#our-example) for a demonstration.

## Summary Checklist

1) Switch the agent to an Anthropic model  
2) Use the Microsoft 365 Agents SDK and iterate the activity stream  
3) Detect reasoning with:  
   - `activity.type === "typing"`  
   - `activity.channelData.streamType === "informative"`  
4) Group by channelData.streamId and coalesce incremental chunks  
5) Flush pending reasoning on the final message  
6) (optional) Summarize server-side to avoid exposing API keys in the browser  
7) Render a compact "Thinking" UI panel with recent updates

## Key Takeaways

- Anthropic models surface reasoning as informative typing events.
- The Agents SDK exposes all the events, including thinking; custom UIs can render them live.
- Server-side summarization produces concise, readable updates for end users.

## Try It Yourself

- Clone the reference implementation at [Thinking-Activities-Sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/ShowReasoningSample)
- Configure an Anthropic model for the agent in Copilot Studio  
- Run locally, observe typing/informative streams, and integrate the summarizer

> Questions or feedback about the pattern or implementation details are welcome.