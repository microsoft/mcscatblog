---
layout: post
title: "Connecting Salesforce's Hosted MCP Server to Copilot Studio"
date: 2026-10-14
categories: [copilot-studio, mcp]
tags: [mcp, model-context-protocol, salesforce, oauth, authentication, copilot-studio]
description: "Connect Salesforce's SObject All hosted MCP server to a Copilot Studio agent using an External Client App and manual OAuth, then validate reads and controlled updates."
author: MarcusCastroMSFT
agent_edition: github-copilot
image:
  path: /assets/posts/salesforce-mcp-copilot-studio/header.png
  alt: Salesforce and Copilot Studio connected through MCP with OAuth 2.0 authentication
  no_bg: true
---

Your sales team wants to ask an agent for the latest opportunities, update a close date, and add a note without switching between chat and Salesforce. The interesting part isn't just retrieving CRM data. It's making sure the agent can act on that data with the right user's permissions.

Salesforce's hosted Model Context Protocol (MCP) servers provide tools for working with Salesforce records. In this walkthrough, we'll connect **SObject All** directly to a Copilot Studio agent, using a Salesforce **External Client App** and **manual OAuth 2.0 configuration**. Then we'll test a read, make a controlled update, and verify the result in Salesforce.

> The screenshots use Copilot Studio's [GitHub Copilot harness](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview). The linked MCP onboarding documentation describes the standard harness, so navigation and button labels can differ. This walkthrough follows the captured Build experience and identifies the OAuth settings explicitly.
{: .prompt-info }

## Before you begin

You'll need:

- Salesforce System Administrator or equivalent permissions to create an External Client App and access hosted MCP server setup.
- Access to the target Copilot Studio environment and agent.
- A Salesforce user with the object, field, and record access needed for your test.
- A controlled test opportunity that you can safely modify.

Salesforce's [org setup guide](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/setup-overview.html) explains the authentication prerequisites. Its [SObject All reference](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/sobject-all.html) describes the tools, endpoints, and permission model.

**SObject All supports reads and writes**, including deletes. Salesforce still applies the authenticated user's object permissions, field-level security, and sharing rules. We'll also limit the tools exposed to the agent before testing.

> Don't start with a production opportunity. Use controlled records and a least-privileged Salesforce account. Keep consumer secrets, access tokens, and refresh tokens out of screenshots, prompts, and source control.
{: .prompt-warning }

### Choose the right endpoints

The implementation shown here used a Developer Edition org. Production and Developer Edition use the production endpoints below. For a sandbox, change **both the MCP server URL and the OAuth endpoints**.

| Setting | Production / Developer Edition | Sandbox |
|---|---|---|
| MCP server URL | `https://api.salesforce.com/platform/mcp/v1/platform/sobject-all` | `https://api.salesforce.com/platform/mcp/v1/sandbox/platform/sobject-all` |
| Authorization URL | `https://login.salesforce.com/services/oauth2/authorize` | `https://test.salesforce.com/services/oauth2/authorize` |
| Token URL | `https://login.salesforce.com/services/oauth2/token` | `https://test.salesforce.com/services/oauth2/token` |
| Refresh token URL | `https://login.salesforce.com/services/oauth2/token` | `https://test.salesforce.com/services/oauth2/token` |
| Scopes | `mcp_api refresh_token` | `mcp_api refresh_token` |

The MCP endpoint comes from the [SObject All reference](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/sobject-all.html). Salesforce documents the production and sandbox login hosts in its [OAuth web server flow guide](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_web_server_flow.htm&type=5).

## 1. Create the Salesforce External Client App

The External Client App registers Copilot Studio as an OAuth client in Salesforce. It provides the client credentials and defines where Salesforce can send the authorization response.

Follow Salesforce's [External Client App setup instructions](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html) alongside the steps below. Salesforce specifies an **External Client App** for hosted MCP connections; Connected Apps aren't supported for this flow.

### Enter the basic information

1. In **Salesforce Setup**, enter **external** in **Quick Find**.
2. Select **Apps > External Client Apps > External Client App Manager**.
3. Select **New External Client App**.
4. Enter an **External Client App Name**, such as `Copilot Studio MCP Client`.
5. Enter an **API Name**, such as `Copilot_Studio_MCP_Client`, and your **Contact Email**.
6. Leave **Distribution State** as **Local** for this configuration.

![Salesforce External Client App Manager with New External Client App highlighted](/assets/posts/salesforce-mcp-copilot-studio/external-client-app-manager.png){: .shadow w="1000" }
_Open External Client App Manager and select New External Client App._

