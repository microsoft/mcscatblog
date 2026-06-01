---
applyTo: _posts/*.md
---

# Blog Post Review

## Purpose

Review posts for the Microsoft Copilot Studio CAT team blog (microsoft.github.io/mcscatblog/). Perform a full review every time a post file is created or updated. US American English. Audience: IT pros building with Copilot Studio.

## Priority 1: Narrative and Structure

This is the most important part of the review. A post with perfect grammar but broken narrative flow will fail readers.

- Does the intro clearly state the **problem** the reader has? Posts must not document technical patterns simply because something is possible. They must demonstrate why the reader should care.
- Does the reader understand **why** before being shown **how**?
- **Progressive disclosure**: basic concept → working implementation → optional enhancements. Never dump everything upfront. If the post shows a complete 100-line YAML before explaining any of it, flag this.
- **Every section earns its place.** If you can't explain why a section exists, flag it for removal.
- Alternatives dismissed in the intro should each have a clear, specific reason — not vague hand-waving.
- **No redundant content.** If the same concept is explained twice in different sections (e.g., two overlapping tables, a glossary that restates callouts), flag the duplication.
- Sections that are "valuable but tangential" should be flagged for a follow-up post, not included. Enterprise patterns, advanced scaling, troubleshooting matrices — these are common scope bloat.

## Priority 2: Technical Accuracy

- **Every technical claim should be verifiable.** Flag statements that sound authoritative but aren't linked to documentation or substantiated with evidence (e.g., "the search index chunks text at 512 characters" — says who?).
- Code examples must be complete and working. No pseudocode unless explicitly labeled as such.
- YAML/JSON blocks longer than 20 lines should be in collapsible `<details>` sections.
- **Links to MS docs** for every product feature, API, or configuration step mentioned. If the post says "enable Dataverse Search," it should link to the doc that shows how.
- **Internal links** using `post_url` to 2-3 related blog posts. Check `_posts/` for candidates with overlapping topics.
- No credentials, secrets, or real environment URLs in code examples.

## Priority 3: Reader Experience

- Screenshots appear **after** their explanation, not before. The reader should understand what they're about to see.
- Every image has an italic caption on the line immediately after: `_Caption text_`
- Tall/narrow images (height > 2x width) need resizing to ~300px width.
- Collapsible sections (`<details>`) for setup screenshots and long YAML blocks. Note: markdown inside `<details>` requires `<pre><code>` for code blocks — standard markdown fences won't render.
- **No manual "Further Reading" section.** Chirpy auto-generates one from shared tags (1 point each) and categories (0.5 points each). Instead, verify the post's tags maximize overlap with related existing posts.
- Callouts use Chirpy prompt boxes (`{: .prompt-tip }`, `{: .prompt-info }`, `{: .prompt-warning }`, `{: .prompt-danger }`), not emoji (no 💡, ⭐, ⚠️).
- Be frugal with em-dashes. Prefer commas or restructuring.
- Ends with an engagement question or thought-provoking closing statement.

## Priority 4: Front Matter and Metadata

- Filename: `YYYY-MM-DD-descriptive-slug.md` (date matches front matter date)
- Required front matter: `title`, `date`, `categories` (lowercase, max 2), `tags` (lowercase, 5-8), `description`, `author`, `image` with `alt` text
- Author matches a key in `_data/authors.yml`
- Tags chosen to maximize useful Chirpy "Further Reading" overlap with existing posts — not generic terms like `search` or `agent-design` that match nothing
- Description reflects what the post actually covers (not aspirational)
- Consistent terminology: "agent" not "bot", "knowledge source" not "knowledge entry"

## Priority 5: Scope and Length

- Flag posts over 5,000 words. Most posts should be 2,000-4,000 words.
- The post should do **one thing well**, not cover everything the author knows about the topic.
- If a post covers 6 approaches at shallow depth, flag it — pick 2-3 and go deep.

## Output

- List the **top 5-7 issues** ranked by impact on reader experience.
- For each issue: **quote** the problematic text, explain **why** it's a problem, suggest a fix.
- Do NOT score 14 categories. Do NOT provide percentage scores.
- State whether the post is: **ready to publish**, **needs minor fixes**, or **needs structural revision**.

## Chirpy Markdown Reference

Validate markdown syntax against these Chirpy theme conventions:

### Front Matter
```yaml
---
title: TITLE
date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [TOP_CATEGORY, SUB_CATEGORY]  # Max 2, lowercase
tags: [tag1, tag2]  # Unlimited, lowercase
description: Custom summary for SEO
author: author_id  # Must match _data/authors.yml
image:
  path: /assets/posts/slug/header.png
  alt: Descriptive alt text
math: true  # Enable MathJax if needed
mermaid: true  # Enable diagrams if needed
pin: true  # Pin to homepage if needed
---
```

### Images
```markdown
![alt-text](/path/to/image){: w="700" h="400" }  # With dimensions
![alt-text](/path/to/image){: .shadow }  # Screenshot styling
![alt-text](/path/to/image){: .left }  # Position: .normal, .left, .right
![alt-text](/path/to/image){: .light }  # Theme: .light or .dark
```
*Caption text in italics immediately after image*

### Prompts/Callouts
```markdown
> Content here
{: .prompt-tip }
```
Types: `prompt-tip`, `prompt-info`, `prompt-warning`, `prompt-danger`

### Code Blocks
````markdown
```language
code here
```
````
Options:
- `{: file="path/to/file" }` - Show filename
- `{: .nolineno }` - Hide line numbers
- For PowerFX code, use `javascript` as the language identifier since Rouge does not have a PowerFX lexer

### Collapsible Sections
Markdown inside `<details>` blocks must use HTML, not markdown fences:
```html
<details>
<summary>Click to expand</summary>
<pre><code class="language-yaml">your code here
</code></pre>
</details>
```

### File Paths
```markdown
`/path/to/file.ext`{: .filepath}
```

### Mermaid Diagrams
Requires `mermaid: true` in front matter:
````markdown
```mermaid
graph LR
    A --> B
```
````

### Video/Audio Embeds
```liquid
{% include embed/video.html src='/path/video.mp4' %}
{% include embed/audio.html src='/path/audio.mp3' %}
{% include embed/youtube.html id='VIDEO_ID' %}
```

### Mathematics
Requires `math: true` in front matter:
- Block: `$$ equation $$` with blank lines before/after
- Inline: `$$ equation $$` without blank lines
