---
layout: post
title: "Triggering Copilot Studio Agents with HTTP Calls"
date: 2025-09-25
categories: [copilot-studio, tutorial, api]
tags: [http, direct-line, power-automate, api-integration]
author: roels
---

# Triggering Copilot Studio Agents with HTTP Calls

Sometimes you want to trigger an autonomous Copilot Studio agent with HTTP requests from an external source. This post shows two complete paths to integrate your agent with external APIs.

## Overview

There are two main approaches to trigger your agent:

1. **Cloud Flow path**: Using Power Automate to call the agent
2. **Direct HTTP path**: Calling the agent directly with REST and a Direct Line secret

We'll explore both paths through three practical examples:

- Cloud Flow integration in Power Platform
- API call collection with Hoppscotch
- Python demo script

## Path 1: Cloud Flow Integration

Cloud Flows provide a clean way to trigger a Copilot Studio agent with a fire-and-forget mechanism. This approach is particularly efficient if you're already working within the Power Platform ecosystem, and you can even set up this cloud flow using Copilot Studio credits.

### Required Steps

1. **Trigger**: Configure "When an HTTP request is received"
2. **Action**: Set up "Execute Copilot"
3. **Response**: Return the agent reply (just the conversationID since this is a fire-and-forget mechanism)

## Path 2: Direct HTTP Integration

Direct HTTP calls with a Direct Line secret allow you to trigger a Copilot Studio agent, send messages, and receive responses directly over REST. This approach requires four distinct API calls:

1. Generate a Direct Line token using your secret
2. Start a conversation
3. Send a text message to the agent
4. Pull the conversation activities (without watermark)

This path is ideal if you want a raw API integration without the Power Platform wrapper.

> **Important Security Notes**
> - Never hard code the secret - use Azure Key Vault or another secure store
> - Implement proper access control for the endpoint
> - Rotate the secret on a regular schedule
{: .prompt-warning }

## Preparing Your Agent

Before implementing either approach, you need to:

1. Publish your agent
2. Go to settings and the "Security" tab
3. Select "No Authentication" 
4. Navigate to "Web channel security" in the "Security" tab
5. Copy the secret for later use
6. Activate the "Require secured access" toggle

This configuration ensures the agent can only be triggered when including the proper secret.

## Implementation Examples

### Example 1: Native Cloud Flow

#### Step 1: Configure the Trigger

Create a new Cloud Flow and select "When an HTTP request is received" as your trigger (note: this is a premium trigger).

#### Step 2: Execute Copilot

Add the "Execute Copilot" action and pass the trigger body to the agent. Here's an example of the body structure:

```json
{
  "type": "message",
  "from": {
    "id": "dl_7f8c4d42-3f1b-42a2-92a3-84f879a546e3"
  },
  "text": "CAT calling this agent, with secret phrase Meow",
  "locale": "en-EN"
}
```

#### Step 3: Return Response

Add a "Response" action that returns the agent's conversationId with a 200 status code to the HTTP sender.

> Note that this is a fire-and-forget mechanism - you'll receive the response from the triggered Copilot Agent separately.
{: .prompt-tip }

### Example 2: Direct HTTP Calls Using Direct Line

#### Step 1: Generate Direct Line Token

Send a POST request to generate a token:

**Endpoint**: `https://directline.botframework.com/v3/directline/tokens/generate`

**Headers**:
```
Authorization: Bearer <DIRECT_LINE_SECRET>
```

**Body**:
```json
{
  "user": {
    "id": "dl_7f8c4d42-3f1b-42a2-92a3-84f879a546e3",
    "name": "Copilot CAT Direct Line tester"
  }
}
```

Make sure to capture the conversationId and token from the response.

#### Step 2: Start Conversation

Send a POST request to initialize the conversation:

**Endpoint**: `https://directline.botframework.com/v3/directline/conversations`

**Headers**:
```
Authorization: Bearer <TOKEN_FROM_STEP_1>
```

#### Step 3: Send Message to Bot

Send a POST request with your prompt:

**Endpoint**: `https://directline.botframework.com/v3/directline/conversations/<CONVERSATION_ID>/activities`

**Headers**:
```
Authorization: Bearer <TOKEN_FROM_STEP_1>
```

**Body**:
```json
{
  "type": "message",
  "from": {
    "id": "dl_7f8c4d42-3f1b-42a2-92a3-84f879a546e3"
  },
  "text": "CAT calling this agent, with secret phrase Meow",
  "locale": "en-EN"
}
```

#### Step 4: Fetch Conversation Activities

Send a GET request to retrieve the conversation:

**Endpoint**: `https://directline.botframework.com/v3/directline/conversations/<CONVERSATION_ID>/activities`

**Headers**:
```
Authorization: Bearer <TOKEN_FROM_STEP_1>
```

The response will include all activities in the conversation, similar to:

