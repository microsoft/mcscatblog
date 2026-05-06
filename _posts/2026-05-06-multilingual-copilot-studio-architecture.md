---
layout: post
title: "Architecting Runtime Multilingual Agents in Copilot Studio"
date: 2026-05-06 09:00:00 +0100
categories: [copilot-studio, architecture]
tags: [multilingual, power-fx, adaptive-cards, orchestration, enterprise, system-topics]
description: "A scalable architecture for building Copilot Studio agents that support eight languages from one topic, one prompt, zero duplication - using Global.UserLanguage as the single source of truth."
author: emargot
---

For enterprise developers, the out-of-the-box translation capabilities of LLMs are often insufficient for production-grade agents. Generative AI can translate on the fly, but enterprises need deterministic control over terminology, legal disclaimers, and brand voice across locales.

The challenge is avoiding the maintenance nightmare: duplicating every topic for every language. With 10 topics and 4 languages, you do not want 40 topics to maintain.

This post outlines a scalable architecture for runtime language switching, hardened on a production deployment for a global industrial client (English, French, Portuguese-BR, Czech). The same pattern is shown extended to **eight languages** in a public demo agent: English, French, Portuguese (BR), Czech, Spanish, Dutch, German, Italian. One agent, one topic per intent, one GPT prompt - no duplication.

