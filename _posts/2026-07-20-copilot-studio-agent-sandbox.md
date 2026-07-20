---
layout: post
title: "Your Agent Has a Computer Now: A Look at the Copilot Studio Agent Sandbox"
date: 2026-07-20
categories: [copilot-studio, agents]
tags: [copilot-studio, skills, agent-sandbox, code-execution, python, agent-development]
description: "What the modern Copilot Studio agent sandbox is, what Python libraries come with it, why it can't reach the internet, and when to let the agent write code versus run a script you packaged yourself."
author: chrisgarty
image:
  path: /assets/posts/copilot-studio-agent-sandbox/header.png
  alt: A small, tidy container wedged inside an agent, quietly doing the math.
  no_bg: true
published: false
---

If you read our post about how [Modern Agents Have Skills Now]({% post_url 2026-06-15-modern-mcs-agent-skills %}), you know a Skill is a bundle of instructions the agent uses when a task calls for it. That Skill can provide its own scripts or make use of any capability available to the agent. That raises a question: when the agent runs one of those scripts, where does it run and what is available to it?

The Skill and its script run in the agent's sandbox and it's worth a few minutes to understand what that is, because the answer changes what you can build.

## So what is the sandbox?

The sandbox is a small container with a Python runtime and a set of shell tools. Every agent in the [modern Copilot Studio experience](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/overview) gets one, it's on by default, and it's thrown away when the run ends. Think of it as a scratch computer the agent can use for work that reasoning alone can't finish: read a file, do the math, build a spreadsheet, draw a chart. When the conversation is over, the container and everything the agent wrote in it are gone. Nothing carries over to the next run, which is a useful property when you remember that any file the agent creates lives inside those walls and only those walls.

People sometimes use "harness" and "sandbox" as if they mean the same thing but they don't. The harness is the workshop, the interpreter, libraries and tools the agent works with. The sandbox is the walls around it, the container that keeps that work isolated. The two are complementary, and both matter to the rest of this discussion, but for the sake of readability we'll just say sandbox and mean the whole box.

## Why should you care about the sandbox? 

That depends on who you are:

- If you're **using** an agent, the loop can now finish jobs instead of describing them. Ask for a summary table from a messy CSV and you get the table back, not a recipe for making it yourself. The range of problems an agent can actually close out, rather than talk about, gets a lot wider once it has somewhere to do the work.
- If you're a **maker**, you got a large toolbox for free. A lot of scenarios that used to need a connector, an API, and a bad afternoon are now a few lines of Python the agent writes on the spot, or a script you package once and reuse. You spend less time plumbing and more time on the part of the problem that's actually yours.
- If you're an **admin**, the word to notice is "isolated." Code runs in a throwaway container with no open door to the internet, and it disappears at the end of the run. That's a comfortable place to start, and it also raises some fair questions about libraries, governance, and lifecycle that we'll come back to.

## What's in the sandbox

The sandbox ships with close to a hundred Python libraries already installed. That number sounds abstract until you group them by the kind of work they do:

- **Documents:** python-docx, python-pptx, openpyxl, and pypdf for reading and writing Office files and PDFs.
- **Data:** pandas and numpy for tables and numbers, with pyarrow underneath.
- **Charts:** matplotlib, plotly, and seaborn for turning those numbers into something a person can read.
- **Files and images:** Pillow and OpenCV for image work, plus OCR for pulling text out of a scan.
- **Web and parsing:** BeautifulSoup and lxml for HTML and XML that arrives as content rather than a live fetch.
- **Everyday utilities:** the usual date, math, and text-handling libraries, plus tools for validating and reshaping data.

Alongside the libraries are the ordinary shell tools you'd expect on a machine like this. The agent can create a file, run a command, read the output, and decide what to do next, all in the same container for the length of the conversation. This is the part that's easy to underrate. The agent isn't limited to one clever function call. It works the way you would at a terminal: try something, look at the result, adjust, and try again. That read-run-read loop is where a lot of the new capability actually comes from, because the agent can react to what its own code produced instead of guessing.

> These libraries are preinstalled today. The exact list and versions will change over time. You can check the current list using the agent-harness-explorer that is described below.
{: .prompt-info }

## The sandbox doesn't call home

Here's the part admins ask about first. The sandbox has no outbound internet. The agent can run all the code it likes in there, but it can't reach out to some API on its own. Anything that touches the outside world goes through [Tools and Skills](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview) and Knowledge instead, which is exactly where your governance already lives. That routing is the point. It means the code running in the sandbox and the connections leaving your tenant are two separate concerns, and your DLP and connector policies keep applying to the second one no matter what the first one gets up to.

A small thing that trips people up: a networking library being installed is not the same as the agent being allowed to use it. `requests` is sitting right there in the list, because pulling it out would break half the other libraries that depend on it. It still can't order lunch. The library is a capability. The wall decides whether anything actually leaves, and by default nothing does.

Pair that with the throwaway nature of the container and you get a fairly calm security story. Code runs in a space with no inbound path, no outbound path, and no memory of the last conversation. It's a workshop with no windows and no mailbox, which is a strange thing to want in an office and a very sensible thing to want around code an agent wrote thirty seconds ago.

## Live code, or a script you packed yourself

There are two ways code ends up running in the sandbox, and knowing which one you want is most of the job.

