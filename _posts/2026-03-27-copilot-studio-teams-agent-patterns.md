---
layout: post
title: "Production Patterns for Microsoft Teams Agents: Diagnostic Cards and Edge Case Handling"
date: 2026-03-27 09:00:00 +0100
categories: [copilot-studio, teams, production]
tags: [teams-integration, session-management, adaptive-cards, error-handling, diagnostic-tools, troubleshooting, state-management]
description: Production-grade patterns for Copilot Studio agents in Teams, featuring self-service diagnostic Adaptive Cards, session management, and edge case handling to reduce support burden.
author: raemone
image:
  path: /assets/posts/copilot-studio-teams-agent-patterns/header.png
  alt: "Diagnostic tools and production patterns for Teams agents"
  no_bg: true
---

Your Copilot Studio agent works perfectly in testing. Then you deploy to Microsoft Teams and users report:
- Stale context from yesterday's conversation
- Empty chats after reinstalling the app
- Cryptic errors with no way to recover
- Variables that disappear after "Start Over"

Production isn't just about scale. It's about handling the edge cases that never appear in demos.

This guide builds on [Best Practices for Deploying Copilot Studio Agents in Microsoft Teams](https://microsoft.github.io/mcscatblog/posts/copilot-studio-teams-deployment-ux/) with production-grade patterns that turn support headaches into self-service wins.

The difference between a demo agent and a production agent isn't features. It's resilience. It's the ability to gracefully handle the scenarios that never appear in testing:
- The user who uninstalls and reinstalls the app weekly
- The executive who returns to a conversation after three weeks
- The support team trying to debug an issue with zero context

This guide gives you six battle-tested patterns to handle all of these scenarios. We'll spend the most time on Pattern 5 (Diagnostic Cards) because it's the one that delivers the highest ROI: transforming frustrating support tickets into self-service wins.

## The Core Challenge

Unlike the Test bot in Copilot Studio, Microsoft Teams conversations persist indefinitely. Users close the chat, return three days later, and continue exactly where they left off. This creates problems:

**Stale Context**: User asks about Order 12345 on Monday. Returns Friday and says "update the shipping address." The agent still thinks it's Order 12345, but the user meant Order 67890.

**Empty Reinstalls**: Users uninstall and reinstall Teams apps frequently. When they reinstall your agent, they see an empty chat. No welcome message. No context.

**Error Recovery**: Something breaks. The user sees "An error occurred." No diagnostic information, no next steps, no way to recover except restarting Teams.

## Six Patterns for Production

Here are the six patterns that address these challenges:

| Pattern | When to Use | Impact |
|---------|-------------|--------|
| **1. OnInstallationUpdate** | Always (prevents empty chat after reinstall) | High |
| **2. Session Expiration** | Always for Teams agents (persistent conversations) | High |
| **3. Context Variables** | If you support M365 Copilot OR use Start Over | High |
| **4. Enhanced Reset** | Always (better user experience) | Medium |
| **5. Diagnostic Cards** | Production agents with support requirements | Very High |
| **6. Suggested Prompts** | Always (improves discoverability) | Medium |

Let me briefly cover Patterns 1-4 before diving deep into Pattern 5, the star of this guide.

## Pattern 1: Handling Reinstalls (OnInstallationUpdate)

When users reinstall your agent in Teams, Conversation Start doesn't trigger. They see an empty chat window.

**The fix**: Use the OnInstallationUpdate trigger to redirect to Conversation Start.

![OnInstallationUpdate trigger](/assets/posts/copilot-studio-teams-agent-patterns/image1.png)
_OnInstallationUpdate trigger configuration in Copilot Studio_

<details markdown="1">
<summary>View YAML Implementation</summary>

```yaml
kind: AdaptiveDialog
startBehavior: UseLatestPublishedContentAndCancelOtherTopics
beginDialog:
  kind: OnActivity
  id: main
  type: InstallationUpdate
  actions:
    - kind: BeginDialog
      id: Bqmh4L
      dialog: <YOUR_SOLUTION>.topic.ConversationStart
```
{: file='OnInstallationUpdate.topic.yaml'}

What this does:
- Detects InstallationUpdate activity from Teams
- Cancels any running dialogs
- Redirects to Conversation Start topic
- User sees your welcome message and suggested prompts

</details>

> This only works in Teams. The M365 Copilot channel doesn't support OnInstallationUpdate events.
{: .prompt-info }

## Pattern 2: Session Expiration After Inactivity

Agent conversations in Teams persist indefinitely. If a user returns after days, the agent still has old context variables and conversation history from Tuesday.

**The fix**: Use OnInactivity to clear stale context after 12 hours and notify users when they return.

![Inactivity trigger configuration](/assets/posts/copilot-studio-teams-agent-patterns/image3.png)
_OnInactivity properties - 43200 seconds (12 hours) with Teams channel condition_

<details markdown="1">
<summary>View YAML Implementation - Part 1: Clear After Inactivity</summary>

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnInactivity
  id: main
  condition: =System.Activity.ChannelId = "msteams"
  durationInSeconds: 43200  # 12 hours
  actions:
    - kind: ClearAllVariables
      id: mXHosp
      variables: ConversationHistory
    - kind: ClearAllVariables
      id: Vsemgr
    - kind: SetVariable
      id: setVariable_6CUITr
      variable: Global.InactiveConversation
      value: true
    - kind: CancelAllDialogs
      id: webE3j
```
{: file='OnInactivity.topic.yaml'}

</details>

![Set InactiveConversation flag](/assets/posts/copilot-studio-teams-agent-patterns/image4.png)
_Setting Global.InactiveConversation = true after clearing variables_

<details markdown="1">
<summary>View YAML Implementation - Part 2: Notify on Return</summary>

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnActivity
  id: main
  condition: =Global.InactiveConversation = true
  type: Message
  actions:
    - kind: SetVariable
      id: setVariable_G6aAbW
      variable: Global.InactiveConversation
      value: false
    - kind: SendActivity
      id: sendActivity_pgGjvA
      activity:
        attachments:
          - kind: HeroCardTemplate
            title: Session expired
            subtitle: New conversation started
            text: Just so you know – Your previous session ended due to inactivity. Your query is now being treated as a new conversation. If you want to start fresh, you can restart at any time.
            buttons:
              - kind: MessageBack
                title: Start over
                text: Start over
```
{: file='OnActivityAfterInactivity.topic.yaml'}

</details>

![Session expired in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image7.png)
_Session expired notification in Teams - agent warns about context reset but proceeds to answer_

**User experience:**
1. User asks question on Monday, agent responds
2. User returns Friday (inactivity triggered Wednesday, variables cleared)
3. User asks follow-up, agent shows "Session expired" card
4. User understands context reset, continues or restarts

> Choose your inactivity duration based on your use case: 4 hours (14,400s) for time-sensitive data, 12 hours (43,200s) for balanced scenarios, or 24 hours (86,400s) for multi-day workflows.
{: .prompt-tip }

## Pattern 3: Context Variables That Work Everywhere

Many makers set context variables (user language, country, preferences) in Conversation Start. But Conversation Start doesn't trigger in M365 Copilot. Additionally, "Start Over" and inactivity clearing wipe these variables.

**The fix**: Use an OnActivity trigger with a condition to set context variables on the user's first message. Works in Teams AND M365 Copilot.

![SetContextVariables trigger](/assets/posts/copilot-studio-teams-agent-patterns/image8.png)
_OnActivity trigger with IsBlank(Global.UserContext) condition - priority -2_

<details markdown="1">
<summary>View YAML Implementation</summary>

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnActivity
  id: main
  priority: -2
  condition: =IsBlank(Global.UserContext)
  type: Message
  actions:
    - kind: SetVariable
      id: setVariable_kRbCMi
      variable: Global.UserContext
      value: |-
        ={
            Country: "USA",
            Language: "English"
        }
```
{: file='SetContextVariables.topic.yaml'}

What this does:
- Triggers on any message activity
- Low priority (-2) so it runs early
- Only when Global.UserContext is blank
- Sets default values (replace with actual logic: connectors, user profile API, etc.)

</details>

In production, replace the hardcoded values with a connector action to fetch user language from Microsoft Graph, user country/region from organizational data, or preferences from a database.

You can also reference this topic in your agent instructions so the orchestrator knows to call it when context is missing:

```markdown
**Context**
The current user country is: "{Global.UserContext.Country}", and language is "{Global.UserContext.Language}".

If you don't know the user country (e.g., ""), use this tool to get the current values: {System.Bot.Components.Topics.'YourSolution.topic.SetContextVariables'.DisplayName}.
```

## Pattern 4: Enhanced Reset Conversation

The default Reset Conversation topic only clears conversation-scoped variables. It doesn't clear conversation history, redirect to Conversation Start, or reset global variables. Users who "start over" don't get a clean slate.

**The fix**: Customize Reset Conversation to clear everything and redirect to Conversation Start.

![Reset Conversation actions](/assets/posts/copilot-studio-teams-agent-patterns/image12.png)
_Clearing all variables, conversation history, and redirecting to Conversation Start_

<details markdown="1">
<summary>View YAML Implementation</summary>

```yaml
kind: AdaptiveDialog
startBehavior: UseLatestPublishedContentAndCancelOtherTopics
beginDialog:
  kind: OnSystemRedirect
  id: main
  actions:
    - kind: ClearAllVariables
      id: clearAllVariables_73bTFR
      variables: ConversationScopedVariables
    - kind: ClearAllVariables
      id: SLgE7u
      variables: ConversationHistory
    - kind: BeginDialog
      id: U14iCH
      dialog: YourSolution.topic.ConversationStart
    - kind: CancelAllDialogs
      id: cancelAllDialogs_12Gt21
```
{: file='ResetConversation.topic.yaml'}

</details>

**User experience**: User says "start over", agent clears everything, user sees welcome message and suggested prompts. Clean slate.

---

## Pattern 5: Self-Service Troubleshooting with Diagnostic Cards

This is the production differentiator. The pattern that transforms support burden into self-service wins.

### The Problem

When users need to "start over" or encounter errors, they have no way to:
- Self-diagnose issues
- Share diagnostic data with support
- Understand what went wrong

Support teams can't correlate user reports without Conversation IDs, timestamps, or environment details. Every support ticket becomes a 20-minute back-and-forth:

**User**: "The bot isn't working."
**Support**: "Can you send a screenshot?"
**User**: "It just says error."
**Support**: "When did this happen?"
**User**: "I don't remember, maybe yesterday?"

### The Solution

Enhance the Start Over topic with an expandable Adaptive Card containing:
- Troubleshooting commands users can click
- Full diagnostic information (Environment ID, Tenant ID, Agent ID, Conversation ID, Timestamp)
- User and conversation details for support correlation

This is production-grade self-service.

### What Users See

![Start Over card in Teams - collapsed](/assets/posts/copilot-studio-teams-agent-patterns/image18.png)
_Start Over confirmation card with collapsed Debug Menu (expandable)_

**Collapsed state** (default):
- Clear question: "Are you sure you want to restart the conversation?"
- Explanation: "This will reset the current conversation context."
- Action buttons: Yes / No
- Expandable section: "Advanced options" (collapsed by default)

**Expanded state** (when users click "Advanced options"):

**Troubleshooting Actions** (clickable buttons):
- Clear State (`/debug clearstate`)
- Clear History (`/debug clearhistory`)
- Show Conversation ID (`/debug conversationid`)

**Diagnostic Information** (read-only text):
- **Environment details**: Environment ID, Tenant ID
- **Agent details**: Name, Agent ID, Schema name
- **User details**: Language, Object ID
- **Conversation details**: Channel, Conversation ID, Timestamp (UTC)

### Implementation

![Start Over trigger](/assets/posts/copilot-studio-teams-agent-patterns/image13.png)
_Start Over topic trigger with Teams channel condition_

![Start Over Adaptive Card in Studio](/assets/posts/copilot-studio-teams-agent-patterns/image14.png)
_Start Over Adaptive Card configuration showing Yes/No buttons and expandable Debug Menu_

The Adaptive Card uses Action.ToggleVisibility to show/hide the diagnostic panel. Users who just want to restart see a clean Yes/No prompt. Power users who need diagnostics can expand the section.

<details markdown="1">
<summary>View Complete YAML Implementation</summary>

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnRecognizedIntent
  id: main
  intent:
    displayName: Start Over
    triggerQueries:
      - let's begin again
      - start over
      - restart
  actions:
    - kind: Question
      id: question_JXD5yW
      variable: Topic.Confirm
      prompt:
        attachments:
          - kind: AdaptiveCardTemplate
            cardContent: |-
              ={
                '$schema': "https://adaptivecards.io/schemas/adaptive-card.json",
                type: "AdaptiveCard",
                version: "1.5",
                body: [
                  {
                    type: "TextBlock",
                    text: "Are you sure you want to restart the conversation?",
                    wrap: true,
                    weight: "Bolder",
                    size: "Medium"
                  },
                  {
                    type: "TextBlock",
                    text: "This will reset the current conversation context.",
                    wrap: true,
                    spacing: "Small",
                    isSubtle: true
                  },
                  {
                    type: "Container",
                    spacing: "Small",
                    style: "emphasis",
                    bleed: true,
                    items: [{
                      type: "TextBlock",
                      text: "Advanced options",
                      size: "Small",
                      weight: "Bolder"
                    }],
                    selectAction: {
                      type: "Action.ToggleVisibility",
                      targetElements: ["advancedOptions"]
                    }
                  },
                  {
                    type: "Container",
                    id: "advancedOptions",
                    isVisible: false,
                    items: [
                      {
                        type: "TextBlock",
                        text: "Debug Menu",
                        weight: "Bolder",
                        size: "Medium"
                      },
                      {
                        type: "TextBlock",
                        text: "Troubleshooting Actions",
                        weight: "Bolder",
                        spacing: "Medium"
                      },
                      {
                        type: "ActionSet",
                        actions: [
                          {
                            type: "Action.Submit",
                            title: "Clear State",
                            data: {
                              msteams: {
                                type: "messageBack",
                                displayText: "/debug clearstate",
                                text: "/debug clearstate"
                              }
                            }
                          },
                          {
                            type: "Action.Submit",
                            title: "Clear History",
                            data: {
                              msteams: {
                                type: "messageBack",
                                displayText: "/debug clearhistory",
                                text: "/debug clearhistory"
                              }
                            }
                          },
                          {
                            type: "Action.Submit",
                            title: "Show Conversation ID",
                            data: {
                              msteams: {
                                type: "messageBack",
                                displayText: "/debug conversationid",
                                text: "/debug conversationid"
                              }
                            }
                          }
                        ]
                      },
                      {
                        type: "TextBlock",
                        text: "Diagnostic Information",
                        weight: "Bolder",
                        spacing: "Medium"
                      },
                      {
                        type: "FactSet",
                        facts: [
                          {
                            title: "Environment ID:",
                            value: Text(System.Activity.From.Properties.EnvironmentId)
                          },
                          {
                            title: "Tenant ID:",
                            value: Text(System.Activity.From.Properties.TenantId)
                          },
                          {
                            title: "Agent Name:",
                            value: System.Bot.Name
                          },
                          {
                            title: "Agent ID:",
                            value: System.Bot.Id
                          },
                          {
                            title: "Agent Schema Name:",
                            value: System.Bot.SchemaName
                          },
                          {
                            title: "User Language:",
                            value: System.User.Language
                          },
                          {
                            title: "User Object ID:",
                            value: System.User.Id
                          },
                          {
                            title: "Channel ID:",
                            value: System.Activity.ChannelId
                          },
                          {
                            title: "Conversation ID:",
                            value: System.Activity.Conversation.Id
                          },
                          {
                            title: "Timestamp (UTC):",
                            value: Text(Now(), DateTimeFormat.LongDateTime)
                          }
                        ]
                      }
                    ]
                  }
                ],
                actions: [
                  {
                    type: "Action.Submit",
                    title: "Yes",
                    data: {
                      msteams: {
                        type: "messageBack",
                        displayText: "Yes",
                        text: "Yes"
                      }
                    },
                    style: "positive"
                  },
                  {
                    type: "Action.Submit",
                    title: "No",
                    data: {
                      msteams: {
                        type: "messageBack",
                        displayText: "No",
                        text: "No"
                      }
                    }
                  }
                ]
              }
      entity:
        kind: ClosedListEntityReference
        entityId: YourSolution.entity.YesNo
    - kind: ConditionGroup
      id: conditionGroup_nYrQW0
      conditions:
        - id: conditionItem_OhiCdW
          condition: =Topic.Confirm = 'YourSolution.entity.YesNo'.Yes
          actions:
            - kind: BeginDialog
              id: beginDialog_bLhJFG
              dialog: YourSolution.topic.ResetConversation
      elseActions:
        - kind: SendActivity
          id: sendActivity_5cABGU
          activity:
            text:
              - Ok. Let's carry on.
```
{: file='StartOver.topic.yaml'}

</details>

> You need a closed-list entity named YesNo with items "Yes" and "No" for the confirmation prompt to work properly.
{: .prompt-info }

![Yes/No entity configuration](/assets/posts/copilot-studio-teams-agent-patterns/image17.png)
_Yes/No closed-list entity for confirmation responses_

### Why This Matters

**For Users**:
- Self-diagnose issues without contacting support
- Copy Conversation ID for support tickets instantly
- Clear understanding of troubleshooting options
- Professional, transparent experience

**For Support Teams**:
- Exact Conversation ID for log correlation
- Timestamp for when issue occurred
- Environment and agent details for debugging
- Reduced support tickets for simple issues

**For Admins**:
- Faster resolution times
- Better diagnostic data
- Lower support costs
- Improved user satisfaction

### Real-World Impact

Before implementing diagnostic cards, a typical support ticket looked like:

**Ticket 1847**: User reports "bot not working"
**Time to resolution**: 2 days, 6 email exchanges

After implementing diagnostic cards:

**Ticket 1952**: User sends screenshot with Conversation ID `19:abc123...` visible
**Time to resolution**: 2 hours, 1 email exchange

Support teams can jump directly to the conversation transcript in Application Insights or Power Platform admin center, see exactly what failed, and respond with precision.

### Building the Diagnostic Card: Step-by-Step

Let me walk you through the key components of the diagnostic Adaptive Card.

**1. The Toggle Action**

The magic of this card is the expandable section. This uses `Action.ToggleVisibility`:

```json
{
  "type": "Container",
  "spacing": "Small",
  "style": "emphasis",
  "bleed": true,
  "items": [{
    "type": "TextBlock",
    "text": "Advanced options",
    "size": "Small",
    "weight": "Bolder"
  }],
  "selectAction": {
    "type": "Action.ToggleVisibility",
    "targetElements": ["advancedOptions"]
  }
}
```

When users click the "Advanced options" container, it toggles the visibility of the container with `id: "advancedOptions"`. This keeps the card clean by default while making advanced features discoverable.

**2. The Troubleshooting Actions**

The diagnostic card includes clickable buttons that send specific commands. These use `Action.Submit` with Teams-specific messageBack data:

```json
{
  "type": "Action.Submit",
  "title": "Clear State",
  "data": {
    "msteams": {
      "type": "messageBack",
      "displayText": "/debug clearstate",
      "text": "/debug clearstate"
    }
  }
}
```

The `displayText` shows what the user clicked (transparency), while `text` is what the agent receives. This gives users one-click access to troubleshooting commands without typing.

**3. The Diagnostic Facts**

The FactSet displays key diagnostic information in a clean, scannable format:

```json
{
  "type": "FactSet",
  "facts": [
    {
      "title": "Conversation ID:",
      "value": System.Activity.Conversation.Id
    },
    {
      "title": "Timestamp (UTC):",
      "value": Text(Now(), DateTimeFormat.LongDateTime)
    }
  ]
}
```

This uses Power Fx expressions to pull live data. `System.Activity.Conversation.Id` gives you the unique conversation identifier. `Text(Now(), DateTimeFormat.LongDateTime)` formats the current timestamp.

> When users screenshot the expanded card and send it to support, your team gets everything they need in one image.
{: .prompt-tip }

### Extending the Pattern: Error Handling

You can apply the same diagnostic card pattern to your On Error topic. Here's how:

**1. Create an Enhanced On Error Topic**

Instead of showing a generic "An error occurred" message, show the diagnostic card with error-specific information:

<details markdown="1">
<summary>View Error Handling Example</summary>

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnError
  id: main
  actions:
    - kind: SendActivity
      id: sendActivity_ErrorCard
      activity:
        attachments:
          - kind: AdaptiveCardTemplate
            cardContent: |-
              ={
                '$schema': "https://adaptivecards.io/schemas/adaptive-card.json",
                type: "AdaptiveCard",
                version: "1.5",
                body: [
                  {
                    type: "TextBlock",
                    text: "Something went wrong",
                    wrap: true,
                    weight: "Bolder",
                    size: "Large",
                    color: "Attention"
                  },
                  {
                    type: "TextBlock",
                    text: "I encountered an error while processing your request. The technical team has been notified.",
                    wrap: true,
                    spacing: "Small"
                  },
                  {
                    type: "Container",
                    id: "errorDetails",
                    isVisible: false,
                    items: [
                      {
                        type: "TextBlock",
                        text: "Error Details",
                        weight: "Bolder",
                        spacing: "Medium"
                      },
                      {
                        type: "FactSet",
                        facts: [
                          {
                            title: "Error Message:",
                            value: System.LastError.Message
                          },
                          {
                            title: "Dialog ID:",
                            value: System.LastError.DialogId
                          },
                          {
                            title: "Conversation ID:",
                            value: System.Activity.Conversation.Id
                          },
                          {
                            title: "Timestamp:",
                            value: Text(Now(), DateTimeFormat.LongDateTime)
                          }
                        ]
                      }
                    ]
                  }
                ],
                actions: [
                  {
                    type: "Action.ToggleVisibility",
                    title: "Show technical details",
                    targetElements: ["errorDetails"]
                  },
                  {
                    type: "Action.Submit",
                    title: "Start over",
                    data: {
                      msteams: {
                        type: "messageBack",
                        text: "start over"
                      }
                    }
                  }
                ]
              }
```
{: file='OnError.topic.yaml'}

</details>

**2. Log Custom Telemetry**

Pair your diagnostic card with custom telemetry logging. When an error occurs, log it to Application Insights with all the diagnostic details:

```yaml
- kind: SendActivity
  id: logTelemetry
  activity:
    text: |-
      ="{
        'eventType': 'AgentError',
        'conversationId': '" & System.Activity.Conversation.Id & "',
        'errorMessage': '" & System.LastError.Message & "',
        'dialogId': '" & System.LastError.DialogId & "',
        'userId': '" & System.User.Id & "',
        'timestamp': '" & Text(Now(), DateTimeFormat.ISO8601) & "'
      }"
