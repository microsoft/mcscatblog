---
layout: post
title: "Evaluation-Driven Agent Readiness in Copilot Studio"
date: 2026-06-01
categories: [copilot-studio, evaluation]
tags: [evaluation, agents, test-sets, graders, tool-use, copilot-studio-evaluate, scoping]
agent_edition: standard
description: "When can I stop building and deploy my agent? There's no score that settles it; readiness is a qualitative call. So make evaluation part of the build: lead with a clear definition of good, generate scoped test sets, read the grader explanations, and iterate to a V1 you can describe and defend."
author: KarimaKT
image:
  path: /assets/posts/evaluation-driven-agent-readiness/header.png
  alt: Evaluation-driven agent readiness in Copilot Studio
  no_bg: true
published: true
mermaid: false
---

Here's a scene that plays out on a lot of agent projects. The makers finish the agent, feel good about it, and hand it over. A few days later the verdict comes back: "it didn't work," or "it's not ready," with a handful of failed questions and a few lines of feedback attached. The team fixes what it can see, hands it back, and waits. The same cycle repeats, sometimes for weeks.

The effort was never the problem. What's missing is a shared, visible definition of *ready*. Nobody agreed on what passing looks like, and surprise tests keep getting added that the agent then fails. Underneath sits a genuinely hard constraint: a generative agent can be asked an almost unlimited number of things, so "just test everything" was never on the table.

This post is about closing that gap while you build, not after. You make evaluation part of your design work: define what good means, generate scoped tests, read what they tell you, fix the design, and go again. Each loop replaces opinion with evidence.

> **Myth:** an agent is ready when its evaluation score clears a bar.
>
> **Reality:** it's ready when you can describe it and defend that description with evidence: what it handles well, what it doesn't cover yet, and what it refuses on purpose.
{: .prompt-info }

The rest of the post has two parts. First, the strategy: why evaluation belongs inside your build loop, why one score can't tell you an agent is ready, and how scope, coverage, graders, and iteration add up to a readiness you can describe and defend. Then a bonus, a hands-on pass on a real agent, where you can watch scoping change the tests Copilot Studio generates and build a custom grader of your own.

## Two problems hide inside "is it ready?"

"Is it ready?" tangles two different problems, and each needs a different fix.

**A design problem: scope.** Agents work best with a goal and a scope. Handing an agent a tool is the core of how agents work, but a tool is not a scope: a single system of record serves many roles at once, and the whole of it is too broad to be one agent's job. The same orders database backs customer support, operations, and finance; a well-scoped agent takes one such role and harnesses whatever tools it needs, while a larger agent can hold several roles, each scoped and bounded so it can be evaluated on its own terms.

**An agreement problem: what "good" means.** Before you evaluate anything, the business and the makers have to agree on what the agent does, what it does not do, and what *good* means for each role it plays. That agreement is the step most projects skip, and it's why "it's not ready" is a verdict no one can act on: nobody wrote down what ready would look like. Whether you're building an internal agent for colleagues or a partner handing a more complex agent to a customer for testing, the rule is the same: don't release an agent whose scope you cannot fully describe.

> Write the agreement down before you build: the jobs the agent should handle, the edge cases it should cover, what falls outside its scope, what it should hand to a human, and what it must refuse outright. Everything downstream tests against this.
{: .prompt-tip }

Both problems share a root: you can't judge readiness without a scope and a definition of *good*. Write them down, then keep them in view by evaluating as you build. Start as early as the agent can answer a basic question; you don't need production data, a generated set from day one is enough to catch problems while they're cheap to fix. Then evaluate as the solution takes shape, each time you add a feature, cover another use case, or change something that shifts behavior like the model. Evaluation isn't a gate at the finish line, it's a signal you read all the way through, so the question shifts from "is my agent good?" to "is this version better than the last, and where?" Skip it and readiness stays a matter of opinion until delivery, the most expensive place to find out you and the business disagree. You're not adding work, you're moving it earlier, catching a weak spot while it's cheap instead of meeting it as poor behavior once users are already relying on it.

