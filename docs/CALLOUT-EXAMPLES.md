# Callout Box Examples

This document demonstrates how each callout type appears when rendered.

## Info Callout (`.prompt-info`)

Used for general information and helpful context.

> Teams chats are persistent by design, which means both opportunities and challenges for bot developers.
{: .prompt-info}

---

## Tip Callout (`.prompt-tip`)

Used for best practices, helpful suggestions, and tips.

> Use OnKnowledgeRequested during development to verify query rewrites, then decide whether to keep it visible in production.
{: .prompt-tip}

---

## Warning Callout (`.prompt-warning`)

Used for important considerations, limitations, and caveats.

> The current implementation is designed exclusively for single-session analysis.
{: .prompt-warning}

---

## Danger Callout (`.prompt-danger`)

Used for critical security warnings and dangerous operations.

> Never commit access tokens or credentials to source control. Always use environment variables or secure credential stores, and implement proper token refresh logic.
{: .prompt-danger}

---

## Multi-line Example

Callouts can contain multiple lines and Markdown formatting like **bold**, *italic*, `code`, and [links](https://example.com).

> Before deploying the tool, review the **requirements** to ensure your environment is compatible. Make sure to:
> - Check system prerequisites
> - Verify authentication settings
> - Test in a development environment first
> 
> Then execute the setup steps to configure the tool properly.
{: .prompt-warning}

---

## Syntax Reminder

```markdown
> Your callout text goes here.
{: .prompt-TYPE}
```

Where `TYPE` is one of: `info`, `tip`, `warning`, or `danger`.

**Important:** No blank line between the blockquote and the attribute line!
