---
name: mcscatblog-review-post
description: End-to-end review, fix, publish, and verify a blog post PR from another author
---

# Review and Publish a Blog Post PR

You are reviewing and publishing a blog post PR for the Microsoft Copilot Studio CAT team blog.

The argument is either a PR number, a branch name, or an author's GitHub username. If not provided, ask.

## Backlog Source of Truth

Use only the SharePoint **CAPE Patterns & Practices Backlog** list for editorial tracking:

https://microsoft.sharepoint.com/teams/CAPECopilotAgentsPlatformEcosystem-PatternsandPractices/Lists/CAPE%20Patterns%20%20Practices%20Backlog/AllItems.aspx

Do not search or update the former Microsoft Loop backlog, including as a fallback. The Blog Editorial Hub managed app uses this same SharePoint list; it is not a separate backlog.

- Resolve the existing item by its `GitHubPullRequest` URL first, then by title and author if it is not linked yet. Titles can differ between the list and the post. If no item matches, or several match, ask the user rather than creating a duplicate or guessing.
- Read the list's column definitions and current item before writing. Relevant internal field names are `Title`, `Status`, and `GitHubPullRequest` (a hyperlink with `Url` and `Description`). The destination field is `Goes_x0020_to`; blog items use `The Custom Engine Blog`.
- Link the original article PR in `GitHubPullRequest` and use `PR submitted` while it awaits publication. Preserve that original link for an already-published article; do not replace it with a date-only or maintenance PR.
- If using Microsoft Graph, resolve the site and list IDs from the URL. Read `/sites/{site-id}/lists/{list-id}/items` with selected fields and follow pagination. Title filtering can fail on this list because `Title` is not indexed; in that case, inspect paginated results rather than switching to Loop.
- With WorkIQ, update the supported list-item path `/sites/{site-id}/lists/{list-id}/items/{item-id}` with a `fields` object. For example, a status-only update is `{"@odata.type":"#microsoft.graph.listItem","fields":{"@odata.type":"#microsoft.graph.fieldValueSet","Status":"Published"}}`. The `/fields` PATCH path may not be exposed by that tool. Use the latest ETag with `If-Match` when supported; reread and reconcile a conflict rather than overwriting it.
- Read the item back after updating. If SharePoint access or a write fails, report the tracking step as blocked; do not claim it succeeded or substitute Loop.

## Step 1: Pull the PR Branch

1. Find the PR using `gh pr list` (filter by author if a username was given)
2. Check out the PR branch: `gh pr checkout <number>`
3. Identify the new or modified post file in `_posts/`
4. Resolve its SharePoint backlog item using the rules above and confirm the original article PR is linked.

## Step 2: Start Local Dev Server

1. Run `./tools/run.sh` in the background
2. Wait for the server to be ready at `http://127.0.0.1:4000/mcscatblog/`
3. Open the post in the browser so the user can see it

## Step 3: Review the Post

Read the review instructions at `.github/instructions/posts.instructions.md`. Review the post against priorities 1-5 defined there.

### Read as a Reader First

Before checking anything technical, read the post top to bottom as a reader would. Ask yourself:
- Do I understand the problem being solved by the end of the intro?
- At any point, did I feel lost, bored, or overwhelmed?
- Could I follow the instructions and get a working result?
- Were there sections I wanted to skip?

### Narrative and Structure (highest impact)

- Does the intro state the problem clearly before showing the solution?
- Progressive disclosure: does the post build from basic to advanced, or dump everything at once?
- Does every section earn its place? Flag tangential sections for removal.
- No redundant content (same concept in two tables, glossary restating callouts, etc.)
- Flag posts over 5,000 words or posts that try to cover too many things shallowly.

### Technical Accuracy

- Flag authoritative-sounding claims that aren't linked to documentation.
- Verify technical claims if possible (e.g., if the post says "the API returns fragments," test it).
- All code examples should be complete and working.
- YAML/JSON blocks over 20 lines should be in collapsible `<details>` sections (use `<pre><code>` inside, not markdown fences).
- Links to MS docs for every product feature or configuration step.
- 2-3 internal links using `post_url` to related blog posts.

### Front Matter and Images

- Filename date matches front matter date
- Required: title, date, categories (lowercase, max 2), tags (lowercase, 5-8), description, author (matches `_data/authors.yml`), image with alt text
- All referenced images exist in `assets/posts/` and have alt text + italic caption
- Screenshots appear after their explanation, not before
- Tall/narrow images (height > 2x width) need resizing to ~300px width
- No manual "Further Reading" section (Chirpy auto-generates from tags)
- Callouts use Chirpy prompt boxes, not emoji
- Tags maximize Chirpy "Further Reading" overlap with existing posts

