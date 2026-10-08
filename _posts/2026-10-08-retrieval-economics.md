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

Picture an HR agent that gets asked about parental leave. The [knowledge sources](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio) it searches hold five versions of the policy, a few near-identical FAQs, and an old draft. Retrieval returns several plausible matches. The agent searches again, reads more content, and works out which version is current before it answers. In a case like this, much of the extra work comes from the knowledge the agent searches rather than from the model.

Content quality and information architecture influence how much retrieval and reasoning work an agent performs for each task. That work affects answer quality, context use, and latency and, depending on the agent design and licensing model, can also influence consumption. This post explains how content quality, document boundaries, lifecycle governance, and metadata filters can affect retrieval relevance, context size, response quality, and latency. It also outlines a practical way to measure the impact in your own environment.

![Flow diagram of one user question taking two paths. With focused, current, authoritative content, the agent searches knowledge, finds a match, and takes a direct answer path. With scattered or conflicting content, the agent searches knowledge, gets an ambiguous match, reformulates and searches again, which means more searches and more tokens.](/assets/posts/retrieval-economics/retrieval-paths.png){: w="700" h="401" }
_The same question can produce very different retrieval paths: focused, current content may support a direct answer, while scattered or conflicting content can require additional retrieval and reconciliation._

The key design question is: how much retrieval, reasoning, and verification work does your knowledge base create for one task?

## What drives the work behind an answer

A grounded answer can require more than one retrieval operation. Five factors contribute to the work behind an answer:

- **Base retrieval:** The platform activity required to invoke search. The search mechanism is platform-defined; its billing treatment depends on the harness and features used.
- **Context:** The volume of retrieved content made available for reasoning. Redundant or irrelevant material can increase context size and distract from the relevant evidence.
- **Reasoning:** The work required to compare candidates, reconcile conflicts, and synthesize evidence across sources.
- **Retries:** Additional retrieval attempts when the first result set does not provide sufficient or reliable evidence.
- **Verification:** The checks needed to establish that an answer is grounded in an appropriate source and can be traced or cited when needed.

Content preparation does not change the underlying price or service behavior of a platform search operation. It can, however, influence whether the first retrieval is sufficiently selective, how much irrelevant context is introduced, and how often the agent must perform additional retrieval, synthesis, or validation. Over-fragmenting content can also create a different problem by requiring the agent to assemble an answer from several sources.

> The consumption impact of better content depends on the specific platform, configuration, tools, models, and licensing model.
{: .prompt-info }

Two concepts help distinguish the work behind one answer from the quality of the corpus as a whole.

### Retrieval footprint

Retrieval footprint describes the information and work an agent must engage with to answer one task: search scope, candidate volume, context size, reasoning passes, and verification effort. It's a design concept, not a Copilot Studio telemetry metric.

In the leave policy example, the current answer may appear in only one version, but retrieval can surface several plausible candidates. The agent, or the experience around it, then has to determine which source is current and authoritative before answering with confidence. Retiring or excluding obsolete versions reduces this ambiguity and helps keep the retrieval footprint focused on the evidence needed.

### Information density

Information density describes how much of the active corpus is unique, current, answer-relevant information rather than redundant, outdated, or unrelated content.

> A collection of focused, authoritative documents is generally easier to retrieve from and reason over than a collection padded with duplicate FAQs, outdated versions, and conflicting restatements. The result should be validated using representative questions and an evaluation set.
{: .prompt-tip }

## What research suggests about retrieval efficiency

