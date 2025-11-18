---
layout: post
title: "You Probably Don't Need Manual Authentication (And Didn't Even Know It)"
date: 2025-11-18
categories: [copilot-studio, authentication]
tags: [manual-auth, sso, authentication, best-practices, web-chat]
description: Why most Copilot Studio agents don't need manual authentication, and the myths keeping you from simpler configurations.
author: adilei
image:
  path: /assets/posts/manual-auth-not-needed/header.png
  alt: "OAuth suffering flowchart"
  no_bg: true
---

Let's talk about manual authentication in Copilot Studio for a quick moment. You've probably configured it. Maybe you're configuring it right now. But here's the thing: **you probably don't need it**.

"Wait, what?" I hear you say. "I'm already on page 23 of the documentation and halfway through my second app registration!"

Yes, you do need authentication. But you probably don't need *manual* authentication. Bear with me for a sec.

## What Is Manual Authentication, Really?

[Manual authentication](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication#authenticate-manually) in Copilot Studio lets you integrate with any OAuth 2.0 provider—Entra ID, Google, Facebook, or that custom identity provider your organization built in 2012 and refuses to retire. It's powerful and flexible.

But with great power comes... a lot of configuration complexity.

When you enable manual authentication, you need to:
1. Create **two separate app registrations** ([per best practices](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-sso?tabs=webApp))
2. Understand complex settings like `Token Exchange URL` (it's not even a URL, man!!!)
3. Deal with the fact that **none of this is solution-aware for ALM**, i.e., someone with permissions in prod would need to manually update the app registration details.

## The Better Way: Authenticate with Microsoft

Copilot Studio has a built-in authentication option called [**"Authenticate with Microsoft"**](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication#authenticate-with-microsoft) that's specifically designed for Entra ID scenarios. And it's *way* simpler.

### Why It's Better

✅ **No App Registration for Teams, M365 Copilot & SharePoint**: When using Teams, Microsoft 365 Copilot, or SharePoint as channels, authentication "just works" with zero configuration  
✅ **Simpler App Registration for Web**: Only one app registration needed, with minimal configuration (see below)   
✅ **Tenant Graph Grounding**: Enables higher quality responses [grounded in SharePoint and Graph Connectors](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio#tenant-graph-grounding)

## So Why Do People Still Use Manual Auth for Employee-Facing Scenarios?
If "Authenticate with Microsoft" is so much simpler for employee-facing agents with Entra ID, why is manual authentication still so common in the enterprise?

Great question. The answer comes down to two persistent myths that keep people from discovering the easier path. Let's bust them.

## Myth #1: "I Need Manual Auth for WebChat"

This is probably the biggest myth keeping people from the simpler path.

**Myth**: "If I want to embed my agent on a website, I need to use manual authentication."

**Reality**: Nope! You can absolutely use "Authenticate with Microsoft" with web chat.

We (Microsoft) provides official samples showing exactly how to do this:

- [**React Web Chat Sample**](https://github.com/microsoft/Agents/tree/main/samples/nodejs/copilotstudio-webchat-react) - Full React implementation with Entra ID authentication
- [**Web Client Sample**](https://github.com/microsoft/Agents/tree/main/samples/nodejs/copilotstudio-webclient) - Vanilla JavaScript approach

Both samples demonstrate:
- User sign-in with Entra ID via pop-up
- Token exchange between your web app and Copilot Studio
- Embedded WebChat with authenticated conversations

![WebChat with Authentication](/assets/posts/manual-auth-not-needed/webchat.png){: .shadow w="700" h="400"}
_Authenticated WebChat using "Authenticate with Microsoft". You don't see authentication here, but believe me, it happened_

The configuration is simpler because you only need:
1. One app registration for your web app (single-page application type)
2. "Authenticate with Microsoft" enabled in Copilot Studio
3. The `CopilotStudio.Copilots.Invoke` API permission

No dual app registration setup. No complex OAuth flows. 

## Myth #2: "I Need the User's Access Token for Downstream APIs"

This is the other big one.

**Myth**: "My agent needs to call custom APIs with the user's credentials, so I need manual authentication to get `System.User.AccessToken`."

**Reality**: Custom connectors support SSO with Entra ID authentication!

Here's what most people don't know: custom connectors can use the same seamless SSO/consent experience as first-party connectors like Office 365 Users or SharePoint. When properly configured with Entra authentication, your custom connector will:

1. Show users a consent card (not the dreaded connection manager)
2. Obtain tokens on behalf of the user automatically
3. Call your custom API with the user's credentials
4. Handle token refresh automatically

![Consent Card](/assets/posts/custom-connector-sso/custom-connector-todos.png){: .shadow w="700" h="400"}
_The consent card experience - also available for your custom connectors_

For a deep dive into setting this up, stay tuned for an upcoming post on enabling SSO for custom connectors in Copilot Studio. (Yes, I just did the "stay tuned" thing. I'm sorry. But it's actually coming soon, I promise!)

### Why Custom Connectors Beat Manual Auth

Custom connectors have two major advantages over manual authentication:

**Token Exposure**: Manual auth exposes `System.User.AccessToken` to makers. Custom connector SSO keeps tokens in the connector framework and makers never see them.

**Single Resource Limitation**: Manual auth supports **one OAuth resource**. Need both Graph API for SharePoint as Knowledge AND your custom API? Can't do it. 

For example, imagine you're building an HR assistant that needs to:
- Search employee documents in SharePoint (requires Graph API: `Files.Read.All, Sites.Read.All`)
- Retrieve vacation balances from your custom HR API (requires your API: `api://your-hr-api/your-custom-scope`)

With manual auth, even if you configure both scopes, you'll only get a token with scopes belonging to a single resource (e.g. Graph)

With custom connectors, you'd use:
- SharePoint Knowledge (no need to configure scopes manually)
- Custom HR connector (configured for `api://your-hr-api/your-custom-scope`)

Both work seamlessly, each with its own resource. Problem solved.

## Key Takeaways

- **Manual auth is mostly useful for B2C** - Use it when you need non-Entra providers (Google, Facebook, custom OAuth)
- **"Authenticate with Microsoft" is simpler for B2E** - Zero config for Teams/M365/SharePoint, enables Tenant Graph Grounding
- **Web chat works with "Authenticate with Microsoft"** - Official samples show how
- **Custom connector SSO > Manual auth** - Multiple OAuth resources, no token exposure, same seamless consent experience
- **Single resource = biggest limitation** - Manual auth locks you to one OAuth resource; custom connectors support unlimited resources

---

*Have you been using manual auth when you didn't need to? Share your horror config stories here

---
