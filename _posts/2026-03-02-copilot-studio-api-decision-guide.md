---
layout: post
title: "Every Path to Integrating Your Copilot Studio Agent"
date: 2026-03-02
categories: [copilot-studio, tutorial]
tags: [direct-line, webchat, m365-agents-sdk, sso, embed, teams, api, decision-guide, byo-ui]
description: "An interactive decision wizard that helps you pick the right integration pattern for your Copilot Studio agent, from no-code embeds to native mobile apps, custom UIs, and server-side connectors."
author: adilei
image:
  path: /assets/posts/copilot-studio-api-decision-guide/header.png
  alt: "Choose your own API adventure"
  no_bg: true
published: true
---

When I was a kid, I thought [*Choose Your Own Adventure*](https://en.wikipedia.org/wiki/Choose_Your_Own_Adventure) and [*Fighting Fantasy*](https://en.wikipedia.org/wiki/Fighting_Fantasy) gamebooks were the coolest thing. *[The Warlock of Firetop Mountain](https://en.wikipedia.org/wiki/The_Warlock_of_Firetop_Mountain)*, *[Citadel of Chaos](https://en.wikipedia.org/wiki/The_Citadel_of_Chaos)*, that whole world. You'd read a page, make a choice, flip to a new section, and the story would branch in a completely different direction. They were also brutally hard, and I'll admit I peeked ahead more than a couple of times to avoid walking straight into Zagor's dragon.

I think about those books sometimes when someone asks me: "How do I get my Copilot Studio agent into my website or app?" Because the landscape is wider than it looks. You've got no-code embeds, Teams publishing, self-hosted WebChat with two distinct APIs behind it (Direct Line and the M365 Agents SDK), server-side clients, and even the option to skip WebChat entirely and bring your own UI framework. Each path has different strengths, different authentication models, and different levels of effort. Unlike Fighting Fantasy, we don't want you picking an integration strategy only to end up lost in the [Maze of Zagor](https://en.wikipedia.org/wiki/The_Warlock_of_Firetop_Mountain) three sprints in, out of stamina, with the wrong keys.

The good news is that the branching structure actually works here. Three or four questions, and the right answer falls out naturally. So instead of writing another comparison table that you'll skim and forget, I built a small interactive wizard. Answer the questions, land on a recommendation, jump straight to a working code sample. No peeking required.

---

## The Wizard

<div id="api-wizard">
  <div id="wizard-card">
    <div id="wizard-progress"></div>
    <div id="wizard-content"></div>
    <div id="wizard-nav"></div>
  </div>
</div>

<style>
  #api-wizard {
    margin: 1.5rem 0 2.5rem;
  }

  #wizard-card {
    background: var(--card-bg);
    border: 1px solid var(--main-border-color, rgba(128, 128, 128, 0.2));
    border-radius: 0.75rem;
    padding: 1.75rem 1.5rem 1.25rem;
    box-shadow: var(--card-shadow);
    max-width: 100%;
  }

  #wizard-progress {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .wizard-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--main-border-color, rgba(128, 128, 128, 0.3));
    transition: background 0.2s;
  }

  .wizard-dot.active {
    background: var(--link-color);
  }

  .wizard-dot.done {
    background: var(--link-color);
    opacity: 0.5;
  }

  #wizard-content h3 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
    color: var(--heading-color);
  }

  .wizard-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .wizard-btn {
    position: relative;
    display: block;
    width: 100%;
    padding: 0.85rem 1.15rem;
    background: var(--main-bg);
    color: var(--text-color);
    border: 1px solid var(--main-border-color, rgba(128, 128, 128, 0.2));
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1.05rem;
    font-weight: 500;
    text-align: left;
    transition: background 0.15s, transform 0.1s;
    font-family: inherit;
    line-height: 1.4;
  }

  .wizard-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 2px;
    border-radius: inherit;
    background: var(--post-frame-gradient, linear-gradient(90deg, #0078D4 0%, #5B8DEF 18%, #7F39FB 36%, #C26CF3 54%, #D83B73 72%, #FF8C00 100%));
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: 1;
  }

  .wizard-btn:hover::before {
    opacity: 1;
  }

  .wizard-btn:hover {
    border-color: transparent;
    transform: translateX(4px);
  }

  .wizard-result {
    text-align: center;
    padding: 0.5rem 0;
  }

  .wizard-result .result-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--label-color);
    margin-bottom: 0.25rem;
  }

  .wizard-result .result-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--heading-color);
    margin-bottom: 0.5rem;
  }

  .wizard-result .result-summary {
    color: var(--text-color);
    margin-bottom: 1.25rem;
    font-size: 0.95rem;
  }

  .wizard-jump-btn {
    display: inline-block;
    padding: 0.6rem 1.5rem;
    background: var(--link-color);
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.95rem;
    font-family: inherit;
    transition: opacity 0.15s;
    text-decoration: none;
  }

  .wizard-jump-btn:hover {
    opacity: 0.85;
  }

  #wizard-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    min-height: 2rem;
  }

  .wizard-back-btn {
    background: none;
    border: none;
    color: var(--link-color);
    cursor: pointer;
    font-size: 0.9rem;
    font-family: inherit;
    padding: 0.25rem 0;
  }

  .wizard-back-btn:hover {
    text-decoration: underline;
  }

  .wizard-restart-btn {
    background: none;
    border: none;
    color: var(--label-color);
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    padding: 0.25rem 0;
  }

  .wizard-restart-btn:hover {
    color: var(--link-color);
  }

  .wizard-back-link {
    display: inline-block;
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }
</style>

