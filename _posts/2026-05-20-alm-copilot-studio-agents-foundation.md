---
layout: post
title: "ALM for Copilot Studio Agents: The Foundation"
date: 2026-06-03
categories: [copilot-studio, alm]
tags: [copilot-studio, power-platform, alm, environments, pipelines, evaluations]
description: "A practical guide to setting up Application Lifecycle Management for Copilot Studio agents - from environment strategy to deployment confidence."
author: jpapadimitriou
image:
  path: /assets/posts/alm-copilot-studio-agents-foundation/header.png
  alt: "ALM foundation for Copilot Studio agents"
---

## Why This Matters

Copilot Studio makes it remarkably fast to go from idea to working agent. That speed is one of the platform's greatest strengths - but it also means agents can reach production maturity quickly, and having the right lifecycle practices in place ensures they stay maintainable as they grow.

This post lays out the ALM foundation for teams building Copilot Studio agents - particularly those who do not come from a Power Platform background. It is not a click-by-click tutorial. It is the set of decisions an architect or technical lead needs to make to support an agent through its full lifecycle. Links to detailed setup documentation are provided where relevant.

---

## Start With Environments

The foundation of any ALM strategy is environment isolation. One of the most tried and tested patterns in Power Platform, is three environments: Development, Test, and Production. Dev is where makers author. Test is where you validate. Production is where users interact with the live agent. Changes flow in one direction: Dev to Test to Prod, keeping production stable and predictable.

This three-environment model is **not a hard requirement imposed by the platform**. It is a **best practice** that emerges naturally as soon as an agent is complex enough to warrant structured promotion. For a simple proof-of-concept, a single environment may suffice. For anything that serves real users, the separation between authoring, validation, and production is what prevents accidental breakage.

