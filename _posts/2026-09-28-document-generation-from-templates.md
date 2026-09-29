---
layout: post
agent_edition: github-copilot
title: "The Template Changed. Your Documents Didn't."
date: 2026-09-28
categories: [copilot-studio, automation]
tags: [copilot-studio, skills, docx, power-automate, sharepoint, agent-development, document-generation, best-practices]
description: "Designing a Copilot Studio Skill that fills a new Word template from an existing document: runtime field discovery, a standard-library helper that keeps the .docx package intact, and a verification step that checks what was actually stored."
author: ssivaraman
image:
  path: /assets/posts/document-generation-from-templates/header.png
  alt: "The agent reads the words and hands over a small field map. A dashed barrier marked no file crosses here separates it from the helper, which opens the Word package, fills the blanks and verifies the stored bytes."
  no_bg: true
---

Someone publishes a new document template. It's better than the old one, everyone agrees, and then the obvious question lands: what about the several thousand documents already sitting in SharePoint in the old layout?

You've probably been in that meeting. It sounds like copy-and-paste until you open the first document. Someone has to decide, for every single one, which old text belongs under which new heading, what the old document simply never said, and which parts of the new template are notes to the author that have to come out before anyone sees it.

![An existing document beside the new, empty template. One field is stated in the source, one is not, and the template carries notes for the author that must be removed.](/assets/posts/document-generation-from-templates/01-old-document-new-template.png){: .shadow w="1200" }
_The source on the left, the new template on the right. "Role Title" is stated in the source. "Delegated Authority" never is. And those notes to the author have to go._

This post walks through the design of a Copilot Studio Skill that does that job, and through the decisions that turned out to matter. It is a design walkthrough rather than a package you can install: the code below is real, but it's here to show the shape of the thing, not to be cloned.

Very little of it is about prompting. Most of the difficulty is in what happens when a language model gets near a binary file.

> This describes a working prototype, not a production system. The last section is a proposed next step and says so. Two things in between carry their own warnings where they appear: the file-transfer bridge between the sandbox and SharePoint, which works but leans on undocumented behaviour, and the in-place replacement of live documents, which needs a review gate before you'd run it for real.
{: .prompt-info }

## Start with what one conversion produces

Before any of the machinery, here's the whole outcome, because it's easy to lose sight of it later.

A user asks the agent to convert one document into the current template:

```text
Convert this document into the current template:
/sites/example/Documents/Roles/Role.pdf
```

Three things come back.

**One.** The completed document sits in the same folder under the same name, now in the new template, with the template's author notes removed and the source's wording copied across unchanged.

**Two.** The version it replaced is in an archive folder, named with its own last-modified time, so the previous state is recoverable.

**Three.** A report saying exactly what happened, including the fields nobody was able to fill:

<details>
<summary>The run report for one conversion</summary>

<pre><code>{
  "contractVersion": 1,
  "sourcePath": "/sites/example/Documents/Roles/Role.pdf",
  "status": "OK",
  "reason": "",
  "outputs": [
    {
      "template": "Role Description Template.docx",
      "destinationFolderPath": "/sites/example/Documents/Roles",
      "outputFileName": "Role.docx",
      "bytesSent": 56104,
      "bytesStored": 56340,
      "missingFields": ["Delegated Authority"],
      "removed": [],
      "highlightCleared": 4,
      "markedGenerated": true,
      "archivedAs": "Role (20260910-071831).pdf"
    }
  ],
  "rollback": { "attempted": false, "status": "not-needed", "details": [] },
  "notes": ""
}
</code></pre>

</details>

That `missingFields` array is why the report exists. The document is not presented as finished. It's presented with a list of what a person still has to supply, because `Delegated Authority` was never stated in the source and the agent is forbidden from inventing it.

> **One thing to change before you run this in production.** Notice that the replacement happens in place, in the live folder, even when `missingFields` is non-empty. The prototype relies on the archive for recoverability and on the report for honesty, and it marks each output with a generated-content column so machine-written files can be filtered.
>
> None of that stops someone opening an incomplete document and treating it as approved. Archiving protects you from losing the old version; it does nothing to prevent premature use of the new one. If you build this for real, either stage outputs somewhere that isn't the working library until a reviewer clears them, or put a draft or approval state on the library so a document with unfilled fields cannot be mistaken for a finished one.
{: .prompt-warning }

Everything below is about making those three outputs trustworthy.

## Keep the file out of the conversation

A command-line helper reads and writes the Word files on disk and returns one small JSON object. The model works with extracted source text and a JSON field map, never the document's binary payload.