<script>
(function() {
  var tree = {
    q1: {
      question: "Who is your agent for?",
      options: [
        { label: "For your employees (internal)", next: "q2-emp" },
        { label: "For your customers (external)", next: "q2-cust" }
      ]
    },
    "q2-emp": {
      question: "Where do you need to expose it?",
      options: [
        { label: "Microsoft 365 / Teams only", next: "teams" },
        { label: "On the web (website or web app)", next: "q3-emp" }
      ]
    },
    "q3-emp": {
      question: "What kind of chat experience do you want?",
      options: [
        { label: "No code \u2014 just embed what Microsoft provides", next: "nocode-embed" },
        { label: "Some code \u2014 self-host Microsoft\u2019s WebChat library", next: "webchat-emp" },
        { label: "Full control \u2014 bring my own UI framework", next: "byo-ui" }
      ]
    },
    "q2-cust": {
      question: "Where do you need to expose it?",
      options: [
        { label: "On the web (website or web app)", next: "q3-cust" },
        { label: "Native mobile app (Android, iOS, Windows)", next: "native-mobile" },
        { label: "Server-side connector (backend)", next: "sdk-server" }
      ]
    },
    "q3-cust": {
      question: "What kind of chat experience do you want?",
      options: [
        { label: "No code \u2014 just embed what Microsoft provides", next: "nocode-embed" },
        { label: "Some code \u2014 self-host Microsoft\u2019s WebChat library", next: "webchat-dl-cust" },
        { label: "Full control \u2014 bring your own UI (search box, inline answer, etc.)", next: "byo-ui-cust" }
      ]
    },
    teams: {
      leaf: true,
      name: "No API Needed (Publish to Teams/M365)",
      summary: "Your agent runs in Teams out of the box. No code, no API, no token management.",
      section: "no-api-needed-publish-to-teams"
    },
    "nocode-embed": {
      leaf: true,
      name: "Microsoft-Hosted WebChat (No-Code)",
      summary: "Copy an embed snippet from the portal. Zero JavaScript, zero build step.",
      section: "microsoft-hosted-webchat-no-code"
    },
    "webchat-emp": {
      leaf: true,
      name: "Self-Hosted WebChat (Employee-Facing)",
      summary: "Host WebChat yourself for full styling control and authentication flexibility.",
      section: "self-hosted-webchat-employee-facing"
    },
    "byo-ui": {
      leaf: true,
      name: "Bring Your Own UI (Employee-Facing)",
      summary: "Use the M365 Agents SDK with your own UI framework \u2014 Assistant UI, Vercel AI SDK, or custom.",
      section: "bring-your-own-ui-employee-facing"
    },
    "webchat-dl-cust": {
      leaf: true,
      name: "WebChat + Direct Line (Customer-Facing)",
      summary: "The same Direct Line pattern, framed and branded for external customers.",
      section: "webchat--direct-line-customer-facing"
    },
    "byo-ui-cust": {
      leaf: true,
      name: "Bring Your Own UI (Customer-Facing)",
      summary: "Call Copilot Studio via Direct Line from your own components \u2014 a search box, inline answer, or any non-chat interface.",
      section: "bring-your-own-ui-customer-facing"
    },
    "native-mobile": {
      leaf: true,
      name: "Native Mobile SDK (Preview)",
      summary: "Embed your agent in an Android, iOS, or Windows app using the Agents Client SDK. No-auth only for now.",
      section: "native-mobile-sdk"
    },
    "sdk-server": {
      leaf: true,
      name: "Server-Side Connector",
      summary: "Your backend talks to the agent, your frontend talks to your backend.",
      section: "server-side-connector"
    }
  };

  var history = [];
  var currentNode = "q1";
  var questionKeys = ["q1", "q2-emp", "q3-emp", "q2-cust"];

  function getMaxDepth(nodeId) {
    var node = tree[nodeId];
    if (!node || node.leaf) return 0;
    var max = 0;
    for (var i = 0; i < node.options.length; i++) {
      var d = getMaxDepth(node.options[i].next);
      if (d > max) max = d;
    }
    return 1 + max;
  }

  var totalSteps = getMaxDepth("q1") + 1;

  function render() {
    var node = tree[currentNode];
    var progressEl = document.getElementById("wizard-progress");
    var contentEl = document.getElementById("wizard-content");
    var navEl = document.getElementById("wizard-nav");

    var stepIndex = history.length;
    var dots = "";
    for (var i = 0; i < totalSteps; i++) {
      var cls = "wizard-dot";
      if (i < stepIndex) cls += " done";
      else if (i === stepIndex) cls += " active";
      dots += '<span class="' + cls + '"></span>';
    }
    progressEl.innerHTML = dots;

    if (node.leaf) {
      contentEl.innerHTML =
        '<div class="wizard-result">' +
          '<div class="result-label">Recommended</div>' +
          '<div class="result-name">' + node.name + '</div>' +
          '<div class="result-summary">' + node.summary + '</div>' +
          '<button class="wizard-jump-btn" onclick="document.getElementById(\'' + node.section + '\').scrollIntoView({behavior:\'smooth\',block:\'start\'})">Jump to details \u2193</button>' +
        '</div>';
      navEl.innerHTML =
        '<button class="wizard-back-btn" onclick="wizardBack()">\u2190 Back</button>' +
        '<button class="wizard-restart-btn" onclick="wizardRestart()">Start over</button>';
    } else {
      var html = '<h3>' + node.question + '</h3><div class="wizard-options">';
      for (var j = 0; j < node.options.length; j++) {
        html += '<button class="wizard-btn" onclick="wizardChoose(\'' + node.options[j].next + '\')">' + node.options[j].label + '</button>';
      }
      html += '</div>';
      contentEl.innerHTML = html;

      if (history.length > 0) {
        navEl.innerHTML = '<button class="wizard-back-btn" onclick="wizardBack()">\u2190 Back</button><span></span>';
      } else {
        navEl.innerHTML = '';
      }
    }
  }

  window.wizardChoose = function(nextId) {
    history.push(currentNode);
    currentNode = nextId;
    render();
  };

  window.wizardBack = function() {
    if (history.length > 0) {
      currentNode = history.pop();
      render();
    }
  };

  window.wizardRestart = function() {
    history = [];
    currentNode = "q1";
    render();
  };

  render();
})();
</script>

