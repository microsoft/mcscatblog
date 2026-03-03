---
layout: post
title: "Connecting Copilot Studio to a Dataverse MCP Endpoint Across Environments: A Practical Guide"
date: 2026-03-03 00:00:00 +0000
categories: [copilot-studio, mcp]
tags:
  [
    dataverse,
    oauth,
    custom-connector,
    authentication,
    entra-id,
    cross-environment,
    app-registration,
  ]
description: "How to securely connect a Copilot Studio agent in one environment to a Dataverse MCP endpoint in another environment using OAuth and a custom connector."
author: rcalejo
image:
  path: /assets/posts/dataverse-mcp-cross-environments/cover.png
  alt: "Connecting Copilot Studio to a Dataverse MCP endpoint across environments"
  no_bg: true
---

Many enterprises centralize their master data in a single Dataverse environment: customer records, product catalogs, reference tables. But the agents that need that data often live somewhere else. Your Sales team builds agents in their own environment, HR has theirs, and Operations has yet another. When you add a Dataverse MCP tool in Copilot Studio, it connects to the environment you select right there in the studio, and that's it.

So what happens when your agent is in one environment but the data it needs lives in another?

> The built-in Dataverse MCP tool in Copilot Studio only connects to the Dataverse environment you select inside Copilot Studio. It does not provide a way to connect to Dataverse MCP servers in other environments.
{: .prompt-info }

The good news is that you can bridge that gap with a [custom connector]({% post_url 2025-12-05-obo-for-custom-connectors %}) and OAuth. This post walks through the setup step by step.

## Integration Scenario

Imagine you have:

- A **Central CRM** environment with your organization's master customer and product data, with a Dataverse MCP server enabled
- A **Sales** environment where your team builds Copilot Studio agents

Your goal is to let the Sales agent query Dataverse tables in the Central CRM environment, securely, without moving data or duplicating environments. Since the Dataverse MCP server is secured with OAuth 2.0, you need to handle authentication across the environment boundary.

## Step 1 — Register an OAuth app in the remote environment

Dataverse and Entra ID do not support Dynamic Client Registration (DCR), so you need to create an OAuth client manually in the tenant that owns the Central CRM environment:

1. Go to **Microsoft Entra ID** → **App registrations**.
2. Select **New registration**.
3. Name the app (for example: `CopilotAgent-MCP-Connector`).
4. Add the redirect URI used by Copilot Studio / Custom Connector setup.
5. Configure required API permissions and grant admin consent.
6. Record `client_id`, `tenant_id`, and `client_secret` (if confidential client).

![Entra ID API permissions showing Dynamics CRM and Microsoft Graph delegated permissions](/assets/posts/dataverse-mcp-cross-environments/inline-03.png){: .shadow }
_API permissions configured on the app registration: Dynamics CRM and Microsoft Graph delegated access_

This app represents the identity your Sales agent will use when calling into the Central CRM environment.

## Step 2 — Add the app registration to Dataverse as an Application User

Once the OAuth app exists, a System Administrator in the Central CRM environment must allow it:

1. In Power Apps, switch to the **Central CRM** environment.
2. Open **Advanced Settings** (or the Power Platform Admin Center equivalent).
3. Go to **Security** → **Users + Permissions** → **Application Users**.
4. Select **+ New App User**.
5. Choose the app registration created in Entra ID.
6. Assign appropriate security roles (minimum required privileges, or System Administrator temporarily for validation).
7. Save the App User.

![Allowed MCP Client record in Dataverse with Application Id and enabled status](/assets/posts/dataverse-mcp-cross-environments/inline-04.png){: .shadow }
_The Allowed MCP Client record in the target Dataverse environment_

At this point, the Central CRM environment trusts the OAuth client identity.

## Step 3 — Create the custom connector by importing from GitHub

Instead of building from scratch, import the MCP connector template.

In Power Apps (`https://make.powerapps.com`):

1. Go to **Data** → **Custom connectors** → **New custom connector**.
2. Choose **Import from GitHub**.
3. Under connector type, choose **Custom**.
4. Use values:
   - Branch: `dev`
   - Connector: `MCP-Streamable-HTTP`
5. Confirm import and continue.

![Import from GitHub dialog showing Custom connector type, dev branch, and MCP-Streamable-HTTP connector](/assets/posts/dataverse-mcp-cross-environments/inline-02.png){: .shadow }
_Importing the MCP-Streamable-HTTP connector from GitHub_

![Custom connector General Information tab with host and description](/assets/posts/dataverse-mcp-cross-environments/inline-06.png){: .shadow }
_General Information tab pointing to the target Dataverse environment_

![Custom connector Security tab with OAuth 2.0 client credentials configuration](/assets/posts/dataverse-mcp-cross-environments/inline-07.png){: .shadow }
_Security tab configured with OAuth 2.0 credentials for the remote environment_

In the `InvokeServer` action, update the target environment URL with `api/mcp`. This points to the Dataverse MCP server in the target environment.

![InvokeServer action Request URL pointing to the Dataverse MCP endpoint](/assets/posts/dataverse-mcp-cross-environments/inline-05.png){: .shadow }
_The InvokeServer action URL updated to point to the remote Dataverse MCP endpoint_

Create the connection and save the custom connector.

## Step 4 — Add the MCP custom connector to your agent in Copilot Studio

With the connector imported, attach it to your agent:

1. Open your agent in Copilot Studio.
2. Go to **Tools**.
3. Select **+ Add tool**.
4. Choose **Custom Connector**.
5. Select your imported `MCP-Streamable-HTTP` connector.
6. Save.
7. Test an MCP tool operation such as `list_tables`.

![MCP tool configuration in Copilot Studio showing Dataverse MCP in another environment](/assets/posts/dataverse-mcp-cross-environments/inline-09.png){: .shadow }
_The MCP tool added to the agent in Copilot Studio, showing available tools like list\_tables_

### Why the first test should fail

Immediately after adding the connector, the test can fail and that is expected:

- The Copilot Studio client identity has not yet been authorized in the Central CRM environment for this connector.
- The Central CRM environment correctly blocks unauthorized MCP calls.

Then go to the Power Platform Admin Center (PPAC), select the Central CRM environment, and authorize the required client ID under features/authorized access (using your own publisher prefix for unique names).

![Power Platform Admin Center Dataverse MCP settings with arrow pointing to Advanced Settings](/assets/posts/dataverse-mcp-cross-environments/inline-08.png){: .shadow }
_PPAC Dataverse MCP settings: enable MCP client access and navigate to Advanced Settings to add allowed clients_

After authorization, tests should succeed across environments.

![Agent successfully querying Dataverse tables across environments](/assets/posts/dataverse-mcp-cross-environments/inline-01.png){: .shadow }
_The agent successfully querying Dataverse tables in the remote environment_

## What you achieve

By following these steps, you enable:

- Secure OAuth 2.0 authentication across environment boundaries
- Cross-environment MCP communication via a custom connector
- Copilot Studio acting as an MCP client against any Dataverse environment
- Enterprise governance over which identities can access which data

Have you tried connecting Copilot Studio to MCP servers across environments or tenants? What challenges did you run into? Let us know in the comments.

