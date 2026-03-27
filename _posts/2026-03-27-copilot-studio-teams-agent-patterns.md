---
layout: post
title: "Copilot Studio Teams Agent Patterns That Actually Work"
date: 2026-03-27
categories: [copilot-studio, teams]
tags: [teams, microsoft-365-copilot, conversation-management, troubleshooting]
description: Six production patterns for deploying Copilot Studio agents to Teams and M365 Copilot - handling reinstalls, context management, and self-service troubleshooting with diagnostic cards.
author: henryjammes
---

So you've built a Copilot Studio agent. Published it to Teams. Users start asking why the chat is empty after reinstalling. Why the agent uses context from three weeks ago. Why errors say "Something went wrong" with no way to fix it.

Welcome to production. Here's how to fix it.

## Jump to Pattern

- [Handling re-installs and Conversation Start](#handling-re-installs-and-conversation-start)
- [Clearing conversation history after inactivity](#clearing-conversation-history-after-inactivity)
- [Letting the user know after inactivity](#letting-the-user-know-a-new-conversation-is-starting-after-inactivity)
- [Setting global context variables](#setting-global-context-variables)
- [Update the Reset Conversation topic](#update-the-reset-conversation-topic-to-clear-history-session-variables-and-redirect-to-conversation-start)
- [Update the Start Over topic](#update-the-start-over-topic-to-offer-more-troubleshooting-options)
- [Configure suggested prompts](#configure-suggested-prompts)

---

## Handling re-installs and Conversation Start

Users reinstall Teams apps all the time. When they do, they're greeted with an empty chat screen because **Conversation Start** doesn't trigger on reinstalls.

The fix: redirect to **Conversation Start** when the agent detects an installation update event.

![OnInstallationUpdate trigger](/assets/posts/copilot-studio-teams-agent-patterns/image1.png)

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
      dialog: cat_B2EAgent.topic.ConversationStart
```

---

## Clearing conversation history after inactivity

Agent conversations in Teams persist. Users return after a week and the agent still has old context.

Set an inactivity trigger (in seconds) to end topics and clear history and variables after silence.

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnInactivity
  id: main
  condition: =System.Activity.ChannelId = "msteams"
  durationInSeconds: 43200
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
inputType: {}
outputType: {}
```

Once variables and history are cleared, set `Global.InactiveConversation` to handle follow-up smoothly.

---

## Letting the user know a new conversation is starting after inactivity

When users ask a follow-up after inactivity, they need to know context was reset.

Use a basic card to notify them. The "Start over" button stays persistent.

![Session expired notification](/assets/posts/copilot-studio-teams-agent-patterns/image7.png)

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
            text: ℹ️ Just so you know – Your previous session ended due to inactivity. Your query is now being treated as a new conversation. If you want to start fresh, you can restart at any time.
            buttons:
              - kind: MessageBack
                title: Start over
                text: Start over
inputType: {}
outputType: {}
```

---

## Setting global context variables

Context variables (like user language or country) are typically set in **Conversation Start**. But that doesn't cover all scenarios:

- Microsoft 365 Copilot doesn't trigger **Conversation Start**
- Variables get cleared after "Start Over" or inactivity

Better approach: trigger a topic when context values are unknown. This ensures variables are set on the user's first message, regardless of channel.

![Context variables trigger](/assets/posts/copilot-studio-teams-agent-patterns/image8.png)

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
inputType: {}
outputType: {}
```

You can also update the agent instructions so the absence of values triggers the topic:

```markdown
**Context**
The current user country is: "{Global.UserContext.Country}", and language is "{Global.UserContext.Language}".

If you don't know the user country (e.g., ""), use this tool to get the current values: {System.Bot.Components.Topics.'cat_B2EAgent.topic.SetContextVariables'.DisplayName}.
```

If you want these values set during **Conversation Start** too, redirect to the context variables topic:

![Conversation Start redirecting to context variables](/assets/posts/copilot-studio-teams-agent-patterns/image10.png)

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnConversationStart
  id: main
  actions:
    - kind: BeginDialog
      id: TzNx
      dialog: cat_B2EAgent.topic.SetContextVariables
    - kind: SendActivity
      id: sendMessage_MLuhV
      activity:
        text:
          - Hello, I'm {System.Bot.Name}. How can I help?
        speak:
          - Hello and thank you for calling {System.Bot.Name}. Please note that some responses are generated by AI and may require verification for accuracy. How may I help you today?
```

---

## Update the Reset Conversation topic to clear history, session variables, and redirect to Conversation Start

The **Reset Conversation** topic is called by **Start Over**. By default, it doesn't clear history or redirect to **Conversation Start**.

![Reset Conversation topic](/assets/posts/copilot-studio-teams-agent-patterns/image11.png)

![Reset Conversation actions](/assets/posts/copilot-studio-teams-agent-patterns/image12.png)

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
      dialog: cat_B2EAgent.topic.ConversationStart
    - kind: CancelAllDialogs
      id: cancelAllDialogs_12Gt21
```

---

## Update the Start Over topic to offer more troubleshooting options

The default **Start Over** topic is basic. Let's turn it into a troubleshooting powerhouse.

The updated version:
- Confirms with an adaptive card (no accidental resets)
- Offers advanced troubleshooting options (clear state, clear history, conversation ID)
- Displays diagnostic info (environment ID, agent ID, tenant ID, conversation ID, etc.)

Users get self-service tools. Admins get diagnostic data without setting up logging.

![Start Over confirmation](/assets/posts/copilot-studio-teams-agent-patterns/image13.png)
*Start Over confirmation card with expandable advanced options*

![Start Over expanded](/assets/posts/copilot-studio-teams-agent-patterns/image18.png)
*Advanced options expanded showing troubleshooting actions and diagnostic information*

Since we're not using the default 'Boolean' option (we want adaptive card buttons instead of "Yes/No" quick replies), set up a comparable closed list entity for Yes/No in the question node.

![YesNo entity](/assets/posts/copilot-studio-teams-agent-patterns/image17.png)
*YesNo closed list entity for confirmation*

Then fix the condition branches to use that entity.

<details markdown="1">
<summary><strong>View complete YAML for Start Over topic</strong></summary>

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnRecognizedIntent
  id: main
  intent:
    displayName: Start Over
    includeInOnSelectIntent: false
    triggerQueries:
      - let's begin again
      - start over
      - start again
      - restart
  actions:
    - kind: Question
      id: i47Svk
      interruptionPolicy:
        allowInterruption: false
      repeatCount: 0
      alwaysPrompt: true
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
                    isSubtle: true,
                    spacing: "Small"
                  },
                  {
                    type: "ActionSet",
                    spacing: "Medium",
                    actions: [
                      { type: "Action.Submit", title: "Yes", data: "Yes" },
                      { type: "Action.Submit", title: "No", data: "No" }
                    ]
                  },
                  {
                    type: "Container",
                    spacing: "Small",
                    style: "emphasis",
                    bleed: true,
                    items: [
                      {
                        type: "TextBlock",
                        text: "Advanced options",
                        size: "Small",
                        weight: "Bolder",
                        wrap: true
                      }
                    ],
                    selectAction: {
                      type: "Action.ToggleVisibility",
                      targetElements: ["advancedOptions"]
                    }
                  },
                  {
                    type: "Container",
                    id: "advancedOptions",
                    isVisible: false,
                    spacing: "Small",
                    items: [
                      {
                        type: "TextBlock",
                        text: "Troubleshooting actions",
                        size: "Small",
                        weight: "Bolder",
                        spacing: "Small"
                      },
                      {
                        type: "ActionSet",
                        spacing: "Small",
                        actions: [
                          { type: "Action.Submit", title: "Clear state", data: "/debug clearstate" },
                          { type: "Action.Submit", title: "Clear history", data: "/debug clearhistory" },
                          { type: "Action.Submit", title: "Conversation ID", data: "/debug conversationid" }
                        ]
                      },
                      {
                        type: "TextBlock",
                        text: "Troubleshooting information",
                        weight: "Bolder",
                        size: "Small",
                        spacing: "Small",
                        separator: true
                      },
                      {
                        type: "TextBlock",
                        text: "Environment details",
                        weight: "Bolder",
                        size: "Small",
                        spacing: "Small"
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Environment ID", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Bot.EnvironmentId), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Tenant ID", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Bot.TenantId), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "TextBlock",
                        text: "Agent details",
                        weight: "Bolder",
                        size: "Small",
                        spacing: "Small",
                        separator: true
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Name", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Bot.Name), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Agent ID", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Bot.Id), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Schema name", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Bot.SchemaName), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "TextBlock",
                        text: "User details",
                        weight: "Bolder",
                        size: "Small",
                        spacing: "Small",
                        separator: true
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Language", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.User.Language), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Object ID", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.User.Id), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "TextBlock",
                        text: "Conversation details",
                        weight: "Bolder",
                        size: "Small",
                        spacing: "Small",
                        separator: true
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Channel", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Activity.ChannelId), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Conversation ID", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Conversation.Id), size: "Small", wrap: true, spacing: "None", isSubtle: true }
                            ]
                          }
                        ]
                      },
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "90px",
                            items: [
                              { type: "TextBlock", text: "Time (UTC)", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              {
                                type: "TextBlock",
                                text: Text(Now(), DateTimeFormat.UTC),
                                size: "Small",
                                wrap: true,
                                spacing: "None",
                                isSubtle: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
      defaultValue: =Blank()
      entity:
        kind: ClosedListEntityReference
        entityId: cat_B2EAgent.entity.YesNo
    - kind: ConditionGroup
      id: conditionGroup_lvx2zV
      conditions:
        - id: conditionItem_sVQtHa
          condition: =Topic.Confirm = 'cat_B2EAgent.entity.YesNo'.Wspx0O
          actions:
            - kind: BeginDialog
              id: 0YKYsy
              dialog: cat_B2EAgent.topic.ResetConversation
        - id: conditionItem_drBn6v
          condition: =Topic.Confirm = 'cat_B2EAgent.entity.YesNo'.PlYKYb
          actions:
            - kind: SendActivity
              id: 5iVukz
              activity: Ok. Let's carry on.
      elseActions:
        - kind: RecognizeIntent
          id: AcwpXt
          userInput: =System.Activity.Text
```

</details>

Users can expand **Advanced options** to get more commands for self-troubleshooting and diagnostic data to share with admins.

You can also apply this same pattern to the **On Error** topic for user-friendly error handling.

---

## Configure suggested prompts

Suggested prompts configured at the agent level work in both Teams and Microsoft 365 Copilot.

![Suggested prompts configuration](/assets/posts/copilot-studio-teams-agent-patterns/image19.png)
*Configuring suggested prompts in Copilot Studio*

![Suggested prompts in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image20.png)
*Suggested prompts visible in Teams*

Configure in **Settings → Generative AI → Suggested prompts**.

---

## The result

![B2E Agent deployed in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image2.png)
*B2E Agent (DEV) deployed and pinned in Teams sidebar*

You now have production-ready patterns for:
- Handling reinstalls gracefully
- Managing session lifecycle automatically
- Providing self-service troubleshooting
- Reducing support burden

For deployment strategies (DEV/TEST/PROD environments, auto-install, and pinning), see Part 2 of this series.

## Related Resources

- [Best Practices for Deploying Copilot Studio Agents in Microsoft Teams](https://microsoft.github.io/mcscatblog/posts/copilot-studio-teams-deployment-ux/)
- [System triggers](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-triggers)
- [Variables and scopes](https://learn.microsoft.com/microsoft-copilot-studio/authoring-variables)
- [Adaptive Cards for Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/authoring-send-message#adaptive-cards)
- [Power Fx functions](https://learn.microsoft.com/power-platform/power-fx/formula-reference)