![External Client App basic information fields](/assets/posts/salesforce-mcp-copilot-studio/app-basic-information.png){: .shadow w="1000" }
_Provide the app name, API name, and contact email, with Local distribution selected._

### Enable OAuth and select the scopes

Expand **API (Enable OAuth Settings)** and select **Enable OAuth**.

The **Callback URL** is required, but Copilot Studio hasn't generated your redirect URL yet. For this setup, use a temporary HTTPS value such as `https://microsoft.com`. We'll replace it before creating the connection. Don't attempt to authenticate with the placeholder.

Move these entries into **Selected OAuth Scopes**:

- **Perform requests at any time** (`refresh_token`, `offline_access`).
- **Access Salesforce hosted MCP servers** (`mcp_api`).

![OAuth enabled with a temporary callback URL and the MCP and refresh token scopes](/assets/posts/salesforce-mcp-copilot-studio/app-oauth-scopes.png){: .shadow w="1000" }
_Enable OAuth, enter the temporary callback, and select the refresh token and hosted MCP scopes._

### Confirm the security settings

In **Security**, select **Issue JSON Web Token (JWT)-based access tokens for named users**.

In our configuration, **Require Proof Key for Code Exchange (PKCE)**, **Enable Refresh Token Rotation**, and **Limit idle Refresh Token Time-to-Live (TTL) to 30 Days** were already selected, with the UI indicating that changing them required Salesforce support. Keep those settings. Leave the **Flow Enablement** options unchecked, and follow Salesforce's setup guide for the remaining security options.

![External Client App security options with JWT-based access tokens selected](/assets/posts/salesforce-mcp-copilot-studio/app-security-settings.png){: .shadow w="826" }
_The configuration used PKCE, refresh token rotation, JWT-based access tokens, and the 30-day idle refresh token TTL._

Scroll to the bottom and select **Create** to save the app.

![Cancel and Create buttons in Salesforce](/assets/posts/salesforce-mcp-copilot-studio/create-app.png){: .shadow w="300" }
_Select Create after completing the OAuth and security settings._

### Retrieve the client credentials

After creating the app, open its **Settings** tab, expand **OAuth Settings**, and select **Consumer Key and Secret** under **App Settings**. Salesforce may ask you to verify your identity before displaying the values.

The field names map to Copilot Studio as follows:

| Salesforce | Copilot Studio |
|---|---|
| Consumer Key | Client ID |
| Consumer Secret | Client secret |

Store the values securely. You'll enter them in Copilot Studio, not in the agent's instructions.

![OAuth Settings with the Consumer Key and Secret button highlighted](/assets/posts/salesforce-mcp-copilot-studio/consumer-key-and-secret.png){: .shadow w="1000" }
_The Consumer Key and Secret button opens the credential values; this screenshot does not display them._

> Salesforce notes that a new External Client App can take **up to 30 minutes** to become operational. Account for that delay when testing, but check the configuration before assuming a failure is caused by propagation.
{: .prompt-info }

## 2. Activate the hosted MCP server

In **Salesforce Setup**, search for **MCP** and open **MCP Servers** under **Integrations > API Catalog**.

On the **Salesforce Servers** tab, locate **SObject All**. Open the server or its row action and activate it. Confirm that **Server Status** is **Active** before continuing. Salesforce's [hosted MCP documentation](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/setup-overview.html) is the starting point for org setup, while the [SObject All reference](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/sobject-all.html) describes this server's operations.

![Salesforce MCP Servers page with SObject All showing Active status](/assets/posts/salesforce-mcp-copilot-studio/active-sobject-all.png){: .shadow w="1000" }
_SObject All appears at the bottom of the server list with an Active status._

## 3. Add the server to your Copilot Studio agent

Now switch to Copilot Studio. Microsoft's [MCP onboarding guide](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent) documents the manual OAuth fields and callback sequence for the standard harness. The steps and screenshots below show the GitHub Copilot harness configuration used in our implementation.

For an introduction to MCP onboarding, see our [first MCP connector walkthrough]({% post_url 2026-04-10-hello-world-mcp-copilot-studio %}).

1. Open your target agent.
2. In the UI shown here, open **Build** and select **+** next to **Tools**. In environments with a dedicated **Tools** page, select **Add a tool** there.
3. In **Add a tool**, select **+ Add**, then **Model Context Protocol (MCP)**.

![Copilot Studio Add a tool dialog with the MCP option highlighted](/assets/posts/salesforce-mcp-copilot-studio/add-mcp-tool.png){: .shadow w="1000" }
_Add the hosted server using the Model Context Protocol option._

### Enter the server and authentication details