```json
{
  "activities": [
    {
      "type": "message",
      "id": "53orLbCv2GM7jGfhlyeaUO-eu|0000000",
      "timestamp": "2025-09-25T19:04:48.4092092Z",
      "serviceUrl": "https://directline.botframework.com/",
      "channelId": "directline",
      "from": {
        "id": "dl_7f8c4d42-3f1b-42a2-92a3-84f879a546e3"
      },
      "conversation": {
        "id": "53orLbCv2GM7jGfhlyeaUO-eu"
      },
      "locale": "en-EN",
      "text": "CAT calling this agent, with secret phrase Meow"
    },
    {
      "type": "message",
      "id": "53orLbCv2GM7jGfhlyeaUO-eu|0000001",
      "timestamp": "2025-09-25T19:04:55.1522894Z",
      "channelId": "directline",
      "from": {
        "id": "487381d2-438d-49f6-0a31-e856dfc3459d",
        "name": "Directline test agent",
        "role": "bot"
      },
      "conversation": {
        "id": "53orLbCv2GM7jGfhlyeaUO-eu"
      },
      "text": "success, you've been able to connect with the Directline test agent.",
      "inputHint": "acceptingInput"
    }
  ],
  "watermark": "1"
}
```

### Example 3: Python Implementation

You can also use a Python script to call the agent. This approach is ideal for testing purposes but should be enhanced for production use.

> **Development Notes**
> - Store the Direct Line secret in environment variables
> - Add proper error handling with retries and timeouts
> - Implement comprehensive logging of status, headers, and response bodies
> - Use Azure Key Vault or similar for secrets management
{: .prompt-tip }

