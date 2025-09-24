---
layout: post
title: "Connecting to Custom Knowledge Sources in Copilot Studio"
date: 2025-09-24
categories: [copilot-studio, tutorial, knowledge]
tags: [custom-knowledge, search, orchestration, generative-answers]
author: adilei
---

# Custom Knowledge Sources in Copilot Studio

While Copilot Studio offers built-in knowledge sources like SharePoint and Dataverse, you might need to connect to your own search endpoints - perhaps a proprietary search API, or even a Microsoft Service like Azure AI search, while maintaining full control over the search query. This post will walk you through creating a custom knowledge source using the special "On Knowledge Requested" trigger.

![Custom Knowledge Source](/assets/posts/copilot-studio-custom-knowledge-source/custom-knowledge.png){: .shadow w="700" h="400"}
_Responses Generated from a Custom Knowledge Source_

## The On Knowledge Requested Trigger

The key to implementing a custom knowledge source is using the special `OnKnowledgeRequested` trigger. Topics with this trigger are invoked in two scenarios:

1. When the Orchestrator determines that knowledge retrieval is needed to answer the user's question
2. When a Generative Answers node is directly invoked in your conversation flow

>As of September 2025, this trigger can only be defined in code view using YAML - there's no UI designer support yet.
{: .prompt-tip }

## Step-by-Step Implementation

Let's build a custom knowledge source that connects to a search API. We'll start simple and gradually add steps.

### Step 1: Create the Trigger

First, create a new topic and switch to code view. Start with the basic structure and the `OnKnowledgeRequested` trigger:

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnKnowledgeRequested
  id: main
  intent: {}
  actions:
    # Actions will go here
    
inputType: {}
outputType: {}
```

This trigger tells Copilot Studio that this topic handles knowledge requests.

### Step 2: Understanding System Variables

Topics with the `OnKnowledgeRequested` trigger have access to special system variables that aren't available in regular topics:

- **`System.SearchQuery`**: A rewritten version of the user's query optimized for semantic search engines
- **`System.KeywordSearchQuery`**: A rewritten query optimized for lexical/keyword-based search engines
- **`System.SearchResults`**: Where you'll store the formatted search results for the agent to use

An important feature of these system variables is that query rewriting takes the conversation history into account. This means Copilot Studio automatically adds context from previous messages to create context-informed search queries. 

### Step 3: Add the HTTP Request

Now let's add an HTTP request to call your custom search endpoint. In our example, we'll connect to a search API that returns results about the life and history of Autobots (yes, the Transformers!). This could be a fan wiki API, a custom database of Transformers lore, or any specialized knowledge base.


```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnKnowledgeRequested
  id: main
  intent: {}
  actions:
    - kind: HttpRequestAction
      id: searchRequest
      url: ="https://search-api.autobots.com/search?q=" & System.KeywordSearchQuery
      response: Topic.searchResults
      responseSchema:
        kind: Record
        properties:
          query: String
          results:
            type:
              kind: Table
              properties:
                snippet: String
                title: String
                url: String

inputType: {}
outputType: {}
```

#### Why Concatenate the URL with System Variables?

We concatenate `System.KeywordSearchQuery` to our base URL because Copilot Studio automatically rewrites the user's query with conversation context before making the search request. This rewriting is crucial for maintaining context across multi-turn conversations.

**Example Conversation Flow:**

**Query 1** : "Why did the Autobots migrate to Earth?"
- Response: *"The Autobots fled Cybertron due to the Great War with the Decepticons, which depleted their planet's energon resources..."*

**Query 2** : "What else can you tell me about their lives back there?"
- Rewritten query: "Autobots life Cybertron before war society culture"
- Generated URL: `https://search-api.autobots.com/search?q=Autobots%20life%20Cybertron%20before%20war%20society%20culture`

Notice how in Query 2:
- "their" is replaced with "Autobots" 
- "there" is replaced with "Cybertron"

> Instead of a raw HTTP request, you can use **any** method to call your search endpoint: custom connectors, built-in connectors (like Azure AI Search) or Agent Flows. Any technique that gets results from a search endpoint would work.
{: .prompt-tip }