### Naming and Terminology (canonical)

Copilot Studio is **one product**. It offers three *harnesses* (build experiences), not three separate products. Flag any framing that treats a harness as its own product. Prose should lead with "Copilot Studio" and introduce a harness name only when precision requires it.

Flag and correct non-canonical harness names to these canonical ones:

| Canonical harness | What it is | Reject these terms |
| --- | --- | --- |
| **Copilot Chat harness** | Customize Microsoft 365 Copilot with your organization's knowledge. | "Chat agent", "DA", "classic/old Copilot Studio" |
| **Standard harness** | Rule-based conversational agents with predefined topics and flows. | "Basic orchestration", "Advanced", "Samba", "classic/old Copilot Studio" |
| **GitHub Copilot harness** | Optimize your business processes with an agentic build experience. | "New Copilot Studio", "Dracarys" |

Additional checks:

- Harnesses are build choices, not separate products.
- Use the term "harness" consistently; avoid alternates such as "orchestrator".
- Avoid scale labels such as Basic, Advanced, Premium, or Ultimate; they don't scale as new harnesses are added.
- Context note (keep any cost/licensing phrasing factual and brief): as of 8/3, Copilot Studio supports building agents with a new GitHub Copilot harness (GA); agents built with it are billed on a usage basis and are not eligible for inclusion in Microsoft 365 Copilot licensing.

**Front-matter `agent_edition` taxonomy** (established by PR #352, "Retire classic/modern edition naming"). This field drives the under-title pill rendered in `_layouts/post.html` and validated by `_plugins/validate-agent-edition.rb`. Canonical values and what they render:

- `standard` → "Standard harness" pill
- `github-copilot` → "GHCP harness" pill
- `both` → "Both harnesses" pill

Deprecated aliases `classic` → `standard` and `modern` → `github-copilot` are still accepted but should be migrated. Review check: every post sets a valid `agent_edition`, and posts using `classic`/`modern` should be updated to the canonical value.

### Output the Review

- List the **top 5-7 issues** ranked by impact.
- For each: quote the text, explain the problem, suggest a fix.
- Do NOT score 14 categories or provide percentage scores.
- State: **ready to publish**, **needs minor fixes**, or **needs structural revision**.

## Step 4: Apply Fixes

After presenting the review, ask the user which fixes to apply. Common fixes include:

- Restructuring sections for progressive disclosure
- Adding MS docs links and internal post links
- Cutting tangential sections
- Making YAML blocks collapsible
- Grammar, spelling, terminology corrections
- Correcting Copilot Studio product/harness terminology to canonical names (see Naming and Terminology)
- Front matter corrections (dates, tags, categories)
- Image resizing (use Python PIL)
- Replacing emoji callouts with Chirpy prompt boxes

Apply only the fixes the user approves.

## Step 5: Commit, Push, and Comment

1. For a newly published article, set the front-matter date to the publication date and rename `_posts/YYYY-MM-DD-<slug>.md` to match. Keep the slug and public URL unchanged, and update any `post_url` references to the old filename. Do not bump publication dates for routine maintenance of an already-published article unless requested.
2. Verify the updated post renders, then commit all changes with a descriptive message listing what was fixed.
3. Push to the PR branch.
4. Add a PR comment summarizing all changes made, organized by category, so the original author can see what was changed and why.

## Step 6: Merge

1. Confirm a new article's filename and front-matter date still match the publication date. If publication was delayed, repeat the date update, verification, commit, and push before final checks.
2. Confirm any linked sample PRs have merged so the article's sample links resolve.
3. Merge only when the user has authorized publication and required reviews and checks pass. Never bypass repository protections.
4. Merge the PR with `gh pr merge --squash --delete-branch`.
5. Wait ~90 seconds, then find the `Build and Deploy` run for the merge commit with `gh run list --limit 3` and wait for it to succeed.
6. If the build fails, investigate immediately. Leave the backlog item at `PR submitted` until production is verified.

## Step 7: Verify Production

1. Fetch the production page using WebFetch at `https://microsoft.github.io/mcscatblog/posts/<slug>/`
2. Confirm the page loads with correct title, author, date, images, and code blocks. For a newly published article, also verify its placement and date in the homepage's Latest section or `/latest/`; a working direct URL alone does not confirm that readers can find it.
3. Update the matched SharePoint item's `Status` to `Published`, preserving its original article PR link and all unrelated fields.
4. Read the item back to verify `Status: Published` and the correct `GitHubPullRequest` URL.
5. Report the live URL and whether the SharePoint update succeeded. Publication and backlog tracking are separate outcomes; report either failure explicitly.
