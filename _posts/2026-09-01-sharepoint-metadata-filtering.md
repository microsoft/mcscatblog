---
agent_edition: github-copilot
layout: post
title: "SharePoint Metadata Filtering in Copilot Studio: From Topic Logic to Agent Decisions"
date: 2026-09-01
categories: [copilot-studio, knowledge]
tags: [copilot-studio, github-copilot, sharepoint, knowledge-sources, metadata-filtering, knowledge-search, orchestration, skills]
description: "How GitHub Copilot harness agents use SharePoint metadata to find applicable documents, scope knowledge search, and answer without hand-built routing logic."
author: adilei
image:
  path: /assets/posts/sharepoint-metadata-filtering/header.png
  alt: "A suspiciously confident fortune teller routes SharePoint documents by metadata. Finally, a useful crystal ball."
---

SharePoint libraries often contain documents that look similar but apply to different audiences. A benefits policy might vary by country. A product guide might apply only to one market. A procedure might be valid only when its status is **Approved**.

People have been asking for a simple way to use SharePoint metadata in knowledge retrieval for what feels like forever. It only took us roughly a zillion years. Relax, we're here now.

In the Standard harness, there was no simple, configurable path from a user's intent to SharePoint metadata and then to the URLs of matching documents. Makers could approximate that routing with multiple topics and scoped **Create generative answers** nodes, but those nodes scoped retrieval to configured sources or URLs, not to document-library metadata. Every new country, department, or document state added more configuration to maintain.

Agents powered by the [GitHub Copilot harness]({% post_url 2026-07-07-new-orchestrator-resources %}) can now bridge that gap. The agent can interpret the request, filter SharePoint files by metadata, collect the matching document URLs, and search only those documents.

## Start with the use case

Every SharePoint document library already has built-in columns, such as author and modified date, and you can add custom columns for fields such as country, status, or department. Add the library as a knowledge source and ask the agent a question; there is no separate metadata tool for the maker to configure. When metadata is relevant, the agent can try to discover the available columns, use their recorded values to identify the right files, and answer from that document set. No equivalent of the Standard harness's topic-per-branch setup is needed.

Consider a library with a `Country` column. A user asks, "What parental leave benefits apply in Canada?" The agent can find every document whose recorded `Country` value is `Canada`, then search only within those files for parental leave information.

This matters because the word "Canada" might not appear in the policy itself. It might exist only in the library metadata. A content-only search can therefore miss the right document or combine information from policies intended for different countries.

The same pattern works with metadata such as:

- approval status and review date
- department, business unit, or audience
- product, service, or market
- document type, owner, or last modified date
- folder location and file type

Voila. That's the entire setup: add your SharePoint document libraries as knowledge sources. Nothing else to configure. You don't need to read the rest of this post to try it. Go play video games, get on your mountain bike, or do whatever gets you going.

Still here? Okay, here are the details.

## Two built-in tools, two different jobs

GitHub Copilot harness agents currently receive two built-in tools for SharePoint knowledge. Each tool has its own schema, so the agent can decide whether to call one of them or chain both:

| Tool | Important inputs | What it returns |
| --- | --- | --- |
| `sharepoint_metadata_filter` | Author, editor, date, file type, folder, custom-column filters, columns to include, or a column to group by | Matching file names and URLs, column values, available columns, true match counts, blank counts, and grouped totals |
| `knowledge_search_sharepoint` | A required `query`, an optional rewritten `search_query`, and optional `scopeUrls` | Search results from the selected SharePoint scope, with document titles, URLs, and reference IDs |

The metadata tool can work independently. For example, the agent can answer "How many documents are assigned to each country?" without opening and searching every file. To do that, the agent sends this input to `sharepoint_metadata_filter`:

```json
{
  "groupByColumn": "Country"
}
```
{: file="Input sent by the agent to sharepoint_metadata_filter" }

The tool returns server-calculated totals rather than only the rows displayed to the agent:

