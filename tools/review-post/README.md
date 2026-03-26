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

This skill does both. GitHub Copilot runs automatically on every PR for linting. Use this skill for the editorial pass.

## How to Use

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- `gh` CLI authenticated with access to the repo
- Ruby/Bundler for the local Jekyll server (`bundle install`)
- Python 3 with Pillow for image resizing (`pip install Pillow`)

### No Install Needed

The skill is already in the repo at `.claude/skills/review-post/SKILL.md`. Claude Code discovers it automatically when you open the project. Just clone the repo and run:

```
/review-post 244
```

Where the argument is a PR number, a branch name, or an author's GitHub username.

### What Happens

Claude Code will:
1. Check out the PR branch
2. Start the local Jekyll server
3. Read the post and review it against the [review instructions](../../.github/instructions/posts.instructions.md)
4. Present the top issues ranked by impact
5. Ask which fixes to apply
6. Commit, push, and comment on the PR

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

## Two-Layer Review Strategy

| Layer | Tool | What it catches | When it runs |
|-------|------|----------------|-------------|
| Automated linting | GitHub Copilot | Date mismatches, malformed tables, missing links, code block issues | Automatically on every PR |
| Editorial review | Claude Code (`/review-post`) | Narrative flow, progressive disclosure, scope control, redundancy, verifiable claims | On demand, before merge |
