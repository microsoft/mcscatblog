---
layout: post
title: "The Orchestrator’s Secrets: Chain-of-Thought & Transcript on Demand"
date: 2026-03-13 00:00:00 +0000
categories: [copilot-studio, tutorial]
tags:
  [
    topics,
    orchestration,
    chain-of-thought,
    conversation-history,
    mcp,
    observability,
    agent-design,
  ]
description: "Topics are where the secret switches are hidden in Copilot Studio. Two under-the-radar tricks: surfacing the orchestrator's chain of thought as it works, and pulling the full conversation transcript into a variable on demand."
author: raemone
image:
  path: /assets/posts/power-of-topics-copilot-studio/cover.png
  alt: "The Orchestrator’s Secret: Chain-of-Thought & Transcript on Demand"
  no_bg: true
---

If you've spent time in Copilot Studio, you've probably obsessed over tools, flows, prompts, instructions, child agents, connected agents… and treated topics like the boring vegetables on the plate.

Turns out, topics are where the secret switches are hidden — especially when you pair them with a capable orchestrator. In this post, I'll show you two under-the-radar tricks that feel like unlocking a dev console for your agent.

Today's menu:

1. **CoT logging** — surface the orchestrator's intermediate steps (chain-of-thought / rationale) as it works
2. **Transcript on tap** — pull the full conversation transcript at runtime and store it in a variable

---

## Cheat code #1: "Show your work" (CoT logging)

In Copilot Studio, the orchestrator may run a mini "plan → execute → adjust" loop — especially with reasoning models or when an MCP server requires multiple tool calls to land on a final answer.

That's powerful… but from the user's perspective it can feel like the agent disappears into a black box for a while. The fix: ask the orchestrator to surface intermediate steps as it goes, so you can capture them — and decide whether to display them (always, only in debug, or only on certain channels).

> Tested with: GPT-4.1, GPT-5 Chat, GPT-5 Auto, GPT-5 Reasoning, and Claude (Sonnet + Opus).
{: .prompt-info }

The pattern is simple: create a tiny "logger" topic, then instruct the orchestrator to call it after each step.

### How to set it up

1. Create a new topic (example name: **Log Chain of Thoughts**)
2. Add an input variable (example name: `CoT`). In the description, put something like: _"Full intermediate chain of thought / rationale from the model for the current step."_
3. Add a message node that outputs the variable. Tip: italicize it so it reads like a trace, not the agent's "official" answer.

![The Log Chain of Thoughts topic in Copilot Studio showing the CoT input variable and Message node](/assets/posts/power-of-topics-copilot-studio/cot-input.png){: .shadow }
_The Log Chain of Thoughts topic: input variable CoT with a description that tells the orchestrator exactly what to pass in, and a single Message node rendering it_

Now tell the orchestrator when to use it by adding an instruction at the agent level:

```
After every tool, topic, or step you take, log your intermediate reasoning
by calling /Log Chain of Thoughts.
```

Make sure you reference the topic using the `/` picker so it resolves to the exact topic name.

And you're done. The next time the orchestrator chains multiple actions, you'll see the play-by-play in the chat.

![Copilot Studio agent showing chain of thought messages in Teams chat](/assets/posts/power-of-topics-copilot-studio/cot-instructions.png){: .shadow }
_Each reasoning step surfaces in Teams chat as a "Thinking: …" message — before the agent proceeds to its next action_

This is great for understanding what's happening during MCP tool chains or long-running reasoning flows — and it works on every channel because it's just a regular message node.

> **Trade-off**: this costs more Copilot credits because you're forcing an extra call after each step. Consider enabling it only for long-running tasks, specific agents, certain channels, or behind a "debug mode" flag.
{: .prompt-warning }

---

## Cheat code #2: "Transcript on tap" (save conversation history to a variable)

People have wanted this forever: grab the conversation history inside the dialog and hand it to a tool — ticketing, Dataverse, escalation flows, you name it. There's no official "give me the transcript" node (yet?). You could rebuild history turn-by-turn with variables, but it gets messy fast and doesn't scale.

So instead, we ask the orchestrator to dump the transcript into an input variable on demand. Yes, really.

### How to set it up

1. Create a topic (example name: **Save Conversation History**)
2. Add an input variable (example name: `conversationHistory`)
3. In the input description, tell the orchestrator what you want — for example: _"Entire conversation history in the format 'User: …, Agent: …'"_ (You can ask for a summary instead, or omit speaker labels — this part is flexible.)

![Save Conversation History topic showing the conversationHistory input and the full conversation content](/assets/posts/power-of-topics-copilot-studio/cot-topic.png){: .shadow }
_The Save Conversation History topic: the orchestrator fills the conversationHistory input with the full transcript, which the topic then surfaces or passes on to other tools_

### How to trigger it

Two common patterns:

**Manual** — let the user invoke the topic from the chat (then you choose whether to display the transcript or just store it in a variable).

**Automatic** — at the end of a flow (end conversation / escalate / etc.), call it via a **Recognize intent** node with an input like `save conversation history`.

![End of Conversation topic canvas showing the Recognize intent node after the goodbye message](/assets/posts/power-of-topics-copilot-studio/conv-history-topic-end-manual.png){: .shadow }
_In the End of Conversation topic, a Recognize intent node after "Ok, goodbye." gives the orchestrator one last chance to invoke the Save Conversation History topic before closing_

Once you've captured the transcript, you can pass `conversationHistory` to a tool, save it to a custom Dataverse table, attach it to a support ticket, or hand it to a live agent during escalation.

Want to get fancy? Chain it with other tools — for example, an Outlook MCP server — to email the transcript, attach it to a ticket, or hand it off to an escalation workflow automatically.

![Copilot Studio activity trace showing MCP servers, tool calls, and topic invocations in sequence](/assets/posts/power-of-topics-copilot-studio/conv-history-end.png){: .shadow }
_The full activity trace: Dataverse MCP → read\_query tool → Log Chain of Thoughts topic → Goodbye topic → Save Conversation History topic → Email Management MCP → SendEmail tool_

![Outlook showing the received conversation history email sent by the Copilot Studio agent](/assets/posts/power-of-topics-copilot-studio/conv-history-topic-email.png){: .shadow }
_The conversation history lands in the user's inbox — sent autonomously by the agent chaining the transcript capture with the Outlook MCP tool_

---

That's the whole trick: tiny topics, big leverage. If you try the chain-of-thought trick, consider adding a debug toggle so you can turn the magic on — and the credit burn off — whenever you need it.
