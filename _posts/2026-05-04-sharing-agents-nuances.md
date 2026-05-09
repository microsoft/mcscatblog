---
layout: post
title: "Sharing a Copilot Studio Agent: A Field Guide from Pilot to Full Rollout"
date: 2026-05-04
categories: [copilot-studio, governance]
tags: [sharing, governance, alm, permissions, authentication, dataverse, rollout]
description: "Sharing a Copilot Studio agent is one operation, but its consequences span authoring, runtime sign-in, and channel discoverability. This field guide walks the misconception customers hit on the path from pilot to full rollout."
author: kahlilfitz
image:
  path: /assets/posts/sharing-agents-nuances/header.png
  alt: "A Copilot Studio agent surrounded by users, share and link icons, and a globe, conveying the multiple surfaces through which an agent reaches its audience"
---

When an organization moves a Copilot Studio agent from a small pilot into broad production, sharing is one of the first controls makers reach for. It is also one of the most commonly misunderstood.

A pattern recurs across customer engagements: a maker shares an agent with a specific security group, and weeks later discovers that users outside that group are also chatting with the agent. The maker's first instinct is to assume the share dialog has misbehaved. It has not. The share dialog is doing exactly what it was designed to do, which is something quite different from what the maker assumed.

The Microsoft Learn documentation describes the [share workflow procedurally](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-share-bots) and is the right reference for click-paths. This post addresses the conceptual gap underneath: what sharing actually controls, what it does not control, and how those distinctions become more consequential at each stage of a rollout.

## The misconception

> The share list does not gate runtime access to a Copilot Studio agent by default. Sharing controls who can collaborate on or co-author the agent. Runtime sign-in is enforced by the agent's authentication configuration and the channel through which the user reaches the agent.
{: .prompt-warning }

This is the single most consequential nuance to internalize. A user who is not on the share list can still chat with an agent if (a) the agent's authentication is left at its default, and (b) the user can reach the agent through a published channel. The Learn documentation discloses this technically, in its prerequisites:

> User authentication for the agent is configured to **Authenticate manually**, with **Microsoft Entra ID** as the provider. **Require users to sign-in** is turned on.

What the documentation does not state in plain terms is the inverse: when those prerequisites are not met, the share-for-chat list does nothing for runtime access. The dialog still works, the list still populates, and the configuration still appears to govern access. It does not.

## Three independent gates

A more accurate mental model recognizes that runtime access to a Copilot Studio agent is governed by three independent gates. Sharing only touches one of them.

| Gate | Controlled by | Function |
|------|---------------|----------|
| **Authoring access** | Share dialog (Dataverse permissions) | Determines who can edit, configure, publish, and share the agent |
| **Runtime sign-in** | Authentication settings + *Require users to sign in* | Determines whether a user is allowed to converse with the agent once they reach it |
| **Discoverability and reach** | Channel configuration: Teams catalog, DirectLine, M365 Copilot publishing, link distribution | Determines how users find or connect to the agent in the first place |

The share-for-chat option overlaps with the second gate, but only when the [authentication configuration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication) is set to manual Entra ID with sign-in required. In every other configuration, including the default *Authenticate with Microsoft*, the share-for-chat list is informational, not enforcing.

## What the share experience exposes in the current UI

Before following these gates through a rollout, it is worth grounding the model in the controls Copilot Studio actually exposes. Two surfaces matter: the channel availability dialog and the share dialog itself.

### Channel availability

For an agent configured to reach Microsoft Teams and Microsoft 365 Copilot, channel availability is configured separately from sharing. This is where the discoverability gate is defined.

![The Microsoft 365 and Microsoft Teams channel configuration panel, describing how publishing to Microsoft 365 Copilot enables discoverability via the Agent Store, and how Teams publishing makes the agent available in chats, meetings, and channels for users it has been shared with or that admins have approved](/assets/posts/sharing-agents-nuances/channel-dialog-main.png){: .shadow w="700" }
_The Microsoft 365 and Microsoft Teams channel panel. Toggling availability here is independent of the share dialog._

