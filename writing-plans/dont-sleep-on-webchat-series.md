# Don't Sleep on WebChat (Series)

> **Status: Work in Progress** - This plan is under active development. Structure and content may change.

Series on using BotFramework WebChat as a frontend for Copilot Studio agents instead of LLM-native UI frameworks.

## Goal

Counter the assumption that modern chat UIs require frameworks like Assistant UI or Vercel AI SDK. Demonstrate that WebChat's styling, hooks, middleware, and composition capabilities cover most use cases.

---

## Posts

### 1. Introduction: The Modern Chat UI Dilemma

Sets up why orgs are tempted by LLM frameworks and introduces WebChat as a capable alternative.

**Topics:**
- The appeal of modern LLM UI frameworks (streaming, markdown, sleek defaults)
- Hidden costs: auth complexity, protocol translation, ongoing maintenance
- WebChat's actual capabilities (preview of what the series covers)
- Who this series is for

**Status:** Not started

---

### 2. Styling Basics

Configuration-based customization without writing code.

**Topics:**
- The `styleOptions` API
- Brand identity: colors, avatars, bubble shapes
- Localization and RTL support
- Activity grouping and conversation flow
- Feature toggles (upload button, emoji, timeouts)
- When styleOptions is enough vs. when you need more

**Relevant samples:** `02.branding-styling-and-customization/*`

**Status:** Not started

---

### 3. Advanced Visual Customization

Custom components and recomposing for layout and appearance.

**Topics:**
- Custom message rendering (timestamps, status indicators, per-message avatars)
- User highlighting and visual differentiation
- Building a custom transcript layout
- Building a custom send box
- Minimizable and collapsible chat widgets
- The Composer pattern for full layout control
- Key hooks for rendering: `useActivities`, `useStyleOptions`

**Relevant samples:** `05.custom-components/*`, `06.recomposing-ui/*`

**Status:** Not started

---

### 4. Behavioral Customization

Custom components and hooks for interactive behavior.

**Topics:**
- Adding interactivity: reaction buttons, selectable messages
- Autocomplete and input suggestions
- Secure inputs (passwords, sensitive data)
- Notification and toast patterns
- Custom typing indicators
- Working with or disabling Adaptive Cards
- Key hooks for behavior: `useSendMessage`, `usePostActivity`, `useSendBoxValue`, `useSubmitSendBox`

**Relevant samples:** `05.custom-components/*`, `06.recomposing-ui/*`

**Status:** Not started

---

### 5. Middleware and Redux

Intercepting, modifying, and extending WebChat at the store level.

**Topics:**
- Redux store middleware basics
- Intercepting connection events (`CONNECT_FULFILLED`)
- Client-side message injection (`INCOMING_ACTIVITY`)
- Piggybacking on outgoing activities
- Managing conversation state: history, idle timeout, scroll position
- Telemetry integration (Application Insights, Google Analytics)

**Relevant samples:** `04.api/*`

**Cross-reference:** "Mocking Agent Greetings in WebChat" post

**Status:** Not started

---

### 6. Token Exchange and Authentication

Connecting WebChat to Copilot Studio securely.

**Topics:**
- Direct Line token endpoint patterns
- Token refresh and session management
- SSO with MSAL
- User identity propagation to the agent
- Embedding in enterprise apps (auth flows, security considerations)

**Relevant samples:** Agents SDK WebChat samples

**Status:** Not started

---

### 7. Conclusion: When to Use What

Honest comparison and decision framework.

**Topics:**
- Feature comparison: WebChat vs Assistant UI vs Vercel AI SDK
- WebChat strengths: enterprise-ready, accessible, Direct Line native
- WebChat gaps: streaming UX, modern defaults, developer experience
- Decision framework by use case
- The cost of switching: what it took to integrate Copilot Studio with Assistant UI

**Reference:** [AssistantUICopilotStudioClient sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/AssistantUICopilotStudioClient/assistant-ui-mcs)

**Status:** Not started

---

## References

| Resource | Location |
|----------|----------|
| WebChat samples | [BotFramework-WebChat/samples](https://github.com/microsoft/BotFramework-WebChat/tree/main/samples) |
| Assistant UI sample | [CopilotStudioSamples](https://github.com/microsoft/CopilotStudioSamples/tree/main/AssistantUICopilotStudioClient) |

## Notes

- Post 5 can reference the mocked welcome message post rather than duplicating
- Consider publishing companion code samples to CopilotStudioSamples
