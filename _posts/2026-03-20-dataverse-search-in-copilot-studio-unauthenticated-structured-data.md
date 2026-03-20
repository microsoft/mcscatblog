---
title: "Too Much Table Knowledge to Filter? Copilot Studio Turns Dataverse Search Into a Discovery Agent — and It Works Unauthenticated!"
date: 2026-03-20
categories: [copilot-studio, dataverse]
tags: [copilot studio, dataverse, search, connectors, unauthenticated, indexing, agentic, nl2query, fetchxml, b2c, enterprise-grade, searchquery]
description: "Use Dataverse searchQuery as an unbound action in Copilot Studio to build fuzzy, ranked search over structured data — no user sign-in required."
author: KarimaKT
image:
  path: /assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/00UnboundDVSearchinMCS.png
  alt: "Agentic Dataverse search over structured data — unauthenticated"
---

**You've got dataverse tables with thousands of rows** — community facilities, service directories, product catalogs, incident logs — and you want a Copilot Studio agent that helps people *find things* in it. Sounds straightforward, right?

Then your first tester types "Is there a Darol center near downtown?" and the agent returns... nothing. Because the facility is called "Darrell W Civics Community Center," and your filter was looking for an exact match.

This is the blog where we fix that.

We'll use **Dataverse search** (`searchquery`) — a fuzzy, ranked, synonym and  relevance-based search that works through a regular Dataverse connector in Copilot Studio. It finds "Darrell" when someone types "Darol." It ranks the best matches. And — here's the part that changes everything for public-facing agents — **it works unauthenticated**.

By the end of this post, you'll have a working agent with two tools and a search experience that will feel completely conversational and that your users will actually enjoy. Then we'll level it up to enterprise-grade patterns with facets, highlights, caching, and a browsing pattern that scales.

---

## Why your current options fall short

If you've already tried building this agent, you probably hit one of these walls. Let's name them quickly so we can move on to the solution.

**OOB Knowledge - DV Tables** is the easiest path in Copilot Studio — add your Dataverse table, write a glossary, start chatting. It handles query generation and grounded answering out of the box. But it has hard constraints:

- **Always requires user authentication** — no anonymous, no public-facing agents
- No follow-up input questions from the agent
- Limited to 15 tables per knowledge source
- May truncate or randomize results — not a full, controlled retrieval
- Limited output control over which columns and how many rows you get back

Knowledge is excellent for internal productivity agents where users are signed in. For a public directory? It's a blocker.

**List Rows** gives you full control and works unauthenticated. Fast, deterministic, exhaustive. But it's purely a filter engine — it needs exact OData expressions. When your users type fuzzy, incomplete, misspelled queries against a table with thousands of rows, exact filtering returns either nothing or everything.

**Dataverse MCP** auto-orchestrates search and retrieval with minimal setup. Great for quick exploration and supercharged productivity. But enterprise grade agents serving many users will require added control because you can't scope DV MCP to specific tables, can't control the query parameters, and DLP applies per-MCP-server (not per tool). For a production-grade search experience with facets and highlights, you need more control than MCP offers.

**What we wished for:** a standalone search that feels smart, powered by a fuzzy relevance search that gives ranked results, works unauthenticated, and lets the maker control every parameter. It exists — *and it's been in Dataverse all along!*

---

## Meet searchQuery

`searchQuery` is an **unbound action** on the Dataverse connector. It exposes the Dataverse search relevance search index — the same one that powers Dataverse MCP and the search bar in model-driven apps — as a tool you can wire into any Copilot Studio agent.

![The searchQuery tool with a glossary mapping natural language to indexed columns](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/04searchqueryindexand%20glossary.png){: .shadow }
_searchQuery paired with a glossary turns the Dataverse index into an agentic tool_

Here's the mental model:

> **searchQuery** = *"Help me figure out what the user means"*

> **List Rows** = *"I know what I'm looking for — go get it"*

They optionally pair up. Search discovers. List Rows retrieves. Together, they give you a fuzzy-to-precise pipeline that feels conversational.

### What searchQuery is — and isn't

Before you build, set the right expectations. This comes up in every discussion:

| What people assume | What actually happens |
|---|---|
| "It's like vector search" | It's a **fuzzy relevance index** built on Azure Cognitive Search. Keyword-based with intelligent expansion — not embedding-based. Right-sized for structured data. |
| "It returns everything that matches" | It's **statistical, not exhaustive**. It ranks and returns the top results. For completeness, use List Rows. |
| "I need to send the exact term" | It **fuzzy-matches**. "Darol" finds "Darrell." But you send keywords, not natural-language paragraphs. |
| "It replaces List Rows" | They're **complementary**. searchQuery returns only indexed columns + row IDs. List Rows gets you the full record. |
| "Dataverse search requires sign-in" | **Not for connector-based tools.** searchQuery via the Dataverse connector works with maker auth — no user sign-in required. |