```json
{
  "aggregation": true,
  "groupBy": "Country",
  "totalMatched": 9,
  "blankCount": 6,
  "availableColumns": ["Image Tags", "Country", "Author", "Modified By"],
  "groups": [
    { "value": "US", "count": 2 },
    { "value": "EU", "count": 1 }
  ],
  "backend": "sharepoint_rest"
}
```
{: file="Output returned to the agent by sharepoint_metadata_filter" }

For a content question that doesn't need metadata, the agent can call `knowledge_search_sharepoint` directly across its configured SharePoint knowledge sources.

The more interesting case is chaining them. Consider a library with a `Country` column and the question, "What employee benefits does Contoso offer in the US?" The agent can first call `sharepoint_metadata_filter` with `Country = US`. That call returns the matching files and their URLs. The agent can then pass those URLs to the knowledge-search tool:

```json
{
  "search_query": "What employee benefits does Contoso offer in the US?",
  "query": "What employee benefits do we offer in the US?",
  "scopeUrls": [
    "https://pplatform.sharepoint.com/Shared%20Documents/Contoso%20HR%20Documents/Contoso%20Benefits.docx",
    "https://pplatform.sharepoint.com/Shared%20Documents/Contoso%20HR%20Documents/Contoso%20HR%20policies.docx"
  ]
}
```
{: file="Input sent by the agent to knowledge_search_sharepoint" }

The tool searches within the supplied URL scope and returns the matching documents:

```text
[2 results]

Title: Contoso Benefits.docx
URL: https://pplatform.sharepoint.com/.../Contoso Benefits.docx
ReferenceId: turn1doc1

Title: Contoso HR policies.docx
URL: https://pplatform.sharepoint.com/.../Contoso HR policies.docx
ReferenceId: turn1doc2
```
{: file="Output returned to the agent by knowledge_search_sharepoint" }

The agent doesn't have to chain the tools every time. It can use metadata filtering alone for inventory and aggregation questions, knowledge search alone for general content questions, or both when metadata determines the correct document scope.

## You can guide the agent, without scripting every decision

The [Knowledge Source Router skill](https://microsoft.github.io/cat-agent-skills/skills/knowledge-source-router/) shows a deliberately strict country-routing workflow. It tells the agent to inspect the library's metadata, retrieve every matching file, search only those file URLs, and report any unassigned or excluded documents.

That level of guidance is useful when the sequence must be repeatable and easy to inspect. It is **not required for every agent**. With clear agent instructions and well-described knowledge sources, you can also let the agent decide when metadata filtering is relevant and how to combine it with knowledge search.

Start with the lightest guidance that produces reliable results for your use case. Add stricter steps when testing shows that the agent needs them. If you want to package repeatable guidance for reuse, see [how Skills work in GitHub Copilot harness agents]({% post_url 2026-06-15-modern-mcs-agent-skills %}).

> The built-in metadata and knowledge-search tools are implementation details, not public APIs. Their names, parameters, and behavior can change without notice. Design around the supported Copilot Studio capability rather than depending on a specific internal tool contract.
{: .prompt-warning }

Metadata filtering narrows the content considered for an answer. It does not replace SharePoint permissions or grant access to documents the user cannot read. SharePoint permission trimming continues to apply for the signed-in user.

Good metadata also remains essential. An agent should use the values recorded in the library, not guess a country, status, or owner from a filename or from the document's prose.

## What this unlocks

**Lifecycle-aware answers.** An agent can prefer approved, current documents and avoid drafts or retired material when the library records those states.

**Audience-specific guidance.** The same SharePoint site can hold material for several departments, products, or markets without requiring a separate knowledge source for each one.

**Library inventory questions.** The agent can answer questions such as "How many policies are assigned to each owner?" or "Which files don't have a Country value?" from the library metadata rather than trying to infer the answer from document text.

The important change is not another tool to configure. It is a simpler way to separate **which documents apply** from **what those documents say**. That opens metadata-aware knowledge scenarios without turning every variation into another hardcoded routing branch.

What metadata-driven scenario have you been waiting to build?
