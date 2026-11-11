# Microsoft Copilot harness and SDK branding review guidance

Source: *Microsoft Copilot harness and SDK - Brand Guidelines*, October 2026,
slides 2-8, including speaker notes. This Markdown adaptation is the shared
branding reference for blog reviews. Slide 9 is a previous-overview appendix;
use the main guidance rather than its superseded wording.

The deck states that the naming changes take effect beginning October 28, 2026.
Apply the current names to new and updated article messaging. This guide
governs branding, not technical capabilities, support status, or licensing.

## B1: Choose harness or SDK by context

Use **Microsoft Copilot harness** as the default name for the shared agent
harness powering Copilot experiences across Microsoft. Use it in positioning,
narrative, blogs, keynotes, and first-party "powered by" or "built on"
references, including Copilot Studio and Microsoft Foundry.

Use **Microsoft Copilot SDK** for the SDK repository, SDK documentation, and
calls to action for developers or customers to access the harness for their
own implementation. Do not mechanically replace every occurrence of SDK with
harness: an article documenting SDK usage can legitimately use the SDK name.

| Problematic messaging | Correction | Reason |
| --- | --- | --- |
| "Copilot Studio is powered by the Copilot SDK." | "Copilot Studio is powered by the Microsoft Copilot harness." | First-party powered-by references use harness. |
| "Foundry now supports the Copilot SDK." (referring to the harness in Foundry) | "Run the Microsoft Copilot harness in Microsoft Foundry." | Describe the harness in Foundry, rather than calling it the SDK. |
| "Get started with the GitHub Copilot SDK." | "Get started with the Microsoft Copilot SDK." | An SDK access call to action uses the current SDK name. |

These corrections assume first mention; use B2 for later mentions.
Source: slides 2, 3, 5, and 8.

## B2: Use full names on first mention

Introduce **Microsoft Copilot harness** on first mention. Later mentions can
use **Copilot harness**, or **the harness** once the context is clear.

Introduce **Microsoft Copilot SDK** on first mention of the SDK. Later
mentions can use **Copilot SDK**. Introducing the harness does not introduce
the SDK's full name.

Check titles, headings, descriptions, body text, captions, alt text, diagrams,
and authored image text. Check the description independently because it can
appear without the article. In the article's reading order, a full name in
the title counts as an introduction; do not require it in every paragraph.

Source: slides 3, 4, and 8. The review-surface checks above apply the deck's
first-mention rule to blog publishing.

## B3: Preserve spelling and capitalization

Write **Microsoft Copilot** in title case, **harness** in lowercase, and
**SDK** in uppercase, including in article titles and headings.

Flag current product messaging that uses:

- Legacy names: "GitHub Copilot harness", "GHCP harness", or "GitHub Copilot SDK".
- A capitalized descriptor: "Microsoft Copilot Harness".
- Hyphenation: "Copilot-harness".
- Abbreviated Microsoft: "MS Copilot harness".
- Stacked names: "Copilot harness SDK".
- Invented acronyms for the brand, such as "MCH".

Suggest the correct full or subsequent-mention name using B1 and B2.
Source: slides 3, 4, 7, and 8.

## B4: Use approved logos without inventing a mark

There is no separate harness or SDK logo. Use an approved **Microsoft Copilot**
logo where Microsoft context is not set, or an approved **Copilot** logo where
that context is already established.

Set harness and SDK in standard text next to or below the logo, never as a
new lockup with the icon or wordmark. Do not add text to the logo, invent a
harness icon, recolor the logo, or otherwise modify it. Maintain at least
**3:1 contrast**. New lockups come only from Microsoft Brand Studio (GitHub
Brand Studio for GitHub surfaces).

Inspect referenced article images and diagrams when visual access is available.
Quote an image's Markdown reference and identify the visible problem. Suggest
replacing a noncompliant mark with an approved logo and separate plain text.
Do not infer logo approval, color, or contrast from a filename or alt text.
If the asset cannot be inspected or approval cannot be established, report
the specific visual check as **unverified**, with an action for the author;
do not claim a confirmed violation or a visual pass.

Source: slides 6-8, including slide 6 speaker notes.

Approved resources from the deck:

- [Brand Central](https://aka.ms/CopilotIdentity)
- [Microsoft Copilot logos](https://aka.ms/MSCopilotLogo)
- [Logo guidance](https://aka.ms/CopilotLogoGuidance)
- [GitHub Brand Toolkit](https://brand.github.com)

## Review boundaries

Apply these rules to messaging about this harness and its SDK, not every use
of "Copilot" or "SDK". GitHub Copilot remains a distinct product name.
Do not rename other SDKs, such as the Microsoft 365 Agents SDK or the
Copilot Studio client SDK, based only on a matching word.

Preserve executable code, package names, commands, API identifiers, URLs,
file paths, and machine-readable taxonomy. For example, the blog's
`agent_edition: github-copilot` remains valid; change authored display text,
not the field value. Prose and comments explaining code still need review.

Clearly identified historical names and exact quotations can remain when
needed for accuracy. If a legacy name could be mistaken for the current
name, suggest a brief clarification using the current name rather than
rewriting a quotation or breaking a working command. Screenshots of actual
product UI may preserve historical labels; distinguish those from authored
marketing graphics and flag a need for explanatory context where appropriate.

These boundaries are review safeguards, not additional naming rules from
the deck. Do not expand an article PR into a site-wide migration.

## Findings and corrective actions

For each confirmed violation, report the file and line (or image reference),
the exact problematic text or visible element, a linked B1-B4 rule and source
slide, why the rule applies, and a concrete replacement or editing action.
Group repeated instances of the same issue, listing affected locations.
Separate confirmed violations from unverified visual checks.

Report all distinct branding violations, even if the editorial review's top
5-7 issues are already filled. Do not mark the article **ready to publish**
while confirmed branding violations or required visual checks remain
unresolved. Apply changes only with the user's approval.

## Review examples

| Input and context | Expected review result |
| --- | --- |
| First mention: "Build with the Copilot harness." | B2: introduce "Microsoft Copilot harness". |
| Title introduces "Microsoft Copilot harness"; body uses "Copilot harness". | Accept the subsequent mention. |
| Article introduces the harness, then first mentions "Copilot SDK". | B2: introduce "Microsoft Copilot SDK" separately. |
| "Install the Microsoft Copilot SDK" in SDK access instructions. | Accept the SDK name; do not change it to harness. |
| "Microsoft Copilot Harness" in an authored heading. | B3: lowercase "harness". |
| "Copilot Studio is built on the GitHub Copilot SDK." | B1 and B3: use "Microsoft Copilot harness" on first mention. |
| A working URL, package identifier, or `agent_edition: github-copilot`. | Preserve the literal identifier. |
| A reference to GitHub Copilot as the coding assistant. | Accept the distinct product name. |
| "Previously called GitHub Copilot harness, the Microsoft Copilot harness ..." | Accept the explicitly historical name. |
| Authored artwork combines a Copilot logo with "harness" as a new lockup. | B4: use an approved logo and separate standard text. |
| Image is referenced but unavailable for inspection. | Report an unverified visual check and request the asset; do not invent a finding. |
