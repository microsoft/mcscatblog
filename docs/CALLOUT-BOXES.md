# How to Use Callout Boxes in Blog Posts

This guide explains how to properly use styled callout boxes in The Custom Engine blog posts.

## Overview

Callout boxes (also called "prompts" in the Chirpy theme) are special formatted blocks that highlight important information in your blog posts. They provide visual emphasis and help readers quickly identify different types of content.

## Available Callout Types

The blog supports four types of callout boxes:

1. **`.prompt-info`** - For general information and helpful notes
2. **`.prompt-tip`** - For tips, best practices, and helpful suggestions
3. **`.prompt-warning`** - For warnings, important considerations, and caveats
4. **`.prompt-danger`** - For critical security warnings and dangerous operations

## Syntax

The syntax for creating callout boxes uses Markdown blockquotes with a Kramdown attribute:

```markdown
> Your callout text goes here.
{: .prompt-TYPE}
```

**Important:** 
- The callout text must be a blockquote (start with `>`)
- The attribute line `{: .prompt-TYPE}` must be on its own line immediately after the blockquote
- There should be **no blank line** between the blockquote and the attribute line

## Examples

### Info Callout

Use `.prompt-info` for general information that provides helpful context:

```markdown
> Teams chats are persistent by design, which means both opportunities and challenges for bot developers.
{: .prompt-info}
```

**Rendered as:**

> Teams chats are persistent by design, which means both opportunities and challenges for bot developers.
{: .prompt-info}

---

### Tip Callout

Use `.prompt-tip` for tips, best practices, and helpful suggestions:

```markdown
> Use OnKnowledgeRequested during development to verify query rewrites, then decide whether to keep it visible in production.
{: .prompt-tip}
```

**Rendered as:**

> Use OnKnowledgeRequested during development to verify query rewrites, then decide whether to keep it visible in production.
{: .prompt-tip}

---

### Warning Callout

Use `.prompt-warning` for important considerations, caveats, and non-critical warnings:

```markdown
> The current implementation is designed exclusively for single-session analysis.
{: .prompt-warning}
```

**Rendered as:**

> The current implementation is designed exclusively for single-session analysis.
{: .prompt-warning}

---

### Danger Callout

Use `.prompt-danger` for critical security warnings and dangerous operations:

```markdown
> Never commit access tokens or credentials to source control. Always use environment variables or secure credential stores, and implement proper token refresh logic.
{: .prompt-danger}
```

**Rendered as:**

> Never commit access tokens or credentials to source control. Always use environment variables or secure credential stores, and implement proper token refresh logic.
{: .prompt-danger}

---

## Multi-line Callouts

Callouts can contain multiple lines and even Markdown formatting:

```markdown
> Before deploying the tool, review the [requirements](https://example.com/requirements) to ensure your environment is compatible, then execute the [setup steps](https://example.com/setup) to configure the tool.
{: .prompt-warning}
```

**Rendered as:**

> Before deploying the tool, review the [requirements](https://example.com/requirements) to ensure your environment is compatible, then execute the [setup steps](https://example.com/setup) to configure the tool.
{: .prompt-warning}

---

## Best Practices

### ✅ DO:

- Use callouts sparingly to maintain their impact
- Choose the appropriate type based on the severity/nature of the information
- Keep callout text concise and focused on a single point
- Use Markdown formatting (links, bold, code) within callouts when appropriate
- Ensure the attribute line immediately follows the blockquote (no blank lines)

### ❌ DON'T:

- Don't overuse callouts - too many reduce their effectiveness
- Don't use `.prompt-danger` for non-security issues
- Don't add blank lines between the blockquote and the attribute line
- Don't use inline color styling (e.g., `<span style="color:magenta">`) as it creates accessibility issues
- Don't use callouts for content that should be in the main text

### When to Use Each Type:

- **Info** (`.prompt-info`): Background information, explanations, context
- **Tip** (`.prompt-tip`): Best practices, helpful suggestions, pro tips, recommendations
- **Warning** (`.prompt-warning`): Important considerations, limitations, caveats, things to be aware of
- **Danger** (`.prompt-danger`): Security risks, data loss risks, irreversible operations, critical issues

---

## Common Mistakes

### ❌ Incorrect - Blank line between blockquote and attribute:

```markdown
> This is a callout.

{: .prompt-info}
```

This will NOT render as a callout because of the blank line.

### ✅ Correct - No blank line:

```markdown
> This is a callout.
{: .prompt-info}
```

---

### ❌ Incorrect - Using inline styling instead of callouts:

```markdown
<span style="color:magenta">
This is important information.
</span>
```

This creates accessibility issues and is not consistent with the blog's styling.

### ✅ Correct - Use proper callout boxes:

```markdown
> This is important information.
{: .prompt-info}
```

---

## Accessibility Considerations

- Callout boxes use semantic HTML and proper ARIA labels for screen readers
- Color is not the only indicator - icons and backgrounds provide additional visual cues
- Inline color styling (like `style="color:magenta"`) should be avoided as it may not meet WCAG contrast requirements
- All callout types are keyboard accessible and work with assistive technologies

---

## Testing Your Callouts

After adding callouts to your post:

1. **Preview locally**: Run `bundle exec jekyll serve --livereload --baseurl /mcscatblog` and check the rendered output
2. **Check responsiveness**: View on different screen sizes to ensure callouts display properly
3. **Verify accessibility**: Ensure text is readable and has sufficient contrast
4. **Review consistency**: Make sure callout types match the content appropriately

---

## Examples from Real Posts

Here are some real examples from published posts:

### Security Warning (from response-analysis-copilot-tool.md):
```markdown
> Never commit access tokens or credentials to source control. Always use environment variables or secure credential stores, and implement proper token refresh logic.
{: .prompt-danger}
```

### Helpful Tip (from copilot-studio-teams-deployment-ux.md):
```markdown
> Clearing state on inactivity prevents the AI from hitting context length limits and avoids weird behaviors when users return later.
{: .prompt-tip}
```

### Important Information (from copilot-studio-teams-deployment-ux.md):
```markdown
> Teams chats are persistent by design, which means both opportunities and challenges for bot developers.
{: .prompt-info}
```

### Important Consideration (from response-analysis-copilot-tool.md):
```markdown
> The current implementation is designed exclusively for single-session analysis.
{: .prompt-warning}
```

---

## Additional Resources

- [Chirpy Theme Documentation - Writing a New Post](https://chirpy.cotes.page/posts/write-a-new-post/)
- [Kramdown Syntax Documentation](https://kramdown.gettalong.org/syntax.html)
- Blog README: [README.md](/README.md)

---

## Quick Reference

| Callout Type | Use Case | Example |
|-------------|----------|---------|
| `.prompt-info` | General information, helpful context | Explaining how a feature works |
| `.prompt-tip` | Best practices, suggestions | Recommending an optimal approach |
| `.prompt-warning` | Important considerations, limitations | Noting single-session design |
| `.prompt-danger` | Security risks, critical warnings | Warning about credential storage |

---

**Remember:** Properly styled callout boxes enhance readability and help readers quickly identify important information. Use them wisely to make your technical content more accessible and effective!
