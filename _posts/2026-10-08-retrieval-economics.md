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

That extra work affects answer quality, context use, and latency. Depending on the agent design and licensing model, it can also affect consumption. This post follows the HR agent from problem to fix. It shows where the extra work comes from, which governance practices reduce it, and how to measure the effect with your own questions.

![Flow diagram of one user question taking two paths. With focused, current, authoritative content, the agent searches knowledge, finds a match, and takes a direct answer path. With scattered or conflicting content, the agent searches knowledge, gets an ambiguous match, reformulates and searches again, which can mean more searches and more tokens.](/assets/posts/retrieval-economics/retrieval-paths.png){: w="700" h="401" }
_The same question can produce very different retrieval paths: focused, current content may support a direct answer, while scattered or conflicting content can require additional retrieval and reconciliation._

The post uses two kinds of boundary. A **knowledge boundary** decides which sources stay available for the agent to search. A **document boundary** decides what information belongs together in one document. The first shapes how many sources compete for the same question. The second shapes how much relevant and unrelated content each file brings to an answer.

## What drives the work behind an answer

A grounded answer can require more than one retrieval operation. Five factors make up the work behind an answer. Each one is shown with the travel example.

1. **Base retrieval.** The search the platform runs. Its mechanism is platform-defined, and its billing depends on the harness and features used. In the travel example, the agent searches the HR knowledge source for the hotel limit.
2. **Context.** The evidence retrieved from knowledge sources and passed to the model. Its usefulness depends on relevance, authority, consistency, and amount. In the travel example, several years of the policy, near-identical FAQs, and next year's draft all return as candidates.
3. **Reasoning.** The work of comparing candidates, reconciling conflicts, and synthesizing evidence. In the travel example, the agent compares effective dates and rates to find the policy in force.
4. **Retries.** Additional searches when the first results are weak or conflicting. In the travel example, conflicting candidates can lead the agent to reformulate and search again.
5. **Verification.** The checks that confirm an answer is grounded in an appropriate source and can be cited. In the travel example, the agent has to confirm that the cited source is the approved policy in force.

Retrieved evidence is one part of the model's context, alongside instructions, conversation history, and tool output. This post focuses on retrieved evidence, because that is the part knowledge governance can change.

Better content doesn't change the price or behavior of a platform search operation. It changes how focused the first retrieval is, how much irrelevant evidence reaches the model, and how often the agent has to search, reason, or verify again.

> The consumption impact of better content depends on the specific platform, configuration, tools, models, and licensing model.
{: .prompt-info }

## Where the extra work comes from

A knowledge base adds avoidable work to those five factors in four ways. Two are about organization: which sources the agent can search, and how each document is shaped. Two are about content: whether the answer exists, and whether its source can be verified.

### 1. Too many competing sources

Five years of the travel policy, several near-identical FAQs, and next year's draft all match a question about hotel limits. The agent has to work out which version is in force before it answers. Each extra candidate adds reasoning and verification, and conflicting candidates can trigger another search.

