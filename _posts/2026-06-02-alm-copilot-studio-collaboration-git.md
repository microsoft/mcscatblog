---
layout: post
title: "ALM for Copilot Studio Agents: Collaboration with Git"
date: 2026-06-02
categories: [copilot-studio, agents, alm]
tags: [copilot-studio, power-platform, azure, devops, alm, git, source-control, collaboration, branching, yaml]
description: "How multiple makers collaborate on the same Copilot Studio agent using native Git integration - branching, merging, pull requests, and practical guardrails."
author: jpapadimitriou
image:
  path: /assets/posts/alm-copilot-studio-collaboration-git/header.png
  alt: "Collaboration with Git for Copilot Studio agents"
---

## The Problem This Solves

> [!Note]
> This is part of the ALM series for Copilot Studio. For the other parts check here: 
> - [ALM for Copilot Studio Agents: The Foundation]() 

Your foundation is in place. Environments are isolated. Solutions travel through pipelines. Configuration is externalised. The agent works.

Now two makers need to edit it at the same time.

Maker A is updating a workflow that retrieves order status. Maker B is adding a new tool that checks inventory levels. Both are working in the same solution, connected to the same agent - and neither wants to overwrite the other's changes.

This is where source control stops being optional. Without it, the last person to export wins and the other's work disappears silently. With native Git integration, both makers work in parallel, changes are tracked individually, and conflicts surface before they reach production.

Here is the end-to-end collaboration flow at a glance - the rest of this post breaks down each step:

![Image](/assets/posts/alm-copilot-studio-collaboration-git/end_to_end_collaboration_flow.png)

---

## What Git Integration Gives You

Copilot Studio supports [native Git integration](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/overview).  
When enabled, your solution components are serialised into individual YAML files in a Git repository - giving you version history, change attribution, and the full collaboration model that software teams have relied on for decades.

### Why YAML Changes Everything

If you have Git experience from pro-code projects - Visual Studio, .NET, Java - you already know the value of readable diffs, line-by-line merges, and meaningful code reviews. The problem with low-code platforms historically was that solutions were packaged as opaque ZIP archives or dense XML. Diffing two versions produced noise, not insight.

Power Platform now serialises solution components as human-readable YAML. Each component - a workflow, a table, a tool definition - is stored as its own file. This is the difference between reviewing a 10,000-line XML diff and reviewing a 15-line YAML change that clearly shows which output parameter was added to which workflow.

### What the Repository Looks Like

When your solution is connected, the repository structure looks something like this:

```
YourSolution/
├── solution.json
├── Workflows/
│     ├── GetOrderStatus.yaml
│     └── CheckInventory.yaml
├── Tables/
│     └── OrderTracking.yaml
│           └── Columns/
│                 └── ShipmentRef.yaml
├── EnvironmentVariables/
│     ├── ApiEndpoint.yaml
│     └── FeatureFlag_EnableV2.yaml
└── ...
```

Each file represents a single component. When Maker A modifies the "Get Order Status" workflow, only `GetOrderStatus.yaml` changes. When Maker B adds a new tool, a new file appears. Git tracks both independently.

---

## Two Collaboration Models

Microsoft documents two approaches for multi-maker collaboration with Git integration. Both are valid - the right choice depends on your team's size, governance needs, and risk tolerance.

### Model 1: Shared Branch

Multiple development environments connect to the **same repository, branch, and folder**. Makers collaborate through a commit-and-pull cycle.

![Image](/assets/posts/alm-copilot-studio-collaboration-git/shared_branch_model.png)

Microsoft's documentation states:

"Multiple development environments can be connected to the same Git location. This feature provides developer isolation with the ability to quickly push your changes to Git and pull others' changes into your environment."

