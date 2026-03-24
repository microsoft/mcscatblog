---
title: "Agentic Structured Data with Zero User Auth: Dataverse searchQuery in Copilot Studio"
date: 2026-03-20
categories: [copilot-studio, dataverse]
tags: [copilot studio, dataverse, searchquery, unauthenticated, agentic, enterprise-grade]
description: "Build fuzzy, ranked search over Dataverse structured data with zero user sign-in. Includes the full YAML, the settings treasure map, and design techniques that turn a connector into an intelligent tool."
author: KarimaKT
image:
  path: /assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/00UnboundDVSearchinMCS.png
  alt: "Agentic Dataverse search over structured data — unauthenticated"
---

Let me tell you about the tool that changes how we build agents over structured data tables in Dataverse.

Imagine an agent over a public-facing community services directory — hundreds of facilities, each with descriptions, phone numbers, opening hours, map coordinates. The agent needs to be unauthenticated (think B2C, think kiosk, think departmental portal for hundreds of users who won't sign in). And the very first tester types *"Is there a Darol center near downtown?"*

The facility is called "Darrell W Civics Community Center." and agent returns nothing.

There were routes in Copilot Studio: **[Knowledge](#glossary)** gave us great intelligence out of the box — but it requires user authentication, so it was a non-starter for a public agent. **[List Rows](#glossary)** gave us full deterministic control — but exact filters don't help when your users can't spell. **[MCP](#glossary)** was fantastic for exploring what's possible — but we needed more granular control over which tables, which columns, what business rules, and what governance. We needed something that was fuzzy *and* unauthenticated *and* fully maker-controlled.

And then we found it in the Dataverse connector: an **[unbound action](#glossary)** called `searchQuery`. This is the same endpoint that powers Dataverse search and Dataverse MCP. 

Here's what the finished agent looks like. Two tools. A short instruction. And a search experience that actually handles messy human input:

![The finished agent: 2 tools, simple instructions](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/works-toplevel-2%20tools.png){: .shadow }
_Two tools. Simple instructions. A conversational search experience._

> **Three things you'll find here that aren't in any docs:**
>
> 1. **The settings treasure map** — the 5 screens across 3 tools where searchQuery configuration actually lives, laid out step by step (because hunting for these settings is half the battle)
> 2. **Design techniques** that turn a basic Dataverse connector into an intelligent, enterprise-grade tool — through naming, descriptions, and input micro-instructions that actually supercharge the search index itself
> 3. **A PowerFx guardrail pattern** that deterministically intercepts requests before the API fires — and no amount of prompt engineering can bypass it
{: .prompt-tip }

---

## What to Expect from SearchQuery
{: #what-to-expect}

Before we dive in, let's set the right expectations — because I've had every one of these conversations, and they always start the same way.

> **New to Copilot Studio?** Terms like **orchestrator**, **maker auth**, **topic**, **AI Prompt**, and **Power Fx** are defined in the [Glossary](#glossary) at the end of this post. I'll bold them on first use so you know where to look.
{: .prompt-tip }

| What people expect | What actually happens |
|---|---|
| "It's like vector search" | It's a **fuzzy relevance index** built on Azure Cognitive Search. Keyword-based with intelligent expansion (typos, stemming, similar terms) — not embedding-based. Right-sized for structured data. |
| "It returns every match" | It's **statistical** — it ranks and returns the top results. Need *every* matching row? That's what List Rows is for. |
| "I send it natural language" | Send **keywords**, not sentences. But here's the trick — the **[orchestrator](#glossary)** extracts keywords from the user's natural language for you. That's part of the design we'll build. |
| "It replaces List Rows" | They're **complementary**. searchQuery discovers. List Rows retrieves. Often both, in sequence. This is the whole pattern. |
| "Dataverse search needs sign-in" | Not when you use the connector with **[maker auth](#glossary)**. Zero user authentication required. This is the detail that changes everything for public-facing agents. |

> **The mental model that makes this click:** searchQuery = *"Help me figure out what the user means."* List Rows = *"I know exactly what I need — go get it."* One discovers. The other delivers. Together, they're a conversation with your data.
{: .prompt-info }

### What's Inside
{: #whats-inside}

| Section | What you'll find |
|---|---|
| [**Setup**](#setup) | The settings treasure map — every screen, every step. Plus the complete YAML you can copy-paste to get a working agent in minutes. |
| [**Design**](#design) | This is the thought leadership section. The techniques that turn a basic connector into a genuinely intelligent tool — and each one is a deliberate decision that visibly changes your agent's behavior. |
| [**See It Work**](#see-it-work) | Screenshots from a working agent handling misspellings, pagination, map links, and a guardrail that stopped a request cold. |
| [**Go Deeper**](#go-deeper) | Multi-table search, specialized instances, glossary scaling, caching patterns, and the OData reference you'll bookmark. |
| [**Glossary**](#glossary) | Quick reference for every Copilot Studio and Dataverse term used in this post. |

---

## Setup Your Data and Index
{: #setup}

This section gets you from zero to a working agent. We'll create test data, index it, wire up both tools, and paste in the YAML. By the end, you'll have something running — and then the [Design](#design) section will show you how to make it *smart*.

### Choose Your Path

> **Don't have a Dataverse table yet?** Start right here — I'll walk you through creating one.
>
> **Already have a table you want to use?** Jump to [Get Your Table Indexed](#get-your-table-indexed).

### Create Your Test Data
{: #create-your-test-data}

Here's a trick I love: use **M365 Copilot** (not Dataverse Copilot — M365 Copilot has a larger context window and reasons better over complex generation prompts) to generate a CSV full of realistic, fuzzy-searchable data:

```
Create 100 rows of data for a table with these columns. Choose a
variety of names with fuzzy matches, overlaps, and similar spellings.
- Name (required, text): Facility display names like "Darrell Community
  Centre" or "Jonathon Access Point". Use people names with similar
  sounds — darrol, daryl, Jonathan, Joe nathan — plus a type of place.
- District (choice): West, East, North, Central, South, Downtown
- City (text): Bayview, Elmwood, Canyon, Greenfield, Birchwood,
  Riverton, Hillcrest, Crestwood, Parkview, Silverlake, Rosemont
- Facility Type (choice): Access Point, Civic Office, Community Hub,
  Recreation Centre, Senior Centre, Library Branch
- Description (multiline text): 2 sentences with keywords like
  "youth programs", "senior wellness", "emergency services",
  "arts workshops", "free parking", "open weekends"
- Phone Number (text): Format +1 555-XXXX
- Image URL (URL): fictional but realistic, starting with http://zava
- Opening Hours (text): Like "Mon-Fri 9:00-17:00, Sat 10:00-14:00"
- Website (URL): fictional but realistic, starting with http://zava
- Capacity (whole number): 50-500
- Is Accessible (yes/no)
- Latitude (decimal): 43.6-43.8 range
- Longitude (decimal): -79.3 to -79.5 range
```

Request CSV output, [import into Dataverse](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/import-data), rename the first column from "Name" to "Facility," and you're in business.

![Facilities table imported from CSV](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/TableImported01.png){: .shadow }
_Your Facilities table, imported and ready to index_

### Get Your Table Indexed
{: #get-your-table-indexed}

OK, here's where it gets real — and where everyone gets stuck the first time. The settings for making searchQuery work are **scattered across five different screens in three different tools**. I've lost hours hunting for these. Here's the treasure map — seriously, bookmark this.

**The Settings Treasure Map:**

| What you're configuring | Where to find it | Why it matters |
|---|---|---|
| Dataverse Search ON/OFF | **PP Admin Center** → Environments → Settings → Features | Without this, searchQuery returns nothing at all |
| Which tables are indexed | **Any Solution** → Overview → Manage Search Index | Tables not here are completely invisible to searchQuery |
| Which columns are searchable | **Table designer** → Views → Quick Find → Find columns | This is what searchQuery can actually match against |
| Which columns are returned | **Table designer** → Views → Quick Find → View columns | This is what comes back in each result |
| Column searchable property | **Column properties** → Advanced options → Searchable | Must be "Yes" for the column to even be eligible |

And now the five steps. I'm going to be blunt — **miss any one and you'll get zero results** or matches only on the primary name column, and no error message will tell you why.

> **Why Quick Find?** searchQuery's scope is controlled by the **[Quick Find view](#glossary)** on each table. "Find columns" = what searchQuery matches against. "View columns" = what comes back in results. Most people don't realize a *view* controls an *API* — see [Glossary](#glossary) for the full picture.
{: .prompt-info }

| # | Step | Where | What happens if you skip it |
|---|------|-------|----|
| 1 | Enable Dataverse Search | PP Admin Center → Settings → Features | searchQuery fails entirely — silently |
| 2 | Add table to a solution | Any solution → Add existing → Table | Won't appear in Manage Search Index |
| 3 | Add table to the search index | Solution → Overview → Manage Search Index | Zero results from searchQuery |
| 4 | Configure Quick Find view | Table → Views → Quick Find → add Find columns and View columns → Save & Publish | Only matches on the primary name column |
| 5 | Set columns as Searchable | Column → Properties → Advanced → Searchable = Yes | Column cannot be indexed at all |

![Enable Dataverse Search](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/searchON.png){: .shadow }
_Step 1: Enable Dataverse Search in Power Platform admin center_

![Manage Search Index](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/03manage%20search%20index.png){: .shadow }
_Step 3: Add your table to the search index_

![Quick Find view configuration](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/ThisDefinesSearchQueryScope.png){: .shadow }
_Step 4: Quick Find — View columns define what's returned, Find columns define what's searchable. This is the scope of your search._

![Searchable column property](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/SearchableColumn.png){: .shadow }
_Step 5: Set columns as Searchable so they can be indexed_

> **Sensitive data tip:** For custom tables with sensitive data, set the "Can enable sync to external search index" property to `False` to prevent the data from being indexed externally.
{: .prompt-warning }

> **The table doesn't have to be in the same solution as your agent.** Manage Search Index is a **[solution](#glossary)**-level feature, but the search index itself is environment-level — once a table is indexed, any agent in the same environment can search it through searchQuery, regardless of which solution the agent lives in.
{: .prompt-info }

> **Impatient? Me too.** After adding a table to the index, there can be a delay before it's searchable. Here's a pro tip I stumbled onto: add the table to **Knowledge** in any Copilot Studio agent. This triggers Dataverse to start indexing right away under the covers. You can remove it from Knowledge afterward — the index persists. You're welcome.
{: .prompt-tip }

### Add Your Search and Tools to Copilot Studio
{: #add-your-tools}

Now for the exciting part. `searchQuery` is an **[unbound action](#glossary)** on the Dataverse connector. To add it:

1. In your Copilot Studio agent, go to **Tools** → **Add a tool**
2. Select the **Dataverse** connector
3. Choose **Perform an unbound action**
4. Select the **searchQuery** action
5. Set authentication to **[Maker-provided credentials](#glossary)**

![Maker credentials](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/maker%20creds.png){: .shadow }
_Maker credentials = no user sign-in required. This is the setting that makes public-facing agents possible._

Switch to **[code view](#glossary)** and paste the complete searchQuery YAML below. Then add a second tool — the standard **List Rows** action on the same connector, also with Maker auth — and paste its YAML.

Don't worry about understanding every line yet — that's what the [Design](#design) section is for. For now, just paste and go.

> **ManualTaskInput vs AutomaticTaskInput:** In the YAML below, `ManualTaskInput` = you set the value, it stays fixed. `AutomaticTaskInput` = the orchestrator fills it dynamically from conversation context. See [Glossary](#glossary) for details.
{: .prompt-info }

**searchQuery Tool — Complete YAML:**

```yaml
kind: TaskDialog
inputs:
  - kind: ManualTaskInput
    propertyName: organization
    value: https://kz.crm.dynamics.com

  - kind: ManualTaskInput
    propertyName: actionName
    value: searchquery

  - kind: AutomaticTaskInput
    propertyName: item.search
    name: implicit search words
    description: >-
      Inferred keywords, partial names, and descriptive phrases from
      the user's question and from context. With additional generated
      relevant spelling variations and word splitting and synonyms.
      Focus on: facility names, place names, district names, service
      types, and descriptions user mentions. Combine multiple terms
      with spaces or commas for broader matches. Not full sentences.
    inputSettings:
      validation: =Topic.Input.item.search <> "police"
      invalidPrompt:
        activity: For the Police, please leave the chat and call 911
        mode: Strict

  - kind: ManualTaskInput
    propertyName: item.entities
    value: >-
      [{"Name": "crc57_facility1",
        "SelectColumns": ["crc57_facility","crc57_facilitydescription",
          "crc57_city","crc57_district","crc57_facilitytype",
          "crc57_phonenumber"],
        "SearchColumns": ["crc57_facility","crc57_city",
          "crc57_facilitydescription"]}]

  - kind: AutomaticTaskInput
    propertyName: item.filter
    name: implicitfilter
    description: |-
      Generate a Dataverse OData filter expression ONLY when the user
      request or conversation context clearly implies a filtering
      criterion.

      DO NOT ask the user any follow-up questions.
      DO NOT invent filters.
      DO NOT apply a filter unless the criterion is explicitly or
      unambiguously implied.

      If no clear filter criterion is present, return:
      statecode eq 0

      Rules:
      - Return ONLY a valid OData filter expression.
      - Do NOT include "$filter=".
      - Use eq, ne, and, or.
      - Wrap string values in single quotes.

      Filterable fields (crc57_facility1 table):
      - crc57_district (Choice): e.g. 'West', 'East', 'North',
        'Central', 'South', 'Downtown'
      - crc57_city (Text): e.g. 'Hillcrest', 'Riverton', 'Bayview',
        'Crestwood'
      - crc57_facilitytype (Choice): e.g. 'Community Hub',
        'Library Branch', 'Recreation Centre'

      If multiple criteria are implied, combine using AND.

  - kind: ManualTaskInput
    propertyName: item.count
    value: true

  - kind: ManualTaskInput
    propertyName: item.top
    value: 10

  - kind: AutomaticTaskInput
    propertyName: item.skip
    name: autogeneratedskip
    description: |-
      Generate a numeric skip value ONLY when the user request or
      conversation context clearly implies pagination (for example:
      "next", "more", "previous results").

      DO NOT ask the user any follow-up questions.
      DO NOT invent pagination.
      DO NOT assume page numbers or page size unless explicitly
      implied by context.

      If no pagination intent is clearly present, return:
      0

      Rules:
      - Return ONLY a non-negative integer.
      - Do NOT include any text or explanation.
      - Skip represents the number of results to skip before
        returning results.
      - Use the same implicit page size assumed by the calling
        action (do not redefine it)

  - kind: ManualTaskInput
    propertyName: item.facets
    value: '["district"]'

modelDisplayName: Search community facilities
modelDescription: |-
  Searches the community facility directory using keywords. This tool
  allows exploring available facilities and returns ranked results
  with relevance scores. Use this tool when the user is looking for
  a facility but doesn't have an exact name or ID.
  The highlights field in the result indicates which words were
  matched. Output to the user must highlight words that match the
  request with bold and italic formatting. If 10 results were already
  shown and the count is higher than 10, tell the user how many there
  are and offer to show 10 more.

action:
  kind: InvokeConnectorTaskAction
  connectionProperties:
    mode: Maker
  operationId: PerformUnboundActionWithOrganization
```

**List Rows Tool — Complete YAML:**

```yaml
kind: TaskDialog
inputs:
  - kind: ManualTaskInput
    propertyName: organization
    value: https://kz.crm.dynamics.com

  - kind: ManualTaskInput
    propertyName: entityName
    value: crc57_facility1s

  - kind: AutomaticTaskInput
    propertyName: "'$filter'"
    name: Row id
    description: |-
      This is an odata filter query that selects the rows for the
      given guid's. Use the crc57_facility1id value of the facilities
      the user selected or the highest-ranked matches. id format is
      like "5c1a1870-a419-f111-8342-7ced8..."

modelDisplayName: Get full facility details
modelDescription: |-
  Retrieves complete record for specific facilities using row ID.
  Use this tool AFTER the search tool has identified one or many
  facilities the user is interested in. Output: For the location,
  give a clickable bing maps link instead of raw coordinates.
  Present the output as a facility card html: name, district, city,
  type, phone, hours, website, and whether it's accessible.
  If an image URL is available, include it.

action:
  kind: InvokeConnectorTaskAction
  connectionProperties:
    mode: Maker
  operationId: ListRecordsWithOrganization
```

**Agent Instructions** — these go in your agent's top-level **[system instructions](#glossary)**. Keep them simple. Trust me, the tool descriptions do the heavy lifting:

> *When listing facilities, always show the facility name, district, and type. If multiple results match, present the top 3 and ask which one the user is interested in. Use "Get full facility details" to get phone, hours, and photos when the user wants more detail.*

That's it. Two tools, two descriptions, a short instruction. **It works.**

> **Heads up — silent failures are the enemy here.** Wrong **[logical name](#glossary)** in the entities JSON, columns missing from the search index, or omitting `SelectColumns` entirely — all of these fail silently with zero results and no error message. If your agent returns nothing, check the logical names first. I learned this the hard way.
{: .prompt-danger }

You now have a working agent. But working and *intelligent* are two different things — and the gap between them is the most interesting part of this whole pattern. Let's go there.

---

## Design Patterns for Data in Copilot Studio
{: #design}

This is my favorite section, and it's where most of the thought leadership in this blog lives.

Setup got the tool running. But here's the thing most people don't realize: **the orchestrator doesn't see connector internals.** It doesn't know you're calling Dataverse. It doesn't see your table schema. All it sees is your tool name, your tool description, and your input descriptions. That's the entire interface between the AI and your structured data.

Every single word you put in those fields directly changes what the agent does. You're not configuring a connector. You're **programming an intelligent agent through natural language** — and the results are dramatically different depending on how much thought you put in.

Let me show you what I mean.

### Your Tool Name Decides Routing

The `modelDisplayName` in the YAML is what the orchestrator sees when choosing which tool to call — it's the tool's name in the orchestrator's "menu" of available tools. We named ours "Search community facilities" — and that tells the orchestrator exactly what this tool is for and when to reach for it.

Now imagine you'd left it as "Perform Unbound Action." The orchestrator would have no idea what this tool does. It would guess. And guessing means misrouting, which means your agent calls the wrong tool or doesn't call any tool at all. **Misnamed tools and inputs are a top cause of agent failures.** Name every tool after its *business function*, not its connector origin.

> **This applies to List Rows too.** We renamed it to "Get full facility details." Now the orchestrator understands: use this tool when the user wants the complete record for a specific facility, not when they're still exploring. That distinction — exploring vs. retrieving — is the entire two-tool design.
{: .prompt-tip }

### Your Tool Description Is the Tool's Brain

This is where it gets really interesting. Look at the `modelDescription` we wrote for searchQuery:

```
Searches the community facility directory using keywords. This tool
allows exploring available facilities and returns ranked results with
relevance scores. Use this tool when the user is looking for a
facility but doesn't have an exact name or ID.
The highlights field in the result indicates which words were matched.
Output to the user must highlight words that match the request with
bold and italic formatting. If 10 results were already shown and the
count is higher than 10, tell the user how many there are and offer
to show 10 more.
```

Read that again carefully. This description is doing *three things at once*: it tells the orchestrator **when** to use the tool ("looking for a facility but doesn't have an exact name"), it defines **output formatting** ("highlight matched words with bold and italic"), and it programs **pagination behavior** ("if 10 shown and count is higher, offer more").

The orchestrator reads this description every single time it considers calling your tool. **The description IS the tool's intelligence** — a micro-instruction set that runs on every invocation. Write a better description, get a smarter tool call. It really is that direct.

> **The same technique powers List Rows.** Its description says "present the output as a facility card html" and "give a clickable Bing maps link instead of raw coordinates." We didn't write any formatting code. The model's general knowledge handles it. Your structured data + the model's knowledge + a thoughtful description = polished output with zero code. That moment when coordinates turn into clickable map links? That's a one-line instruction in the description making it happen.
{: .prompt-info }

### Input Descriptions — This Is Where the Real Magic Happens

Each dynamic input has a description that acts as a micro-instruction. The orchestrator reads it, interprets the user's message, and generates the right value. This is where thoughtful design *dramatically* changes agent quality — and where I spent most of my tuning time.

#### The Search Input — Making the Index Smarter Than It Is

```yaml
description: >-
  Inferred keywords, partial names, and descriptive phrases from
  the user's question and from context. With additional generated
  relevant spelling variations and word splitting and synonyms.
  Focus on: facility names, place names, district names, service
  types, and descriptions user mentions. Combine multiple terms
  with spaces or commas for broader matches. Not full sentences.
```

Read that description one more time. You're not just asking the orchestrator for keywords — you're instructing it to generate **spelling variations, word splitting, and synonyms** *before the query even reaches the API*.

Here's why this matters: the Dataverse search index already does fuzzy matching on its own. "Darrl" will find "Darrell" at the index level. But this input description adds a second layer on top — the AI pre-enriches the search terms before the index even sees them. So the orchestrator might send "Daryl, Darrol, Darrell, community center" instead of just the raw misspelling.

> **You're making the index smarter than it actually is.** Two layers of fuzzy coverage working together: AI-powered expansion at the input level, plus the index's own fuzzy matching underneath. I haven't seen this technique documented anywhere, and it meaningfully improves result quality.
{: .prompt-tip }

#### The Filter Input — An Inline Glossary That Powers NL-to-OData

```yaml
description: |-
  Generate a Dataverse OData filter expression ONLY when the user
  request or conversation context clearly implies a filtering
  criterion.

  DO NOT ask the user any follow-up questions.
  DO NOT invent filters.
  ...
  Filterable fields (crc57_facility1 table):
  - crc57_district (Choice): e.g. 'West', 'East', 'North',
    'Central', 'South', 'Downtown'
  - crc57_city (Text): e.g. 'Hillcrest', 'Riverton', 'Bayview'
  - crc57_facilitytype (Choice): e.g. 'Community Hub',
    'Library Branch', 'Recreation Centre'
```

This is the NL-to-OData pattern in action, and it's one of the most powerful techniques in this whole blog. The input description **is** the glossary — it lists every filterable field, its type, and its valid values. When a user says "show me community hubs in the West," the orchestrator reads this glossary and generates `crc57_district eq 'West' and crc57_facilitytype eq 'Community Hub'`. Natural language in, valid **[OData](#glossary)** filter expression out. No code. No Power Automate flow.

And notice the guardrails baked right into the description: "DO NOT ask follow-up questions. DO NOT invent filters. DO NOT apply a filter unless the criterion is explicitly or unambiguously implied." Without these, the orchestrator might hallucinate filter values or pepper the user with unnecessary questions. The description isn't just informative — it's **behavioral constraints** that keep the agent professional.

> **The default filter is a subtle but important design choice.** When no filter criterion is implied, the description says to return `statecode eq 0` — active records only (see **[statecode](#glossary)**). This prevents the agent from surfacing deleted or deactivated records when someone is just browsing. Small detail, big impact on trust.
{: .prompt-info }

#### Get Next 10 items — Pagination Without Code

The `item.skip` input detects pagination intent from phrases like "next," "more," or "show me the rest." Combined with `item.top` set to 10, this gives you paginated results driven entirely by conversation — no variables, no counters, no code. The user says "next" and it just works.

### How to use Entities JSON — Controlling the Search Scope
{: #entities-json}

```json
[{
  "Name": "crc57_facility1",
  "SelectColumns": ["crc57_facility", "crc57_facilitydescription",
    "crc57_city", "crc57_district", "crc57_facilitytype",
    "crc57_phonenumber"],
  "SearchColumns": ["crc57_facility", "crc57_city",
    "crc57_facilitydescription"]
}]
```

> **This distinction trips up literally everyone — and it's barely documented.** `SearchColumns` = what searchQuery **matches against** when it fuzzy-searches. `SelectColumns` = what searchQuery **returns** in each result. A column can be returned without being searchable. And a column not in either list requires List Rows to retrieve.
{: .prompt-warning }

In our config: `crc57_district`, `crc57_facilitytype`, and `crc57_phonenumber` are in SelectColumns but **not** in SearchColumns. The agent displays them in results, but typing a district name won't fuzzy-match against those columns. To narrow by district, the orchestrator uses the `filter` input instead — and that works because the filter glossary we wrote lists districts as a filterable field with valid values. See how it all connects?

Columns not in SelectColumns at all — image URL, coordinates, opening hours — require **List Rows**. That's by design: searchQuery finds the right facilities, List Rows completes the picture.

### Static vs Dynamic Inputs — Design your Inputs

| Input | Static or Dynamic | What it controls |
|-------|-------------------|------------------|
| `organization` | Static (required) | Your Dataverse environment URL |
| `actionName` | Static (required) | Always `searchquery` |
| `item.search` | **Dynamic** (required) | AI extracts and enriches keywords from the user's query |
| `item.entities` | Static (usually) | Locks down which table and columns to search. Make dynamic only if your agent needs to pick between multiple tables. |
| `item.filter` | **Dynamic** (optional) | AI generates OData filters from context using the inline glossary |
| `item.count` | Static (optional) | `true` returns total match count for pagination UX |
| `item.top` | Static (optional) | Caps results per call — 10 is good for chat, default 50 is way too many |
| `item.skip` | **Dynamic** (optional) | AI detects pagination intent |
| `item.facets` | Static (optional) | Groups results by field values — results may vary depending on column types |

> **Here's the design pattern in one sentence:** Static inputs lock down **what** you're searching. Dynamic inputs let the AI decide **how** to search. This separation — maker controls the scope, AI controls the execution — is the entire design philosophy.
{: .prompt-tip }

### The PowerFx Guardrail — A Input Value Gate That AI Cannot Open
{: #powerfx-guardrail}

Now here's something that genuinely excites me. Notice the `inputSettings.validation` on the search input:

```yaml
inputSettings:
  validation: =Topic.Input.item.search <> "police"
  invalidPrompt:
    activity: For the Police, please leave the chat and call 911
    mode: Strict
```

This is a **[Power Fx](#glossary)** formula that evaluates the input *before* the API fires. If the formula returns false, the action never executes — the agent returns the `invalidPrompt` message instead. Every time, without exception.

This isn't a prompt-based guardrail that a clever user might talk their way around. It's a **deterministic evaluation**. No amount of jailbreaking, rephrasing, or prompt engineering can bypass a formula check. The AI generates the search terms, Power Fx inspects them, and the gate opens or closes. Period.

> **This pattern works for any keyword interception:** block sensitive terms, require certain terms, validate input format, enforce length limits. Any rule you can express as a Power Fx formula becomes an unbreakable gate on any tool input. I use this everywhere now.
{: .prompt-tip }

### The Chunked Index — Why List Rows Is Essential for Full Data Retrieval
{: #chunked-index}

Here's a fact about searchQuery that I wish someone had told me before I built my first agent with it: the Dataverse search index is powered by Azure Cognitive Search, and it **chunks long text** — meaning it breaks multiline fields into smaller fragments for indexing. When searchQuery returns a result with a multiline Description column, you often get a *fragment* of that text — the relevant chunk — not the whole thing.

This changes everything about the two-tool pattern. **List Rows isn't just nice-to-have — it's essential.** Without it, your agent quotes a snippet and the user wonders where the rest of the answer went.

### When List Rows Returns Too Much — Wrapping It in a Topic
{: #topic-wrapping-listrows}

OK so you know you need List Rows for full records. But here's the next problem: you call List Rows for 5 facilities and each has a multi-paragraph description, opening hours, URLs, coordinates, accessibility info. The combined output could blow right past the agent's **[token window](#glossary)**. Generative orchestration with two standalone tools isn't enough anymore — you need to **intercept the List Rows output and shape it before it reaches the conversation**.

This is where **[topics](#glossary)** become incredibly powerful. Instead of exposing the raw List Rows connector as a tool, you **wrap it inside a topic** — and the topic becomes the tool:

> **The List Rows Topic-Wrapping Pattern:**
>
> 1. **Create a topic** and give it a name and description the orchestrator can understand (e.g., "Get and summarize facility details"). The orchestrator will call this topic instead of the raw connector.
> 2. **Add topic inputs** — for example, the row IDs to fetch. The orchestrator fills these inputs from conversation context automatically — just like it fills tool inputs.
> 3. **Inside the topic, call List Rows** using the Dataverse connector action node — passing the row IDs from the topic input into the `$filter`.
> 4. **Capture the List Rows output in a variable.** This is the key step. The full records — all columns, all rows — are now sitting in a variable inside your topic, not streaming into the conversation.
> 5. **Pass that variable to an [AI Prompt](#glossary)** within the same topic. Give it the variable (the raw records) plus the user's original question as inputs, and tell it to produce a contextual summary: select only what's relevant, not just truncate.
> 6. **The topic outputs the right-sized, relevant result** back to the conversation.
{: .prompt-info }


Why does this matter so much? Because without it, the agent either truncates unpredictably (the LLM just cuts off mid-answer) or chokes on too much data. With the topic wrapper, **you** control what happens to the data between retrieval and response. The connector fetches. The AI Prompt reasons. The topic delivers. That's a mini-agent inside your agent.

> **Topics supercharge connectors.** Wrapping a connector in a topic doesn't just add a processing step — it turns the connector into something smarter than the sum of its parts. The topic has inputs the orchestrator fills intelligently, internal logic that shapes the data, and outputs that are right-sized for the conversation. This is the enterprise-grade pattern for agents that handle real volumes of data.
{: .prompt-tip }

### Planning for Large text Entries: Pre-Added Summary vs On-the-Fly Summary

Two strategies for getting the right answer to the user, and choosing wrong costs you:

**Pre-added summary:** Add a Summary column to your table. Populate it upfront (via batch, flow, or at data entry). searchQuery returns it directly via SelectColumns. Zero extra calls. Fast. Great when you always need the same kind of overview.

**On-the-fly summary:** Use the topic-wrapping pattern with an AI Prompt that takes the full record plus the user's question and generates a tailored answer. The summary changes based on what was asked. More flexible, uses more tokens.

> **Know which one you need before you build.** Pre-added summaries are faster and cheaper. On-the-fly summaries are more flexible. If your users always ask the same kind of question about each record, pre-add. If every question is different, generate on the fly.
{: .prompt-info }

---

## See It Work
{: #see-it-work}

Everything below is from a working agent with the exact YAML shown in Setup. I wanted to show you what happens when real (messy) human input hits a well-designed agent.

### Fuzzy Match: "Darrl" Finds Darrell

> "Is there a Darrl community center in hillcrest?"

The user never came close to spelling it right. But remember — we designed the search input to generate spelling variations *before* the query hits the index, and the index does its own fuzzy matching on top of that. Two layers of coverage, and the result is "Darrol," "Darryl," "Darrel" — all ranked by relevance. No exact match needed.

![Daryl search results](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/darrel.png){: .shadow }
_Fuzzy matching in action — the user doesn't need the exact spelling_

### Senior Centres + Pagination

> "show me senier centres with full info including websites"

Two spelling issues here: "senier" and the British "centres." Watch what happens. The orchestrator corrects "senier" to "senior" at the input level — because the input description says to generate spelling variations. And searchQuery handles "centres" vs "centers" through fuzzy matching at the index level. Two separate layers, both doing their job.

Result: 10 relevant senior centres with full details including websites.

![Senior centres search](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/senior-10itemswithWeb.png){: .shadow }
_Misspelling handled, British spelling matched, full details returned_

Then the user says "show me the next 10" — and the `item.skip` input does its job. Pagination through conversation, no code, no counters.

![Pagination](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/senior%20next%2010%20with%20web.png){: .shadow }
_Pagination: the orchestrator detects "next" and increments skip automatically_

### Youth Search with Map Links

This one's my favorite. Search for "youth" and ask for details — and something delightful happens. The agent transforms raw latitude/longitude coordinates into **clickable Bing Maps links**. How? The coordinates come from List Rows. The formatting instruction comes from the List Rows description we wrote: "give a clickable Bing maps link instead of raw coordinates." And the model's general knowledge handles the URL formatting.

Structured data + model knowledge + a thoughtful one-line instruction = genuine user delight.

![Youth search results](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/works-youth%20search.png){: .shadow }
_Searching for "youth" — facilities with youth programs surface immediately_

![Youth details with map links](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/works-youth%20search-details-maplink.png){: .shadow }
_Full details — including coordinates transformed into working map links_

### The Guardrail in Action

Someone asks about "police." The Power Fx formula evaluates `Topic.Input.item.search <> "police"` — returns false. The action **never fires**. The agent returns the redirect message. Every time, without exception. Deterministic.

![PowerFx guardrail](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/police-guardrail.png){: .shadow }
_The formula returned false. The API never fired. The agent redirected. No way around it._

---

## Go Deeper
{: #go-deeper}

You have a working, well-designed agent. Everything below takes it further  for enterprise-grade use cases, and each one opens up a new design dimension.

### Multi-Table Search in One Call

The `entities` array accepts multiple objects. One searchQuery call can search across multiple indexed tables simultaneously, each with its own SelectColumns and SearchColumns:

```json
[
  {
    "Name": "crc57_facility1",
    "SelectColumns": ["crc57_facility", "crc57_district"],
    "SearchColumns": ["crc57_facility", "crc57_facilitydescription"]
  },
  {
    "Name": "crc57_serviceoffering",
    "SelectColumns": ["crc57_servicename", "crc57_category"],
    "SearchColumns": ["crc57_servicename", "crc57_servicedescription"]
  }
]
```

Results come back ranked together across both tables. The orchestrator sees one unified result set and responds naturally — no stitching required on your side.

### Specialized Tool Instances for Enterprise Grade Performance

Here's a pattern that scales beautifully. Same connector, different instances with configurations. The orchestrator picks the right one based on the user's question. This adds full llm understanding, filter precision, and custom business rules to important categories:

| Tool Name | Default Filter | Description tells the orchestrator... |
|---|---|---|
| **SearchSeniorServices** | `facilitytype eq 'Senior Centre'` | "Use when asking about senior, elder, retirement, or wellness." |
| **SearchYouthPrograms** | `facilitytype eq 'Recreation Centre'` | "Use when asking about youth, children, or after-school." |
| **SearchEmergencyFacilities** | `facilitytype eq 'Access Point'` | "Use for urgent or emergency service requests." |

"My grandmother needs wellness activities" routes to SearchSeniorServices. "Where can my kids go after school?" routes to SearchYouthPrograms. Each instance has its own entities JSON, default filter, description, and auth settings. This is the granular control that makes enterprise agents trustworthy.

### Table Descriptions — Planning for different size of tables

The inline table description glossary in the filter description works beautifully for one table with a handful of fields. But what happens when your Table glossary outgrows the input field?

| Scale | Strategy | Where the glossary lives |
|-------|----------|--------------------------|
| **Small** (1 table, 5-10 fields) | Inline | Tool input description — this is what our demo does |
| **Medium** (2-3 tables, 10-20 fields) | [Child agent](#glossary) | Child agent instructions isolate search context from the top-level conversation |
| **Large** (many fields, complex rules) | [Global variables](#glossary) → AI Prompt → Tool | Curated glossary stored in global variables, fed to an AI Prompt that generates fully-formed queries |

> **You'll know you need the large pattern when:** your input description starts turning into a page-long document with dozens of field descriptions. That belongs in an AI Prompt powered by a global variable, not crammed into a 1,024-character input field.
{: .prompt-info }

### Topic Caching — Stop Repeated API Calls
{: #topic-caching}

This is a different use of topics than the [List Rows wrapping pattern](#topic-wrapping-listrows) we covered in Design. There, the problem was output size — List Rows returned too much data for the token window, so you wrapped it in a topic to intercept and trim. Here, the problem is **API call volume**.

searchQuery has rate limits: **150 requests per minute per organization**. In a multi-turn conversation where every follow-up triggers a new search, you'll burn through that budget fast.

The solution: wrap your searchQuery call in a topic and **cache the search results in a variable**.

1. **First question:** Topic calls searchQuery, stores results in a variable
2. **Follow-up questions:** Power Fx filters over the cached variable (using formulas like `Filter(varResults, district = "West")`) — no new API call
3. **Detail request:** User wants phone or image → *now* call List Rows for the specific row
4. **New search vs follow-up?** Collect that choice in a topic input — the orchestrator fills it correctly!

> **Two topic patterns, two different problems.** The [List Rows wrapper](#topic-wrapping-listrows) solves *output too large* — it intercepts, processes, and right-sizes the data. The searchQuery caching pattern here solves *too many API calls* — it stores and reuses results across turns. Both use topics as intelligent wrappers around connectors, but for completely different reasons.
{: .prompt-info }

### The Highlights Feature— Show Users Why Results Matched

searchQuery returns highlighted text with `{crmhit}` markers showing which terms matched:

```json
"Highlights": {
  "crc57_facility": ["{crmhit}Darrell{/crmhit} W Civics Community Center"],
  "crc57_facilitydescription": ["offers {crmhit}recreation{/crmhit} programs"]
}
```

Your agent can bold the matched terms: "**Darrell** W Civics Community Center." This tells users *why* this result appeared — building trust and saving a follow-up turn.

### Post-Filter vs List Rows Filter — Know the Difference

This comes up constantly, so let me make it crystal clear:

| | searchQuery `filter` (post-filter) | List Rows `$filter` |
|---|---|---|
| **Operates on** | The top-N ranked results (default 50) | The entire table |
| **Complete?** | No — statistical, may miss lower-ranked rows | Yes — every matching row |
| **Best for** | Narrowing discovery ("only in West district") | Exhaustive retrieval ("give me ALL facilities in West") |

> **One-liner to remember:** Discovery = searchQuery post-filter. Census = List Rows.
{: .prompt-info }

### OData Filter Reference

One complex example that exercises the key operators — use the parts you need:

```
crc57_district eq 'West' and crc57_facilitytype ne 'Library Branch'
  and (crc57_city eq 'Bayview' or crc57_city eq 'Riverton')
  and statecode eq 0
```

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `crc57_district eq 'West'` |
| `ne` | Not equals | `crc57_facilitytype ne 'Library Branch'` |
| `and` / `or` | Combine criteria | Use parentheses for grouping |
| `statecode eq 0` | Active records only | Good default for any filter |

For **[lookup columns](#glossary)** in List Rows, use `_fieldname_value eq 'GUID'` to filter by the related record's ID. Note that searchQuery can't follow these cross-table relationships, so this is a List Rows–only technique.

Full parameter XML reference for searchQuery: [Dataverse search query](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query).

---

## Glossary
{: #glossary}

Quick reference for Copilot Studio and Dataverse terms used throughout this post.

| Term | What it means |
|------|---------------|
| **AI Prompt** | A Copilot Studio node you can add inside a topic that makes a single LLM call with custom instructions. You define the prompt, pass in variables as inputs, and get structured output. Think of it as a mini-GPT call scoped to one task. |
| **Child agent** | A sub-agent called by your main agent. Useful for isolating complex logic (like a large glossary) so the main agent's instructions stay clean. Also called an "autonomous agent" in some docs. |
| **Code view** | The raw YAML editor behind Copilot Studio's visual tool configuration. Toggle it with the `</>` icon in the top-right of the tool configuration panel. Paste the YAML from this blog here. |
| **Global variables** | Variables in Copilot Studio that persist across topics for the entire conversation session. Useful for storing glossaries, cached results, or user preferences that multiple topics need to access. |
| **Knowledge** | Copilot Studio's built-in way to ground an agent on data sources (Dataverse tables, SharePoint, websites). Provides great intelligence out of the box but requires **user authentication** — the end user must sign in. |
| **List Rows** | The standard Dataverse connector action that retrieves table rows using OData filter queries. Deterministic and exhaustive — returns every matching row. Used alongside searchQuery to get full records after search narrows the results. |
| **Logical name** | The internal system name for a Dataverse table or column (e.g., `crc57_facility` instead of "Facility"). Find it in the table designer: open a column → **Advanced options** → **Logical name**. YAML and API calls always use logical names, not display names. |
| **Lookup column** | A Dataverse column that references a row in another table — like a "Parent Organization" field pointing to an Accounts table. In List Rows OData filters, use `_fieldname_value eq 'GUID'` to filter by the related record's ID. |
| **Maker auth** | Authentication mode where the connector runs using *your* credentials (the maker's), not the end user's. The person chatting with the agent never signs in. This is the setting that makes public-facing and B2C agents possible. |
| **ManualTaskInput** | A YAML input type where *you* set the value and it stays fixed every time the tool runs — like the environment URL, table name, or result count. The AI never changes it. |
| **AutomaticTaskInput** | A YAML input type where the orchestrator fills the value dynamically on every call, based on the user's message and conversation context. This is where the AI does its work — generating search terms, OData filters, or pagination values. |
| **MCP** | Model Context Protocol — a standard for exposing APIs as tools that the agent auto-orchestrates. Great for rapid prototyping and maker productivity, but offers less granular control over which tables, columns, and business rules the agent can access. |
| **OData** | Open Data Protocol — a standard query language used by Dataverse for filtering and retrieving data. Filter expressions look like `crc57_district eq 'West' and statecode eq 0`. Used in both searchQuery's `item.filter` and List Rows' `$filter`. |
| **Orchestrator** | The AI reasoning layer in Copilot Studio that decides which tool to call, what values to fill in each input, and how to present results to the user. You don't write code for it — you influence its behavior through tool names, descriptions, and input instructions. |
| **Power Fx** | Microsoft's low-code formula language — think Excel formulas but for the Power Platform. In Copilot Studio, Power Fx is used for input validation (`=Topic.Input.item.search <> "police"`), variable filtering, and conditional logic inside topics. |
| **Quick Find view** | A special view on every Dataverse table that controls which columns participate in quick searches. Dataverse Search (and therefore searchQuery) uses this view to determine its scope: **Find columns** = what searchQuery matches against, **View columns** = what comes back in each result. Configure it in the table designer under **Views**. |
| **Solution** | A container in Power Platform for packaging and managing components (tables, agents, flows, connectors). Solutions let you organize, transport, and deploy components across environments. Manage Search Index is accessed through a solution, but the search index itself is environment-wide. |
| **statecode** | A system field on every Dataverse row indicating its status: `0` = active, `1` = inactive. Filtering by `statecode eq 0` ensures your agent only returns active records. |
| **System instructions** | The top-level instructions for your Copilot Studio agent. Find them in your agent → **Overview** or **Instructions** tab. These tell the orchestrator how to behave in general — tool descriptions handle tool-specific behavior. |
| **Token window** | The maximum amount of text the AI model can process in a single turn — think of it as the model's working memory. When tool output exceeds this, the model truncates unpredictably. The topic-wrapping pattern solves this by shaping data before it reaches the conversation. |
| **Topic** | A named unit of conversation logic in Copilot Studio. Topics can have inputs, internal steps (calling connectors, setting variables, running formulas), and outputs. With generative orchestration enabled, topics become "agentic" — the orchestrator can call them like tools, filling their inputs from conversation context. |
| **Unbound action** | A Dataverse connector action that isn't tied to a specific table. Most actions (List Rows, Get Row) are "bound" to a table. Unbound actions like searchQuery operate at the environment level — querying the entire search index across all indexed tables. Find it under **Perform an unbound action** in the connector action list. |

---

## Wrap-Up
{: #wrap-up}

We started with an agent that couldn't find "Darrell" when someone typed "Darol." We ended with fuzzy matching, ranked results, clickable map links, deterministic guardrails, and right-sized output — all without a single user signing in. Two tools. Thoughtful descriptions. A handful of deliberate design decisions that visibly change behavior.

The search index was there all along. The real craft is in how you wield it.

What will you build with it?

### Where Else This Shines

The facility directory is one example, but the searchQuery + List Rows pattern works anywhere you have text-heavy tables and users who don't speak in exact column values:

- **D365 Knowledge Base search** — KB articles have multiline rich text that Dataverse search can index. Build a public-facing support agent that fuzzy-searches article *content*, not just titles.
- **Attachments** — Dataverse search indexes the first ~2 MB of text from file attachments. Attached PDFs become searchable through the same tool — no separate upload needed.
- **Product catalogs** — "Do you have something like a blue standing desk?" Fuzzy match on descriptions, return images and prices from List Rows.
- **Incident lookup** — "Any recent issues with water in Brooklyn?" Fuzzy search on incident descriptions, ranked by relevance, post-filtered by location.

### Further Reading

- [Dataverse search overview](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/overview)
- [searchQuery parameters and response format](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query)
- [Configure Dataverse search for your environment](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization)
- [Select searchable fields and filters for each table](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization#select-searchable-fields-and-filters-for-each-table)

---

> *This post describes current platform behavior as of March 2026 and does not represent roadmap commitments. Features and capabilities may change.*

---


