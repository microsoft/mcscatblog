---
layout: post
title: "Dataverse Retrieval Patterns for Copilot Studio Agents"
date: 2026-04-10
categories: [copilot-studio, dataverse]
tags: [dataverse, retrieval-patterns, knowledge, list-rows, mcp, searchquery, prompt-tool, connectors]
description: "Five ways to retrieve Dataverse data from Copilot Studio agents — Knowledge, List Rows, MCP Server, Search Query, and Prompt Tool. A decision guide with setup steps and trade-offs to help you pick the right method."
authors: [KarimaKT, roels]
image:
  path: /assets/posts/dataverse-retrieval-patterns-copilot-studio/header.png
  alt: "Five retrieval patterns connecting Copilot Studio to Dataverse"
published: true
mermaid: true
---

A few weeks ago, I watched an internal video by Karima and Bobby Chang walking through the different ways a Copilot Studio agent can pull data out of Dataverse. Five methods. Five different sets of trade-offs. And the kind of practical, opinionated guidance that never makes it into official docs.

I thought it was too good to keep internal. So Karima and I turned it into this post.

Here's the thing: most people discover one method that works and never look at the others. You wire up Knowledge because it's the first thing you see, hit a wall when results get truncated, and then spend a week figuring out what you should have used instead. Or you go straight to MCP because it sounds powerful, and then realize you've given your agent access to every table in the environment.

This guide covers the five main retrieval patterns, when each one shines, and exactly how to set them up. It's a decision guide first and a setup reference second. If we've already published a deep dive on a specific method, we'll link to it rather than repeat it.

One more thing: this post is about **retrieval** — reading data from Dataverse. We're not covering create, update, or delete operations here. If you see CRUD mentioned, it's only in the context of turning it off.

## The Scenario: Greenfield Parks & Recreation

Throughout this post, we'll use one scenario across all five methods so you can compare apples to apples.

**The setup:** You're building a Copilot Studio agent for the fictional Greenfield Parks & Recreation Department. They have a Dataverse table called **Facilities** with these columns:

| Column | Logical name | Type | Example values |
|--------|-------------|------|----------------|
| Name | `cr_name` | Text | Daryl Community Center, Westside Pool |
| District | `cr_district` | Choice | North, South, East, West, Central |
| Facility type | `cr_facility_type` | Choice | Community Hub, Sports Complex, Library |
| Phone | `cr_phone` | Text | (555) 234-5678 |
| Description | `cr_description` | Multi-line text | "Indoor pool, gym, and meeting rooms..." |
| Active | `cr_active` | Boolean | Yes / No |

There's also a related **Service Offerings** table (yoga classes, swimming lessons, after-school programs) linked to Facilities through a many-to-many relationship.

Residents will ask things like:
- "What facilities are in the West district?" (precise filter)
- "Where can I find something like Darol center?" (fuzzy discovery with a typo)
- "How many community hubs do we have?" (aggregation)
- "What programs does the Westside Pool offer?" (cross-table lookup)

Each retrieval method handles these questions differently. Let's see how.

## Choosing Your Method

Before we dive into each method, here's the decision flow. Your starting point depends on what your agent needs to do and what your users look like.

```mermaid
flowchart TD
    START["What does your<br>agent need to do?"] --> Q1{"Do users know<br>exact filter values?"}
    
    Q1 -- "Yes, precise lookups" --> Q2{"Need exhaustive<br>results - all rows?"}
    Q2 -- Yes --> LISTROWS["List Rows<br>OData filter via connector"]
    Q2 -- No --> KNOWLEDGE["Knowledge<br>Quick setup, top N results"]
    
    Q1 -- "No, fuzzy/discovery" --> Q3{"Large dataset?<br>100K+ rows"}
    Q3 -- Yes --> SEARCH["Search Query<br>Relevance search +<br>pair with List Rows"]
    Q3 -- No --> Q4{"Need aggregation<br>or calculations?"}
    Q4 -- Yes --> PROMPT["Prompt Tool<br>LLM reasoning over tables"]
    Q4 -- No --> KNOWLEDGE
    
    Q1 -- "Mixed / exploring" --> Q5{"Need granular<br>control?"}
    Q5 -- No --> MCP["MCP Server<br>Quick start, all tables"]
    Q5 -- Yes --> LISTROWS
    
    style LISTROWS fill:#2d7d46,color:#fff
    style KNOWLEDGE fill:#2563eb,color:#fff
    style SEARCH fill:#9333ea,color:#fff
    style PROMPT fill:#dc2626,color:#fff
    style MCP fill:#d97706,color:#fff
```

