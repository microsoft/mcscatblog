# Blog Post Review Skill

A Claude Code skill for reviewing blog posts before they're published. Catches structural, narrative, and technical issues that automated linting misses.

## What It Does

When you run `/review-post` in Claude Code, it:

1. Pulls the PR branch and starts the local Jekyll server
2. Reviews the post against prioritized criteria (narrative > accuracy > experience > metadata > scope)
3. Lists the top 5-7 issues ranked by impact, with quoted text and suggested fixes
4. Applies fixes you approve
5. Commits, pushes, and comments on the PR

## Why Not Just Use GitHub Copilot Review?

GitHub Copilot code review catches formatting issues (date mismatches, malformed tables, missing links). But it doesn't catch **editorial issues** that actually matter:

- Is the intro framing the problem clearly?
- Is the post dumping everything upfront instead of building progressively?
- Are there sections that are valuable but tangential?
- Is the post trying to do too many things at shallow depth?

This skill does both. Use GitHub Copilot for automatic linting on every PR, and this skill for the editorial pass.

## Install

### Claude Code CLI

Copy the skill file into your local Claude Code skills directory:

```bash
# From the repo root
mkdir -p ~/.claude/skills/review-post
cp tools/review-post/skill.md ~/.claude/skills/review-post/skill.md
```

Then in Claude Code, run:

```
/review-post 244
```

(where `244` is the PR number, or a branch name, or an author's GitHub username)

### GitHub Copilot CLI (gh copilot)

The skill is designed for Claude Code, but the review instructions at `.github/instructions/posts.instructions.md` are automatically picked up by GitHub Copilot on every PR. Those handle the automated linting layer.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- `gh` CLI authenticated with access to the repo
- Ruby/Bundler for the local Jekyll server (`bundle install`)
- Python 3 with PIL/Pillow for image resizing (`pip install Pillow`)

## Review Criteria

The skill reviews against five priorities (in order of impact):

| Priority | What it checks |
|----------|---------------|
| 1. Narrative and Structure | Problem framing, progressive disclosure, scope, redundancy |
| 2. Technical Accuracy | Verifiable claims, doc links, internal links, working code |
| 3. Reader Experience | Image placement, collapsibles, Chirpy conventions, callouts |
| 4. Front Matter and Metadata | Tags for Further Reading overlap, dates, author |
| 5. Scope and Length | Word count, tangential sections, "one thing well" |

Full review instructions: [`.github/instructions/posts.instructions.md`](../../.github/instructions/posts.instructions.md)
