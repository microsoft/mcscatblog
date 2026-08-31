---
layout: post
agent_edition: both
title: "Work IQ: The Context Layer You Already Have"
date: 2026-08-24 09:00:00 +0200
categories: [copilot-studio, work-iq]
tags: [copilot-studio, microsoft-365-copilot, mcp, governance, licensing, declarative-agents, authentication, agent-365]
description: "What Work IQ is, where its data lives, the main ways to reach it, and the constraints that decide whether what you build holds up in a real tenant."
author: asfjordhoj
image:
  path: /assets/posts/work-iq-context-layer-you-already-have/door4-renewal-risk-board.gif
  alt: A renewal risk board grounded in CRM records and Microsoft 365 evidence
---

Ask an agent a question that depends on knowing your organization, and watch what it does.

> *What is the most important thing for me to do today?*

An agent with access to your mailbox and nothing else answers confidently, and naively. It sees a message flagged high importance from someone outside your company and promotes it to the top. The flag was set by the sender, and the agent has no way of knowing that sender is a small account you speak to twice a year.

Now give the same agent your work context. It sees a three-line note from your skip-level manager, sent this morning, no flag, about a deal that appears twice in your calendar this week. It ranks that first, not because the message looked urgent, but because it knows who that person is to you, what you are spending your week on, and which thread this belongs to.

Nothing changed about the model. What changed is that the second agent knew where it was standing.

That difference is Work IQ: what it actually is, where its data lives, the main ways to reach it, and the constraints that decide whether what you build holds up in a real tenant.

## What Work IQ is

Work IQ is not a product you buy. It is the [workplace intelligence layer](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq) that continuously builds a semantic understanding across Microsoft 365 and external systems, with permission-aware governance built in. It reasons over mail, meetings and calendar, OneDrive and SharePoint documents, Teams messages, Planner plans, enterprise search results, and the people and org context tying them together.

### Where the data actually lives

This is the question that arrives ninety seconds into every architecture conversation, and the answer is more reassuring than people expect: **Work IQ is not another store that copies your Microsoft 365 content.**

It reasons over content already in Microsoft 365, where you already govern it. Your mail is still in the mailbox, your documents still in SharePoint and OneDrive. On top of that sits the semantic index, which makes content searchable by meaning rather than keyword. External connector data and agent working data follow the separate paths below.

External data reaches it two ways, and the difference matters:

- **Copilot connectors** ingest external content into Microsoft Graph, so it joins the indexed picture alongside your Microsoft 365 content.
- **Federated connectors** skip indexing entirely. They read the source in real time over MCP, making live or sensitive systems discoverable *without* their content ever entering the semantic index. If legal will not allow you to index a system, this is the mechanism to reach for.