### Step 4: Transform Results to Required Format

Let's say your Autobots search API returns results like this:

```json
{
  "query": "history of Transformers Autobots",
  "results": [
    {
      "title": "Festivals of Light: Seasonal Celebrations in Autobot Culture",
      "url": "https://example.com/autobots-festivals",
      "snippet": "Autobot festivals are anchored in the memory of displacement from Cybertron. The Festival of the First Spark commemorates not only the creation of the Autobots but also their fateful departure from their homeworld..."
    },
    {
      "title": "Culinary Traditions: Energon Cuisine and the Earthly Influence",
      "url": "https://example.com/autobots-foodways",
      "snippet": "The Autobot arrival on Earth, following the crash of the Ark, radically transformed their food practices. Once reliant on refined Energon extracted from Cybertron's core, they adapted by experimenting with terrestrial substitutes..."
    },
    {
      "title": "Songs, Stories, and the Migration Narratives of the Autobots",
      "url": "https://example.com/autobots-oral-tradition",
      "snippet": "Autobot oral traditions devote significant attention to the events that forced them from Cybertron. The 'Ballad of the Spark' recounts the devastation of the Energon wars and the perilous voyage aboard the Ark..."
    }
  ]
}
```

#### Setting Up Response Parsing

To properly parse the HTTP response, you need to tell Copilot Studio what structure to expect. In the UI:

1. Select **"From sample data"** for the response data type
2. Click **"Get schema from sample"**
3. Paste your sample JSON response
4. Copilot Studio will automatically deduce the structure

This generates the response schema in your YAML:

```yaml
responseSchema:
  kind: Record
  properties:
    query: String
    results:
      type:
        kind: Table
        properties:
          snippet: String
          title: String
          url: String
```

#### Transforming to Copilot Studio Format (with complete example)

Copilot Studio expects search results in a specific format with these columns:
- **`Content`** (mandatory): The search snippet or text excerpt
- **`ContentLocation`** (optional): The URL of the full document
- **`Title`** (optional): The title of the document or search result

Now we need to do two things:
1. **Transform** your API's response to match this format
2. **Assign** the transformed data to `System.SearchResults`

Add this transformation and assignment step:

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnKnowledgeRequested
  id: main
  intent: {}
  actions:
    - kind: HttpRequestAction
      id: searchRequest
      url: ="https://search-api.autobots.com/search?q=" & System.KeywordSearchQuery
      response: Topic.searchResults
      responseSchema:
        kind: Record
        properties:
          query: String
          results:
            type:
              kind: Table
              properties:
                snippet: String
                title: String
                url: String
    
    - kind: SetVariable
      id: setSearchResults
      variable: System.SearchResults
      value: |-
        =ForAll(Topic.searchResults.results,
        {
          Content: snippet,
          ContentLocation: url,
          Title: title
        })

inputType: {}
outputType: {}
```

The `SetVariable` action performs both operations:
- The `ForAll` function **transforms** each search result, mapping `snippet` → `Content`, `url` → `ContentLocation`, and `title` → `Title`
- The transformed table is then **assigned to `System.SearchResults`**, which is the special variable that Copilot Studio uses to generate answers

**That's it!** Now we have connected our Copilot Studio Agent to a custom knowledge source.

## Important Considerations

### Result Limits
Copilot Studio will use **up to 15 snippets** from `System.SearchResults` to generate a response. If your API returns more results, consider:
- Implementing relevance scoring to return the best results first
- Limiting your API response to 15 results
- Sorting results by relevance before transformation

#### Multiple Knowledge Topics
You can create **multiple topics** with the `OnKnowledgeRequested` trigger, and all of them will be invoked when knowledge is needed. This allows you to query different search endpoints or implement fallback strategies.

> The 15-snippet limit applies across ALL knowledge topics combined. For example, if Topic A returns 10 snippets and Topic B returns 8 snippets, only 15 total will be used.
{: .prompt-warning }


---

*Have you implemented custom knowledge sources in your agents? What search endpoints are you connecting to? Share your experiences in the comments!*