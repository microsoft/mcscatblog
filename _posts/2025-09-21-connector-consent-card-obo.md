---
layout: post
title: "Intercepting and Responding to Connector Consent Cards via the Agents SDK"
date: 2025-09-21
categories: [copilot-studio, connectors, authentication]
tags: [obo, consent, connectors, agents-sdk, adaptive-cards]
description: Detect a connector consent (OBO) Adaptive Card, summarize it, and submit Allow or Cancel.
image: /assets/posts/connector-consent-card-obo/consent.png
---

When a conversational agent invokes a connector that uses [end user authentication](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-enduser-authentication), the runtime surfaces a **consent card** asking the end user to grant permission for the agent to create a connection on their behalf.

This experience is only for connectors that natively support Entra ID authentication (excluding custom connectors). Others trigger the (more disruptive) [connection manager experience](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-connections#view-connections-on-the-connection-settings-page).


## Why Intercept the Card via the M365 Agents SDK?

Agents SDK is often used to communicate with Copilot Studio Agents in headless scenarios or when developers bring their own custom UI. In these scenarios, it is up to the developer to take care of rendering the consent card, and send the user's choice (`Allow` or `Cancel`) back to Copilot Studio. Without user consent, Copilot Studio **won't invoke connectors** that use end user authentication.

## Detection Heuristics

Unfortunately, requests for consent aren't being sent as specific event types. Instead, we need to use heuristics to detect the consent adaptive card based on its payload.

A consent adaptive card seem to contain:
- A TextBlock containing “Connect to continue”.
- Two `Action.Submit` buttons titled Allow and Cancel.
- Capability lines describing what the connection can do.
- A security / privacy warning section.

Here's a minimal consent adaptive card (only fields needed for detection):

<details markdown="1">
<summary><strong>Show minimal consent Adaptive Card JSON</strong></summary>

```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "body": [
    { "type": "TextBlock", "text": "Connect to continue", "size": "Medium", "weight": "Bolder", "wrap": true },
    { "type": "TextBlock", "text": "I'll use your credentials to connect and get the information you need.", "wrap": true },
    { "type": "ColumnSet", "columns": [
        { "type": "Column", "width": "auto" },
        { "type": "Column", "width": "stretch", "items": [
            { "type": "TextBlock", "text": "Office 365 Users", "weight": "Bolder", "wrap": true }
        ]}
      ]},
    { "type": "TextBlock", "text": "This connection can:", "wrap": true },
    { "type": "TextBlock", "id": "capability0", "text": "- Get my profile (V2)", "wrap": true },
    { "type": "TextBlock", "id": "securityWarning", "isSubtle": true, "text": "Connecting to other services with your credentials may expose your data to privacy and security risks.", "wrap": true },
    { "type": "ActionSet", "actions": [
        { "type": "Action.Submit", "title": "Allow",  "data": { "action": "Allow"  } },
        { "type": "Action.Submit", "title": "Cancel", "data": { "action": "Cancel" } }
    ]}
  ]
}
```

</details>

## Response payload

In order to respond to the consent request, your custom client needs to send the following activity payload, with either `Allow` or `Cancel` -- based on the user's choice.

```json
{
  "type": "message",
  "channelData": {
    "postBack": true,
    "enableDiagnostics": true
  },
  "value": {
    "action": "Allow",  
    "id": "submit",
    "shouldAwaitUserInput": true
  }
}
```

## Implementation Walkthrough

This implementation walkthrough extends the [Agents SDK C# console app sample](https://github.com/microsoft/Agents/tree/main/samples/dotnet/copilotstudio-client), however it applies to any application or service using Agents SDK to communicate with Copilot Studio.

### Detect the consent card in PrintActivity

We start by logic that would detect the consent adaptive card to `PrintActivity` in `ChatConsoleService.cs`. The `IsConsentCard` helper functions assumes that a card is a consent card if it says **Connect to continue** and has `Allow` and `Cancel` buttons.

<details markdown="1">
<summary><strong>Message handling in PrintActivity</strong></summary>

```csharp
// Inside your message handling (act is an IActivity)
if (act.Type == "message")
{
    var adaptiveCards = act.Attachments?
        .Where(a => a.ContentType == "application/vnd.microsoft.card.adaptive");

    if (adaptiveCards != null)
    {
        foreach (var cardAttachment in adaptiveCards)
        {
            if (cardAttachment.Content != null &&
                TryParseAdaptiveCard(cardAttachment.Content, out var cardJson) &&
                IsConsentCard(cardJson))
            {
                // Print card details (service name, capabilities, warning, etc.)
                // (omitted here for brevity)
            }
        }
    }
}

// Heuristic: headline AND both Allow + Cancel buttons.
static bool IsConsentCard(JToken card)
{
    bool hasConnectPhrase = card
        .SelectTokens("$.body[?(@.type == 'TextBlock')].text")
        .Any(t => t?.ToString().Contains("Connect to continue", StringComparison.OrdinalIgnoreCase) == true);

    var actionTitles = card
        .SelectTokens("$.body..actions[?(@.type == 'Action.Submit')].title")
        .Select(t => t.ToString())
        .ToList();

    bool hasAllowCancel =
        actionTitles.Any(t => t.Equals("Allow", StringComparison.OrdinalIgnoreCase)) &&
        actionTitles.Any(t => t.Equals("Cancel", StringComparison.OrdinalIgnoreCase));

    return hasConnectPhrase && hasAllowCancel;  // Changed from || to &&
}

// Normalizes attachment content to JToken (unchanged from earlier).
static bool TryParseAdaptiveCard(object content, out JToken json)
{
    try
    {
        json = content switch
        {
            string s => JToken.Parse(s),
            JToken jt => jt,
            System.Text.Json.JsonElement je => JToken.Parse(je.GetRawText()),
            _ => JToken.FromObject(content)
        };
        return true;
    }
    catch
    {
        json = null!;
        return false;
    }
}
```
</details>

### Respond to the consent card

Once the user chooses Allow or Cancel, send a Message Activity that emulates the Adaptive Card button click.

- Set `channelData.postBack = true` (marks it as a button action)
- Build the `value` payload with the user's choice ("Allow" or "Cancel")

```csharp
// Assume userChoice is "Allow" or "Cancel" from user input
var consentActivity = new Activity
{
    Type = ActivityTypes.Message,
    ChannelData = new
    {
        postBack = true          // Required: tells service this is a button click
    },
    Value = new
    {
        action = userChoice,     // "Allow" or "Cancel"
        id = "submit",
        shouldAwaitUserInput = true
    }
};

// Send the consent response
await foreach (var response in copilotClient.AskQuestionAsync(consentActivity, cancellationToken))
{
    // Handle response
}
```

Example payloads:
- Allow: `{ "action": "Allow", "id": "submit", "shouldAwaitUserInput": true }`
- Cancel: `{ "action": "Cancel", "id": "submit", "shouldAwaitUserInput": true }`