This is the Goldilocks search for structured data: not as rigid as exact filters, not as heavy as vector indexing. Fuzzy enough to understand your users. Fast enough for real-time chat.

---

## Let's build it

We'll create a **Municipal Facility and Services Directory** agent — a city has hundreds of service centers and associated services, and citizens need to find the precise one from a public website. No sign-in.

### Municipal Facility Data Tables

Here's the Facilities table. Notice which columns are indexed and which aren't — this distinction drives the entire two-step pattern.

| Column | Type | Indexed? | Returned by searchQuery? | Purpose |
|--------|------|----------|--------------------------|---------|
| `cr_facility` | GUID | — | ✅ Always (row ID) | The key that links search to retrieval |
| `cr_name` | Text | ✅ | ✅ | "Darrell W Civics Community Center" |
| `cr_district` | Text | ✅ | ✅ | "West", "North", "Central" |
| `cr_facility_type` | Text | ✅ | ✅ | "Access Point", "Public Works", "Civic Office" |
| `cr_description` | Multiline text | ✅ | ✅ | Longer text about what the facility offers |
| `cr_phone` | Text | ❌ | ❌ | Phone number — need List Rows |
| `cr_imageurl` | Text (URL) | ❌ | ❌ | Facility photo — need List Rows |
| `cr_openinghours` | Text | ❌ | ❌ | Hours of operation — need List Rows |

**The key insight:** In this setup, searchQuery returns only indexed columns plus the row ID. To show the user a photo, phone number, or hours, you need a second step — List Rows by ID because not all fields are indexed.

![Facility Directory table in Dataverse showing sample rows with names, districts, and types](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/01tabledatafacilities.png){: .shadow }
_The Facilities table with sample data — notice the mix of indexed and non-indexed columns_

![Services table in Dataverse showing service types linked to facilities](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/02tabledataservices.png){: .shadow }
_The Services table — associated with facilities for a richer search experience_

### Step 1: Get your table indexed

Dataverse search maintains a relevance index. Your table won't appear in search results until you opt it in. For the full configuration reference: [Configure Dataverse search for your environment](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization).

1. **Enable Dataverse search** for your environment. It's on by default in production environments. For dev/sandbox, enable it in the **Power Platform admin center**.

   ![Dataverse search toggle set to ON in the Power Platform admin center](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/searchON.png){: .shadow }
   _Dataverse search must be set to ON in your environment_

2. **Include your table in the index**. New tables will be included by default. In the Solution Overview Page, select Manage search index, add missing tables, remove extraneous ones. 

   Tip: For custom tables with *sensitive data*, consider setting the "Can enable sync to external search index" property to False.

   ![Manage search index page showing tables opted into the index](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/03manage%20search%20index.png){: .shadow }
   _Select Manage search index to add or remove tables from the Dataverse search index_

3. **Choose which columns to index.** Open your table, go to the **Quick Find view**, and add the columns you want searchable. Text fields such as Single Line of Text and Multiple Lines of Text, Attachments, Lookups, and Option Sets are searchable. Lookups and options and some other fields are also filterable and facetable  (see doc).

   Be intentional — the index takes storage space. Index the text columns users will search against (names, descriptions, addresses). If storage size matters more than plan steps, skip indexing columns that are only for display (phone, image URL).
   ![Quick Find view showing which columns are added to the search index](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/QuickFindView.png){: .shadow }
   _Add columns to the Quick Find view to control which fields are searchable_

4. **Re-Publish your table and  wait for indexing** — or use this pro tip: **after publishing, add the table to Knowledge in any agent.** Under the covers, this triggers Dataverse to start indexing immediately. You don't have to use Knowledge for retrieval — you're just kickstarting the indexer. Remove it from Knowledge afterward if you want.
   > **Pro tip:** Indexing can take minutes to hours depending on table size. The Knowledge-trigger trick gets it started right away.



### Step 2: Add the searchQuery tool

This is the part most people don't know exists. `searchQuery` is an **unbound action** — it's not a row-level operation on a specific table. You access it through a different path in the connector.


