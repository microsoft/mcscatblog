---
layout: post
title: "Build a Copilot Cowork plugin that reads and writes across Dataverse environments"
date: 2026-11-26
author: giorgioughini
agent_edition: both
categories: [copilot-studio, dataverse]
tags: [microsoft-365-copilot, copilot-cowork, dataverse, cross-environment, power-platform, agent-skills]
description: "Build a Cowork plugin that finds an account in two Dataverse environments, previews a change in the one you choose, and reads the row back after approval."
image:
  path: /assets/posts/cowork-dataverse-plugin/header.svg
  alt: "One Cowork plugin reads from East and West; an approved account change goes to West only."
---

Imagine you look after accounts for a restaurant group. There's a pizzeria called **Forno Luna** in both your East and West Dataverse environments. Its West location has moved from Salem to Portland. If you open the records yourself, it's easy enough to change the right one: you can see which environment you're in. How do you give Copilot Cowork that same context?

In my [earlier pizzeria demo]({% post_url 2026-03-26-claude-copilot-skills-copilot-studio-plugin-demo %}), the agent handled table reservations. This time we're working with the restaurant's account record. Ask Cowork to **“Find Forno Luna in East and West.”** Then follow up with **“Change the city to Portland.”** Cowork has two matches. Before it shows you the edit to approve, it needs to ask which one you mean.

[Download the editable starter plugin (.zip)]({{ '/assets/posts/cowork-dataverse-plugin/account-records.zip' | relative_url }}). The example uses the standard [Account table](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/account) in two sandboxes. We'll use it to find an account, update its city, and create a supplier account.

## Start with the connector

The plugin has two parts: a **connector** that gives Cowork access to Dataverse tools, and a **skill** that explains how to use those tools for this task. If you've used [the Power Platform Admin plugin in Cowork]({% post_url 2026-11-20-copilot-cowork-credit-analysis %}), the distinction is familiar: enabling a skill and signing in to its connection are separate steps.

In this sample, the manifest names one connector: **Dataverse (multi-org)** (`shared_dataverse`). East and West don't need separate entries in the manifest. Instead, the skill tells Cowork which organization to use on each call, including the read that checks a change afterward.