```

This creates a correlation trail. When users report an issue and provide the Conversation ID from the diagnostic card, you can search Application Insights for that exact conversation and see what failed.

### Best Practices for Diagnostic Cards

**1. Balance Transparency with Complexity**

Don't overwhelm users with technical details by default. Use collapsible sections to make advanced information available without cluttering the main interface.

**2. Make Commands Clickable**

Instead of telling users to type `/debug clearstate`, give them a button. Reduces friction and typos.

**3. Include Context-Specific Information**

If the error occurred during a specific operation (like fetching data from a connector), include that context:

```json
{
  "title": "Operation:",
  "value": "Fetching customer data from Dynamics 365"
}
```

**4. Provide Next Steps**

Don't just show diagnostic information. Tell users what to do next:

- "Try clicking 'Start over' to reset the conversation"
- "If this continues, contact support with the Conversation ID above"
- "Check your permissions and try again"

**5. Version Your Cards**

Include a card version in the diagnostic data:

```json
{
  "title": "Card Version:",
  "value": "2.1.0"
}
```

This helps you track which version of the diagnostic card users are seeing, especially useful when you iterate on the design.

### Measuring Success

After implementing diagnostic cards, track these metrics to measure impact:

**Support Metrics**:
- Time to resolution (should decrease)
- Number of follow-up questions per ticket (should decrease)
- Percentage of tickets with complete diagnostic data (should increase)
- User satisfaction scores (should increase)

**User Behavior Metrics**:
- How often users expand the Advanced options
- Which troubleshooting commands get clicked most
- How many users self-resolve vs. contact support

You can track card interactions by adding custom telemetry to each button action:

```json
{
  "type": "Action.Submit",
  "title": "Clear State",
  "data": {
    "msteams": {
      "type": "messageBack",
      "text": "/debug clearstate"
    },
    "telemetry": {
      "action": "diagnostic_clearstate_clicked",
      "cardVersion": "2.1.0"
    }
  }
}
```

Then log these interactions in Application Insights to understand how users interact with your diagnostic tools.

## Pattern 6: Suggested Prompts

Not really a pattern, but worth noting: Suggested prompts configured at the agent level work in both Teams and M365 Copilot.

![Suggested prompts configuration](/assets/posts/copilot-studio-teams-agent-patterns/image19.png)
_Copilot Studio suggested prompts configuration_

![Suggested prompts in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image20.png)
_B2E Agent showing suggested prompts in Teams_

Configure these in **Settings > Generative AI > Suggested prompts** for consistent discoverability across channels.

---

## Implementation Checklist

Ready to make your agent production-ready? Here's your checklist:

- [ ] **OnInstallationUpdate** - Redirect to Conversation Start after reinstalls
- [ ] **OnInactivity** - Clear context after 12 hours, set InactiveConversation flag
- [ ] **OnActivityAfterInactivity** - Notify users when session expired
- [ ] **SetContextVariables** - Set context on first message (works in M365 Copilot)
- [ ] **Reset Conversation** - Clear history and variables, redirect to Conversation Start
- [ ] **Start Over** - Enhanced with diagnostic Adaptive Card
- [ ] **YesNo Entity** - Closed-list entity for confirmation dialogs
- [ ] **Suggested prompts** - Configured at agent level for Teams + M365 Copilot

## Testing Checklist

- [ ] Reinstall agent, verify Conversation Start triggers
- [ ] Wait 12 hours inactive, verify variables cleared and notification shown
- [ ] Say "start over", verify diagnostic card appears and reset works
- [ ] Expand "Advanced options", verify diagnostic data displays correctly
- [ ] Test in M365 Copilot, verify context variables set without Conversation Start
- [ ] Check Application Insights, verify custom telemetry logged (if implemented)

## Common Pitfalls and How to Avoid Them

Even with these patterns, there are common mistakes that can derail your production deployment. Here's what to watch out for:

### Pitfall 1: Forgetting Channel Conditions

**The mistake**: Applying OnInactivity without checking the channel.

```yaml
# Don't do this
kind: OnInactivity
durationInSeconds: 43200
# Missing: condition check
```

**The problem**: M365 Copilot doesn't support OnInactivity triggers. Your agent will fail to publish if you don't add a channel condition.

**The fix**:

```yaml
kind: OnInactivity
condition: =System.Activity.ChannelId = "msteams"
durationInSeconds: 43200
```

Always include `condition: =System.Activity.ChannelId = "msteams"` for Teams-specific triggers.

### Pitfall 2: Clearing Variables Too Aggressively

**The mistake**: Clearing global context variables during inactivity reset.

```yaml
# Be careful with this
- kind: ClearAllVariables
  variables: GlobalVariables  # This clears everything