1. In your Copilot Studio agent, go to **Tools** → **Add a tool**.
2. Select the **Dataverse** connector.
3. Choose **Perform an unbound action**.
4. Select the **searchQuery** action.
5. Set the **authentication** to **maker auth** (no user sign-in required).

**Now configure the searchQuery tool's inputs**

This is where the magic happens — the orchestrator needs dynamic inputs to have good names and descriptions to understand: 
- How to interpret Context,
- What the connector expects,
- Rules and Glossary for generating the value.

![Copilot Studio tool configuration showing the searchQuery unbound action with input descriptions](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/Unbound.png){: .shadow }
_The searchQuery unbound action configured as a tool in Copilot Studio_

To learn about the Search API elements and how to use them, see the [search API documentation](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query) for examples. Then decide which parameters you want to use and how dynamic you want to make them. Note the Filter above accepts OData format and is a post-filter on indexed retrieval to narrow results. 


Your input description tells the orchestrator  what format the `search` parameter expects (ex: keywords, not questions)

**Example input description for the `search` parameter:**

> *The key search terms extracted from the user's request and from their apparent intent, as a search string. Use keywords, not full sentences. Use + between terms that must all match.*

![searchQuery result showing ranked matches with scores and indexed column values](/assets/posts/dataverse-search-in-copilot-studio-unauthenticated-structured-data/06searchqueryresult.png){: .shadow }
_A simple searchQuery result — ranked matches with relevance scores_

### Step 3: Add List Rows for the full picture

searchQuery finds the right facilities and returns their IDs and indexed columns. But your users want to see a photo, call a phone number, know the hours. That's the List Rows step.

1. Add a second tool: **Dataverse connector → List Rows** (or **Get a row by ID**).
2. Configure it to retrieve from the `cr_facility` table.
3. In the tool description, explain that this tool is used to get the full record using the ID returned by searchQuery.
4. In the filter rows field, fill it dynamically, and describe it as "an OData query to filter by cr_ID (the row id's retrieved from the previous search step)"

Set this tool to **maker auth** as well — same unauthenticated pattern.

### Step 4: Give your agent instructions

Keep the top-level instructions simple. The agent knows how to orchestrate. The tool descriptions do most of the work. Your instructions set some general display rules:

> *When listing facilities, always show the facility name, district, address, phone number, and image when available. If multiple results match, present the top 3 and ask which one the user is interested in.*

That's it. Two tools, two descriptions, a short instruction.

### Explain the action

**The user asks:**

> "Is there a Darol community center in the west?"

**What happens under the covers:**

1. **Orchestrator reads the tools** and decides searchQuery is the right first step.
2. **Constructs the search request:** search term `"darol community"`, scoped to `cr_facility`, filtered or weighted toward "west" in `cr_district`.
3. **searchQuery returns ranked results:**

   | Rank | Name | District | Score |
   |------|------|----------|-------|
   | 1 | Darrell W Civics Community Center | West | 4.8 |
   | 2 | Darrell Community Services Point | Central | 3.2 |
   | 3 | Daryl Heights Recreation Center | North | 2.1 |

   Note: "Darol" matched "Darrell" and "Daryl" through fuzzy matching. The user never had to spell it right.

