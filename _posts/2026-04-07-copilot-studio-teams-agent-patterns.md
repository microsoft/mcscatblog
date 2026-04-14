---
layout: post
title: "Design Copilot Studio Agents for Teams (Because Test Chat Was Too Easy)"
date: 2026-04-07
categories: [copilot-studio, teams]
tags: [teams, microsoft-365-copilot, conversation-management, troubleshooting, adaptive-cards]
description: Eight production patterns for designing Copilot Studio agents that work well in Teams and Microsoft 365 Copilot - handling reinstalls, context management, error handling, and self-service troubleshooting with diagnostic cards.
author: henryjammes
image:
  path: /assets/posts/copilot-studio-teams-agent-patterns/header.png
  alt: "Test chat environment vs Teams deployment chaos"
---

Your agent works great in the test chat. Ship it to Teams and suddenly users are confused why their chat is empty after reinstalling the app, why the agent remembers context from last month, and why errors just say "Something went wrong" with zero hints on what to do next.

Welcome to production, where everything that worked perfectly in your controlled environment meets the chaos of real user behavior.

This guide builds on Remi Dyon's [best practices for deploying agents in Teams]({% post_url 2025-11-11-copilot-studio-teams-deployment-ux %}), making them more practical with ready-to-import YAML and taking a few patterns further. Eight patterns for handling the real-world mess: users who reinstall apps weekly, conversations that persist for months, context that goes stale, and errors that need to be debugged without a Ph.D. in distributed systems.

