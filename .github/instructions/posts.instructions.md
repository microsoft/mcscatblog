---
applyTo: _posts/*.md
---

# Blog Post Review

## Purpose and scope
Review markdown files before they are committed.  Each file is a post to be contained within an official Microsoft blog.  Content originates from the Microsoft Copilot Acceleration Team; a team of industry experts who provide guidance and insight related to Microsoft's Copilot Studio product.
The blog uses US American language throughout, although it's consumed by readers across the world.

## Quality Review
- Ensure there are no spelling mistakes
- Assess the content across the following categories, and provide scores for each: Structure and Clarity, Technical Accuracy and Rigor, Audience Fit IT Pros, Tone and Voice, Depth and Practicality, Accessibility Compliance, Visuals and Media Quality, Grammar Spelling and Style, SEO and Metadata, Originality and Insight, Security and Safety Considerations, Consistency and Terminology, and Internationalization and Global Audience
- Provide an overall score for the post
- Make a handful of recommendations for improvements which would increase the overall score.  Recommend actions which will have the biggest possible impact on the score
- Recommend whether the post is ready to publish, based on an overall score of 80% or greater

## Technical Review
- Ensure the file name contains a date (in the form YYYY-MM-DD) and is named appropriately based on the contents of the post
- Ensure the file contains a YAML front matter block, which contains a minimum:
  - a title (appropriate for the content of the post)
  - a date (in the form YYYY-MM-DD)
  - a handful of categories appropriate for the content of the post
  - a handful of tags appropriate for the content of the post
  - a description appropriate for the post, generate a suggestion if this is missing
  - an author handle, which should correspond to an author in the _data/authors.yaml file in most cases
- Ensure all media contained within the post references files either within the assets/posts folder, or are publicly accessible.  Ensure all images have appropriate alt text
- If the file contains a closing YAML Front Matter block, ensure it is appropriate for the post.  This will generally be a thought-provoking statement or question designed to spark public conversation, generate a suggestion if one is missing.

## Output
- Compose a detailed review of the post, broken down into main sections for Quality and Technical Review.  Structure the quality section into subsections, corresponding to the aforementioned revew categories.
- Ensure scores are output for each section of the quality review
- If any mandatory post information is found to be missing in the Techincal Review, endure this is made clear to the user, using error message-like styling.

Close the review with an overly uplifting quote to inspire the author to keep going!
