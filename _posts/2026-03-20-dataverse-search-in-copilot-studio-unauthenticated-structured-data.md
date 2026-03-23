---
title: "Too Much Table Knowledge to Filter? Copilot Studio Turns Dataverse Search Into a Discovery Agent — and It Works Unauthenticated!"
date: 2026-03-20
categories: [copilot-studio, dataverse]
tags: [Copilot Studio, Dataverse, Search, Unauthenticated, searchquery, Agentic, enterprise-grade, NL2Query, B2C]
description: "Use Dataverse searchQuery as an unbound action in Copilot Studio to build fuzzy, ranked search over structured data — no user sign-in required. Includes copy-paste tool configs, the settings treasure map, and enterprise patterns you won't find anywhere else."
author: KarimaKT
image:
  path: /assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/00UnboundDVSearchinMCS.png
  alt: "Agentic Dataverse search over structured data — unauthenticated"
---

**You've got Dataverse tables with thousands of rows** — community facilities, service directories, product catalogs, incident logs — and you want a Copilot Studio agent that helps people *find things* in it. Sounds straightforward, right?

Then your first tester types "Is there a Darol center near downtown?" and the agent returns... nothing. Because the facility is called "Darrell W Civics Community Center," and your filter was looking for an exact match.

This is the blog where we fix that.

We'll use **Dataverse search** (`searchQuery`) — a fuzzy, ranked, relevance-based search that works through a regular Dataverse connector in Copilot Studio. It finds "Darrell" when someone types "Darol." It ranks the best matches. And — here's the part that changes everything for public-facing agents — **it works unauthenticated**.

By the end of this post, you'll have a working agent with two tools and a search experience that feels completely conversational — and that your users will actually enjoy.


> **💡 Three things you'll find in this blog that aren't in any docs**
>1. A practical comparison of Dataverse knowledge approaches for agents — Knowledge, List Rows, MCP, and searchQuery — with when each shines and when to move on
>2. The end-to-end design journey from table to working agent, with a settings treasure map that brings order to five scattered configuration screens
>3. Design techniques that combine Copilot Studio's orchestration with Dataverse's versatility — deterministic guardrails, specialized tool instances, federated search, and glossary scaling patterns

---

## Deep dive into structured Dataverse search with Copilot Studio:

