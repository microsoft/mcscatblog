---
layout: post
title: "Keep the Card, Test the Topic: Working Around Submit in Copilot Studio Evaluations"
date: 2026-08-27
categories: [copilot-studio, testing]
tags: [adaptive-cards, evals, testing, topics, power-fx, best-practices]
description: "Keep Adaptive Cards in Copilot Studio topics while using a reusable, text-based Card Bypass Topic to collect the same values during evaluations."
author: kaul-vineet
agent_edition: standard
image:
  path: /assets/posts/adaptive-card-evaluation-bypass/header.png
  alt: Three main Copilot Studio topics sharing one Card Bypass Topic while retaining their own Adaptive Cards
---

You've built a topic that works exactly as intended. It performs an operation, presents an [Adaptive Card](https://learn.microsoft.com/en-us/microsoft-copilot-studio/adaptive-cards-overview), and continues after the user selects **Submit**. Then you run the same scenario as a Copilot Studio evaluation, and the conversation stops at the card.

The reason is subtle but important: [`Action.Submit`](https://learn.microsoft.com/en-us/adaptive-cards/schema-explorer/action-submit) gathers the card inputs and sends an event to the client for processing. As of August 2026, [Copilot Studio conversation test cases](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-multi-turn) are defined as sequences of user and agent messages. In our testing, they don't click the button or generate that card-submit event.

The card may collect values that the main topic validates, sends to an API or Power Automate flow, passes to downstream agents, or uses in calculations. When an evaluation remains blocked at the card, those operations cannot run, so the evaluation cannot verify the workflow that depends on the submitted values.

## Why typing the button text doesn't work

Typing `Submit`, `OK`, or another button label sends an ordinary message activity. It doesn't send the structured payload expected by the pending Adaptive Card node. In an evaluation, this can leave the card unresolved or cause orchestration to select the main topic again.

> A text message containing the word "Submit" is not an `Action.Submit` activity.
{: .prompt-warning }

## The alternative: replace the interaction, not the workflow

The obvious workaround is to create a separate, text-only version of the topic for evaluations. That solves the card problem, but it creates a second workflow to maintain. Every change to the main topic must then be repeated in the evaluation topic, and the two paths can quietly drift apart.

For a main topic where Adaptive Card inputs are used by subsequent topic logic, add an evaluation bypass path immediately before the card. The normal path continues to display the Adaptive Card, while the evaluation bypass path collects equivalent inputs and returns to the same point in the existing topic. The rest of the topic definition remains unchanged. At that point, the topic chooses between two input paths:

- The **Adaptive Card path (`Evaluation=False`)** displays the card and waits for `Action.Submit`.
- The **evaluation bypass path (`Evaluation=True`)** calls a generic **Card Bypass Topic**, which collects the same values through text questions.

The two interaction paths converge before the existing topic logic continues. Both populate the same main-topic variables, and only the unsupported interaction is replaced.

> The Card Bypass Topic doesn't make Adaptive Cards interactive inside evaluations. It provides a reusable text-based substitute for the card interaction.
{: .prompt-info }

The Adaptive Card remains unchanged for users, including cards [generated for richer interactions]({% post_url 2026-01-02-adaptive-card-generation %}) or [localized for multilingual agents]({% post_url 2026-01-08-localize-adaptive-cards %}).

## The pattern at a glance

![The Adaptive Card path and evaluation bypass path converging on one Data Envelope](/assets/posts/adaptive-card-evaluation-bypass/pattern-at-a-glance.png){: .shadow w="1499" h="615" }
_At each card boundary, the main topic selects an interaction path, then resumes common mapping, validation, and processing._

## Two topics, one contract

The implementation uses two topics:

| Topic | Responsibility |
|---|---|
| Calling main topic | Existing topic definition; owns the Adaptive Cards, variables, validation, and all downstream operations |
| Card Bypass Topic | Prevents evaluations from being blocked at an Adaptive Card by collecting equivalent inputs through conversation, enabling the evaluation to continue into downstream topic logic |

The Card Bypass Topic doesn't know the name of the main topic, the Adaptive Card JSON, or the main topic's variables. It understands only the Data Envelope contract.

## Meet the Data Envelope

The Data Envelope is a table with four columns:

| Column | Purpose | Example |
|---|---|---|
| `Key` | Stable identity used by the main topic | `priority` |
| `Label` | Question text and expected-value guidance | `priority (High or Low)` |
| `Type` | Selects the typed question branch | `Choice` |
| `Value` | Optional value already known to the main topic | `High` |

`Value` can contain an existing value or remain blank for the Card Bypass Topic to collect.

## Inside the Card Bypass Topic

The Card Bypass Topic receives the Data Envelope from the calling main topic and processes one row at a time. It preserves an existing value or selects a fixed question node from `Type`, normalizes the answer to text, appends the completed row, and repeats until it can return the completed envelope.

![Card Bypass Topic processing each Data Envelope row through existing-value and typed-question paths](/assets/posts/adaptive-card-evaluation-bypass/card-bypass-topic-flow.png){: .shadow w="1536" h="1024" }
_The Card Bypass Topic carries populated values forward, asks once for missing values, and returns the completed Data Envelope._

One Question node can't dynamically change its entity type, so the Card Bypass Topic contains fixed branches for Text, Email, Date, Number, Boolean, and Choice. Choice is collected as text so allowed-value checks can run after the completed envelope returns.

## How the main topic integrates the Card Bypass Topic

The main topic acts as an adapter between its own variables and the generic Data Envelope contract.

### Build the Data Envelope for the evaluation bypass path

In this example, the Adaptive Card collects a request title and priority. Its output bindings store those values in two main-topic variables:

```text
Topic.requestTitle
Topic.priority
```

When the evaluation bypass path (`Evaluation=True`) is selected, the main topic packages the current values of these variables into `Topic.RequestDetailsEnvelope` before calling the Card Bypass Topic.

A **Set variable value** node builds the envelope, with one row for each field expected by the Adaptive Card:

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

The main topic builds this envelope because it knows which fields exist, how each `Key` maps to a main-topic variable, what guidance belongs in `Label`, and which `Type` each field requires.

### Choose how the main topic completes the Data Envelope

Immediately before each Adaptive Card would appear, the main topic checks the `Evaluation` flag:

- The **Adaptive Card path (`Evaluation=False`)** presents that Adaptive Card to the user.
- The **evaluation bypass path (`Evaluation=True`)** skips that card interaction and calls the Card Bypass Topic.

The condition selects only the interaction used to collect the values for the next Adaptive Card. After that interaction, both paths return to the same point in the main topic.

![Adaptive Card and evaluation bypass paths converging on one completed Data Envelope](/assets/posts/adaptive-card-evaluation-bypass/main-topic-integration.png){: .shadow w="1460" h="976" }
_The decision and integration nodes added around one Adaptive Card._

In the **Adaptive Card path (`Evaluation=False`)**, the main topic displays the Adaptive Card. After the user selects **Submit**, the Adaptive Card node's output bindings store the submitted inputs in `Topic.requestTitle` and `Topic.priority`. The main topic then builds the completed `Topic.RequestDetailsEnvelope` from those values.

In the **evaluation bypass path (`Evaluation=True`)**, the main topic has already built the input `Topic.RequestDetailsEnvelope`. The path passes that envelope to the Card Bypass Topic, which processes only the supplied envelope, collects any missing values, and returns `CompletedDataEnvelope`.

The input and output bindings deliberately use the same main-topic variable:

| Card Bypass Topic contract | Main-topic binding |
|---|---|
| `DataEnvelope` input | `Topic.RequestDetailsEnvelope` |
| `CompletedDataEnvelope` output | `Topic.RequestDetailsEnvelope` |

Before the call, `Topic.RequestDetailsEnvelope` is the request sent by the calling main topic. After the call, it contains one completed row for each field expected from that card.

For the main topic, the add-on is limited to selecting the input path, building the Data Envelope, calling the Card Bypass Topic, and mapping the returned values. After mapping, execution resumes at the same existing nodes used after an Adaptive Card submission.

> The bypass adds a small amount of integration logic at the card boundary while preserving the workflow on either side of it.
{: .prompt-info }

### The payoff: continue the main topic without `Action.Submit`

> **And this is the aha moment:** the evaluation does not need to reproduce `Action.Submit` at all. The Card Bypass Topic returns the same Data Envelope that the main topic expects after the Adaptive Card, so the evaluation bypass path (`Evaluation=True`) skips the unsupported interaction while preserving everything that happens after it.
{: .prompt-tip }

After either interaction path, the main topic maps the completed envelope rows back into its own variables. These **Set variable value** nodes are placed after the condition, not inside either path.

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

Values cross the Data Envelope boundary as text. Text, Email, and Choice values can be assigned directly. Date, Number, and Boolean values require conversion:

```javascript
IfError(
    DateTimeValue(Topic.VisitDateText),
    Blank()
)
```

```javascript
IfError(
    Value(Topic.PartySizeText),
    Blank()
)
```

```javascript
If(
    IsBlank(Topic.ConsentText),
    Blank(),
    Lower(Topic.ConsentText) = "true"
)
```

These expressions preserve blank values and prevent malformed Date or Number text from terminating the topic.

## Scale across the workflow without changing the Card Bypass Topic

> **Scaling happens entirely in the main topic. The Card Bypass Topic is reused without modification.**
{: .prompt-tip }

A main topic can contain multiple Adaptive Cards at different points in its workflow. Each card gets its own Data Envelope and its own choice between the **Adaptive Card path (`Evaluation=False`)** and **evaluation bypass path (`Evaluation=True`)**.

The three-card example applies the same boundary at each original card position. After each interaction, the main topic maps the collected values and continues through the logic already defined for that stage:

```text
Operation 1 -> Card 1 interaction -> map inputs -> existing topic logic -> continue
Operation 2 -> Card 2 interaction -> map inputs -> existing topic logic -> continue
Operation 3 -> Card 3 interaction -> map inputs -> existing topic logic -> continue
```

Each interaction uses a business-specific envelope:

| Adaptive Card | Data Envelope | Values demonstrated |
|---|---|---|
| Participant details | `Topic.ParticipantDetailsEnvelope` | Text and Email |
| Schedule details | `Topic.ScheduleDetailsEnvelope` | Date and Number |
| Contact preferences | `Topic.ContactPreferencesEnvelope` | Boolean and Choice |

Only the envelope rows change. Each row follows the same `Key`, `Label`, `Type`, and `Value` contract, so every evaluation bypass path can call the same Card Bypass Topic. It does not need the card name, workflow position, or main-topic variable names.

Adding another Adaptive Card requires another integration boundary and card-specific envelope. After mapping, evaluations can continue through that card's existing validation and workflow logic without changing the reusable Card Bypass Topic.

## Sample implementation and test

The sample includes a **Three Card Demo** main topic and the reusable **Card Bypass Topic**. Its three Adaptive Cards collect Text, Email, Date, Number, Boolean, and Choice inputs across multiple workflow stages, making it useful for testing more than a single-card happy path.

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

The sample sets `Topic.Evaluation` to `true`. Set it to `false` when testing the Adaptive Card path.

> Always replace the sample dialog reference because schema prefixes differ between environments.
{: .prompt-warning }

### Step 2: Test the Adaptive Card path (`Evaluation=False`)

In **Test your agent**, the main topic displays and submits the real cards before reaching the final processing:

![Normal Adaptive Card path showing submitted cards and the final success response](/assets/posts/adaptive-card-evaluation-bypass/adaptive-card-path-success.png){: .shadow w="2488" h="1474" }
_The normal path retains the Adaptive Cards and reaches the final success checkpoint after all three submissions._

The same interaction blocks an evaluation because typed responses cannot generate `Action.Submit`. Card 1 remains unresolved, and the evaluation cannot reach the rest of the main topic:

![Evaluation result showing Card 1 repeated after typed field values and Submit](/assets/posts/adaptive-card-evaluation-bypass/evaluation-submit-failure.png){: .shadow w="2176" h="1329" }
_The evaluation remains on Card 1 after both text attempts, and the result identifies that the submit action produced no change._

### Step 3: Test the evaluation bypass path (`Evaluation=True`)

> **Send all six values in one message to test the complete topic end to end:**
>
> Run the three card evaluation demo for Ada Lovelace. Her email is ada@example.com. The visit date is 2026-09-15 for 4 people. She consents to follow-up and prefers Email.
{: .prompt-tip }

In **Test your agent**, one initial utterance populates every main-topic input. The Card Bypass Topic is invoked at all three card boundaries, no Adaptive Card is displayed, and the main topic reaches `SUCCESS`:

![Evaluation bypass path skipping all three Adaptive Cards and reaching success](/assets/posts/adaptive-card-evaluation-bypass/evaluation-prefilled-success.png){: .shadow w="2482" h="1456" }
_The test window shows all three operations and field checkpoints completing without displaying an Adaptive Card._

The formal evaluation follows the same bypass path and passes after the main topic reaches its final response:

![Passing evaluation with all six values supplied in the initial utterance](/assets/posts/adaptive-card-evaluation-bypass/evaluation-prefilled-pass.png){: .shadow w="2162" h="1329" }
_The evaluation passes after all three staged operations, with both the Three Card Demo and Card Bypass Topic recorded in the result._

These scenarios can also complement delivery automation built with [Quality Gates for Copilot Studio]({% post_url 2026-04-19-copilot-studio-eval-gate-azure-devops %}).

## Implementation boundaries

- Use an environment variable to control evaluation mode, and ensure normal conversations resolve to `Evaluation=False`.
- The Card Bypass Topic supports Text, Email, Date, Number, Boolean, and Choice.
- It does not inspect or dynamically interpret Adaptive Card JSON.
- Date and Number conversions can be locale-sensitive.
- Use `EndDialog` to return control to the calling main topic.

## Key takeaways

- Evaluations can't produce the structured activity created by `Action.Submit`.
- Bypass each card at its existing workflow position instead of duplicating the topic.
- Make the Adaptive Card path and evaluation bypass path converge on one Data Envelope contract.
- Use the completed Data Envelope to evaluate checks and downstream operations beyond the card.

**What other non-text interactions have made your Copilot Studio topics difficult to evaluate?**

Share the interaction, the behavior you observed, and any workaround you tried. Your feedback can help identify where this pattern should go next.