[Connect multiple development environments to Git](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git#connect-multiple-development-environments-to-git)

>[!IMPORTANT] 
> Every environment must be connected with the **same binding type, repository, branch, and Git folder**.

**When to use:** Small teams (2-3 makers), high trust, fast iteration, simpler governance requirements.

**How it works in practice:**
1. Both makers pull before starting work
2. Maker A commits their change - the YAML file updates in the repository
3. Maker B selects "Check for updates" and pulls - Maker A's changes arrive in their environment
4. If both modified the same file, conflicts surface in the Source Control panel and are [resolved there](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/source-control-operations#conflict-resolution)

![Image](/assets/posts/alm-copilot-studio-collaboration-git/daily_workflow_cycle.png)

### Model 2: Feature Branches (Enterprise)

Each development environment connects to its **own feature branch**. Changes reach `main` only through reviewed and approved pull requests.

![Image](/assets/posts/alm-copilot-studio-collaboration-git/feature_branch_enterprise_flow.png)

Microsoft's enterprise reference architecture states:

"Map each development stream to a Git environment or feature branch. [...] Review feature branches and merge them into the Git main branch by using pull requests and branch protection policies when ready for submission into the production testing ALM path."
[Enterprise Power Platform ALM reference architecture](https://learn.microsoft.com/en-us/power-platform/architecture/reference-architectures/enterprise-power-platform-alm)

And further:

"To avoid feature drift, pull changes accepted into the main branch into branches corresponding to all development environments."

**When to use:** Larger teams, enterprise environments, compliance/audit requirements, when you need formal review before changes reach production.

**How it works in practice:**
1. Each maker's environment is permanently connected to their own feature branch
2. Maker A commits to `feature/order-status-v2` - only their branch is affected
3. When ready, Maker A creates a pull request from their feature branch to `main` in Azure DevOps
4. A reviewer approves, the PR is merged into `main`
5. Maker B merges `main` into their feature branch (in Azure DevOps), then pulls to get Maker A's changes
6. `main` is promoted to TEST/PROD via [Pipelines in Power Platform](https://learn.microsoft.com/en-us/power-platform/alm/pipelines) as a managed solution

![Image](/assets/posts/alm-copilot-studio-collaboration-git/branch_strategy.png)

### Which Model Should You Choose?

| Consideration | Shared Branch | Feature Branches |
|---|---|---|
| Team size | 2-3 makers | 3+ makers or regulated teams |
| Governance | Clear rule-based communication | Formal (PRs, branch policies, approvals) |
| Risk of overwrite | Mitigated by pull discipline | Eliminated by branch isolation |
| Audit trail | Commit history only | Commit history + PR review trail |
| Complexity | Low | Medium |
| Microsoft documentation | [Connect multiple environments](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git#connect-multiple-development-environments-to-git) | [Enterprise ALM architecture](https://learn.microsoft.com/en-us/power-platform/architecture/reference-architectures/enterprise-power-platform-alm) |

Both models can coexist in the same organisation - a small team might start with the shared branch model and graduate to feature branches as the team grows or compliance requirements increase.

---

## Real-life Scenario: Multiple Makers - Single Agent

### Shared Branch Model

Bruce and Alfred both have their own development environments, connected to the same repository, branch, and folder.

**Monday morning:**
- Bruce opens Source Control, selects **Check for updates**, and pulls the latest. He starts updating the "Get Order Status" workflow.
- Alfred does the same. He begins building a new "Check Inventory" tool.

**Monday afternoon:**
- Alfred finishes first. He commits: "Add Check Inventory tool for warehouse lookup". A new file appears in the repository: `Workflows/CheckInventory.yaml`.
- Bruce is still working. When ready, he selects **Check for updates**. Alfred's new file appears in his **Updates** tab. He pulls it into his environment. No conflict - different files.
- Bruce commits: "Add estimated delivery output to Get Order Status". Only `Workflows/GetOrderStatus.yaml` is modified.

**The easy case:** different components, different YAML files, no overlap. This is the majority of real-world collaboration when teams communicate about who is working on what.

**The hard case:** both makers edit the same component. The Source Control panel surfaces this as a [conflict](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/source-control-operations#conflict-resolution). For each conflict, the maker chooses to **keep existing changes** (theirs) or **accept incoming changes** (from Git). Because the format is YAML, the conflict is readable rather than opaque.

![Image](/assets/posts/alm-copilot-studio-collaboration-git/multi-maker_scenario_timeline.png)

### Feature Branch Model

Bruce and Alfred each have their own development environment AND their own feature branch.

**Monday morning:**
- Bruce's environment is connected to `feature/order-status-v2`. He makes changes and commits there.
- Alfred's environment is connected to `feature/inventory-tool`. He makes changes and commits there.

**Monday afternoon:**
- Alfred finishes. He creates a pull request in Azure DevOps: `feature/inventory-tool` → `main`. A reviewer approves. The PR is merged.
- Bruce needs Alfred's changes before continuing. In Azure DevOps, he merges `main` into `feature/order-status-v2`. Back in Copilot Studio, he pulls - Alfred's tool arrives in his environment.
- Bruce finishes and creates his own PR: `feature/order-status-v2` → `main`.

**Conflicts** are resolved during the PR merge in Azure DevOps, where reviewers can see the YAML diff side-by-side.

---

## Pull Requests: Reviews That Actually Matter

> [!NOTE]
> This section applies to the **Feature Branch model**. In the shared branch model, all commits go directly to the shared branch without formal review.

A pull request is a formal request to merge your branch into main. It creates a space for review, discussion, and approval before changes land.

For low-code teams, the natural question is: what is there to review? The answer - now that components are stored as readable YAML - is more than you might expect.

**What a meaningful review covers:**

- **Tool and workflow descriptions** - are they precise enough for the orchestrator to select correctly?
- **YAML diff inspection** - does the change match the intent? Are there unintended modifications?
- **New components** - do they belong in this solution or should they be separate?
- **Naming conventions** - consistent with existing patterns?
- **Scope** - does this change do one thing, or is it bundling unrelated modifications?

Pull requests also create an audit trail. Six months from now, when someone asks "why was this workflow changed?", the PR tells the story - who requested it, who reviewed it, what the rationale was.

### What a YAML Diff Looks Like in Practice

When Maker A adds an output parameter to a workflow, the pull request shows something like:

```yaml
  outputs:
    orderStatus:
      type: string
      description: "Current status of the order"
+   estimatedDelivery:
+     type: string
+     description: "Estimated delivery date in ISO 8601 format"
```

This is reviewable. A teammate can verify that the description is precise, the type is correct, and nothing else was accidentally modified. Compare this to reviewing a re-exported ZIP file where the entire solution is opaque.

---

## Conflict Resolution

Conflicts happen when two makers modify the same lines in the same YAML file. How they are resolved depends on which model you use.

> [!NOTE]
> Modifying the same file doesn't always cause a conflict. Different sections of the same file merge cleanly. Conflicts only occur when the **same lines** are modified.

### In the Shared Branch Model

Conflicts are resolved directly in Copilot Studio's Source Control panel:

1. Select **Check for updates** - conflicts appear in the **Conflicts** tab
2. For each conflict, choose: **Keep existing changes** (yours) or **Accept incoming changes** (from Git)
3. Resolve all conflicts, then pull, validate, and commit

> "The system detects if there are conflicting changes to your source repository. It lists these issues on the conflicts tab." - [Source control operations](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/source-control-operations#conflict-resolution)

### In the Feature Branch Model

Conflicts are resolved during the pull request merge in Azure DevOps:

1. The PR shows conflicting files with both versions side by side
2. The maker resolves them in the Azure DevOps merge editor
3. The resolved merge is committed and the PR completes

**How to minimise conflicts (both models):**

- Communicate who is working on what. A shared channel or standup is enough.
- Keep components small and focused. A workflow that does one thing is less likely to be edited by two people simultaneously.
- Commit frequently. The longer you hold uncommitted changes, the more likely someone else touches the same file.

---

## Walkthrough: Setting Up Git Integration

This section walks through the setup and demonstrates both collaboration models. The steps use Azure DevOps, which is the GA-supported provider for Power Platform Git integration.

**Related documentation:**
- [Git integration overview](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/overview)
- [Connecting to Git](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git)
- [Source control operations (commit, pull, conflicts)](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/source-control-operations)
- [Connect multiple development environments](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git#connect-multiple-development-environments-to-git)
- [Enterprise ALM reference architecture](https://learn.microsoft.com/en-us/power-platform/architecture/reference-architectures/enterprise-power-platform-alm)
- [FAQ - How do I work with branches?](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/faqs#how-do-i-work-with-branches)

**Prerequisites:**
- All development environments must be [Managed Environments](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview)
- All makers need Azure DevOps access ([Contributors security group](https://learn.microsoft.com/en-us/azure/devops/repos/git/set-git-repository-permissions))
- Solutions must be unmanaged and use a custom publisher

### Step 1: Create Your Azure DevOps Repository

1. Sign in to [dev.azure.com](https://dev.azure.com) and select your organization
2. Select **New project** - give it a meaningful name (e.g., `contoso-agents`)
3. In the new project, go to **Repos** and select **Initialize** to create the default `main` branch

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_1.png)

### Step 2: Connect Your First Environment to Git

1. Sign in to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Go to **Solutions** and open your unmanaged solution
3. Select **Source Control** in the left navigation (or **Connect to Git** from the Solutions page)
4. Choose your binding type:
   - **Environment binding** ([recommended](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git#how-to-choose-between-environment-and-solution-binding)) - all unmanaged solutions sync to one location
   - **Solution binding** - per-solution control over branches/folders
5. Select your Azure DevOps **Organisation**, **Project**, **Repository**, and **Branch** (`main`)
6. Enter a folder path (e.g., `/contoso-agent-v1`)
7. Select **Connect**

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_2_connect_to_repo.png)

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_2b_connect_to_repo.png)

### Step 3: Initial Commit (establish your baseline)

Once connected, all existing components in your solution appear immediately in the **Changes** tab. This is your initial commit - it captures the current state of your agent as the starting point in source control.

1. Open your solution > **Source Control**
2. The **Changes** tab lists all components (workflows, topics, tools, tables, etc.)
3. Select **Commit**, enter a message like "Initial commit - baseline agent"
4. Select **Commit** again to push

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_3a_commit.png)

Your first commit is now visible in Azure DevOps under **Repos > Commits**.

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_3b_devops_commits.png)

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_3c_devops_commit_diff.png)

> [!NOTE]
> From this point forward, only modified or new components appear in the Changes tab.

### Step 4a: Connect a Second Environment (Shared Branch Model)

For the shared branch model, connect the second environment to the **same** location:

1. In the second environment, import the same solution (or create one with the same name and publisher)
2. Go to **Solutions** > **Connect to Git**
3. Use the **same** binding type, organisation, project, repository, branch (`main`), and folder

> "Every environment must be connected with the same binding type, repository, branch, and Git folder." from: [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git#connect-multiple-development-environments-to-git)

Both environments can now commit and pull from the same branch. Changes made in one environment are available to the other via **Check for updates** > **Pull**.

### Step 4b: Connect a Second Environment (Feature Branch Model)

For the feature branch model, each environment gets its own branch:

1. In Azure DevOps, go to **Repos > Branches**
2. Create a branch for each maker: `feature/Bruce-work`, `feature/Alfred-work` - based on `main`
3. In the first environment, connect to Git selecting the branch `feature/Bruce-work`
4. In the second environment, connect to Git selecting the branch `feature/Alfred-work`
5. Both use the same organisation, project, repository, and folder - only the **branch** differs

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_4b_branches.png)

Each environment is now isolated. Commits in one environment do not affect the other. Changes reach `main` only through pull requests.

### Step 5: Make Changes and Commit

Regardless of which model you use, the commit process is identical:

1. Make your changes in the agent - update a workflow, add a tool, modify a topic
2. Return to **Source Control** > **Changes** tab
3. Select **Commit**, enter a descriptive message
4. Select **Commit** to push

### Step 6: Create a Pull Request (Feature Branch Model only)

1. In Azure DevOps, go to **Repos > Pull Requests > New Pull Request**
2. Set source: your feature branch, target: `main`
3. Add a title and description explaining what the change does
4. Review the **Files** tab - the YAML diff shows exactly what changed
5. Assign a reviewer, then select **Create**

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_6_create_pr.png)

6. Once approved, select **Complete > Complete merge**

![Image](/assets/posts/alm-copilot-studio-collaboration-git/alm_walkthrough_6_pr_complete.png)

### Step 7: Get Other Makers' Changes

**Shared Branch Model:**
1. In Copilot Studio, open **Source Control**
2. Select **Check for updates**
3. Pull incoming changes from the **Updates** tab

**Feature Branch Model:**
1. In Azure DevOps, merge `main` into your feature branch (to pick up merged PRs from other makers)
2. Back in Copilot Studio, open **Source Control**
3. Select **Check for updates** > **Pull**

---

## Practical Guardrails

These keep collaboration smooth without adding bureaucracy:

- **Pull before every work session.** Make it muscle memory. ([Source control operations](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/source-control-operations))
- **Commit with descriptive messages.** "Updated workflow" tells nobody anything. "Added shipping carrier output to Get Order Status" tells everyone everything.
- **One logical change per commit.** Do not bundle a new tool, a workflow fix, and a topic rename into a single commit. This keeps YAML diffs clean and reviewable.
- **Assign component ownership.** When two makers are active, agree on who owns which components that week. Ownership reduces collision.
- **Protect main with a branch policy** (Feature Branch model). Require at least one reviewer before merges to main. This catches mistakes early and distributes knowledge across the team.
- **Review the YAML, not just the description.** During pull request reviews, inspect the actual file changes. The YAML format makes this possible for the first time in low-code ALM.

---

## Before You Start: A Checklist

- [ ] Development environments enabled as [Managed Environments](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview)
- [ ] Azure DevOps project and Git repository created and initialised
- [ ] All active makers have Azure DevOps access (Contributors security group)
- [ ] Collaboration model chosen (shared branch or feature branches)
- [ ] All environments connected to Git with matching binding type and folder
- [ ] Branch protection enabled on `main` (feature branch model)
- [ ] Team has agreed on commit message format (concise, descriptive, one change per commit)
- [ ] Pull cadence established (pull at start of every session)

---

## The Payoff

Without Git, collaboration on a Copilot Studio agent is a coordination exercise built on trust and timing. With it, multiple makers work in parallel with full visibility, clear attribution, and a safety net that catches conflicts before they reach production.

The YAML format is what makes this practical rather than theoretical. Readable files mean reviewable pull requests, resolvable conflicts, and meaningful version history. For anyone coming from a pro-code background, this is the moment low-code ALM starts to feel familiar.

The mechanics are simple. The discipline - small commits, frequent pulls, descriptive messages - is what separates teams that scale from teams that struggle. Start with the shared branch model and two makers. Graduate to feature branches and formal reviews as the team grows.

---

## References

- [Git integration overview](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/overview)
- [Connecting to Git (setup, binding types, multiple environments)](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git)
- [Source control operations (commit, pull, conflicts)](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/source-control-operations)
- [Git integration FAQ](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/faqs)
- [Enterprise Power Platform ALM reference architecture](https://learn.microsoft.com/en-us/power-platform/architecture/reference-architectures/enterprise-power-platform-alm)
- [GitHub support for source code integration (public preview)](https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-platform-governance-administration/github-support-source-code-integration-power-platform)
- [Pipelines in Power Platform](https://learn.microsoft.com/en-us/power-platform/alm/pipelines)
