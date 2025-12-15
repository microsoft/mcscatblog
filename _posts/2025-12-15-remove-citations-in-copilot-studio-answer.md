---
layout: post
title: "Kill the [1]: How to Remove Citations from Copilot Studio Answers"
date: 2025-12-15
categories: [copilot-studio, generative-ai]
tags: [knowledge, citations, formatting, power-fx, pro-code]
description: When citations get in the way of the experience, here is how to remove them from Copilot Studio answers.
author: henryjammes
image:
  path: /assets/posts/kill-the-citation/header.png
  alt: "A smart tabby cat wearing round glasses and a tweed suit sitting at a desk, using a glowing tool to zap bracketed citation numbers like [1] and [2] off a holographic text display, leaving the answer clean."
  no_bg: true
---

Citations are valuable for transparency and trust, allowing users to verify information and explore sources. In many channels, they display cleanly and enhance the user experience.

However, there are scenarios where you might want to hide them. For example, when knowledge sources are internal files uploaded directly to the agent, or when users don't have access to the source documents, citations can create confusion or clutter the interface. 

## When should you hide citations?

There are specific use cases where hiding citations improves the user experience:
1.  **Uploaded File Citations:** When files are uploaded directly as knowledge sources to the agent, citations display as raw indexed chunks of the source data rather than clean links. This creates a wall of text that clutters the interface and reduces readability.
2.  **Access Restrictions:** Users may not have permissions to access the source documents directly, making citation links unusable.

If these scenarios apply to your use case, this guide will show you how to remove citations from your agent's responses using YAML configuration.

Depending on how your agent is set up, there are two ways to do this.

---

## Scenario 1: You use Generative Orchestration (The Default)

If you are using the modern **Generative** orchestration mode, the agent decides when to trigger the answer. You can intercept the response before it reaches the user.

### The Fix

1.  Create a **new Topic** from blank.
2.  Click the **... More** (three dots) on the top right of the canvas.
3.  Select **Open code editor**.
4.  **Delete everything** currently in there and paste the following YAML magic:

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnGeneratedResponse
  id: main
  actions:
    - kind: SetVariable
      id: setVariable_IndFsH
      variable: System.ContinueResponse
      value: =false

    - kind: SetVariable
      id: setVariable_InhmTQ
      variable: Topic.answerNoCitations
      value: |-
        =Trim(
            With(
                { 
                    // 1. Cut off the text at the start of the citation block "[1]:"
                    // If no citations exist, this keeps the whole text.
                    CleanedFooter: First(Split(System.Response.FormattedText, "[1]:")).Value 
                },
                // 2. Remove inline markers [1] through [6]
                Substitute(
                    Substitute(
                        Substitute(
                            Substitute(
                                Substitute(
                                    Substitute(
                                        CleanedFooter,
                                        "[1]", ""
                                    ),
                                    "[2]", ""
                                ),
                                "[3]", ""
                            ),
                            "[4]", ""
                        ),
                        "[5]", ""
                    ),
                    "[6]", ""
                )
            )
        )

    - kind: SendActivity
      id: sendActivity_9USOB6
      activity: |
        {Topic.answerNoCitations}
```

### What is actually happening here?

We are using the `OnGeneratedResponse` event. This is a special trigger that fires after the orchestrator has generated an answer, but before it is shown to the user.

**System.ContinueResponse = false**: This is the "Stop the Presses!" command. It tells Copilot Studio not to send the message it just generated.

**The Power Fx Processing**: The original text (`System.Response.FormattedText`) is processed through Power Fx functions:

- **Removing the footer**: `Split(..., "[1]:")` locates the citation block at the end of the message and removes it.
- **Removing inline markers**: A series of `Substitute` calls remove inline citation markers `[1]`, `[2]`, etc. (This example handles up to 6 citations).

**SendActivity**: The cleaned text is sent to the user.

---

## Scenario 2: You use "Classic" or Explicit Topics

If you are using the **Conversational Boosting** system topic or a manual **Create generative answers** node, you need to handle the output directly in the node rather than using the `OnGeneratedResponse` event.

### The Fix

Go to your **Conversational Boosting** topic, open the **Code editor**, and look at this pattern. You essentially want to replace the standard flow with this logic:

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnUnknownIntent
  id: main
  priority: -1
  actions:
    - kind: SearchAndSummarizeContent
      id: search-content
      autoSend: false
      variable: Topic.Answer
      userInput: =System.Activity.Text
      responseCaptureType: FullResponse

    - kind: ConditionGroup
      id: has-answer-conditions
      conditions:
        - id: has-answer
          condition: =!IsBlank(Topic.Answer)
          actions:
            - kind: SetVariable
              id: setVariable_BPFogc
              variable: Topic.answerNoCitations
              value: |-
                =Trim(
                    Substitute(
                        Substitute(
                            Substitute(
                                Substitute(
                                    Substitute(
                                        Substitute(
                                            Topic.Answer.Text.Content,
                                            "[1]", ""
                                        ),
                                        "[2]", ""
                                    ),
                                    "[3]", ""
                                ),
                                "[4]", ""
                            ),
                            "[5]", ""
                        ),
                        "[6]", ""
                    )
                )

            - kind: SendActivity
              id: sendActivity_bqHVcB
              activity: "{Topic.answerNoCitations}"

            - kind: EndDialog
              id: end-topic
              clearTopicQueue: true
```

### Implementation details

In this approach, you modify the **Create generative answers** node (which appears in YAML as `SearchAndSummarizeContent`).

**autoSend: false**: Prevents the node from automatically sending the response, allowing you to process it first.

**responseCaptureType: FullResponse**: Captures the complete response object so you can access and manipulate the text content.

**Citation Removal**: The same Power Fx substitution pattern is applied to `Topic.Answer.Text.Content`.

**Send & End**: The cleaned text is sent, and the dialog ends explicitly.

---

## Summary

This guide demonstrates how to remove citations from Copilot Studio responses when they don't serve your use case. Choose the approach that matches your orchestration mode, and customize the Power Fx expressions to handle the number of citations you typically encounter.

Remember that citations provide transparency and trust in many scenarios, so consider your specific requirements before removing them.