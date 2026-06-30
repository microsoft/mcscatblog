---
layout: post
title: "Stop Asking an LLM to \"Rate This 1-5\": A Better Way to Score with LLMs"
date: 2026-06-26
categories: [copilot-studio, patterns]
tags: [evals, testing, quality-gate, llm-as-judge, rubric-refinement, evaluation-api, generative-ai]
description: 'Asking an LLM to "rate this 1-5" gives you a number that looks decisive but isn''t. Here''s how to build LLM scores you can actually defend.'
author: [msmgp, serenaxxiee]
agent_edition: both
image:
  path: /assets/posts/better-llm-scoring/header.png
  alt: "An LLM scoring various elements 1 to 5"
---

*The rule was simple: have the model score every project proposal from 1 to 5, then fund anything that came back a 4 or higher. It ranked a stack of proposals overnight instead of over weeks, and the shortlist looked decisive; clear winners up top, everything else below the line.*

*Then the year played out. The 4.2 we backed stalled and was quietly shelved. A 3.4 we'd passed on (close enough to the cutoff that one reviewer had argued to fund it anyway) became the thing we wished we'd backed. And when we went back and asked **why** those two were a 4.2 and a 3.4, no one could really say. The scores had sorted a real budget with total confidence, and the confidence was the problem.*

Any time you ask an LLM or a [Copilot Studio Agent](https://learn.microsoft.com/en-us/microsoft-copilot-studio/) to "rate this from 1 to 5" (a proposal, an answer, a document, a support reply, a summary) you've probably seen that gap. The good news: you don't have to choose between "let an LLM score it" and "get a number you can trust." You just have to stop asking for the number directly. Here's how.

## The short version of why scoring 1 to 5 fails

Two things go wrong at the same time:

- **The scale is vague.** Nobody can say consistently what separates a 3 from a 4, and the middle of the scale absorbs everything: *partly right*, *fine but incomplete*, *minor glitch*, *good but not great* all land on the same digit.
- **The judge isn't steady.** An LLM's score shifts with how the prompt is worded, the order it sees things in, how long the answer is, and which model version is running. It will even quietly favor answers that came from its own model family.

The fix isn't a cleverer prompt. It's to let the LLM judge small, concrete things, and to build the final number yourself, from rules you control. The rest of this post is how to do that, in the order you'd actually do it.

## 1. Start from the decision, not the score

Before you measure anything, answer one question: **what will you do with this score?** Ship or hold? Pick between two models? Decide whether a change is real progress? Find out which part is weak?

This sounds obvious and it's the step most people skip. It matters because the decision quietly sets everything that follows: which things you measure, how you score them, and how you add them up. Write it in one sentence: *"decide whether the summary agent is ready for pilot by checking faithfulness and completeness against a reviewed set"*.

## 2. Break "quality" into a few concrete checks

Pick the few dimensions that actually matter for what you're scoring, then turn each into a **specific, checkable condition**, not a vague quality. "Is it good?" becomes "Does every claim cite a source that actually supports it?" Draw the checks from real failures you've seen, keep them few and non-overlapping, and mark which ones are dealbreakers.

## 3. Score each check the simplest way that works

There's no single right method. Work down this ladder and stop at the first one that fits the check:

- **Can a script check it?** Then don't use an LLM at all. Format validity, a required field, a present citation, a correct tool call, these are the cheapest and most reliable signals, so run them first.
- **Otherwise, ask the judge a yes/no question, with evidence.** This is your default. Breaking a fuzzy quality into a few binary questions is the single biggest reliability win available.
- **Use *pass / minor / major / fail* labels only when partial credit genuinely matters** and the in-between states are clearly defined. It buys you nuance at the cost of bringing back some of the 3-vs-4 fuzziness, so use it sparingly.
- **Comparing two systems or versions?** Don't score each in isolation, ask the judge *which one is better, A or B*. Head-to-head calls are noticeably steadier than absolute scores.
- **If your model can report how confident it was** across the options, you can turn that into a finer score, useful when everything bunches up near the top.

## 4. Combine the results with a rule you write down

This is where most of the real design lives, and the first rule is: **don't average the labels.** Averaging *pass/fail* results into a pass-rate is fine; averaging genuinely continuous scores is fine; averaging *minor/major/fail* style labels into a 3.7 is exactly the trap from the top of this post. Pick a combining rule that fits the decision instead:

| What you're deciding | How to score | How to combine |
| --- | --- | --- |
| Ship or hold (a release gate) | Pass/fail checks; flag the dealbreakers | **Gating**: any critical fail blocks release, however strong the rest is |
| Did a change make things worse? | Pass/fail checks, or A vs. the last good version | **Threshold** (too few pass) or head-to-head vs. baseline |
| Which system is better? | Ask which of two is better, many times | **Win-rate / ranking** |
| Where is it weak? | Per-check results | **Keep them separate**, no single number |
| Is live quality holding? | Pass/fail checks | **Track the pass-rate** and watch for drift |

Whatever rule you pick, write it down, version it, and keep it *outside* the model, so the same inputs always produce the same, inspectable result.

Once you have a rule that works, that's a good signal to package the whole thing as a reusable [Modern Agents skill]({% post_url 2026-06-15-modern-mcs-agent-skills %}), an agent, or a shared prompt, so you can drop the same scoring contract into every project instead of rewriting it.

## 5. Make the model show its work

Every judgment should arrive with the evidence behind it: the quote, the field, the line that justified the call. This is what makes a score auditable: when a number looks wrong, you can see exactly why it landed where it did, instead of re-litigating a mystery digit.

## 6. Check it against two references

Calibrate against **two independent things**: a set of examples a human has reviewed, and a **second LLM judge from a different model family**. The different family matters, a model tends to favor its own kind, so don't let it grade its relatives. Where the human labels themselves are shaky, use more than one reviewer and track how often they agree.

One honest caveat worth keeping in mind: all of this makes your scores **repeatable and auditable, not automatically correct**. A reproducible number can still be measuring the wrong thing. Calibration is what keeps it pointed at reality, which is why it's never quite finished.

## 7. Watch it over time, and prove every change

Scores drift as models and usage change, so track the pass-rate and the shape of the distribution, plus how well your second judge still agrees with periodic human spot-checks. When that agreement slips, recalibrate. And whenever you tweak the scoring system, **validate the change against a fixed benchmark**, confirm it raised agreement with your trusted references without breaking items you were already getting right, and add the new disagreements so the benchmark keeps covering your blind spots.

This is also what makes scoring usable inside an [automated agent improvement loop]({% post_url 2026-03-29-agentic-improvement-loop %}): when the judge is stable and the benchmark is fixed, every iteration on the agent gives you a real before-and-after instead of a fresh 1-5 guess on each run.

## The bottom line

It was never a question of whether an LLM *can* score. The question is whether the score means anything and a single 1-5 rating bundles a vague scale together with an unsteady judge. Treat the LLM as **one part of how you measure, not the measuring tape itself**: decision first, concrete checks second, your own combining rule third, and calibration all the way through.

Build the proposal scores that way, and the 4.2 and the 3.4 stop being mystery numbers. You see which checks each one passed and failed and "fund anything above a 4" finally becomes a decision someone can defend.

What's a 1-5 score you've regretted trusting? Drop your war story in the comments!

---

*Want the deeper version including the measurement theory, the methods in full, and the research behind each point? We wrote it all up in the [LLM 1-5 Scoring whitepaper](/mcscatblog/assets/posts/better-llm-scoring/20260626_LLM1-5Scoring_WhitePaper.pdf){:target="_blank"}.*
