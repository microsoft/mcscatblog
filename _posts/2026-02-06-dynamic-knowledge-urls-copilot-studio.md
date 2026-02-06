---
layout: post
title: "Zero Noise, Maximum Relevance: Dynamic Knowledge URLs in Copilot Studio"
date: 2026-02-02 12:00:00 +0000
categories: [copilot-studio, knowledge]
tags: [knowledge-sources, dynamic-urls, public-website, alm, multi-region]
description: How a simple variable unlocks multi-market, multi-language, and multi-product web grounding while improving ALM processes.
author: dbellingeri
image:
  path: /assets/posts/dynamic-knowledge-urls/header4-cropped.png
  alt: "Dynamic Knowledge URLs in Copilot Studio"
  no_bg: true
---

Just recently released in preview it's a deceptively small feature with significant practical implications: you can now parameterize the URL of a website using a variable letting a single knowledge source adapt itself to the user or environment context in real time.

This was asked for by many customers who want to be able to scope knowledge based on user or environment parameters without needing to manage many separate knowledge entries.

## The Problems this Solves

Before this feature:

- If you wanted different knowledge sources based on regionality or languages, you had to add separate knowledge sources:
  - microsoft.com/en-us
  - microsoft.com/it-it
  - microsoft.com/ja-jp
- If you wanted different product lines, more sources:
  - https://support.microsoft.com/en-us/surface
  - https://support.microsoft.com/en-us/microsoft-copilot
  - https://support.microsoft.com/en-us/outlook
- If you wanted different versions of your knowledge sources for different environments (Dev-Test-Stage-Prod) you had to modify them after deployment to repoint to the correct version of the sites.

This led to:

- Bloated knowledge configurations
- Over-scoped grounding, where agents pull unnecessary pages simply because they sit under the same domain root
- Complex ALM (moving many URL-bound sources through Dev → Test → Prod as well as needing to modify URLs in target environments - not best practice)
- Latency concerns - searching across too many irrelevant sources slows everything down

## The Breakthrough: URL Variables in Public Website Knowledge

Copilot Studio now allows you to define a knowledge source to include variables. This can be used to scope a knowledge site to a specific path or to replace an entire URL with a variable at runtime.

## How It Works Under the Hood

1. **Define the variable.** Variables can be set via:
   - Topic inputs / question to user / multiple choice options
   - User Profile / Language detection
   - Tools like Agent Flows and Connectors
   - [Environment Variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables)
2. **Insert it into the public website link.** You can either scope a URL with the variable as a sub-path (www.site.com/{variable}) or replace the entire knowledge URL with the variable ({variable}).

To do this, go to Add knowledge, choose Public Websites, then click the {x} to add a variable in the Public Website link field. 

![Add knowledge](/assets/posts/dynamic-knowledge-urls/addknowledge.png){: .shadow w="700" h="400"}

![Replacing entire URL with variable](/assets/posts/dynamic-knowledge-urls/replacing-url.png){: .shadow w="700" h="400"}

3. **If the user prompts the agent** with a question and knowledge is called upon, the agent resolves the knowledge source at runtime using the variable.

4. **Grounding stays within that scoped URL** until the variable is changed or the conversation is reset.

## Limitations to Know

1. **The "two sub-level" public website knowledge limitation still exists.**

   Public site knowledge uses Bing's index. Bing guarantees indexing only to 2 levels deep. Scoped knowledge via variable changes what URL to target, not how deep Bing crawls.

2. **This functionality is currently for public websites only.** Functionality to do the same with SharePoint knowledge is on the product roadmap.

## Real Life Example: Product Scoping for Microsoft.com

In this example I will be using the public website knowledge variable to scope the Microsoft.com/en-us website based on the product the user asks about.

I first need to create a Global variable to use for knowledge scoping.

In this example, I'm going to manage this variable via a Topic. Remember you can set the variable you plan to use for knowledge in many ways, the key is to make sure you use a string type variable that is set to Global.

I'm going to set the GlobalProduct variable by asking the user to select the product they're interested in via a Topic. I use an "ask a question" node and give the user some options to choose from. Since the URL paths on websites for product pages aren't always friendly (such as Copilot = /Microsoft-365-copilot), I am capturing the user response for the "friendly" name in one variable and setting the GlobalProduct variable based on the friendly name selection.