| Section | What You'll Learn | Why You'll Want This |
|---|---|---|
| [**The Landscape**](#the-landscape--where-searchquery-fits) | How searchQuery compares to Knowledge, List Rows, and MCP — and when to reach for each | Stop guessing which approach fits your scenario |
| [**The Concepts**](#the-concepts--what-you-need-to-know) | The two-tool mental model and how the orchestrator turns two connectors into a conversation | Understand *why* this works — including the selectColumns vs searchColumns distinction nobody explains |
| [**Quick Start**](#quick-start--build-it) | Step-by-step build with copy-paste configs, with or without your own table | A working agent in under an hour — plus the **Dataverse settings treasure map** that brings order to scattered configuration |
| [**See It Work**](#see-it-work--live-demos) | Demos: fuzzy matching, pagination, map links, and a **PowerFx guardrail AI can't bypass** | Watch "Darol" match "Darrell" and see a deterministic interception pattern that's genuinely new |
| [**Level Up**](#level-up--advanced-features) | Highlights, filters, and a **practical reference for the entities JSON and OData format** | The search API elements explained with a real example — plus the post-filter vs List Rows distinction that trips everyone up |
| [**Enterprise Patterns**](#enterprise-patterns) | Federated search across environments, glossary scaling, topic caching, and **when MCP, Knowledge, or custom tools are the right call** | Patterns for production agents that aren't documented anywhere else — including multiple specialized instances of the same tool |
| [**Test & Troubleshoot**](#test-your-agent--troubleshoot) | What works, what partially works, what won't work, and why | Avoid the silent failures and roadblocks others hit — including a table of what searchQuery *genuinely cannot do* |
| [**Beyond Directories**](#beyond-directories--wrap-up) | KB articles, product catalogs, incident lookup, and what's next | Where to take this pattern from here |

---

## The Landscape — Where searchQuery Fits

If you've already tried building this agent, you probably hit one of these walls. Let's name them — and importantly, name when each approach *does* shine — so we can make an informed choice.

**OOB Knowledge (DV Tables)** is the easiest path in Copilot Studio — add your Dataverse table, write a glossary, start chatting. It handles query generation and grounded answering out of the box. **It shines for internal productivity agents where users are signed in.** But it has constraints that matter for our scenario:

- Always requires user authentication — no anonymous, no public-facing agents
- Limited to 15 tables per knowledge source
- May truncate or randomize results — not a full, controlled retrieval
- Limited output control over which columns and how many rows come back

> **💡 When to move on from Knowledge:** You need unauthenticated access, full retrieval control, or follow-up input questions from the agent.

**List Rows** gives you full control and works unauthenticated. Fast, deterministic, exhaustive. And with a good tool description, **it's already conversational** — the orchestrator generates OData filters from natural language, retrieves exact records, and presents results naturally. **It shines when users know roughly what they want** and the data can be filtered to a manageable set.

> **💡 When to move on from List Rows:** Users type fuzzy, incomplete, or misspelled queries against a large table, and exact filtering returns either nothing or everything.

**Dataverse MCP** auto-orchestrates search and retrieval with minimal setup. **It shines for speed, exploration, and productivity scenarios** — especially when the user is the maker and controls their own experience. Great for seeing what's possible before investing in custom tools.

> **💡 When to move on from MCP:** You need table scoping, per-tool governance, highlights, or a controlled departmental or B2C agent serving many users.

**What we wished for:** A standalone search that feels smart, powered by a fuzzy relevance engine that gives ranked results, works unauthenticated, and lets the maker control every parameter. It exists — *and it's been in Dataverse all along.*

> These aren't competing options — they're a progression. Many production agents use more than one.


Here's what your finished agent looks like — two tools and a short instruction:

![The finished agent: 2 tools, simple instructions](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/works-toplevel-2%20tools.png){: .shadow }
_Two tools. Simple instructions. A conversational search experience._

---

## The Concepts — What You Need to Know

### Meet searchQuery

`searchQuery` is an **unbound action** on the Dataverse connector. It exposes the Dataverse relevance search index — the same one that powers the search bar in model-driven apps and Dataverse MCP — as a tool you can wire into any Copilot Studio agent.

Here's the mental model:

> **searchQuery** = *"Help me figure out what the user means"*
>
> **List Rows** = *"I know what I'm looking for — go get it"*

They're a team. Search discovers. List Rows retrieves. Together, they give you a fuzzy-to-precise pipeline that feels conversational.

This is the Goldilocks search for structured data: not as rigid as exact filters, not as heavy as vector indexing. Fuzzy enough to understand your users. Fast enough for real-time chat.

### The Orchestrator Elevates the Tools

This is the key idea that makes the whole pattern work.

You're giving a smart orchestrator two well-described tools — and it turns them into a **natural conversation with your structured data**. Here's what happens when a user says "Is there a Darol community center in the west?"

1. **Orchestrator reads tool descriptions** → decides searchQuery is the right first step
2. **Generates keywords** (`darol community`) from natural language — the orchestrator does this, not you
3. **Generates an OData filter** (`crc57_district eq 'West'`) from conversation context
4. **Sends the search**, gets ranked results, decides the top match is worth presenting
5. **Reads List Rows description** → understands that image, hours, and website require a second call → calls it with the GUID
6. **Formats the response** conversationally: name, district, phone, "I also found 2 others — want to see them?"

Two connectors. One orchestrator. A conversation with your data.

> **💡 Note:** List Rows is already conversational on its own. With a good description, the orchestrator generates OData filters from natural language, retrieves exact records, and presents results naturally. searchQuery adds a **fuzzy discovery layer**: when users don't know the exact name, misspell things, or use vague terms, searchQuery finds the right rows first, then List Rows fills in the details.

**Why tool descriptions matter more than you think:** The orchestrator doesn't see the connector internals. It sees YOUR DESCRIPTION. The description IS the tool's intelligence — a micro-instruction set that tells the orchestrator how to interpret context, what format to use, and what rules to follow. Write better descriptions → get smarter tool calls.

### What searchQuery Is — and Isn't

Before you build, set the right expectations. This comes up in every discussion:

| What people assume | What actually happens |
|---|---|
| "It's like vector search" | It's a **fuzzy relevance index** built on Azure Cognitive Search. Keyword-based with intelligent expansion — not embedding-based. Right-sized for structured data. |
| "It returns everything that matches" | It's **statistical, not exhaustive**. It ranks and returns the top results. For completeness, use List Rows. |
| "I need to send the exact term" | It **fuzzy-matches**. "Darol" finds "Darrell." But you send keywords, not natural-language paragraphs. |
| "It replaces List Rows" | They're **complementary**. searchQuery returns indexed columns + row IDs. List Rows gets the full record with all columns. |
| "Dataverse search requires sign-in" | **Not for connector-based tools.** searchQuery via the Dataverse connector works with maker auth — no user sign-in required. |

**Statistical search — who benefits and who doesn't:**

> **Great fit — discovery and exploration:** A citizen types "community center near downtown" → they need the most relevant 3–5 results, not every row. A customer types "blue standing desk" → best matches, not a full inventory dump. A support agent types "printer not connecting" → top KB articles ranked by relevance.
>
> **Not the right fit — completeness and compliance:** A department head needs "all active facilities in the East district" → every row, not a ranked sample. An auditor needs "every incident logged in March" → exhaustive retrieval required.
>
> **💡 Rule of thumb:** If the user says "find me" or "help me find" → searchQuery. If the user says "show me all" or "give me every" → List Rows.

### selectColumns vs searchColumns

This distinction trips people up — and it's not well documented anywhere.

- **searchColumns** = what searchQuery **matches against** (driven by Quick Find "Find columns")
- **selectColumns** = what searchQuery **returns** in each result (driven by Quick Find "View columns")

A column can be in SelectColumns without being in SearchColumns — **returned but not searchable**. In our configuration, `crc57_district`, `crc57_facilitytype`, and `crc57_phonenumber` are all returned in search results so the agent can display them, but typing a district name or phone number won't fuzzy-match against those columns. To narrow by district, the orchestrator uses the `filter` parameter instead — that's why the filter description lists the filterable fields separately.

A column not in SelectColumns at all (like image URL, coordinates, or opening hours) requires **List Rows** to retrieve.



### Why This Changes Everything for Public-Facing Agents

- **Knowledge** always requires user authentication → can't build an anonymous B2C agent
- **searchQuery + List Rows** with maker auth → fully unauthenticated
- **Mixed auth** is possible: search tools unauthenticated, other tools authenticated, all in the same agent

This is often the deciding factor between Knowledge and custom tools for public-facing agents.

---

## Quick Start — Build It

### Choose Your Path

> **Don't have a Dataverse table yet?** Start at [Create Your Test Data](#create-your-test-data) — we'll create one together.
>
> **Already have a table?** Jump to [Get Your Table Indexed](#get-your-table-indexed) — connect what you have.

### Create Your Test Data

If you don't have a table ready, use **M365 Copilot** (not Dataverse Copilot — M365 Copilot has a larger context window and better reasoning over complex generation prompts) to generate a CSV, then import it into Dataverse.

**Prompt to create the table structure and initial data:**

```
create 100 rows of data for a table that has the following column rules. Choose a variety of names that can have fuzzy matches, overlaps, similarities.  - Name (required, text): Facility display names  "Darrell Community Centre" or "Jonathon Access Point". To build the name, Use people names that have similar sounds like darrol, daryl, Jonathan, Joe nathan, or similar spellings plus a type of place. 
- District (choice): West, East, North, Central, South, Downtown
- City (text): City namess are Bayview, Elmwood, Canyon, Greenfield, Birchwood, Riverton, Hillcrest, Crestwood, Parkview, Silverlake, Rosemont 
- Facility Type (choice): Access Point, Civic Office, Community Hub, Recreation Centre, Senior Centre, Library Branch
- Description (multiline text): 2 sentences describing services, programs, and notable features. Include keywords like "youth programs", "senior wellness", "emergency services", "arts workshops", "free parking", "open weekends" add variety.
- Phone Number (text): Format +1 555-XXXX
- Image URL (URL): fictional but realistic url starting with http://zava
- Opening Hours (text): Like "Mon-Fri 9:00-17:00, Sat 10:00-14:00"
- Website (URL): fictional but realistic url starting with http://zava
- Capacity (whole number): Maximum occupancy, range 50-500
- Is Accessible (yes/no): Boolean
- Latitude (decimal): Around 43.6-43.8 range
- Longitude (decimal): Around -79.3 to -79.5 range
```

Request CSV output, import into Dataverse, and rename the first column from "Name" to "Facility."

![Facilities table imported from CSV](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/TableImported01.png){: .shadow }
_Your Facilities table, imported and ready to index_

### Get Your Table Indexed

The settings for making searchQuery work are scattered across five different screens in three different tools. Here's your map — bookmark this.

**The Dataverse Settings Treasure Map:**

| What you're configuring | Where to find it | Why it matters for searchQuery |
|---|---|---|
| Dataverse Search ON/OFF | **PP Admin Center** → Environments → Settings → Features | Without this, searchQuery fails entirely |
| Which tables are indexed | **Any Solution** → Overview → Manage Search Index | Tables not here are invisible to searchQuery |
| Which columns are searchable | **Table designer** → Views → Quick Find → Find columns | Controls what searchQuery matches against |
| Which columns are returned | **Table designer** → Views → Quick Find → View columns | Controls what searchQuery returns in results |
| Column searchable property | **Column properties** → Advanced options → Searchable | Must be "Yes" for column to be eligible |
| Tool configuration | **Copilot Studio** → Agent → Tools → Add tool | Where you wire searchQuery and configure inputs |
| Authentication mode | **Copilot Studio** → Tool → Settings → Authentication | Maker auth = no user sign-in required |
| Kickstart indexing | **Copilot Studio** → Agent → Knowledge → Add table | Forces Dataverse to begin indexing immediately |

Now the five steps. Miss any one and you'll get zero results or matches only on the primary name column:

| # | Step | Where | What happens if you skip it |
|---|------|-------|----|
| 1 | **Enable Dataverse Search** | PP Admin Center → Environments → Settings → Features | searchQuery fails entirely |
| 2 | **Add table to a solution** | Any solution → Add existing → Table | Won't appear in Manage Search Index |
| 3 | **Add table to the search index** | Solution → Overview → Manage Search Index | Zero results from searchQuery |
| 4 | **Add columns to Quick Find view and Find By selections** | Table → Views → Quick Find → add to Find columns → Save & Publish | Find By columns → Else searchQuery only matches the primary name column |
| 5 | **Make Columns Searchable** | Column -> properties | The column cannot be indexed |

> **⚠️ Sensitive data tip:** For custom tables with sensitive data, consider setting the "Can enable sync to external search index" property to `False` to prevent the data from being indexed externally.

> **💡 The table doesn't have to be in the same solution as your agent.** Manage Search Index is a solution-level feature, but indexing is environment-level. Once indexed, searchQuery accesses the environment's search index directly — it doesn't depend on which solution triggered the ingestion.

> **💡 Pro tip — kickstart indexing immediately:** After adding a table to the index, there can be a delay. Add the table to **Knowledge** in any Copilot Studio agent — this triggers Dataverse to start indexing right away under the covers. You can remove it from Knowledge afterward; the index persists.

![Enable Dataverse Search](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/searchON.png){: .shadow }
_Step 1: Enable Dataverse Search in Power Platform admin center_

![Manage Search Index](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/03manage%20search%20index.png){: .shadow }
_Step 3: Add your table and columns to the search index_

![Quick Find view](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/QuickFindView.png){: .shadow }
_Step 4a: Add columns to Find columns — this controls what searchQuery filters by_

![Quick Find view](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/QuickFind-FindBy.png){: .shadow }
_Step 4b: Add columns to Find by columns — this controls what searchQuery matches against_

![Searchable column property](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/SearchableColumn.png) 
{: .shadow }
_Step 5: Make columns searchable so they can be indexed_

> **Common silent failures:**
> - Wrong logical name (display name vs logical name) → silently ignored
> - Column not in the search index or not in Find columns → silently ignored
> - `selectColumns` omitted → results have IDs but no column values to display

### Add the searchQuery Tool

This is the part most people don't know exists. `searchQuery` is an **unbound action** — you access it through a different path in the connector than regular row operations.

1. In your Copilot Studio agent, go to **Tools** → **Add a tool**
2. Select the **Dataverse** connector
3. Choose **Perform an unbound action**
4. Select the **searchQuery** action
5. Set authentication to **Maker-provided credentials** (no user sign-in required)

![Maker credentials](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/maker%20creds.png){: .shadow }
_Set authentication to Maker credentials — no user sign-in required_

>**Start with Name and Description.** The name is crucial in how the orchestrator chooses the Tool to use. The description is also important and can contain additional routing and output formatting instructions.

Here's the complete YAML for the searchQuery tool that you can paste in the tool's code view — this is the deployed configuration. We'll walk through the key parts below.

**searchQuery Tool YAML** (from `searchQuery-tool-yaml.txt`):

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
      [{"Name":"crc57_facility1",
        "SelectColumns":["crc57_facility","crc57_facilitydescription",
          "crc57_city","crc57_district","crc57_facilitytype",
          "crc57_phonenumber"],
        "SearchColumns":["crc57_facility","crc57_city",
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

**Let's unpack the key parts:**



| Input | Kind | What it does |
|-------|------|-------------|
| `organization` | Static | Your Dataverse environment URL. Select from the dropdown or paste the URL. |
| `actionName` | Static | Always `searchquery` — this is the unbound action name. |
| `item.search` | 🤖 Dynamic | The orchestrator infers keywords from the user's question. The description teaches it to extract names, places, and add spelling variations. |
| `item.entities` | Static | Defines WHERE to search and WHAT to return (see breakdown below). |
| `item.filter` | 🤖 Dynamic | The orchestrator generates OData filters from conversation context. The description lists filterable fields and their valid values — this IS the glossary. |
| `item.count` | Static | Always `true` — returns total match count. |
| `item.top` | Static | `10` — caps results for conversational UX. |
| `item.skip` | 🤖 Dynamic | The orchestrator detects pagination intent ("next", "more"). |
| `item.facets` | Static | Optional — `["district"]` groups results by district. |

**The entities JSON — the heart of the configuration:**

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

Notice what's in SelectColumns but NOT in SearchColumns:
- `crc57_district` — **returned but not searchable** (you can filter on it, but typing "West" won't match it in fuzzy search)
- `crc57_facilitytype` — **returned but not searchable** (same — use the filter parameter instead)
- `crc57_phonenumber` — **returned but not searchable** (typing a phone number won't find a facility)

And what's NOT in either list (requires List Rows):
- `crc57_imageurl`, `crc57_openinghours`, `crc57_websiteurl`, `crc57_capacity`, `crc57_accessibility`, `crc57_latitude`, `crc57_longitude`

> **💡 The pattern:** Static inputs lock down *what* you're searching (entities, table, columns). Dynamic inputs let the AI fill *how* to search (keywords, filters, pagination). Optional inputs (`facets`, `count`, `top`) enhance the experience but the tool works without them.


### Add List Rows for Full Details

searchQuery finds the right facilities and returns their IDs and indexed columns. But your users want to see photos, know the opening hours, visit the website, or get directions. That's the List Rows step.

> **💡 Naming matters for orchestration.** Rename List Rows to describe the business function, not the data source. "Get full facility details" routes better than "List Rows" because the orchestrator understands the purpose. Misnamed tools and inputs are a main cause of request failures.

**List Rows Tool YAML** (from `list-rows-tool-yaml.txt`):

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

Three inputs — that's it. The `$filter` is dynamic so the orchestrator can construct OData queries using the row GUIDs from search results. Authentication is **Maker credentials** — same unauthenticated pattern as the search tool.


### Agent Instructions

Keep the top-level instructions simple. The tool descriptions do most of the work. Your instructions set some general display rules:

> *When listing facilities, always show the facility name, district, and type. If multiple results match, present the top 3 and ask which one the user is interested in. Use the "Get full facility details" tool to get phone, hours, and photos when the user wants more information about a specific facility.*

That's it. Two tools, two descriptions, a short instruction.

---

## See It Work — Demo Screenshots

### The Fuzzy Match: "Darol" → Darrell

**The user asks:**

> "Is there a Darrl community center in hillcrest?"

**What happens under the covers:**

1. **Orchestrator reads the tool descriptions** and decides searchQuery is the right first step
2. **Constructs the search request:** search term `"darrl"`, scoped to `crc57_facility1`
3. **searchQuery returns ranked results** — "Darrl" matched "Darrol," "Darryl," and "Darrel" through fuzzy matching. The user never had to spell it right.

![Daryl search](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/darrel.png){: .shadow }
_Darrl search  shows fuzzy matches._


### Senior Centres with Full Info and Pagination

Here's another test from the working agent. The user asks:

> "show me senier centres with full info including websites"

Notice: "senier" is misspelled, and "centres" uses British spelling. Two layers of coverage kick in:
- The orchestrator corrects "senier" to "senior" at the input level (it's an obvious misspelling)
- searchQuery handles "centres" vs "centers" through fuzzy matching (it's not an obvious misspelling — both are valid spellings)

The result: 10 relevant entries, correctly matching "senior" rather than "centre," with full information including websites.



![Senior centres search](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/senior-10itemswithWeb.png){: .shadow }
_Senior centres search returns relevant results with full info and websites_

**The user follows up:** "show me the next 10" — and pagination works correctly.

![Pagination](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/senior%20next%2010%20with%20web.png){: .shadow }
_"Show me the next 10" — pagination works correctly_

### Youth Search → Map Links

Search for "youth" and the agent returns facilities offering youth programs. Ask for more details, and something delightful happens — the agent transforms latitude and longitude coordinates into **working map links**.

This is the model's general knowledge working alongside your structured data. The coordinates come from List Rows; the model knows how to format them into clickable map URLs. Sometimes model knowledge, when wielded well through good tool descriptions, is very worthwhile.

![Youth search results](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/works-youth%20search.png){: .shadow }
_Searching for "youth" — relevant facilities with youth programs_

![Youth details with map links](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/works-youth%20search-details-maplink.png){: .shadow }
_Full details with coordinates transformed into working map links_

### The Guardrail: PowerFx Stops What AI Can't

Here's a pattern that's not widely known. In the search input's advanced settings, you can add a **validation** using a Power Fx formula. From the YAML:

```yaml
inputSettings:
  validation: ==Not("police" in Lower(Topic.Input.item.search)
  invalidPrompt:
    activity: For the Police, please leave the chat and call 911
    mode: Strict
```

If a user asks for "police" — the search action **will not run**. Instead, the agent tells the user to call 911.

> **⭐ This is a deterministic guardrail.** It's not a prompt instruction that a clever user can talk around. It's a Power Fx formula that gates the API call before it executes. The AI generates the search keywords, but the formula evaluates them before the action fires. No amount of prompt engineering can bypass a formula that returns `false`.

This pattern works for any keyword-based interception: block sensitive terms, require certain terms to be present, or validate input format — all deterministically, all before the API is called.

![PowerFx guardrail](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/police-guardrail.png){: .shadow }
_PowerFx guardrail: deterministic interception that AI can't bypass_

---

## Level Up — Advanced Features

You have a working agent. Now let's go deeper into what each parameter does and when to use it.

### All searchQuery Inputs — Your Reference

The YAML in the Quick Start showed every input. Here's what each one does and how to decide:

| Input | Required? | Static / Dynamic | What it does |
|-------|-----------|-------------------|-------------|
| `organization` | Yes | Static | Your Dataverse environment URL. |
| `actionName` | Yes | Static | Always `searchquery`. |
| `item.entities` | Yes | Static | Defines which table(s), which columns to return, which to match against. |
| `item.search` | Yes | 🤖 Dynamic | AI infers keywords from the user's question. The description teaches it what to extract. |
| `item.filter` | Optional | 🤖 Dynamic | AI generates OData filters from conversation context. The description lists filterable fields — this IS the glossary. |
| `item.top` | Optional | Static: `10` | Caps results per page. Default is 50 — too many for chat. |
| `item.count` | Optional | Static: `true` | Returns total match count ("I found 27 matching facilities"). |
| `item.skip` | Optional | 🤖 Dynamic | AI detects pagination intent ("next", "more"). |
| `item.facets` | Optional | Static | Groups results by field values (e.g., `["district"]`). See note below. |

> **💡 When to make `entities` dynamic:** When your agent searches multiple tables and the orchestrator needs to pick which one based on the question. For single-table agents, keep it static.

For the full parameter reference: [Dataverse search query](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query).

> Note that for dynamic queries, giving the agent a natural-language description along with the logical name of each column creates the **Powerful Glossary** that turns query generation into an agentic task. This can be done at the top level, in a child agent, or directly in a dynamic input description.

### Facets - Group and drill down

The `item.facets` input can group results by field values (e.g., by district) and return counts — conceptually like "I found 27 facilities — 8 in West, 6 in North." This is a search API capability worth knowing about, but results may vary depending on your data and column types. Only non-text columns (Choice, Number, Date, etc.) can be used as facets. If you want to experiment, start with `["district"]` and see what you get.

### Highlights: Show Users Why Results Matched

searchQuery returns highlighted text with `{crmhit}` markers showing exactly which terms matched:

```json
"Highlights": {
  "crc57_facility": ["{crmhit}Darrell{/crmhit} W Civics Community Center"],
  "crc57_facilitydescription": ["offers {crmhit}recreation{/crmhit} programs for all ages"]
}
```

Your agent can bold the matched terms:

> **Darrell** W Civics Community Center — "offers **recreation** programs for all ages"

This does two things: it tells the user *why* this result appeared (building trust), and it confirms whether this is actually what they were looking for (saving a follow-up turn).

### Post-Filters vs List Rows: Know the Difference

This distinction trips people up. Here's the clarity:

> **Post-filter** (the `filter` parameter on searchQuery): Narrows the **already-ranked result set** — not the full table. If searchQuery's top 50 results are mostly in West, filtering for "East" may return very few — not because East facilities don't exist, but because they ranked lower in that particular search.
>
> **List Rows filter** (OData `$filter`): Filters the **entire table** exhaustively. Every row that matches the filter is returned. Deterministic, complete, no ranking involved.

| | Post-filter (searchQuery) | List Rows filter |
|---|---|---|
| **Operates on** | Top-N ranked results (default 50) | Entire table |
| **Complete?** | No — statistical, may miss rows that ranked low | Yes — every matching row |
| **Fuzzy?** | Applied after fuzzy search | No — exact OData match only |
| **Best for** | Narrowing discovery results ("only in West") | Exhaustive retrieval ("all active facilities in West") |
| **Example** | User browsed search results, wants to filter by district | Agent needs every row matching a specific criterion |

> **💡 When does this matter?** If your use case requires *completeness* — "show me ALL facilities in the East district" — use List Rows, not searchQuery with a post-filter. searchQuery is for *discovery* ("help me find something"), not *census* ("give me everything").

### The Entities JSON and OData Filter: A Practical Reference

Rather than reprint the full API reference (that's what [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query) is for), here's one realistic example that exercises the key elements — use the parts you need.

**The entities JSON — explained:**

```json
[{
  "Name": "crc57_facility1",
  "SelectColumns": ["crc57_facility", "crc57_facilitydescription",
                     "crc57_city", "crc57_district", "crc57_facilitytype",
                     "crc57_phonenumber"],
  "SearchColumns": ["crc57_facility", "crc57_city",
                     "crc57_facilitydescription"],
  "filter": "crc57_district eq 'West' and statecode eq 0"
}]
```

| Element | What it does | How to get it right |
|---------|-------------|---------------------|
| `Name` | The table's **logical name** (not display name) | Find it in table properties. Get this wrong → silent failure, zero results. |
| `SelectColumns` | What searchQuery **returns** in each result | Only columns in the search index (View columns) are eligible. The row ID is always returned implicitly. |
| `SearchColumns` | What searchQuery **matches against** | Only columns in Find columns are eligible. Fewer = more focused matching. |
| `filter` | **Per-entity OData post-filter** applied to this table's results | Different from the global `filter` parameter, which applies across all entities. |

> **💡 You can search multiple tables in one call!** The `entities` array accepts multiple objects. One searchQuery can search across Facilities AND ServiceOfferings simultaneously — each with its own selectColumns, searchColumns, and per-entity filter. The results come back ranked together.

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

**The OData filter — explained:**

Here's one complex example that exercises the key operators:

```
crc57_district eq 'West' and crc57_facilitytype ne 'Library Branch' and (crc57_city eq 'Bayview' or crc57_city eq 'Riverton') and statecode eq 0
```

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `crc57_district eq 'West'` |
| `ne` | Not equals | `crc57_facilitytype ne 'Library Branch'` |
| `and` / `or` | Combine criteria | Use parentheses for grouping |
| `statecode eq 0` | Active records only | Good default for any filter |

> **💡 For lookup columns in List Rows:** When filtering by a lookup (related table), use `_fieldname_value eq 'GUID'`. Example: if Facilities has a lookup to a Region table, filter as `_crc57_regionid_value eq '5c1a1870-a419-...'`. This lets List Rows follow relationships that searchQuery can't traverse.

### Deterministic Guardrails with PowerFx

Expanding on the [demo above](#the-guardrail-powerfx-stops-what-ai-cant) — the pattern is versatile:

- **Block by keyword:** `Not("police" in Lower(Topic.Input.item.search))` — topic won't run, agent redirects
- **Require terms:** `"facility" in Lower(Topic.Input.item.search)` — ensure searches stay on-topic
- **Format validation:** `Len(Topic.Input.item.search) > 2` — block single-character searches that return noise

These are applied **before** the API call, not after. The action never fires if the formula returns `false`. No amount of prompt engineering can bypass a formula evaluation.

---

## Enterprise Patterns

### Glossary Scaling — From Inline to AI-Prompt-Powered

Turning natural language into a great searchQuery (or OData filter, or any structured query) requires the orchestrator to know your schema: field names, types, valid values, and relationships. That knowledge is your **glossary**. How you deliver it depends on the complexity of your project.

**Level 1: Inline in the input description** (small projects)

For 1 table with 5–10 fields, put the glossary directly in the tool input description — exactly what this blog's demo does. The orchestrator sees it right where it generates the value. No extra hops.

This works up to about 500 characters of glossary within the 1,024-character input description limit. Beyond that, it crowds out the actual instruction.

**Level 2: Child agent instructions** (medium projects)

For 2–3 tables with 10–20 fields, wrap your tools into a **child agent** (e.g., "Facility Search Agent") and put the full glossary in the child agent's instructions. The child agent always has the glossary in context and can do more with it — smarter input population, output formatting, multi-step reasoning before calling the tool.

**Bonus:** This isolates the search context (browsing state, pagination, cached results) from the top-level conversation. The orchestrator stays clean.

**Level 3: Global variables → AI Prompt → Tool** (large/complex projects)

For many columns across multiple tables with complex rules:

1. **Curate lean glossaries per task** — don't dump the full 50-column schema. Pick the 8–12 fields that matter for each tool's job. Store each glossary in a **global variable** (e.g., `var_facilitySearchGlossary`).
2. **Route the right glossary to an AI Prompt** that generates the fully-formed query — receiving the user's question, the glossary, query rules, and output format.
3. **Pass the AI Prompt output directly to the tool** — tool inputs become simple pass-throughs, not reasoned.

```
Step 1 — User asks: "civic offices with youth programs, not in the north"

Step 2 — AI Prompt receives:
  • User question
  • Glossary variable with field names, types, values, rules
  • Instructions: "Generate a searchQuery call. Return JSON."

Step 3 — AI Prompt returns:
{
  "search": "civic youth programs",
  "filter": "crc57_district ne 'North' and crc57_facilitytype eq 'Civic Office'",
  "entities": [{"Name":"crc57_facility1","SelectColumns":["crc57_facility",
    "crc57_district","crc57_facilitydescription"],
    "SearchColumns":["crc57_facility","crc57_facilitydescription"]}],
  "top": 10
}

Step 4 — Each field is passed to searchQuery. No guessing, no inline
generation — just execution.
```

> **💡 When you know you need Level 3:** If your input description is turning into a page-long document with rules, constraints, conditional logic, and dozens of field descriptions — that belongs in an AI Prompt with the glossary in a global variable, not crammed into a 1,024-char input field.


![AI Prompt with Dataverse](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/aipromptwithDataversefullrowquery.png){: .shadow }
_Level 3: AI Prompt generates fully-formed queries from glossary variables_

**Why not MCP for the glossary?** The Dataverse MCP server fetches schema on the fly — calling `describe_table` and `list_tables` to bring column metadata into context. This sounds convenient, but:

- **Schema only, no descriptions:** MCP fetches column names and types, but not your domain-specific values, known ranges, business rules, or examples
- **Constantly re-fetches:** each query may trigger a schema lookup, burning tokens and adding latency
- **No curation:** You get the whole schema, not a lean subset. Noise increases with table size
- **Descriptions not populated:** Most users don't populate table and column descriptions yet — but this will become essential as agents become ubiquitous

For production agents, the manual glossary approach (Levels 1–3) takes more setup but produces better queries — because you control exactly what the orchestrator knows.

| Complexity | Strategy | Where the glossary lives |
|-----------|----------|--------------------------|
| **Small** (1 table, 5–10 fields) | Inline | Tool input description |
| **Medium** (2–3 tables, 10–20 fields) | Child agent | Child agent instructions |
| **Large** (many fields, complex rules) | Global variables → AI Prompt → Tool | Curated glossary variables fed to AI Prompt |

### Topic Caching: Stop Hammering the API

searchQuery has rate limits: **150 requests per minute per organization**. In a multi-turn conversation where every follow-up question triggers a new search call, you'll burn through that budget fast — especially with many concurrent users.

The solution: **wrap your searchQuery call in a topic and cache the results in a variable.**

1. **First question:** Topic calls searchQuery, stores results in a variable
2. **Follow-up questions:** Power Fx filter over the cached variable — no new API call. "Show me the ones in West" → `Filter(cachedResults, district = "West")`
3. **Detail request:** User wants phone number or image → *now* call List Rows with the specific row ID
4. **How do you know if it's a new search or a follow-up?** Collect that in an input. Describe the input as whatever you want to collect from context, and the orchestrator will fill it correctly — *because Topics are Agentic!*

**Multi-turn example:**
- "Find me civic centers" → searchQuery → cache 20 results
- "Which ones are in the West?" → Power Fx filter on cache → 6 results
- "Show me the downtown one" → Power Fx filter → 1 result
- "What's their phone number?" → List Rows with ID → full record

> **⭐ Topics are Agentic!** Topics behave like tools in Copilot Studio — they have inputs, outputs, and descriptions. By wrapping your connector in a topic, you get caching, Power Fx processing, and richer control over inputs and outputs. This is the enterprise-grade pattern for high-traffic agents.


### A Child Agent for Browsing

If your agent handles both *answering questions* and *browsing long lists*, consider splitting them.

**Top-level agent** handles questions and short answers:
- "Which facility handles emergencies in the West?" → searchQuery + List Rows → direct answer
- "I found 27 recreation facilities. Would you like to browse them?"

**Child agent** handles browsing and pagination:
- Uses `skip` and `top` to page through results
- Maintains its own browsing context (page state, active filters)

Why separate? Browsing generates a lot of context — page positions, filter state. Keeping it in a child agent means your top-level conversation stays clean, and the browsing state doesn't fill up your top-level orchestrator's context window.

### Federated Search Across Environments

> **⭐ This is a pattern we haven't seen documented anywhere.**

One of the most common enterprise requirements is the ability to search across regionally isolated or sovereign Dataverse environments — without replicating data into a single tenant.

While the Dataverse `searchQuery` API is **environment-scoped** — each call only searches the index of the environment it's connected to — you can still achieve a unified conversational experience by configuring **multiple instances of the same tool**, each connected to a different environment.

| Agent Tool | Connected Environment | Purpose |
|---|---|---|
| `SearchFacilities_Prod` | Production Dataverse | Search the production index |
| `SearchFacilities_Regional` | Regional Dataverse | Search the regional index |

When a user asks "housing support near Hillcrest," the agent can:
- Execute searchQuery against Prod
- Execute searchQuery against Regional
- Merge and rank the combined results
- Respond with a single, unified answer

| Layer | Responsibility |
|-------|---------------|
| Dataverse Environment | Owns its search index |
| Quick Find / Solution | Triggers ingestion |
| searchQuery Tool | Queries one index |
| Copilot Studio Agent | Orchestrates multiple tools → merges + ranks → unified result |

**Enterprise benefits of Federated Search Across Environments:**
- Data sovereignty — each environment owns its data- Environment-level security boundaries
- No ETL or replication pipelines
- Native Dataverse indexing per environment
- Cross-environment discovery through conversational orchestration

> 💡Copilot Studio enables federated enterprise search by orchestrating multiple environment-scoped searchQuery tools and merging results conversationally at runtime.

### Choosing Between MCP, Knowledge, and Custom Tools

This isn't a competition — it's a progression. Each approach has a place, and many production agents use more than one.

**When MCP shines:**
- **Speed and exploration** — see what your data can do in minutes. Auto-orchestrated search + retrieval with minimal setup.
- **Productivity scenarios** — the user IS the maker. They control what they're doing, understand the data, and don't need guardrails.
- **Prototyping** — validate whether conversational data access is worth building before investing in custom tools.
- **Quick demos** — show stakeholders what's possible without weeks of configuration.

**When Knowledge shines:**
- **Internal agents with signed-in users** — Captures glossary + synonyms, multi-turn, easy setup. Excellent for productivity and internal Q&A.
- **Grounded answering over moderate datasets** —  Works when the data fits within Knowledge limits and users are authenticated.

**When custom tools are the right call (this blog's approach):**
- **Controlled departmental or B2C agents** serving many users who don't control the experience
- **Governance requirements** — per-tool DLP, auditable query patterns, predictable call counts
- **Unauthenticated access** for public-facing agents
- **Advanced search features** — highlights, multi-table search, per-entity filters
- **Multiple specialized tool instances** for different business domains
- **Efficiency** — static entities JSON = zero schema overhead; caching patterns control API calls

**The enterprise comparison:**

| Capability | MCP | Custom Tools |
|---|---|---|
| **Setup time** | Minutes | Hours (but reusable) |
| **Table scoping** | All visible tables | Each tool targets specific tables |
| **Tool descriptions** | Auto-generated from schema (column names + types) | Authored with domain vocabulary, business rules, known values |
| **Multiple specialized versions** | One search tool for everything | N tools, each scoped and described for its domain |
| **DLP / Governance** | Per MCP server — all tools share one policy | Per tool — each has its own auth, DLP scope |
| **Query predictability** | May loop, re-filter, make extra calls | You control entities, filters, top — predictable, testable |
| **Highlights** | Not exposed | Full access |
| **Schema overhead** | May call `describe_table` per query | Static entities JSON — zero overhead |
| **Inter-tool awareness** | MCP decides the sequence | You may design the chain in descriptions |
| **Current enterprise adoption** | Some orgs not yet accepting DV MCP (DLP concerns) | Standard Dataverse connector with established policies |

![Dataverse MCP tools](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/dvmcptools.png){: .shadow }
_Dataverse MCP tools — convenient for productivity, less controlled for enterprise_

![MCP auto-query pattern](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/multiturnmcpautoquery-getsschemafrst.png){: .shadow }
_MCP auto-queries and re-fetches schema — note the overhead on each turn_

**The Multiple-Instance Pattern: Specialized Tools for Different Audiences**

This is where custom tools provide something MCP fundamentally doesn't offer. When your agent serves different user segments, you create specialized instances of the same underlying connector:

| Tool Name | Default Filter | Description tells the orchestrator… |
|---|---|---|
| **SearchSeniorServices** | `crc57_facilitytype eq 'Senior Centre'` | "Use when asking about senior, elder, retirement, or wellness." |
| **SearchYouthPrograms** | `crc57_facilitytype eq 'Recreation Centre'` | "Use when asking about youth, children, or after-school." |
| **SearchEmergencyFacilities** | `crc57_facilitytype eq 'Access Point'` | "Use for urgent or emergency service requests." |
| **WestDistrictDirectory** | `crc57_district eq 'West'` | "Use when specifically asking about the West district." |

Each tool has its own entities JSON (scoped columns), its own default filter (pre-narrowed domain), its own description (domain-specific language that helps the orchestrator route correctly), and its own auth settings (if needed).

The orchestrator reads ALL tool descriptions and picks the right one based on the user's question. "My grandmother needs wellness activities" → routes to SearchSeniorServices. "Where can my kids go after school?" → routes to SearchYouthPrograms.

> **💡 This is also how you build multi-table search within one environment.** One tool searches Facilities, another searches ServiceOfferings, a third searches KnowledgeArticles — each with its own scope and description. The orchestrator decides which to call (or calls multiple) based on the question.

> **💡Pro tip if you start with MCP and grow into custom tools:** Keep MCP for general exploration and rapid iteration. Build custom tools for the critical paths where governance, efficiency, and UX precision matter. They coexist in the same agent — MCP for the 80%, custom tools for the 20% that needs control.

> **💡 Pro tip for MCP users:** Trim the tool set. Keep `search`, `read_query`, `fetch`, `list_tables`, and `describe_table`. Remove the rest to reduce noise, unintended tool calls, and DLP surface area.

---

## Test Your Agent & Troubleshoot

### Test Questions That Work 

**Fuzzy search:**

| User says | search value generated | What happens |
|-----------|----------------------|--------------|
| "Is there a Darol community center?" | `darol community` | Fuzzy matches Darrell, Darel, Daryl, Darl — ranked results |
| "Birchvew recreation" | `birchvew recreation` | Matches Birchwood, Birchview, Birch Creek variants |
| "something about seniors in the west" | `senior west` | Matches descriptions containing "senior wellness" + district |
| "Elm-something near Canyon" | `elm* canyon` | Prefix wildcard matches Elmwood, Elm Creek, Elmdale |

**Search + filters (advanced version):**

| User says | Filter generated | What happens |
|-----------|-----------------|--------------|
| "only in the west district" | `crc57_district eq 'West'` | Post-filters ranked results to West only |
| "civic offices in Bayview" | `crc57_facilitytype eq 'Civic Office' and crc57_city eq 'Bayview'` | Combines type + city filter |
| "not the north" | `crc57_district ne 'North'` | Excludes North from results |
| "recreation centres or community hubs" | `crc57_facilitytype eq 'Recreation Centre' or crc57_facilitytype eq 'Community Hub'` | Multi-value type filter |

**Highlights:**

| User asks | Agent says |
|-----------|------------|
| "find darol" | "**Darel** Access Office — District: East. Is that the one you meant?" |
| "anything birch" | "Found **Birchwood** Civics Office and **Birch** Creek Community Hub" |

### Partial Success ⚠️ — Search Finds It, Can't Fully Answer

| User says | What search does | What's missing |
|-----------|-----------------|----------------|
| "Is the Darrell Centre wheelchair accessible?" | Finds the Darrell Centre by name | Accessibility is not text-searchable. Needs List Rows for `crc57_accessibility`. |
| "Which centres are open on weekends?" | May match descriptions containing "open weekends" | Opening hours aren't indexed → needs List Rows. Can't reliably filter by schedule. |
| "Show me the one with free parking near downtown" | Matches "free parking" in descriptions | Image URL and exact address need List Rows. |

### What Won't Work ❌ — Know the Limits

| User says | Why searchQuery can't handle it | What would work |
|-----------|-------------------------------|----------------|
| "Where can I take my kids swimming on a Saturday?" | Requires **reasoning**: swimming → Recreation Centre, Saturday → check hours, kids → family-friendly. searchQuery matches keywords, not intent chains. | AI Prompt + List Rows |
| "Which facility is closest to 123 Main Street?" | Requires **geospatial calculation** on lat/long. Search can't compute distances. | List Rows + Power Fx or external API |
| "Compare the amenities of the top 3 community hubs" | searchQuery alone won't do this — but it's not a dead end. Search finds the candidates; the orchestrator retrieves full records via List Rows and **readily compares them**. | searchQuery → List Rows → the orchestrator compares the retrieved items |
| "I need a quiet place to study, open late, with wifi" | Requires **inference**: quiet → library?, open late → check hours, wifi → not a column. Multiple implicit criteria. | Knowledge over descriptions, or AI Prompt with full data |
| "Which district has the most services per capita?" | Requires **analytics**: count per district, relate to population data (not in table). | AI Prompt with aggregation or Power BI |

> **💡 Key takeaway:** searchQuery is a *discovery* tool that matches keywords fuzzily. It's not a reasoning engine. When users ask questions that require inference, calculation, or multi-step logic, combine searchQuery with other tools — List Rows for data, AI Prompt for reasoning, Power Fx for computation.

### Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| No results returned | Table not indexed | Check that the table is opted into Dataverse Search. Add it to Knowledge to trigger immediate indexing. |
| Searches match titles but not descriptions | Multiline text column not in Quick Find "Find columns" | Add the column to Find columns in the Quick Find view → Save & Publish. |
| "Dataverse search feature is disabled" | Search not enabled for the environment | Enable it in [Power Platform admin center](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization). |
| Results come back but missing phone/image columns | Those columns aren't in selectColumns or aren't indexed | Use List Rows with the row ID for non-indexed columns. This is expected behavior. |
| Agent requires user sign-in | Connector auth misconfigured | Set the Dataverse connector to **Maker credentials**, not user-delegated. |
| Too many irrelevant results | Search terms too broad | Use `+` between required terms, `"quotes"` for exact phrases, or reduce `top`. |
| HTTP 429 Too Many Requests | Rate limit (150/min per org) | Implement the [caching pattern](#topic-caching-stop-hammering-the-api) with topics and Power Fx. |
| Fuzzy matching too loose or strict | Default search mode may not fit | Try `searchmode: "all"` for stricter matching or `"any"` for broader. See [Lucene query syntax](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query). |
| Column appears indexed but searchQuery ignores it | Column not marked as searchable | Check column properties → Advanced options → **Searchable = Yes**. |

> **⚠️ Note:** `searchsuggest` and `searchautocomplete` are not currently available as unbound actions in Copilot Studio. Only `searchquery` is available.

---

## Use Cases Beyond Directories

### Where Else This Shines

The facility directory is just one example. The searchQuery + List Rows pattern works anywhere you have a text-heavy table and users who don't speak in exact column values.

**D365 Knowledge Base search:** KB articles live in the `KnowledgeArticle` entity. The article body is in the `Content` column — a multiline rich text (HTML) field that Dataverse search can index. Build a public-facing KB agent that fuzzy-searches across article *content*, not just titles. Use List Rows for the full article.

**Attachments:** Dataverse search also indexes the first ~2 MB of text from file attachments (annotations/notes). If your KB articles have attached PDFs, that text is searchable too.

**Product catalogs:** "Do you have something like a blue standing desk?" → fuzzy match on product descriptions → return images and prices from List Rows.

**Incident lookup:** "Any recent issues with water in Brooklyn?" → fuzzy search on incident descriptions → ranked by relevance.

**Hybrid auth agents:** Use searchQuery for discovery (unauthenticated), List Rows for detailed retrieval (unauthenticated), and Knowledge for authenticated deep-dive — all in the same agent with different auth modes per tool.

### What's Next

This post covered the searchQuery pattern — from a working two-tool agent to caching, enterprise scaling, and federated search.

**Further reading:**

- [Dataverse search overview](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/overview)
- [searchQuery parameters and response format](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query)
- [Configure Dataverse search for your environment](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization)
- [Select searchable fields and filters for each table](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization#select-searchable-fields-and-filters-for-each-table)

---

> *This post describes current platform behavior as of March 2026 and does not represent roadmap commitments. Features and capabilities may change.*

---

We've only scratched the surface of what Dataverse + Copilot Studio can do together. Whether it's conversational filtering with List Rows, MCP for rapid prototyping, Knowledge for grounded answers, or searchQuery for fuzzy discovery — the right pattern depends on your users and your data.

What will you build first?