The Teams availability options expand the picture further. The maker can copy a link, download a Teams app package, or choose where the agent should appear in the in-tenant store.

![The Teams availability dialog showing options to get a link, download a .zip file, and choose store visibility, either show to teammates and shared users, or show to everyone in the org subject to admin approval](/assets/posts/sharing-agents-nuances/channel-dialog-availability.png){: .shadow w="700" }
_The Teams availability sub-dialog. Store visibility, including org-wide visibility after admin approval, is decided here, not from the share dialog._

Two store-visibility options are available:

- **Show to my teammates and shared users** — appears under *Built with Power Platform*. Visibility is bounded by the agent's existing share list, but reach is governed by the channel, not the share dialog.
- **Show to everyone in my org** — appears under *Built by your org* after admin approval. This is a tenant-level operation that requires explicit administrative review and is independent of the share list.

Both options sit in the discoverability gate. Neither one is configured from the share dialog, and neither one inherits scope from sharing decisions made there.

### The share dialog

The share dialog itself is reached from the agent's overflow menu. The first thing it displays, for an agent published to Teams or M365 Copilot, is a banner that telegraphs the misconception this post is addressing:

![The Share dialog for an agent named 'Weather Check Assistant', showing a banner that reads 'This agent is configured for Microsoft Teams and Microsoft 365 Copilot. Make sure your users are in security groups that can access the agent in Teams.' The dialog has a New Users search field, an Existing users list with the Owner and Everyone in organization, and an empty User permissions panel on the right](/assets/posts/sharing-agents-nuances/channel-dialog-manage.png){: .shadow w="700" }
_The Share dialog. The banner at the top is the product itself acknowledging that share scope and Teams security are independent surfaces._

> "This agent is configured for Microsoft Teams and Microsoft 365 Copilot. Make sure your users are in security groups that can access the agent in Teams."

The product itself is acknowledging that the share list and the Teams security boundary are independent surfaces. Adding a user here does not place that user into the security groups Teams uses to enforce access. The maker is being asked to coordinate two systems that look like one.

### The three permission roles

When a user or group is added to the share list, the dialog exposes three independent permission types. Each can be granted independently, but some imply others. The role choices materially affect both what the user can do and what Dataverse security roles get assigned automatically in the environment.

#### End user access

End user access permits the user to chat with the agent or allow it to operate autonomously on their behalf, and to manage connections used by the agent. This last point is a meaningful expansion beyond the historical "share for chat" framing: an end user can take connection-related actions, not only send messages.

![The Share dialog with a user added and granted End user access only. The permissions panel shows End user access checked with the description 'Can manage connections and configure the agent to either chat with it or allow it to operate autonomously on their behalf', along with unchecked Analytics viewer and Editor access options](/assets/posts/sharing-agents-nuances/channel-dialog-manage-add-end-user.png){: .shadow w="700" }
_End user access. The role grants chat capability and connection management on the user's behalf, not just the ability to converse._

#### Editor access