Create environments in the [Power Platform Admin Center](https://learn.microsoft.com/en-us/power-platform/admin/create-environment). That setup is straightforward. What matters more is the environment *strategy* - the decisions that go beyond the baseline.

### Beyond the Baseline: Optional Environments

Once your Dev-Test-Prod foundation is working reliably, there are two additional environments worth considering depending on your specific circumstances. Neither is required from day one, but both solve problems that surface as an agent matures and its uptime becomes business-critical.

### Detecting Platform Regressions Early

Power Platform and Copilot Studio updates ship continuously. It is a good practice to validate your agent against upcoming changes before they reach your production environment.

A **Preview environment** on the [First Release ring](https://learn.microsoft.com/en-us/power-platform/admin/opt-in-early-access-updates) gives you exactly this capability. First Release receives platform updates weeks before the standard ring. You deploy your current production solution into this environment and run your [evaluations](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro) against it on a schedule.

When evals start failing in Preview but still pass in Production, you have an early warning: something in the upcoming update may need attention. You have weeks to investigate and adapt - giving your team full control over the upgrade path.

This is one of the most valuable yet underutilised practices in Power Platform ALM. A Preview environment with scheduled evals turns platform updates from a reactive concern into a proactive one.

### Handling Emergencies Without Shipping Unfinished Work

Your primary Dev environment has work in progress. A critical bug surfaces in Production. You cannot wait for the current development cycle to complete, and you cannot ship half-finished features alongside a hotfix.

The solution is a **production-aligned development environment** - a secondary Dev environment that holds an unmanaged copy of whatever is currently running in Prod. When an emergency arises, you make the fix there, export, and promote it directly through the pipeline. Your primary Dev environment and its in-progress work remain untouched.

```
Normal cycle:   Dev → Test → Prod
Hotfix cycle:   Prod-Aligned Dev → Test → Prod
```

![Diagram illustrating a Power Platform ALM deployment strategy with two development cycles](/assets/posts/alm-copilot-studio-agents-foundation/alm_env_flow_diagram.png){: .shadow w="700" }
_The Normal Cycle uses a standard Dev environment for regular feature work, while the Hotfix Cycle uses a Prod-Aligned Dev environment for urgent production fixes. Both paths feed into a central Test environment for validation, which then promotes changes to the Prod environment. A separate Preview environment sits above Prod and mirrors its state, providing a safe observation layer without affecting live users._

This is not overhead for day one. Add it when the agent is mature enough that production downtime has a real cost. But plan for it from the start - retrofitting emergency processes during an actual emergency is how mistakes happen.

### The Full Picture

| Environment | Release Ring | What Lives Here | Why |
|---|---|---|---|
| Dev | Standard | Unmanaged solution (active work) | Daily authoring |
| Prod-Aligned Dev | Standard | Unmanaged solution (mirrors Prod) | Hotfixes |
| Test | Standard | Managed solution | Validation, UAT |
| Preview | First Release | Managed solution (mirrors Prod) | Regression detection |
| Production | Standard | Managed solution | Live users |

Start with Dev, Test, and Prod. Add Preview and Prod-Aligned Dev as the agent matures.

---

## Solutions: The Unit of Deployment

If environments are where your agent lives, solutions are how it travels between them. A solution is a container - a package that holds every component your agent depends on and makes the entire set portable and promotable as a single unit.

For those unfamiliar with Power Platform: a solution is conceptually similar to a project in Visual Studio or a package in a package manager. It groups related assets together so they can be versioned, exported, and imported as one coherent artifact.

### What Goes Inside a Solution

Everything your agent depends on must live inside a single solution:

- The agent itself
- Its tools (APIs, connectors, external integrations, [workflows](https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview))
- Its [environment variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables) (configuration that differs per environment)
- Its knowledge source references

Anything created outside a solution is invisible to your deployment pipeline and cannot be promoted cleanly. This is the single most common mistake teams make early on - building components in the default environment without a solution, then discovering they cannot move them.

### Managed vs. Unmanaged

Solutions exist in two forms:

| Type | Where it lives | What you can do | Purpose |
|---|---|---|---|
| **Unmanaged** | Development | Add, edit, remove components freely | Active authoring |
| **Managed** | Test, Production | Read-only. Cannot be edited directly. | Stable, sealed deployment artifact |

![Diagram explaining the Power Platform managed solution deployment model](/assets/posts/alm-copilot-studio-agents-foundation/alm-solution-evolution-diagram.png){: .shadow w="700" }
_In the Dev environment, components like Agents, Workflows, and Variables live inside an unmanaged solution (shown as an open box), where makers can freely edit them. The solution is then exported as a managed package (versioned v1.0.0, shown as a sealed, locked box). This managed package is deployed to both the Test and Prod environments, where it arrives as a read-only managed solution - indicated by locked icons and crossed-out edit pencils - meaning no one can modify the components directly in those environments. A bottom arrow emphasises that changes flow in one direction only: from Dev through the package to downstream environments, never backwards._

When you promote your agent, you export the solution from Dev as a **managed** package. This managed package is what gets imported into Test and later into Production. It is sealed - nobody can edit it in place. If a change is needed, it must be made in Dev, re-exported, and re-promoted. This one-way flow is what keeps Production stable.

### Setting Up Your Solution

Create your solution in the Dev environment **before** creating any agent assets. From that point on, every component must be created *inside* this solution.

Set it as your [preferred solution](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/preferred-solution) so that new components are automatically added to it rather than floating in the default solution where they risk being forgotten.

For more: [Solution concepts in Power Platform ALM](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm)

---

## Deploying With Confidence

### Pipelines Automate the Promotion

With your environments established and your solution containing all agent assets, the next question is: how does the solution actually move from Dev to Test to Prod?

You could do this manually - export a .zip from Dev, navigate to Test, import it, repeat for Prod. This works, but it is error-prone, undocumented, and does not scale. It also leaves no trace of what was deployed, when, or by whom.

[Power Platform Pipelines](https://learn.microsoft.com/en-us/power-platform/alm/pipelines) solve this. A pipeline is a pre-configured promotion path that connects your environments in sequence. Once set up, promoting your solution is a single action: select the solution, select the stage (Dev to Test, or Test to Prod), and deploy. The pipeline handles the managed export, the import into the target, and records the deployment in its history.

![Diagram showing the Power Platform Pipelines automated deployment process](/assets/posts/alm-copilot-studio-agents-foundation/alm_solution_pipeline_flow.png){: .shadow w="700" }
_A solution in the Dev environment is exported as a managed package, which feeds into a central pipeline (represented by a conveyor belt with gears). The pipeline handles two key tasks shown below it: resolving environment variables for each target and maintaining deployment history. From the pipeline, the managed solution is automatically deployed to both the Test and Prod environments, where the package is unpacked and installed as a managed solution (shown as a locked box with a puzzle piece slotting into place). This illustrates how Pipelines automates the export, configuration, and deployment of solutions across environments without manual intervention._

**What a pipeline gives you:**

- **Repeatability** - the same process every time, no manual steps to forget
- **Audit trail** - who deployed what, when, and to which environment
- **Rollback visibility** - deployment history shows exactly which version is in each environment
- **Guardrails** - you can require approvals before a deployment proceeds to the next stage

**What a pipeline does not do:**

- It does not validate that your agent works correctly after import - that is what evaluations are for
- It does not set environment-specific configuration values - those must be in place before the solution arrives
- It does not manage secrets - those live in Azure Key Vault, referenced through environment variables

For setup details: [Set up pipelines in Power Platform](https://learn.microsoft.com/en-us/power-platform/alm/set-up-pipelines)

### Configuration: Environment Variables

The principle is simple: nothing environment-specific gets hardcoded. API endpoints, SharePoint URLs, thresholds, feature flags - all go into [environment variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables).

Environment variables have two layers that are important to understand:

- **Definition** - the schema (name, data type, description). This travels with the solution.
- **Value** - the actual content. This is set per environment and does *not* travel with the solution.

This separation is what makes portability possible. When you import your managed solution into Test, it brings the variable definitions but not the values. The Test environment already has its own values configured. The same workflow runs unchanged across Dev, Test, and Prod because it reads its configuration from whichever environment it happens to be running in.

**Supported types:**

| Type | Use case |
|---|---|
| String | URLs, identifiers, configuration strings |
| Number | Thresholds, limits, numeric config |
| Boolean | Feature flags |
| Data source | SharePoint lists, Dataverse tables |
| Secret | Azure Key Vault references |

**The critical mistake to avoid:** do not set a current value on an environment variable inside the solution definition if that value will differ across environments. Values baked into the solution definition will override environment-specific values and silently break your portability. Set values directly in each target environment after import.

**Preparing variables before deployment:** When your pipeline promotes a solution to a new environment, the variable definitions arrive but the values do not. This means environment variable values must be configured in the target environment *before* the solution is imported - otherwise workflows that depend on those variables will fail at runtime. Include this as an explicit step in your promotion process: verify that every expected variable has a value in the target before deploying.

### How Values Are Supplied
 
There are two models depending on how you deploy:
 
*  **With Power Platform Pipelines (in-product):** When a solution containing environment variables is deployed, the pipeline prompts you to provide or confirm values for the target environment - just as a manual import would. If values already exist in the target, they are pre-filled. If they do not, you supply them at deployment time. For fully unattended scenarios, values must be pre-configured in the target environment before the pipeline runs.
 
* **With CI/CD pipelines (Azure DevOps or GitHub Actions):** You use a [deployment settings file](https://learn.microsoft.com/en-us/power-platform/alm/conn-ref-env-variables-build-tools) - a JSON file that maps each variable's schema name to its target-specific value. This file is passed as a parameter to the solution import task, pre-populating values during import without manual intervention. Generate it with `pac solution create-settings`, populate it per environment, and store it in source control.

```json
{
  "EnvironmentVariables": [
    { "SchemaName": "contoso_ApiEndpoint", "Value": "https://api-test.contoso.com" },
    { "SchemaName": "contoso_MaxRetries", "Value": "3" }
  ]
}
```

In both models, the principle is the same: the solution carries the variable definitions, and the target environment (or its settings file) supplies the values. The pipeline never embeds environment-specific configuration into the solution artifact itself.

For complementary context on what happens with environment variables during any solution import (which is what pipelines do under the hood), see:

- [Enter new values while importing solutions
](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables#enter-new-values-while-importing-solutions) - explains definition vs. value separation
- [Pre-populate connection references and environment variables](https://learn.microsoft.com/en-us/power-platform/alm/conn-ref-env-variables-build-tools) - covers the deployment settings file for CI/CD automation

### Secrets: Azure Key Vault Integration

For secrets - API keys, tokens, credentials - [secret environment variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables-azure-key-vault-secrets) backed by Azure Key Vault provide a secure, auditable approach. The agent references a Key Vault secret rather than holding the value directly, and the platform resolves it at runtime. When a key rotates, you update Key Vault - no solution change or redeployment needed.

Structure your vaults per environment tier (`kv-agent-dev`, `kv-agent-test`, `kv-agent-prod`) with identical secret names across them. Only the vault reference in each environment's variable value differs. The workflow logic is identical everywhere - it asks for a secret by name, and the environment resolves it to the correct vault.

---

## Knowing It Works: Evaluations

Deploying correctly does not guarantee behaving correctly. Evaluations close that gap.

An [evaluation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro) is a defined set of test inputs and expected outputs that measures whether your agent is selecting the right tools, triggering the right logic, and producing acceptable responses. It serves as your quality gate - giving confidence that a promotion is safe.

### Where Evaluations Fit in Your ALM Process

Evaluations are not a standalone activity. They integrate directly into the promotion lifecycle:

- **After changes in Dev** - did anything regress? Run evals before exporting.
- **Before promotion to Test** - evals passing is the signal that a solution is ready to move forward.
- **On a schedule in Preview** - will the next platform update break us? Automated scheduled evals answer this continuously.
- **After import in the target** - did the deployment land cleanly? A post-deployment smoke eval confirms the agent is functional in its new environment.

![Diagram mapping quality evaluation checkpoints across the four-stage Power Platform deployment pipeline (Dev, Test, Preview, Prod)](/assets/posts/alm-copilot-studio-agents-foundation/alm-evaluation-placement-diagram.png){: .shadow w="700" }
_Each stage has a corresponding quality gate shown on a timeline below. In Dev, quality evaluations run after changes are made, producing a quality report and results. In Test, a quality gate runs before promotion to the next stage, outputting a pass/fail result. In Preview, scheduled regression evaluations run periodically, generating regression reports and trend data. In Prod, a post-import smoke test verifies critical functionality immediately after deployment, producing a smoke test report and alerts. The diagram emphasises that quality is validated at every stage of the promotion flow, not just at the end._

### Automating Evaluations in Your Pipeline

Evaluations can be triggered programmatically, which means they can become an automated gate in your promotion pipeline. Rather than relying on a human to remember to run them, you configure the pipeline to execute evaluations after each deployment and block further promotion if results fall below a threshold.

This transforms evaluations from a manual best practice into an enforced quality gate - no deployment reaches Production unless the agent demonstrably works.

For implementation guidance, see:
- [About agent evaluation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro)
- Also check: [Copilot Studio Kit - test capabilities](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-test-capabilities)

The key takeaway is that incorporating evaluations early in your ALM strategy - rather than adding them later - gives you a reliable signal at every stage of promotion.

---

## Additional Considerations

### Version Control With Git

Copilot Studio supports [native Git integration](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/connecting-to-git). You connect your solution to a Git repository where components are stored as individual files, giving you version history, change attribution, and collaboration capabilities across makers.

This becomes particularly relevant for multi-person teams: branching, merging, pull request reviews, and visibility into who changed what and when. The setup itself is well documented - the more practical question is how to structure collaboration when multiple makers are editing the same agent simultaneously.

### Modular Solutions

As an agent grows - hundreds of knowledge sources, multiple teams contributing, frequent tool updates - the single-solution model starts to strain. The platform supports component collections and layered solutions that allow teams to ship pieces independently without coupling unrelated changes.

This is a future concern for most teams. Get the foundation right first - modular strategies only pay off when the basics are solid.

---

## Before You Promote: A Checklist

- [ ] All agent assets live inside the solution
- [ ] Solution set as preferred solution in Dev
- [ ] No hardcoded environment-specific values anywhere
- [ ] Environment variable values configured in the target environment
- [ ] Secrets are in Key Vault, referenced via secret environment variables
- [ ] Pipeline configured with correct stage sequence
- [ ] Solution exported as managed for Test and Prod
- [ ] Evaluations pass before and after deployment
- [ ] Smoke test passes in the target after import

---

## The Payoff

When this is set up correctly, promoting your agent is a single pipeline action. The same logic runs against the correct endpoints, credentials, and data for each environment automatically. Secrets rotate without redeployment. Platform updates are validated early. Emergency fixes have a clean path that preserves ongoing development work.

The setup takes a few hours. The confidence it provides compounds every week the agent is in production.

---
