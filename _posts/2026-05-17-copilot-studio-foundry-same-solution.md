---
layout: post
title: "Copilot Studio + Foundry in the Same Solution: How to Wire Them Up"
date: 2026-05-17
categories: [copilot-studio, azure-ai-foundry]
tags: [mcp, orchestration, foundry, architecture, agents, a2a, custom-connectors]
description: "When CS handles the channel and Foundry handles the hard part, here is what the wiring looks like: MCP bridge, generative orchestration prerequisite, Foundry Agent Service Threads/Runs, and the gotchas nobody documents."
author: emargot
published: true
---

People keep asking the wrong question. "CS or Foundry?" is not always the choice. After enough enterprise projects you notice the more common answer is *both*: Copilot Studio owns the orchestration, the Power Platform surface, and the channel plumbing; Foundry owns the reasoning that outgrows what CS can do natively. The official [multi-agent patterns guidance](https://learn.microsoft.com/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns) frames the same idea: MCP and A2A are complementary, not competing.

The strategic decision framework is one thing. This post is the other: what you actually build when the answer is both, and how you wire them together without creating a maintenance problem.

## When You Are Here

You are at this decision point when:

- A capability you need in CS (complex multi-step reasoning, a fine-tuned domain model, Python-based computation) pushes past what CS handles natively, and adding more topics or Power Automate flows is the wrong answer
- You already have a Foundry agent and want to surface it through Teams, M365 Copilot, or a web channel without rebuilding the conversation layer
- Your org has a clear ownership split: IT Pro manages the CS orchestration and channel layer, AI team owns the Foundry workloads

## The Architecture

The pattern that works: CS as orchestrator, Foundry as specialist worker. CS handles the conversation, topics, channel auth, and Power Platform surface. Foundry handles heavy computation and returns a result. The seam is a single tool call.

<div style="margin: 2rem 0; overflow-x: auto;">
<svg width="760" height="340" viewBox="0 0 760 340" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" font-family="'Segoe UI', system-ui, sans-serif" role="img" aria-label="Architecture diagram: Channels feed into Copilot Studio, which calls Azure AI Foundry via MCP">
  <defs>
    <marker id="arr-gray" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#9CA3AF"/></marker>
    <marker id="arr-green" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#16A34A"/></marker>
    <filter id="sh" x="-8%" y="-8%" width="116%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.08"/></filter>
    <linearGradient id="f-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#0078D4"/></linearGradient>
  </defs>
  <rect width="760" height="340" rx="14" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1"/>

  <!-- ZONE 1: Channels -->
  <rect x="12" y="12" width="148" height="316" rx="10" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1"/>
  <text x="86" y="31" text-anchor="middle" font-size="9" font-weight="700" fill="#4338CA" letter-spacing="1.2">CHANNELS</text>

  <rect x="22" y="42" width="128" height="72" rx="8" fill="white" filter="url(#sh)"/>
  <image href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+Cjxzdmcgd2lkdGg9IjgwMHB4IiBoZWlnaHQ9IjgwMHB4IiB2aWV3Qm94PSIwIDAgMzIgMzIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQo8cGF0aCBkPSJNMTkgMTMuOTAzMkMxOSAxMy40MDQ0IDE5LjQwNDQgMTMgMTkuOTAzMiAxM0gzMS4wOTY4QzMxLjU5NTYgMTMgMzIgMTMuNDA0NCAzMiAxMy45MDMyVjIwLjVDMzIgMjQuMDg5OSAyOS4wODk5IDI3IDI1LjUgMjdDMjEuOTEwMSAyNyAxOSAyNC4wODk5IDE5IDIwLjVWMTMuOTAzMloiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl84N183Nzc3KSIvPg0KPHBhdGggZD0iTTkgMTIuMjI1OEM5IDExLjU0ODggOS41NDg4MSAxMSAxMC4yMjU4IDExSDIzLjc3NDJDMjQuNDUxMiAxMSAyNSAxMS41NDg4IDI1IDEyLjIyNThWMjJDMjUgMjYuNDE4MyAyMS40MTgzIDMwIDE3IDMwQzEyLjU4MTcgMzAgOSAyNi40MTgzIDkgMjJWMTIuMjI1OFoiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl84N183Nzc3KSIvPg0KPGNpcmNsZSBjeD0iMjciIGN5PSI4IiByPSIzIiBmaWxsPSIjMzQ0MzlFIi8+DQo8Y2lyY2xlIGN4PSIyNyIgY3k9IjgiIHI9IjMiIGZpbGw9InVybCgjcGFpbnQyX2xpbmVhcl84N183Nzc3KSIvPg0KPGNpcmNsZSBjeD0iMTgiIGN5PSI2IiByPSI0IiBmaWxsPSJ1cmwoI3BhaW50M19saW5lYXJfODdfNzc3NykiLz4NCjxtYXNrIGlkPSJtYXNrMF84N183Nzc3IiBzdHlsZT0ibWFzay10eXBlOmFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSI5IiB5PSIwIiB3aWR0aD0iMTYiIGhlaWdodD0iMzAiPg0KPHBhdGggZD0iTTE3IDEwQzE5Ljc2MTUgMTAgMjIgNy43NjE0NyAyMiA1QzIyIDIuMjM4NTMgMTkuNzYxNSAwIDE3IDBDMTQuMjM4NSAwIDEyIDIuMjM4NTMgMTIgNUMxMiA3Ljc2MTQ3IDE0LjIzODUgMTAgMTcgMTBaIiBmaWxsPSJ1cmwoI3BhaW50NF9saW5lYXJfODdfNzc3NykiLz4NCjxwYXRoIGQ9Ik0xMC4yMjU4IDExQzkuNTQ4ODMgMTEgOSAxMS41NDg4IDkgMTIuMjI1OFYyMkM5IDI2LjQxODMgMTIuNTgxNyAzMCAxNyAzMEMyMS40MTgzIDMwIDI1IDI2LjQxODMgMjUgMjJWMTIuMjI1OEMyNSAxMS41NDg4IDI0LjQ1MTIgMTEgMjMuNzc0MiAxMUgxMC4yMjU4WiIgZmlsbD0idXJsKCNwYWludDVfbGluZWFyXzg3Xzc3NzcpIi8+DQo8L21hc2s+DQo8ZyBtYXNrPSJ1cmwoI21hc2swXzg3Xzc3NzcpIj4NCjxwYXRoIGQ9Ik03IDEyQzcgMTAuMzQzMSA4LjM0MzE1IDkgMTAgOUgxN0MxOC42NTY5IDkgMjAgMTAuMzQzMSAyMCAxMlYyNEMyMCAyNS42NTY5IDE4LjY1NjkgMjcgMTcgMjdIN1YxMloiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4zIi8+DQo8L2c+DQo8cmVjdCB5PSI3IiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiBmaWxsPSJ1cmwoI3BhaW50Nl9saW5lYXJfODdfNzc3NykiLz4NCjxwYXRoIGQ9Ik0xMyAxMUg1VjEyLjgzNDdINy45OTQ5NFYyMUgxMC4wMDUxVjEyLjgzNDdIMTNWMTFaIiBmaWxsPSJ3aGl0ZSIvPg0KPGRlZnM+DQo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfODdfNzc3NyIgeDE9IjE5IiB5MT0iMTMuNzM2OCIgeDI9IjMyLjE1OTEiIHkyPSIyMi4zMzU1IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+DQo8c3RvcCBzdG9wLWNvbG9yPSIjMzY0MDg4Ii8+DQo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM2RTdFRTEiLz4NCjwvbGluZWFyR3JhZGllbnQ+DQo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODdfNzc3NyIgeDE9IjkiIHkxPSIxOS40MDM4IiB4Mj0iMjUiIHkyPSIxOS40MDM4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+DQo8c3RvcCBzdG9wLWNvbG9yPSIjNTE1RkM0Ii8+DQo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3MDg0RUEiLz4NCjwvbGluZWFyR3JhZGllbnQ+DQo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Ml9saW5lYXJfODdfNzc3NyIgeDE9IjI0IiB5MT0iNS4zMTU3OSIgeDI9IjI5Ljc5NjMiIHkyPSI5LjM5NDY5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+DQo8c3RvcCBzdG9wLWNvbG9yPSIjMzY0MDg4Ii8+DQo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM2RTdFRTEiLz4NCjwvbGluZWFyR3JhZGllbnQ+DQo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50M19saW5lYXJfODdfNzc3NyIgeDE9IjE1LjE0MjkiIHkxPSIzLjE0Mjg2IiB4Mj0iMjAuMjg1NyIgeTI9IjkuMTQyODYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4NCjxzdG9wIHN0b3AtY29sb3I9IiM0ODU4QUUiLz4NCjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzRFNjBDRSIvPg0KPC9saW5lYXJHcmFkaWVudD4NCjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ0X2xpbmVhcl84N183Nzc3IiB4MT0iMTMuNDI4NiIgeTE9IjEuNDI4NTciIHgyPSIxOS44NTcxIiB5Mj0iOC45Mjg1NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPg0KPHN0b3Agc3RvcC1jb2xvcj0iIzQ4NThBRSIvPg0KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNEU2MENFIi8+DQo8L2xpbmVhckdyYWRpZW50Pg0KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDVfbGluZWFyXzg3Xzc3NzciIHgxPSIxMy40Mjg2IiB5MT0iMS40Mjg1NyIgeDI9IjE5Ljg1NzEiIHkyPSI4LjkyODU3IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+DQo8c3RvcCBzdG9wLWNvbG9yPSIjNDg1OEFFIi8+DQo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0RTYwQ0UiLz4NCjwvbGluZWFyR3JhZGllbnQ+DQo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Nl9saW5lYXJfODdfNzc3NyIgeDE9Ii01LjIxNTM5ZS0wOCIgeTE9IjE2IiB4Mj0iMTgiIHkyPSIxNiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPg0KPHN0b3Agc3RvcC1jb2xvcj0iIzJBMzg4NyIvPg0KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNEM1NkI5Ii8+DQo8L2xpbmVhckdyYWRpZW50Pg0KPC9kZWZzPg0KPC9zdmc+" x="30" y="50" width="32" height="32"/>
  <text x="110" y="63" text-anchor="middle" font-size="11" font-weight="600" fill="#1F2937">Teams</text>
  <text x="110" y="76" text-anchor="middle" font-size="9" fill="#6B7280">M365 Copilot</text>
  <text x="110" y="88" text-anchor="middle" font-size="9" fill="#6B7280">Chat</text>

  <rect x="22" y="124" width="128" height="60" rx="8" fill="white" filter="url(#sh)"/>
  <rect x="30" y="132" width="32" height="32" rx="7" fill="#1F2937"/>
  <text x="46" y="154" text-anchor="middle" font-size="17" fill="white">&#9745;</text>
  <text x="110" y="148" text-anchor="middle" font-size="11" font-weight="600" fill="#1F2937">WebChat</text>
  <text x="110" y="162" text-anchor="middle" font-size="9" fill="#6B7280">Direct Line / SDK</text>

  <rect x="22" y="194" width="128" height="60" rx="8" fill="white" filter="url(#sh)"/>
  <rect x="30" y="202" width="32" height="32" rx="7" fill="#374151"/>
  <text x="46" y="223" text-anchor="middle" font-size="13" font-weight="700" fill="white">&#123;&#125;</text>
  <text x="110" y="217" text-anchor="middle" font-size="11" font-weight="600" fill="#1F2937">Custom App</text>
  <text x="110" y="231" text-anchor="middle" font-size="9" fill="#6B7280">REST / SDK</text>

  <line x1="162" y1="174" x2="196" y2="174" stroke="#9CA3AF" stroke-width="2" marker-end="url(#arr-gray)"/>

  <!-- ZONE 2: Copilot Studio -->
  <rect x="200" y="12" width="218" height="316" rx="10" fill="#F5F3FF" stroke="#DDD6FE" stroke-width="1"/>
  <text x="309" y="31" text-anchor="middle" font-size="9" font-weight="700" fill="#6D28D9" letter-spacing="1.2">ORCHESTRATION</text>

  <image href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTY0LjMyNDIgNC43NzQ0OUM1Mi4zMTIxIDAuNzcwNDQgNDYuMzA1MiAtMS4yMzA0MiA0Mi4xNTIzIDEuNzYyNzdDMzguMDAwMSA0Ljc1NjE5IDM4IDExLjA4NzQgMzggMjMuNzQ5MVYzMy45OTkxTDI4LjMyNDIgMzAuNzc0NUMxNi4zMTIxIDI2Ljc3MDUgMTAuMzA1MiAyNC43Njk2IDYuMTUyMzQgMjcuNzYyOEMxLjk5OTk4IDMwLjc1NjIgMiAzNy4wODc0IDIgNDkuNzQ5MVY2Ny41ODVDMiA3NC41NDE3IDEuOTk5NiA3OC4wMjA5IDMuODg2NzIgODAuNjM5N0M1Ljc3NDMgODMuMjU4NiA5LjA3NTU5IDg0LjM1OTYgMTUuNjc1OCA4Ni41NTk2TDIwLjAwMiA4Ny45OTkxTDIwIDg4LjAwMTFMMzMuODkwNiA5Mi42M0M0MS4wNTI3IDk1LjAxNzMgNDQuNjM0IDk2LjIxMTcgNDguMjE2OCA5NS42NjEyQzUxLjc5OTggOTUuMTEwNSA1NC44NTc3IDkyLjg5NTkgNjAuOTcyNyA4OC40Njc4TDc5LjU5NTcgNzQuOTgzNUM4NC42MjQyIDcxLjM0MjEgODcuNTcwOSA2OS4yMDMyIDg5LjM2OTEgNjYuNzU2OUM4OS41NTEgNjYuNTE5NCA4OS43MjEzIDY2LjI2OTcgODkuODc4OSA2Ni4wMDVDOTAuMDUwMSA2NS43MzAzIDkwLjIxMiA2NS40NTE4IDkwLjM1OTQgNjUuMTYzMkM5MS45OTk2IDYxLjk1MDIgOTIgNTguMTk0OCA5MiA1MC42ODQ2VjI4LjQxNTFDOTIgMjEuNDU4MyA5Mi4wMDA3IDE3Ljk3OTIgOTAuMTEzMyAxNS4zNjA0Qzg4LjIyNTcgMTIuNzQxNiA4NC45MjQ0IDExLjY0MjUgNzguMzI0MiA5LjQ0MjQ2TDY0LjMyNDIgNC43NzQ0OVoiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl80MzAzXzEyMzApIi8+CjxwYXRoIGQ9Ik02NC4zMjQyIDQuNzc0NDlDNTIuMzEyMSAwLjc3MDQ0IDQ2LjMwNTIgLTEuMjMwNDIgNDIuMTUyMyAxLjc2Mjc3QzM4LjAwMDEgNC43NTYxOSAzOCAxMS4wODc0IDM4IDIzLjc0OTFWMzMuOTk5MUwyOC4zMjQyIDMwLjc3NDVDMTYuMzEyMSAyNi43NzA1IDEwLjMwNTIgMjQuNzY5NiA2LjE1MjM0IDI3Ljc2MjhDMS45OTk5OCAzMC43NTYyIDIgMzcuMDg3NCAyIDQ5Ljc0OTFWNjcuNTg1QzIgNzQuNTQxNyAxLjk5OTYgNzguMDIwOSAzLjg4NjcyIDgwLjYzOTdDNS43NzQzIDgzLjI1ODYgOS4wNzU1OSA4NC4zNTk2IDE1LjY3NTggODYuNTU5NkwyMC4wMDIgODcuOTk5MUwyMCA4OC4wMDExTDMzLjg5MDYgOTIuNjNDNDEuMDUyNyA5NS4wMTczIDQ0LjYzNCA5Ni4yMTE3IDQ4LjIxNjggOTUuNjYxMkM1MS43OTk4IDk1LjExMDUgNTQuODU3NyA5Mi44OTU5IDYwLjk3MjcgODguNDY3OEw3OS41OTU3IDc0Ljk4MzVDODQuNjI0MiA3MS4zNDIxIDg3LjU3MDkgNjkuMjAzMiA4OS4zNjkxIDY2Ljc1NjlDODkuNTUxIDY2LjUxOTQgODkuNzIxMyA2Ni4yNjk3IDg5Ljg3ODkgNjYuMDA1QzkwLjA1MDEgNjUuNzMwMyA5MC4yMTIgNjUuNDUxOCA5MC4zNTk0IDY1LjE2MzJDOTEuOTk5NiA2MS45NTAyIDkyIDU4LjE5NDggOTIgNTAuNjg0NlYyOC40MTUxQzkyIDIxLjQ1ODMgOTIuMDAwNyAxNy45NzkyIDkwLjExMzMgMTUuMzYwNEM4OC4yMjU3IDEyLjc0MTYgODQuOTI0NCAxMS42NDI1IDc4LjMyNDIgOS40NDI0Nkw2NC4zMjQyIDQuNzc0NDlaIiBmaWxsPSJ1cmwoI3BhaW50MV9yYWRpYWxfNDMwM18xMjMwKSIvPgo8cGF0aCBkPSJNNjQuMzI0MiA0Ljc3NDQ5QzUyLjMxMjEgMC43NzA0NCA0Ni4zMDUyIC0xLjIzMDQyIDQyLjE1MjMgMS43NjI3N0MzOC4wMDAxIDQuNzU2MTkgMzggMTEuMDg3NCAzOCAyMy43NDkxVjMzLjk5OTFMMjguMzI0MiAzMC43NzQ1QzE2LjMxMjEgMjYuNzcwNSAxMC4zMDUyIDI0Ljc2OTYgNi4xNTIzNCAyNy43NjI4QzEuOTk5OTggMzAuNzU2MiAyIDM3LjA4NzQgMiA0OS43NDkxVjY3LjU4NUMyIDc0LjU0MTcgMS45OTk2IDc4LjAyMDkgMy44ODY3MiA4MC42Mzk3QzUuNzc0MyA4My4yNTg2IDkuMDc1NTkgODQuMzU5NiAxNS42NzU4IDg2LjU1OTZMMjAuMDAyIDg3Ljk5OTFMMjAgODguMDAxMUwzMy44OTA2IDkyLjYzQzQxLjA1MjcgOTUuMDE3MyA0NC42MzQgOTYuMjExNyA0OC4yMTY4IDk1LjY2MTJDNTEuNzk5OCA5NS4xMTA1IDU0Ljg1NzcgOTIuODk1OSA2MC45NzI3IDg4LjQ2NzhMNzkuNTk1NyA3NC45ODM1Qzg0LjYyNDIgNzEuMzQyMSA4Ny41NzA5IDY5LjIwMzIgODkuMzY5MSA2Ni43NTY5Qzg5LjU1MSA2Ni41MTk0IDg5LjcyMTMgNjYuMjY5NyA4OS44Nzg5IDY2LjAwNUM5MC4wNTAxIDY1LjczMDMgOTAuMjEyIDY1LjQ1MTggOTAuMzU5NCA2NS4xNjMyQzkxLjk5OTYgNjEuOTUwMiA5MiA1OC4xOTQ4IDkyIDUwLjY4NDZWMjguNDE1MUM5MiAyMS40NTgzIDkyLjAwMDcgMTcuOTc5MiA5MC4xMTMzIDE1LjM2MDRDODguMjI1NyAxMi43NDE2IDg0LjkyNDQgMTEuNjQyNSA3OC4zMjQyIDkuNDQyNDZMNjQuMzI0MiA0Ljc3NDQ5WiIgZmlsbD0idXJsKCNwYWludDJfcmFkaWFsXzQzMDNfMTIzMCkiLz4KPHBhdGggZD0iTTU2IDU0LjQxNTFDNTYgNDcuNDU3OSA1NiA0My45NzkzIDU0LjExMjQgNDEuMzYwNEM1Mi4yMjQ4IDM4Ljc0MTUgNDguOTI0NyAzNy42NDE1IDQyLjMyNDYgMzUuNDQxNEwyOC4zMjQ2IDMwLjc3NDhDMTYuMzEyIDI2Ljc3MDYgMTAuMzA1OCAyNC43Njg1IDYuMTUyOSAyNy43NjE3QzIgMzAuNzU1IDIgMzcuMDg2MSAyIDQ5Ljc0ODRWNjcuNTg0N0MyIDc0LjU0MTkgMiA3OC4wMjA2IDMuODg3NTggODAuNjM5NEM1Ljc3NTE2IDgzLjI1ODMgOS4wNzUyNSA4NC4zNTgzIDE1LjY3NTQgODYuNTU4NEwyOS42NzU0IDkxLjIyNTFDNDEuNjg4IDk1LjIyOTIgNDcuNjk0MiA5Ny4yMzEzIDUxLjg0NzEgOTQuMjM4MUM1NiA5MS4yNDQ4IDU2IDg0LjkxMzcgNTYgNzIuMjUxNFY1NC40MTUxWiIgZmlsbD0idXJsKCNwYWludDNfcmFkaWFsXzQzMDNfMTIzMCkiLz4KPHBhdGggZD0iTTU2IDU0LjQxNTFDNTYgNDcuNDU3OSA1NiA0My45NzkzIDU0LjExMjQgNDEuMzYwNEM1Mi4yMjQ4IDM4Ljc0MTUgNDguOTI0NyAzNy42NDE1IDQyLjMyNDYgMzUuNDQxNEwyOC4zMjQ2IDMwLjc3NDhDMTYuMzEyIDI2Ljc3MDYgMTAuMzA1OCAyNC43Njg1IDYuMTUyOSAyNy43NjE3QzIgMzAuNzU1IDIgMzcuMDg2MSAyIDQ5Ljc0ODRWNjcuNTg0N0MyIDc0LjU0MTkgMiA3OC4wMjA2IDMuODg3NTggODAuNjM5NEM1Ljc3NTE2IDgzLjI1ODMgOS4wNzUyNSA4NC4zNTgzIDE1LjY3NTQgODYuNTU4NEwyOS42NzU0IDkxLjIyNTFDNDEuNjg4IDk1LjIyOTIgNDcuNjk0MiA5Ny4yMzEzIDUxLjg0NzEgOTQuMjM4MUM1NiA5MS4yNDQ4IDU2IDg0LjkxMzcgNTYgNzIuMjUxNFY1NC40MTUxWiIgZmlsbD0idXJsKCNwYWludDRfbGluZWFyXzQzMDNfMTIzMCkiLz4KPHBhdGggZD0iTTkyIDUwLjY4NDZDOTIgNTguMTk0NyA5MS45OTk2IDYxLjk1MDEgOTAuMzU5NCA2NS4xNjMxQzkwLjIxMiA2NS40NTE3IDkwLjA1MDEgNjUuNzMwMiA4OS44Nzg5IDY2LjAwNDlDODkuNzIxMyA2Ni4yNjk2IDg5LjU1MSA2Ni41MTkzIDg5LjM2OTEgNjYuNzU2OEM4Ny41NzA5IDY5LjIwMzEgODQuNjI0MiA3MS4zNDIxIDc5LjU5NTcgNzQuOTgzNEw2MC45NzI3IDg4LjQ2NzhDNTQuODU3NyA5Mi44OTU5IDUxLjc5OTggOTUuMTEwNSA0OC4yMTY4IDk1LjY2MTFDNDQuNjM0IDk2LjIxMTYgNDEuMDUyNyA5NS4wMTcyIDMzLjg5MDYgOTIuNjI5OUwyNS4yMTU4IDg5LjczOTNMMjAgODhMMjAuMDAyIDg3Ljk5OUwxNi43ODIyIDg2LjkyNzdMMTUuMjIxNyA4Ni40MDcyQzguOTIzMzcgODQuMzA2NyA1LjczMDQ3IDgzLjE5NzcgMy44ODY3MiA4MC42Mzk2QzEuOTk5NjQgNzguMDIwOCAyIDc0LjU0MTYgMiA2Ny41ODVWNDkuNzQ5QzIgNDguNDMyMyAyLjAwMTE5IDQ3LjE4NDEgMi4wMDU4NiA0Ni4wMDFMNTYgNjEuNTAxTDkyIDM1LjAwMVY1MC42ODQ2WiIgZmlsbD0idXJsKCNwYWludDVfcmFkaWFsXzQzMDNfMTIzMCkiLz4KPHBhdGggZD0iTTM4LjA3NDIgMTUuMTAzNkMzMS4zMDMzIDEzLjA2NjggMjcuMjIxNyAxMi41NDk3IDI0LjE1MjMgMTQuNzYxOEMyMS4wNzkzIDE2Ljk3NjcgMjAuMjgxIDIxLjAxOTUgMjAuMDczMiAyOC4xMDI2QzIyLjQ2MzUgMjguODIxNiAyNS4xODg5IDI5LjczMDYgMjguMzIzMiAzMC43NzU0TDM3Ljk5OSAzNFYyMy43NDkxQzM3Ljk5OSAyMC40NTY5IDM4LjAwMTIgMTcuNTkyNSAzOC4wNzQyIDE1LjEwMzZaIiBmaWxsPSJ1cmwoI3BhaW50Nl9saW5lYXJfNDMwM18xMjMwKSIvPgo8cGF0aCBkPSJNMzguMDc0MiAxNS4xMDM2QzMxLjMwMzMgMTMuMDY2OCAyNy4yMjE3IDEyLjU0OTcgMjQuMTUyMyAxNC43NjE4QzIxLjA3OTMgMTYuOTc2NyAyMC4yODEgMjEuMDE5NSAyMC4wNzMyIDI4LjEwMjZDMjIuNDYzNSAyOC44MjE2IDI1LjE4ODkgMjkuNzMwNiAyOC4zMjMyIDMwLjc3NTRMMzcuOTk5IDM0VjIzLjc0OTFDMzcuOTk5IDIwLjQ1NjkgMzguMDAxMiAxNy41OTI1IDM4LjA3NDIgMTUuMTAzNloiIGZpbGw9InVybCgjcGFpbnQ3X2xpbmVhcl80MzAzXzEyMzApIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgo8cGF0aCBkPSJNMzguMDc0MiAxNS4xMDM1QzM4LjAwMTIgMTcuNTkyMiAzOCAyMC40NTYxIDM4IDIzLjc0OFY0MS41ODVDMzggNDguNTQxOSAzOC4wMDAyIDUyLjAyMDggMzkuODg3NyA1NC42Mzk2QzQxLjc3NTMgNTcuMjU4MyA0NS4wNzU4IDU4LjM1ODYgNTEuNjc1OCA2MC41NTg2TDU2IDYyQzY0LjAwMjcgNjQuNjY3NiA2OC4wMDQxIDY2LjAwMTQgNzAuODQgNjQuMTQwOEM3MS4wMTEyIDY0LjAyODQgNzEuMTc3NCA2My45MDg2IDcxLjMzODEgNjMuNzgxN0M3NCA2MS42Nzk4IDc0IDU3LjQ2MiA3NCA0OS4wMjYzVjQxLjQxNUM3NCAzNC40NTc5IDczLjk5OTkgMzAuOTc5MiA3Mi4xMTIzIDI4LjM2MDRDNzAuMjI0NyAyNS43NDE2IDY2LjkyNDMgMjQuNjQxNCA2MC4zMjQyIDIyLjQ0MTRMNDYuMzI0MiAxNy43NzQ0QzQzLjE5MDEgMTYuNzI5NyA0MC40NjQ0IDE1LjgyMjUgMzguMDc0MiAxNS4xMDM1WiIgZmlsbD0idXJsKCNwYWludDhfbGluZWFyXzQzMDNfMTIzMCkiLz4KPHBhdGggZD0iTTM4LjA3NDIgMTUuMTAzNUMzOC4wMDEyIDE3LjU5MjIgMzggMjAuNDU2MSAzOCAyMy43NDhWNDEuNTg1QzM4IDQ4LjU0MTkgMzguMDAwMiA1Mi4wMjA4IDM5Ljg4NzcgNTQuNjM5NkM0MS43NzUzIDU3LjI1ODMgNDUuMDc1OCA1OC4zNTg2IDUxLjY3NTggNjAuNTU4Nkw1NiA2MkM2NC4wMDI3IDY0LjY2NzYgNjguMDA0MSA2Ni4wMDE0IDcwLjg0IDY0LjE0MDhDNzEuMDExMiA2NC4wMjg0IDcxLjE3NzQgNjMuOTA4NiA3MS4zMzgxIDYzLjc4MTdDNzQgNjEuNjc5OCA3NCA1Ny40NjIgNzQgNDkuMDI2M1Y0MS40MTVDNzQgMzQuNDU3OSA3My45OTk5IDMwLjk3OTIgNzIuMTEyMyAyOC4zNjA0QzcwLjIyNDcgMjUuNzQxNiA2Ni45MjQzIDI0LjY0MTQgNjAuMzI0MiAyMi40NDE0TDQ2LjMyNDIgMTcuNzc0NEM0My4xOTAxIDE2LjcyOTcgNDAuNDY0NCAxNS44MjI1IDM4LjA3NDIgMTUuMTAzNVoiIGZpbGw9InVybCgjcGFpbnQ5X3JhZGlhbF80MzAzXzEyMzApIi8+CjxwYXRoIGQ9Ik0yMC4wNzQyIDI4LjEwMzVDMjAuMDAxMiAzMC41OTIyIDIwIDMzLjQ1NjEgMjAgMzYuNzQ4VjU0LjU4NUMyMCA2MS41NDIxIDIwLjAwMDEgNjUuMDIwOCAyMS44ODc3IDY3LjYzOTZDMjMuNzc1MyA3MC4yNTg0IDI3LjA3NTcgNzEuMzU4NiAzMy42NzU4IDczLjU1ODZMMzcuOTc1IDc0Ljk5MTdDNDYuMDAxNCA3Ny42NjcxIDUwLjAxNDYgNzkuMDA0OSA1Mi44NTUgNzcuMTMwOUM1My4wMTU5IDc3LjAyNDcgNTMuMTcyNCA3Ni45MTE5IDUzLjMyNCA3Ni43OTI4QzU2IDc0LjY5MDkgNTYgNzAuNDYwNiA1NiA2MlY1NC40MTVDNTYgNDcuNDU3OSA1NS45OTk5IDQzLjk3OTIgNTQuMTEyMyA0MS4zNjA0QzUyLjIyNDcgMzguNzQxNiA0OC45MjQzIDM3LjY0MTQgNDIuMzI0MiAzNS40NDE0TDI4LjMyNDIgMzAuNzc0NEMyNS4xOTAxIDI5LjcyOTcgMjIuNDY0NCAyOC44MjI1IDIwLjA3NDIgMjguMTAzNVoiIGZpbGw9InVybCgjcGFpbnQxMF9saW5lYXJfNDMwM18xMjMwKSIvPgo8cGF0aCBkPSJNMzggNDEuNTg1QzM4IDQ4LjU0MjIgMzguMDAwMSA1Mi4wMjA4IDM5Ljg4NzcgNTQuNjM5N0M0MS43NzUzIDU3LjI1ODUgNDUuMDc1NiA1OC4zNTg1IDUxLjY3NTggNjAuNTU4Nkw1NiA2MlY1NC40MTVDNTYgNDcuNDU4MSA1NS45OTk4IDQzLjk3OTIgNTQuMTEyMyA0MS4zNjA0QzUyLjIyNDcgMzguNzQxNyA0OC45MjQyIDM3LjY0MTQgNDIuMzI0MiAzNS40NDE0TDM4IDM0VjQxLjU4NVoiIGZpbGw9InVybCgjcGFpbnQxMV9saW5lYXJfNDMwM18xMjMwKSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzQzMDNfMTIzMCIgeDE9IjUzLjUiIHkxPSI3NyIgeDI9IjgwLjk5OTkiIHkyPSI5Ljk5OTk4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMyNzY0RTciLz4KPHN0b3Agb2Zmc2V0PSIwLjMwNzQ3NSIgc3RvcC1jb2xvcj0iIzhCNTJGNCIvPgo8c3RvcCBvZmZzZXQ9IjAuNTQ0NjI3IiBzdG9wLWNvbG9yPSIjQkI0NUVBIi8+CjxzdG9wIG9mZnNldD0iMC44MDM4NjYiIHN0b3AtY29sb3I9IiNEQjU2QzYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjQ2MkFCIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQxX3JhZGlhbF80MzAzXzEyMzAiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTIuNSA0NSkgcm90YXRlKDQzLjgwNjUpIHNjYWxlKDMzLjk0ODUgMjEuNDY1MykiPgo8c3RvcCBvZmZzZXQ9IjAuNTQ5Mzk5IiBzdG9wLWNvbG9yPSIjNUIyQUI1Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0E5MzFEOCIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQyX3JhZGlhbF80MzAzXzEyMzAiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDQgMzQpIHJvdGF0ZSgxNy43MDA0KSBzY2FsZSg0OS4zMzU2IDI0LjU5NjQpIj4KPHN0b3Agb2Zmc2V0PSIwLjUyNzkyOSIgc3RvcC1jb2xvcj0iIzk1MjlDMiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNERDNDRTIiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50M19yYWRpYWxfNDMwM18xMjMwIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDYxLjM5MjIgODkuMzM3Mykgcm90YXRlKC0xMjQuODkpIHNjYWxlKDgyLjA5MzUgODIuMDkzNSkiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMjc2NEU3Ii8+CjxzdG9wIG9mZnNldD0iMC4yMjUyMjgiIHN0b3AtY29sb3I9IiMwMDk0RjAiLz4KPHN0b3Agb2Zmc2V0PSIwLjQ0MzQzNyIgc3RvcC1jb2xvcj0iIzE5QjJDRSIvPgo8c3RvcCBvZmZzZXQ9IjAuNjk5OSIgc3RvcC1jb2xvcj0iIzUyRDE3QyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRkQ2MzgiLz4KPC9yYWRpYWxHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDRfbGluZWFyXzQzMDNfMTIzMCIgeDE9IjE5LjU0NDQiIHkxPSI4Mi43MDk2IiB4Mj0iNTMuODQ1MiIgeTI9IjgyLjcwOTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzE2QkJEQSIgc3RvcC1vcGFjaXR5PSIwIi8+CjxzdG9wIG9mZnNldD0iMC41MzUyNzkiIHN0b3AtY29sb3I9IiMwMDk0RjAiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMjc2NEU3Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ1X3JhZGlhbF80MzAzXzEyMzAiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgyMyAxMi45OTk4IDguOTA4NzQgLTEzLjA0OTkgNDMgNjcuOTk5NSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzFCNDRCMSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMzNjdBRjIiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Nl9saW5lYXJfNDMwM18xMjMwIiB4MT0iMzMuNSIgeTE9IjMyLjUiIHgyPSIzNCIgeTI9IjEzIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNGRjlDNzAiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkZEMzk0Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ3X2xpbmVhcl80MzAzXzEyMzAiIHgxPSIyOC41IiB5MT0iMjQuNSIgeDI9IjI2LjUiIHkyPSIzMyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRkZCMzU3IiBzdG9wLW9wYWNpdHk9IjAiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjI0QTlEIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ4X2xpbmVhcl80MzAzXzEyMzAiIHgxPSI1OCIgeTE9IjIwIiB4Mj0iNTguNSIgeTI9IjY0LjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZGQjM1NyIvPgo8c3RvcCBvZmZzZXQ9IjAuMzgwMjU5IiBzdG9wLWNvbG9yPSIjRkI2RjdCIi8+CjxzdG9wIG9mZnNldD0iMC42NTk3NzkiIHN0b3AtY29sb3I9IiNGMjRBOUQiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjREQzQ0UyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ5X3JhZGlhbF80MzAzXzEyMzAiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDAgNTQpIHJvdGF0ZSgxMi43MDIpIHNjYWxlKDI0LjA4OTUgMjQuMDg5NSkiPgo8c3RvcCBvZmZzZXQ9IjAuNTY3OTM4IiBzdG9wLWNvbG9yPSIjRDcyNTdEIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y0NjJBQiIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxMF9saW5lYXJfNDMwM18xMjMwIiB4MT0iNTAuMDMiIHkxPSI3Ny4zNzA3IiB4Mj0iMjAiIHkyPSIyNS42ODY5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMwRkFGRkYiLz4KPHN0b3Agb2Zmc2V0PSIwLjU0ODI4IiBzdG9wLWNvbG9yPSIjMkJEQUJFIi8+CjxzdG9wIG9mZnNldD0iMC43NjU5NDUiIHN0b3AtY29sb3I9IiM4OEUwNkMiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkZENjM4Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxMV9saW5lYXJfNDMwM18xMjMwIiB4MT0iMzYiIHkxPSI0NC41IiB4Mj0iNTMiIHkyPSI1MC41IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM3NkVCOTUiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjM0JENUZGIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K" x="285" y="42" width="48" height="48"/>
  <text x="309" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="#5B21B6">Copilot Studio</text>

  <text x="212" y="127" font-size="9.5" fill="#374151">&#x2022; Topics &amp; conversation flow</text>
  <text x="212" y="144" font-size="9.5" fill="#374151">&#x2022; Knowledge sources (RAG)</text>
  <text x="212" y="161" font-size="9.5" fill="#374151">&#x2022; Generative orchestration</text>
  <text x="212" y="178" font-size="9.5" fill="#374151">&#x2022; Channel auth &amp; governance</text>
  <text x="212" y="195" font-size="9.5" fill="#374151">&#x2022; Power Platform integration</text>
  <text x="212" y="212" font-size="9.5" fill="#374151">&#x2022; ALM &amp; usage analytics</text>

  <line x1="421" y1="174" x2="455" y2="174" stroke="#16A34A" stroke-width="2.5" stroke-dasharray="5,3" marker-end="url(#arr-green)"/>
  <rect x="420" y="155" width="38" height="18" rx="5" fill="#16A34A"/>
  <text x="439" y="168" text-anchor="middle" font-size="9" font-weight="700" fill="white">MCP</text>

  <!-- ZONE 3: Foundry -->
  <rect x="458" y="12" width="290" height="316" rx="10" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
  <text x="603" y="31" text-anchor="middle" font-size="9" font-weight="700" fill="#1D4ED8" letter-spacing="1.2">SPECIALIST LAYER</text>

  <rect x="579" y="42" width="48" height="48" rx="10" fill="url(#f-grad)"/>
  <polygon points="603,48 619,57 619,75 603,84 587,75 587,57" fill="none" stroke="white" stroke-width="1.8" opacity="0.85"/>
  <circle cx="603" cy="66" r="4" fill="white" opacity="0.95"/>
  <line x1="603" y1="48" x2="603" y2="62" stroke="white" stroke-width="1.4" opacity="0.7"/>
  <line x1="603" y1="70" x2="603" y2="84" stroke="white" stroke-width="1.4" opacity="0.7"/>
  <line x1="587" y1="57" x2="599" y2="63.6" stroke="white" stroke-width="1.4" opacity="0.7"/>
  <line x1="619" y1="57" x2="607" y2="63.6" stroke="white" stroke-width="1.4" opacity="0.7"/>
  <line x1="587" y1="75" x2="599" y2="68.4" stroke="white" stroke-width="1.4" opacity="0.7"/>
  <line x1="619" y1="75" x2="607" y2="68.4" stroke="white" stroke-width="1.4" opacity="0.7"/>
  <circle cx="603" cy="48" r="2.5" fill="white" opacity="0.7"/>
  <circle cx="619" cy="57" r="2.5" fill="white" opacity="0.7"/>
  <circle cx="619" cy="75" r="2.5" fill="white" opacity="0.7"/>
  <circle cx="603" cy="84" r="2.5" fill="white" opacity="0.7"/>
  <circle cx="587" cy="75" r="2.5" fill="white" opacity="0.7"/>
  <circle cx="587" cy="57" r="2.5" fill="white" opacity="0.7"/>
  <text x="603" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="#1E40AF">Azure AI Foundry</text>

  <text x="470" y="127" font-size="9.5" fill="#374151">&#x2022; Foundry Agent Service</text>
  <text x="470" y="144" font-size="9.5" fill="#374151">&#x2022; Custom / fine-tuned models</text>
  <text x="470" y="161" font-size="9.5" fill="#374151">&#x2022; Python-based agent tools</text>
  <text x="470" y="178" font-size="9.5" fill="#374151">&#x2022; Complex multi-step reasoning</text>
  <text x="470" y="195" font-size="9.5" fill="#374151">&#x2022; Azure AI Search grounding</text>
  <text x="470" y="212" font-size="9.5" fill="#374151">&#x2022; Tracing &amp; evals</text>
  <text x="470" y="229" font-size="9.5" fill="#374151">&#x2022; Streaming &amp; multi-modal</text>

  <line x1="530" y1="290" x2="552" y2="290" stroke="#16A34A" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="557" y="294" font-size="9" fill="#6B7280">MCP connector (AI-selected tool)</text>
  <line x1="530" y1="308" x2="552" y2="308" stroke="#9CA3AF" stroke-width="2"/>
  <text x="557" y="312" font-size="9" fill="#6B7280">Synchronous channel handoff</text>
</svg>
</div>

The clean boundary matters. CS does not need to know what Foundry does internally. Foundry does not need to know where the conversation came from. Keeping that seam thin makes both sides easier to test, upgrade, and hand to different teams.

## The MCP Bridge

The most CS-native way to connect is through an MCP connector. If you have followed the [five-minute MCP connector quickstart]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}), you know the shape: CS adds an MCP server as a tool, the agent decides when to call it, the tool runs, the agent gets the result. The full extension model is documented in [Extend your agent with Model Context Protocol](https://learn.microsoft.com/microsoft-copilot-studio/agent-extend-action-mcp).

Two prerequisites that bite the first time:

> [Generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) must be turned on for your agent. Classic orchestration does not select MCP tools at runtime.
{: .prompt-warning }

> Copilot Studio currently supports the **Streamable HTTP** transport only. SSE was deprecated in August 2025 and removed - see the [transport notes in the MCP connection docs](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent).
{: .prompt-warning }

For a Foundry agent, the MCP server is a thin Azure Function that translates MCP into a Foundry Agent Service call:

1. CS calls the MCP tool with structured parameters
2. The Function gets a Microsoft Entra token for `https://ai.azure.com`
3. It calls the [Foundry Agent Service](https://learn.microsoft.com/azure/foundry-classic/agents/quickstart) using the **Threads + Runs** pattern
4. The agent response is shaped into MCP format and returned to CS

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";

// Foundry Agent Service project endpoint:
//   https://{account}.services.ai.azure.com/api/projects/{project}
const FOUNDRY_PROJECT = process.env.FOUNDRY_PROJECT_ENDPOINT!;
const AGENT_ID        = process.env.FOUNDRY_AGENT_ID!;
const API_VERSION     = "2025-05-01";

// Single endpoint handles all MCP JSON-RPC messages.
// Copilot Studio supports the Streamable HTTP transport only (SSE deprecated Aug 2025).
app.http("mcp", {
  methods: ["POST"],
  authLevel: "function",
  route: "mcp",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const msg = await req.json() as { id: string; method: string; params?: Record<string, unknown> };

    switch (msg.method) {

      case "initialize":
        return ok(msg.id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "foundry-bridge", version: "1.0.0" },
          capabilities: { tools: {} }
        });

      case "tools/list":
        return ok(msg.id, {
          tools: [{
            name: "analyze_contract",
            // Be specific. The CS orchestrator uses this description to decide whether to call
            // the tool at runtime. Vague descriptions cause it to call Foundry on every message.
            description:
              "Analyzes a contract for obligations, risks, and key dates. " +
              "Use when the user asks to review a contract, check for risks, or extract clauses.",
            inputSchema: {
              type: "object",
              properties: {
                document_text:  { type: "string", description: "Full contract text" },
                analysis_type:  {
                  type: "string",
                  enum: ["obligations", "risks", "dates", "full"],
                  description: "What aspect to focus on"
                },
                user_id: {
                  type: "string",
                  description: "Authenticated CS user. Pass explicitly; not threaded by MCP."
                }
              },
              required: ["document_text", "analysis_type"]
            }
          }]
        });

      case "tools/call": {
        const args = (msg.params!.arguments) as Record<string, string>;
        try {
          const text = await callFoundryAgent(args, ctx);
          return ok(msg.id, { content: [{ type: "text", text }] });
        } catch (err) {
          ctx.error("Foundry call failed", err);
          // Return a user-readable message - CS surfaces this directly in the conversation.
          return ok(msg.id, {
            content: [{ type: "text", text: "Analysis unavailable. Please try again or contact support." }],
            isError: true
          });
        }
      }

      default:
        return { status: 400, jsonBody: { error: `Unknown method: ${msg.method}` } };
    }
  }
});

