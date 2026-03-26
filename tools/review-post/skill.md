---
name: review-post
description: End-to-end review, fix, publish, and verify a blog post PR from another author
---

# Review and Publish a Blog Post PR

You are reviewing and publishing a blog post PR for the Microsoft Copilot Studio CAT team blog.

The argument is either a PR number, a branch name, or an author's GitHub username. If not provided, ask.

## Step 1: Pull the PR Branch

1. Find the PR using `gh pr list` (filter by author if a username was given)
2. Check out the PR branch: `gh pr checkout <number>`
3. Identify the new or modified post file in `_posts/`

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
- Front matter corrections (dates, tags, categories)
- Image resizing (use Python PIL)
- Replacing emoji callouts with Chirpy prompt boxes

Apply only the fixes the user approves.

## Step 5: Commit, Push, and Comment

1. Commit all changes with a descriptive message listing what was fixed
2. Push to the PR branch
3. Add a PR comment summarizing all changes made, organized by category, so the original author can see what was changed and why

## Step 6: Merge

1. Merge the PR with `gh pr merge --squash --delete-branch`
2. Wait ~90 seconds for GitHub Actions to run
3. Check the build status with `gh run list --limit 3`
4. If the build fails, investigate immediately

## Step 7: Verify Production

1. Fetch the production page using WebFetch at `https://microsoft.github.io/mcscatblog/posts/<slug>/`
2. Confirm the page loads with correct title, author, date, images, and code blocks
3. Report the live URL to the user
