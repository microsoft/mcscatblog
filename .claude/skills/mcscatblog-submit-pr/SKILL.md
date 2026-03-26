---
name: mcscatblog-submit-pr
description: Commit current changes and create a pull request for review
---

# Submit a Pull Request

Commit the current changes on a feature branch and create a PR for review.

## Steps

1. Run `git status` to see what's changed. If there are no changes, tell the user and stop.

2. If on `main`, create a new branch. Name it based on the changes:
   - For new posts: `post/<slug>` (e.g., `post/dataverse-search-copilot-studio`)
   - For post edits: `edit/<slug>`
   - For other changes: `fix/<short-description>`

3. Stage the relevant files. Be selective:
   - Stage post files in `_posts/`
   - Stage related assets in `assets/posts/`
   - Stage author changes in `_data/authors.yml`
   - Do NOT stage unrelated files, `.claude/` local files, or screenshots left in the repo root

4. Commit with a descriptive message. For new posts, include the post title. For edits, describe what changed.

5. Push the branch to origin.

6. Create the PR using `gh pr create`:
   - **Title**: Short, under 70 characters
   - **Body**: Use this format:

```
## Summary
<1-3 bullet points describing the changes>

## Checklist
- [ ] Ran `/review-post` and addressed feedback
- [ ] Local server renders correctly (`./tools/run.sh`)
- [ ] All images have alt text and captions
- [ ] 2-3 internal links to related posts
- [ ] Tags chosen for Chirpy "Further Reading" overlap
```

7. Report the PR URL to the user.

## Notes

- Do NOT merge the PR. The PR is for review.
- If the user provides a PR description or title, use it.
- If the argument is "draft", create a draft PR with `--draft`.