You can (and often should) combine methods in a single agent. The rest of this post walks through each method — starting with the two quickest setups (Knowledge and MCP), then moving to the methods that give you more control (List Rows, Search Query, and Prompt Tool).

## Before You Start: The Basics

Every method needs these in place. Get them sorted first or you'll waste time debugging.

**A Copilot Studio environment with Dataverse.** Every Copilot Studio environment comes with a Dataverse database. If you're on Power Platform, you already have one. Otherwise, you'll need a licensed environment (Developer, Sandbox, or Production).

**Tables with data and clear column names.** If your columns are called `cr_col1`, `cr_col2`, every AI service will struggle to interpret them. Rename to meaningful names where possible. Note your **logical field names** (not display names) — find these in Dataverse → open the column → Settings → Logical field name. They look like `cr_district`, `cr_facility_type`. You'll need these for OData filters and tool configuration.

**An authentication decision.** This constrains which methods you can use:

| Auth mode | Knowledge | List Rows | MCP Server | Search Query | Prompt Tool |
|---|---|---|---|---|---|
| User auth (signed in) | Yes | Yes | Yes | Yes | Yes |
| Service account / app auth | No | Yes | Yes (via custom connector) | Yes | Yes |
| Anonymous (no sign-in) | No | Yes | Yes (via custom connector) | Yes | Yes |

> If you need an anonymous, public-facing agent, Knowledge over Dataverse is off the table. You'll need List Rows, Search Query, or a Prompt Tool with a service connection.
{: .prompt-info }