Editor access grants full collaborative authoring: view, edit, configure, share, and publish (but not delete). Granting this role implicitly grants End user access and Analytics viewer. It also automatically assigns several [Dataverse security roles](https://learn.microsoft.com/en-us/power-platform/admin/security-roles-privileges) to the user, including Power Automate user, Environment maker, and Agent transcript viewer, since these are required to author agents in the environment.

This auto-assignment is consequential. Granting Editor access to a user who is not already an Environment Maker is not a localized action confined to one agent. It elevates the user's permissions across the entire environment.

![The Share dialog with a user being granted Editor access. The permissions panel shows End user access auto-checked, Analytics viewer auto-checked, and Editor access checked. The Editor description reads 'Can view, edit, configure, share and publish the agent but not delete it' and notes that Editors are automatically assigned to security roles required to use agents in the environment, including Power Automate user, Environment maker, and Agent transcript viewer](/assets/posts/sharing-agents-nuances/channel-dialog-manage-add-editor.png){: .shadow w="700" }
_Editor access. Granting this role auto-assigns Power Automate user, Environment maker, and Agent transcript viewer security roles at the environment level._

#### Analytics viewer

Analytics viewer is a narrower role. It grants read-only access to the agent's Analytics page without granting any authoring or chat capability. It auto-assigns the Agent Viewer security role at the environment level, and admins can optionally assign [Bot Transcript Viewer](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-share-bots#assign-the-bot-transcript-viewer-security-role-during-agent-sharing) to extend access to conversation drill-downs.

![The Share dialog with a user being granted Analytics viewer access. The permissions panel shows End user access unchecked, Analytics viewer checked with the description 'Can view Analytics but not edit, configure, share, publish, or delete the agent', and an explanatory note that Analysts are automatically assigned the Agent Viewer security role and that admins can additionally assign the Agent transcript viewer role for chat session transcripts](/assets/posts/sharing-agents-nuances/channel-dialog-manage-add-analytics.png){: .shadow w="700" }
_Analytics viewer. Read-only access to Analytics with no chat or authoring capability._

### Mapping back to the three gates

The two surfaces split cleanly across the gate model. The channel availability dialog drives **discoverability and reach**. The share dialog drives **authoring access** through its Editor and Analytics viewer roles. The End user role overlaps with **runtime sign-in** only when manual Entra ID authentication is configured with *Require users to sign in* enabled; in any other configuration, runtime sign-in is governed by the authentication settings elsewhere in the agent.

With these surfaces in mind, the remainder of this post follows the lifecycle of a typical agent through three stages and shows how each gate breaks down at different points in the rollout.

## Scenario 1 — Pilot stage

**Profile:** A consulting firm builds an HR FAQ agent that answers questions about leave policy, expense rules, and onboarding. The maker is a senior HR partner. The agent is grounded on a SharePoint site she owns. The pilot includes eight HR colleagues over two weeks.

**Outcome:** A flawless pilot. Every test conversation succeeds. The executive sponsor authorizes rollout to the broader HR organization.

### What is actually true

The share list was never gating anything. Authentication was left at the default *Authenticate with Microsoft*. The *Require users to sign in* option was not enabled. The agent functioned correctly for the pilot group because of three independent coincidences:

1. Pilot users were all in the HR organizational unit and held access to the same SharePoint site the agent was grounded on.
2. Pilot users were all in the maker's Power Platform environment, granting them access to the agent surface.
3. The maker's personal connections to backend systems happened to return data that pilot users were authorized to see.

None of these coincidences are properties of the share configuration. They are properties of the audience. The pilot validates that the agent works for users who happen to share the maker's ACL footprint — not that the share list, the authentication configuration, or the underlying connections behave correctly under broader conditions.

### The pilot lesson

Pilots are too small and too homogeneous to expose sharing problems. Green-light decisions made on pilot data are often validating coincidences rather than controls. Before promoting an agent beyond the pilot, the maker should be able to articulate, for any given pilot user, *why* that user can chat with the agent — and which of the three gates is responsible. If the answer is "they happened to be in my environment," the agent has not been validated against any of the gates that will matter at the next stage.

## Scenario 2 — Limited rollout stage

**Profile:** An insurance carrier extends a claims-status lookup agent from a 10-person pilot in a Development environment to the full Claims operations team (approximately 400 users) in a Test environment. The team migrates the agent via a solution import, manually re-shares with the *Claims-Operations* security group in Test, and uploads the agent to the [Microsoft Teams app catalog](https://learn.microsoft.com/en-us/microsoftteams/manage-apps) so it appears in the organization's approved apps list.

**Outcome:** Two days after rollout, an analyst from Underwriting, who is not in the share list and not on the Claims operations team, sends a message to the maker: "I tried the new claims agent today. It's useful, but it's surfacing data I should not have access to."

### What is actually true

Three independent factors converged to produce this outcome:

1. **Channel-level discoverability.** Uploading the agent to the Teams app catalog made it discoverable to every user in the tenant who could browse approved apps. The catalog publication is a tenant-wide operation; it does not respect the agent's share list.
2. **Authentication configuration.** The agent was still configured for *Authenticate with Microsoft* without *Require users to sign in*. As established earlier, in this configuration the share list does not gate runtime access. Any signed-in tenant user who reached the agent was permitted to converse with it.
3. **Connection-level data scope.** The connection to the claims database was a maker-owned personal connection that returned any record the underlying API would return. The connection had no awareness of the agent's intended audience and no row-level filtering scoped to the user. Once a non-claims user reached the agent, the connection happily served them claims data.

Each of these is a different gate. Sharing the agent with *Claims-Operations* addressed none of them. The maker's mental model, that the share list defined the audience, was overridden three times over.

### The ALM dimension

This stage typically introduces the first crossing between Power Platform environments. Solution-based migration from Development to Test does not carry sharing configuration with it. Coauthors and chat users must be re-shared in the destination environment. Connection references must be re-mapped to environment-appropriate connections, knowledge sources may need to be re-pointed if their underlying URLs differ between environments, and any custom Teams app manifest must be re-submitted.

For a deeper treatment of the connection-permissioning aspect specifically, see [How to Ensure Users Can Create Connections for Copilot Studio Agents]({% post_url 2025-11-14-unlocking-seamless-access-how-to-ensure-users-can-create-connections-for-copilot-studio-agents %}). That post addresses connection authorization as a first-class concern, which becomes increasingly important as the audience grows.

### The limited rollout lesson

As soon as an agent is published to a channel, that channel becomes the primary discoverability gate. Sharing inside Copilot Studio does not propagate to the channel layer. Underlying connections do not inherit the agent's share scope. The combination produces a counterintuitive but common outcome: an agent that is "shared with X" but reachable, and operational, for far more users than X.

## Scenario 3 — Full rollout stage

**Profile:** A healthcare organization rolls out a clinical-policy lookup agent to its full population of approximately 12,000 clinicians and administrative staff. Distribution is through both the Teams app catalog and Microsoft 365 Copilot publishing. The Production environment is configured as a [Managed Environment](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview) with sharing limits, DLP policies, and audit enabled. The agent has been in production for six months and is treated as critical infrastructure.

**Outcome:** Three separate incidents within a single quarter:

### Incident A — Identity continuity

The maker who built the agent takes parental leave. Within 48 hours, the agent stops returning policy results for any user. The agent's behavior is silent: it does not throw a visible error; it simply returns "I could not find information on that question."

Root cause: a custom connector connection that the maker owned silently expired. The agent depended on her individual identity to reach the policy backend. With her account inactive, the connection could no longer authenticate.

The remediation requires re-establishing the connection under a [service principal](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals), which is a multi-day procurement and approval process, and updating the agent's connection reference to the new identity. During the remediation window, an organization-critical agent is non-functional.

### Incident B — ACL inheritance

A new contractor cohort is onboarded. They can sign in to the agent and converse with it without errors. However, for approximately half of their queries, the agent responds with "I could not find information on that topic."

Root cause: the contractor security group does not have read access to a subset of the policy SharePoint sites that ground the agent. The agent's share configuration worked precisely as intended — the contractors were granted chat access. The knowledge source's access control list, however, was independent. The contractors reached the agent, but the agent's grounding queries returned nothing for them.

This failure mode is particularly difficult to triage because it manifests as a quality-of-answer problem rather than a permissions problem. The agent does not announce that it has been blocked from data; it simply has nothing to say.

### Incident C — Distribution beyond the share dialog

The organization decides to extend access to a partner organization in a B2B arrangement. The team attempts to share the agent with the partner's tenant using "Everyone in *Organization*" and finds that the operation is blocked by the Managed Environment sharing limit.

The team discovers, in the course of remediation, that distribution at this scale does not run through the share dialog at all. Cross-tenant Teams catalog publishing, M365 Copilot agent approval, and DirectLine-based custom integrations each have their own approval flows, license requirements, and governance gates. The share dialog was never the appropriate instrument for the operation.

### The full rollout lesson

At full rollout, sharing is rarely the limiting factor. The dominant concerns are:

- **Identity continuity.** Whose connections does the agent depend on, and what happens when those identities change state? Production agents must run on service-principal or environment-shared identities. Personal connections are operationally unsustainable.
- **ACL inheritance.** Sharing the agent with a group does not extend that group's access to the agent's knowledge sources, connectors, or referenced data systems. Each downstream dependency enforces its own access controls and must be designed for the production audience explicitly.
- **Channel-level distribution.** Reaching a broad or external audience runs through channel and tenant-level approval flows, not the share dialog. Managed Environments sharing limits, DLP policies, and tenant approval requirements all operate at this layer.

For makers exploring authentication configuration choices in production, the related discussion in [You Don't Need Manual Auth (And Didn't Even Know It)]({% post_url 2025-11-18-you-dont-need-manual-auth %}) is worth reviewing. The choice between *Authenticate with Microsoft* and *Authenticate manually* materially affects whether the share list functions as a runtime gate, and the trade-offs are not always obvious from the documentation alone.

## Patterns that hold across all three stages

Several patterns recur at every stage of the rollout, and recognizing them in advance helps anticipate the failure modes that will surface as the audience expands.

| Pattern | Pilot | Limited rollout | Full rollout |
|---------|-------|-----------------|--------------|
| **Sharing is one of three gates** | Audience too small to expose the gap | Misconception surfaces as cross-team access | Channel, authentication, and license gates dominate |
| **Identity drift** | Works because users approximately equal maker | Works only if connections move to environment-level identity | Sustainable only with service-principal or shared identity |
| **ACL inheritance** | Coincidental alignment with maker's footprint | Surfaces as inconsistent answer quality | Must be designed explicitly for the production audience |
| **Environment crossing as a sharing reset** | Not yet relevant | First re-permissioning ritual | Pipelines or repeated manual re-sharing |
| **Editor access scope** | Liberal, as the team is small | Deliberate, as authoring expands | Near zero in Production, as authoring should occur in lower environments and ship via [deployment pipelines](https://learn.microsoft.com/en-us/power-platform/alm/pipelines), not casual sharing |

The throughline is that *sharing alone is never a complete control surface.* It is one input into a system whose actual access posture is determined by the combination of authentication configuration, channel publication, downstream dependency permissions, and identity continuity.

## Pre-flight checklist by stage

The following questions are worth answering before each transition. They are intended as a structured way to surface the assumptions a pilot validates only by coincidence.

### Before pilot

- What authentication configuration is the agent using, and does it match the production target?
- Are the maker's connections suitable for production, or will they need to be re-established under a different identity?
- Are pilot users a representative sample of the production audience's ACL footprint, or are they all in the maker's natural access scope?

### Before limited rollout

- Has the agent been migrated to a non-Development environment, and have shares, connection references, and knowledge sources been re-permissioned in the destination environment?
- If the agent is being published to a channel (Teams catalog, DirectLine, custom website), has the discoverability scope of that channel been considered alongside the share scope?
- Does the authentication configuration match what is required for the share list to function as a runtime gate, and is that the intended behavior?
- Do the agent's connections and knowledge sources enforce data-level access appropriate for the broader audience, or do they rely on the audience matching the maker's permissions?

### Before full rollout

- Are all connections owned by service principals or environment-level shared identities, with continuity plans for individual identity changes?
- Do all knowledge sources, custom connectors, and external dependencies have access control lists that match the production audience, including contractor and partner cohorts?
- Has the distribution mechanism (Teams catalog, M365 Copilot, DirectLine, custom embedding) been approved through the appropriate tenant-level governance flows?
- Are Managed Environments sharing limits, DLP policies, and audit configurations aligned with the agent's intended audience and the organization's compliance requirements?
- Is there an ownership and operational model in place for the agent that does not depend on any individual maker's continued availability?

## Closing

The share dialog is a useful instrument, but a narrower one than its name suggests. Treating it as the master switch produces failures that scale with the audience. The pre-flight questions above are the smallest investment that protects against them.

What sharing-related surprises have you encountered on the path from pilot to production? If you have run into a failure mode not covered here, the comments are open.