Complete the first part of **Add MCP server**:

| Field | Value |
|---|---|
| Server name | `Salesforce MCP Server` |
| Server URL | The MCP endpoint for your org type from the earlier table |
| Authentication | **OAuth 2.0** |
| Configuration type | **Manual** |
| Client ID | The External Client App's **Consumer Key** |
| Client secret | The External Client App's **Consumer Secret** |

Give the server a description that tells the agent when to use it. For example:

> Use this Salesforce MCP server to work with live Salesforce CRM data and records. Use it when the user asks to find, retrieve, create, or update Salesforce records, including accounts, contacts, leads, opportunities, cases, and related CRM data.

Keep the description aligned with the tools you intend to enable. It isn't an authorization control: we'll configure tool permissions separately.

![Add MCP server form with Salesforce endpoint and manual OAuth configuration](/assets/posts/salesforce-mcp-copilot-studio/mcp-server-details.png){: .shadow w="760" }
_Enter the server details and select OAuth 2.0 with Manual configuration. Client credentials are masked._

Scroll down and enter the **Authorization URL**, **Token URL**, **Refresh token URL**, and space-separated **Scopes** from the endpoint table.

For the production / Developer Edition configuration shown here, the scopes are `mcp_api refresh_token`, and both token fields use `https://login.salesforce.com/services/oauth2/token`.

![Manual OAuth fields containing Salesforce endpoints and scopes](/assets/posts/salesforce-mcp-copilot-studio/mcp-oauth-endpoints.png){: .shadow w="760" }
_The OAuth configuration uses Salesforce's authorization and token endpoints with the MCP and refresh token scopes._

Select **Add** to create the server definition. The current documentation may label this action **Create**.

### Copy the generated redirect URL

Copilot Studio displays **Save your redirect URL**. Use **Copy** to capture the full URL, because the field can truncate it on screen.

**Don't select Next yet.** Salesforce needs this exact URL registered before you create the connection.

![Save your redirect URL screen with Copy highlighted](/assets/posts/salesforce-mcp-copilot-studio/copy-redirect-url.png){: .shadow w="760" }
_Copy your generated redirect URL. The instance-specific portion is redacted in this screenshot; don't copy the screenshot's example._

## 4. Complete the callback and sign in

Return to **Salesforce Setup > External Client App Manager**, open your app, and select **Edit** on the **Settings** tab.

Expand **OAuth Settings** and replace the temporary **Callback URL** with the full redirect URL copied from Copilot Studio. Select **Save**.

![Salesforce callback field updated with the Copilot Studio redirect URL](/assets/posts/salesforce-mcp-copilot-studio/update-callback-url.png){: .shadow w="1000" }
_Replace the placeholder with your own Copilot Studio redirect URL, preserving it exactly._

Then return to Copilot Studio:

1. Select **Next** on **Save your redirect URL**.
2. Create a new connection.
3. Sign in with the intended Salesforce account and approve the requested access.
4. Complete **Add to agent** if your UI presents that step.

### If you see a redirect error

Salesforce can return this error when the callback doesn't match:

```text
error=redirect_uri_mismatch&error_description=redirect_uri must match configuration
```

Compare the Salesforce callback with the Copilot Studio redirect **character for character**, including the scheme, path, and any trailing slash. Check that you edited the External Client App whose Consumer Key you entered in Copilot Studio.

> **Callback URL updates aren't always immediate.** If the URLs match exactly and you just saved the change, allow **up to 30 minutes** for the updated redirect URL to take effect before assuming the configuration is wrong. In our tests, it started working after around **10 minutes**. Close the failed sign-in window and retry after allowing time for propagation. For context, Salesforce's [External Client App setup guide](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html) documents an availability delay of up to 30 minutes for a newly created app.
{: .prompt-info }

The error itself doesn't prove that propagation is the cause, so verify the callback and client credentials first.

![Salesforce sign-in window showing redirect_uri_mismatch](/assets/posts/salesforce-mcp-copilot-studio/redirect-uri-mismatch.png){: .shadow w="1000" }
_A redirect mismatch blocks connection creation. Verify the saved callback before retrying._

## 5. Review the discovered tools

After authentication succeeds, open the MCP server from the agent's **Tools** list.

In the **Edit tool** panel, confirm that **Connection** is connected and review **Tool permissions**. Our configuration exposed tools including:

- **Get object schema**, **Get user info**, **Find**, and **Soql query**.
- **Get related records** and **List recent sobject records**.
- **Create sobject record**, **Update sobject record**, and related-record operations.
- **Delete sobject record** and **Delete related record**.