Research offers useful evidence, with different limits for each study. [Entity-based chunk filtering](https://arxiv.org/abs/2604.24334) reduced index size while keeping retrieval quality near baseline in its experiments. [Lost in the Middle](https://arxiv.org/abs/2307.03172) found that the evaluated models used relevant information less reliably when it appeared in the middle of long context. These findings support testing whether redundant content makes evidence harder to retrieve or use.

[Zero-RAG](https://arxiv.org/abs/2511.00505) explores a different approach: pruning content a model already knows and routing some questions to its internal knowledge. It reports efficiency improvements in its evaluated setting, but that approach is different from deduplicating enterprise policies while retaining authoritative grounding.

> These studies do not measure Copilot Studio consumption. Zero-RAG is not a recommendation to remove authoritative policies because a model appears to know them. Keep the sources needed to establish current policy, scope, and exceptions, and validate changes against your own questions.
{: .prompt-warning }

## How the GitHub Copilot harness retrieves knowledge

In Copilot Studio, agents powered by the [GitHub Copilot harness](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview) can work with knowledge files in their [sandbox]({% post_url 2026-07-20-copilot-studio-agent-sandbox %}), rather than being limited to the snippets returned by search. The agent can open a retrieved file and analyze its contents.

Having a full file available in the sandbox is different from placing its entire contents into every model call. It also doesn't guarantee that a follow-up question avoids another search. Measure the searches and file-processing work for your workload rather than assuming a fixed caching behavior.

For file-based retrieval, document boundaries affect how much relevant and unrelated content is available for the agent to examine. A tightly scoped document keeps related evidence together; an oversized one can introduce material the question doesn't require.

## Why knowledge boundaries matter in agent design

Consider two common knowledge-design extremes. A large, mixed-topic document can include material that is unrelated to the user's question, making the relevant evidence harder to isolate. At the other extreme, highly fragmented content can require an agent to combine several sources to form one complete answer. Both patterns can increase retrieval and reasoning effort, though in different ways.

Design knowledge boundaries around the questions users ask, rather than simply mirroring an organizational chart or file system. Keep information that is normally needed together in one focused source, and separate content that answers genuinely unrelated questions.

![Three-row diagram. The target row shows a focused source with policy, scope, and relevant exceptions together, leading to relevant content for grounding and reasoning, and then to relevant context with minimal competing information. Pattern 1, a mixed-topic source, introduces unrelated material alongside relevant evidence and distracts from it. Pattern 2, over-fragmented content, means several isolated fragments must be combined, so more retrieval and synthesis is required.](/assets/posts/retrieval-economics/knowledge-boundaries.png){: w="700" h="470" }
_Mixed-topic sources and over-fragmented content both add retrieval work, in different ways._

## Three ways a knowledge base creates avoidable friction

Good document boundaries address one type of friction. A knowledge base can still make answering difficult for reasons unrelated to document size. Three common failure modes are coverage, selectivity, and attribution. Each requires a different response.

1. **Coverage:** The required information is missing, inaccessible, or not retrieved. For example, a broad question across many department reports may fail to surface one department's figure. The appropriate response is to identify the gap, run a more targeted search where appropriate, or escalate rather than guess. The fix may be better source coverage, better metadata, a different retrieval approach, or a human process, not simply adding more content.
2. **Selectivity:** Too many plausible sources compete. Two overlapping versions of a policy can create ambiguity about which version is current or authoritative. The agent may need additional evidence or a review process before answering with confidence. The practices in the next section address this, including ownership, retiring superseded versions, and metadata filters.
3. **Attribution:** The answer is right but hard to verify. If a response does not clearly identify its supporting source, users cannot easily assess whether the answer is grounded in the intended authority. The remedy includes source-level metadata, clear titles and identifiers, citation design, evaluation, and, in higher-risk scenarios, human review.

## Designing for selectivity at scale

The seven practices below govern what enters the active knowledge boundary and how it's maintained. The diagram shows obsolete and duplicate content being separated from active sources, then ownership, metadata, and question-focused organization being applied to the content that remains.

![Flow diagram titled From a noisy corpus to a selective boundary. Published documents that are current, outdated, duplicated, or draft pass through two gates, deprecate and deduplicate. Content caught by the gates moves to an archive held only for audit or legal need. What remains enters the active knowledge boundary, where documents have owners and metadata filters, are grouped by the questions they answer, and sit in either a structured table for entity lookups or organized prose for policy and procedure. Seven numbered markers match the practices listed below.](/assets/posts/retrieval-economics/designing_for_selectivity_graphic.png){: w="700" h="400" }
_The seven practices act on content as it moves from everything published to the active knowledge boundary._

- **Maintain active knowledge boundaries.** Archive, restrict, or exclude obsolete content from active retrieval where appropriate. Keep active policies separate from historical references and working drafts.
- **Establish ownership.** Assign an accountable owner to each active knowledge source. That owner should be responsible for review, replacement, retirement, and conflict resolution.
- **Treat deprecation as a workflow.** When a new version becomes effective, update references and remove or restrict the superseded source from the active retrieval boundary. Retain it separately only when historical access, legal retention, or audit needs require it.
- **Deduplicate deliberately.** Identify and remove, consolidate, or restrict exact and near-duplicate documents, repeated FAQs, copied policy clauses, and multiple exports of the same information. Preserve only the authoritative version in the active knowledge boundary.
- **Use metadata filtering to narrow the active search boundary.** Choose metadata that reflects how users ask questions, such as country, business unit, effective date, or document status. In Copilot Studio agents powered by the GitHub Copilot harness, the agent can use SharePoint library metadata to identify matching files and scope a content search, as shown in [SharePoint Metadata Filtering in Copilot Studio]({% post_url 2026-09-01-sharepoint-metadata-filtering %}). For the Standard harness, use the supported source-level conditions described in [Filter your SharePoint source](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-sharepoint#filter-your-sharepoint-source); don't assume the same dynamic custom-column routing. Both approaches depend on complete, consistently maintained metadata.
- **Align knowledge boundaries to how people ask questions,** rather than mirroring organizational or file-system structure.
- **Match the representation to the question.** Entity-attribute lookups are often more reliable and efficient when answered from structured data. Policy interpretation, procedural guidance, and nuanced exceptions usually require clearly organized prose.

Consider the question, "What was customer X's revenue in Q2?" A governed table or other structured data source is usually a more direct fit than dozens of prose documents that restate the same metric. By contrast, policy interpretation or procedural guidance often requires well-structured prose that includes scope, exceptions, and effective dates. The goal is not to structure everything but to use the representation that minimizes ambiguity and competing evidence for the question being asked.

A question often suggests useful metadata for narrowing a search. These examples illustrate the intent, not a filter configuration supported identically by every harness. Historical questions need a deliberately available archive source rather than access to an archive excluded from the agent's knowledge.

| Question | Filters the question implies |
|---|---|
| "What is the parental leave policy in Canada?" | Region: Canada. Policy type: leave. Status: current. |
| "Which security standard applies to the retail business unit?" | Business unit: retail. Policy type: security. Status: current. |
| "What did the 2024 travel policy say about hotel limits?" | Policy type: travel. Effective date: 2024. Status: archived. |

## Measure the impact in your environment

Knowledge governance should be evaluated, not assumed. Compare the current knowledge boundary with a governed version using a repeatable procedure:

1. **Define the workload.** Select representative real questions, including policy exceptions, ambiguous requests, historical questions, and questions the agent should escalate. Record the expected answer and authoritative source for each. Fix the test identities and permissions so both versions can access equivalent evidence.
2. **Change the knowledge boundary, not the whole agent.** Keep the harness, model, instructions, tools, and question set the same. Record which sources, document boundaries, or metadata changed. Run each question multiple times against both versions. Test fresh conversations separately from scripted follow-ups, using the same preceding turns for each follow-up sequence.
3. **Compare quality and work together.** Record results per question and summarize repeated runs. Use the same timing method and workload size for both versions. Include failures and escalations rather than reporting only successful answers.

| What to compare | What to record |
|---|---|
| Answer quality | Correct policy, scope, and exceptions against the expected answer; whether escalation was appropriate |
| Grounding | Whether citations identify the intended authoritative source; relevant versus competing sources where visible |
| Retrieval work | Search calls and files examined where exposed by the available activity trace or telemetry |
| Latency | Elapsed time to the completed answer, with the median and range across repeated runs |
| Usage | Available Copilot Credit consumption for equivalent workloads, with the aggregation level and reporting window recorded |

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

The quality of an agent's answers begins long before a user submits a question. It is shaped by the authority, structure, lifecycle, and clarity of the knowledge sources available to it. Teams that govern those sources deliberately create an environment where agents can find stronger evidence, ground answers more reliably, and operate with less avoidable retrieval friction over time.