The first is the agent writing code on the fly. You ask, it reasons, it writes a bit of Python, and it runs it right there. This is what you want when the task is a one-off, or when you can't predict its shape in advance. Parse this oddly formatted export. Reconcile these two lists. Chart whatever ends up in this file. The agent adapts to the specifics in front of it, which is the whole appeal, and it also means the code will be a little different every time. That's fine when the job is exploratory. It's less fine when someone downstream needs the same answer twice.

The second is a script you wrote, reviewed, and packed into a Skill. Same runtime, same libraries, but now the code is fixed. You get the same steps in the same order on every run, which is exactly what you want when the work is repeatable and somebody needs to trust the output. A packaged script is something you can read, test, version, and sign off on, the way you would any other code your team ships. The agent still decides when to reach for it, but it can't quietly rewrite what's inside.

The rough rule: if the work is novel, let the agent improvise. If it's repeatable and has to be predictable, hand it a script. In practice most real agents do both, improvising around the edges and leaning on packaged scripts for the parts that matter. That's the tie back to our earlier post on Skills. A Skill is how you package the script and the capabilities it needs. The sandbox is where it runs.

## Where the edges are

Once you accept that your agent has a computer, a few honest questions follow, and it's better to name them than to pretend the box is magic.

**Libraries move.** The preinstalled set is a snapshot, and snapshots change between releases. A version bump can shift behavior, and a library you relied on today might be organized differently tomorrow. If a script depends on a specific library doing a specific thing, treat that like any other dependency and test it when the platform updates, rather than assuming the floor stays put.

**Not every capability is yours to reach for.** The presence of a library tells you what's technically available, not what your organization wants agents doing. That's a governance conversation, and it's a good one to have early. The isolation model gives admins a strong default, and the routing through Tools and Knowledge gives them the place to draw lines, but somebody still has to decide where those lines go.

**Skills travel, and travel needs a plan.** A packaged Skill is an asset that has to move between environments the same way the rest of your solution does. As you lean on scripts for the dependable work, you inherit the ordinary lifecycle questions that come with any code: how it's reviewed, how it's promoted from a test environment to production, and how you keep the version running in front of customers matching the one you actually approved.

None of these are reasons to hold back. They're the reasons to treat sandbox-backed agents as software, which is what they are, rather than as a chat box that happens to be clever.

## What this actually gets you

A few examples from conversations we keep having with customers.

A document-generation agent, the kind that turns a pile of data into a formatted report. With python-docx and python-pptx already sitting in the box, that's a normal Tuesday, not a research project. The agent assembles the document in the sandbox and hands back the finished file.

A content-review agent that reads submitted PDFs or web content, pulls out the text, checks it against a set of rules, and flags the problems. pdfplumber, BeautifulSoup, and pandas cover most of it before you write a single custom tool, and the parts specific to your rules are exactly the parts worth packaging into a script.

An analysis agent that takes a messy spreadsheet, cleans it with pandas, works out the numbers, and returns a chart from matplotlib alongside a short written read of what the numbers say. That combination, compute plus narrative, is awkward to do with connectors alone and natural when the agent has a place to run code.

The point isn't that any one of these is clever. It's that you can look a customer in the eye and say "yes, that's doable, and here's roughly how," instead of hoping it is.

## "How do I know which libraries are in the sandbox?"

You look, because guessing wrong costs you an afternoon and the list changes between releases. Rather than trust a doc that may already be stale, we built a small Skill for exactly this, the agent-harness-explorer, that inspects the running sandbox and writes down what it actually finds.

It works the way a good auditor would. It captures a snapshot of the live environment, checks the installed Python libraries against a curated catalog so it can name and group them, enumerates the tools and Skills the agent can see, and renders the whole thing as a single self-contained HTML report you can open in a browser or hand to a colleague. Run it again next week and it will compare the two snapshots and tell you what was added, removed, or bumped to a new version. Its guiding rule is "observe, don't assume," so it reports what it saw rather than what the platform is supposed to do, and it leaves anything it couldn't confirm marked as unverified instead of guessing.

The latest report, from a live Copilot Studio agent on 2026-07-20, is a decent picture of the box we've been describing. It found **Python 3.12.9** running in a **container**, with **97 Python libraries** installed, grouped into the same kinds of buckets used earlier: documents, data, images, web parsing, visualization, and the rest. It also listed **11 built-in tools**, including the shell family (`bash` and its `list_bash`, `read_bash`, and `stop_bash` companions) and the file tools (`create`, `edit`, `view`, `glob`, `grep`) the agent uses to work inside the container, plus **8 Skills** and **no MCP servers** wired up in that particular agent. Tellingly, the report left filesystem-write and outbound-HTTPS checks marked unverified, because it stays passive by default and doesn't go poking at the walls. That gap is the network isolation showing up in the data rather than just in the marketing.

None of this is the point of the post, but it's a useful footnote: when someone asks whether a library is there, you don't have to argue about it. You can look.

## Where this leaves us

The short version: your agent has a computer now. It's a boring, network-isolated container with a decent set of Python libraries and no way to phone home, and that combination is most of why the new agents can do so much more than talk. For users, it means the loop can finish the job. For makers, it's a large toolbox that ships in the base. For admins, it's a contained, ephemeral space with the outside world routed through the controls you already run. If you want the background on packaging code for it, start with [Skills for Copilot Studio]({% post_url 2026-03-10-skills-for-copilot-studio %}).

So here's the question we'll leave you with. If you had a throwaway container and a stocked Python install sitting inside your agent, what's the first job you'd hand it?