Check the [appendix](#appendix) for the complete Python implementation and Hoppscotch collection.

## Conclusion

You now have two complete paths to trigger your Copilot Studio agent: Cloud Flow for a native Power Platform integration, or Direct HTTP for a lean REST-based approach. With the provided examples (Cloud Flow, Hoppscotch, and Python), you can trigger an agent, POST messages, and integrate responses into your own API flow.

We're excited to see what you'll build with these integration patterns. Share your implementations and use cases in the comments below!

## Appendix

### Hoppscotch Collection

Save the following JSON as "sample-trigger-copilot-studio-agent-with-api.json" and import it into [Hoppscotch](https://hoppscotch.io/):

```json
{
  "v": 10,
  "name": "Example to trigger an agent using Direct Line agent using HTTP calls",
  "folders": [],
  "requests": [
    {
      "v": "15",
      "name": "1: Generate Direct Line token (using Direct Line secret)",
      "method": "POST",
      "endpoint": "https://directline.botframework.com/v3/directline/tokens/generate",
      "params": [],
      "headers": [
        {
          "key": "Authorization",
          "value": "Bearer <<DIRECT_LINE_SECRET>>",
          "active": true
        }
      ],
      "body": {
        "contentType": "application/json",
        "body": {
          "user": {
            "id": "dl_7f8c4d42-3f1b-42a2-92a3-84f879a546e3",
            "name": "Copilot CAT Direct Line tester"
          }
        }
      }
    },
    {
      "v": "15",
      "name": "2: Start conversation",
      "method": "POST",
      "endpoint": "https://directline.botframework.com/v3/directline/conversations",
      "headers": [
        {
          "key": "Authorization",
          "value": "Bearer <<DIRECT_LINE_TOKEN>>",
          "active": true
        }
      ]
    },
    {
      "v": "15",
      "name": "3: Send text message to the bot",
      "method": "POST",
      "endpoint": "https://directline.botframework.com/v3/directline/conversations/<<conversationId>>/activities",
      "headers": [
        {
          "key": "Authorization",
          "value": "Bearer <<DIRECT_LINE_TOKEN>>",
          "active": true
        }
      ],
      "body": {
        "contentType": "application/json",
        "body": {
          "type": "message",
          "from": {
            "id": "dl_7f8c4d42-3f1b-42a2-92a3-84f879a546e3"
          },
          "text": "CAT calling this agent, with secret phrase Meow",
          "locale": "en-EN"
        }
      }
    },
    {
      "v": "15",
      "name": "4: Immediately fetch conversation activities without watermark",
      "method": "GET",
      "endpoint": "https://directline.botframework.com/v3/directline/conversations/<<conversationId>>/activities",
      "headers": [
        {
          "key": "Authorization",
          "value": "Bearer <<DIRECT_LINE_TOKEN>>",
          "active": true
        }
      ]
    }
  ]
}
```

### Python Implementation

Here's a complete Python script that demonstrates the Direct Line integration:

```python
"""
Direct Line token + GET activities poll
- Generate token
- Start conversation
- Send text
- Poll /activities with watermark to read bot reply
"""

import json
import time
import uuid
import requests

# Config
DIRECT_LINE_BASE = "https://directline.botframework.com/v3/directline"

# Create a fake test user with a random unique ID (must start with "dl_")
TEST_USER_ID = f"dl_{uuid.uuid4()}"
TEST_USER_NAME = "Copilot CAT Direct Line tester"

# Default test message and language
DEFAULT_TEXT = "CAT calling this agent, with secret phrase Meow"
DEFAULT_LOCALE = "en-EN"

def _auth_secret(secret: str):
    # Used when sending your Direct Line *secret* (to get a token)
    return {"Authorization": f"Bearer {secret}"}

def _auth_token(token: str):
    # Used once we already have a short-lived Direct Line *token*
    return {"Authorization": f"Bearer {token}"}

def _json_headers():
    # Tells the server we are sending JSON
    return {"Content-Type": "application/json"}

def generate_token_directline(secret: str, user_id: str, user_name: str):
    """
    Exchange the Direct Line secret for a short-lived token.
    Tokens are safer to use in apps than secrets.
    """
    url = f"{DIRECT_LINE_BASE}/tokens/generate"
    payload = {"user": {"id": user_id, "name": user_name}}
    resp = requests.post(
        url,
        headers={**_auth_secret(secret), **_json_headers()},
        data=json.dumps(payload)
    )
    resp.raise_for_status()
    return resp.json()

def start_conversation(token: str):
    """
    Start a new conversation with the bot.
    This gives us a conversationId we'll use in later calls.
    """
    url = f"{DIRECT_LINE_BASE}/conversations"
    resp = requests.post(url, headers=_auth_token(token))
    if resp.status_code not in (200, 201):
        resp.raise_for_status()
    return resp.json()

def send_text(conversation_id: str, token: str, user_id: str, text: str):
    """
    Send a text message into the bot conversation.
    """
    url = f"{DIRECT_LINE_BASE}/conversations/{conversation_id}/activities"
    payload = {
        "type": "message",
        "from": {"id": user_id},
        "text": text,
        "locale": DEFAULT_LOCALE
    }
    resp = requests.post(
        url,
        headers={**_auth_token(token), **_json_headers()},
        data=json.dumps(payload)
    )
    resp.raise_for_status()
    return resp.json()

def get_activities(conversation_id: str, token: str, watermark: str | None = None):
    """
    Get all activities (messages, events, etc.) in the conversation.
    We pass a 'watermark' so we only get *new* activities since last check.
    """
    url = f"{DIRECT_LINE_BASE}/conversations/{conversation_id}/activities"
    params = {}
    if watermark:
        params["watermark"] = watermark
    resp = requests.get(url, headers=_auth_token(token), params=params)
    resp.raise_for_status()
    return resp.json()

def poll_bot_replies(conversation_id: str, token: str, user_id: str,
                    start_watermark: str | None,
                    timeout_sec: float = 15.0,
                    interval_sec: float = 1.0):
    """
    Keep polling the bot for new messages until we get a reply
    or until the timeout runs out.
    """
    seen_ids = set()  # keep track of messages we already saw
    wm = start_watermark  # start from the given watermark
    deadline = time.time() + timeout_sec
    bot_texts = []

    while time.time() < deadline:
        # Get activities (messages/events) from bot
        data = get_activities(conversation_id, token, wm)
        wm = data.get("watermark", wm)

        for act in data.get("activities", []):
            act_id = act.get("id")
            if not act_id or act_id in seen_ids:
                continue
            seen_ids.add(act_id)

            # If it's a bot message (not from our user)
            if act.get("type") == "message" and act.get("from", {}).get("id") != user_id:
                text = act.get("text") or ""
                if text.strip():
                    bot_texts.append(text)

        if bot_texts:  # stop early if we already got something
            break

        time.sleep(interval_sec)  # wait before asking again

    return bot_texts, wm

def main():
    # Get your Direct Line secret from environment or configuration
    direct_line_secret = input("Enter your Direct Line secret: ")
    
    print("== Direct Line GET activities demo ==")

    # 1) Generate Direct Line token
    print("[1] Generating token via Direct Line...")
    gen = generate_token_directline(direct_line_secret, TEST_USER_ID, TEST_USER_NAME)
    token = gen["token"]
    print(f"Token acquired, expires in {gen['expires_in']}s")

    # 2) Start a new conversation
    print("[2] Starting conversation...")
    conv = start_conversation(token)
    conversation_id = conv["conversationId"]
    print(f"Conversation started: {conversation_id}")

    # 3) Get the initial watermark
    print("[3] Priming watermark with an initial GET...")
    first = get_activities(conversation_id, token, None)
    watermark = first.get("watermark")
    print(f"Initial watermark: {watermark}")

    # 4) Send a test message to the bot
    print("[4] Sending message...")
    res = send_text(conversation_id, token, TEST_USER_ID, DEFAULT_TEXT)
    print(f"Message sent, activity ID: {res.get('id')}")

    # Short wait so bot has time to reply
    time.sleep(0.3)

    # 5) Poll the bot until we get a reply or timeout
    print("[5] Polling for bot reply via GET /activities...")
    replies, watermark = poll_bot_replies(conversation_id, token, TEST_USER_ID, watermark)
    if replies:
        for i, t in enumerate(replies, 1):
            print(f"[Bot {i}] {t}")
    else:
        print("No bot reply in time window.")

    print(f"Done. Last watermark: {watermark}")

if __name__ == "__main__":
    main()
```

> **Note**: Remember to replace the Direct Line secret with your own when testing these examples.
{: .prompt-warning }
