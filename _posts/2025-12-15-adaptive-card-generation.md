---
layout: post
title: "Top Tip - Adaptive Card Generation"
date: 2025-12-15
categories: [copilot-studio, authentication]
tags: [adaptive-cards, best-practices, tips]
description:  Using the test pane to ease adaptive card creation.
author: daveburman-msft
image:
  path: /assets/posts/adaptive-card-generation/header.png
  alt: "A developer who's happily creating adaptive cards"
  no_bg: true
---

Conversational interfaces are great, but sometimes you just can't be an old fashioned form.  If you need to collect and validate multiple pieces of information at the same time, there's a lot to be said for putting an Adaptive Card in front of a user.

But if you're anything like me, a lot of what's said at that point can't be repeated.  Constructing the JSON required for an Adaptive Card by hand is fiddly and often frustrating.  I love Copilot Studio's Adaptive Card Designer for it's WYSIWYG approach, but it can quickly become unwieldy for all but the most simple of cards.

## A Better Way ##

The answer to my JSON woes was literally right in front of me the whole time; the Test Pane.  Perhaps I'm a little late to the party with this, but I've recently realised how good Copilot Studio itself is at providing a starting point.

As an example, let's see what the test pane makes of the following:

```
Write JSON for an adaptive card which prompts the user to enter dietary preferences.

Place each section in containers.

In the first section, introduce the card with a header and introductory message stating why this information is being collected (which is to ensure a good selection of food and drink is provided at an event). 

In the second section, ask for a single selection of popular dietary types (e.g. vegan, vegetarian, etc - provide a comprehensive set of options for this in an expanded list), as well as similar questions for favourite food and favourite beverage, with popular options for both (both in compact lists). 

In the last section, include a hyperlink to a privacy policy document with a placeholder URL, and a submission button. 

Ensure all fields on the form are mandatory, all have an appropriate label and an appropriate error message. Use a food related white repeating image for the background in each of the sections. 

Heavily decorate the text throughout the card with food related emojis.
```

![Adaptive Card - Input](/assets/posts/adaptive-card-generation/adaptive-card-input.png){: .shadow w="706" h="1051"}

Well that looks promising!

A quick copy/paste later, and it's rendered in the Adaptive Card Designer:

![Adaptive Card - Designer](/assets/posts/adaptive-card-generation/adaptive-card-designer.png){: .shadow w="2143" h="1255"}

Even the output variables are configured for me for use within a topic, and it looks great in conversation:

![Adaptive Card - Rendered](/assets/posts/adaptive-card-generation/adaptive-card-rendered.png){: .shadow w="1708" h="1036"}

## Summary ##

Adaptive cards are great in certain situations, and creating them is very straightforward when Copilot's around!