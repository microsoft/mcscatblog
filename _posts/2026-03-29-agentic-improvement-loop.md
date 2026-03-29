---
layout: post
title: "Closing the Loop: Automated Agent Improvement with Publish and Test"
date: 2026-03-29
categories: [copilot-studio, testing]
tags: []
description: ""
author: adilei
image:
  path: /assets/posts/agentic-improvement-loop/header.png
  alt: ""
---

We added a `publish` command to the [the AI coding agent plugin for Copilot Studio](https://github.com/microsoft/skills-for-copilot-studio). This means an AI coding agent can now do the full loop without manual intervention: edit a Copilot Studio agent's YAML, push changes, publish the draft to make it live, run tests against the published Copilot Studio agent, analyze failures, and iterate.

This post walks through what we built and a trial run of the loop on a real Copilot Studio agent. Here it is in action:

{%
  include embed/video.html
  src='https://github.com/adilei/videos/releases/download/mcs-loop-v1/mcs-loop.mp4'
  title='Demo: agentic improvement loop running against a D&D 5e rules agent in Copilot Studio'
%}

## What changed

The plugin's [manage sub-agent](https://github.com/microsoft/skills-for-copilot-studio/blob/main/agents/copilot-studio-manage.md) already supported pull, push, clone, and validate. We added a **`publish`** command that calls the Dataverse `PvaPublish` bound action and polls the `publishedon` timestamp until it changes, confirming the draft is live. The manage sub-agent's prompt enforces the correct sequence (pull, push, publish) and checks for pending changes before publishing.

With this in place, the AI coding agent's sub-agents can orchestrate a full improvement cycle: the author sub-agent edits the Copilot Studio agent's instructions, the manage sub-agent pushes and publishes, and a test suite evaluates the published Copilot Studio agent's responses.

## Trial run

We set up a D&D 5th Edition rules assistant as a Copilot Studio agent, backed by the [Systems Reference Document 5.1](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf) (403 pages, Creative Commons CC-BY-4.0) as a document knowledge source. The Copilot Studio agent was configured with `useModelKnowledge: false` so all answers had to come from the uploaded PDF.

The Copilot Studio agent had no trouble with factual correctness. It could parse the SRD's tables, cross-reference race traits with class features, and do the arithmetic. What it struggled with was style: it was verbose, showed step-by-step reasoning when a direct answer was expected, and added unsolicited caveats. So we designed our test cases to require not just correct answers but a specific response style -- concise, direct, no unnecessary detail. Each question also deliberately required information from multiple distant sections of the document:

| # | Question | Expected answer |
|---|----------|-----------------|
| 1 | 5th-level Halfling Barbarian (16 Str, 14 Con), raging, no armor. AC? Rage Damage? Rages/day? Roll a 1? | Unarmored Defense AC is 10 + Dex mod + Con mod (+2), minimum 12. Rage Damage +2. 3 rages/long rest. Halfling Lucky trait: reroll the 1. |
| 2 | Dwarf Fighter in Plate. AC? Speed? Stealth disadvantage? Str requirement? Heavy armor speed rule? | AC 18, Str 15 required, Stealth disadvantage. 25 ft speed -- Dwarf trait means speed is not reduced by heavy armor. |
| 3 | Prone in difficult terrain, stand up + move 10 ft, base speed 30. Movement cost? | Stand up = 15 ft. Move 10 ft difficult terrain = 20 ft. Total 35 ft > 30 ft speed. Can't do it, 5 ft short. |
| 4 | 9th-level Barbarian (18 Str), raging, crits with Greataxe. Total damage dice? | Greataxe 1d12, crit = 2d12, Brutal Critical +1d12 = 3d12. Plus Str (+4) + Rage (+3). Final: 3d12 + 7. |
| 5 | Reckless Attack vs Dodge. Advantage/disadvantage interaction? | Reckless = advantage. Dodge = disadvantage. Both cancel. Roll one d20, straight. |

For evaluation, we used the [PytestAgentsSDK sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/testing/functional/PytestAgentsSDK) from the CopilotStudioSamples repo. This harness connects to the published Copilot Studio agent via the [M365 Agents SDK](https://github.com/microsoft/Agents-for-python), sends each test case as a conversation turn, and evaluates the response using [DeepEval's](https://github.com/confident-ai/deepeval) GEval metric at a 0.75 threshold.

## The loop

Starting from blank instructions on the Copilot Studio agent, we ran 7 iterations. the AI coding agent never saw the expected answers or the SRD document directly. It only saw test results: which questions failed, their scores, and DeepEval's reasoning for the failure. From that signal alone, it generated and refined the Copilot Studio agent's instructions.

Each iteration followed the same pattern:

1. Run the test suite against the published Copilot Studio agent
2. Analyze which tests failed and why (the eval provides a score and reasoning)
3. the AI coding agent's author sub-agent updates the Copilot Studio agent's instructions based solely on the eval feedback
4. Push, publish, re-test

Here is the progression:

| Iteration | Instructions | Pass rate | Notes |
|-----------|-------------|-----------|-------|
| 0 | Blank | 2/5 (40%) | Correct answers but omits specific numbers |
| 1 | Added completeness rules | 3/5 (60%) | Tests 1 and 4 fixed (modifiers now included) |
| 2 | Added brevity rules | 3/5 (60%) | Test 5 fixed but Test 3 still verbose |
| 3 | Added race prefix + alternatives | 3/5 (60%) | Test 1 fixed again, Test 3 improving (0.73) |
| 4 | Added 7 more rules (14 total) | 1/5 (20%) | Regression. Too many rules overwhelmed the orchestrator |
| 5 | Simplified to 7 rules | 3/5 (60%) | Recovered. 7 rules is the sweet spot |
| 6 | Added advantage/disadvantage rule | 2/5 (40%) | Multi-turn cascade: one wrong answer poisoned later turns |

No human wrote these instructions. the AI coding agent's author sub-agent constructed them entirely from test failure feedback -- scores and evaluator reasoning -- across 5 iterations. Here is what it converged on:

```
You are a D&D 5e rules expert grounded in the SRD 5.1.
Answer concisely and accurately.

- Name specific mechanics (e.g., "Unarmored Defense",
  "Halfling Lucky trait").
- Always compute final numbers. Include all modifiers
  and state the total.
- When a value is unknown, state the minimum.
- Keep calculations brief. State the result, not the
  step-by-step.
- When something is impossible, say what the character
  CAN do instead.
- When explaining a feature, state both its benefit
  and its cost.
- Do not add caveats or extra scenarios beyond what
  was asked.
```

## What we learned

**Instructions-only changes have a ceiling.** We intentionally limited changes to the Copilot Studio agent's system instructions -- no conversation flow changes, no custom logic, no additional knowledge sources. This got us from 40% to a stable 60%. The remaining two tests consistently scored 0.65-0.73, just below the 0.75 threshold. Breaking through would likely require dedicated conversation flows for specific question types, or running each test in an independent session to avoid cascading failures.

**Too many instruction rules backfire.** Going from 7 to 14 rules caused a regression from 3/5 to 1/5. The Copilot Studio generative orchestrator has limited capacity for instruction-following, and past a certain density, rules start conflicting or being ignored. Seven concise, non-overlapping rules was the stable maximum.

**Multi-turn testing amplifies failures.** The test harness runs all 5 questions in a single conversation. When the Copilot Studio agent miscalculated on question 3, it produced a confused response that poisoned questions 4 and 5 in the same session, both scoring 0.00. Running each test in an independent session would give more accurate per-question scores.

**The loop works.** The mechanics are solid: the AI coding agent's author sub-agent edits, the manage sub-agent pushes and publishes, the test harness runs and scores, results come back with reasoning, and the next iteration targets specific failures. Each step is handled by a specialized sub-agent that knows its domain.

## Source

The plugin is open source at [github.com/microsoft/skills-for-copilot-studio](https://github.com/microsoft/skills-for-copilot-studio). The test harness is at [github.com/microsoft/CopilotStudioSamples](https://github.com/microsoft/CopilotStudioSamples/tree/main/testing/functional/PytestAgentsSDK).