> Want to skip the copy-paste? [Download the finished solution file]({{ site.baseurl }}/assets/posts/copilot-studio-teams-agent-patterns/B2EAgent_1_0_0_0.zip) and import it directly into Copilot Studio. If you need a walkthrough, check the [import/export docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-solutions-import-export#import-the-solution-with-your-agent).
{: .prompt-tip }

![Copilot Studio Agent optimized for Microsoft](/assets/posts/copilot-studio-teams-agent-patterns/mcs_teams_agent.gif)

## Jump to any pattern

- [Handling re-installs and Conversation Start](#handling-re-installs-and-conversation-start)
- [Clearing conversation history after inactivity](#clearing-conversation-history-after-a-period-of-inactivity)
- [Letting the user know after inactivity](#letting-the-user-know-a-new-conversation-is-starting-after-inactivity)
- [Setting global context variables](#setting-global-context-variables)
- [Update the Reset Conversation topic](#update-the-reset-conversation-topic-to-clear-history-session-variables-and-redirect-to-conversation-start)
- [Update the Start Over topic](#update-the-start-over-topic-to-offer-more-troubleshooting-options)
- [Updating the On Error topic](#updating-the-on-error-topic-for-self-serve-troubleshooting)
- [Configure suggested prompts](#configure-suggested-prompts)

---

## Handling re-installs and Conversation Start

Users reinstall Teams apps more often than expected. IT rolls out updates, caches get cleared, or users reinstall to resolve issues. When that happens, they often land on an empty chat screen because [Conversation Start](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-triggers#conversation-start) doesn't trigger on reinstalls.

The fix: redirect to **Conversation Start** when the agent detects an [installation update event](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-triggers#installation-update).

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

> `startBehavior: UseLatestPublishedContentAndCancelOtherTopics` forces the agent to use the latest published version immediately, canceling any in-progress topics. Without it, Copilot Studio preserves existing sessions after publishing — the agent only picks up the new version once the dialog stack is empty. Since Teams conversations persist longer than other channels, users are more likely to be stuck on an older version. You'll see this property on several topics throughout this post.
{: .prompt-info }

---

## Clearing conversation history after a period of inactivity

Agent conversations in Teams are persistent. Users return after a week and the agent still has old context from Tuesday's budget report question, except now they need help with something completely different. The agent's working with stale information, and users have no idea why it's confused.

Set an [inactivity trigger](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-triggers#inactivity) (in seconds) to end topics and clear [history and variables](https://learn.microsoft.com/microsoft-copilot-studio/authoring-variables) after silence. Once you've cleared everything, set a flag (`Global.InactiveConversation`) to handle follow-up smoothly.

<details markdown="1">
<summary>Full YAML — click to expand</summary>

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

</details>

Note: `durationInSeconds: 43200` is 12 hours. Adjust based on your use case.

> Clearing conversation history periodically also helps reduce token limit errors, since long-running conversations accumulate tokens over time.
{: .prompt-tip }

---

## Letting the user know a new conversation is starting after inactivity

When users ask a follow-up after context was cleared, they need to know. Otherwise they'll be confused when the agent doesn't remember what they were talking about.

Use a [Basic Card](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-send-message#add-a-basic-cards) to notify them. The "Start over" button stays persistent so users can trigger a fresh start anytime.

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

Context variables (user language, country, department, etc.) are typically set in **Conversation Start**. But that doesn't cover all scenarios:

- **Microsoft 365 Copilot doesn't trigger Conversation Start**
- **Variables get cleared after "Start Over", or even inactivity, in our previous pattern**

Better approach: trigger a topic when context values are unknown. This ensures variables are set on the user's first message, regardless of channel, and can be re-established after any reset.

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

If you'd like these values to also be set during the Conversation Start topic, simply redirect to that topic:

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

Users may choose to start over at any time using the **Start Over** topic, which redirects to the [Reset Conversation system topic](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics#reset-conversation). By default, it doesn't clear conversation history or redirect to **Conversation Start**. Let's fix that.

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

The default [Start Over system topic](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics#start-over) asks "Do you want to start over?" and that's it. Let's make it useful.

Update it with a confirmation dialog that offers troubleshooting options using an [Adaptive Card](https://learn.microsoft.com/microsoft-copilot-studio/authoring-send-message#adaptive-cards):

- Confirms with an adaptive card (no accidental resets)
- Offers advanced troubleshooting options (clear state, clear history, conversation ID)
- Displays diagnostic info (environment ID, agent ID, tenant ID, conversation ID, timestamp)

![Start Over confirmation](/assets/posts/copilot-studio-teams-agent-patterns/image13.png)

![Start Over Adaptive Card in Studio](/assets/posts/copilot-studio-teams-agent-patterns/image15.png)

Since we're not using the default 'Boolean' option (we want Adaptive Card action buttons instead of "Yes/No" quick replies), set up a closed list entity for Yes/No in the question node.

![YesNo entity](/assets/posts/copilot-studio-teams-agent-patterns/image17.png)

Then fix the condition branches to use that entity.

![Start Over expanded](/assets/posts/copilot-studio-teams-agent-patterns/image18.png)

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

Users can expand **Advanced options** to get troubleshooting commands and diagnostic data to share with admins.

---

## Updating the On Error topic for self-serve troubleshooting

The [On Error system topic](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics#error) can be updated to offer a more user-friendly experience when unexpected errors occur, with troubleshooting commands and diagnostic data to share with admins.

<details markdown="1">
<summary><strong>View complete YAML for On Error topic</strong></summary>

```yaml
kind: AdaptiveDialog
startBehavior: UseLatestPublishedContentAndCancelOtherTopics
beginDialog:
  kind: OnError
  id: main
  actions:
    - kind: SendActivity
      id: sendActivity_idc9Fl
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
                    text: "⚠️ Something went wrong",
                    wrap: true,
                    weight: "Bolder",
                    size: "Medium"
                  },
                  {
                    type: "TextBlock",
                    text: "We couldn't complete your request. You can review the details below or use the advanced troubleshooting options if needed.",
                    wrap: true,
                    isSubtle: true,
                    spacing: "Small"
                  },
                  {
                    type: "Container",
                    spacing: "Medium",
                    style: "attention",
                    bleed: true,
                    items: [
                      {
                        type: "ColumnSet",
                        spacing: "None",
                        columns: [
                          {
                            type: "Column",
                            width: "110px",
                            items: [
                              { type: "TextBlock", text: "Error message", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Error.Message), size: "Small", wrap: true, spacing: "None", isSubtle: true }
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
                            width: "110px",
                            items: [
                              { type: "TextBlock", text: "Error code", weight: "Bolder", size: "Small", wrap: true, spacing: "None" }
                            ]
                          },
                          {
                            type: "Column",
                            width: "stretch",
                            items: [
                              { type: "TextBlock", text: Text(System.Error.Code), size: "Small", wrap: true, spacing: "None", isSubtle: true }
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
                            width: "110px",
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
                            width: "110px",
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
                          { type: "Action.Submit", title: "Start over", data: "Start over" },
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
    - kind: LogCustomTelemetryEvent
      id: 9KwEAn
      eventName: OnErrorLog
      properties: "={ErrorMessage: System.Error.Message, ErrorCode: System.Error.Code, TimeUTC: Text(Now(), DateTimeFormat.UTC), ConversationId: System.Conversation.Id}"
    - kind: CancelAllDialogs
      id: NW7NyY
```

</details>

![On Error topic actions](/assets/posts/copilot-studio-teams-agent-patterns/image19.png)

![On Error card in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image20.png)

Expanding **Advanced options** offers troubleshooting commands and diagnostic details for admins to investigate.

![On Error advanced options expanded](/assets/posts/copilot-studio-teams-agent-patterns/image21.png)

---

## Configure suggested prompts

[Suggested prompts](https://learn.microsoft.com/microsoft-copilot-studio/nlu-boost-conversations#configure-suggested-prompts) configured at the agent level work in both Teams and Microsoft 365 Copilot.

![Suggested prompts configuration](/assets/posts/copilot-studio-teams-agent-patterns/image22.png)

![Suggested prompts in Teams](/assets/posts/copilot-studio-teams-agent-patterns/image23.png)

Configure in **Settings → Generative AI → Suggested prompts** for consistent discoverability across channels.

---

## The result

You now have eight production patterns covering:
- Reinstalls that don't leave users stranded
- Stale context that gets cleared automatically
- Users who know when context resets
- Context variables that work everywhere (including M365 Copilot)
- "Start Over" that actually resets everything
- Self-service troubleshooting with diagnostic info
- Error handling that gives users tools instead of dead ends
- Suggested prompts that guide users from the start

These patterns handle the chaos of real production deployments where users do unexpected things and conversations persist longer than anyone planned.

Once your agent is ready, check out [From DEV to PROD: Auto-Install and Pinning for Copilot Studio Agents]({% post_url 2026-04-07-copilot-studio-teams-deployment %}) for environment-based deployment strategies, manifest customization, and auto-install with pinning via Setup Policies.

Speaking of diagnostic info: the conversation IDs surfaced in Pattern 6 and Pattern 7 are exactly what support teams need. [How to Get Your Conversation ID When Chatting with Agents]({% post_url 2026-01-24-conversationid-users %}) walks end-users through retrieving that ID from any channel, so you can pair the diagnostic card with a self-service guide. For deeper investigation, [Open the Hood: What Your Copilot Studio Agent Is Really Doing]({% post_url 2026-03-19-open-the-hood-copilot-studio-transcripts %}) covers reading conversation transcripts directly from Dataverse — the next step once you have the conversation ID in hand.

## Related Resources

- [System triggers](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-triggers)
- [System topics](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics)
- [Variables and scopes](https://learn.microsoft.com/microsoft-copilot-studio/authoring-variables)
- [Adaptive Cards for Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/authoring-send-message#adaptive-cards)
- [Power Fx functions](https://learn.microsoft.com/power-platform/power-fx/formula-reference)