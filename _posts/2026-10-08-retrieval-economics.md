---
title: "Retrieval Economics: How Knowledge Governance Shapes Agent Efficiency"
date: 2026-10-08
categories: [copilot-studio, governance]
tags: [copilot-studio, knowledge-sources, metadata-filtering, knowledge-search, governance, knowledge grounding, knowledge governance, retrieval efficiency]
description: "Duplicate, outdated, and conflicting sources add retrieval work. See how knowledge governance helps Copilot Studio agents stay grounded and efficient."
author: khushboospanda
agent_edition: both
image:
  path: /assets/posts/retrieval-economics/header.jpg
  alt: "A cat in glasses sits at a laptop while a user question splits into two paths. One path shows a pile of conflicting documents ending in a warning. The other shows a short stack of current, verified documents ending in a checked answer."
---

Picture an HR agent that gets asked about the hotel limit for a business trip. The [knowledge sources](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio) it searches hold five years of the travel and expense policy, a few near-identical FAQs, and a draft of next year's rates. Retrieval returns several plausible matches. The agent searches again, reads more content, and works out which version is current before it answers. In a case like this, much of the extra work comes from the knowledge the agent searches rather than from the model.

Content quality and information architecture influence how much retrieval and reasoning work an agent performs for each task. That work affects answer quality, context use, and latency and, depending on the agent design and licensing model, can also influence consumption. This post follows that HR agent from problem to fix. It identifies the source problems that create extra work, explains which parts of the work they add, applies the governance practices that address them, and shows how to check the effect with your own questions.

![Flow diagram of one user question taking two paths. With focused, current, authoritative content, the agent searches knowledge, finds a match, and takes a direct answer path. With scattered or conflicting content, the agent searches knowledge, gets an ambiguous match, reformulates and searches again, which can mean more searches and more tokens.](/assets/posts/retrieval-economics/retrieval-paths.png){: w="700" h="401" }
_The same question can produce very different retrieval paths: focused, current content may support a direct answer, while scattered or conflicting content can require additional retrieval and reconciliation._

The key design question is: how much retrieval, reasoning, and verification work does your knowledge base create for one task?

This post uses two kinds of boundary. A **document boundary** decides what information belongs together in one document. A **knowledge boundary** decides which sources stay available for the agent to search. The first shapes how much relevant and unrelated content each file brings to an answer. The second shapes how many sources compete for the same question.

## What drives the work behind an answer

A grounded answer can require more than one retrieval operation. Five factors contribute to the work behind an answer. The last column shows how each one appears in the HR example.

| Factor | What it covers | In the HR example |
|---|---|---|
| Base retrieval | The platform activity required to invoke search. The search mechanism is platform-defined, and its billing treatment depends on the harness and features used. | The agent searches the HR knowledge source for the hotel limit on business travel. |
| Context | The evidence retrieved from knowledge sources and passed to the model for a task. Its usefulness depends on relevance, authority, consistency, and amount. Outdated, duplicate, or unrelated material can compete with the evidence the answer needs. | Several years of the travel policy, near-identical FAQs, and a draft of next year's rates return as candidates. |
| Reasoning | The work required to compare candidates, reconcile conflicts, and synthesize evidence across sources. | The agent compares effective dates and rates to identify the policy in force. |
| Retries | Additional retrieval attempts when the first result set does not provide sufficient or reliable evidence. | If the candidates conflict, the agent reformulates and searches again. |
| Verification | The checks needed to establish that an answer is grounded in an appropriate source and can be traced or cited when needed. | The agent has to confirm that the cited source is the approved policy currently in force. |

Retrieved evidence is one part of the model's context, alongside instructions, conversation history, and tool output. This post focuses on the retrieved evidence, because that is the part knowledge governance can change.

Content preparation does not change the underlying price or service behavior of a platform search operation. It can, however, influence whether the first retrieval returns a focused set of sources, how much irrelevant evidence is introduced, and how often the agent must perform additional retrieval, synthesis, or validation. Over-fragmenting content can also create a different problem by requiring the agent to assemble an answer from several sources.

> The consumption impact of better content depends on the specific platform, configuration, tools, models, and licensing model.
{: .prompt-info }

## Where the extra work comes from