// Calls a Foundry Agent Service agent using the Threads + Runs pattern.
// See: https://learn.microsoft.com/azure/foundry-classic/agents/quickstart
async function callFoundryAgent(
  args: Record<string, string>,
  ctx: InvocationContext
): Promise<string> {
  const cred  = new DefaultAzureCredential();
  const token = (await cred.getToken("https://ai.azure.com/.default")).token;

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
    // Custom header forwarded to your Foundry agent for audit logging.
    "x-cs-user-id":  args.user_id ?? "anonymous"
  };

  // 1. Create a thread
  const thread = await fetch(
    `${FOUNDRY_PROJECT}/threads?api-version=${API_VERSION}`,
    { method: "POST", headers, body: "{}" }
  ).then(r => r.json()) as { id: string };

  // 2. Add the user message
  await fetch(
    `${FOUNDRY_PROJECT}/threads/${thread.id}/messages?api-version=${API_VERSION}`,
    { method: "POST", headers, body: JSON.stringify({
        role: "user",
        content: `${args.analysis_type}:\n\n${args.document_text}`
    })}
  );

  // 3. Run the thread against the agent and poll
  const run = await fetch(
    `${FOUNDRY_PROJECT}/threads/${thread.id}/runs?api-version=${API_VERSION}`,
    { method: "POST", headers, body: JSON.stringify({ assistant_id: AGENT_ID }) }
  ).then(r => r.json()) as { id: string; status: string };

  await pollUntilComplete(thread.id, run.id, headers);

  // 4. Retrieve the assistant response
  const messages = await fetch(
    `${FOUNDRY_PROJECT}/threads/${thread.id}/messages?api-version=${API_VERSION}`,
    { headers }
  ).then(r => r.json()) as { data: Array<{ role: string; content: Array<{ text: { value: string } }> }> };

  return messages.data.find(m => m.role === "assistant")!.content[0].text.value;
}

