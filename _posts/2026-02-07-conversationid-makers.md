---
layout: post
title: "Finding Conversation IDs for Debugging and Analytics in Copilot Studio"
date: 2026-01-25
categories: [copilot-studio, debugging]
tags: [conversationid, makers, debugging, analytics, troubleshooting]
description: Learn how to find and use Conversation IDs across Copilot Studio's development and analytics tools for debugging and evaluating your agents.
author: chrisgarty
image:
  path: /assets/posts/conversationID-makers/conversation-id-cat-maker.jpg
  alt: "Illustration showing a developer debugging with conversation IDs in Copilot Studio"
  no_bg: true
---

## TLDR: Finding Conversation IDs as a Maker
- **Test panel**: Use **`/debug conversationid`** while testing
- **Analytics**: Find IDs in the **Conversations** dashboard
- **Evaluations**: View IDs in **Evaluation results**
- **Search**: Look up any Conversation ID in **Analytics** → **Conversations**

## Why Conversation IDs matter for makers

As a Copilot Studio maker, you're constantly testing, debugging, and refining your agents. When something doesn't work as expected—or when you want to analyze how your agent handled a specific scenario—the Conversation ID is your key to unlocking the full story.

Use Conversation IDs to trace what happened during agent execution, examine variable values and API responses, share test scenarios with colleagues, deep-dive into user interactions from analytics, and track improvements across evaluation iterations.

---

## How to find Conversation IDs

### Test panel during authoring

The most common scenario—testing while you build:

1. Open your agent in Copilot Studio
2. Click **Test your copilot** to open the test panel
3. Have a conversation with your agent
4. Type: **`/debug conversationid`**
5. The Conversation ID appears in the chat

> **Pro tip**: Keep a log of test Conversation IDs with scenario descriptions. This makes it easy to reference specific test cases later.
{: .prompt-tip }

### Analytics dashboard

To find Conversation IDs from your agent's analytics:

1. Navigate to **Analytics** → **Conversations**
2. Use filters to narrow down conversations (date range, topic, CSAT, etc.)
3. Click any conversation row to open the transcript
4. The Conversation ID appears at the top—click the **Copy** icon

Use this to investigate low CSAT conversations, review specific topic triggers, analyze user drop-off patterns, or find examples for case studies.

### Evaluations and testing

When running evaluation test sets:

1. Go to **Evaluate** → **Evaluation results**
2. Click a specific evaluation run
3. Each test case row shows the Conversation ID
4. Click to view the full transcript

Use this to reproduce test failures, share problematic runs with your team, or track improvements across iterations.

### Looking up a Conversation ID

If someone shares a Conversation ID with you:

1. Go to **Analytics** → **Conversations**
2. Paste the Conversation ID in the **Search** field
3. Open the conversation to review the full transcript with maker tools

> **Note**: You can only view conversations for agents you own or have edit access to.
{: .prompt-info }

---

## Advanced: Accessing transcripts at runtime

For scenarios requiring programmatic access to conversation transcripts during live sessions (agent handoffs, CRM logging, sentiment analysis):

1. **Obtain Direct Line Secret** - Go to bot **Settings** → **Security** → **Web channel security** to get your Direct Line API secret
2. **Create HTTP Request** - In a topic, add a GET request to: `https://directline.botframework.com/v3/directline/conversations/{System.Conversation.Id}/activities`
3. **Add Authorization** - Include header: `Authorization: Bearer [your_secret_key]`
4. **Parse JSON Response** - The API returns an activities array with all messages; use Power Fx to filter meaningful content
5. **Use the Transcript** - Send to email, CRM, or generate AI-powered summaries

> **Limitations**: Only works with Direct Line-enabled channels (web, custom embeds). Not compatible with Microsoft Teams. Long conversations may require pagination.
{: .prompt-warning }

For detailed implementation steps, see [Accessing Copilot Studio Conversation Transcript at Runtime](https://www.linkedin.com/pulse/accessing-copilot-studio-conversation-transcript-runtime-r%C3%A9mi-dyon-2q8ie/) by Rémi Dyon.

---

## Debugging workflow example

**Scenario**: Users report your agent sometimes fails when calling an external API.

1. **Check Analytics** - Filter conversations by the topic using the API, sort by errors or low CSAT, identify 2-3 Conversation IDs where failures occurred
2. **Deep Dive** - Open transcripts, look for connector timeouts, note timestamps and error messages
3. **Reproduce** - Use the same inputs in test panel, get the test Conversation ID, compare live vs. test behavior
4. **Fix and Validate** - Update error handling, test again with new Conversation IDs, use evaluation sets to verify the fix

---

## What to share when reporting issues

When escalating to support or collaborating with team members:

- **Conversation ID:**
- **Source:** (Test panel / Analytics / Evaluations / Live usage)
- **What you expected vs what happened:**

## Data retention and export

Conversation data is typically retained for 30 days in analytics, but this varies by environment policy. You can export conversation data to CSV from **Analytics** → **Conversations**, which includes Conversation IDs for batch analysis.

---

## What's Next?

This guide focused on helping makers find and use Conversation IDs for debugging and analytics in Copilot Studio.

**Related posts in this series:**
- **For users**: [How to Find Your Conversation ID](/posts/how-to-find-your-conversation-id-copilot-studio-users/) - Share this with users who need to report issues
- **For admins**: Coming soon - Using Conversation IDs for governance, compliance, and support

**Microsoft Documentation:**
- [Copilot Studio Analytics](https://learn.microsoft.com/microsoft-copilot-studio/analytics-overview)
- [Test your copilot](https://learn.microsoft.com/microsoft-copilot-studio/authoring-test-bot)
- [Evaluate your copilot](https://learn.microsoft.com/microsoft-copilot-studio/analytics-evaluations)