> A generative agent isn't deterministic, so the same test can vary from one run to the next: more for creative or edge-case use cases, less for tool calls and generated queries. When a result swings, look at both the grader choice and its design (a strict grader may be flagging harmless phrasing a meaning-based one would pass) and the agent design itself (the behavior may genuinely need to be more consistent). For tests that genuinely vary, don't lean on a single green run; evaluate them a few times.
{: .prompt-tip }

## One score can't tell you it's ready

Tell a stakeholder the agent scored 78% and you'll get a fair question back that nobody can answer: is that good? A single score in an AI evaluation isn't diagnostic. It hides which capabilities work and which don't, and it moves from run to run.

Thresholds made sense in an older world, where you tested a trained model against a huge, fixed set of utterances and a pass rate stood in for the exhaustive checking you could never do by hand. That number was always a stand-in for the maker's real question: is this good enough for what I need it to do? AI evaluations let you skip the stand-in. You lead with the qualitative definition of *good*, and each test carries its own explanation of why it passed or failed. That explanation is what you act on, not the pass rate: over a small, curated set, a pass rate isn't statistically meaningful, and it was never meant to be.

Three questions replace the score, and the rest of this post is built to answer them:

- **Coverage.** Does the test set represent what matters, including the edge cases and the things that should fail?
- **Explanation.** When a test fails, why? Was it a real bug, an acceptable miss, or the agent correctly refusing?
- **Direction.** Is this version better than the last, and exactly where?

"Good enough" then stops being a percentage. It means: I designed these use cases to work well, I covered a generalizable range of core and edge cases, and I guardrailed what must not happen. That's a claim you can show, not a number you defend. It also flips the coverage math: a small set of well-chosen, generalizable tests represents a large problem area, and a single design fix can lift a whole range of phrasings at once, the same move you make when a short intent-routing description stands in for a giant list of trigger phrases.

> Evaluation is not load testing. It isn't about volume or exhaustive coverage of every utterance. It's a small, generalizable set of tests that tells you where to improve the design. If you need to test behavior under concurrent load, that's a separate exercise with its own [performance and load testing guidance](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/conversational-agents-performance-testing).
{: .prompt-warning }

How hard *good* is to reach, and how you evaluate it, depends on the kind of work the agent is doing:

| Use-case type | How hard "good" is to reach | How to evaluate it |
| --- | --- | --- |
| **Task-oriented** (lookups, planning, writing queries, tool chains) | Lowest bar: models are strong here, and a correct result is usually well-defined | A few generalizable tests; grade the result with **Compare meaning**, and add a **Tool use** check when the path the agent took matters |
| **Analytical or creative prose** (summaries, explanations, recommendations) | Hardest to pin down: *good* spans a range, and it [shifts as models change](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/declarative-model-migration-overview) | Grade meaning with a widened pass threshold, or a **Custom** rubric grader that scores the qualities you care about; act on the explanations, not the pass rate |
| **Critical or compliance** (must-do, must-not-do, fixed outputs) | Highest stakes: the bar is near-certainty | Hand-write every must-do and must-not-do; **Exact match** or **Keyword match** on deterministic outputs; use your harness's features to add precision and gates to the agent, like Topics and Flows in the Standard harness or Python scripts and workflows in the GHC harness |

## Scope decides how sharp your tests are

All of that rests on one first move: pinning down the agent's scope, because it decides how good every generated test will be. The Evaluate tab can only reason about what the agent's design tells it, so a vague agent yields vague tests and a scoped agent yields sharp ones.

Scope is easiest to see by contrast.

- **Too broad:** "an agent that fetches rows from a SharePoint list," or "an agent over our CRM." Real capability, no role. Ask it anything and it answers something; generate tests and they're generic and off-goal.
- **Scoped:** a retail shipping-support agent whose scope is pinned by a clear goal and an instruction block that describes the list, its columns, and their value ranges (the cities served, the statuses a shipment can be in, the ID pattern). Same underlying data source and the same generic retrieval tool, but now the agent has a job.