The GlobalProduct variable has been created as a text/string type and set to a Global variable so it can be used outside of the topic we are in. Once the selection is made, I send a message to the user asking them to go ahead with their question about the Product they chose.

![Topic configuration for product selection](/assets/posts/dynamic-knowledge-urls/topic-configuration.png){: .shadow w="700" h="400"}
_Topic configuration for capturing product selection_

Once this topic is configured and we have our GlobalProduct variable created, we need to go create our knowledge source entry. From Knowledge we will choose public website, then enter in our knowledge URL and then click the "{X}" to add in the GlobalProduct variable we created in our topic. 

![Creating knowledge source with variable](/assets/posts/dynamic-knowledge-urls/knowledge-source-setup.png){: .shadow w="700" h="400"}
_Setting up the knowledge source with the variable_

### Results

This conversation below was scoped to the Microsoft Copilot sub-page. It answers Copilot related queries without issue but will not answer questions with information coming from the Surface or Excel sub-pages.

![Copilot scoped results](/assets/posts/dynamic-knowledge-urls/copilot-results.png){: .shadow w="700" h="400"}
_Agent responding with Copilot-scoped knowledge_

The following two examples show the Surface and Excel questions being asked to the same agent with the knowledge scoping set to those respective sub-pages.

![Surface scoped results](/assets/posts/dynamic-knowledge-urls/surface-results.png){: .shadow w="700" h="400"}
_Agent responding with Surface-scoped knowledge_

![Excel scoped results](/assets/posts/dynamic-knowledge-urls/excel-results.png){: .shadow w="700" h="400"}
_Agent responding with Excel-scoped knowledge_

## Use Case 2: Country or Region Filtering

For global organizations, regional pages are used to provide users with region-specific:

- Pricing pages
- Product availability
- Different regulatory content

At runtime Copilot Studio uses the User's browser settings to populate the User.Language variable. You can create a mapping between user language and a knowledge URL variable using the Conversation Start Topic similar to what was done in the first example. This will take the user's language preference in Copilot Studio and map it to a region/language-specific URL and scope the knowledge in the agent accordingly. Using Microsoft's website as an example:

- US English users --> User.Language = US English, knowledge variable = en-us
- Italian users --> User.Language = Italian, knowledge variable = it-it

## Use Case 3: Set Environment Based Variables

You may have a non-prod version of your website knowledge you use for development purposes. This feature will let you use an environment variable to set the URL to use.

To do this you will first need to create an environment variable. Environment variables can be created from the solutions area in Copilot Studio.

1. In the left hand nav of Copilot Studio click the ellipse
2. Select Solutions

   ![Solutions menu](/assets/posts/dynamic-knowledge-urls/solutions-menu.png){: .shadow w="329" h="518"}
   _Accessing Solutions in Copilot Studio_

3. Open the solution your agent is in. Please try and avoid using the default solution for your agents.
4. In the solution objects picker, open the environment variables object. You will be able to see all the environment variables associated with your solution here.
5. To add a new one, select new, then Environment Variable.

![Creating environment variable](/assets/posts/dynamic-knowledge-urls/create-env-var.png){: .shadow w="700" h="400"}
_Creating a new environment variable_

6. In the New environment variable fly out, configure it for your website. Use Text as the data type. I set my default to the Microsoft US website as a fallback. Once the solution is deployed in your target environment you can update it to the correct value for the environment you are in.

![Environment variable configuration](/assets/posts/dynamic-knowledge-urls/env-var-config.png){: .shadow w="267" h="626"}
_Creating the environment variable_

7. You can then use this variable when adding a public website knowledge source.

![Adding the environment variable in public website knowledge](/assets/posts/dynamic-knowledge-urls/environment-variablepicker.png){: .shadow w="700" h="400"}
_Adding the environment variable to public website knowledge_

## Conclusion

The new dynamic public website knowledge source capability is a subtle yet transformative feature that has the potential to improve the agent building experience for many organizations. With a single variable, you can now:

- Build multi-product agents
- Build multi-region agents
- Reduce your knowledge source footprint
- Improve accuracy and reduce latency
- Improve ALM processes for agents
- Give customers a hyper-personalized experience

If you're building enterprise-grade agents this feature should be part of your baseline architecture going forward.

---

*With a single variable now controlling knowledge scope, how will you rethink your agent design patterns to maximize relevance while minimizing maintenance overhead?*

---
Stay tuned for more details regarding the same functionality for SharePoint knowledge source!
