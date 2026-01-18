---
applyTo: _posts/*.md
---

# Blog Post Review

## Purpose and scope
Review the post included in the pull request, whether the file is created or updated.  Perform a full review of all file contents every time any change is made to the file.
Each file is a post to be contained within an official Microsoft blog.  Content originates from the Microsoft Copilot Acceleration Team; a team of industry experts who provide guidance and insight related to Microsoft's Copilot Studio product.
The blog uses US American language throughout, although it's consumed by readers across the world.

## Quality Review
- Ensure there are no spelling mistakes
- Assess the content across the following categories, and provide scores for each: Structure and Clarity, Technical Accuracy and Rigor, Audience Fit IT Pros, Tone and Voice, Depth and Practicality, Accessibility Compliance, Visuals and Media Quality, Grammar Spelling and Style, SEO and Metadata, Originality and Insight, Security and Safety Considerations, Consistency and Terminology, and Internationalization and Global Audience
- **Problem-Solution Framing**: Every post must clearly articulate an issue, gap, problem, or need that readers face, and provide a clear path to address it. Posts should not document technical patterns simply because something is possible—they must demonstrate why the reader should care and how it solves a real-world challenge. Deduct points if the post lacks a clear problem statement or if the "why" is missing
- Provide an overall score for the post
- Make a handful of recommendations for improvements which would increase the overall score.  Recommend actions which will have the biggest possible impact on the score
- Recommend whether the post is ready to publish, based on an overall score of 80% or greater

## Technical Review
- Ensure the file name contains a date (in the form YYYY-MM-DD) and is named appropriately based on the contents of the post
- Ensure the file contains a YAML front matter block, which contains a minimum:
  - a title (appropriate for the content of the post)
  - a date (in the form YYYY-MM-DD)
  - a handful of categories appropriate for the content of the post, these should be lower case to prevent conflicts in site generation caused by case sensitivity
  - a handful of tags appropriate for the content of the post, these should be lower case to prevent conflicts in site generation caused by case sensitivity
  - a description appropriate for the post, generate a suggestion if this is missing
  - an author handle, which should correspond to an author in the _data/authors.yaml file in most cases
- Ensure all media contained within the post references files either within the assets/posts folder, or are publicly accessible.  Ensure all images have appropriate alt text
- If the file contains a closing YAML Front Matter block, ensure it is appropriate for the post.  This will generally be a thought-provoking statement or question designed to spark public conversation, generate a suggestion if one is missing.

## Output
- State that a comprehensive, The Custom Engine blog post specific code review has been completed using Github Copilot with custom instructions
- Compose a detailed review of the post, broken down into main sections for Quality and Technical Review.  Structure the quality section into subsections, corresponding to the aforementioned revew categories.
- Ensure scores are output for each section of the quality review
- If any mandatory post information is found to be missing in the Techincal Review, endure this is made clear to the user, using error message-like styling.

Close the review with an overly uplifting quote to inspire the author to keep going!

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
