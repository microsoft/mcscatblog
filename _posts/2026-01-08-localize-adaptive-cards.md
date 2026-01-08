---
layout: post
title: "The One Card: Build Once, Speak All Languages"
date: 2026-01-08
categories: [copilot-studio, localization]
tags: [adaptive-cards, multilingual, localization, best-practices]
description: Static text in Adaptive Cards now appears in localization files, making multilingual agents with rich UI components actually practical.
author: adilei
image:
  path: /assets/posts/adaptive-card-localization/header.png
  alt: "Multilingual adaptive cards without the pain"
  no_bg: true
---

If you've been building multilingual agents in Copilot Studio, you know the drill: translate your topic messages, manage your localization files, rinse, repeat. But what about all that static text in your Adaptive Cards? 

Until recently, that was a different story, and not necessarily a pleasant one.

## The Old Reality: Two Localization Workflows

Here's how it used to work:

**For regular topic content**: Download your JSON/ResX localization file, translate the strings, upload. Done. Beautiful. This is [documented and straightforward](https://learn.microsoft.com/en-us/microsoft-copilot-studio/multilingual).

**For Adaptive Cards**: Manually maintain separate card definitions for each language, or build complex Power Fx expressions to swap text based on locale, or... well, there weren't many good options.

Adaptive Cards are perfect for communicating rich information and collecting structured data from users—as [Dave showed us]({% post_url 2026-01-02-adaptive-card-generation %}), they can be dynamically generated to provide amazing user experiences. But if you're building a truly global agent, you need those cards to work in every language your users speak.

## The New Reality: One Card to Serve Them All

**Here's the big news**: Static text in Adaptive Cards now appears in your localization files.

That's it. That's the breakthrough.

All those `TextBlock` values, button titles, placeholder text, error messages, they all show up in the same JSON/ResX file you're already using for the rest of your agent. One download, one translation process, one upload. Build your card once, and it speaks every language your agent supports.

## What This Means in Practice

Let's look at a real example. Say you're building a book recommendation agent (because why not), and you want to present recommendations as beautiful Adaptive Cards:

![LOTR Book Recommendation Card](/assets/posts/adaptive-card-localization/english-lotr-ac.png){: .shadow w="490" h="280"}
_An Adaptive Card for book recommendations—with localizable text throughout_

<details markdown="1">
<summary>Click to expand the full Adaptive Card JSON</summary>

````json
{
    "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.5",
    "fallbackText": "Book recommendation: The Fellowship of the Ring by J. R. R. Tolkien",
    "body": [
        {
            "type": "Container",
            "bleed": true,
            "style": "emphasis",
            "items": [
                {
                    "type": "TextBlock",
                    "text": "✨ Book Recommendation",
                    "weight": "Bolder",
                    "size": "Small",
                    "wrap": true
                }
            ]
        },
        {
            "type": "Container",
            "spacing": "Medium",
            "items": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "width": "auto",
                            "items": [
                                {
                                    "type": "Image",
                                    "url": "https://covers.openlibrary.org/b/isbn/9780261102354-M.jpg",
                                    "altText": "The Fellowship of the Ring cover",
                                    "size": "Medium"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "width": "stretch",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "text": "The Fellowship of the Ring",
                                    "weight": "Bolder",
                                    "size": "Large",
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "text": "J. R. R. Tolkien",
                                    "isSubtle": true,
                                    "spacing": "None",
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "text": "★★★★★  •  Epic fantasy classic •  ~400–500 pages (edition varies)",
                                    "spacing": "Small",
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "text": "A quiet hobbit inherits a dangerous ring—and sets out from the Shire into a widening war, with a fellowship of allies and an impossible task: destroy the One Ring.",
                                    "wrap": true,
                                    "spacing": "Medium"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "Container",
                    "spacing": "Medium",
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": "Why you might like it",
                            "weight": "Bolder",
                            "wrap": true
                        },
                        {
                            "type": "FactSet",
                            "facts": [
                                {
                                    "title": "Vibe",
                                    "value": "Mythic, cozy-to-cataclysmic, wondrous"
                                },
                                {
                                    "title": "If you liked",
                                    "value": "deep lore + quest stories + rich worldbuilding"
                                },
                                {
                                    "title": "Best for",
                                    "value": "classic adventure with heart (and real danger)"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "Container",
                    "spacing": "Medium",
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": "Mood palette",
                            "weight": "Bolder",
                            "wrap": true
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "width": "stretch",
                                    "items": [
                                        {
                                            "type": "Container",
                                            "style": "emphasis",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "🍃 Cozy",
                                                    "wrap": true,
                                                    "spacing": "None"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "type": "Column",
                                    "width": "stretch",
                                    "items": [
                                        {
                                            "type": "Container",
                                            "style": "emphasis",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "🧙 Wonder",
                                                    "wrap": true,
                                                    "spacing": "None"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "type": "Column",
                                    "width": "stretch",
                                    "items": [
                                        {
                                            "type": "Container",
                                            "style": "emphasis",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "⚔️ Doom",
                                                    "wrap": true,
                                                    "spacing": "None"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "actions": [
        {
            "type": "Action.OpenUrl",
            "title": "View on Open Library",
            "url": "https://openlibrary.org/search?q=The+Fellowship+of+the+Ring+Tolkien"
        },
        {
            "type": "Action.OpenUrl",
            "title": "Get a sample",
            "url": "https://www.google.com/search?q=The+Fellowship+of+the+Ring+preview"
        },
        {
            "type": "Action.Submit",
            "title": "Add to reading list",
            "data": {
                "action": "add_to_reading_list",
                "book": {
                    "title": "The Fellowship of the Ring",
                    "author": "J. R. R. Tolkien"
                }
            }
        }
    ]
}
```
</details><br/>

Look at all that text! *Book Recommendation*, *Why you might like it*, *Mood palette*, button titles, image alt text—all of it needs translation if your agent supports multiple languages.

### The Translation Workflow

Let's say we want to translate the card to Italian. (Fun fact: did you know that Strider is called "Grampasso" in the Italian version? That's very cool. Also, "Aragorn" is a common Italian herb... okay, I made that last one up, but it *should* be true.)

Anyway, back to Italian translation. When you download your localization file for Italian (or any secondary language), all the static text from your Adaptive Card appears alongside your regular topic content. Here's what you see:

```json
{
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.actions[0].title": "View on Open Library",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.actions[1].title": "Get a sample",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.actions[2].title": "Add to reading list",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[0].items[0].text": "✨ Book Recommendation",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[0].columns[0].items[0].altText": "The Fellowship of the Ring cover",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[1].items[0].text": "Why you might like it",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[1].items[1].facts[0].title": "Vibe",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[1].items[1].facts[0].value": "Mythic, cozy-to-cataclysmic, wondrous",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[0].text": "Mood palette",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[1].columns[0].items[0].items[0].text": "🍃 Cozy",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[1].columns[1].items[0].items[0].text": "🧙 Wonder",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[1].columns[2].items[0].items[0].text": "⚔️ Doom",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.fallbackText": "Book recommendation: The Fellowship of the Ring by J. R. R. Tolkien"
}
```

Every piece of static text from your Adaptive Card gets its own entry with a unique path. The keys are verbose (they include the dialog, topic, action, and exact location in the card structure), but you only need to focus on translating the values.

After translating to Italian, your localization file looks like this:

```json
{
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.actions[0].title": "Vedi su Open Library",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.actions[1].title": "Leggi un estratto",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.actions[2].title": "Aggiungi alla lista di lettura",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[0].items[0].text": "✨ Consiglio di lettura",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[0].columns[0].items[0].altText": "Copertina del libro La compagnia dell'anello",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[1].items[0].text": "Perché potrebbe piacerti",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[1].items[1].facts[0].title": "Atmosfera",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[1].items[1].facts[0].value": "Mitica, dal confortevole al catastrofico, meravigliosa",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[0].text": "Palette dell'atmosfera",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[1].columns[0].items[0].items[0].text": "🍃 Accogliente",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[1].columns[1].items[0].items[0].text": "🧙 Meraviglia",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.body[1].items[2].items[1].columns[2].items[0].items[0].text": "⚔️ Tenebra",
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(sendActivity_a7aWmy)'.Activity.Attachments[0].CardContent.fallbackText": "Consiglio di lettura: La compagnia dell'anello di J. R. R. Tolkien"
}
```

Upload this file, and when an Italian user interacts with your agent, they see a fully localized card:

![Italian LOTR Book Recommendation Card](/assets/posts/adaptive-card-localization/italian-lotr-ac.png){: .shadow w="490" h="280"}
_The same card, automatically localized for Italian users_

## Mixed Content

Here's where things get slightly more complex. What if your Adaptive Card contains a mix of static text and dynamic values? For example, imagine your card includes a message like:

**"You've read 12 of 547 pages in The Fellowship of the Ring"**

The numbers (`12` and `547`) come from variables—they're different for each user. But the surrounding text ("You've read", "of", "pages in") needs translation.

Unfortunately, mixed-content strings like this don't automatically appear in localization files. The platform can't separate the static text from the dynamic values on its own.

### The Workaround: Set Text Variable

There's a hidden node in Copilot Studio called **Set text variable**. Like Gandalf's true name (Olórin the Maia, if you were wondering), it exists in the shadows, you can't create it directly from the authoring canvas, only through the code editor. And like Gandalf himself (doubling down on the metaphor here, folks!), it's far more powerful than it first appears: it can convert anything (tables, records, etc) into text, but more importantly for our purposes, it creates a string that combines static text with variable references *and* makes it available for localization.

The complete process for handling mixed content is documented in the [official Copilot Studio localization guide](https://learn.microsoft.com/en-us/microsoft-copilot-studio/multilingual#make-dynamic-content-from-adaptive-cards-available-for-localization), but here's a quick overview:

1. Add a Set variable value node before your Adaptive Card action
2. Open the code editor and change `kind: SetVariable` to `kind: SetTextVariable`
3. Enter your mixed content with variable placeholders
4. Reference this intermediate variable in your Adaptive Card

For our LOTR example, the YAML would look like:

```yaml
actions:
  - kind: SetTextVariable
    id: readingProgress
    variable: Topic.progressMessage
    value: "You've read {Topic.currentPage} of {Topic.totalPages} pages in {Topic.bookTitle}"
```

Then in your Adaptive Card, reference `Topic.progressMessage` instead of trying to construct the string inline.

When you download your localization file, you'll see the full string with variable placeholders, ready for translation:

```json
{
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(readingProgress)'.Value": "You've read {Topic.currentPage} of {Topic.totalPages} pages in {Topic.bookTitle}"
}
```

Translate it to Italian while preserving the variable placeholders:

```json
{
  "'dialog(copilots_header_392e9.topic.recommendbooks)'.'trigger(main)'.'action(readingProgress)'.Value": "Hai letto {Topic.currentPage} di {Topic.totalPages} pagine in {Topic.bookTitle}"
}
```

> **Pro tip**: The Set text variable node is incredibly useful beyond localization. It can convert tables, records, and complex objects into text.
{: .prompt-tip}

## Key Takeaways

- **Static Adaptive Card text now appears in localization files** - Build once, translate like everything else
- **No complex card management workflows needed** - Same download/translate/upload process for all content
- **Mixed content is localizable using Set text variable** - Combine static text and dynamic values in translatable strings

---

*Building multilingual agents with Adaptive Cards? How has this feature changed your workflow? And most importantly, did you translate your cards to Mordor Black Speech? Let us know in the comments!*

![Ralph Bakshi's The Lord of the Rings](https://imgix.bustle.com/uploads/image/2023/11/5/a3e9854d-2adc-4b87-a157-2e71a5e68319-screen-shot-2023-11-04-at-62827-pm-copy.jpg?w=1440&h=720&fit=crop&crop=faces&dpr=2){: .shadow}
_Ralph Bakshi's 'The Lord of the Rings'._

---

