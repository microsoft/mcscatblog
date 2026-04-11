---
layout: post
title: "Five Minutes to MCP: Your First Copilot Studio MCP Connector"
date: 2026-04-10
categories: [copilot-studio, mcp]
tags: []
description: ""
author: chrisgarty
image:
  path: /assets/posts/hello-world-mcp-copilot-studio/cat-building-agent-with-mcp.png
  alt: A cat stacking MCP, Tools, Agent, and Prompt building blocks on a Copilot Studio foundation
---

Every MCP tutorial seems to start the same way: "First, build an MCP server." But what if you just want to see an MCP server working in Copilot Studio, without an existing connector and without writing a single line of code?

You can connect a Copilot Studio agent to an existing, publicly available MCP server in about five minutes. No server setup, no authentication, no deployment. Just paste a URL and go.

## What We're Connecting

[DeepWiki](https://deepwiki.com) provides a free, public MCP server that lets you query documentation for any public GitHub repository. No API key required. It exposes three tools:

| Tool | What it does |
|------|-------------|
| `read_wiki_structure` | Lists documentation topics for a GitHub repo |
| `read_wiki_contents` | Retrieves the actual documentation content |
| `ask_question` | Answers questions about a repo using AI-grounded context |

> DeepWiki uses the Streamable HTTP transport, which is what Copilot Studio's MCP integration requires.
{: .prompt-info }

## Step 1: Add the MCP Server to Your Agent

In Copilot Studio, open your agent (or create a new one) and navigate to **Tools**.

1. Click **Add a tool**
2. Select **Model Context Protocol**
3. Enter the server URL: `https://mcp.deepwiki.com/mcp`
4. Give it a name like "DeepWiki"
5. Set the Server description to "DeepWiki provides information about GitHub repositories"
6. Leave Authentication as **None**
7. Click **Create**

![Adding the DeepWiki MCP server URL in the MCP configuration dialog](/assets/posts/hello-world-mcp-copilot-studio/add-mcp-tool-deepwiki.png){: .shadow }

For more detail about *MCP onboarding* wizard, see the [official documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent).

## Step 2: Select Tools for Your Agent

1. In the Connection dropdown, click **Create connection**, then click **Create**, then click **Add and configure**
2. Review the tools that the MCP server provides. You'll see the three DeepWiki tools listed. Tools can be individually disabled as needed.

![DeepWiki MCP tools available to the agent](/assets/posts/hello-world-mcp-copilot-studio/deepwiki-tools.png){: .shadow }

## Step 3: Test It

1. Open the **Test** pane and try a prompt like: "What is the BotFramework-WebChat repo about?"
2. On first use, you'll need to enable the connection. Click **Open connection manager**, then click **Connect**, then click **Submit**. Back in the test panel, click **Retry** and the prompt will now continue.
3. The agent will now call the DeepWiki MCP tools and return a grounded answer based on the repository's documentation.

![Agent responding to a question using the DeepWiki MCP tools](/assets/posts/hello-world-mcp-copilot-studio/agent-responding-using-deepwiki-mcp.png){: .shadow }

That's it. You have a working MCP connector configured as a tool for your agent.

## What Just Happened?

When you added the MCP server through the wizard, Copilot Studio created a **custom connector** in your Power Platform environment under the hood. This connector contains an OpenAPI specification that routes requests to the MCP server's `/mcp` endpoint using the Streamable HTTP protocol.

You can view and edit this connector in the current solution. From the agent details page, click the **...** menu, select **View solution**, and then find the "DeepWiki" Custom Connector. If you want to inspect the generated spec or make changes, click on the custom connector, then click **Edit**. This is exactly what you'd do if you needed to [add custom headers]({% post_url 2025-10-22-mcp-custom-headers %}) to your connector.

![The DeepWiki custom connector in the solution view](/assets/posts/hello-world-mcp-copilot-studio/view-solution.png){: .shadow }

## What's Next?

- **Build your own MCP server** — the [Copilot Studio MCP lab](https://devblogs.microsoft.com/powerplatform/microsoft-copilot-studio-mcp/) walks through creating a Jokes MCP server from scratch and connecting it
- **Customize your connector** — once you need to pass headers, tokens, or user context, see [Adding Custom Headers to MCP Connectors]({% post_url 2025-10-22-mcp-custom-headers %}) to go deep with a full lab exercise
- **Choose your integration pattern** — not sure whether to use MCP or a traditional connector? The [MCP vs Connectors decision guide]({% post_url 2026-01-29-compare-mcp-servers-pp-connectors %}) breaks down the trade-offs

---

*What MCP server are you going to connect to next?*