The fix is a narrower knowledge boundary. Archive earlier years, merge the FAQs into one, and keep the draft out until it takes effect. You would then expect one current policy to retrieve, a more direct answer path, and no answers that quote rates before they apply. These are expected effects, not measured results, and the measurement section shows how to test them. Research on [entity-based chunk filtering](https://arxiv.org/abs/2604.24334) supports the approach. In its experiments, removing redundant content reduced index size while retrieval quality stayed near baseline. Practices 1 to 5 cover this fix.

### 2. Documents shaped the wrong way

The right sources can still be badly shaped. A large, mixed-topic document places unrelated material next to the evidence, which adds context and reasoning. Over-fragmented content splits one answer across several files, which adds retries as the agent retrieves and combines them.

Shape matters more on the [GitHub Copilot harness](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview), where the agent can open a full knowledge file in its [sandbox]({% post_url 2026-07-20-copilot-studio-agent-sandbox %}) instead of working only from search snippets. The shape of that file decides how much unrelated content the agent examines. Having the file available is not the same as sending its whole content in every model call, and it doesn't guarantee that a follow-up question avoids another search, so measure this for your workload. [Lost in the Middle](https://arxiv.org/abs/2307.03172) gives a second reason to keep documents focused. The evaluated models used relevant information less reliably when it appeared in the middle of long context.

The fix is to shape each document around the questions users ask. Practices 6 and 7 cover this fix.

![Three-row diagram. The target row shows a focused source with policy, scope, and relevant exceptions together, leading to relevant content for grounding and reasoning, and then to relevant context with minimal competing information. Pattern 1, a mixed-topic source, introduces unrelated material alongside relevant evidence and distracts from it. Pattern 2, over-fragmented content, means several isolated fragments must be combined, so more retrieval and synthesis is required.](/assets/posts/retrieval-economics/knowledge-boundaries.png){: w="700" h="470" }
_A focused source keeps policy, scope, and exceptions together. Mixed-topic and fragmented sources each add work in a different way._

### 3. Missing information

Sometimes no source holds the answer, or retrieval doesn't surface it. A broad question across many department reports may miss one department's figure. This adds retries. The agent should report the gap or escalate rather than guess.

The fix may be better source coverage, better metadata, a different retrieval approach, or a human process. Adding more content alone rarely closes the gap.

### 4. Hard-to-verify answers

An answer can be correct but cite no clear source, so users can't tell whether it comes from the approved policy. This adds verification work for both the agent and the user.

The fix is clear titles and identifiers, source metadata, and citation design. Higher-risk scenarios may also need human review.

> The studies cited here don't measure Copilot Studio consumption or answer quality. Treat them as reasons to test governance changes, and validate the effect against your own questions.
{: .prompt-warning }

## Seven governance practices that reduce the extra work

These practices mainly address the first two problems. Practices 1 to 5 narrow the knowledge boundary, so fewer sources compete for the same question. Practices 6 and 7 shape the document boundary, so each source holds the content its questions need.

![Flow diagram titled From a noisy corpus to a selective boundary. Published documents that are current, outdated, duplicated, or draft pass through two gates, deprecate and deduplicate. Content caught by the gates moves to an archive held for historical access, audit, or legal need. What remains enters the active knowledge boundary, where documents have owners and metadata filters, are grouped by the questions they answer, and sit in either a structured table for entity lookups or organized prose for policy and procedure. Seven numbered markers match the practices listed below.](/assets/posts/retrieval-economics/designing_for_selectivity_graphic.png){: w="700" h="400" }
_The seven practices act on content as it moves from everything published to the active knowledge boundary._

1. **Maintain active knowledge boundaries.** Archive, restrict, or exclude obsolete content from active retrieval. Keep current policies separate from historical references and working drafts.
2. **Establish ownership.** Assign an accountable owner to each active knowledge source. The owner is responsible for review, replacement, retirement, and conflict resolution.
3. **Treat deprecation as a workflow.** When a new version takes effect, update references and remove or restrict the superseded source. Retain it separately only when historical access, legal retention, or audit needs require it.
4. **Deduplicate deliberately.** Remove, consolidate, or restrict exact and near-duplicate documents, repeated FAQs, copied policy clauses, and multiple exports of the same information. Keep only the authoritative version.
5. **Use metadata filtering to narrow the search for each question.** Choose metadata that reflects how users ask questions, such as country, business unit, effective date, or document status. In agents powered by the GitHub Copilot harness, the agent can use SharePoint library metadata to identify matching files and scope a content search, as shown in [SharePoint Metadata Filtering in Copilot Studio]({% post_url 2026-09-01-sharepoint-metadata-filtering %}). For the Standard harness, use the supported source-level conditions described in [Filter your SharePoint source](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-sharepoint#filter-your-sharepoint-source), and don't assume the same dynamic custom-column routing. Both approaches depend on complete, consistently maintained metadata.
6. **Align document boundaries to how people ask questions.** Keep information that is usually needed together in one source, and separate content that answers unrelated questions. Organize around user questions rather than the organizational chart or file system.
7. **Match the representation to the question.** Entity-attribute lookups are often more reliable and efficient when answered from structured data. Policy interpretation, procedural guidance, and nuanced exceptions usually need clearly organized prose.

For practice 5, the question itself often suggests the filters. The examples below show the intent, not a configuration that every harness supports in the same way. A historical question needs an archive source that is deliberately included in the knowledge boundary.

| Question | Filters it implies |
|---|---|
| "What is the hotel limit for a trip to Canada?" | Region: Canada · Type: travel · Status: current |
| "Which security standard applies to retail?" | Unit: retail · Type: security · Status: current |
| "What did the 2024 travel policy allow for hotels?" | Type: travel · Year: 2024 · Status: archived |

For practice 7, take the question "What did customer X spend in Q2?" A governed table answers it more directly than dozens of documents that restate the same figure. A policy question is different. It needs clear prose that states scope, exceptions, and effective dates. The goal is to use the representation that leaves the least ambiguity for each question, not to structure everything.

## Measure the impact in your environment

Knowledge governance should be evaluated, not assumed. Compare the current knowledge with a governed version using a repeatable procedure:

1. **Define the workload.** Select representative real questions, including policy exceptions, ambiguous requests, historical questions, and questions the agent should escalate. Record the expected answer and authoritative source for each. Fix the test identities and permissions so both versions can access equivalent evidence. For the travel example, the set could include the current hotel limit for a domestic trip, the limit for a trip to Canada, what the 2024 policy allowed, and an exception request that should go to an approver.
2. **Change the knowledge, not the agent.** Keep the harness, model, instructions, tools, and question set the same. Record which sources, document boundaries, or metadata changed. Run each question multiple times against both versions. Test fresh conversations separately from scripted follow-ups, using the same preceding turns for each follow-up sequence.
3. **Compare quality and work together.** Record results per question and summarize repeated runs. Use the same timing method and workload size for both versions. Include failures and escalations rather than reporting only successful answers. For the travel example, check that citations point to the policy in force, that answers quote the same rates across runs, and that the draft never appears as a citation.

Record these five measures for both versions:

- **Answer quality.** Correct policy, scope, and exceptions against the expected answer, and whether escalation was appropriate. Score it in your evaluation sheet.
- **Grounding.** Whether citations point to the intended authoritative source. Check the citations in the agent's responses.
- **Retrieval work.** Search calls and files examined. Use the activity map or conversation transcript where available.
- **Latency.** Time to the completed answer, with the median and range across repeated runs.
- **Usage.** Copilot Credit consumption for equivalent workloads, with the aggregation level and reporting window. Use tenant reporting through the Power Platform API, described below.

Don't treat the number of citations as a count of retrieval calls, or infer token usage from document size. If a metric isn't exposed, mark it as unavailable. Collect user satisfaction separately through a pilot with the same questions.

Interpret billing for the harness you test. [Billing rates and management](https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management) describes the Standard harness, and [Overview of usage-based billing](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/billing-credit-overview) describes GitHub Copilot harness consumption, including model tokens, tools, and the harness itself. Less retrieval work does not necessarily produce an equivalent reduction in billed usage.

For tenant-wide reporting, [Where Are Your Copilot Credits Going?]({% post_url 2026-08-25-copilot-credit-consumption-api %}) shows how to retrieve consumption through the Power Platform API. Aggregate reporting supports workload comparisons, but don't present it as per-question attribution. Knowledge governance also complements the controls in [Manage costs for agents powered by the GitHub Copilot harness](https://learn.microsoft.com/en-us/power-platform/admin/manage-usage-github-copilot-harness).

The objective is not to prove that every cleanup produces a fixed reduction in consumption. It is to identify which governance changes reduce avoidable retrieval work while preserving or improving answer quality.

## Keep governance running after the cleanup

Data preparation is the initial build. Knowledge governance is the ongoing discipline that keeps retrieval quality, source authority, and agent efficiency intact as the knowledge base changes.

Policies change, reports accumulate, documents are copied, ownership shifts, and new systems restate information that already exists elsewhere. Without lifecycle governance, a carefully prepared knowledge boundary gradually fills with duplicates and conflicts again.

![Two-row lifecycle diagram. Governed knowledge moves from publish or update, to review on a defined cadence, to retire, archive, or restrict, which keeps retrieval quality easier to maintain. Without an active governance process, there is no accountable source owner and no regular review or retirement, so duplicates, ambiguity, and conflicts accumulate and retrieval friction grows over time.](/assets/posts/retrieval-economics/governance-lifecycle.png){: w="700" h="327" }
_Governed knowledge moves through a controlled review-and-retirement cycle. Without governance, duplicates, conflicts, and retrieval friction tend to accumulate over time._

Governance is part of an agent's architecture, not a separate compliance exercise. Customers might not control every aspect of retrieval in a managed platform, but they can govern the knowledge sources, document boundaries, authority signals, and lifecycle processes the agent depends on.

## Where to start

Start with one scenario. Pick a knowledge area where your agent gives inconsistent or slow answers, such as a travel policy with several years of rates in circulation. Write down the questions users ask and the answer you expect for each. Retire superseded versions, consolidate duplicates, and tag the remaining sources with the metadata those questions imply. Then run the same questions against both versions using the procedure in [Measure the impact in your environment](#measure-the-impact-in-your-environment), and compare answer quality, grounding, retrieval work, latency, and usage.