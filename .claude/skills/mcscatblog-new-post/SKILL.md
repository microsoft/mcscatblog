---
name: mcscatblog-new-post
description: Create a new blog post with branch, front matter, and asset folder
---

# Create a New Blog Post

Scaffold a new blog post with everything ready to write.

## Arguments

The argument should be a short description of the post topic, e.g. "Dataverse search for unauthenticated agents" or "WebChat middleware patterns". If not provided, ask.

## Steps

1. **Ask for details** (if not provided):
   - Post topic / working title
   - Author GitHub username (check `_data/authors.yml` — if not there, add them)

2. **Generate the slug** from the topic. Use lowercase, hyphens, no special characters. Keep it short but descriptive. Today's date for the prefix.

3. **Create a branch**: `post/<slug>` (e.g., `post/dataverse-search-unauthenticated`)

4. **Create the post file** at `_posts/YYYY-MM-DD-<slug>.md` with front matter:

```yaml
---
layout: post
title: "<Working Title>"
date: YYYY-MM-DD
categories: [copilot-studio, <second-category>]
tags: []
description: ""
author: <author-key>
image:
  path: /assets/posts/<slug>/header.png
  alt: ""
---

<!-- Write your post here -->
```

5. **Create the assets folder**: `assets/posts/<slug>/`

6. **Add author to `_data/authors.yml`** if they're not already there. Ask for their display name if needed.

7. **Report** the file path, branch name, and next steps:
   - Write the post in the markdown file
   - Add images to `assets/posts/<slug>/`
   - Preview with `/mcscatblog-local-server`
   - Review with `/mcscatblog-review-post <file>`
   - Submit with `/mcscatblog-submit-pr`

## Notes

- Do NOT set `published: false` — the post lives on a feature branch so there's no risk of it going live prematurely. Unpublished posts don't render on the local dev server, which makes previewing impossible.
- Leave tags empty — they should be chosen during review to maximize Chirpy "Further Reading" overlap
- Leave description empty — it should be written after the post content is finalized
- Categories: always include `copilot-studio` as the first category
