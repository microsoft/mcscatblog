---
layout: post
title: "Keep the Card, Test the Topic: Working Around Submit in Copilot Studio Evaluations"
date: 2026-08-27
categories: [copilot-studio, testing]
tags: [adaptive-cards, evals, testing, topics, power-fx, best-practices, quality-gate, generative-orchestration]
description: "Keep Adaptive Cards in Copilot Studio topics while using a reusable, text-based Card Bypass Topic to collect the same values during evaluations."
author: kaul-vineet
agent_edition: standard
image:
  path: /assets/posts/adaptive-card-evaluation-bypass/header-approved.png
  alt: Adaptive Card and evaluation bypass paths converging on the same main-topic variables
---

You've built a topic that works exactly as intended. It performs an operation, presents an [Adaptive Card](https://learn.microsoft.com/en-us/microsoft-copilot-studio/adaptive-cards-overview), and continues after the user selects **Submit**. Then you run the same scenario as a Copilot Studio evaluation, and the conversation stops at the card.

The reason is subtle but important: [`Action.Submit`](https://learn.microsoft.com/en-us/adaptive-cards/schema-explorer/action-submit) gathers the card inputs and sends an event to the client for processing. [Copilot Studio conversation test cases](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-multi-turn) are defined as sequences of user and agent messages. During evaluations, they don't click the button or generate that card-submit event.

The card may collect values that the main topic validates, sends to an API or Power Automate flow, passes to downstream agents, or uses in calculations. When an evaluation remains blocked at the card, those operations cannot run, so the evaluation cannot verify the workflow that depends on the submitted values.

## Why typing the button text doesn't work

Typing `Submit`, `OK`, or another button label sends an ordinary message activity. It doesn't send the structured payload expected by the pending Adaptive Card node. In an evaluation, this can leave the card unresolved or cause orchestration to select the main topic again.

> A text message containing the word "Submit" is not an `Action.Submit` activity.
{: .prompt-warning }

## The alternative: replace the interaction, not the workflow

The obvious workaround is to create a separate, text-only version of the topic for evaluations. That solves the card problem, but it creates a second workflow to maintain. Every change to the main topic must then be repeated in the evaluation topic, and the two paths can quietly drift apart.

A more maintainable approach is to create one reusable Card Bypass Topic and apply the same integration at every card boundary. This creates a repeatable evaluation path without duplicating the main topic or changing the workflow around each card.

## The pattern at a glance

For a main topic where Adaptive Card inputs are used by subsequent topic logic, add an evaluation bypass path immediately before the card:

- The **Adaptive Card path (`Evaluation=False`)** displays the card and waits for `Action.Submit`.
- The **evaluation bypass path (`Evaluation=True`)** calls a generic **Card Bypass Topic**, which collects the same values through text questions.

Both paths return to the same point in the existing topic and populate the same main-topic variables. Only the unsupported interaction is replaced.

![The Adaptive Card and evaluation bypass paths converging on the same main-topic variables](/assets/posts/adaptive-card-evaluation-bypass/pattern-at-a-glance-approved.png){: .shadow w="985" h="656" }
_The evaluation path uses a Data Envelope; both paths converge after the same main-topic variables are ready._

> The Card Bypass Topic doesn't make Adaptive Cards interactive inside evaluations. It provides a reusable text-based substitute for the card interaction.
{: .prompt-info }

The Adaptive Card remains unchanged for users, including cards [generated for richer interactions]({% post_url 2026-01-02-adaptive-card-generation %}) or [localized for multilingual agents]({% post_url 2026-01-08-localize-adaptive-cards %}).

## Two topics, one contract

The implementation would look like this:

| Topic | Responsibility |
|---|---|
| Calling main topic | Existing topic definition; owns the Adaptive Cards, variables, validation, and all downstream operations |
| Card Bypass Topic | Prevents evaluations from being blocked at an Adaptive Card by collecting equivalent inputs through conversation, enabling the evaluation to continue into downstream topic logic |

> **This separation is the cornerstone of the pattern:** the Card Bypass Topic doesn't know the name of the main topic, the Adaptive Card JSON, or the main topic's variables. It understands only the Data Envelope contract, which makes the same topic reusable across different cards and workflows.
{: .prompt-tip }

## Inside the Card Bypass Topic

The Card Bypass Topic receives a Data Envelope, preserves supplied values, and asks typed questions only for missing ones. It returns the completed envelope so the calling main topic can continue through its downstream checks and validations without an Adaptive Card submission.

### Meet the Data Envelope

The Data Envelope is a table with four columns:

| Column | Purpose | Example |
|---|---|---|
| `Key` | Stable identity used by the main topic | `priority` |
| `Label` | Sentence fragment inserted into the question | `the request priority (High or Low)` |
| `Type` | Selects the typed question branch | `Choice` |
| `Value` | Optional value already known to the main topic | `High` |

`Value` can contain an existing value or remain blank for the Card Bypass Topic to collect.

The Card Bypass Topic receives the Data Envelope from the calling main topic and processes one row at a time. It preserves an existing value or selects a fixed question node from `Type`, normalizes the answer to text, appends the completed row, and repeats until it can return the completed envelope.

![Card Bypass Topic processing each Data Envelope row through existing-value and typed-question paths](/assets/posts/adaptive-card-evaluation-bypass/card-bypass-topic-flow.png){: .shadow w="1536" h="1024" }
_The Card Bypass Topic carries populated values forward, asks once for missing values, and returns the completed Data Envelope._

One Question node can't dynamically change its entity type, so the Card Bypass Topic contains fixed branches for Text, Email, Date, Number, Boolean, and Choice. Choice is collected as text.

## How the main topic integrates the Card Bypass Topic

The main topic acts as an adapter between its own variables and the generic Data Envelope contract. The integration follows three steps: define the evaluation envelope, choose the interaction path, then map bypass values back before continuing.

To keep the walkthrough easy to follow, this example uses one Adaptive Card with two variables: request title and priority.

### Step 1: Define the evaluation Data Envelope

The Adaptive Card collects a request title and priority. Its output bindings store those values in two main-topic variables:

```text
Topic.requestTitle
Topic.priority
```

For the evaluation bypass, the main topic packages the current values of these variables into `Topic.RequestDetailsEnvelope`. The envelope represents the values the Adaptive Card would normally collect.

At design time, define one envelope row for each field expected by the Adaptive Card. At runtime, a **Set variable value** node inside the evaluation branch builds that envelope:

```javascript
Table(
    {
        Key: "requestTitle",
        Label: "a short title for the request",
        Type: "Text",
        Value: Topic.requestTitle
    },
    {
        Key: "priority",
        Label: "the request priority (High or Low)",
        Type: "Choice",
        Value: Topic.priority
    }
)
```

The envelope defines which fields exist, how each `Key` maps to a main-topic variable, what guidance belongs in `Label`, and which `Type` each field requires.

### Step 2: Choose the interaction path

The topic-level `Evaluation` flag determines which interaction path the main topic uses at every card boundary. Both paths return to the same point in the main topic.

![Adaptive Card and evaluation bypass paths converging on the same main-topic variables](/assets/posts/adaptive-card-evaluation-bypass/main-topic-integration-approved.png){: .shadow w="999" h="654" }
_The decision and integration nodes added around one Adaptive Card._

In the **Adaptive Card path (`Evaluation=False`)**, the main topic displays the Adaptive Card. After the user selects **Submit**, its output bindings store the submitted inputs directly in `Topic.requestTitle` and `Topic.priority`. This path does not build a Data Envelope.

In the **evaluation bypass path (`Evaluation=True`)**, the main topic has already built the input `Topic.RequestDetailsEnvelope`. The path passes that envelope to the Card Bypass Topic, which processes only the supplied envelope, collects any missing values, and returns `CompletedDataEnvelope`.

The input and output bindings deliberately use the same main-topic variable:

| Card Bypass Topic contract | Main-topic binding |
|---|---|
| `DataEnvelope` input | `Topic.RequestDetailsEnvelope` |
| `CompletedDataEnvelope` output | `Topic.RequestDetailsEnvelope` |

Before the call, `Topic.RequestDetailsEnvelope` contains the current values sent by the calling main topic. After the call, it contains one completed row for each field expected from that card.

The evaluation add-on is limited to building the Data Envelope, calling the Card Bypass Topic, and mapping the returned values. The Adaptive Card path remains unchanged.

### Step 3: Map the completed Data Envelope and continue

> **And this is the aha moment:** the evaluation does not need to reproduce `Action.Submit` at all. The Card Bypass Topic returns the values that the Adaptive Card would have populated, so both paths reach the same downstream checks and validations with the same main-topic variables.
{: .prompt-tip }

Only the evaluation bypass maps completed envelope rows back into the main-topic variables. These **Set variable value** nodes are placed after the Card Bypass Topic call inside the evaluation branch. On the Adaptive Card path, the card output bindings populate the same variables directly. Both paths then converge.

For the request title:

```javascript
LookUp(
    Topic.RequestDetailsEnvelope,
    Key = "requestTitle",
    Value
)
```

The result is assigned to:

```text
Topic.requestTitle
```

For the priority:

```javascript
LookUp(
    Topic.RequestDetailsEnvelope,
    Key = "priority",
    Value
)
```

The result is assigned to:

```text
Topic.priority
```

Each `Key` maps the returned text to its corresponding variable, where any required business-type conversion is applied. The Card Bypass Topic works only with the generic `Key`, `Label`, `Type`, and `Value` columns.

Values returned through the Data Envelope are text. Text, Email, and Choice values can be assigned directly. The downloadable sample looks up and converts Date, Number, and Boolean values in their mapping nodes:

```javascript
IfError(
    DateTimeValue(
        LookUp(Topic.ScheduleDetailsEnvelope, Key = "visitDate", Value)
    ),
    Blank()
)
```

```javascript
IfError(
    Value(
        LookUp(Topic.ScheduleDetailsEnvelope, Key = "partySize", Value)
    ),
    Blank()
)
```

```javascript
With(
    {
        consentText: LookUp(
            Topic.ContactPreferencesEnvelope,
            Key = "consent",
            Value
        )
    },
    If(
        IsBlank(consentText),
        Blank(),
        Lower(consentText) = "true"
    )
)
```

These expressions preserve blank values and prevent malformed Date or Number text from terminating the topic.

## Scale across the workflow without changing the Card Bypass Topic

> **Scaling happens entirely in the main topic. The Card Bypass Topic is reused without modification.**
{: .prompt-tip }

The downloadable Three Card Demo demonstrates this scaling pattern within one main topic; it is not a separate topic design. Each evaluation bypass gets its own Data Envelope, and every card follows the topic-level choice between the **Adaptive Card path (`Evaluation=False`)** and **evaluation bypass path (`Evaluation=True`)**.

The three-card example applies the same boundary at each original card position. After each interaction populates the main-topic variables, the topic continues through the logic already defined for that stage:

```text
Operation 1 -> Card 1 interaction -> variables ready -> existing topic logic -> continue
Operation 2 -> Card 2 interaction -> variables ready -> existing topic logic -> continue
Operation 3 -> Card 3 interaction -> variables ready -> existing topic logic -> continue
```

Each evaluation bypass uses its own business-specific envelope. Only the envelope rows change. Each row follows the same `Key`, `Label`, `Type`, and `Value` contract, so every evaluation bypass path can call the same Card Bypass Topic. It does not need the card name, workflow position, or main-topic variable names.

Adding another Adaptive Card requires another integration boundary and card-specific envelope. After mapping, evaluations can continue through that card's existing validation and workflow logic without changing the reusable Card Bypass Topic.

## Sample implementation and test

The sample includes a **Three Card Demo** main topic and the reusable **Card Bypass Topic**. Its three Adaptive Cards collect Text, Email, Date, Number, Boolean, and Choice inputs across multiple workflow stages, making it useful for testing more than a single-card happy path.

| Adaptive Card | Evaluation Data Envelope | Values demonstrated |
|---|---|---|
| Participant details | `Topic.ParticipantDetailsEnvelope` | Text and Email |
| Schedule details | `Topic.ScheduleDetailsEnvelope` | Date and Number |
| Contact preferences | `Topic.ContactPreferencesEnvelope` | Boolean and Choice |

The sample has 11 **Set variable value** nodes: one sets the demo flag, three build evaluation-only envelopes, six map returned fields, and one normalizes the Adaptive Card's Date output. The normal card path otherwise relies on direct output bindings.

### Step 1: Import the sample

| File | Purpose |
|---|---|
| [Download `card-bypass-topic.topic.yaml`]({{ '/assets/posts/adaptive-card-evaluation-bypass/downloads/card-bypass-topic.topic.yaml' | relative_url }}) | Reusable Card Bypass Topic with the Data Envelope input and output contract |
| [Download `three-card-main-topic.topic.yaml`]({{ '/assets/posts/adaptive-card-evaluation-bypass/downloads/three-card-main-topic.topic.yaml' | relative_url }}) | Main-topic example containing all six supported input types |

1. Create a blank topic named **Card Bypass Topic**.
2. Use the [topic code editor](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/topics-code-editor) to replace its generated YAML with `card-bypass-topic.topic.yaml`, then save the topic.
3. Create a blank main topic. Add a temporary **Go to another topic** node targeting **Card Bypass Topic**, then copy its generated `dialog:` value from the code editor.
4. Replace all three instances of `YOUR_SCHEMA_NAME.topic.CardBypassTopic` in `three-card-main-topic.topic.yaml` with that value.
5. Replace the blank main topic's YAML with the updated file and save it.

> The sample hardcodes `Topic.Evaluation` to `true` only for testing the evaluation bypass. Set it to `false` when testing the Adaptive Card path. In an implementation, the main topic should set `Topic.Evaluation` from a Boolean [environment variable](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables) included in the solution. Use `true` only in a dedicated evaluation environment and `false` in environments that serve users.
{: .prompt-warning }

> Always replace the sample dialog reference because schema prefixes differ between environments.
{: .prompt-warning }

### Step 2: Compare the Adaptive Card path (`Evaluation=False`)

In **Test your agent**, the main topic displays and submits the real cards before reaching the final processing:

![Normal Adaptive Card path showing submitted cards and the final success response](/assets/posts/adaptive-card-evaluation-bypass/adaptive-card-path-success.png){: .shadow w="2488" h="1474" }
_The normal path retains the Adaptive Cards and reaches the final success checkpoint after all three submissions._

The same interaction blocks an evaluation because typed responses cannot generate `Action.Submit`. Card 1 remains unresolved, and the evaluation cannot reach the rest of the main topic:

![Evaluation result showing Card 1 repeated after typed field values and Submit](/assets/posts/adaptive-card-evaluation-bypass/evaluation-submit-failure.png){: .shadow w="2176" h="1329" }
_The evaluation remains on Card 1 after both text attempts, and the result identifies that the submit action produced no change._

### Step 3: Test the evaluation bypass path (`Evaluation=True`)

This one-message test uses [generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-managing-topic-inputs-outputs) to populate topic inputs from the opening message.

> **Send all six values in one message to test the complete topic end to end:**
>
> Run the three card evaluation demo for Ada Lovelace. Her email is ada@example.com. The visit date is 2026-09-15 for 4 people. She consents to follow-up and prefers Email.
{: .prompt-tip }

> **For sequential test cases:** If a value is missing, the Card Bypass Topic asks questions in Data Envelope order. Add each expected question and user answer as one message pair. [Conversational test cases](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-multi-turn) allow 12 total messages, so prefill enough values to leave no more than five missing fields when the final response must also be evaluated.
{: .prompt-info }

In **Test your agent**, one initial utterance populates every main-topic input. The Card Bypass Topic is invoked at all three card boundaries, no Adaptive Card is displayed, and the main topic reaches `SUCCESS`:

![Evaluation bypass path skipping all three Adaptive Cards and reaching success](/assets/posts/adaptive-card-evaluation-bypass/evaluation-prefilled-success.png){: .shadow w="2482" h="1456" }
_The test window shows all three operations and field checkpoints completing without displaying an Adaptive Card._

The bypass also supports scenario variation, not just one successful path. The following evaluations keep the participant, schedule, and contact method unchanged. Only the consent value differs:

| Scenario | Card 3 checkpoint | Final downstream value |
|---|---|---|
| Consent is No | `consent=No; contact method=Email` | `Preferences: consent=No, contact=Email` |
| Consent is Yes | `consent=Yes; contact method=Email` | `Preferences: consent=Yes, contact=Email` |

![Passing evaluation where the participant does not consent to follow-up](/assets/posts/adaptive-card-evaluation-bypass/evaluation-consent-no-pass.png){: .shadow w="1911" h="943" }
_With consent set to No, the evaluation passes and the No value reaches the Card 3 checkpoint and final response._

![Passing evaluation where the participant consents to follow-up](/assets/posts/adaptive-card-evaluation-bypass/evaluation-consent-yes-pass.png){: .shadow w="1913" h="945" }
_With consent set to Yes, the evaluation passes and the Yes value reaches the same downstream checkpoints._

> Because every other supplied value remains the same, the changed output shows that the evaluation input flows through the bypass into the main-topic variable available to downstream topic logic. These results demonstrate data flow; they do not claim that this sample implements a specific downstream check or validation.
{: .prompt-info }

These scenarios can also complement delivery automation built with [Quality Gates for Copilot Studio]({% post_url 2026-04-19-copilot-studio-eval-gate-azure-devops %}).

## Implementation boundaries

- The Card Bypass Topic supports Text, Email, Date, Number, Boolean, and Choice.
- It does not inspect or dynamically interpret Adaptive Card JSON.
- The evaluation bypass performs typed collection but does not reproduce Adaptive Card-enforced checks such as required fields, ranges, or allowed choices. Implement equivalent downstream checks and validations when they must be evaluated.
- Date and Number conversions can be locale-sensitive.
- Inside the Card Bypass Topic, use `EndDialog` after successful collection; malformed envelope definitions use `CancelAllDialogs`.

## Key takeaways

- Evaluations can't produce the structured activity created by `Action.Submit`.
- Bypass each card at its existing workflow position instead of duplicating the topic.
- Make both paths converge after the same main-topic variables are ready.
- Map the completed Data Envelope into main-topic variables so evaluations can reach checks and downstream operations beyond the card.

**What other non-text interactions have made your Copilot Studio topics difficult to evaluate?**

Share the interaction, the behavior you observed, and any workaround you tried. Your feedback can help identify where this pattern should go next.