---

## No API Needed (Publish to Teams/M365)
{: #no-api-needed-publish-to-teams}

If your employees already live in Teams, this is a no-brainer. Copilot Studio [publishes directly to Teams](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams) as a first-class channel. No token endpoints, no JavaScript, no infrastructure to maintain. And choosing Teams now doesn't lock you in. You can always add a web-based experience later using any of the patterns below. For deployment tips, see [Best Practices for Deploying Copilot Studio Agents in Microsoft Teams]({% post_url 2025-11-11-copilot-studio-teams-deployment-ux %}), and for why publishing to Teams and M365 doesn't limit you later on, see [You Probably Don't Need Manual Auth in Copilot Studio]({% post_url 2025-11-18-you-dont-need-manual-auth %}).

**When to use this:** Internal knowledge bases, IT help desks, HR FAQ agents, or any scenario where your users already spend their day in Teams/M365.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## Microsoft-Hosted WebChat (No-Code)
{: #microsoft-hosted-webchat-no-code}

If you need a web-based chat experience but don't want to write code, Copilot Studio can host WebChat for you. This works for both employee-facing intranets and customer-facing websites. Navigate to **Channels > Web app** in the portal, and you'll find an iframe embed snippet you can paste straight into your HTML:

```html
<iframe
  src="https://copilotstudio.microsoft.com/environments/YOUR-ENV/bots/YOUR-AGENT-ID/webchat?__version__=2"
  frameborder="0"
  style="width: 100%; height: 500px;">
</iframe>
```

That's it. Microsoft hosts the WebChat instance, handles the token lifecycle, and serves the chat UI. You get a functional agent on your site with zero build steps. The same page also shows the M365 Agents SDK connection string ([docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk?tabs=dotnet#use-the-default-web-chat-embed-code-without-developmentcode)).

The trade-off? When authentication is configured, the Microsoft-hosted embed uses **manual authentication**, which in this implementation means a magic validation code that users copy-paste from a browser tab. Manual auth itself doesn't mandate the magic code (that's just how the hosted WebChat implements it), but the result is the same: there's no way to get SSO through the embed. If your users are already signed into your site and you want seamless authentication, you'll need to self-host WebChat instead.

> **Heads up (March 2026):** The [official docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk?tabs=dotnet#use-the-default-web-chat-embed-code-without-developmentcode) currently state the embed code is only available when authentication is set to "No authentication." That's not quite right. The embed code is available for both "No authentication" and "Manual authentication," but not for agents configured with "Authenticate with Microsoft." We're working on getting the docs updated.
{: .prompt-info }

**Would you like to see an SSO-enabled embed experience?** If a no-code embed with seamless Entra ID sign-in would be useful for your scenario, let us know in the comments.

**When to use this:** Internal portals, intranet sites, customer-facing websites, proof-of-concepts, or anywhere "it just works" matters more than SSO.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## Self-Hosted WebChat (Employee-Facing)
{: #self-hosted-webchat-employee-facing}

This is the most common pattern for custom-branded agent experiences. You host the `botframework-webchat` library yourself, giving you full control over styling, behavior, and authentication. And it's not limited to standalone web apps. The same WebChat component can be embedded natively in [SharePoint](https://github.com/microsoft/CopilotStudioSamples/tree/main/SSOSamples/SharePointSSOAppCustomizer), [ServiceNow](https://github.com/microsoft/CopilotStudioSamples/tree/main/ServiceNowWidget) (see our [field report]({% post_url 2026-02-24-servicenow-copilot-studio-widget %})), or any platform that can host JavaScript.

The core pattern is almost always the same. You import the WebChat library, create a connection to your agent (more on the options below), and hand it to WebChat:

```html
<script src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js"></script>
<script>
// 1. Create a connection to your Copilot Studio agent.
//    This can use Direct Line or the M365 Agents SDK — see below.
var directLine = /* your connection */;

// 2. Render WebChat — this part is the same regardless of connection method.
window.WebChat.renderWebChat(
  {
    directLine: directLine,
    styleOptions: {
      hideUploadButton: true,
      bubbleBackground: '#e8f0fe',
      primaryFont: "'Segoe UI', sans-serif"
    }
  },
  document.getElementById('webchat')
);
</script>
```

The `styleOptions` object gives you control over colors, fonts, bubble shapes, avatar images, and more, all without writing CSS.

### Which Adapter: Direct Line or M365 Agents SDK?

Copilot Studio exposes two APIs for connecting WebChat to your agent: **Direct Line** (a public API) and the **M365 Agents SDK Copilot Studio client** (which wraps a private API only accessible through the SDK). WebChat has adapters for both, so the rendering code above stays the same either way.

For employee-facing scenarios, we recommend the **M365 Agents SDK client**. Here's why:

- **"Authenticate with Microsoft"**: The SDK client requires this auth mode, which is exactly what you want for B2E. It gives you seamless Entra ID SSO (no magic codes), simpler configuration (one app registration), and unlocks [Tenant Graph Grounding](https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio#tenant-graph-grounding) for higher quality responses grounded in SharePoint and Graph Connectors. For why this beats manual auth in almost every employee scenario, read [You Probably Don't Need Manual Auth in Copilot Studio]({% post_url 2025-11-18-you-dont-need-manual-auth %}).
- **Streaming**: The SDK client supports streaming responses. Direct Line does support streaming for code-first agents built with the M365 Agents SDK, but not for Copilot Studio agents. Yes, we see the irony.

Direct Line is still a valid choice if you specifically need manual authentication (e.g., a non-Entra OAuth provider), but that's a rare requirement for internal agents.

**Official samples and docs:**

- **WebChat customization:** [Customize your chat canvas](https://learn.microsoft.com/en-us/microsoft-copilot-studio/customize-default-canvas) (uses Direct Line, but the styling and customization patterns apply to both APIs)
- **M365 Agents SDK (recommended):** [React Web Chat](https://github.com/microsoft/Agents/tree/main/samples/nodejs/copilotstudio-webchat-react), [Web Client](https://github.com/microsoft/Agents/tree/main/samples/nodejs/copilotstudio-webclient), [SharePoint SSO](https://github.com/microsoft/CopilotStudioSamples/tree/main/SSOSamples/SharePointSSOAppCustomizer), [ServiceNow Widget](https://github.com/microsoft/CopilotStudioSamples/tree/main/ServiceNowWidget)
- **Direct Line with Entra SSO:** [Configure SSO for web apps](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-sso?tabs=webApp)

**When to use this:** Internal web apps, SharePoint sites, ServiceNow portals, or any employee-facing platform where you need styling control and authenticated access to your agent.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## Bring Your Own UI (Employee-Facing)
{: #bring-your-own-ui-employee-facing}

Maybe WebChat isn't your thing. Maybe your team already has a React design system, you're deep into a framework like [Assistant UI](https://www.assistant-ui.com/) or the [Vercel AI SDK](https://sdk.vercel.ai/), and the idea of wrapping a Microsoft chat component doesn't fit your architecture. That's a valid position, and Copilot Studio supports it.

The connection layer is the same M365 Agents SDK client [discussed above](#self-hosted-webchat-employee-facing), with the same authentication and streaming benefits. The difference is that instead of handing the connection to WebChat, you wire it into your own components. The [Assistant UI + Copilot Studio sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/AssistantUICopilotStudioClient/assistant-ui-mcs) shows what this looks like: a React app using Assistant UI components connected to a Copilot Studio agent through the SDK.

The trade-off: WebChat handles adaptive cards, suggested actions, file attachments, typing indicators, and dozens of Bot Framework activity types out of the box. When you bring your own UI, you're responsible for all of that. If your agent sends an adaptive card and your custom UI doesn't render it, the user sees nothing (or worse, raw JSON). And WebChat itself is [heavily customizable](https://github.com/microsoft/BotFramework-WebChat/tree/main/samples/06.recomposing-ui). We'll dig deeper into this comparison in an upcoming WebChat series.

> The gap between "I need BYO" and "I didn't realize WebChat could do that" is often thinner than people expect.
{: .prompt-tip }

**When to use this:** When you're already invested in a specific agentic UX framework (Assistant UI, Vercel AI SDK, etc.) and want your Copilot Studio agent to plug into it natively.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## WebChat + Direct Line (Customer-Facing)
{: #webchat--direct-line-customer-facing}

The most straightforward way to embed a chat experience in your customer-facing website or web app. The code is nearly identical to the employee version. What changes is the context: your customers may not authenticate at all, or they authenticate with non-Entra providers. Direct Line supports both. For authenticated customers, you can wire up [SSO with identity providers](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-sso-3p) like Google, Okta, or Auth0.

```html
<div id="webchat"></div>

<script
  src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js">
</script>
<script>
  fetch('https://YOUR-TOKEN-ENDPOINT/api/token')
    .then(function(response) { return response.json(); })
    .then(function(data) {
      window.WebChat.renderWebChat(
        {
          directLine: window.WebChat.createDirectLine({ token: data.token }),
          styleOptions: {
            botAvatarImage: 'https://your-site.com/bot-avatar.png',
            bubbleBackground: '#f0f0f0',
            bubbleFromUserBackground: '#0078d4',
            bubbleFromUserTextColor: '#ffffff',
            primaryFont: "'Your Brand Font', sans-serif",
            hideUploadButton: true
          }
        },
        document.getElementById('webchat')
      );
    });
</script>
```

> **Want it even simpler?** [Embedding WebChat Without Writing a Single Line of JavaScript]({% post_url 2026-01-26-webchat-embed-zero-javascript %}) covers an open-source library that turns this already straightforward setup into a declarative HTML snippet.
{: .prompt-tip }

> For deeper customization (custom activity renderers, middleware, telemetry), the [WebChat Middlewares]({% post_url 2026-02-02-webchat-middlewares %}) post covers the full pattern.
{: .prompt-tip }

**When to use this:** Customer-facing chat widgets, support portals, marketing sites, or any scenario where external users interact with your agent through a browser.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## Bring Your Own UI (Customer-Facing)
{: #bring-your-own-ui-customer-facing}

Not every agent experience is a chat window. Maybe you want a search box that sends a query to your Copilot Studio agent and displays the answer inline, or a product page that pulls a recommendation without any visible chat UI. For these scenarios, you can call Direct Line directly from your own components.

The [Direct Line JS sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/DirectLineJSSample) shows this pattern: a lightweight JavaScript client that talks to Direct Line without any WebChat dependency. You send activities, receive responses, and render them however you want.

> Before going this route, remember that WebChat is [heavily customizable](https://github.com/microsoft/BotFramework-WebChat/tree/main/samples/06.recomposing-ui). You can strip it down, replace components, or restyle it completely. But if what you're building doesn't resemble a chat interface at all, Direct Line without WebChat is the right call.
{: .prompt-tip }

**When to use this:** Search experiences, inline answers, product recommendations, or any customer-facing scenario where you need agent responses without a chat UI.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## Native Mobile SDK (Preview)
{: #native-mobile-sdk}

If you're building a native mobile app, Microsoft provides the [Agents Client SDK](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-communicate-with-agent-from-native-app) for [Android](https://github.com/microsoft/AgentsClientSDK.Android), [iOS](https://github.com/microsoft/AgentsClientSDK.iOS), and [Windows](https://github.com/microsoft/AgentsClientSDK.Windows). The SDK handles the connection to your agent under the hood. You call `sendMessage()`, observe responses via platform-native patterns (Kotlin `StateFlow`, SwiftUI `@ObservedObject`, C# events), and get Adaptive Cards rendering and optional speech support built in. On iOS, there's even a drop-in `PluggableChatComponent` that gives you a themed chat UI out of the box.

> **Preview (March 2026).** The SDK currently requires your agent to be configured with "No Authentication." The config schema has fields for Entra ID auth, but it's not functional yet. Plan accordingly.
{: .prompt-warning }

**When to use this:** Customer-facing native apps (Android, iOS, Windows) where a web-based chat widget isn't the right fit and you don't need authenticated users.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## Server-Side Connector
{: #server-side-connector}

Some organizations, especially in regulated industries, need a server-side layer between their users and the agent. Maybe you need to sanitize sensitive information before it reaches the agent (or before responses reach the user), enforce compliance rules, or translate adaptive cards into your own UI component library. The pattern is the same: your backend talks to Copilot Studio, and your frontend talks to your backend.

You have two options for the backend-to-agent connection: the **M365 Agents SDK client** or **Direct Line over HTTP**.

### M365 Agents SDK Client

The SDK gives you a developer-friendly client (available for .NET, Node.js, and Python) with an async activity iterator that yields just the agent's responses. Embed it in your server, sanitize or transform what you need, and expose a simple HTTP endpoint to your frontend. Your client doesn't need to know about the underlying protocol, and neither does your server code. The [Node.js console sample](https://github.com/microsoft/Agents/tree/main/samples/nodejs/copilotstudio-client) shows the full pattern end to end.

```typescript
import { Activity, ActivityTypes } from '@microsoft/agents-activity';
import {
  CopilotStudioClient,
  loadCopilotStudioConnectionSettingsFromEnv
} from '@microsoft/agents-copilotstudio-client';

const settings = loadCopilotStudioConnectionSettingsFromEnv();
const token = await acquireToken(settings); // your MSAL token acquisition
const client = new CopilotStudioClient(settings, token);

// Send a message and stream the response
const activity = new Activity('message');
activity.text = 'What is the return policy?';

for await (const reply of client.sendActivityStreaming(activity)) {
  if (reply.type === ActivityTypes.Message) {
    console.log(reply.text);
  }
}
```

> **But we're not there yet.** The SDK client currently requires delegated (user) authentication through Entra ID. No service principal auth, no app-only tokens, no secure anonymous. For B2C scenarios where your customers aren't authenticating with Entra, this is a non-starter. Support for app-only auth is on the roadmap, and we want it as badly as you do. For now, this pattern works for employee-facing backends where delegated auth is acceptable.
{: .prompt-warning }

### Direct Line over HTTP

If you need to support unauthenticated customers or can't use the SDK client, you can talk to Direct Line directly over HTTP. For a walkthrough of this approach, see [Triggering Copilot Studio Agents with HTTP Calls]({% post_url 2025-09-25-triggering-copilot-studio-http %}). Be aware of two things:

1. **Intercepting the stream is painful.** Direct Line delivers responses via WebSocket (real-time push) or HTTP polling (1-10 seconds of latency per cycle). If your goal is to sanitize PII or transform content before it reaches the user, you're building a real-time message router on top of a persistent WebSocket connection (which you'd want to avoid). With polling, the architecture is simpler but the latency adds up fast.
2. **There's no "last message" concept.** Direct Line models a conversation where either party can send messages at any time. There's no built-in signal that says "the agent is done responding." Some customers work around this by embedding a "last message" signal in `channelData`, but that's a convention you have to build and maintain yourself.

**When to use this:** When you need a server-side layer between your users and the agent for sanitization, compliance, or custom rendering. Use the SDK client if your users authenticate with Entra ID, or Direct Line over HTTP for anonymous and non-Entra scenarios.

[Back to wizard &uarr;](#api-wizard){: .wizard-back-link}

---

## What's Next

Each section above gives you enough to get started, but there's always more to dig into: token refresh strategies, error handling patterns, production deployment considerations. If you want a deeper dive on any specific path, let me know in the comments.

**What are you building? Did the wizard point you in the right direction, or is your scenario missing from the tree?**

## Further Reading

- [You Probably Don't Need Manual Auth in Copilot Studio]({% post_url 2025-11-18-you-dont-need-manual-auth %})
- [Best Practices for Deploying Copilot Studio Agents in Microsoft Teams]({% post_url 2025-11-11-copilot-studio-teams-deployment-ux %})
- [Triggering Copilot Studio Agents with HTTP Calls]({% post_url 2025-09-25-triggering-copilot-studio-http %})
- [Embedding WebChat Without Writing a Single Line of JavaScript]({% post_url 2026-01-26-webchat-embed-zero-javascript %})
- [WebChat Middlewares in Copilot Studio]({% post_url 2026-02-02-webchat-middlewares %})
