---
layout: post
title: "Unlocking Seamless Access: How to Ensure Users Can Create Connections for Copilot Studio Agents"
date: 2025-11-21
categories: [copilot-studio, tutorial, governance, dataverse, security]
tags: [power-platform, agents, connection-references, connections, dataverse]
description: Learn how to automatically sync users added/removed from Entra Security Groups to Dataverse Teams
author: jpapadimitriou
image:
  path: /assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/diagram.png
  alt: "Entra ID and Dataverse"
---


# Unlocking Seamless Access: How to Ensure Users Can Create Connections for Copilot Studio Agents

## Introduction
One of the most common challenges in Copilot Studio deployments is ensuring that users can create and use **connections** for agents in the correct environment. Without proper configuration, users may encounter permission errors or fail to access required resources.

This blog post provides a **step-by-step guide** to:
- Sync users from **Entra ID security groups** into Dataverse.
- Create and configure **Dataverse security teams**.
- Assign the right roles so users can create and use connections for Copilot Studio agents.
- Troubleshoot common issues and automate sync for large environments.
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/diagram.png)
---

## Why This Matters
Connections are the backbone of Copilot Studio agents. If users lack permissions, agents cannot function properly. By aligning **Entra ID groups**, **Dataverse teams**, and **security roles**, you ensure a smooth experience for every user.

### Things to keep in mind
You can apply the following approach across all Dev-Test-Prod environments in Power Platform:


* Create an Entra Security Group for each Dataverse Security Team in every environment.
* Assign a specific user role to each team. When a user is added to the corresponding Dataverse team, the role is automatically applied, ensuring consistent permissions and avoiding hidden conflicts.
* This setup guarantees that makers have the appropriate access level in each environment:

   * Dev: Developers creating agents can be assigned the Environment Maker role or a custom role.
   * Test: Developers and testers can share similar elevated permissions.
   * Prod: All users can be included but assigned a more restricted role, such as Basic User, to maintain security.


> [IMPORTANT]
> * The respective environment **must be Dataverse enabled**.
> * These steps **do not** apply to Teams environments.


## Step 1: Verify Entra ID Security Group Membership
1. Go to **Microsoft Entra admin center** (**https://entra.microsoft.com/**).
2. Navigate to **Groups → Security Groups**.
3. Create a new group and give it a distinctive name.
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot1.png)


---

## Step 2: Create Corresponding Security Teams in Dataverse
1. Open [**Power Platform Admin Center (PPAC)**](https://admin.powerplatform.microsoft.com/).
2. Select the environment where your Copilot Studio agent resides.
3. Go to **Settings → Users + Permissions → Teams**.
4. Click **New Team**:

> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot2.png)
    
5. Assign appropriate **security roles** to this team (e.g., *Environment Maker*, *Basic User*, or custom roles granting connection creation).
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot3.png)

---

##  Step 3: Force Sync Users into Dataverse
By default, sync happens periodically. In order to make sure the latest changes regarding additions/removals of users are reflected immediately you need to force sync:

### Option A (manual): Power Platform Admin Center
- Navigate to **Users** in the environment (**Manage → Environment → RespectiveEnvironment → User - See all**).
- Click **Refresh** for the affected user(s).

### Option B (automated): Triggered Power Automate Flow that force syncs users (addition/removal)

* Go to [Power Automate portal](https://make.powerautomate.com/)

* Create a new **Automated cloud flow** and use the trigger  
   **Office 365 Groups – When a group member is added or removed**.
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot4.png)

* Choose the Entra Security Group you want to monitor.
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot5.png)

* Add **Power Platform for Admins – Force Sync User**  
    - **Environment:** select the target environment  
    - **ObjectId:** use the trigger’s `User Id` dynamic value

> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot6.png)

* Then add **Dataverse – Perform a bound action**:
   - **Table:** `teams`
   - **Action:** `SyncGroupMembersToTeam`
   - **Row ID:** the GUID of the Dataverse Team linked to your security group
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot7.png)

   You can find it in the Dataverse team's URL (highlighted here): 
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot8.png)
* Save and enable the flow.

* Final flow should look like this:
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot9.png)

And that's it. Now whenever you add/remove a user from the Entra ID security group, the automated cloud flow will be triggered, syncing the latest changes to the connected Dataverse security team.

### Testing the flow

* Adding a new user to the Entra Security Group:
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot10.png)

* This will trigger our automated flow.
* The **Force Sync user** action will get the newly added user's details and push them to the respective Dataverse Security Team.
* Finally the **Perform a bound action** will update the Teams table by syncing the latest changes based on the Team ID provided.
> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot11.png)

> ![img](/assets/posts/unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents/Screenshot12.png)




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