4. **Orchestrator calls List Rows** with the top result's ID → gets `cr_phone`, `cr_imageurl`, `cr_openinghours`.
5. **Agent responds:**

   > 🏛️ **Darrell W Civics Community Center** — West District
   >
   > 📍 142 Civic Plaza, West District
   > 📞 1-800-555-0142
   > 🕐 Mon–Fri 8am–6pm, Sat 9am–1pm
   >
   > *This facility offers Recreation and Senior Services programs.*
   >
   > ![Facility photo](https://th.bing.com/th?q=Office+Building+Design+Ideas&w=120&h=120&c=1&rs=1&qlt=70&o=7&cb=1&dpr=1.5&pid=InlineBlock&rm=3&mkt=en-CA&cc=CA&setlang=en&adlt=moderate&t=1&mw=247)
   >
   > I also found 2 other facilities with similar names. Would you like to see them?

### What you control

You don't have to write JSON. The orchestrator generates the search request from your tool descriptions and your rules. 

> Note that for dynamic Queries, giving the agent a natural language description along with the logical name of the column creates the **Powerful Glossary** that turns query writing into an agentic task. This can be done at top level, in a child agent, but also directly in a dynamic input definition!

But you control every lever:

| Parameter | What it does | Where you can set it (example) |
|-----------|-------------|-----------------|
| `search` | The fuzzy search term | Generated by orchestrator from user input |
| `entities` | Which table(s) to search | In the tool input description |
| `searchColumns` | Which indexed columns to search against | In the tool input description |
| `selectColumns` | Which indexed columns to return | In the tool input description |
| `facets` | aggregated counts | Usually fixed based on business need |
| `filter` | Post-filter with OData syntax | Generated by orchestrator or fixed in description |
| `top` | How many results | Fixed in description (3–5 for chat) or generated |
| `count` | Include total count | Fixed in description |

For the full parameter reference: [Dataverse search query](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query).

---

## You've got a working agent. Now let's make it great.

The two-tool pattern above handles the common case well. But if your table has thousands of rows and your users have multi-turn conversations, there's a lot more you can do.

### Facets: let users browse before you fetch

Here's a design insight that changes how you think about this pattern: **don't jump to List Rows immediately.** Use facets to let the user navigate the ranked results first.

Facets group your search results by field values and return counts:

```
"facets": ["cr_district,count:10", "cr_servicetype,count:10"]
```

Now your agent can say:

> "I found 27 facilities matching 'recreation.' Here's how they break down:
>
> **By district:** West (8), Central (7), North (6), East (4), South (2)
> **By type:** Recreation (15), Senior Services (8), Youth Programs (4)
>
> Which district are you interested in?"

The user says "West" — and *then* you call *searchQuery* again with a post-filter or go straight to *List Rows* for those 8 results. Fewer API calls. More relevant output. The user feels like they're navigating, not searching.


### Highlights: show users why results matched

searchQuery returns highlighted text with `{crmhit}` markers showing exactly which terms matched:

```json
"Highlights": {
  "cr_name": ["{crmhit}Darrell{/crmhit} W Civics Community Center"],
  "cr_description": ["offers {crmhit}recreation{/crmhit} programs for all ages"]
}
```

Your agent can bold the matched terms:

> **Darrell** W Civics Community Center — "offers **recreation** programs for all ages"

This does two things: it tells the user *why* this result appeared (building trust), and it confirms whether this is actually what they were looking for (saving a follow-up turn).

### Post-filters: the AI narrows it down

The `filter` parameter applies OData-style constraints on top of the ranked results:

```
cr_district eq 'West' and cr_servicetype eq 'Recreation'
```

Describe the pattern in your tool input, and the orchestrator will generate filters from the conversation. If the user says "only emergency services in the north," the orchestrator will add this at runtime `cr_servicetype eq 'Emergency' and cr_district eq 'North'` without you writing a single line of logic.

**One caveat to keep in mind:** post-filters apply to the *already-ranked* result set, not the full table. If your top-50 results are mostly in the West, filtering for "East" might return very few results — not because there aren't East facilities, but because they ranked lower. For exhaustive filtering, use List Rows.

### The caching trick: stop hammering the API

searchQuery has rate limits: **150 requests per minute per organization**. In a multi-turn conversation where every follow-up question triggers a new search call, you'll burn through that budget fast — especially with many concurrent users.

The solution: **wrap your searchQuery call in a topic and cache the results in a variable.**

**The pattern:**

1. **First question:** If it's the first question, Topic collects the user's search, calls searchQuery, stores the results in a variable.
2. **Follow-up questions:** If it's a follow up, then run **Power Fx filter** over the cached variable — no new API call. "Show me the ones in West" → `Filter(cachedResults, district = "West")`.
3. **Detail request:** If the user wants details that are unavailable, ex: User wants a phone number or image → *now* call List Rows with the specific row ID.
4. **How do you check conditionals** to know if it's a new request or if the user is asking for extra info? Collect that in an input. Describe the input as whatever you want to collect from context, the orchestrator will oblige and fill it correctly! (*because Topics are agentic!*)

**Multi-turn example:**
- "Find me civic centers" → searchQuery → cache 20 results
- "Which ones are in the West?" → Power Fx filter on cache → 6 results
- "Show me the downtown one" → Power Fx filter → 1 result
- "What's their phone number?" → List Rows with ID → full record

**Topics are Agentic!**
Topics behave like tools in Copilot Studio — they have inputs, outputs, and descriptions. By wrapping your connector in a topic, you get caching, Power Fx processing, and richer control over inputs and outputs. This is the enterprise-grade pattern for high-traffic agents.



### A child agent for browsing

If your agent handles both *answering questions* and *browsing long lists*, consider splitting them.

**Top-level agent** handles questions and short answers:
- "Which facility handles emergencies in the West?" → searchQuery + List Rows → direct answer.
- "I found 27 recreation facilities. Would you like to browse them?"

**Child agent** handles browsing and pagination:
- Uses `skip` and `top` to page through results
- Uses facets for drill-down navigation
- Maintains its own browsing context (page state, active filters)

Why separate? Browsing generates a lot of context — page positions, filter state, facet selections. Keeping it in a child agent means your top-level conversation stays clean for answering new questions, and the browsing state doesn't fill up your top-level orchestrator's context window.

### When to use MCP instead

Dataverse MCP auto-orchestrates search and retrieval — it's genuinely convenient for prototyping and internal tools. Use it when:

- You want to explore a table quickly without configuring tool descriptions
- You need basic search + retrieval and don't need facets, highlights, or fine-grained control
- DLP per-MCP-server (not per-tool) is acceptable for your scenario

**Build custom tools (as described in this post) when**:

- You need unauthenticated access for a public-facing agent
- You want facets, highlights, or post-filters
- You need to control which tables are exposed and how queries are scoped
- You need multiple specialized search tools for different business domains (multiple versions of searchQuery and of ListRows that are each a specialized tool like West center phone numbers). This is useful in large enterprise-grade specialized solutions. 
- You need to control the number of API calls (MCP may loop and re-filter)

**Pro tip from the field:** If you do use MCP, trim the tool set. Keep `search`, `read_query`, `fetch`, `list_tables`, and `describe_table`. Remove the rest to reduce noise and unintended tool calls.

---

## Beyond directories: where else this shines

The facility directory is just one example. The searchQuery + List Rows pattern works anywhere you have a large text-heavy table and users who don't speak in exact column values.

**D365 Knowledge Base search:** KB articles are stored in the `KnowledgeArticle` entity in Dataverse. The article body lives in the `Content` column — a multiline rich text (HTML) field that Dataverse search can index. Build a public-facing KB agent that fuzzy-searches across the *content* of articles, not just titles and keywords. Use List Rows to get the full article for display.

**Attachments:** Dataverse search also indexes the first ~2 MB of text from file attachments (annotations/notes). If your KB articles have attached PDFs or documents, text from those are searchable too!

**Product catalog:** "Do you have something like a blue standing desk?" → fuzzy match on product descriptions → return product images and prices from List Rows.

**Incident lookup:** "Any recent issues with water in Brooklyn?" → fuzzy search on incident descriptions → ranked by relevance → facet by status and severity.

**Hybrid agents:** Use searchQuery for discovery (unauthenticated), List Rows for detailed retrieval (unauthenticated), and Knowledge for authenticated deep-dive — all in the same agent with different auth modes per tool.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| No results returned | Table not indexed | Check that the table is opted into Dataverse search. Add it to Knowledge to trigger immediate indexing. |
| Searches match titles but not descriptions | Multiline text column not in Quick Find view | Add the column to the Quick Find view — that's what controls the index. |
| "Dataverse search feature is disabled" | Search not enabled for the environment | Enable it in [Power Platform admin center](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization). |
| Results come back but missing phone/image columns | Those columns aren't indexed — this is expected | Use List Rows (Step 3) with the row ID to get non-indexed columns. |
| Agent requires user sign-in | Connector auth misconfigured | Set the Dataverse connector to maker auth, not user-delegated. |
| Too many irrelevant results | Search terms too broad | Use `+` between required terms, `"quotes"` for exact phrases, or reduce `top`. |
| HTTP 429 Too Many Requests | Rate limit (1 req/sec per user, 150/min per org) | Implement the [caching pattern](#the-caching-trick-stop-hammering-the-api) with topics and Power Fx. |
| Fuzzy matching seems too loose or too strict | Default search mode may not fit | Try `searchmode: "all"` for stricter matching or `"any"` for broader. For advanced control, use [Lucene query syntax](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query). |

---

## What's next

This post covered the searchQuery pattern — from a working two-tool agent to facets, caching, and browsing at scale. 

**Further reading:**

- [Dataverse search overview](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/overview)
- [searchQuery parameters and response format](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/search/query)
- [Configure Dataverse search for your environment](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization)
- [Select searchable fields and filters for each table](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization#select-searchable-fields-and-filters-for-each-table)

---

We've only scratched the surface of what Dataverse + Copilot Studio can do together. Whether it's conversational filtering with List Rows, MCP for rapid prototyping, Knowledge for grounded answers, or searchQuery for fuzzy discovery — the right pattern depends on your users and your data. What will you build first?

> This post describes current platform behavior and does not make roadmap commitments.