> **Which Dataverse connection do you have?** The [Microsoft Dataverse plugin](https://learn.microsoft.com/en-us/copilot/cowork/dataverse-plugin#set-up-the-microsoft-dataverse-plugin) connects to one environment URL at a time. This sample needs **Dataverse (multi-org)** and tools that accept an explicit destination. If your tenant doesn't expose them, you can draft changes, but you can't run the two-environment demo.
{: .prompt-info }

Use two sandboxes in the same tenant and sign in with a work account that can read the test rows in both. To try the changes below, that account also needs **Write** access to the West row and **Create** access on Account in East. Sharing a plugin doesn't change anyone's [Dataverse security roles](https://learn.microsoft.com/en-us/power-platform/admin/security-roles-privileges). There's no custom server to host or client secret to put in the ZIP. If you're connecting a Copilot Studio agent to a remote endpoint instead, see our [cross-environment setup for Copilot Studio]({% post_url 2026-03-03-connecting-copilot-studio-dataverse-mcp-endpoint-across-environments %}).

## 1. Wire the skill to Dataverse

Extract the starter ZIP. `manifest.json` is at the root, next to the two plugin icons. The instructions and the environment map live together under `skills/account-records/`. These are the two entries that connect the pieces in the included v1.29 manifest:

```json
{
  "agentSkills": [
    { "folder": "./skills/account-records" }
  ],
  "agentConnectors": [
    { "id": "shared_dataverse", "displayName": "Dataverse (multi-org)" }
  ]
}
```

Keep the rest of the manifest from the starter. For your own plugin, generate an app ID once (`[guid]::NewGuid()` in PowerShell), set `id` to that value, and replace the example publisher name and website, privacy, and terms URLs with yours. Keep your ID when you update the plugin. Microsoft's [Cowork package guide](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#assemble-a-package-by-hand) covers the manifest, icons, and ZIP layout.

## 2. Map East and West to your sandboxes

In [Power Apps](https://make.powerapps.com), select the first sandbox, then open **Settings → Session details** and [copy the **Instance url**](https://learn.microsoft.com/en-us/copilot/cowork/dataverse-plugin#set-up-the-microsoft-dataverse-plugin). Repeat for the second sandbox. Open `skills/account-records/organizations.json` in the starter and replace these two placeholders:

```json
{
  "East": "https://east.example.invalid",
  "West": "https://west.example.invalid"
}
```

Why bother with a map when the connector can discover environments? Because **West** is what people will type, and the instance URL identifies the database they mean. The skill checks that the signed-in connector can reach that exact organization. “I can't open West” and “I searched West and found no Forno Luna account” are two quite different answers.

## 3. Tell the skill when to ask for approval

Open `skills/account-records/SKILL.md`. I've kept the job small: find an account by name, create one with a name and an optional city, or change the city on a single account. For that last operation, the only field the skill should send is `address1_city`. There's no reason to send the rest of the address just because a restaurant moved.

The key instruction is short enough to reuse:

```text
Show the target alias and instance URL, the operation, and the exact values.
For an update, show the account name, full accountid, and old and new city.
Wait for explicit approval of that preview. Selecting West is not approval.
```

Most of us won't recognize a Dataverse row ID. We *will* recognize “Salem → Portland.” Show both: the city helps the person spot a mistake, and the ID tells the connector exactly which row to update. If the city has changed since the preview, the skill asks again. That check catches a stale preview; it doesn't lock the row.

Before writing, the skill asks the connector to describe the Account table **in the destination** (`describe_table` where available). Two environments can both have an Account table and still have different requirements. If creating an account in West requires an additional field outside the sample, stop at the draft and explain which field is missing. Don't fill it with a guess. These instructions guide Cowork; Dataverse permissions and business rules are what enforce access and validate changes on the server.

## 4. Package it and try a read

From the extracted folder that contains `manifest.json`, run:

```powershell
Compress-Archive -Path manifest.json,color.png,outline.png,skills `
  -DestinationPath ..\account-records-custom.zip -Force
```

In Cowork, go to **Plugins → Add → Upload** and choose your new ZIP. Keep the audience set to **Only you** for this first test. Open the plugin and connect **Dataverse (multi-org)** with your work account if prompted. Microsoft's [upload guide](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugins#upload-your-own-plugin-package) covers sharing when you're ready.

Start a new Cowork task and check the connection before you give it a record to work on:

> Using Account Records and its Dataverse (multi-org) connection, show me the instance URLs you can match to East and West. Don't read or change any accounts.

Compare both URLs with the ones you copied from Power Apps. If only one matches, stop there. Microsoft's [Business apps preview example](https://learn.microsoft.com/en-us/copilot/cowork/cowork-work-iq#use-case-create-a-prompt-in-cowork-to-find-your-environments) illustrates environment discovery; for this test, the results must come from **your plugin's connection**.

Now add a disposable **Forno Luna** account in each sandbox. Set the city to **Denver** in East and **Salem** in West. Back in Cowork, ask:

> Find Forno Luna in East and West. Show me the environment, account ID, and city for each. Don't change anything.

Here's an **illustrative result**. Your IDs and cities will differ:

| Environment | Account | Account ID | City |
|---|---|---|---|
| East | Forno Luna | `00000000-0000-4000-8000-000000000101` | Denver |
| West | Forno Luna | `00000000-0000-4000-8000-000000000202` | Salem |

Notice the two IDs. These are separate rows, even though the account names match. Keep the environment next to each ID so that “the one in West” still means something on the next turn.

## 5. Change one row and check both

Now give Cowork the kind of short follow-up you'd use in a real conversation:

> Change the city to Portland.

With both accounts in the conversation, Cowork should ask which one. Reply **“The one in West.”** You've picked the account; you haven't approved the edit yet. Here's the preview to look for (yours should show your actual West instance URL):

> **West** (`https://west.example.invalid`) · **Update Account**<br>
> Forno Luna · `00000000-0000-4000-8000-000000000202`<br>
> City (`address1_city`): **Salem → Portland**. East will not be changed.<br>
> Approve this change?

Try **Cancel** the first time. Ask for both cities again: West should still say Salem. Then request the same change, approve the preview, and complete any approval Cowork itself presents. The skill should read back the West account by ID. Ask **“What city do we have for each location now?”** The answer you're looking for is **Portland in West and Denver in East**. It's worth checking the row you *didn't* ask it to change.

For a create, let's give the restaurant an oven repair supplier:

> Create an account called Juniper Oven Repair in East, city Denver.

The skill looks for that name in East first. If it finds a match, it shows you the existing record rather than creating a second supplier. Otherwise, it proposes a new row with its own ID. Why choose the ID up front? If the create times out, the skill can look up that ID to see whether Dataverse saved the row. Dataverse supports [supplying a primary key on create](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-table-row#setting-the-primary-key-value); if the native tool doesn't expose that option, this starter leaves the create as a draft.

Before sharing the plugin, I'd try one more thing: ask a colleague who can read West but can't update it to run the same prompts. They should be able to find Forno Luna and get a clear explanation when the edit is denied. Switching to East shouldn't be an option.

Which step would be most useful in your own environment: finding the same account in two places, or seeing exactly which one Cowork is about to change?