Three signals feed test generation, and each one sharpens the tests: the agent's **name**, its **instructions** (especially a short description of the data and its value ranges), and the **tool description**. Tighten those and the generated rows move from sign-in trivia to real shipping questions using actual cities, statuses, and IDs. Match the generation strategy to how the agent is built, too: a tool-and-description agent like this one generates from its description, while a topic-based or knowledge-grounded agent generates better sets per topic or per knowledge source. The [hands-on pass at the end](#bonus-a-hands-on-pass) walks through that shift, screenshot by screenshot.

How broadly you describe the agent also controls how wide the generated tests range. Describe it narrowly, "gives a shipment's status from its tracking number," and the generated tests stay close to that one task. Describe it broadly, "answers open-ended questions about a customer's shipping history," and the generator ranges wider, including cases you didn't expect. Those surprises are useful: ignore the benign ones, redesign for the ones that matter.

> Reviewing generated tests is itself a scoping exercise. If the generated tests are not representative of the agent's scope, that's feedback that your agent and tool descriptions are too thin.
{: .prompt-tip }

## Cover what must happen, and what must not

Before generating in bulk, decide how you'll group coverage so you can talk about results without leaning on one number. The grouping comes straight from the scope agreement: the things the agent must do, the things it must not, and the nice-to-haves you'll refine later.

| Bucket | What it covers | Example |
| --- | --- | --- |
| **Must-do** | The core scenarios that justify shipping, plus their robustness: the same intents in messy, real phrasing like typos, compound asks, and ambiguous routes | "What's the status of tracking C31VU3ZPDY?" / "status of shippment new york to tokyo" |
| **Must-not-do guardrails** | Out-of-scope, unsupported, or missing-input requests the agent should refuse or redirect | "Cancel the Miami to London shipment." |
| **Nice-to-have** | Real coverage that isn't this version's investment focus, to refine and expand with more investment in the next wave | "Which lanes have the most delays this month?" |

Subdivide these according to your needs: by grader configuration, by guardrails only, by one goal at a time. The point is that the full set of tests, taken together, describes the deliverable.

> An edge case is a request the agent should still *try* to handle, usually by clarifying. A guardrail case is one it should *refuse or redirect*. Keep them in separate buckets, or a correct refusal will look like a failed answer when a grader scores it.
{: .prompt-warning }

## Turn use cases into test sets

With coverage grouped into buckets, it helps to name the layers underneath. Use cases, test cases, and test sets mirror how you build the agent in the first place, and they come from the same scope agreement you and the customer sign up to together, made concrete enough to test. Keeping the layers distinct is what lets you scope, prioritize, and qualify the work as you go.

| Stage | What it is | What it drives in the build |
| --- | --- | --- |
| **Use cases** | The jobs the agent does, agreed jointly by maker and customer in the scope agreement | Anchor the design and set the priority order: they define what the agent is *for* and, by extension, what "good" means |
| **Test cases** | Concrete requests representing each use case, including edge cases and guardrails | Scope and build iteratively, highest-value use cases first |
| **Test sets** | Grouped runs of test cases, bucketed by must-do (including robustness), must-not-do guardrails, and nice-to-have | Prioritize what to fix, harden the must-dos, and qualify the deliverable against the agreement |

A handful of generalizable test cases can stand in for a large problem area, the same way a good tool description stands in for a thousand utterances. You're not enumerating phrasings, you're picking representatives.

### What to test versus how to produce it

Two different decisions, often muddled:

- **What to test:** your must-do (core scenarios plus their robustness) and must-not-do guardrails first, then the nice-to-have coverage. The must-do are the small, non-negotiable set. Nice-to-have is the long tail that builds confidence.
- **How to produce it:** write the must-do use cases by hand and agree on them, then expand each one with generated tests, both to confirm the function holds and to surface edge cases the makers would have missed.

### Generate a starter set, then expand it with the template

Copilot Studio's [agent evaluation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro) in the Evaluate tab generates a starter set straight from your agent definition. Treat it as a starting point. Its quality tracks how well your agent and tools are described, which is exactly why the scoping work above pays off here. Simply reviewing what it generates already sharpens your scoping and guardrailing.

