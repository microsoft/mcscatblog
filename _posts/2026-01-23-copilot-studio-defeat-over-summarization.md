---
layout: post
title: "Defeat Over Summarization: How to Deliver Exact Content from Knowledge Sources"
date: 2026-01-23 12:00:00 +0100
categories: [copilot-studio, knowledge, rag]
tags: [generative-ai, summarization, knowledge-sources, custom-search]
description: Learn three methods to return exact, unsummarized content from Copilot Studio knowledge sources when precision matters more than simplification.
author: dbellingeri
image:
  path: /assets/posts/defeat-over-summarization/header.png
  alt: "GenAI agents delivering precise content from knowledge sources"
  no_bg: true
---

GenAI agents are great at simplifying complex information, but sometimes they simplify too much! In many situations, such as customer facing insurance benefits details or employee facing HR policies, summarization can weaken carefully reviewed and legally approved content. When users need precise and unchanged information, the last thing you want is an AI system rewriting or condensing your source material.

Fortunately, Copilot Studio offers ways to return exact excerpts from your knowledge sources so users receive accurate, unabridged information in the form that was originally approved.

Before we dive into how to get exact unsummarized excerpts from agent knowledge, let's start with an understanding of how RAG works within Copilot Studio:

![RAG Pipeline](/assets/posts/defeat-over-summarization/rag-pipeline.png)
<small>_The RAG pipeline in Copilot Studio_</small>

In the Information Retrieval step (step 3), the user's optimized query is used to find matching information within the Knowledge available to the agent. This information is processed in the Summarization step (step 4) to synthesize the information across potentially many knowledge sources into a concise and legible answer to the user's query. This includes ensuring the response adheres agent instructions including those regarding response formatting, tone, emojis etc...

Since we can't just delete the Summarization step (Step 4) out of the RAG pattern in Copilot Studio I'll show you 3 methods that use specific instructions / prompt verbiage that @Adi graciously shared with me to achieve our goal of getting verbatim details out of Copilot Studio knowledge.

## Three Methods to Defeat OverSummarization

1. Using Custom Search over Knowledge within a Topic with an AI Prompt
2. Purely using instructions
3. Using Instructions + AI Prompt

In all three of these methods I'm using Generative Mode, Claude Sonnet 4.5 as the agent model, web search is turned off, and general knowledge is turned off. All three agents are have the same three benefits policy knowledge sources on SharePoint loaded using the unstructured data (Dataverse Sync) SharePoint Knowledge method.

## Method 1: Using Custom Search over Knowledge within a Topic with an AI Prompt

### Agent Setup

![Custom Search Setup](/assets/posts/defeat-over-summarization/custom_search_setup.png)
<small>_Setting up a custom search topic_</small>

I added a new custom topic which uses the Custom Search Action to search through specific knowledge sources and puts the raw knowledge search results into a table variable.

![Custom Search Properties](/assets/posts/defeat-over-summarization/custom_search_properties.png)
<small>_Configure the custom search properties_</small>

We then transform the table variable to text and pass into an AI Prompt for processing.

![Custom Summarization Prompt in Topic](/assets/posts/defeat-over-summarization/custom_summarization_prompt_in_topic.png)
<small>_AI Prompt configured to process search results_</small>

The AI Prompt is configured to use the Activity.Text system variable as the user's query as well as the text version of the knowledge custom search results as inputs. The instructions in the prompt calling telling the LLM not to summarize and to include a markdown block with the exact details from the text are key to this working as we want it to.

**AI Prompt Instructions:**

```
respond to the user's [query] based on [search results], make sure to quote search results verbatim, don't summarize or omit. When quoting from search results, clearly indicate quoted text using a markdown code block

#user query:
##search results:
#Do not include too much surrounding text outside of where the answer was found in the original text. Include citations with links to the knowledge source where the information was found and call out the page and section the user should look to find the details. Do not summarize anything in your response.
```

![Custom Summarization Topic](/assets/posts/defeat-over-summarization/custom_summarization_topic.png)
<small>_Complete topic flow_</small>

The final node in the topic sends a direct message to the user using the output variable from the AI Prompt. This is sent without allowing the orchestrator to summarize anything.

### Results

Success! The agent consistently extracts exact verbiage from the knowledge sources and does not summarize. It also calls out where in the documents the information is located along with the citation links we expect.

![Prompt in Topic Test Pane](/assets/posts/defeat-over-summarization/prompt_in_topic_testpane.png)
<small>_Test results showing exact content extraction_</small>

## Method 2: Instructions Only

### Agent Setup

![Instructions Only Setup](/assets/posts/defeat-over-summarization/instructionsonly_setup.png)
<small>_Agent instructions without custom topics_</small>

This is the simplest method to setup using the same knowledge and key instructions from the prompt in Method 1.

### Results

Success! (usually). This method was less consistent than the other two and your mileage may vary with different models. I had some really good results like the one below, and others where it did as it was asked, but also included a summary of the parental leave policies.

![Instructions Only Test Pane](/assets/posts/defeat-over-summarization/instructionsonly_testpane.png)
<small>_Test results using instructions only_</small>

## Method 3: Instructions with Prompt in Instructions

This method combines the other two methods and uses instructions along with an AI prompt (no topics) to achieve the same goal. In the agent instructions I'm telling the agent what to use as inputs for the AI Prompt

### Agent setup

![Prompt in Instructions Setup](/assets/posts/defeat-over-summarization/prompt_in_instructions_setup.png)
<small>_Configure AI prompt to be called from instructions_</small>

The AI Prompt itself is the same as in Method 1. However, since this one is being called as a tool call directly by the orchestrator, I've set the Completion/After running settings to send a specific message to the user when the AI prompt is completed. This is essentially the same as the last step in the topic to directly send the output from the AI Prompt to the user without letting the orchestrator summarize anything.

![Custom Summarization Prompt](/assets/posts/defeat-over-summarization/custom_summarization_prompt.png)
<small>_AI Prompt configuration_</small>

### Results

Success again! The agent consistently extracts exact verbiage from the knowledge sources and does not summarize. It also calls out where in the documents the information is located along with the citation links we expect.

![Prompt in Instructions Test Pane](/assets/posts/defeat-over-summarization/prompt_in_instructions_testpane.png)
<small>_Test results showing consistent exact content extraction_</small>

## Which method is the best?

For the best consistency and operability within a more complex agent, Method 1 seems to be the most consistent. Latency and credit consumption will also vary between the methods and you'll need to choose whether consistency, speed, or cost is your key criteria.

Method 2 was somewhat inconsistent and this use case was the only thing in the instructions. Additional instructions, may make it even less consistent.

Method 3 is also very good, but since we can't currently set variables in instructions, I'm relying on telling the orchestrator what to use for inputs to the Prompt. While this worked in my limited testing, I could see this having consistency issues.

Response and instruction adherence will vary with different models so you may experience different results using different models.
