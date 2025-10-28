---
layout: post
title: "Adding Custom Headers to MCP Connectors in Copilot Studio"
date: 2025-10-22
categories: [copilot-studio, tutorial, mcp]
tags: [mcp, model-context-protocol, custom-connector, headers, authentication]
author: adilei
---

# Custom Headers in MCP Connectors

The Model Context Protocol (MCP) allows Copilot Studio agents to connect to external servers that provide tools (and prompts as of recently). While MCP connectors in Copilot Studio are built on top of the custom connector framework, adding custom headers requires editing the OpenAPI specification directly - there's no UI for this yet.

## Why Custom Headers?

Custom headers serve different purposes than tool inputs:

- **Tool inputs** define the parameters that the AI orchestrator uses to invoke specific MCP tools (like passing a `query` parameter to a search tool)
- **Custom headers** provide server-level context that applies to ALL tool invocations from a given user or session

Common use cases for custom headers in MCP servers include:

1. **Custom Authentication**: Passing API keys, tokens, or credentials that aren't supported by standard OAuth flows
2. **User Context**: Providing user roles, departments, or permission levels to filter available tools or data
3. **Feature Flags**: Enabling/disabling server capabilities based on user tier or subscription level

## The Challenge: No UI Support Yet

> As of October 2025, there's **no UI in Power Apps or Copilot Studio** to add custom headers to MCP connectors. You must define them directly in your connector's OpenAPI specification YAML. 
{: .prompt-warning }

This means you need to:
1. Edit the OpenAPI YAML specification manually
2. Add the custom header parameters in the right location
3. Refresh the connector for each agent

Let's walk through exactly how to do this. But first, an example!

## Use Case: A D&D Adventurer's Guild MCP Server

To understand why custom headers matter, let's look at a real (or quasi-real?) example: an MCP server that simulates a D&D-style Adventurer's Guild.

Our server provides tools for managing quests, hiring adventuring parties, and checking your gold balance. Additionally, **quest availability is filtered by player level**, but player level isn't something the AI should decide—it's determined by the user's guild rank.

Here's the `list_quests` tool from our MCP server:

```typescript
server.tool(
  "list_quests",
  "List available quests, including ideal classes and needs.",
  {},
  async () => {
    const ctx = getCurrentContext();  // Retrieves player level from request context
    const q = visibleQuests(ctx.level);  // Filters quests based on level
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ level: ctx.level, quests: q }, null, 2)
        }
      ]
    };
  }
);
```

The server stores different quests with varying difficulty levels, so only level-appropriate quests are returned with each tool call:

```typescript
const QUESTS = [
  { 
    id: "q1", 
    title: "Rat Problem", 
    danger: "Easy",
    reward: 10
  },
  { 
    id: "q4", 
    title: "Crypt of Ashes", 
    danger: "Deadly",
    reward: 120
  },
  { 
    id: "q5", 
    title: "Dragon's Parley", 
    danger: "Legendary",
    reward: 300
  }
];

// What each guild rank can see
const QUEST_VIS_BY_LEVEL: Record<Level, Danger[]> = {
  Novice: ["Easy","Medium"],
  Adept: ["Easy","Medium","Hard"],
  Veteran: ["Easy","Medium","Hard","Deadly"],
  Mythic: ["Easy","Medium","Hard","Deadly","Legendary"]
};
```

### Why This Needs a Custom Header

Player level affects **what the server returns**, and by implication, what the AI orchestrator sees:

- A **Novice** player calling `list_quests` gets back only "Rat Problem" and similar easy quests
- A **Mythic** player gets the full quest catalog, including "Dragon's Parley"

This is **server-level context**, not a tool input. Here's why:

| player level as tool input | player level as custom connector |
|-----------------------------------|----------------------------|
| AI could pass any level value | User's level is verified and consistent |
| Different for each tool call | Same for all tools in the session |
| Each tool needs the parameter | Set once at the connection level |

Now let's see how to configure this custom header in your MCP connector.

## Adding a Custom Header to Your MCP Connector

Microsoft provides [detailed documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent) on adding MCP servers to Copilot Studio agents. This guide extends that process to include custom headers via OpenAPI specification modifications.