async function pollUntilComplete(
  threadId: string, runId: string, headers: Record<string, string>
): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const status = await fetch(
      `${FOUNDRY_PROJECT}/threads/${threadId}/runs/${runId}?api-version=${API_VERSION}`,
      { headers }
    ).then(r => r.json()) as { status: string };
    if (status.status === "completed") return;
    if (["failed", "cancelled", "expired"].includes(status.status)) {
      throw new Error(`Foundry run ${status.status}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error("Foundry run timed out after 15s");
}

function ok(id: string, result: unknown): HttpResponseInit {
  return { status: 200, jsonBody: { jsonrpc: "2.0", id, result } };
}
```

To register this in CS: **Tools** > **Add a tool** > **Model Context Protocol**, paste your Azure Function URL (the route ending in `/api/mcp`), and follow the [onboarding wizard](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent). The wizard creates a custom connector for you with the required `x-ms-agentic-protocol: mcp-streamable-1.0` property set automatically. If you build the connector by hand instead (Power Apps > Custom connectors > Import OpenAPI), see the [Azure MCP Server sample](https://github.com/Azure-Samples/azmcp-copilot-studio-aca-mi/blob/main/custom-connector-swagger-example.yaml) for the OpenAPI definition. The full connection reference ALM pattern is covered in the [MCP quickstart post]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}).

> The Function uses `authLevel: "function"`, which requires an `x-functions-key` header. CS handles this via the connection you create in the MCP wizard. Use OAuth 2.0 with Dynamic Client Registration discovery if your Function App is fronted by APIM and you want per-user delegated auth - see [OAuth options in the wizard docs](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent).
{: .prompt-tip }

## The Context Problem

Here is what does not cross the CS/Foundry boundary when you use MCP.

<div style="margin: 2rem 0; overflow-x: auto;">
<svg width="760" height="224" viewBox="0 0 760 224" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', system-ui, sans-serif" role="img" aria-label="Two-column diagram: what does not cross the CS-Foundry boundary vs what to pass explicitly">
  <rect width="760" height="224" rx="12" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1"/>

  <rect x="12" y="12" width="358" height="200" rx="10" fill="#FEF2F2" stroke="#FECACA" stroke-width="1"/>
  <rect x="12" y="12" width="358" height="36" rx="10" fill="#FCA5A5" opacity="0.45"/>
  <text x="191" y="35" text-anchor="middle" font-size="11" font-weight="700" fill="#991B1B">MCP: does NOT cross automatically</text>
  <text x="32" y="68" font-size="10.5" fill="#7F1D1D">&#x2717;&#160; CS system prompt / agent instructions</text>
  <text x="32" y="88" font-size="10.5" fill="#7F1D1D">&#x2717;&#160; Conversation history / prior turns</text>
  <text x="32" y="108" font-size="10.5" fill="#7F1D1D">&#x2717;&#160; Authenticated user identity</text>
  <text x="32" y="128" font-size="10.5" fill="#7F1D1D">&#x2717;&#160; CS environment / tenant config</text>
  <text x="32" y="148" font-size="10.5" fill="#7F1D1D">&#x2717;&#160; Active topic context &amp; variables</text>
  <text x="32" y="168" font-size="10.5" fill="#7F1D1D">&#x2717;&#160; Power Platform connection state</text>

  <text x="380" y="116" text-anchor="middle" font-size="24" fill="#9CA3AF">&#x27A1;</text>
  <text x="380" y="136" text-anchor="middle" font-size="8" fill="#9CA3AF">tool call</text>

  <rect x="390" y="12" width="358" height="200" rx="10" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1"/>
  <rect x="390" y="12" width="358" height="36" rx="10" fill="#86EFAC" opacity="0.45"/>
  <text x="569" y="35" text-anchor="middle" font-size="11" font-weight="700" fill="#14532D">Pass in tool parameters</text>
  <text x="410" y="68" font-size="10.5" fill="#14532D">&#x2713;&#160; user_id&#160; (from CS auth token)</text>
  <text x="410" y="88" font-size="10.5" fill="#14532D">&#x2713;&#160; context_summary&#160; (1-3 sentences max)</text>
  <text x="410" y="108" font-size="10.5" fill="#14532D">&#x2713;&#160; analysis_type&#160; (scope the Foundry task)</text>
  <text x="410" y="128" font-size="10.5" fill="#14532D">&#x2713;&#160; tenant_id&#160; (if multi-tenant Foundry)</text>
  <text x="410" y="148" font-size="10.5" fill="#14532D">&#x2713;&#160; language&#160; (if Foundry prompt is EN-only)</text>
  <text x="410" y="180" font-size="9" fill="#6B7280" font-style="italic">Keep it minimal. Every extra param is a maintenance surface.</text>
</svg>
</div>

**User identity** does not cross unless you pass it. CS knows who the authenticated user is (if auth is configured), but the Foundry endpoint receives an anonymous call. Pass `user_id` as a tool parameter if Foundry needs it for personalization, filtering, or audit logging.

**Conversation history** is CS's property. With MCP, Foundry gets a single tool call, not the transcript. If your Foundry agent needs prior context, summarize it in a `context_summary` parameter set earlier in the topic flow. (This is the main behavioral difference from A2A, where conversation history *is* passed by default - more on that below.)

**The CS system prompt** stays in CS. Foundry's deployment prompt is separate. If both layers share policy (tone, scope, prohibited topics), maintain it in both places or reference a shared document.

> Do not pass the full conversation transcript on every call. You will burn tokens and hit payload limits fast. Pass only what the Foundry task actually requires.
{: .prompt-warning }

## Gotchas

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| "Tool call failed" with no useful message | Foundry returned non-200 that the Function did not catch | Wrap the Foundry call in try/catch; return a human-readable `isError: true` MCP response |
| Tool never gets called even though it is added | [Generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) is off | Turn it on in the agent's **Overview** settings; MCP tools only work with generative orchestration |
| Latency spikes above 15s, or CS tool times out | Two orchestrators in series plus a thread/poll loop on the Foundry side - CS tool calls have their own execution ceiling (similar to the [100-second wall](https://learn.microsoft.com/microsoft-copilot-studio/advanced-flow-actions#asynchronous-flow-actions-using-the-continuation-pattern) on Power Automate actions) | Keep Foundry tasks narrow; for stateless single-turn analysis, prefer the simpler [hosted-agent endpoint](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent) (`/agents/{name}/endpoint/protocols/openai/responses`) over the Threads+Runs poll loop |
| Foundry response cut off mid-sentence | CS context window overflowed on a large Foundry response | Instruct Foundry to return structured summaries, not full prose dumps |
| Agent calls Foundry on every user message | Tool description is too broad | Tighten the description with explicit trigger conditions ("Use when the user asks to review a contract...") - the orchestrator reads this verbatim |
| Works in DEV, breaks after solution import | Connection reference not mapped in target environment | After each pipeline deploy, map the connection reference per the [ALM guidance]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}) |

## The Other Patterns

MCP is the right default, but two alternatives are worth knowing. The official [MCP vs A2A comparison](https://learn.microsoft.com/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns#evaluating-mcp-and-a2a-in-agent-architectures) covers the trade-offs in detail.

| Pattern | Best for | Key difference vs MCP |
|---------|---------|-----------|
| **MCP connector** | AI-selected invocation; the tool description does the routing | This post's default |
| **Custom connector** | Deterministic invocation where a topic always calls Foundry at step X | No dynamic tool selection; you author the call explicitly in a topic |
| **[A2A (Agent-to-Agent)](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-agent-to-agent)** | An *A2A-enabled* external agent that maintains its own conversation state | **A2A passes the full conversation history (contextId + chat history) automatically**, unlike MCP. Use when the external agent needs continuity, not one-off tool calls. Note: a Foundry Agent Service deployment does not expose an A2A endpoint by default - you wrap it (see the [Simple-A2A-Sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/extensibility/a2a/Simple-A2A-Sample) for the .NET pattern). Toggle off **Pass conversation history to this agent** for a thinner boundary. |

If you are connecting to another Copilot Studio agent rather than a Foundry one, see [Connect to an existing Copilot Studio agent](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-copilot-studio-agent) - it follows the same A2A model with conversation-history passing controllable per connection.

## Is This the Right Pattern?

Three questions before you commit:

1. **Does the capability genuinely belong in Foundry?** If complex retrieval is the need, a Power Automate flow, CS knowledge source, or [Azure AI Search grounded Foundry tool](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/ai-search) often covers it. Fine-tuned models, Python-based agent tools, and multi-step agentic chains belong in Foundry.

2. **Is the team ready to maintain two systems?** The CS/Foundry split only scales when two teams own the two layers. One person owning both adds overhead without adding capacity. In that case, keep everything in one tool.

3. **Can the seam stay thin?** If Foundry needs full conversation state to function, you do not have a clean MCP boundary - you have a dependency. That is the signal to switch to A2A (where conversation history flows automatically) or to keep more of the logic in CS.

## Resources

**Copilot Studio**

- [Extend your agent with Model Context Protocol](https://learn.microsoft.com/microsoft-copilot-studio/agent-extend-action-mcp) - the MCP integration overview
- [Connect your agent to an existing MCP server](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-existing-server-to-agent) - the onboarding wizard
- [Add tools and resources from an MCP server](https://learn.microsoft.com/microsoft-copilot-studio/mcp-add-components-to-agent) - tool selection and configuration
- [Connect an agent over A2A](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-agent-to-agent) - the alternative when you need conversation history threading
- [Multi-agent patterns: MCP vs A2A](https://learn.microsoft.com/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns) - the official architecture guidance
- [Generative orchestration best practices](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions) - why your tool descriptions matter
- [MCP troubleshooting](https://learn.microsoft.com/microsoft-copilot-studio/mcp-troubleshooting)

**Azure AI Foundry**

- [Foundry Agent Service quickstart (REST)](https://learn.microsoft.com/azure/foundry-classic/agents/quickstart) - the GA Threads + Runs pattern used in the code sample
- [Deploy a hosted agent](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent) - newer single-shot invocation (`/agents/{agent}/endpoint/protocols/openai/responses`); preview, but simpler for stateless tasks
- [Connect an Azure AI Search index to Foundry agents](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/ai-search) - grounding pattern for the specialist layer
- [Simple A2A sample (.NET)](https://github.com/microsoft/CopilotStudioSamples/tree/main/extensibility/a2a/Simple-A2A-Sample) - reference for wrapping an external agent with the A2A protocol if you choose that pattern

**Related CAT blog posts**

- [Five Minutes to Your First MCP Connector in Copilot Studio]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}) - the MCP setup pattern this post builds on
- [Combining Agent Flows with Agents: Gotchas, Errors, and Patterns]({% post_url 2026-04-17-combining-agent-flows-and-agents-gotchas-errors-and-patterns %}) - same multi-component mindset applied to agent flows

---

*Have you shipped a CS + Foundry hybrid in production? What did the context-passing look like in your case, and what surprised you about the boundary? Drop it in the comments.*