To expand a valuable use case, use the template provided in the Evaluate tab. Export the evaluation template, which carries the request-and-expected-response format, add a short use-case description, a few sample questions, and your value ranges, and hand it to an LLM you already have. M365 Copilot will do it. Ask for about 20 new rows for that use case. Twenty is a good size for a test set: enough to represent the range, small enough to read and curate. The [hands-on pass at the end](#bonus-a-hands-on-pass) includes a ready-to-paste version of that prompt.

### Review every generated set

Generation is a draft. The review step is where the value is:

- **keep** the rows that represent real, in-scope requests
- **discard** the off-goal, duplicate, or nonsensical ones
- **vary** the breadth: keep a variety of narrow and broad requests
- **refine** the expected response so a grader can judge it

Work modularly: one use case, about 20 rows, reviewed, before you move to the next.

## Match the grader to the job

A test row is only as good as the grader judging it. Copilot Studio's graders split on one practical question: does the grader need an expected answer from you?

| Grader | Needs an expected answer? | Reach for it when |
| --- | --- | --- |
| **General quality** | No | You want a fast first read; its comments hint at what's wrong |
| **Custom** | No, you write a rubric | You want to encode a business-specific quality measure |
| **Compare meaning** | Yes | The answer can be phrased many ways but must mean the right thing (most cases) |
| **Exact match** | Yes | The output is fixed and authored, like a message-node response |
| **Keyword match** | Yes | A specific token must appear verbatim, like an ID in the final answer |
| **Tool use / plan steps** | Yes (the tool or step) | You need to check the path the agent took |

Start with the graders that need nothing from you. **General quality** has no configuration and is easy to add; read its comments and you'll often know where to go back to the drawing board. **Custom graders** are where you dig into what *good* means for your business: a first pass plus the results overview tells you where to focus, and the comments let you prioritize, generalize a fix, and improve for the outcomes you care about. When a custom rubric asks an LLM to score, [design a score you can defend]({% post_url 2026-06-26-better-llm-scoring %}) instead of a bare 1-5. For a tool-using agent like the shipping one, a custom grader can evaluate format, completeness, business outcomes and more, not just correctness.

The graders that need an expected answer also need authoring effort, so spend it where it counts. Write out expected answers for your high-value use cases, run, adjust the design with generalizable fixes, and rerun. If a round of fixes touched a lot, regenerate similar tests to confirm the fixes held and generalized to the range you meant to cover.

On a larger project, where a separate builder team delivers for the business SMEs, that authoring effort is shared work, not a solo chore. Agree up front on who does what: the business owners set the priority use cases and define what a good answer is, and the people who own the data supply the expected responses. From there, the makers expand those sets with AI to anticipate logical edge cases, build the solution iteratively against them, and deliver it with its expectations already described by the evaluations, so end-user testing holds few surprises.

Two rules of thumb save real pain:

- **Prefer Compare meaning over Exact match** for known-good answers. "In Transit" and "The shipment is in transit" mean the same thing; Exact match fails the second one. Compare meaning has a tunable pass threshold and won't punish phrasing.
- **Reserve the strict graders for where variation is genuinely unacceptable.** Exact match fits an authored message-node response. Keyword match fits an ID that must appear verbatim in the final answer. Don't use them on intermediate parsing steps, because the agent is good at absorbing input variations like spacing, casing, or date and currency formats. If parsing is the worry, test the meaning of the final answer and fix the design (for example, the tool input description).

### Stack graders selectively

You can attach more than one grader to a row, but do it selectively. For example, two tool calls can sometimes produce the same answer, but when only one is the right choice for the situation, pair a **Tool use** check with **Compare meaning**. The shipping agent runs **General quality** alongside the **Content Format** custom grader on every row, one for a fast read, one for the business-specific label. These pairings follow a simple rule: whether an answer is *correct* and whether it's *usable* are different questions for different graders.

> Deciding which graders to use, and whether to stack, is the evaluator's call, based on the goal, the priority of the use case, and a clear sense of what each grader can actually judge. The product team is genuinely open to feedback here; if a grader you need doesn't exist, let us know in the comments.
{: .prompt-info }

### Single-turn or multi-turn?

Before you configure graders for a row, decide how many turns it needs, and don't underrate single-turn. One well-defined single-turn row can cover scope, grounding, tool choice, and answer quality, and it can exercise a full tool chain. Reach for multi-turn only when the behavior you care about depends on recovery, clarification, or retained context.

When it does, a multi-turn row earns its place by testing the agent context end to end:

| Turn | User says | Expected behavior |
| --- | --- | --- |
| 1 | What's the status of the shipment from Chicago to Dubai? | Finds both matches and lists them: SHIP-1 (Pending) and SHIP-5 (Delayed). |
| 2 | Just the delayed one. | Narrows to SHIP-5 and reports Delayed, without re-querying from scratch. |
| 3 | Why is it delayed? | Uses the Explanation field for SHIP-5, carrying context from the prior turns instead of re-asking. |

Grade it the same way, matched to the job: **Tool use** (the SharePoint list tool is used efficiently) plus **Compare meaning** (the final answer reflects SHIP-5 and uses prior context). Keep multi-turn additive; it's most valuable for chat experiences where context matters.

## Run, read the explanations, then iterate

Run the sets and resist the summary number. The value is in the rows, and specifically in the comment each grader leaves next to its verdict. Every grader explains itself, and those comments, together with the pass or fail a custom grader assigns each criterion, tell you far more than any numeric score. The comment explains the grader's assessment, which is what you act on. A failed row might be a real bug, an acceptable miss, or the agent correctly refusing, and only the explanation tells you which.

> Always read the comment each grader leaves, not just the score, and open the actual conversation transcript alongside it to see what the agent really did.
{: .prompt-tip }

Reading rows this way regularly surfaces design gaps: an out-of-range ID a real user could fat-finger, a phrasing the agent mishandles, or a case that returns nothing when it should have asked a question. When several rows need attention at once and the priorities aren't obvious, Microsoft's [evaluation-driven triage and remediation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-triage-overview) framework helps decide what to fix first.

> A wall of instructions is rarely the fix. [Goal-based guidance]({% post_url 2025-11-11-influence-orchestration-knowledge %}) generalizes better than a growing list of special cases, and it's far easier to test. Make one targeted change, rerun, and let the results tell you whether it worked before you add another instruction that could have inadvertent consequences.
{: .prompt-tip }

Then rerun the **same** set and use [**Compare with**](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-results#compare-test-results) to line the two runs up row by row. Watch the rows that moved the way you intended, and any that regressed because a change had a side effect, like the agent now guardrailing valid requests.

A fix you can generalize is worth far more than one that clears a single row. Confirm it generalizes: add a few more variations of the same problem and check the agent handles them consistently. Run adjacent tests to check for unintended effects.

### Iterate, then slot the rest for the next wave

Iteration has a natural stopping point. Once the must-do core and the guardrails hold, that's the signal to stop, take stock of what's left, and slot it into the next version. Ship a defined V1, then grow the solution. It's an agile loop, and the test sets draw the line: everything green in scope ships, and everything still open becomes the backlog for the next wave. Once its shape settles, you can even [automate the loop from edit to test]({% post_url 2026-03-29-agentic-improvement-loop %}).

> When you see a genuinely good response, capture it as an expected output for a Compare-style check. It then guards against regressions on future runs.
{: .prompt-tip }

## Explainable readiness, not a magic number

So when is the agent ready? Not when a percentage clears a line you picked. It's ready when you can turn those three questions into statements you can stand behind:

- **Coverage.** Name the intended coverage as buckets a stakeholder recognizes, weighted toward what's frequent, valuable, and risky.
- **Explanation.** For the failures that remain, say which are acceptable misses and which are correct refusals, with the grader explanation to back it.
- **Direction.** Show that this version moved the right coverage the right way.

Readiness then reads like this: "For requests like these, here's what we handle well. For these, here's what we don't cover yet, and it's slotted for the next wave. And for these, we don't answer at all, on purpose, because we've guardrailed them."

The handover changes too. Whoever tests the agent, colleagues in an internal rollout or a customer running acceptance tests, should arrive knowing its goals and capabilities. They are there to confirm that what was described was delivered, not to test unfounded assumptions. They will still surface the occasional edge case worth adding to the next wave, and they may happily discover coverage you never promised, because the model's multi-intent handling reaches beyond the core scope. What they should not run into is a failure on something you claimed the agent handles, because you already wrote down what it does and does not do.

## Bonus: a hands-on pass

Everything above is the strategy. This last part is a bonus you can run yourself on the shipments list from the [SharePoint tool post]({% post_url 2026-04-30-tool-inputs-sharepoint-list %}). It isn't the whole loop end to end, just an easy start: standing up a simple agent, watching scope change the tests it generates, and building a custom grader.

The short version, to follow along:

1. **[How scope changes the generated tests](#how-scope-changes-the-generated-tests)**: stand up a generic agent, then name it and describe the data, and watch the generated tests go from sign-in trivia to real shipping questions.
2. **[Expand a use case with the template](#expand-a-use-case-with-the-template)**: grow one valuable use case past the starter set with a ready-to-paste prompt.
3. **[Build the custom grader](#build-the-custom-grader)**: a Content Format Grader that judges shape and completeness, not just correctness.
4. **[When a test reveals a design gap](#when-a-test-reveals-a-design-gap)**: read one generated test that turns an eval run into a concrete design change.

![The SharePoint Get items tool pointed at the shipments list](/assets/posts/evaluation-driven-agent-readiness/02-get-items-tool.png){: .shadow }
_The drop-in starting point: a generic Get items tool over the list, before any scoping._

### How scope changes the generated tests

This is the same agent from [Get Answers Over SharePoint Lists]({% post_url 2026-04-30-tool-inputs-sharepoint-list %}): a single SharePoint **Get items** tool over a list of shipments, with columns for Title, Origin, Destination, Status, Days in transit, Tracking, and a free-text Explanation.

Start with the general, unoptimized version. Drop the **Get items** tool in with its stock description ("Gets items from a SharePoint list"), point it at the list, pick a strong model, turn on web search, and give the agent one line of instruction: *"Answer user questions using the Get items tool. You may fetch the first 3 rows of the list to understand the schema and then find the requested information."* Ask *"why are my shipments to Dubai late?"* and you get a genuinely good answer, the right rows plus current news on regional delays. It works well; it just isn't optimized yet.

![A minimally configured agent still answers a real shipping question](/assets/posts/evaluation-driven-agent-readiness/01-careless-agent-answers.png){: .shadow }
_No agent description, a generic tool, one line of instruction, and it still handles a real question. Working once is not the same as being ready._

But generate a test set now and the rows have nothing to grip. They ask about signing in, "the latest items from SharePoint," and which topic matched, because a generic tool and an unnamed agent are all the generator has to reason about.

![Generic generated test rows](/assets/posts/evaluation-driven-agent-readiness/03a-generic-testset.png){: .shadow }
_With the agent left general, the generated rows are about sign-in, SharePoint items, and topic matching. Nothing shipping-specific._

Now change one thing: give the agent a name, **Contoso Retail Shipping**, and generate again. Without touching the tool or the instructions, the rows already move toward shipping: tracking a package, shipping options, delivery this week.

![Generated rows after naming the agent](/assets/posts/evaluation-driven-agent-readiness/03b-named-testset.png){: .shadow }
_Just naming the agent pulls the generated rows toward shipping and retail. The name alone is a scope signal._

Then teach it the data. Add a short block to the instructions describing the list: the columns, the four valid statuses, the city values, the SHIP-{N} identifier pattern, and which fields support filtering.

![Instructions with a schema description block](/assets/posts/evaluation-driven-agent-readiness/04-schema-instructions.png){: .shadow }
_A few lines describing the columns and their value ranges is all the generator needs to write realistic tests._

<details>
<summary>Copy the agent instructions</summary>

<pre><code>Answer user questions using the Get items tool. You may fetch the first 3 rows of the list to understand the schema and then find the requested information.

About the Shipments list, which supports OData filtering on these fields:
- Title: text, shipment identifier following a SHIP-{N} pattern (some entries use descriptive names like "Chicago to Beijing").
- Origin: text, departure city such as Chicago, Miami, Los Angeles, New York, Paris.
- Destination: text, arrival city such as Dubai, London, Tokyo, Sydney.
- Status: text, one of four values: Pending, In Transit, Delayed, or Delivered.
- Daysintransit: number, integer for how many days the shipment has been moving (1 to 8+ in the data).
- Tracking: text, a unique alphanumeric code per shipment.
- Explanation: free-text narrative describing the shipment situation or reason for delay (useful for summarizing, not ideal for filtering).
- Created / Modified: UTC DateTime fields for when the record was created and last updated (useful for filtering recent or historical shipments).</code></pre>

</details>

Generate one more time, and the rows are real shipping questions: status from Chicago to Dubai, tracking numbers to Tokyo, how many are delayed, shipments out of Los Angeles. Same data source, same generic tool, a far sharper test set, because the agent can finally describe its own job.

![Scoped generated rows using real cities, statuses, and IDs](/assets/posts/evaluation-driven-agent-readiness/03c-scoped-testset.png){: .shadow }
_With the schema described, the generator produces high-value rows using actual cities, statuses, and ID patterns._

### Expand a use case with the template

To grow a valuable use case past the starter set, export the evaluation template, which carries the request-and-expected-response format, add a short use-case description and your value ranges, and hand it to an LLM you already have. A prompt you can paste:

```text
Here is the evaluation template format and a use case for an internal
shipping support agent. [paste the exported template + the do/don't]

Sample context:
- Cities: New York, Tokyo, Chicago, London, Dubai, Los Angeles, Sydney, Miami
- Statuses: Pending, In Transit, Delayed, Delivered
- Identifiers: shipment titles SHIP-1 to SHIP-20; 10-character tracking
  numbers like C31VU3ZPDY, MRT1X77V1U, C4NLONGCT2
- Typical mistakes: misspellings, a route given instead of a tracking
  number, ambiguous routes that match more than one shipment

Generate 20 test rows for this use case. For each, give the request,
the expected response, and its bucket: Must-do, Must-not-do guardrails,
or Nice-to-have. Bias toward frequent, high-value scenarios first.
```

### Build the custom grader

For the shipping agent, that custom grader is a **Content Format Grader**. Rather than one overall pass or fail, it assigns each answer a *label*: Minimum detail, Structured, Analysis, Missing origin or destination, or Missing status. Each label carries its own pass or fail and an explanation. Together they measure shape and completeness the way your business defines them: does the answer include the status, the origin and destination, present the fields as a table, and add a sentence of analysis?

![The Content Format Grader configuration with labeled pass and fail criteria](/assets/posts/evaluation-driven-agent-readiness/05-custom-grader.png){: .shadow }
_A custom grader encodes business-specific quality: each label carries its own pass or fail and an explanation._

### When a test reveals a design gap

Two graders ran together here: General quality for a fast read, and the Content Format Grader for the business-specific label. On the row "*Can you show me the status of my shipment from Chicago to Dubai?*" the agent found both matching shipments and answered, General quality passed, and the Content Format Grader labeled it **Analysis**. On "*How many shipments are currently delayed?*" it labeled the answer **Structured**. The custom grader didn't just say pass, it explained: "*The agent provides a table with labeled fields: shipment, origin, destination, days in transit, tracking, and reason. The format is structured, with clear columns and values, and full sentences in the Reason column. All required details are present.*"

![Results with General quality and the Content Format Grader side by side](/assets/posts/evaluation-driven-agent-readiness/06-results-two-graders.png){: .shadow }
_Two graders per row. The label and its explanation tell you more than the pass flag ever could._

One generated test asked, "*Is my shipment SHIP-1023 still in transit?*", but there is no SHIP-1023; the real identifiers only run to the low twenties. The generator had invented an out-of-range ID, and reading that row was the useful moment. It exposed a design gap: what happens when a real user fat-fingers a tracking number or shipment ID? Today the agent would run the search and come back empty. So the fix wasn't to the test, it was to the agent: add the valid ID range to the instructions so the agent asks the user to confirm or correct an out-of-range identifier *before* it searches and fails. A small change, more efficient for the user, and caught before the user base ever hit it.

No score would have surfaced that gap. A generated test did, and reading it turned an evaluation run into a concrete design change. Scale that same habit up from this small example, and it's the loop that carries an agent build from working once to genuinely ready.

What's the first failure your evaluations caught that changed how you designed an agent? Share it in the comments.
