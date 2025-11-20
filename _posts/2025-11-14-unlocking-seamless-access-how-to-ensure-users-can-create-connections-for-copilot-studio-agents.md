---
layout: post
title: "Unlocking Seamless Access: How to Ensure Users Can Create Connections for Copilot Studio Agents"
date: 2025-11-14
categories: [copilot-studio, tutorial, governance]
tags: [power-platform, agents, connection-references, connections, dataverse]
author: jpapadimitriou
---


# Unlocking Seamless Access: How to Ensure Users Can Create Connections for Copilot Studio Agents

## Introduction
One of the most common challenges in Copilot Studio deployments is ensuring that users can create and use **connections** for agents in the correct environment. Without proper configuration, users may encounter permission errors or fail to access required resources.

This blog post provides a **step-by-step guide** to:
- Sync users from **Entra ID security groups** into Dataverse.
- Create and configure **Dataverse security teams**.
- Assign the right roles so users can create and use connections for Copilot Studio agents.
- Troubleshoot common issues and automate sync for large environments.

---

## Why This Matters
Connections are the backbone of Copilot Studio agents. If users lack permissions, agents cannot function properly. By aligning **Entra ID groups**, **Dataverse teams**, and **security roles**, you ensure a smooth experience for every user.

---
> [!NOTE] 
> You can create a mock security group to test the tutorial end-to-end. We will explaining how to do so below.

## Step 1: Verify Entra ID Security Group Membership
1. Go to **Microsoft Entra admin center** (**https://entra.microsoft.com/**).
2. Navigate to **Groups → Security Groups**.
3. Confirm that all intended users are members of the relevant security group.



---

## Step 2: Create Corresponding Security Teams in Dataverse
1. Open **Power Platform Admin Center (PPAC)** (**https://admin.powerplatform.microsoft.com/**).
2. Select the environment where your Copilot Studio agent resides.
3. Go to **Settings → Users + Permissions → Teams**.
4. Click **New Team**:
    
5. Assign appropriate **security roles** to this team (e.g., *Environment Maker*, *Basic User*, or custom roles granting connection creation).

---

##  Step 3: Force Sync Users into Dataverse
By default, sync happens periodically. In order to make sure the latest changes regarding additions/removals of users are reflected immediately you need to force sync:

### Option A (manual): Power Platform Admin Center
- Navigate to **Users** in the environment (**Manage → Environment → RespectiveEnvironment → User - See all**).
- Click **Refresh** for the affected user(s).

### Option B (automated): Triggered Power Automate Flow(s) that force syncs users (addition/removal)

* Go to **https://make.powerautomate.com/**

* Create a new **Automated cloud flow** and use the trigger  
   **Office 365 Groups – When a group member is added or removed**.

* Choose the Entra Security Group you want to monitor.


* Add **Power Platform for Admins – Force Sync User**  
    - **Environment:** select the target environment  
    - **ObjectId:** use the trigger’s `User Id` dynamic value

* Then add **Dataverse – Perform a bound action**:
   - **Table:** `teams`
   - **Action:** `SyncGroupMembersToTeam`
   - **Row ID:** the GUID of the Dataverse Team linked to your security group

   You can find it here: 

* Save and enable the flow.

And that's it. Now whenever you add/remove a user from the Entra ID security group, the automated cloud flow will be triggered, syncing the latest changes to the connected Dataverse security team.

## Step 5: Confirm Agent Connection Usage
- In **Copilot Studio**, open the agent.
- Verify that the agent uses the correct **connection reference**.
- Ensure the user can run the agent without permission errors.

---

## Best Practices
- Always use **Azure AD Security Group Teams** for scalable permission management.
- Assign roles at the **team level**, not individual users.
- Periodically audit team memberships and roles.
- Automate sync using PowerShell for large environments.

---

## Outcome
Following these steps ensures that:
- Users added to Entra ID security groups are synced into Dataverse.
- Users removed to Entra ID security groups are also removed from linked Dataverse security teams
- They inherit the correct permissions via security teams.
- They can create and use connections required by Copilot Studio agents.

---