**AI services enabled.** Your environment needs orchestration (always on), Knowledge (enable per source), and Prompt Tool (available under Tools). These are included in Copilot Studio licensing, but your admin may need to [enable generative AI features](https://learn.microsoft.com/en-us/power-platform/admin/geographical-availability-copilot) in the Power Platform Admin Center.

## 1. Knowledge: The Fastest Path to Answers

### What it is

Copilot Studio's built-in AI service for grounded answers over data sources, including [Dataverse tables](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-dataverse). You point it at a table, configure a glossary, and your agent can answer questions over the data. Under the hood, Copilot Studio's Knowledge layer applies [semantic indexing with vector embeddings](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio) to link objects in the user's query to your schema elements — this is a different retrieval layer than the raw Dataverse search index, which is keyword-based.

### When to use it

- You want the **fastest setup** with minimal configuration
- Your use case is **general Q&A over table data** (lookups, basic filtering)
- You're okay with **top N results** (it returns the most relevant matches, not all matches)
- Your users will **authenticate** (Knowledge over Dataverse requires user auth)
- You need **cross-table relationship awareness** (it can follow many-to-many relationships automatically)

### When to move on

- You need **exhaustive results** (all rows matching a filter, not just the top handful)
- You need **anonymous/public-facing** agents without sign-in
- You need **full control over the query** being generated
- You need **follow-up question handling** natively (tools handle this better)

### How to set it up

1. Open your agent in **Copilot Studio**
2. Go to **Knowledge** and add a new knowledge source
3. Select **Dataverse** and pick the table(s) you want
4. **Configure the glossary** — this step makes or breaks your results

<!-- SCREENSHOT: Adding a Dataverse table as a Knowledge source in Copilot Studio, showing the table picker dialog -->
<!-- ![Adding Dataverse as Knowledge source](/assets/posts/dataverse-retrieval-patterns-copilot-studio/knowledge-table-picker.png){: .shadow } -->
<!-- _Selecting a Dataverse table as a knowledge source in Copilot Studio_ -->

**The glossary is not optional in practice.** When you add a Dataverse table as a knowledge source, Copilot Studio shows you all indexed columns with fields for term definitions and synonyms. If your columns are well named, you can get away with light glossary work. If they're cryptic, the glossary is the only way the LLM can understand your schema.

Prepare a mapping before you start:

| Logical field name | Term definition | Synonyms |
|---|---|---|
| `cr_district` | Geographic district the facility is located in | north, south, east, west, central, area, zone, region |
| `cr_facility_type` | Type of facility | community hub, sports complex, library, pool, gym |
| `cr_description` | Full-text description of the facility and its amenities | about, details, info, what's there |

> Adding a table to Knowledge triggers Dataverse to start indexing that table immediately. If the Dataverse search index setup (needed for Search Query and MCP) seems slow, adding the table to Knowledge first is a shortcut to kick it off.
{: .prompt-tip }

5. Test in the **Test panel** and check the [Activity tab](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-review-activity) for chain-of-thought reasoning
6. Look at the **rewritten query** in the activity log — it shows how the user's messy input gets cleaned up before hitting Dataverse

<!-- SCREENSHOT: The Activity tab in the Test panel showing the chain-of-thought reasoning and rewritten query for a Knowledge retrieval -->
<!-- ![Activity tab for Knowledge retrieval](/assets/posts/dataverse-retrieval-patterns-copilot-studio/knowledge-activity-tab.png){: .shadow } -->
<!-- _The Activity tab shows how Knowledge rewrites the user's question before querying Dataverse_ -->

### Greenfield example

A resident asks: *"What community hubs are in the West district?"*

Knowledge rewrites this to a structured query against the Facilities table, filters by `cr_district = West` and `cr_facility_type = Community Hub`, and returns the top matches with their details. It also follows the relationship to Service Offerings if the resident asks a follow-up like *"What programs does that one offer?"*

### Key details

- Supports **multi-turn conversations** — the agent maintains context across questions
- Can traverse **table relationships** (follow up on a facility to see its service offerings)
- Returns results based on **relevance scoring**, not exhaustive filtering
- The glossary quality directly determines answer quality

### When you'll hit the wall

Knowledge returns top N results, not all matches. When a resident asks *"Show me all facilities in the North district"* and there are 47 matches, they'll get 5 or 10. If your users need exhaustive results, List Rows is the better fit for that scenario.

## 2. MCP Server: The All-in-One Shortcut

### What it is

The Dataverse [MCP (Model Context Protocol) server](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-components-to-agent) bundles multiple Dataverse operations behind a single endpoint. It exposes list rows, search query, CRUD operations, and more as a set of tools. Connect it once and your agent can talk to every table in your environment.

> For cross-environment Dataverse access via MCP (e.g., your data lives in a different environment than your agent), see Ricardo's guide: [Connecting Copilot Studio to a Dataverse MCP Endpoint Across Environments]({% post_url 2026-03-03-connecting-copilot-studio-dataverse-mcp-endpoint-across-environments %}). For a detailed comparison of MCP vs. Power Platform connectors, check out [MCP Servers or Connectors in Copilot Studio? A Maker's Guide]({% post_url 2026-01-29-compare-mcp-servers-pp-connectors %}).
{: .prompt-info }

### When to use it

- You want a **quick start** talking to all tables in your environment
- You're **exploring or prototyping** and don't need fine-grained control yet
- You want **multiple operations available** without configuring each separately
- The MCP server's built-in table descriptions are sufficient for your scenario

### When to move on

- You need **granular control** over which queries run and how
- You need to **restrict which tables** the agent can access (MCP exposes all tables via list rows)
- Your **DLP policies** need per-operation control
- You need **predictable tool call counts** (MCP may chain multiple calls per question)

### How to set it up

**Prerequisites:** Dataverse Search must be enabled and columns must be indexed (same as Search Query). The MCP server uses the same relevance search index under the hood.

1. In Copilot Studio, go to **Tools** and add a new tool
2. Select **MCP** as the tool type
3. Connect the **Dataverse MCP server**
4. You'll see all available operations. **Disable what you don't need**:
   - For retrieval only: disable create, update, delete operations
   - Keep: list rows, search query, get record