Where an agent needs somewhere to put working notes, Work IQ provides [Workspaces](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq#workspaces): persistent storage on SharePoint Embedded, inside the tenant boundary, for intermediate results and handing work between agents.

> Work IQ operates within the Microsoft 365 trust boundary, and its data residency follows your Microsoft 365 tenant configuration rather than the region of whatever service you provisioned.
{: .prompt-info }

That last clause catches people out. Stand up an Azure AI Search service in one region, assume that decides residency, and you have it backwards.

### The Microsoft Graph question

If all of that sounds familiar, it should. Work IQ reasons over the same tenant data that Microsoft Graph exposes, and the resemblance is not accidental. Reach it over **Work IQ MCP** and you address resources by paths you already know:

```text
/me
/me/messages
/me/events
/search/query
```

Those paths belong to the MCP server's generic tools. The REST and A2A contracts are conversational: you ask them questions rather than address resources. Either way, think of Work IQ as reasoning that sits above the data Graph has always exposed rather than a separate store beside it. When you know exactly what you want, Graph is still the better instrument. Work IQ is for when you do not.

## Included underneath you, metered when you reach for it

Work IQ shows up in two ways, billed on completely different principles.

|  | **Work IQ as the layer** | **Work IQ as an API** |
| --- | --- | --- |
| How you get it | It is already underneath you | You explicitly call it |
| Where | Microsoft 365 Copilot, Word, Excel, PowerPoint, Teams, prebuilt agents like Researcher and Analyst | Your agent, your app, a third-party agent |
| Cost | No incremental charge for Microsoft 365 Copilot licensed users, subject to fair usage limits | Consumption-based |
| Auth | Implicit, in-product | Delegated Entra ID |

Microsoft's own licensing wording is very direct in this matter:

> Microsoft 365 Copilot is natively built on Work IQ and does not need to leverage Work IQ APIs. [...] The usage charges described above only apply to access to Work IQ using the Work IQ APIs.

Which reduces to one sentence:

> **The same intelligence is included when it is underneath you, and consumption-based when you reach for it.**
{: .prompt-tip }

Declarative agents built in Agent Builder or with [pro-code tooling](https://learn.microsoft.com/microsoft-365/copilot/extensibility/build-declarative-agents) inherit Work IQ natively from Microsoft 365 Copilot, so licensed users are not separately charged for that grounding. The boundary is how Work IQ is reached: if the same agent calls Work IQ through MCP, an API plugin or another custom tool, those calls use the Work IQ API and are consumption-based.

**Cowork sits across that line, and it catches people.** Work IQ is an underlying intelligence layer within Cowork, but Cowork itself is an agentic system on usage-based billing. An administrator has to [switch it on](https://learn.microsoft.com/microsoft-365/copilot/cowork/cowork-admin-governance) before anyone in the tenant can use it. Being underneath a surface describes how Work IQ reaches it, not whether that surface is included.

Two qualifiers stop that being a blank cheque. The inclusion is subject to **fair usage limits**, which Microsoft confirms exist, reserves the right to change, and has never published a number for. Anyone quoting a specific threshold is guessing. And it holds only where the agent operates **under the signed-in user's own identity**, a condition that returns further down.

> One wrinkle to resolve before scoping a project. The Work IQ overview states that API access is independent of Copilot licensing; the Agent 365 tooling documentation states a Copilot license is required for Work IQ MCP servers. Different surfaces, but no public page draws the boundary. If your plan depends on reaching Work IQ without Copilot licenses, confirm which one you are entitled to first.
{: .prompt-warning }

Which licenses put you on the included side is worth checking: Copilot is an add-on to a [wide range of base plans](https://learn.microsoft.com/microsoft-365/copilot/microsoft-365-copilot-licensing), including the frontline **F1 and F3** SKUs, and bundled outright in **Microsoft 365 E7**. Federated connectors are the exception, requiring a paid Copilot license. For the edge cases, [what E3 users can and cannot build]({% post_url 2026-07-09-e3-users-build-agents-turn-it-off %}) goes deeper.

## Four of the doors onto it

Work IQ is the floor. These four doors are ordered by how much you take on; door one has two build routes.

**Before them sits Copilot itself.** A licensed user can ask a work-grounded question without building or configuring anything. It is the broad starting point for the more specialized options.

| Door | What it is | Who it is for | How Work IQ arrives |
| --- | --- | --- | --- |
| **1a. Declarative agents, Agent Builder** | Guided instructions, knowledge and actions | Makers | Inherited from Microsoft 365 Copilot |
| **1b. Declarative agents, pro code** | Source-controlled manifests and developer tooling | Developers | Inherited from Microsoft 365 Copilot |
| **2. Cowork** | Microsoft's ready-made agent that carries out multi-step work | Users | Built in |
| **3. Copilot Studio agents** | You build the agent and [add Work IQ as a tool](https://learn.microsoft.com/microsoft-copilot-studio/use-work-iq) (preview) | Makers | Tools -> Add Tool -> MCP -> Work IQ |
| **4. Your own host** | Foundry, GitHub Copilot, or your own code calling [the Work IQ API](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/api-overview) | Developers and architects | A2A, [MCP](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/mcp/overview), or REST |

Door one has two routes. [Agent Builder and pro-code tooling](https://learn.microsoft.com/microsoft-365-copilot/extensibility/build-declarative-agents) both produce declarative agents: Copilot shaped for a purpose with tailored instructions, knowledge and actions. Agent Builder is guided; pro code gives developers source-controlled manifests. Both inherit Work IQ from Microsoft 365 Copilot, so the route changes how you build, not how it arrives.

Door four is less exotic than it sounds. You do not need a platform team to open it: once the tenant is enabled, a developer on their own laptop can add the Work IQ MCP server, point it at their tenant, and their agent has work context. Two more doors open here: Work IQ as a [Microsoft Foundry agent tool](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/work-iq) and an [Azure AI Search agentic knowledge source](https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-work-iq), both in preview, though the AI Search path is gated behind an approved access request and every end user needs their own Copilot license.

> Whatever the surface, you are calling a retrieval pipeline and should budget like it. The Azure AI Search integration recommends a runtime of at least 120 seconds, while the REST API warns that long-running requests can hit gateway timeouts. In our testing, the same question took 40 to 60 seconds one day and under 20 the next.
{: .prompt-warning }

## One scenario, four doors

Here is a single recognizable need, **preparing for a customer renewal conversation**, walked through all four doors. What changes between them is not really the technology.

**Before any door, Microsoft 365 Copilot.** The account manager asks Copilot what changed on the account. It reaches everything they can already see: the SharePoint documents, and the mail thread where a field engineer relayed what the customer actually wants. Nothing built, and no incremental consumption charge for this licensed interaction.

*What it is worth:* time saved for the account manager by using Copilot's built-in research across company knowledge about the account. *What it is not:* repeatable across the other forty account managers, who each ask differently and get something different.

**Door 1, the declarative agent.** You build a Renewal Prep agent in Agent Builder, grounded in the account team's SharePoint site, the renewal playbook and a handful of templates. Built in an afternoon by someone who is not a developer. *What it is worth:* forty account managers prepare the same way, guided by instructions and knowledge selected specifically for renewal preparation. The result is a focused, repeatable experience, and nobody wrote code.

**Door 2, Cowork.** The next step for the account manager goes beyond collecting information: they want the brief. Cowork, using Work IQ, compiles the account history, drafts the pre-meeting summary as a document, and proposes the follow-up mail. *What it is worth:* the output is the artifact, not a paragraph the human still has to turn into one. Nobody built anything: what unlocked it was a Copilot license and an administrator enabling usage-based billing, not a development project.

**Door 3, the Copilot Studio agent.** Renewals happen forty times a quarter and the process should not live in one person's habits. Now you want a defined flow, an approval before anything is sent, a CRM connector, and a named owner accountable for it. *What it is worth:* consistency and auditability, provably. Work IQ arrives here as an MCP tool, ready to be used by the agent.

**Door 4, your own host.** The account team lives in a CRM portal and will not switch tabs, so the capability has to be embedded there. The CRM holds the renewal record; Work IQ looks for evidence that contradicts it. *What it is worth:* it meets people where they already work, and other agents can call it. You also own the hard parts: authentication, residency across the whole chain, and every governance decision the earlier doors made for you.

### Door 4 in action

Eight renewal records start in the CRM view. The sweep asks Work IQ to look for customer evidence that conflicts with each record, then flags three contradictions. Opening Litware shows the CRM position beside the evidence returned from Microsoft 365.

![The renewal board scans eight CRM records, flags three contradictions and opens the supporting evidence for Litware Chemical.](/assets/posts/work-iq-context-layer-you-already-have/door4-renewal-risk-board.gif){: .shadow }
_The renewal risk board compares CRM records with evidence from Microsoft 365._

### From a local bridge to Azure

Our demo keeps the Work IQ token and A2A call in a local Node.js bridge rather than exposing either to the browser. That boundary is the right pattern; the local process and device-code sign-in are only its development form. In Azure, the same bridge becomes an authenticated backend on App Service, Container Apps or Functions. The browser signs the user in and sends an access token whose audience is our API, not an ID token or Graph token. The backend validates that token, exchanges it through the [on-behalf-of flow](https://learn.microsoft.com/entra/identity-platform/v2-oauth2-on-behalf-of-flow), and calls Work IQ as that user:

```javascript
async function findRenewalRisk({ confidentialClient, userApiToken, renewal }) {
  const workIqAuth = await confidentialClient.acquireTokenOnBehalfOf({
    oboAssertion: userApiToken,
    scopes: ["api://workiq.svc.cloud.microsoft/.default"]
  });

  if (!workIqAuth?.accessToken) {
    throw new Error("Work IQ token acquisition failed.");
  }

  const question = `CRM record: ${JSON.stringify(renewal)}.
Search my email for customer evidence that conflicts with it.`;

  const response = await fetch("https://workiq.svc.cloud.microsoft/a2a/", {
    method: "POST",
    headers: {
      authorization: `Bearer ${workIqAuth.accessToken}`,
      "content-type": "application/json",
      "A2A-Version": "1.0"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "SendMessage",
      params: {
        message: {
          role: "ROLE_USER",
          messageId: crypto.randomUUID(),
          parts: [{ text: question }]
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Work IQ returned HTTP ${response.status}.`);
  }

  return response.json();
}
```

The Work IQ token never reaches the browser, but every request still runs within the signed-in user's permissions. A managed identity can give the backend access to Key Vault; it cannot replace the user because Work IQ does not support application-only authentication. The [Work IQ A2A quickstart](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/a2a/quickstart) documents this confidential-client pattern.

The pattern worth taking away: **control and responsibility move together, in the same direction, as you go down.** Door one keeps most platform responsibility with Microsoft; door four hands you the entire governance, authentication and residency surface. Stop at the first door that solves the problem: the most expensive move is building at door four for something door two, or the license itself, already does.

## What you pay for, and what you do not

The instinct is to look for a price list. There is no per-call one for anything Work IQ touches.

Cowork, agents on the GitHub Copilot harness and the Work IQ APIs are all [consumption-based](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-overview-copilot-credits). Declarative agents are included in the Microsoft 365 Copilot user subscription license. Where consumption pricing applies, it is deliberate design rather than omission:

> Credits consumed vary by task based on the models used, the context retrieved, the runtime required, and the tools called. Usage isn't a fixed amount per request, so more complex or multistep work generally consumes more credits.

An agent that reasons, plans, retries and calls five tools cannot be priced like a single canned answer. The older Copilot Studio standard harness does have a published per-message rate card, and it does not apply here. Different engine, different billing model, so forecasting a Work IQ or Cowork rollout with it is the wrong instrument. For a closer look at the new model, see [cost control and governance for the GitHub Copilot harness]({% post_url 2026-08-07-copilot-harness-cost-governance %}).

So observe rather than estimate. In Cowork, type `/cost` in a session for that task's approximate usage and what remains of your allowance. Running it costs nothing. Do it per persona, not per organization: a sales manager running deal research and a support lead triaging mail behave differently, and the average describes nobody.

## Every control, and which console owns it

The single most useful orienting fact: **billing is governed in two different consoles.** Cowork and the Work IQ API sit in the **Microsoft 365 admin center**; Copilot Studio and Power Platform sit in **PPAC**. They share a currency and very little else. Two other places matter without being billing consoles: Entra ID, for one-time provisioning and consent, and the maker surface, where agent capabilities are configured.

| Control | Console | Default | What it does, and what it costs |
| --- | --- | --- | --- |
| Usage-based billing | M365 admin center | Not configured | Prerequisite for all metered Work IQ and Cowork use. Nothing bills until it is on |
| Spending policy, unlimited budget | M365 admin center | Not set | No ceiling. Spend follows usage |
| Spending policy, **limited** budget | M365 admin center | Not set | **Hard stop.** Users lose access to agents and services until the 1st |
| Per-user monthly limits | M365 admin center | Optional | Bounds the worst case per person, so one user cannot drain a shared pool |
| Threshold alerts | M365 admin center | Optional | Emails nominated owners before the ceiling |
| Consumption view | M365 admin center | Always available | Breaks usage down by user, group, service or agent |
| Work IQ MCP tool policy | M365 admin center | Read paths **on**, writes **off** | Which data areas MCP tools may reach, retrieval limits, and whether writes are allowed. Gates all MCP-path usage |
| Mutation (write) operations | M365 admin center | **Denied** | Unlocks create, update, delete and send. No direct charge |
| Anthropic models | M365 admin center | **Off** in the EU Data Boundary and UK | Changes the available model set |
| Service principal provisioning | Entra ID | Not present | One-time. Without it, consent fails |
| Admin consent, `WorkIQAgent.Ask` | Entra ID | Not granted | Required before anyone can sign in. Covers read and write |
| Credit allocation per environment | PPAC | Not set | Reserves prepaid capacity and ring-fences spend |
| Tenant-pool draw | PPAC | Often **enabled** on new environments | Lets an environment consume unallocated tenant capacity. Silent spend if unreviewed |
| Enforcement rules | PPAC | Not set | Decides whether you stop or keep paying as capacity runs out |
| 125% of purchased capacity | PPAC | Automatic | Copilot Studio prepaid enforcement: custom agents disabled, admin notified |
| Adding Work IQ as a tool in Copilot Studio | Maker | Not added | Gives the agent tenant reasoning. Free to add, subsequent runs are metered |

> A limited monthly budget is a hard stop, not an alert. Users lose access to agents and services until the 1st of the following month. If you have heard that these budgets only send warnings, that is folklore, and believing it is how a department loses Cowork three weeks into a quarter.
{: .prompt-danger }

Set three things before a pilot: a limited monthly budget with the reset date communicated to the people it affects, per-user limits, and threshold alerts pointed at somebody who reads them.

One mechanism explains a lot of confused forecasts: prepaid capacity is drawn down **before** pay-as-you-go, but the [expiration period depends on what you bought](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-manage-copilot-credits). Copilot Studio monthly capacity and Copilot Credit P3 commit units do not share the same renewal cycle, so check the terms of each pool rather than assuming every unused credit resets monthly.

## Three constraints that reshape designs

### 1. There is no application-only authentication

This is the big one.

> Work IQ uses Microsoft Entra ID delegated authentication. [...] On-behalf-of (OBO) flows are supported. **Application-only authentication isn't supported.**

Every Work IQ request runs in the context of a signed-in user. There is no daemon identity, no service principal calling Work IQ on its own account.

Read that as a constraint on *identity*, not on *presence*. Work can still happen while nobody is watching, provided it carries a user's identity: Cowork schedules recurring tasks this way, and on-behalf-of does the same for your own service, which acts within a user's permissions after that user has authenticated. What does not work is a background service with no user behind it at all. Plan for a user identity in the request path from the start rather than discovering it in week six.

The reasonable objection is that agents have their own identities now, so surely [Microsoft Agent 365](https://learn.microsoft.com/microsoft-agent-365/overview) solves this. Not for Work IQ. Agent 365 governs the agent as an entity; Work IQ governs the data that agent can reach, and it still resolves that against a signed-in human. [Agent authentication controls]({% post_url 2026-06-14-agent-authentication-controls %}) is a useful companion here.

### 2. Mutations are blocked by default

> By default, mutation operations aren't allowed for safety. This restriction includes create, update, delete, and action requests that modify data, such as sending email.

Work IQ MCP is read-only until an administrator explicitly enables write. Get it on the enablement checklist early, and note that policy changes can take up to 24 hours.

Be precise about what blocked means, because it explains why this catches people. The write tools are not missing, they ship: the published MCP surface includes create, update, delete and action tools, and the sample prompts include *"Send the draft email to the engineering distribution list."* A developer reads that, builds it, and it works in a tenant where somebody opted in. The tool is present and the policy layer refuses it.

### 3. Policy control is tenant-level only, for now

Work IQ [MCP policy](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/mcp/policy-governance-mcp) lives in the Microsoft 365 admin center under **Agents -> Tools -> Work IQ MCP -> Policy**. The initial administrator control is tenant-wide. At request time, the policy engine can evaluate resource paths, operations, request content and collection traversal limits. What it does not provide is narrower administrative scope:

> Per-user, per-app, per-agent, or scenario-specific policy templates aren't part of the initial policy control surface.

So you cannot yet say this agent may write and that one may not. Design around one tenant-wide posture.

Two consequences follow. **Policy approval does not guarantee the operation succeeds**, because access is still checked against the user's own permissions. And **policy can never grant access beyond what the signed-in user is already allowed to see**. Work IQ cannot escalate privilege.

## Residency, in one paragraph

Work IQ operates within the Microsoft 365 trust boundary, does not use customer content to train models, and follows your tenant's Microsoft 365 residency configuration rather than the region of whatever service you provisioned. **But retrieval residency is not solution residency.** Chain Work IQ into something else and that covers only its own leg: a Foundry workflow can send prompts and retrieved results downstream, and model processing has its own geography. Inside the EU Data Boundary, Copilot is an EU Data Boundary service; [outside it](https://learn.microsoft.com/microsoft-365/copilot/microsoft-365-copilot-privacy), queries may be processed in the US, EU or other regions. Answer a compliance questionnaire for the whole path, not for Work IQ alone.

## When Work IQ is the wrong tool

A guide that only explains when to say yes is a brochure. Work IQ is good at one thing, reasoning over work context on behalf of a person, and there are jobs where reaching for it is the slow way to a worse result.

**When the answer is already underneath you.** The thesis inverted, and the most common waste. If your users hold Copilot licenses and the requirement is letting people ask about their own mail, meetings and documents, they already have that. Building an agent that calls the APIs to reproduce it duplicates what they have. Reach for the API when you need Work IQ's intelligence somewhere Copilot is not.

**When you need determinism.** Work IQ reasons, and reasoning is non-deterministic by design, which is why there is no per-call rate card. If you need the same answer for the same input every time, Microsoft Graph is the better instrument. *"Return this user's calendar for next Tuesday"* is a Graph call. *"What should I know before Tuesday's meeting?"* is a Work IQ question.

**When there is no user identity.** Constraint one again, read as a design signal. Batch jobs and syncs that run on the system's own authority rather than someone's want application permissions, so that leg belongs to Graph.

**When you are moving volume.** Work IQ is built for relevance, not bulk, and the MCP policy layer caps reads, limits page sizes and can block arbitrary paging. A poor foundation for exports, migrations or backups: those are Graph jobs.

**When simple retrieval would do.** If a SharePoint search box or a well-placed link answers the question, use those.

None of this makes Work IQ the wrong platform. It makes it a specific one. The teams who get the most from it know which half of their requirements belong to Microsoft Graph.

## Getting started

Enablement is **two jobs, not one**, and skipping either produces a failure that looks like the other: a usage-based billing plan configured with an Azure subscription and resource group, and tenant admin consent, which has an order to it.

Consent has a prerequisite. Work IQ's own service principals, including the individual MCP tool servers, must exist in your tenant before anything can be consented to, and an administrator [provisions them](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/enable-work-iq) deliberately rather than licensing doing it for you. Five minutes, one line of CLI:

```azurecli
az ad sp create --id fdcc1f02-fc51-4226-8753-f668596af7f7
```

With the resource present, an administrator grants the delegated [`WorkIQAgent.Ask`](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/permissions) scope, published under `api://workiq.svc.cloud.microsoft`. Take that scope to your security reviewer in week one, not week six: it is broader than its name suggests:

> Allows the app to ask Work IQ agents questions and receive responses on behalf of the signed-in user. This includes **read and write** access to Microsoft 365 resources that are accessible to Work IQ agents and scoped to the signed-in user.

That is the design point from earlier in a single permission: Work IQ avoids hundreds of narrow OAuth scopes in favor of a few wide ones, then lets the policy engine and the user's own permissions decide what any request returns. It also explains the second constraint: write is *inside* the scope you consented to, so a failing create call is policy, not permissions.

Skip provisioning and the failures arrive disguised: there is nothing to consent to, so consent fails and reads like a permissions problem. If the MCP policy settings are missing from the admin center, the documented checks are the same shape: whether the tenant has access to Work IQ MCP, and whether your admin account holds the required permissions. Provision, consent, then connect the tool.

Then pick your door. In Copilot Studio it is **Tools -> Add Tool -> Model Context Protocol -> Work IQ (preview)**. Developers get two shapes: a hosted MCP server needing nothing installed locally, and a local server you run through the Work IQ CLI.

> The Copilot Studio tool, the Foundry tool and the AI Search knowledge source are all in preview. The Work IQ REST API also has [documented limitations](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/rest/overview#known-limitations) worth reading before anything ships to users.
{: .prompt-warning }

### Why it works in one tenant and not the next

When Work IQ behaves differently between two tenants, it is nearly always one of these:

1. **Admin consent was never granted.** `WorkIQAgent.Ask` needs a tenant administrator and nobody can self-serve it. The tenant where it worked had it.
2. **The service principal was never provisioned**, so consent fails with an error that looks like permissions and is really provisioning.
3. **Writes worked elsewhere because that tenant had opted in.** Your create, update, delete and send calls are refused by policy, not by the API.
4. **Policy changes were made but have not landed.** Allow up to 24 hours.
5. **The signed-in user genuinely cannot see the data.** A run by an administrator proves little about the same run by a sales rep.
6. **The model set differs.** An EU, EFTA or UK tenant has [Anthropic models off by default](https://learn.microsoft.com/microsoft-365/copilot/connect-to-ai-subprocessor). A US tenant may not.
7. **The budget ran out.** A limited monthly budget removes access until the 1st.
8. **Nothing is wrong at all.** Retrieval is not deterministic. The same question, minutes apart against unchanged data, found the evidence twice and missed it twice in our testing. Never build a step that depends on one document being found.

> Almost every Work IQ failure is a governance outcome wearing a capability costume. The API is rarely broken. Something in the tenant has decided, correctly, that this request should not proceed. Debug the tenant before the code, and accept that the last item on that list is not a bug at all.
{: .prompt-tip }

## The short version

- Work IQ is a layer, not a product. It reasons over the Microsoft 365 data you already have, in place, without a second copy.
- **Included when it is underneath you, consumption-based when you reach for it**: included means covered by a Copilot license and subject to fair usage.
- Four doors of many, by how much you take on: scope Copilot, delegate to Cowork, build in Copilot Studio, code against the API. **Start at door one.**
- Declarative agents shape Copilot for a specific purpose with tailored instructions, knowledge and actions, and are included in the Microsoft 365 Copilot license.
- **No application-only auth.** Design for a user identity in the request path, which is not the same as a user watching.
- **Mutations are off by default** on Work IQ MCP, and policy is tenant-wide only for now.
- **A limited monthly budget is a hard stop**, not an alert.
- **Two billing consoles.** M365 admin center for Cowork and the API, PPAC for Copilot Studio and Power Platform.
- **Know when to use Microsoft Graph instead**: determinism, jobs with no user identity, and anything moving volume.

I keep coming back to the question at the top. Most agents come up short on it not because the model is weak, but because they have no idea where they are standing. What is the first question you would want your agent to answer properly, and what would it need to know about your organization to get it right?
