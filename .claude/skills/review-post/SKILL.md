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

Read the style guide at `.github/instructions/posts.instructions.md` and review the post against it.

### Technical Review

- File name has date (YYYY-MM-DD) and descriptive slug
- Front matter has: title, date, categories (lowercase), tags (lowercase), description, author (matches `_data/authors.yml`), image with alt text
- Date in filename matches date in front matter
- No duplicate or redundant tags
- Do NOT add a manual "Further Reading" section. Chirpy auto-generates one based on shared tags (1 point each) and categories (0.5 points each), showing the top 3 related posts. Instead, verify the auto-generated recommendations make sense by checking the post's tags/categories overlap with related posts. If the auto-generated picks are poor, adjust the post's tags to improve relevance rather than adding a manual section
- All referenced images exist in `assets/posts/` and have alt text
- All images have an italic caption on the line immediately after: `_Caption text_`
- Screenshots match the step/section they are placed under (visually inspect each image)
- Closing statement or thought-provoking question exists
- Code blocks use valid Rouge language identifiers (use `javascript` for PowerFX)

### Quality Review

Score each category out of 100:

- **Structure and Clarity**: Logical flow, good headings, progressive complexity
- **Technical Accuracy and Rigor**: Correct code examples, accurate statements
- **Audience Fit (IT Pros)**: Appropriate depth and assumptions
- **Tone and Voice**: Professional but approachable, not academic
- **Depth and Practicality**: Working examples, real-world applicability
- **Accessibility Compliance**: Descriptive alt text, readable structure
- **Visuals and Media Quality**: Screenshots with captions, appropriate sizing
- **Grammar, Spelling, and Style**: US American English, correct punctuation, hyphenation
- **SEO and Metadata**: Keywords in title/description, 5-8 tags, internal links
- **Originality and Insight**: Goes beyond documentation, provides unique value
- **Security and Safety Considerations**: No credentials exposed, safe patterns
- **Consistency and Terminology**: Consistent terms throughout (e.g., "agent" not "bot", "knowledge source" not "knowledge entry")
- **Internationalization and Global Audience**: US English, globally accessible examples
- **Problem-Solution Framing**: Clear problem statement, clear "why" the reader should care

### Image Review

Check for oversized tall/narrow images (height > 2x width) that dominate the page. Recommend resizing these to ~300px width while maintaining aspect ratio.

Check for cropping artifacts (stray lines, incomplete UI elements at edges).

### Overall Score

Provide an overall score. Posts scoring 80%+ are ready to publish (with fixes applied). Present the review to the user with top recommendations ranked by impact.

## Step 4: Apply Fixes

After presenting the review, ask the user which fixes to apply. Common fixes include:

- Grammar and spelling corrections
- Terminology standardization
- Front matter corrections (dates, tags, categories)
- Image resizing for oversized screenshots
- Code block language identifier fixes
- Cropping artifacts in images (use Python PIL to crop)

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