5. The MCP server automatically pulls **table descriptions** from your Dataverse table definitions as a starter glossary
6. Test and check the **Activity tab** to see which operations the MCP chains together

<!-- SCREENSHOT: MCP server tool configuration in Copilot Studio showing the list of available operations with create/update/delete disabled -->
<!-- ![MCP server operations](/assets/posts/dataverse-retrieval-patterns-copilot-studio/mcp-operations-config.png){: .shadow } -->
<!-- _Disable create, update, and delete operations when you only need retrieval_ -->

> The entire MCP server is treated as a single connector for DLP purposes. You either allow it or block it — you can't allow "list rows via MCP" but block "delete rows via MCP" at the DLP level. Disable unwanted operations in the MCP tool configuration instead.
{: .prompt-warning }

### How the orchestrator uses MCP

The orchestrator can chain any tools together — this isn't MCP-specific behavior. What makes MCP different is that related operations are **bundled and context-aware**. They share the same endpoint, the same table metadata, and the same connection. You don't have to configure each operation as a separate tool.

```mermaid
flowchart TD
    A["User: 'Find something<br>like Darol Civics'"] --> B["Orchestrator routes<br>to MCP server"]
    B --> C["MCP: Search Query<br>(fuzzy match)"]
    C --> D{"Results<br>sufficient?"}
    D -- "Need more detail" --> E["MCP: List Rows<br>(full records)"]
    E --> F["Combined results<br>returned to agent"]
    D -- "Yes" --> F
    F --> G["Agent formats<br>and responds"]
    
    style C fill:#d97706,color:#fff
    style E fill:#2d7d46,color:#fff
```

### Greenfield example

A resident asks: *"Find something like Darol Civics."*

The MCP server runs a fuzzy search, finds "Daryl Community Center" as the closest match, then automatically follows up with a list rows call to pull the full record. Two tool calls, one user question, zero manual configuration per operation.

### Key details

- **Multiple tool calls per user question are normal** with MCP — that's by design
- You lose control over the exact OData filters being generated
- The MCP pulls table descriptions for its glossary, so **write good table and column descriptions in Dataverse** before you touch Copilot Studio
- Dynamics 365 tables sit on Dataverse, so these same MCP patterns apply to D365 CE modules
- MCP auth can use service principal via custom connector, making anonymous-agent scenarios possible

### When you'll hit the wall

MCP is great for exploration and prototyping. For production agents with high-stakes business processes, you'll want dedicated List Rows or Search Query tools where you control exactly what queries run. MCP fires too many calls? Build dedicated tools. Need DLP per operation? Switch to individual connector tools.

## 3. List Rows: Precise, Exhaustive Retrieval

### What it is

The Dataverse connector's ["List rows" action](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-flow-list-of-results), added as a [tool in Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-tools-custom-agent). You describe the [OData filter syntax](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/filter-rows) in natural language inside the tool input description, and the orchestrator generates the actual OData query from the user's question. This gives you deterministic, filtered retrieval — every row that matches comes back.

### When to use it

- You need **precise, exhaustive results** (all rows matching specific criteria)
- You want **full control over which columns** get filtered and returned
- You need to work with **any authentication mode**, including anonymous
- Knowledge truncation is a problem for your use case

### When to move on

- Users don't know exact values to filter on (they need fuzzy discovery first)
- You don't want to write OData filter descriptions
- You want a quick prototype without much configuration

### How to set it up

**Prerequisites:** Configure the Dataverse connector in Copilot Studio (Tools → add Dataverse connector → configure connection). No special indexing needed — List Rows uses OData filtering directly against the table.

1. In Copilot Studio, go to **Tools** and add a new tool
2. Select the **Dataverse connector** → **List rows** action
3. Select the **target table** (e.g., Facilities)
4. Configure the **tool inputs**:
   - The connector inputs (the actual OData fields) get hidden under the covers
   - The **tool inputs** become the intelligent interface the orchestrator sees

