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

We added a `publish` command to the [Claude Code plugin for Copilot Studio](https://github.com/microsoft/skills-for-copilot-studio). This means the AI coding agent can now do the full loop without manual intervention: edit agent YAML, push changes, publish the draft to make it live, run tests against the published agent, analyze failures, and iterate.

This post walks through what we built and a trial run of the loop on a real agent.

## What changed

The manage agent sub-agent already supported pull, push, clone, and validate. We added:

- **`publish`** calls the Dataverse `PvaPublish` bound action and polls the `publishedon` timestamp until it changes, confirming the draft is live.
- **Workflow rules** in the manage agent prompt enforce the correct sequence: pull, push, publish. The agent checks for pending changes before publishing and warns the user before making changes live for end users.
- **Auth mode detection** in the chat script queries the Dataverse `bots` entity for `authenticationmode` and routes to DirectLine or the Copilot Studio SDK automatically. This means the test agent can connect to any published agent without the user providing connection details.

With these pieces, the sub-agents can orchestrate a full improvement cycle: the author agent edits instructions, the manage agent pushes and publishes, the test agent runs the test suite and reports results, and the troubleshoot agent diagnoses failures.

## Trial run

We set up a D&D 5th Edition rules assistant in Copilot Studio, backed by the [Systems Reference Document 5.1](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf) (403 pages, Creative Commons CC-BY-4.0) as a document knowledge source. The agent was configured with `useModelKnowledge: false` so all answers had to come from the uploaded PDF.

We wrote 5 test cases that require the agent to cross-reference information from different sections of the document:

| # | Question | Sections involved |
|---|----------|-------------------|
| 1 | Halfling Barbarian: AC, Rage Damage, rages/day, Lucky on a nat 1 | Race traits, class table, Unarmored Defense |
| 2 | Dwarf Fighter in Plate armor: AC, speed, Stealth, heavy armor speed rule | Armor table, Dwarf racial trait |
| 3 | Prone creature in difficult terrain: stand up + move 10 ft, base speed 30 | Prone rules, difficult terrain, movement math |
| 4 | 9th-level Barbarian crits with Greataxe: total damage dice | Weapon table, Brutal Critical, critical hit rules |
| 5 | Reckless Attack vs Dodge: advantage/disadvantage interaction | Reckless Attack, Dodge action, advantage rules |

We used Microsoft's [PytestAgentsSDK](https://github.com/microsoft/CopilotStudioSamples/tree/main/testing/functional/PytestAgentsSDK) test harness with DeepEval's GEval metric at a 0.75 threshold to evaluate responses semantically against expected answers written in a concise, direct style.

## The loop

Starting from blank instructions, we ran 7 iterations. Each iteration followed the same pattern:

1. Run the test suite against the published agent
2. Analyze which tests failed and why (the eval provides a score and reasoning)
3. Hand the failures to the author agent with specific feedback
4. Author updates the agent instructions
5. Push, publish, re-test

Here is the progression:

| Iteration | Instructions | Pass rate | Notes |
|-----------|-------------|-----------|-------|
| 0 | Blank | 2/5 (40%) | Agent answers correctly but omits specific numbers |
| 1 | Added completeness rules | 3/5 (60%) | Tests 1 and 4 fixed (modifiers now included) |
| 2 | Added brevity rules | 3/5 (60%) | Test 5 fixed but Test 3 still verbose |
| 3 | Added race prefix + alternatives | 3/5 (60%) | Test 1 fixed again, Test 3 improving (0.73) |
| 4 | Added 7 more rules (14 total) | 1/5 (20%) | Regression. Too many rules overwhelmed the orchestrator |
| 5 | Simplified to 7 rules | 3/5 (60%) | Recovered. Confirmed 7 rules is the sweet spot |
| 6 | Added advantage/disadvantage rule | 2/5 (40%) | Multi-turn cascade: one wrong answer poisoned later turns |

The instructions the agent converged on after iteration 5:

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

**Instructions-only changes have a ceiling.** We intentionally limited the experiment to agent instructions without modifying topics, adding custom logic, or changing knowledge sources. This got us from 40% to a stable 60%. The remaining two tests consistently scored 0.65-0.73, just below the 0.75 threshold. Pushing past this would likely require topic-level changes (dedicated calculation handlers) or breaking the multi-turn test conversation into independent sessions.

**Too many instruction rules backfire.** Going from 7 to 14 rules caused a regression from 3/5 to 1/5. The generative orchestrator apparently has limited capacity for instruction-following, and past a certain density, rules start conflicting or being ignored. Seven concise, non-overlapping rules was the stable maximum for this agent.

**Multi-turn testing amplifies failures.** The test harness runs all 5 questions in a single conversation. When the agent miscalculated on question 3 (prone + difficult terrain), it produced a confused response that poisoned questions 4 and 5 in the same session, both scoring 0.00. Running each test in an independent session would give more accurate per-question scores.

**The loop works.** The mechanics are solid: author edits, manage pushes and publishes, test runs the harness, results come back with scores and reasoning, and the next iteration targets specific failures. The sub-agent architecture means each step is handled by a specialist that knows its domain.

## Source

The plugin is open source at [github.com/microsoft/skills-for-copilot-studio](https://github.com/microsoft/skills-for-copilot-studio). The test harness is at [github.com/microsoft/CopilotStudioSamples](https://github.com/microsoft/CopilotStudioSamples/tree/main/testing/functional/PytestAgentsSDK).
