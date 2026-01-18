# Callout Boxes Documentation - Summary

## What's Been Created

This documentation provides comprehensive guidance on using properly styled callout boxes in The Custom Engine blog.

## Files Created

1. **`docs/CALLOUT-BOXES.md`** - Complete documentation guide with:
   - Overview of callout boxes
   - All four available types (info, tip, warning, danger)
   - Proper syntax and usage
   - Multi-line examples
   - Best practices and common mistakes
   - Accessibility considerations
   - Real examples from published posts
   - Quick reference table

2. **`docs/CALLOUT-EXAMPLES.md`** - Visual examples showing:
   - How each callout type renders
   - Multi-line callout example
   - Syntax reminder

3. **Updated `README.md`** - Added link to callout boxes guide in the Authoring tips section

## Quick Start

To use callout boxes in your blog post:

1. Write your text as a blockquote (start with `>`)
2. On the next line (no blank line!), add `{: .prompt-TYPE}`
3. Replace TYPE with: `info`, `tip`, `warning`, or `danger`

### Example:

```markdown
> This is important information for readers.
{: .prompt-info}
```

## The Four Types

| Type | Class | Use For |
|------|-------|---------|
| **Info** | `.prompt-info` | General information, helpful context |
| **Tip** | `.prompt-tip` | Best practices, suggestions, tips |
| **Warning** | `.prompt-warning` | Important considerations, limitations |
| **Danger** | `.prompt-danger` | Security risks, critical warnings |

## Key Points

✅ **DO:**
- Use callouts sparingly
- Keep text concise
- No blank line between blockquote and attribute
- Choose appropriate type for content

❌ **DON'T:**
- Don't use inline color styling (e.g., `<span style="color:magenta">`)
- Don't add blank lines before the attribute
- Don't overuse callouts
- Don't use `.prompt-danger` for non-security issues

## Why This Matters

The previous blog post review identified that:
- Inline color styling (like `<span style="color:magenta">`) creates accessibility issues
- It's inconsistent with the blog's styling
- Properly styled callout boxes are the correct approach

This documentation ensures all contributors know how to:
- Use callout boxes correctly
- Maintain accessibility standards
- Keep consistent styling across all posts

## Where to Find Help

- **Full Documentation**: [docs/CALLOUT-BOXES.md](CALLOUT-BOXES.md)
- **Visual Examples**: [docs/CALLOUT-EXAMPLES.md](CALLOUT-EXAMPLES.md)
- **Chirpy Theme Docs**: https://chirpy.cotes.page/posts/write-a-new-post/
- **Blog README**: [README.md](../README.md)

---

**Next Steps:** When writing blog posts, refer to `docs/CALLOUT-BOXES.md` for complete guidance on using callout boxes properly!