Document content still reaches the model, because mapping text to fields is exactly the judgment we want it to make. The file itself is never emitted through a model message.

![A pipeline of seven steps. The agent performs two of them: mapping source text to fields, and choosing what to remove. Code performs the other five.](/assets/posts/document-generation-from-templates/02-judgment-and-mechanics.png){: .shadow w="1200" }
_Seven steps, two colors. Orange is the agent. Blue is code. Notice how few of the steps are orange._

Two of those seven steps need judgment. The other five are mechanical, deterministic, and testable. That split is the design.

The helper's contract is strict enough to be worth copying:

> Every subcommand prints exactly **one** JSON object to stdout and nothing else, so the caller branches on data rather than parsing prose.

An agent that has to read English to find out whether a step worked will eventually read it wrong. An agent that reads `{"status": "OK", "package_valid": true}` has a much better chance. Structured output doesn't make interpretation infallible, but it makes deterministic validation possible, which prose never does.

Exit codes carry the same discipline: `0` for success, `2` for a usage or input error, and `4` reserved specifically for an upload that failed or stored the wrong number of bytes. Byte mismatch gets its own code, separate from generic failure, so the caller can tell an upload or byte-verification failure from a bad input.

If Skills are new to you, the [Skills overview](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/skills-overview) covers what they are, and [Roel's walkthrough of how Skills work in Copilot Studio]({% post_url 2026-06-15-modern-mcs-agent-skills %}) covers the mechanics of packaging instructions and scripts together.

## Make it reliable

### Discover the fields at runtime. Never cache them.

This is the rule that lets the whole thing survive the next template change:

> Never assume or cache a field list. Copy each key exactly, including punctuation, spaces, and `#2` suffixes. A renamed or removed heading is normal template evolution; never recreate it from memory.

The agent runs `inspect` against the actual template file on every run:

```bash
python scripts/doc_tools.py inspect --docx "<template.docx>"
```

and gets back the template's own fields: content-control and {% raw %}`{{token}}`{% endraw %} keys, plain blanks named by the label beside them, which label was paired with each blank, alternative variants, and a paragraph-level outline with style and highlight state.

Field additions, removals, renames, reordered sections and new variants therefore need no code change. Each run produces a fresh contract from the template as it currently is. Python only needs touching when a template introduces a Word structure that `inspect` cannot discover.

The `#2` suffix exists because templates repeat fields, often putting the title in both a header block and a signature block. The helper does not collapse them. It reports `Role Title` and `Role Title#2` as separate keys, and both must be filled.

Real templates mark their blanks in at least three different ways, because real people built them over years.

![Three panels. A content control, whose name lives in the w:tag or w:alias attribute. A token, which is literal double-brace text in the paragraph. And a labelled blank, an empty run named by the label beside it, where inspection reports which label it paired with.](/assets/posts/document-generation-from-templates/07-three-kinds-of-blank.png){: .shadow w="1200" }
_The third case is the one that decides whether this works on templates you did not design._

Content controls and tokens carry their own names. Labelled blanks do not, so the helper pairs each one with the nearest preceding label and reports which label it chose, which is what makes a wrong pairing visible instead of silent.

<details>
<summary>How the .docx internals actually work (ZIP, XML, and the fill mechanics)</summary>

<p>A Word document is a ZIP archive. Inside are XML parts: <code>word/document.xml</code> holds the body, <code>word/header1.xml</code> and <code>word/footer1.xml</code> hold headers and footers, plus styles, numbering, relationships and embedded media. Microsoft documents the layout in <a href="https://learn.microsoft.com/en-us/office/open-xml/word/structure-of-a-wordprocessingml-document">Structure of a WordprocessingML document</a>. Change the XML, rezip, and you have a valid document. The <a href="{% post_url 2026-07-15-redlining-documents-new-copilot-studio-experience %}">Redlining post</a> walks the same territory from the tracked-changes angle, where <code>w:ins</code> and <code>w:del</code> carry the edits.</p>

<p>Only some parts are safe to fill. Everything else is carried through untouched:</p>

<pre><code>FILLABLE_PARTS = re.compile(
    r"^word/(document\.xml|header\d*\.xml|footer\d*\.xml)$"
)
</code></pre>

<p>You don't need <code>python-docx</code> for any of this. The helper prefers <code>lxml</code> when it's available and falls back to the standard library, so it runs in a sandbox with no package installs at all:</p>

<pre><code>try:
    from lxml import etree as ET
    LXML = True
except ImportError:
    import xml.etree.ElementTree as ET
    LXML = False
    ET.register_namespace("w", W)
</code></pre>

<p>Content controls are found by walking <code>w:sdt</code> elements and reading the name from <code>w:tag</code> or <code>w:alias</code>:</p>

<pre><code>def iter_sdt(root):
    """Yield (sdt, sdtContent, name) for every content control."""
    for sdt in root.iter(qn("w:sdt")):
        pr = sdt.find(qn("w:sdtPr"))
        content = sdt.find(qn("w:sdtContent"))
        if pr is None or content is None:
            continue
        name = None
        for probe in ("w:tag", "w:alias"):
            el = pr.find(qn(probe))
            if el is not None and el.get(qn("w:val")):
                name = el.get(qn("w:val"))
                break
        yield sdt, content, name
</code></pre>

<p><strong>Rewriting the archive is where this gets delicate.</strong> Unzip, edit, rezip can produce an archive Word refuses to open cleanly, and a repair dialog destroys any confidence your users had in the output. The approach that held up was to rewrite every entry rather than rebuild the archive, preserving each entry's original metadata and carrying through entries you don't recognise rather than dropping them:</p>

<pre><code>zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
zi.external_attr = info.external_attr
zi.create_system = info.create_system
zi.compress_type = zipfile.ZIP_DEFLATED
zi._compresslevel = level
zout.writestr(zi, data)
</code></pre>

<p>These are defensive measures taken against real templates, not a proven universal cure for malformed OOXML. That last line is a genuine Python trap, though: passing a <code>ZipInfo</code> makes <code>writestr</code> ignore the <code>ZipFile</code>-level <code>compresslevel</code>, because <code>ZipInfo._compresslevel</code> defaults to <code>None</code> and wins. Without it, level 1 and level 9 produce byte-identical output. If you're tuning compression and your output size never moves, that's why.</p>

<p><strong>One encoding trap, on Windows.</strong> The helper prints JSON with <code>ensure_ascii=True</code> deliberately. Real templates carry curly quotes, en dashes and non-breaking spaces, and stdout on Windows defaults to cp1252, so with <code>ensure_ascii=False</code> those characters go out as cp1252 bytes and a caller decoding as UTF-8 cannot parse the result. Escaping sidesteps the console encoding entirely.</p>

</details>

### Two checks that answer different questions

The fill step asserts its own success. The agent must see `status: OK`, `package_valid: true`, and `fields_unmatched: []` before going further.

`fields_unmatched: []` means every key *you supplied* found a destination. It says nothing about whether you supplied every field the template asked for:

| Check | Question it answers |
|---|---|
| `fields_unmatched: []` | Did everything I sent land somewhere? |
| `missingFields` in the run report | Which template fields did nobody fill? |

The first catches a typo in your map. The second is the list a human works through. Conflating them is how a document ships with a blank nobody noticed.

### What the agent may and may not do

We specified the agent as a transcription and packaging system, not an editor. In practice that means:

- Copy source wording. Don't paraphrase, summarize, improve style, localize spelling, or add synonyms.
- Fill a heading only with content that belongs under that heading.
- If the source doesn't state it, write exactly `Not provided`.
- Never silently infer reporting line, business unit, grade, location, salary, approvals, or duties.
- If a value is safely deduced, mark it `(inferred; reason)`.

The agent's entire output is a small JSON map:

```json
{
  "Role Title": "Project Officer",
  "Key Accountabilities": "First source item\nSecond source item",
  "Role Title#2": "Project Officer",
  "Delegated Authority": "Not provided"
}
```

#### The renamed-heading trap

The old document says "Key Accountabilities". The new template says "Responsibilities". It's tempting to let the model decide those mean the same thing, and it would usually be right.

The prototype doesn't allow it, so "Responsibilities" comes back as `Not provided` and a person decides. Compare the two failure modes: a visible gap gets noticed and filled, while a plausible-looking mistake gets signed off. When the output is a document about someone's job, a confident wrong answer costs more than a blank.

That conservatism has a real cost. On a template where many headings were renamed, this leaves much of the migration unsolved and pushes the work back to reviewers. The honest resolution is a reviewer-approved alias map, decided once per template rather than once per document, so "Key Accountabilities becomes Responsibilities" is a human decision applied mechanically. Until that exists, this is transcription into matching fields, not a general migration.

The same logic governs **variants**, where a template offers alternative clauses. If the source doesn't settle which applies, keep both, and keep the sentence telling the reviewer how to choose.

### Removing the author's notes

Templates ship with scaffolding: instruction blocks, highlighted blanks, "delete this section if not applicable" notes. Removal is expressed as data, not as an edit:

```json
{
  "protect": ["Select the statement that applies and delete the other."],
  "remove": [
    {
      "match": "Notes for the author",
      "scope": "block",
      "until": "Role Title",
      "why": "template instruction block"
    }
  ]
}
```

Every removal copies the exact paragraph text and gives a reason a reviewer can check. `prune` refuses any removal that matches or spans a protected paragraph. Scopes are `paragraph`, `table` and `block`, and every block removal must name its `until` boundary, because a wrong boundary can delete valid content while still producing a structurally valid DOCX. A valid package is not the same as a correct document, which is why `prune` reports every boundary it hit instead of simply succeeding.

## Make it automatic

### The helper never uploads anything

This is the step it would be easy to hand-wave, so: the helper has no network access and no SharePoint credentials. It generates files into a writable directory and prints their absolute paths. The orchestrating flow's authenticated SharePoint connector moves the bytes.

The handoff is a configured binding rather than anything clever. The helper works in semantic keys, and configuration maps each one onto a parameter of the stock SharePoint **Create file** action: the destination folder and output filename come from the plan, overwrite is set once the current file has been archived, and the helper's `contentPath` is mapped onto the action's `body` parameter.

That last mapping is where the design is thinnest.

The helper prints a bare absolute filesystem path, something like `/app/created/output.docx`, with no `@`, no URI scheme, no quotes, no base64. But `body` on the [SharePoint Create file action](https://learn.microsoft.com/en-us/connectors/sharepointonline/#create-file) is documented as *File Content*, binary. A path string is not binary file content.

So something between the sandbox and the connector has to turn that path into bytes. In this prototype that dereferencing is done by the agent runtime as it passes the generated file to the connector, and it is not documented behaviour of the stock connector.

> **Do not assume a runtime file path will be dereferenced into binary content** by a connector that expects file content. Verify the bridge explicitly rather than inferring it from a success response: if the stored size equals the character count of the path, the path text was stored instead of the file, and nothing will have thrown.
>
> Prove the file-transfer bridge before you build on it, and prefer passing real binary content over relying on a path being resolved for you.
{: .prompt-warning }

### What a size check can tell you

HTTP `200` is not verification. So after the upload, the flow reads the stored size from SharePoint and passes it back to the helper, which compares it against the file it generated:

```bash
python scripts/doc_tools.py verify \
  --file "<local output.docx>" \
  --expect-bytes "<SharePoint stored size>"
```

The helper has no network access, so it cannot fetch that number; the flow supplies it. The helper only judges it, and the verdict is not a boolean:

| Stored result | Verdict |
|---|---|
| Equals content-path character count | `FAIL` — path stored instead of content |
| Smaller than sent | `FAIL` — investigate before proceeding |
| Increase from 0 through the configured threshold | `PASS` — within accepted ingestion overhead |
| Increase beyond the threshold | `CHECK` — download and compare before claiming success |

A tolerance exists at all because SharePoint can legitimately rewrite a document on ingestion, writing list column values back into document properties, so a file may arrive slightly larger than it left and still be correct. The allowance is a configured threshold, and the 56,104 → 56,340 in the report above is a 236-byte increase that sits inside it. Pick that threshold deliberately: it is a heuristic, not a derived constant, and the run report records the delta without establishing what caused it. A plausible mechanism is not a demonstrated cause.

> `PASS` means the size is unsurprising, not that the document is correct. `CHECK` is not success, it's an instruction to go and look. Even `FAIL — smaller than sent` is an observation rather than a diagnosis; truncation is the usual cause, but it is not the only thing that can shrink a package.
>
> Size is a cheap, fast sanity check standing between you and silently shipping a broken file. It is not delivery verification. Where integrity genuinely matters, as in the archive step, the rule is an exact match from the same hash algorithm before and after, falling back to exact size only when no hash is available. If you need proof rather than reassurance, hash both sides.
{: .prompt-warning }

Ordering matters too. Every requested output is generated and validated *before* anything in the library changes, and the document being replaced is archived first. If a step fails after the first write, the run attempts to undo the replacements it made and reports whether that succeeded, which is why `rollback` is a reported object with its own status rather than an assumption.

Failure reasons are a closed vocabulary rather than free text, so the flow can branch on them: `byte-mismatch`, `path-not-dereferenced`, `template-no-fields`, `no-text-extracted`, `invalid-package`, `deployment-failed-rolled-back`, and a dozen more.

## Handle repeated work

Everything so far converts one document. Running it across a library needs one more idea.

Each converted document carries a stamp recording the template version it was built from. The template file carries the current version in a column. A scheduled flow compares the two.

![A workflow reads the template version, lists the documents whose stamp differs, and calls the agent once per document. Verified documents are stamped. After the loop the workflow checks the library again and reports the run.](/assets/posts/document-generation-from-templates/03-the-stamp-is-the-memory.png){: .shadow w="1200" }
_The stamp is the memory. No separate tracking table, no state to keep in sync._

The flow filters the library for documents whose stamp doesn't match the current revision:

```text
ConvertedWithTemplate ne 'v=<revision>'
```

That makes a failed batch cheap to retry. The loop continues after a failure or timeout; afterwards the flow lists documents still lacking the current stamp, reports failure if any remain, and leaves them due next time. The ones that succeeded are skipped. The stamp has to be written back exactly as it was given, because both ways of getting it wrong are bad:

> Without that stamp the flow reconverts the same document on every run; with a different string it reconverts forever.

### What the stamp does not give you

That is not restart safety, and the gaps matter before you build on it.

**There's a window between upload and stamp.** If the upload succeeds and the run times out before the column is written, the document is correct in the library but still looks due, and the next run converts it again. Surviving that needs an idempotent destination, not just a flag.

**Loop concurrency is not run concurrency.** Setting an *Apply to each* loop to 1 limits parallelism *inside* one run. It does nothing to stop two triggered runs overlapping and both picking up the same unstamped document. That's a separate setting, on the trigger, and it's off by default. Microsoft documents them as distinct controls in [concurrency, looping, and debatching limits](https://learn.microsoft.com/en-us/power-automate/limits-and-config).

**The stamp records the template version, not the source version.** A document whose source was edited after conversion still carries a current-looking stamp.

**Archive plus compensating actions is not a transaction.** Archiving before overwriting and attempting rollback on failure is a real improvement over doing neither. It is not proof that an interrupted run always restores cleanly.

None of this makes the stamp a bad idea. It makes it completion metadata that happens to be an excellent scheduling filter.

Concurrency is deliberately set to 1 anyway, because the archive → upload → verify → stamp sequence hasn't been proven safe to run in parallel against one library. The SharePoint connector also permits 600 calls per connection per 60 seconds ([SharePoint connector](https://learn.microsoft.com/en-us/connectors/sharepointonline/)). Petros has catalogued the other ways flows and agents surprise you in [Combining Agent Flows with Agents]({% post_url 2026-04-17-combining-agent-flows-and-agents-gotchas-errors-and-patterns %}).

## Trade-offs, honestly

- **Validate extraction before reuse.** Check extracted fields against the source before treating them as complete. Only validated field data should be stored for regeneration; otherwise, omissions propagate into every subsequent document.
- **Only body, headers and footers are fillable.** If an inspected field lives elsewhere in the package, omit it from the map and report it as unfilled with the reason, instead of dropping it quietly.
- **Renamed headings are unsolved** without the reviewer-approved alias map described above.
- **Scanned sources need OCR, and OCR degrades quietly.** Rough or truncated text lowers confidence; it does not license guessing.
- **One at a time is slow.** Parallelism only helps once each conversion is short and safe.
- **Template classification is guesswork when filenames are unhelpful.** There is no universal naming rule, so the helper classifies from filename evidence plus inspected fields, records the evidence, and stops with a named error when the answer is genuinely ambiguous.

## Where this goes next

![Once per document, the agent reads and maps, a person resolves what is marked, and the result is kept as stored field data. On every template change, code regenerates each document with no agent call.](/assets/posts/document-generation-from-templates/06-pay-for-understanding-once.png){: .shadow w="1200" }
_Read once, place many times. The agent appears in the top row and then gets out of the way._

> This section is a proposed architecture. It has not been built or measured.
{: .prompt-warning }

The design above calls the agent once per document per template change. But a template change doesn't change what the source document *says*. The role is the same role.

So there's a stronger version: keep the field map the agent produced the first time, and on the next template change let code regenerate from stored data with no agent call at all. Only genuinely new questions need the agent again: a field the template never asked for before, or a source document that was edited. A renamed field becomes a decision a person makes once for the whole library.

Two things would have to be true first. Extraction coverage must be validated for the document structures you support before stored field data can be safely reused. And the stored data needs a home restricted at least as tightly as the source documents, since it holds the same content.

The instinct is the same one behind the rest of the design: work out which part needs judgment, spend the model there, and let ordinary deterministic code do everything else and prove that it did.

---

If you've built something similar, I'd like to know where you drew the line. Did you let the model touch the file directly, or keep it behind a helper like this? And has anyone found a clean way to handle labelled blanks in templates they didn't design? Let me know in the comments.