> **Built-in vs. custom multilingual.** Copilot Studio has a [primary + secondary language feature](https://learn.microsoft.com/microsoft-copilot-studio/multilingual) with a Translation portal. If your only need is translating message strings, use it. The pattern in this post applies when you need *different business logic per region* (different regulations, different backend APIs, different compliance flows), not just translated text. The two approaches can coexist: native translation for static content, custom routing for region-specific logic.
{: .prompt-info }

## 1. Establishing the Single Source of Truth

The foundation of a multilingual bot is a single [global variable](https://learn.microsoft.com/microsoft-copilot-studio/authoring-variables-bot) that dictates the agent's behavior for the duration of the session: `Global.UserLanguage`.

Copilot Studio exposes `System.User.Language` as a read-only system variable populated from channel context. When you need explicit user choice (the recommended path), store it in a custom global named `Global.UserLanguage` - custom globals use a single identifier after the prefix, no dots.

### Language detection strategies

You have three primary options for initializing this variable at the start of a session:

1. **User profile (Office 365 locale).** Fast, but often inaccurate. Users may be logged into a US tenant but prefer French.
2. **URL parameters.** Excellent for embedded web chats where the parent page already knows the locale.
3. **Explicit selection (recommended).** An Adaptive Card at the start of the conversation.

**Why explicit selection?** In enterprise environments, reliability beats magic. An explicit choice ensures the user is comfortable with the language and provides a clear trigger to set the variable. In Microsoft Teams specifically, the browser `Accept-Language` header is frequently overridden by the tenant locale setting - so a French user on a US-based tenant gets English. Do not rely on it.

Initialize all of this in the [`System - Conversation Start` topic](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics). Override the default to: (1) check if `Global.UserLanguage` is blank, (2) if blank, send the language selection Adaptive Card and capture the choice, (3) set `Global.UserLanguage`, (4) route to the actual greeting topic.

When the user selects a language from the Adaptive Card, add a **Set Variable** action node in your topic. Set the variable to `Global.UserLanguage`. Set the value field to the card's output. In the "Ask with Adaptive Card" node, the captured response is exposed as `Topic.AdaptiveCardOutput` (or whatever output variable name you configured). For a card with a `selectedLanguage` choice input:

```
Topic.AdaptiveCardOutput.selectedLanguage
```

There is no `Set()` function in Copilot Studio topic authoring - that is Power Apps canvas syntax. Power Fx in CS appears only inside the value fields of action nodes.

### Normalize language codes

Channels are inconsistent. Teams may send `"fr-FR"`, web chat may send `"fr"`, some legacy connectors send `"fr_FR"`. Normalize at the top of Conversation Start before storing. Use `System.User.Language` as the source:

```powerfx
Switch(
    Lower(Substitute(System.User.Language, "_", "-")),
    "fr", "fr-FR",
    "fr-fr", "fr-FR",
    "pt", "pt-BR",
    "pt-br", "pt-BR",
    "cs", "cs-CZ",
    "cs-cz", "cs-CZ",
    "es", "es-ES",
    "es-es", "es-ES",
    "nl", "nl-NL",
    "nl-nl", "nl-NL",
    "de", "de-DE",
    "de-de", "de-DE",
    "it", "it-IT",
    "it-it", "it-IT",
    "en-US"
)
```

In the eight-language demo agent, the language picker uses readable identifiers (`English`, `French`, `Portuguese_Brazilian`, `Czech`, `Spanish`, `Dutch`, `German`, `Italian`) rather than locale codes - friendlier to bind into card buttons and easier to read in `Switch()` expressions across topics. Pick the convention that fits your stack and stay consistent.

## 2. Language-aware UI: Adaptive Cards and dynamic text

Once `Global.UserLanguage` is set, avoid hard-coding strings in message nodes.

### The JSON switch pattern

For complex [Adaptive Cards](https://learn.microsoft.com/microsoft-copilot-studio/adaptive-cards-overview), do not translate individual fields with nested `If` statements inside the card designer. Store your card JSONs as variables and switch the entire payload.

Add a **Set Variable** node targeting `Global.varCurrentCard`. Use this expression in the value field:

```powerfx
Switch(
    Global.UserLanguage,
    "English", Global.varCard_EN,
    "French", Global.varCard_FR,
    "Portuguese_Brazilian", Global.varCard_PT,
    "Czech", Global.varCard_CS,
    "Spanish", Global.varCard_ES,
    "Dutch", Global.varCard_NL,
    "German", Global.varCard_DE,
    "Italian", Global.varCard_IT,
    Global.varCard_EN
)
```

Two production constraints: (1) card JSON variables must be Global-scoped to persist across topics; (2) Power Fx string variables have a length cap that complex cards (especially with inline base64 images) will breach. For cards over the limit, fetch JSON from a Power Automate flow or Dataverse row instead of inlining as a variable.

### The `activity:` evaluation gotcha

For simple text blocks, inline Power Fx works - **but with a critical caveat**. In a `SendActivity` node, the `activity:` field does **not** evaluate Power Fx expressions. A `=Switch(...)` expression placed directly in `activity:` will render as raw text in the bot. The fix is a two-step pattern: compute the localized string in a `SetVariable` node (where Power Fx **is** evaluated), then reference the resulting variable from `SendActivity`.

```yaml
- kind: SetVariable
  id: compute_greeting
  variable: Topic.Msg
  value: =Switch(Global.UserLanguage, "French", "Bonjour", "Portuguese_Brazilian", "Olá", "Czech", "Ahoj", "Spanish", "Hola", "Dutch", "Hallo", "German", "Hallo", "Italian", "Ciao", "Hello")
- kind: SendActivity
  id: greet
  activity: =Topic.Msg
```

This pattern is what unlocks clean per-language replies in every system topic (Greeting, Goodbye, ThankYou, Escalate, Fallback, StartOver, EndOfConversation, ResetConversation) of the eight-language demo agent without duplicating any of them.

> If you see `=Switch(...)` rendered as plain text in your bot, you put the expression in `SendActivity.activity` instead of computing it in a preceding `SetVariable.value`. The fix is mechanical: lift the expression up.
{: .prompt-warning }

## 3. Topic-level routing vs. topic duplication

**The anti-pattern:** Creating `Topic_Refund_EN`, `Topic_Refund_FR`, `Topic_Refund_PT`, `Topic_Refund_CS`, ... This is an operational disaster. When a business rule changes, you update it in N places and miss at least one.

**The recommended pattern:** Conditional branching within a single topic.

For simple topics, use inline `Switch` (with the SetVariable + SendActivity pattern above). For complex topics with different business logic per region (different regulations, different backend calls), add a Condition node at the start:

```
[Topic Start]
    --> Condition: Global.UserLanguage
        --> "French" : FR-specific flow (EU regulations, FR API endpoint)
        --> "Portuguese_Brazilian" : PT-specific flow
        --> default : EN flow
    --> [Common resolution path]
```

This keeps logic centralized while allowing regional divergence where strictly necessary.

### Cross-lingual intent: letting generative orchestration bridge locale mismatches

If a user is in an English session but asks a question in Czech, the [generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) engine can identify the intent and trigger the correct topic regardless of what `Global.UserLanguage` is set to.

**The strategy:** Do not build keyword-based language detection topics. Let generative AI handle intent mapping. Once a topic is triggered, your `Global.UserLanguage` variable ensures the *response* is delivered in the user's preferred language.

The pattern is: generative orchestration resolves *what*, deterministic variables control *how it is presented*.

## 4. Session management and inactivity reset

When the [Reset Conversation system topic](https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics) fires (or a session timeout configured under Settings > Session Management triggers), all conversation-scoped variables are cleared. Global variables persist for the session but are reset on conversation end. If a user returns after a break, `Global.UserLanguage` will be blank.

**The pattern:** Do not blindly clear everything. Instead:

1. Clear transient variables (transaction IDs, search results, temp state).
2. Check if `Global.UserLanguage` is blank.
3. If blank, trigger the language selection Adaptive Card.
4. If set, preserve it and greet the user in their language.

Also: do not store language in a persistent user-scoped variable unless you have a deliberate "save preferences" feature. Forcing a language from a session three months ago is jarring, especially for shared devices or travelling users.

## Lessons from production

The architecture above was first deployed for a global industrial client requiring EN, FR, PT-BR, and CS. The eight-language demo extends the same pattern to EN, FR, PT-BR, CS, ES, NL, DE, IT. Going from 4 to 8 languages cost a few extra entries in each `Switch()` and a few extra card payloads - not a refactor.

Key takeaways:

- **Always define a fallback language.** If a user provides an unsupported locale, default to English gracefully. An empty string in a card field is worse than the wrong language.
- **Test with real tenant configurations, not local browser settings.** The most common bug in multilingual Teams bots is a US-tenant overriding all locale signals. Your test environment must mirror production.
- **Initialize all language card variables in `System - Conversation Start`.** Storing each language's card JSON as a named global variable (`Global.varCard_EN`, `Global.varCard_FR`, ...) and initializing them centrally makes swapping content clean and testable. One author owns Conversation Start, translators own the card JSONs.
- **Czech has friends.** Character encoding (diacritics) in adaptive card JSON strings requires careful escaping. Test `ž`, `š`, `č` explicitly. The same care applies to German umlauts (`ä`, `ö`, `ü`, `ß`), Spanish (`ñ`, `á`, `é`, `í`, `ó`, `ú`), and Portuguese (`ã`, `ç`, `õ`).
- **`activity:` does not evaluate Power Fx.** This caught me twice. If you see `=Switch(...)` rendered as plain text in your bot, the expression is in the wrong field. Lift it into a preceding `SetVariable.value`.
- **Test all language paths via the test pane variable override.** Set `Global.UserLanguage` to each target locale before triggering topics. The Copilot Studio Kit's automated test runner can do this systematically across all eight languages on every PR.

## Summary checklist

| Area | Anti-pattern | Recommended pattern |
| :--- | :--- | :--- |
| Topic structure | Duplicate topics per language | Single topic with `Switch` or Condition nodes |
| Language detection | Browser/Teams locale | Explicit Adaptive Card selection |
| UI content | Hard-coded strings | Power Fx `Switch` (via SetVariable) or JSON payload switching |
| Power Fx evaluation | `activity: =Switch(...)` | `SetVariable.value: =Switch(...)` then `SendActivity.activity: =Topic.Var` |
| Intent handling | Keyword-based language routing | Generative orchestration + deterministic response |
| Session state | Reset Conversation without language preservation | Selective reset preserving `Global.UserLanguage` |
| Persistence | Store language in user-scoped var | Re-ask at session restart |

Decoupling **intent** (what the user wants) from **locale** (how the answer is delivered) is the core principle. Get that separation right, and adding a fifth, sixth, or eighth language is a half-day of work, not a week.