![version validation](/assets/posts/mcp-custom-headers/mcp-wizard.png){: .shadow w="700" h="400"}
_MCP Configuration Wizard_

### Step 1: Locate Your Custom Connector

If you've already added an MCP connector using the [method specified in Microsoft's documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent), a new custom connector has been created in your Power Platform environment representing the MCP server.

To access and edit this custom connector:

1. Navigate to the Power Apps custom connectors page: `https://make.powerapps.com/environments/{your-environment-id}/customconnectors`
2. Locate your MCP connector in the list
3. Click the **pencil icon** (Edit) to open the connector editor

### Step 2: Edit the OpenAPI Specification in Swagger Editor

Once you're in the custom connector editor, you can directly edit the connector's YAML:

1. Toggle the **Swagger editor** switch (located in the top right of the interface)
2. Locate the `parameters` section under the `/mcp` POST endpoint (or add one if it doesn't exist)
3. Add your custom header definition directly in the editor
4. Click **Update connector** to save your changes

For our D&D Adventurer's Guild example, we need to add the `user-level` header. Here's what the complete YAML should look like with the custom header added:

```yaml
swagger: '2.0'
info:
  title: guildhall mcp server
  description: guildhall mcp server this is a longer desc
  version: 1.0.0
host: kmvg53tj-3000.eun1.devtunnels.ms
basePath: /
schemes:
  - https
paths:
  /mcp:
    post:
      responses:
        '200':
          description: Immediate Response
      x-ms-agentic-protocol: mcp-streamable-1.0
      operationId: InvokeServer
      parameters:                           # ← Add new header configuration here
        - name: user-level                
          in: header                        
          type: string                     
          required: false                   
          description: the user's rank      
securityDefinitions: {}
security: []
```

> **Known Issue (October 2025)**: Custom headers using the `X-` prefix pattern (e.g., `X-User-Level`, `X-Tenant-ID`) are currently not working with MCP connectors. Use header names without the `X-` prefix (like `user-level`) until this is resolved. Microsoft teams are actively working on fixing this issue.
{: .prompt-warning }

### Step 3: Refresh the Connector in Your Agent

After updating the custom connector definition, you need to refresh the connector definition in Copilot Studio for the changes to take effect:

1. Navigate to your agent in Copilot Studio
2. Go to the **Tools** tab
3. Locate your MCP connector in the tools list
4. Click the **three dots** (...) menu next to the connector
5. Select **Delete** to remove the connector from your agent
6. Click **Add a tool** to add it back
7. Search for and select your updated MCP connector

> Simply updating the custom connector definition in Power Apps is not enough. You must remove and re-add the connector in each agent that uses it for the new custom header configuration to be recognized.
{: .prompt-warning }

### Step 4: Configure Custom Header Values

After re-adding the connector, your custom headers become available as inputs. You can configure them by:

1. Click on the newly added MCP connector in your Tools list
2. Navigate to the **Inputs** section
3. Click **+ Add input**
4. You'll see your custom header (e.g., `user-level`) in the available inputs list
5. Select it to add it as a connector input

![version validation](/assets/posts/mcp-custom-headers/add-input.png){: .shadow w="700" h="400"}
_Add an input to the MCP connector_

Input values can either be hardcoded or set dynamically using system variables and PowerFX. 

---

## Update: Full Hands-On Lab Available!

Want to build this yourself? Check out the complete **Adventurer's Guild Lab** that walks through implementing custom headers and OAuth 2.0 authentication for MCP servers:

**[🎲 Guildhall Custom MCP Lab](https://microsoft.github.io/mcs-labs/labs/guildhall-custom-mcp/?event=azure-ai-workshop#why-this-quest-matters)**

The lab includes:
- Complete working MCP server sample (TypeScript)
- Step-by-step guide for custom headers and bearer token authentication
- Microsoft Entra ID app registration configuration
- OpenAPI specification examples
- End-to-end Copilot Studio integration

---

*Have you implemented custom headers in your MCP connectors? What use cases are you solving? May your MCP code compile and your quests succeed! Share your adventures in the comments below!*