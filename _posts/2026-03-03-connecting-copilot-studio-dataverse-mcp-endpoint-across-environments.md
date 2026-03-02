---
layout: post
title: "Connecting Copilot Studio to a Dataverse MCP Endpoint Across Environments: A Practical Guide"
date: 2026-03-03 23:59:00 +0000
categories: [copilot-studio, dataverse, mcp]
tags:
  [
    oauth,
    custom-connector,
    power-platform,
    entra-id,
    cross-environment,
    mcp-integration,
  ]
description: "How to securely connect a Copilot Studio agent in one environment to a Dataverse MCP endpoint in another environment using OAuth and a custom connector."
author: rcalejo
image:
  path: /assets/posts/dataverse-mcp-cross-environments/cover.png
  alt: "Connecting Copilot Studio to a Dataverse MCP endpoint across environments"
  no_bg: true
---

The Model Context Protocol (MCP) is transforming how AI agents connect to enterprise data and tools. With Microsoft Copilot Studio now supporting MCP servers, makers can run real-time queries against Dataverse and other systems, unlocking richer and more contextual agent behavior.

However, there is an important architectural limitation to understand before planning multi-environment scenarios:

> The out-of-the-box Dataverse MCP tool in Copilot Studio only connects to the Dataverse environment you select inside Copilot Studio. It does not provide a built-in way to connect to Dataverse MCP servers in other environments.

If your goal is to have a Copilot Studio agent in Environment A interact with an MCP server hosted in Environment B, you must handle this through custom authentication and connector configuration, not through the built-in Dataverse MCP tool.

This post walks through how to make that work.

## 🚀 Integration Scenario

You have:

- Copilot Studio agent in environment **Developer**
- An MCP server endpoint in environment **Production**
- OAuth 2.0 securing the MCP server
- No Dynamic Client Registration (DCR) available in Dataverse / Entra ID

Your goal is to authenticate your Copilot agent and allow it to call the remote MCP server securely.

## ✅ Step 1 — Register an OAuth app in the remote environment

Since Dataverse and Entra ID do not support dynamic registration for this flow, create an OAuth client manually:

1. Go to **Microsoft Entra ID** → **App registrations**.
2. Select **New registration**.
3. Name the app (for example: `CopilotAgent-MCP-Connector`).
4. Add the redirect URI used by Copilot Studio / Custom Connector setup.
5. Configure required API permissions and grant admin consent.
6. Record `client_id`, `tenant_id`, and `client_secret` (if confidential client).

![Step 1 screenshot](/assets/posts/dataverse-mcp-cross-environments/inline-01.png){: .shadow }

This app represents the identity your Copilot agent will use in the remote environment.

## ✅ Step 2 — Add the app registration to Dataverse as an Application User

Once the OAuth app exists, a System Administrator in the target Dataverse environment must allow it:

1. In Power Apps, switch to the **Production** environment.
2. Open **Advanced Settings** (or PPAC equivalent).
3. Go to **Security** → **Users + Permissions** → **Application Users**.
4. Select **+ New App User**.
5. Choose the app registration created in Entra ID.
6. Assign appropriate security roles (minimum required privileges, or System Administrator temporarily for validation).
7. Save the App User.

![Step 2 screenshot](/assets/posts/dataverse-mcp-cross-environments/inline-02.png){: .shadow }

At this point, the production Dataverse environment trusts the OAuth client identity.

## ✅ Step 3 — Create the custom connector by importing from GitHub

Instead of building from scratch, import the MCP connector template.

In Power Apps (`https://make.powerapps.com`):

1. Go to **Data** → **Custom connectors** → **New custom connector**.
2. Choose **Import from GitHub**.
3. Under connector type, choose **Custom**.
4. Use values:
   - Branch: `dev`
   - Connector: `MCP-Streamable-HTTP`
5. Confirm import and continue.

![Step 3 screenshot A](/assets/posts/dataverse-mcp-cross-environments/inline-03.png){: .shadow }
![Step 3 screenshot B](/assets/posts/dataverse-mcp-cross-environments/inline-04.png){: .shadow }
![Step 3 screenshot C](/assets/posts/dataverse-mcp-cross-environments/inline-05.png){: .shadow }

In the `InvokeServer` action, update the target environment URL with `api/mcp`. This points to the Dataverse MCP server in the target environment.

![Step 3 screenshot D](/assets/posts/dataverse-mcp-cross-environments/inline-06.png){: .shadow }

Create the connection and save the custom connector.

## ✅ Step 4 — Add the MCP custom connector to your agent in Copilot Studio

With the connector imported, attach it to your agent:

1. Open your agent in Copilot Studio.
2. Go to **Tools**.
3. Select **+ Add tool**.
4. Choose **Custom Connector**.
5. Select your imported `MCP-Streamable-HTTP` connector.
6. Save.
7. Test an MCP tool operation such as `list_tables`.

![Step 4 screenshot A](/assets/posts/dataverse-mcp-cross-environments/inline-07.png){: .shadow }

### 📍 Why the first test should fail

Immediately after adding the connector, the test can fail and that is expected:

- The Copilot Studio client identity has not yet been authorized in the Production environment for this connector.
- The Production environment correctly blocks unauthorized MCP calls.

Then go to PPAC, select the Production environment, and authorize the required client ID under features/authorized access (using your own publisher prefix for unique names).

![Step 4 screenshot B](/assets/posts/dataverse-mcp-cross-environments/inline-08.png){: .shadow }
![Step 4 screenshot C](/assets/posts/dataverse-mcp-cross-environments/inline-09.png){: .shadow }

After authorization, tests should succeed across environments.

## 🎯 What you achieve

By following these steps, you enable:

- Secure OAuth 2.0 authentication
- Cross-environment MCP communication
- Copilot Studio as an MCP client
- Enterprise governance over API access

## 💬 Final thoughts

As MCP adoption grows, more servers will likely add automatic onboarding patterns. Today, for enterprise-grade systems like Dataverse, Power Platform, and Entra ID, manual registration remains a practical and secure approach when paired with Copilot Studio custom connectors.

If you are experimenting with MCP across environments or tenants, this approach keeps the architecture clean, secure, and production-ready.

---

Source article: [Connecting Copilot Studio to a Dataverse MCP Endpoint Across Environments: A Practical Guide](https://www.linkedin.com/pulse/connecting-copilot-studio-dataverse-mcp-endpoint-across-calejo-oi6re)