```

**The problem**: If you set user preferences or context in `Global.UserContext` (Pattern 3), clearing all global variables wipes that data. Users have to re-authenticate or re-enter preferences.

**The fix**: Clear selectively.

```yaml
# Do this instead
- kind: ClearAllVariables
  variables: ConversationHistory
- kind: ClearAllVariables
  variables: ConversationScopedVariables
# Keep Global.UserContext intact
```

Only clear conversation-scoped data and history. Preserve global context that should persist across sessions.

### Pitfall 3: Not Testing the Full User Journey

**The mistake**: Testing each pattern in isolation.

**The problem**: Patterns interact. OnInactivity clears variables, but SetContextVariables needs to reinitialize them. If you don't test the full flow (inactive -> return -> context restored), you'll miss integration issues.

**The fix**: Test these scenarios end-to-end:

1. **Reinstall journey**: Uninstall app -> Reinstall -> Verify Conversation Start triggers -> Verify context variables set
2. **Inactivity journey**: Start conversation -> Wait 12+ hours -> Return -> Verify session expired message -> Verify context restored -> Verify agent responds correctly
3. **Error journey**: Trigger an error -> Verify diagnostic card appears -> Expand Advanced options -> Verify all diagnostic data present -> Click troubleshooting commands -> Verify they work

### Pitfall 4: Hardcoding Environment-Specific Data

**The mistake**: Including environment-specific values in diagnostic cards.

```yaml
# Don't hardcode this
facts: [
  {
    title: "Environment:",
    value: "Production"  # Hardcoded
  }
]
```

**The problem**: When you export and import your agent across DEV/TEST/PROD environments, the hardcoded value is wrong.

**The fix**: Use system variables.

```yaml
facts: [
  {
    title: "Environment ID:",
    value: Text(System.Activity.From.Properties.EnvironmentId)
  }
]
```

System variables automatically reflect the current environment. No manual updates needed.

### Pitfall 5: Overwhelming Users with Diagnostic Data

**The mistake**: Showing all diagnostic information by default.

**The problem**: Users don't care about Environment IDs and Tenant IDs when they just want to restart. Showing technical details up front creates cognitive load.

**The fix**: Use collapsible sections (Pattern 5). Show the primary action (Yes/No to restart) by default. Hide diagnostic information behind "Advanced options."

This respects different user personas:
- **Casual users**: See clean Yes/No prompt
- **Power users**: Can expand for details
- **Support teams**: Get all diagnostic data when users screenshot the expanded card

### Pitfall 6: Missing the YesNo Entity

**The mistake**: Referencing a YesNo entity that doesn't exist.

```yaml
entity:
  kind: ClosedListEntityReference
  entityId: YourSolution.entity.YesNo  # Entity not created