<!-- SCREENSHOT: Configuring a List Rows tool in Copilot Studio showing the tool input description field with OData instructions -->
<!-- ![List Rows tool configuration](/assets/posts/dataverse-retrieval-patterns-copilot-studio/list-rows-tool-config.png){: .shadow } -->
<!-- _The tool input description teaches the orchestrator how to generate OData filters_ -->

5. Write your input description like pseudocode:

```
OData filter for the Facilities table.
- If the user mentions a district (north, south, east, west, central), filter on: cr_district eq '{value}'
- If the user mentions a facility type (community hub, sports complex, library), filter on: cr_facility_type eq '{value}'
- If the user mentions a city name, filter on: cr_city eq '{value}'
- Always return columns: cr_name, cr_district, cr_city, cr_phone, cr_facility_type
- Use logical field names only
- DO NOT invent filter values that the user did not mention
```

> The "DO NOT invent filter values" instruction is important. Without it, the orchestrator may hallucinate filter values that seem reasonable but don't exist in your data. Explicit constraints make the OData generation reliable.
{: .prompt-tip }

6. Add a **tool description** that explains the business function (e.g., "Retrieves facility records filtered by district, type, or city")
7. Optionally, add **top-level agent instructions** for result handling (e.g., "If more than 5 results, ask the user to narrow down by district")

> Rename the connector to its business function, not its technical name. The orchestrator doesn't need to know it's "Dataverse List Rows." Call it "Facility Directory Lookup" or "Parks & Rec Search." This matters when you have multiple tools — clear names help the orchestrator route to the right one.
{: .prompt-tip }

### How the orchestrator generates OData

```mermaid
flowchart LR
    A["User: 'Show me<br>facilities in the<br>north district'"] --> B["Orchestrator reads<br>tool input description"]
    B --> C["Generates OData:<br>cr_district eq 'North'"]
    C --> D["List Rows connector<br>executes query"]
    D --> E["Full result set<br>returned to agent"]
    E --> F["Agent formats<br>and responds"]
```

The orchestrator's OData generation is reliable when you write clear, pedagogical input descriptions with explicit glossaries of valid values. It handles `eq`, `ne`, `and`, `or`, and `contains()` well. Where it struggles is when descriptions are vague or leave room for interpretation — that's when you get hallucinated filter values or unnecessary follow-up questions.

### Greenfield example

A resident asks: *"Show me all facilities in the North district."*

The orchestrator reads the tool input description, generates `cr_district eq 'North'`, and List Rows returns every matching facility — all 47 of them, not just the top 5. The agent formats the result as a list.

But then another resident types: *"Where's the Darol center?"* — and gets zero results. `cr_name eq 'Darol center'` doesn't match anything because the actual name is "Daryl Community Center." List Rows does exact matching. For fuzzy discovery, you need Search Query.

### Key details

- The orchestrator converts natural language to OData syntax automatically
- Use **logical field names** from Dataverse column definitions (not display names)
- Supports standard OData operators: `eq`, `ne`, `and`, `or`, `contains()`, etc.
- Works with **any authentication mode**, including anonymous
- No special indexing required — queries run directly against the table

### When you'll hit the wall

Users misspell things. They type "Darol" when they mean "Daryl." They type "community center" when the value is "Community Hub." List Rows can't handle this — it's exact match only. If your users need fuzzy discovery, Search Query is designed for that.

## 4. Search Query: Fuzzy Discovery for Messy Input

### What it is

The Dataverse ["Perform unbound action"](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-create-search-query) connector with the `searchquery` action name. This uses Dataverse's [relevance search index](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization) — the same engine that powers the search bar in model-driven apps. It's keyword-based with intelligent expansion for typos, stemming, and similar terms. Not vector search, not embedding-based. It ranks results by how well they match, and it handles real, messy human input.

> Karima wrote a full deep dive on searchQuery with step-by-step setup, YAML, and progressive enhancements. If you're going all-in on this method, read [Structured Data with Zero User Auth]({% post_url 2026-03-20-dataverse-search-in-copilot-studio-unauthenticated-structured-data %}) — it covers everything from indexing to a working agent.
{: .prompt-info }