These match the operations described in the [SObject All tool reference](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/sobject-all.html).

For this walkthrough, enable the read and schema tools first. Enable only the create/update tools needed for the controlled write test, and leave delete tools disabled. If **Allow all** is selected, turn it off before choosing individual tools. Select **Done** to save.

![Edit tool panel showing a connected Salesforce MCP server and discovered tools](/assets/posts/salesforce-mcp-copilot-studio/discovered-tools.png){: .shadow w="1000" }
_A successful connection exposes the SObject All tools. The captured configuration shows Allow all enabled; narrow the permissions for your own test._

For another example of onboarding a hosted service, see our [Jira remote MCP walkthrough]({% post_url 2026-05-15-atlassian-jira-remote-mcp-copilot-studio %}). It uses a different OAuth registration approach, so don't reuse its authentication settings for Salesforce.

## 6. Test a read, then a controlled write

A connected status is useful, but the real test is a successful operation against the expected Salesforce org.

### Read recent opportunities

In the agent's **Preview** pane, try:

```text
List the latest 10 opportunities we have, ordered by created date.
Include the account, amount, stage, close date, and created date.
```

Check that the results belong to your intended org and are records the signed-in user should be able to access.

### Update a test opportunity

Choose a record reserved for testing and identify it unambiguously, preferably by record ID. Ask the agent to update its stage and close date, then add a note. For example, after substituting your test opportunity:

```text
Update the test opportunity "Contoso - MCP Validation" to Closed Won
and set its Close Date to today. Add a note saying:
"Controlled MCP validation: stage and close date updated."
```

The name above is an example, not a record you should expect to find. Confirm that the intended record is selected before allowing the write.

Our captured walkthrough retrieved opportunities, then updated the opportunity named **Microsoft - New Pilot**, changed its close date, and added a note. The screenshot illustrates that test interaction, not a business result to reproduce.

![Copilot Studio agent retrieving opportunities and confirming an update](/assets/posts/salesforce-mcp-copilot-studio/opportunity-conversation.png){: .shadow w="700" }
_The original test conversation shows a read followed by a stage, close-date, and note update._

### Verify the result in Salesforce

Don't stop at the agent's confirmation. Open the opportunity in Salesforce and check:

- **Stage** is **Closed Won**.
- **Close Date** matches the date you intended.
- The new note is attached to the correct opportunity.
- **Last Modified By** identifies the expected Salesforce user.

The screenshots below capture the October 13 test. Their dates are the test dates, not dates to enter in your own records.

![Salesforce opportunity showing Closed Won, the updated close date, and an attached note](/assets/posts/salesforce-mcp-copilot-studio/verified-opportunity.png){: .shadow w="1000" }
_The opportunity record confirms the stage, close date, and attached note after the agent's update._

![Salesforce note record containing the note added in the test conversation](/assets/posts/salesforce-mcp-copilot-studio/verified-note.png){: .shadow w="856" }
_The note record lets you verify the stored text and its link to the opportunity._

> Salesforce permissions remain the enforcement boundary. An agent's success message and a record's Last Modified By field are useful checks, but neither replaces testing with the actual user permissions you plan to support.
{: .prompt-tip }

## Final checks and troubleshooting

Before handing the agent to another tester, confirm:

- SObject All is **Active**.
- The External Client App grants `mcp_api` and `refresh_token`.
- The callback contains the exact Copilot Studio redirect URL.
- The MCP and OAuth endpoints match the org type.
- Authentication succeeds and the expected tools appear.
- A read succeeds before you enable writes.
- Controlled writes are verified in Salesforce.
- Unneeded tools, especially deletes, are disabled.

| Symptom | What to check |
|---|---|
| `redirect_uri_mismatch` | Compare the complete callback and redirect URLs, verify the correct External Client App, save, and allow for recent changes to take effect. |
| Sign-in doesn't recognize the user | Check the org type and OAuth host: `login.salesforce.com` or `test.salesforce.com`. |
| OAuth succeeds, but tool calls fail | Check the MCP endpoint, server activation, app policy, and the user's Salesforce permissions. |
| No tools appear | Confirm the SObject All endpoint and Active status, and review the connection error details. |
| The connection fails after token expiry | Confirm the refresh scope and endpoint, and review Salesforce token policies. Reauthenticate if access was revoked or the token expired. |

The key sequence is straightforward: **register the External Client App, activate SObject All, configure manual OAuth, save the exact callback, and verify the tools with a read before testing writes**.

Once that works, your agent has a path from a request in chat to a verified change in Salesforce. Which Salesforce workflow would you connect first, and which tools would you deliberately leave disabled?
