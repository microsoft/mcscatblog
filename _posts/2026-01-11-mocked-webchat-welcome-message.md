---
layout: post
title: "The Welcome Message That Never Was: Mocking Agent Greetings in WebChat"
date: 2026-01-11
categories: [copilot-studio, webchat]
tags: [webchat, directline, welcome-message, redux, javascript, embedding, conversation-start]
description: "Show a welcome message in WebChat without triggering your agent—because sometimes the best conversation is the one that never started."
author: adilei
image:
  path: /assets/posts/mocked-welcome/header.png
  alt: "A mocked welcome message in WebChat"
  no_bg: true
---

Here's a scenario that might sound familiar: You've built a beautiful Copilot Studio agent for your company's public website. It greets visitors with a friendly welcome message, ready to answer questions about your products, services, or that one FAQ nobody ever reads.

The problem? Every single visitor who loads your page triggers that welcome message. And every welcome message is a conversation. And every conversation... well, let's just say your finance team has started asking pointed questions about "message consumption."

## The Economics of Saying Hello

When you embed a Copilot Studio agent on a public website, the typical flow goes like this:

1. Visitor lands on page
2. WebChat connects to Direct Line
3. Agent sends welcome message (Conversation Start topic fires)
4. Visitor reads "Hi! How can I help you today?"
5. Visitor closes tab without ever typing anything
6. You get charged for that conversation

Now, I'm not here to make any grand promises about cost savings or Copilot credits—your mileage will vary depending on your traffic patterns, licensing model, and how aggressively your marketing team promotes that "Chat with us!" button. But if you're seeing thousands of welcome messages going out to visitors who never engage, you might start wondering: *Is there a way to show a greeting without actually bothering the agent?*

Turns out, there is.

## The Trick: Fake It Till They Type It

The idea is simple: instead of letting the agent send the welcome message, we inject a fake one directly into WebChat's UI. The visitor sees exactly what they'd normally see—a friendly greeting from the agent—but no actual activity reaches your agent. No topic fires. No conversation starts. No message is consumed.

The real conversation only begins when the user actually types something.

> This approach uses WebChat's Redux store middleware to intercept connection events and inject a synthetic message. It's entirely client-side—no traffic to your agent.
{: .prompt-info}

## How It Works

WebChat uses Redux under the hood to manage its state. When the Direct Line connection is established, it dispatches a `DIRECT_LINE/CONNECT_FULFILLED` action. We can hook into this moment and dispatch our own fake "incoming" activity:

```javascript
const store = window.WebChat.createStore({}, ({ dispatch }) => next => action => {
  if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
    // Inject a mocked welcome message
    dispatch({
      type: 'DIRECT_LINE/INCOMING_ACTIVITY',
      payload: {
        activity: {
          type: 'message',
          id: 'welcome-' + Date.now(),
          timestamp: new Date().toISOString(),
          from: { id: 'bot', role: 'bot' },
          text: 'Welcome! How can I help you today?'
        }
      }
    });
  }
  return next(action);
});
```

The key here is `DIRECT_LINE/INCOMING_ACTIVITY`. This is the Redux action type for messages *coming from* the agent. By dispatching it ourselves, we're telling WebChat "hey, the agent just said this"—except the agent never actually said anything. It's like a tree falling in a forest with no one around, except the tree is an AI agent and the forest is your message consumption report.

## Complete Working Example

Here's a full HTML page that demonstrates the technique. You'll need to replace the token endpoint with your own:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebChat with Mocked Welcome</title>
  <script crossorigin="anonymous"
    src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js">
  </script>
  <style>
    html, body { height: 100%; margin: 0; padding: 0; }
    #webchat { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="webchat" role="main"></div>

  <script>
    // Replace with your Copilot Studio token endpoint
    const TOKEN_ENDPOINT = 'https://YOUR_ENVIRONMENT.api.powerplatform.com/powervirtualagents/botsbyschema/YOUR_BOT/directline/token?api-version=2022-03-01-preview';

    async function main() {
      // Fetch DirectLine token
      const response = await fetch(TOKEN_ENDPOINT);
      const { token } = await response.json();

      // Create store with middleware to inject welcome message
      const store = window.WebChat.createStore({}, ({ dispatch }) => next => action => {
        if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
          console.log('Connection fulfilled, injecting welcome message...');

          // Inject a mocked welcome message
          dispatch({
            type: 'DIRECT_LINE/INCOMING_ACTIVITY',
            payload: {
              activity: {
                type: 'message',
                id: 'welcome-' + Date.now(),
                timestamp: new Date().toISOString(),
                from: { id: 'bot', role: 'bot' },
                text: 'Welcome! How can I help you today?'
              }
            }
          });
        }
        return next(action);
      });

      // Create DirectLine connection
      const directLine = window.WebChat.createDirectLine({ token });

      // Render WebChat
      window.WebChat.renderWebChat(
        {
          directLine,
          store,
          styleOptions: {
            botAvatarInitials: 'Bot',
            userAvatarInitials: 'You'
          }
        },
        document.getElementById('webchat')
      );
    }

    main().catch(err => console.error('Error:', err));
  </script>
</body>
</html>
```

## Trade-offs and Considerations

Before you rush off to implement this, let's be honest about what you're giving up:

**What you lose:**
- **Conversation analytics for the welcome** — Since no real activity happens, you won't see welcome message metrics in your Copilot Studio analytics
- **Dynamic welcome content** — Your agent's Conversation Start topic might do personalization, A/B testing, or other clever things. The mocked message is static
- **Adaptive Cards in the greeting** — You *can* inject them (the activity payload supports attachments), but you'll need to construct the JSON yourself

**What you keep:**
- **Normal conversation flow** — Once the user sends a message, everything works exactly as before
- **All agent capabilities** — Topics, knowledge, plugins, orchestration—none of that changes
- **The user experience** — Visitors see a friendly greeting and can chat when ready

> If your Conversation Start topic does important work (setting context, checking user state, personalization), this approach might not be right for you.
{: .prompt-warning}

## When to Use This

This technique makes the most sense when:

- You have high-traffic public pages with low engagement rates
- Your welcome message is purely cosmetic ("Hi! Ask me anything!")
- You want users to see something friendly without starting a billable conversation
- You're embedding the agent in a context where most visitors won't interact

It makes less sense when:

- Your Conversation Start topic sets up important conversation context
- You need analytics on welcome message reach
- You're doing personalization in the greeting
- Your traffic is low enough that this isn't a concern

## Key Takeaways

- **Mocked welcome messages inject directly into WebChat's Redux store** — No activity reaches your agent
- **Use `DIRECT_LINE/INCOMING_ACTIVITY`** — This is the "message from agent" action, not the "message to agent" action
- **Real conversations start normally** — Once the user types, everything works as expected
- **Consider the trade-offs** — You lose greeting analytics and dynamic content capabilities

---

*Have you tried this approach on your public-facing agents? Or maybe you've found a more elegant solution to the "welcome message problem"? Drop a comment below—I promise it won't trigger a welcome message.*