### When to use it

- Users **don't know exact values** (they'll type "Darol" when the record says "Daryl")
- You have **large datasets** (hundreds of thousands to millions of rows)
- You need **discovery-style search** — "find me something related to X"
- You want to **pair it with List Rows** for a two-step pattern: fuzzy search to identify records, then deterministic retrieval for full details
- You have **text-heavy columns** (descriptions, notes, attachments) that need searching

### When to move on

- You need **exhaustive filtered results** (Search Query returns top-scored matches only)
- You need results from columns that aren't indexed (it only searches indexed text columns)
- You want a simple, single-step retrieval

### How to set it up

**Prerequisites:** Dataverse Search must be enabled and your columns must be indexed. This is the prerequisite people most often miss.

1. Go to **Power Platform Admin Center** → select your environment
2. Navigate to **Settings** → **Product** → **Features**
3. Find **[Dataverse Search](https://learn.microsoft.com/en-us/power-platform/admin/configure-relevance-search-organization)** and toggle it **On**
4. Wait for the environment-level index to initialize (can take a few minutes)
5. In your **Dataverse solution**, open each table you want searchable
6. **Enable the table for search indexing** and select which columns to index

> Only text-type columns can be indexed (Single Line of Text, Multiple Lines of Text). Booleans, numbers, and lookups are not indexable for fuzzy search. Be selective — indexing consumes storage.
{: .prompt-warning }

**Configure the tool in Copilot Studio:**

1. Add a new tool → **Dataverse connector** → **Perform unbound action**
2. Set the **action name** to `searchquery`
3. Configure the input to specify which fields to search against and the search term

<!-- SCREENSHOT: Search Query tool configuration in Copilot Studio showing the unbound action setup with searchquery action name -->
<!-- ![Search Query tool configuration](/assets/posts/dataverse-retrieval-patterns-copilot-studio/search-query-tool-config.png){: .shadow } -->
<!-- _Configuring the searchquery unbound action as a tool in Copilot Studio_ -->

Example input structure:

```json
{
  "search": "{user_search_term}",
  "entities": "cr_facility",
  "fields": "cr_name,cr_district,cr_description"
}
```

### The two-step pattern: Search Query + List Rows

This is the most common enterprise pattern. Fuzzy search discovers candidates, then List Rows retrieves full details.

```mermaid
flowchart LR
    A["User: 'Find<br>Darol center'"] --> B["Search Query<br>(fuzzy match)"]
    B --> C["Returns candidates:<br>Daryl Community Center<br>Darrel Services Point<br>Darnell Civic Office"]
    C --> D["Agent picks<br>best match or<br>asks user"]
    D --> E["List Rows<br>(by record ID)"]
    E --> F["Full record<br>with all columns"]
    F --> G["Agent responds<br>with complete info"]
    
    style B fill:#9333ea,color:#fff
    style E fill:#2d7d46,color:#fff
```

To set this up, you need two tools configured in your agent:

1. **Search Query tool** — configured as described above, returns candidate records with IDs and indexed columns
2. **List Rows tool** — configured to accept a record ID and return the full row with all columns

The orchestrator chains them: Search Query finds "Daryl Community Center" from the typo "Darol," then List Rows pulls the full record with phone numbers, address, service offerings, and everything else that wasn't in the search index.

> The `filter` parameter in the searchQuery API is a **post-filter** — it narrows the top-N ranked results, not the full table. This is a native Dataverse API feature, not something the orchestrator does. If you put the same OData filter in List Rows vs. as a post-filter on Search Query, List Rows will return more results because it filters the full table.
{: .prompt-warning }

### Greenfield example

A resident types: *"Where's the Darol center?"*

Search Query finds "Daryl Community Center" despite the typo, scores it highest, and returns it with a relevance score. The agent either presents it directly or, if there are multiple close matches, asks the resident to confirm which one they meant. Then List Rows pulls the full record with phone, address, and active programs.

### Key details

- **Probabilistic, not deterministic** — returns relevance-scored results, not exact matches
- Indexes the **first 1-2 MB of text** from attached files, which opens up document search scenarios
- Returns relevance parameters you can use for ranking and disambiguation
- Works with **any authentication mode** when using service principal credentials

### When you'll hit the wall

Search Query finds records, but it doesn't reason over them. "How many facilities are in the West district?" requires counting. "Which district has the most community hubs?" requires comparison. If your use case involves aggregation or analysis, the Prompt Tool handles that.

## 5. Prompt Tool: LLM Reasoning Over Your Data


### What it is

Copilot Studio's [prompt tool](https://learn.microsoft.com/en-us/microsoft-copilot-studio/create-custom-prompt): a configurable, single-shot LLM call that you can point at Dataverse tables as a knowledge source. You write instructions in natural language, pick a model, define inputs and outputs, and use it as a reusable tool in your agent. Think of it as a custom AI function with direct access to your table data.

### When to use it

- You need **aggregations, summaries, or calculations** over table data
- You want to **swap models** — test GPT, Anthropic, or any of the thousands of chat-enabled models in the [Microsoft Foundry catalog](https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview)
- You need **complex reasoning** over a subset of filtered data
- You want a **reusable, tool-shaped** LLM call with defined inputs and outputs
- You want to combine **multiple Dataverse tables** as knowledge context within a single prompt

### When to move on

- Simple lookups where List Rows or Knowledge would suffice (don't use a cannon for a nail)
- You need real-time, high-throughput retrieval (Prompt Tool adds LLM processing time)
- Your data is too large to fit in a prompt context window

### How to set it up

**Prerequisites:** Your environment needs access to chat-enabled models. The default GPT models should be available out of the box. Check with your admin if specific models are restricted by policy.

1. In Copilot Studio, create a new **Prompt** (under Tools or the Prompt section)
2. Write **instructions** in natural language describing what the prompt should do, how to interpret user questions, and what format to return results in
3. Add **Dataverse tables as knowledge** — click the knowledge picker and select your tables. All columns become available to the LLM
4. Define **inputs** (e.g., the user's question or a specific filter value)
5. Define **outputs** (e.g., a text summary, a count, a formatted list)
6. **Select a model** from the dropdown
7. Test the prompt directly in the prompt editor before wiring it into your agent
8. Add the prompt as a **tool** in your agent so the orchestrator can call it when relevant

<!-- SCREENSHOT: Prompt Tool editor in Copilot Studio showing instructions, Dataverse tables attached as knowledge, and model selection dropdown -->
<!-- ![Prompt Tool editor](/assets/posts/dataverse-retrieval-patterns-copilot-studio/prompt-tool-editor.png){: .shadow } -->
<!-- _The Prompt Tool editor with Dataverse tables attached as knowledge and model selection_ -->

### How the Prompt Tool works

```mermaid
flowchart LR
    A["User: 'How many<br>facilities in<br>the West?'"] --> B["Orchestrator routes<br>to Prompt Tool"]
    B --> C["Prompt Tool loads<br>Dataverse tables<br>as knowledge context"]
    C --> D["Selected model<br>reasons over data"]
    D --> E["Returns: 'There are<br>12 facilities in<br>the West district'"]
    E --> F["Agent passes<br>result to user"]
    
    style D fill:#dc2626,color:#fff
```

### Greenfield example

A resident asks: *"How many community hubs do we have in each district?"*

None of the other methods can answer this directly — Knowledge and Search Query don't aggregate, and List Rows returns raw rows without counting. The Prompt Tool loads the Facilities table data, reasons over it, and returns: "West: 12, North: 8, Central: 6, South: 5, East: 4."

> The Prompt Tool works well for aggregation depending on the model you use, but it's not zero-hallucination. LLMs can miscount, especially with large datasets. If exact numbers are critical for your use case, use List Rows to retrieve the filtered set and let your application logic do the counting. The Prompt Tool is best for approximate summaries and analytical reasoning where close-enough is good enough.
{: .prompt-warning }

### Key details

- Handles **fuzzy matching naturally** — if "Daryl Civics Office" doesn't exist, it can suggest close matches
- Can do **aggregation and computation** (counts, sums, comparisons) that other retrieval methods can't
- Model selection matters — different models may perform better for different query types
- The prompt runs as a single LLM call each time, so keep the data context manageable
- Great for **analytical questions** that go beyond simple record retrieval

### When you'll hit the wall

- Prompt Tool is hallucinating counts or making arithmetic errors → **verify critical numbers with List Rows**
- Response time is too slow for your scenario → **pre-filter with List Rows**, then reason over a smaller dataset with the Prompt Tool
- You need deterministic, auditable answers → **switch to List Rows or Search Query** where the query is explicit

## Decision Matrix

| Criteria | Knowledge | List Rows | MCP Server | Search Query | Prompt Tool |
|---|---|---|---|---|---|
| **Setup effort** | Low | Medium | Low | Medium-High | Medium |
| **Query control** | None (automatic) | Full (you describe OData) | None (MCP decides) | Partial (you pick columns) | Via instructions |
| **Result completeness** | Top N only | All matching rows | Varies | Top scored only | Depends on context size |
| **Fuzzy matching** | Via glossary/synonyms | No (exact filters) | Partial | Yes (core strength) | Yes (LLM reasoning) |
| **Auth requirement** | User auth required | Any (incl. anonymous) | Any (via custom connector) | Any | Any |
| **Cross-table joins** | Yes (follows relationships) | Manual (multiple tools) | Yes (auto-chains) | Single table per call | Multiple tables as knowledge |
| **Aggregation/calculation** | No | No | No | No | Yes |
| **DLP granularity** | Per knowledge source | Per connector | One connector (all-or-nothing) | Per connector | Per prompt |
| **Best for** | Quick Q&A, general lookup | Precise filtered retrieval | Exploration, prototyping | Discovery, fuzzy search | Summaries, calculations |

## General Tips

**Rename connectors** to their business function, not their technical name. "Emergency Services Lookup" tells the orchestrator more than "Dataverse List Rows" when it's deciding which tool to call.

**Glossary quality is everything.** Whether you're configuring Knowledge, writing List Rows input descriptions, or relying on MCP's auto-discovered table descriptions — the quality of your field definitions and synonyms directly determines answer quality.

**Use logical field names** from Dataverse column definitions, not display names, when writing OData filter descriptions or configuring search fields.

**Check the Activity tab** in the test panel. The chain-of-thought reasoning shows you exactly what the agent is doing, what queries it's forming, and where things go wrong. This is your debugging superpower.

<!-- SCREENSHOT: The Activity tab showing chain-of-thought reasoning for a multi-tool retrieval, with the orchestrator's decision process visible -->
<!-- ![Activity tab multi-tool](/assets/posts/dataverse-retrieval-patterns-copilot-studio/activity-tab-multi-tool.png){: .shadow } -->
<!-- _The Activity tab reveals which tools the orchestrator selected and why_ -->

**Don't force one method.** A well-built agent often uses two or three retrieval methods for different scenarios within the same agent. Start with one, add more as you hit limits.

**Write good table and column descriptions in Dataverse itself.** MCP and Knowledge both pull these descriptions automatically. Good metadata in Dataverse means less configuration work in Copilot Studio.

**DLP before you ship.** Review your DLP policies before deploying any of these patterns to production:
- **Connectors** (List Rows, Search Query, Prompt Tool): controllable per DLP policy
- **MCP**: all-or-nothing at the DLP level — disable unwanted operations in the tool config
- **Knowledge**: controlled per knowledge source in Copilot Studio settings
- **Conditional Access**: if you require user auth, make sure your policies allow Copilot Studio to access Dataverse on behalf of the user

## Wrapping Up

This post started because I saw Karima and Bobby Chang walk through these five patterns in an internal session and thought: this is too useful to keep behind a firewall. Every Copilot Studio builder working with Dataverse hits the "which method do I use?" question at some point, and the answer is almost never just one method.

Start simple. Hit the wall. Add another method. That's the pattern.

Which combination of methods are you using in your agents? What tripped you up? We'd love to hear — drop a comment below.