The five factors describe the work behind an answer. A knowledge base adds avoidable work to those factors in four ways. Two come from how the knowledge base is organized: which sources the agent can search, and how each document is shaped. Two come from the content itself: whether the answer exists, and whether its source can be verified.

| Problem | What the agent encounters | Work it adds | Where the fix sits |
|---|---|---|---|
| Too many competing sources | Several plausible matches for one question | Reasoning, retries, verification | The knowledge boundary |
| Documents shaped the wrong way | Evidence mixed with unrelated material, or split across fragments | Context, reasoning, retries | The document boundary |
| Missing information | No source holds the answer, or retrieval doesn't surface it | Retries, escalation | Source coverage and metadata |
| Hard-to-verify answers | A correct answer with an unclear source | Verification | Source metadata and citation design |

### Too many competing sources

In the travel example, five years of policy and several FAQs all match a question about hotel limits. The agent has to work out which version is in force before it can answer. Each extra candidate adds reasoning and verification, and conflicting candidates can trigger another search.

The fix is to narrow the knowledge boundary so fewer sources compete. That means retiring superseded versions, removing duplicates, and filtering by metadata. Research on [entity-based chunk filtering](https://arxiv.org/abs/2604.24334) supports this approach. In its experiments, removing redundant content reduced index size while retrieval quality stayed near baseline. The next section covers the practices that keep this boundary narrow.

### Documents shaped the wrong way

Even with the right sources in the knowledge boundary, the shape of each document affects the work. A large, mixed-topic document places unrelated material next to the evidence. Over-fragmented content splits one answer across several sources that the agent has to retrieve and combine.

Shape matters more on the [GitHub Copilot harness](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview), where the agent can open a full knowledge file in its [sandbox]({% post_url 2026-07-20-copilot-studio-agent-sandbox %}) rather than work only from search snippets. The document's shape then decides how much unrelated content the agent examines. A full file in the sandbox is not the same as its whole content in every model call, and it doesn't guarantee that a follow-up question avoids another search. Measure this for your own workload.

[Lost in the Middle](https://arxiv.org/abs/2307.03172) found that the evaluated models used relevant information less reliably when it appeared in the middle of long context. This supports focused documents, where less unrelated material surrounds the evidence.

Design document boundaries around the questions users ask rather than the organizational chart or file system. Keep information that is usually needed together in one source, and separate content that answers unrelated questions.

![Three-row diagram. The target row shows a focused source with policy, scope, and relevant exceptions together, leading to relevant content for grounding and reasoning, and then to relevant context with minimal competing information. Pattern 1, a mixed-topic source, introduces unrelated material alongside relevant evidence and distracts from it. Pattern 2, over-fragmented content, means several isolated fragments must be combined, so more retrieval and synthesis is required.](/assets/posts/retrieval-economics/knowledge-boundaries.png){: w="700" h="470" }
_Mixed-topic sources and over-fragmented content both add retrieval work, in different ways._

### Missing information

Sometimes no source holds the answer, or retrieval doesn't surface it. A broad question across many department reports may miss one department's figure. The agent should report the gap, try a more targeted search, or escalate rather than guess. The fix may be better source coverage, better metadata, a different retrieval approach, or a human process. Adding more content alone rarely closes the gap.

### Hard-to-verify answers

An answer can be correct but cite no clear source, so users can't tell whether it comes from the approved policy. Clear titles and identifiers, source metadata, and citation design make verification easier. Higher-risk scenarios may also need human review.

> The studies cited here don't measure Copilot Studio consumption or answer quality. Treat them as reasons to test governance changes, and validate the effect against your own questions.
{: .prompt-warning }

Competing sources are the problem that grows fastest as a knowledge base scales. The next section covers seven practices that keep the knowledge boundary narrow.

## Keeping the knowledge boundary narrow

The seven practices below govern what enters the active knowledge boundary and how it's maintained. The diagram shows obsolete and duplicate content being separated from active sources, then ownership, metadata, and question-focused organization being applied to the content that remains.

![Flow diagram titled From a noisy corpus to a selective boundary. Published documents that are current, outdated, duplicated, or draft pass through two gates, deprecate and deduplicate. Content caught by the gates moves to an archive held for historical access, audit, or legal need. What remains enters the active knowledge boundary, where documents have owners and metadata filters, are grouped by the questions they answer, and sit in either a structured table for entity lookups or organized prose for policy and procedure. Seven numbered markers match the practices listed below.](/assets/posts/retrieval-economics/designing_for_selectivity_graphic.png){: w="700" h="400" }
_The seven practices act on content as it moves from everything published to the active knowledge boundary._

- **Maintain active knowledge boundaries.** Archive, restrict, or exclude obsolete content from active retrieval where appropriate. Keep active policies separate from historical references and working drafts.
- **Establish ownership.** Assign an accountable owner to each active knowledge source. That owner should be responsible for review, replacement, retirement, and conflict resolution.
- **Treat deprecation as a workflow.** When a new version becomes effective, update references and remove or restrict the superseded source from the active retrieval boundary. Retain it separately only when historical access, legal retention, or audit needs require it.
- **Deduplicate deliberately.** Identify and remove, consolidate, or restrict exact and near-duplicate documents, repeated FAQs, copied policy clauses, and multiple exports of the same information. Preserve only the authoritative version in the active knowledge boundary.
- **Use metadata filtering to narrow the active knowledge boundary for each question.** Choose metadata that reflects how users ask questions, such as country, business unit, effective date, or document status. In Copilot Studio agents powered by the GitHub Copilot harness, the agent can use SharePoint library metadata to identify matching files and scope a content search, as shown in [SharePoint Metadata Filtering in Copilot Studio]({% post_url 2026-09-01-sharepoint-metadata-filtering %}). For the Standard harness, use the supported source-level conditions described in [Filter your SharePoint source](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-sharepoint#filter-your-sharepoint-source); don't assume the same dynamic custom-column routing. Both approaches depend on complete, consistently maintained metadata.
- **Align document boundaries to how people ask questions,** rather than mirroring organizational or file-system structure.
- **Match the representation to the question.** Entity-attribute lookups are often more reliable and efficient when answered from structured data. Policy interpretation, procedural guidance, and nuanced exceptions usually require clearly organized prose.

Consider the question, "What was customer X's revenue in Q2?" A governed table or other structured data source is usually a more direct fit than dozens of prose documents that restate the same metric. By contrast, policy interpretation or procedural guidance often requires well-structured prose that includes scope, exceptions, and effective dates. The goal is not to structure everything but to use the representation that minimizes ambiguity and competing evidence for the question being asked.

A question often suggests useful metadata for narrowing a search. These examples illustrate the intent, not a filter configuration supported identically by every harness. Historical questions need an archive source that is deliberately included in the knowledge boundary, rather than access to an archive the agent cannot search.

| Question | Filters the question implies |
|---|---|
| "What is the hotel limit for a business trip to Canada?" | Region: Canada. Policy type: travel. Status: current. |
| "Which security standard applies to the retail business unit?" | Business unit: retail. Policy type: security. Status: current. |
| "What did the 2024 travel policy say about hotel limits?" | Policy type: travel. Effective date: 2024. Status: archived. |

### Applying the practices to the HR agent

Each source problem in the HR example maps to a practice and an expected effect. The effects below are what you would expect to see, not measured results. Validate them with the procedure in the next section.

| Source problem | Work it creates | Practice applied | Expected effect | How to check |
|---|---|---|---|---|
| Five years of the travel and expense policy | Competing candidates, extra reasoning to find the version in force, and extra verification | Treat deprecation as a workflow. Archive earlier years and tag the version in force with a status of current. | Fewer competing candidates and a more direct answer path | Citations point to the policy in force. Search calls and files examined drop where the activity trace shows them. |
| Several near-identical travel FAQs | Redundant evidence and small conflicts in the rates they quote | Deduplicate deliberately. Consolidate them into one FAQ owned by the travel policy owner. | A smaller, more consistent evidence set | Answers quote the same rates across repeated runs. |
| A draft of next year's rates in the same library | Risk of quoting rates that are not yet in effect | Maintain the active knowledge boundary. Keep drafts out until their effective date and assign an owner to the policy. | Lower risk of grounding on unapproved content | The answer matches the expected answer, and the draft never appears as a citation. |

## Measure the impact in your environment

Knowledge governance should be evaluated, not assumed. Compare the current knowledge boundary with a governed version using a repeatable procedure:

1. **Define the workload.** Select representative real questions, including policy exceptions, ambiguous requests, historical questions, and questions the agent should escalate. Record the expected answer and authoritative source for each. Fix the test identities and permissions so both versions can access equivalent evidence. For the HR agent, the set could include the current hotel limit for a domestic trip, the limit for a trip to Canada, what the 2024 policy allowed, and a request for an exception that should be escalated to an approver.
2. **Change the knowledge boundary, not the whole agent.** Keep the harness, model, instructions, tools, and question set the same. Record which sources, document boundaries, or metadata changed. Run each question multiple times against both versions. Test fresh conversations separately from scripted follow-ups, using the same preceding turns for each follow-up sequence.
3. **Compare quality and work together.** Record results per question and summarize repeated runs. Use the same timing method and workload size for both versions. Include failures and escalations rather than reporting only successful answers.

| What to compare | What to record | Where to find it |
|---|---|---|
| Answer quality | Correct policy, scope, and exceptions against the expected answer; whether escalation was appropriate | Your evaluation sheet, scored against the expected answers |
| Grounding | Whether citations identify the intended authoritative source; relevant versus competing sources where visible | Citations in the agent's responses |
| Retrieval work | Search calls and files examined where exposed by the available activity trace or telemetry | The agent's activity map or conversation transcript, where available |
| Latency | Elapsed time to the completed answer, with the median and range across repeated runs | Your own timing method, applied the same way to both versions |
| Usage | Available Copilot Credit consumption for equivalent workloads, with the aggregation level and reporting window recorded | Tenant consumption reporting through the Power Platform API, described below |

Don't treat the number of citations as a count of retrieval calls, or infer token usage from document size. If a metric isn't exposed, mark it as unavailable. Collect user satisfaction separately through a pilot with the same questions or tasks.

Billing must be interpreted for the harness being tested: [Billing rates and management](https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management) describes the Standard harness, while [Overview of usage-based billing](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/billing-credit-overview) describes GitHub Copilot harness consumption, including model tokens, tools, and the harness itself. Less retrieval work does not necessarily produce an equivalent reduction in billed usage.

For tenant-wide reporting, [Where Are Your Copilot Credits Going?]({% post_url 2026-08-25-copilot-credit-consumption-api %}) shows how to retrieve consumption through the Power Platform API. Aggregate reporting can support workload comparisons, but don't present it as per-question attribution. Knowledge governance also complements the controls described in [Manage costs for agents powered by the GitHub Copilot harness](https://learn.microsoft.com/en-us/power-platform/admin/manage-usage-github-copilot-harness).

The objective is not to prove that every document cleanup activity produces a fixed consumption reduction. It is to identify which governance changes reduce avoidable retrieval work while preserving or improving answer quality.

## Knowledge governance is the ongoing efficiency control

Data preparation is the initial build. Knowledge governance is the operating discipline that helps preserve retrieval quality, source authority, and agent efficiency as the knowledge environment changes.

A knowledge base does not remain static. Policies change, reports accumulate, documents are copied, ownership shifts, and new systems can restate information that already exists elsewhere. Without lifecycle governance, a carefully prepared knowledge boundary can gradually become noisy, ambiguous, and difficult to retrieve from effectively.

![Two-row lifecycle diagram. Governed knowledge moves from publish or update, to review on a defined cadence, to retire, archive, or restrict, which keeps retrieval quality easier to maintain. Without an active governance process, there is no accountable source owner and no regular review or retirement, so duplicates, ambiguity, and conflicts accumulate and retrieval friction grows over time.](/assets/posts/retrieval-economics/governance-lifecycle.png){: w="700" h="327" }
_Governed knowledge moves through a controlled review-and-retirement cycle. Without governance, duplicates, conflicts, and retrieval friction tend to accumulate over time._

Governance is part of an agent's architecture, not a separate compliance exercise. Customers might not control every aspect of the retrieval system in a managed platform, but they can govern the knowledge sources, source boundaries, authority signals, and lifecycle processes the agent uses.

The quality of an agent's answers begins long before a user submits a question.

Start with one scenario. Pick a knowledge area where your agent gives inconsistent or slow answers, such as a travel policy with several years of rates in circulation. Write down the questions users ask and the answer you expect for each. Retire superseded versions, consolidate duplicates, and tag the remaining sources with the metadata those questions imply. Then run the same questions against both versions using the procedure in [Measure the impact in your environment](#measure-the-impact-in-your-environment), and compare answer quality, grounding, retrieval work, latency, and usage.