```

**The problem**: The Start Over card won't work. Users click Yes/No, but the agent doesn't recognize the response.

**The fix**: Create a closed-list entity named `YesNo` with two items:
- **Item 1**: Display name "Yes", value "Yes"
- **Item 2**: Display name "No", value "No"

Then reference it in your YAML. This gives you type-safe confirmation handling.

### Pitfall 7: Not Monitoring Adoption

**The mistake**: Implementing diagnostic cards and never checking if users actually use them.

**The problem**: You've built a great feature, but you don't know if it's helping.

**The fix**: Add telemetry to track:
- How many users expand "Advanced options"
- Which troubleshooting commands get clicked
- Whether diagnostic cards reduce support tickets

Use custom events in Application Insights or track interactions through Power Platform analytics. Measure the impact, iterate on the design.

> Production patterns are only valuable if they actually get used. Monitor adoption to ensure you're solving real user problems.
{: .prompt-warning }

## The Result

![B2E Agent in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image2.png)
_B2E Agent (DEV) deployed in Teams with proper greeting and pinned in sidebar_

You've built a production-grade agent that:
- Handles reinstalls gracefully
- Manages session lifecycle automatically
- Provides self-service troubleshooting
- Reduces support burden significantly
- Gives users and support teams the tools they need

## What's Your Biggest Challenge?

I've shown you six patterns that turn edge cases into handled scenarios. Now I want to hear from you:

**What production challenge are you facing with your Copilot Studio agents?**

- Session management?
- Error handling?
- Support ticket volume?
- Something else?

Drop a comment below. Let's solve it together.

## Related Resources

### Microsoft Learn Documentation
- [System triggers (OnInactivity, OnInstallationUpdate)](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-triggers)
- [Variables and scopes](https://learn.microsoft.com/microsoft-copilot-studio/authoring-variables)
- [Adaptive Cards for Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/authoring-send-message#adaptive-cards)
- [Power Fx functions (IsBlank, Text, Now)](https://learn.microsoft.com/power-platform/power-fx/formula-reference)

### Community Resources
- [Best Practices for Deploying Copilot Studio Agents in Microsoft Teams](https://microsoft.github.io/mcscatblog/posts/copilot-studio-teams-deployment-ux/)
- [Copilot Studio Kit](https://pnp.github.io/copilot-studio-kit/) - Open-source productivity tools
