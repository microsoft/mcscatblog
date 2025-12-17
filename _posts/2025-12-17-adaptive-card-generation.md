---
layout: post
title: "Top Tip - Adaptive Card Generation"
date: 2025-12-17
categories: [copilot-studio, user-experience]
tags: [adaptive-cards, best-practices, tips]
description:  Using the test pane to ease Adaptive Card creation, and beyond!
author: daveburman-msft
image:
  path: /assets/posts/adaptive-card-generation/header.png
  alt: "A developer who's happily creating Adaptive Cards"
  no_bg: true
---

Conversational interfaces are great, but sometimes you just can't be an old fashioned form.  If you need to collect and validate multiple pieces of information at the same time, there's a lot to be said for putting an Adaptive Card in front of a user.

But if you're anything like me, a lot of what's said at that point can't be repeated.  Constructing the JSON required for an Adaptive Card by hand is fiddly and often frustrating.  I love Copilot Studio's Adaptive Card Designer for it's WYSIWYG approach, but it can quickly become unwieldy for all but the most simple of cards.

## A Better Way ##

The answer to my JSON woes was literally right in front of me the whole time; the Test Pane.  Perhaps I'm a little late to the party with this, but I've recently realised how good Copilot Studio itself is at providing a starting point.

As an example, let's see what the test pane makes of the following:

```
Write JSON for an Adaptive Card which prompts the user to enter dietary preferences.

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

## Did You Really Say Copy/Paste?! ##

There's probably a good portion of you who are already doing this.  In this new and emerging world, it's sometimes tough to know what's mind-blowing and what's common knowledge.  I was encouraged to push this approach a bit further, so if you've already had your mind blown,  I suggest you take a seat as this is about to get next level.

## Don't Make Me Think ##

Anyone that's worked with digital forms knows dynamic forms are almost always a requirement.  Many digital transformation projects start with digitizing existing paper forms, and realise they can be smarter:
  - "Why do I have to fill in both my billing address and shipping address when they're the same"
  - "Why do I need to fill out the female health section when I've already told you I'm male"
  - "Why are there so many county/region options when I've told you which country I'm in"

The reality is users ~~want~~ **expect** smart solutions which are targetted towards their needs, and if you're putting a form in front of a user to collect information, you **need** to do so in an intelligent way.

So what's that got to do with Adaptive Cards?  Well in a situation where you're collecting and validating multiple pieces of information from a user, it needs to be targetted.  It needs to make sense to the user, and needs to be friction free.

## Context Specific Adaptive Cards ##

For the next section, I'll consider a specific example; a digital travel agent who's purpose is to help user design a travel itinerary for a trip to a specific country.

What does the user want from this experience?  They want suggestions related to the things they enjoy doing as a tourist.  They want the agent to understand their intent, and provide an itinerary that's more than just a search engine research of "cool things to do in this country".  They want ideas that'll work within the scope of their intended trip dates, and suggestions that are meaningful based upon the country they're going to, and most importantly, things they'll enjoy based on their individual interests.

Whilst this can be achieved conversationally, the back-and-forth conversation to ensure the agent knows what's needed could easily become arduous.  A form with a few targetted suggestions, designed to obtain user intent, could be just the ticket to generating a tailored tourism profile, which in turn can be used to generate a meaningful and specific intinerary.

Let's have a look at my Travel Agent's response to a request from a user looking to plan a trip to Spain:

![Spain card](/assets/posts/adaptive-card-generation/spain-form-initial.png){: .shadow w="607" h="718"}

Looks like a fairly generic form until you compare it to one for a similar request for San Marino:

![San Marino card](/assets/posts/adaptive-card-generation/sanmarino-form-initial.png){: .shadow w="464" h="700"}

Note San Marino has no beaches, and the form content is tailored appropriately.  More than that though, the options available to each question are country tailored:

![San Marino card expanded](/assets/posts/adaptive-card-generation/sanmarino-form-expanded.png){: .shadow w="443" h="710"}

There are also fields for trip start and end date, and with all of this information we have everything we need to determine what type of traveller the user is, and with that we can make tailored recommendations.

![Tourist profile](/assets/posts/adaptive-card-generation/sanmarino-profile.png){: .shadow w="443" h="710"}

That information can be used to generate a tailored itinerary based on the user's preferences:

![Itnierary](/assets/posts/adaptive-card-generation/itinerary.png){: .shadow w="457" h="622"}

Cool huh?!

## 195 Countries in the World - That's A Lot Of Copy/Paste ##

Is it?

![No code](/assets/posts/adaptive-card-generation/nocode.jpg){: .shadow w="443" h="710"}

I started this post talking about how LLMs are quite adept at writing code for Adaptive Cards, and it's actually quite straight forward to do this on the fly.

First I dropped my instructions into a custom prompt given the responsibility of creating the Adaptive Card JSON, which just takes the country as an input:

![Generate card prompt](/assets/posts/adaptive-card-generation/prompt-generatecard.png){: .shadow w="1867" h="923"}

Secondly, I created another prompt to create the tourist profile.  This one takes inputs for the country, the original Adaptive Card, and the user's response to the submission.  I passed the original card JSON in as I wanted to ensure the prompt could infer dislikes aswell as likes, and the country to ensure the prompt had as much information available as possible to make decisions about the user's needs.

![Generate tourist profile prompt](/assets/posts/adaptive-card-generation/prompt-generateprofile.png){: .shadow w="1880" h="927"}

I wrapped each of these in Agent flows so I had full control of the variables being passed around (this isn't the only option available), and put the whole journey inside a topic.

The topic required a little manipulation.  Essentially the flow was:
  - Call the card generation flow
  - Push the output of that into an Adaptive Card node
  - Take the output of the Adaptive Card node and push it into the profile generation flow
  - Output the profile to the user
  - Use a Generative Answers node to generate and output an itinerary

This is all fairly straight forward except for the dynamic nature of the Adaptive Card.  I cheated a little and made sure I had a fixed number of questions (look back at the card generation prompt), which meant I could rely on a fixed number of outputs from the card.  Manipulating the topic YAML a little...

![Changes to topic YAML](/assets/posts/adaptive-card-generation/topic-yaml.png){: .shadow w="286" h="657"}

...I was able to then set a single variable representing the entire response, passed into the prompt to generate a tourist profile...

![Constructing a variable for the prompt](/assets/posts/adaptive-card-generation/call-tourist-profile.png){: .shadow w="732" h="524"}

...and after that, it was simply a case of passing the profile into a generative answers node to generate the final itinerary:

![Generative answer node for itinerary](/assets/posts/adaptive-card-generation/itinerary-node.png){: .shadow w="655" h="802"}

## Summary ##

So there we go, dynamically intelligent forms driving conversational intelligence without a single line of JSON.  Adaptive Cards are great in certain situations, and creating them is very straightforward when Copilot's around!