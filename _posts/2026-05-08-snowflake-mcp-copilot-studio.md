---
layout: post
title: "A Practical Guide to Configure a Snowflake-Managed MCP Tool in Copilot Studio"
date: 2026-05-08
categories: [copilot-studio, mcp]
tags: [mcp, snowflake, cortex, oauth, entra-id, copilot-studio, power-platform]
description: "Hands-on, end-to-end walkthrough for wiring a Snowflake-managed MCP server into a Microsoft Copilot Studio agent with delegated user OAuth through Microsoft Entra ID. Includes the Cortex Agent prerequisite, the manual OAuth path Snowflake actually requires, and the small details that make or break the setup."
author: hasharaf
image:
  path: /assets/posts/snowflake-mcp-copilot-studio/header.png
  alt: "Copilot Studio agent connected to Snowflake through an MCP link, with a Microsoft + Snowflake step-by-step badge"
---

This is a hands-on, end-to-end guide to wiring a **Snowflake-managed MCP server** into a **Microsoft Copilot Studio** agent, with **delegated user OAuth** through **Microsoft Entra ID**. It reflects what was actually required to get plumbing working, including several details the original draft omitted.

> **Conventions** — Replace every `<PLACEHOLDER>` with your own value. All sample IDs, secrets, hostnames, tenants, and email addresses are illustrative.

---

## ⚠ Prerequisite: Cortex Agent Must Be Available on Your Snowflake Account

**Snowflake-managed MCP servers always invoke the tool through Cortex Agent**, regardless of whether the underlying tool is a `CORTEX_SEARCH_SERVICE_QUERY`, a `GENERIC` stored procedure, or `SYSTEM_EXECUTE_SQL`. Cortex Agent is the *runtime orchestrator* for every MCP call.

That means:
- Cortex Agent must be **enabled in your Snowflake region**.
- Your account must be allowed to call Cortex Agent. **Standard 30-day trial accounts have Cortex blocked** at the org level — MCP tool *discovery* will succeed, but every tool *invocation* will fail with `MCP Server tool error: No tool result received calling Cortex Agent`.

If you're on a trial, request Cortex enablement from Snowflake support before continuing, or use a paid account.

---

## Table of Contents

1. [Snowflake — sample data](#1-snowflake--sample-data)
2. [Snowflake — Cortex Search services + MCP server](#2-snowflake--cortex-search-services--mcp-server)
3. [Snowflake — role and delegate user](#3-snowflake--role-and-delegate-user)
4. [Microsoft Entra ID — two app registrations](#4-microsoft-entra-id--two-app-registrations)
5. [Snowflake — `EXTERNAL_OAUTH` security integration](#5-snowflake--external_oauth-security-integration)
6. [Copilot Studio — agent + MCP tool (Manual OAuth)](#6-copilot-studio--agent--mcp-tool-manual-oauth)
7. [Azure — add the connector redirect URI](#7-azure--add-the-connector-redirect-uri)
8. [Copilot Studio — connection, discovery, and end-user test connection](#8-copilot-studio--connection-discovery-and-end-user-test-connection)
9. [Test the agent](#9-test-the-agent)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Snowflake — sample data

Open Snowsight → **Projects → Workspaces → New SQL file** → run:

```sql
CREATE DATABASE IF NOT EXISTS PRODUCT_CUSTOMER_DB;
CREATE SCHEMA IF NOT EXISTS PRODUCT_CUSTOMER_DB.STORE_SCHEMA;

CREATE TABLE IF NOT EXISTS PRODUCT_CUSTOMER_DB.STORE_SCHEMA.PRODUCTS (
    PRODUCT_ID INT AUTOINCREMENT PRIMARY KEY,
    PRODUCT_NAME VARCHAR(255) NOT NULL,
    DESCRIPTION VARCHAR(1000),
    CATEGORY VARCHAR(100),
    PRICE DECIMAL(10,2) NOT NULL,
    STOCK_QUANTITY INT DEFAULT 0,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS PRODUCT_CUSTOMER_DB.STORE_SCHEMA.CUSTOMERS (
    CUSTOMER_ID INT AUTOINCREMENT PRIMARY KEY,
    FIRST_NAME VARCHAR(100) NOT NULL,
    LAST_NAME VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(255) UNIQUE NOT NULL,
    PHONE VARCHAR(20),
    ADDRESS VARCHAR(500),
    CITY VARCHAR(100),
    STATE VARCHAR(100),
    ZIP_CODE VARCHAR(20),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- (Insert your sample rows here — e.g. 20 products and 20 customers.)
```

> **TIP** — The "Run" button sometimes only runs the statement under the cursor. Highlight the whole script before pressing **Cmd/Ctrl+Enter** to run all statements.

Verify:

```sql
SELECT COUNT(*) AS PRODUCTS FROM PRODUCT_CUSTOMER_DB.STORE_SCHEMA.PRODUCTS;
SELECT COUNT(*) AS CUSTOMERS FROM PRODUCT_CUSTOMER_DB.STORE_SCHEMA.CUSTOMERS;
```

---

## 2. Snowflake — Cortex Search services + MCP server

Create one Cortex Search Service per searchable table, then wrap them in an MCP server.

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE PRODUCT_CUSTOMER_DB.STORE_SCHEMA.CUSTOMER_SEARCH
  ON customer_info
  ATTRIBUTES CITY, STATE
  WAREHOUSE = COMPUTE_WH
  TARGET_LAG = '1 hour'
AS (
  SELECT
    CUSTOMER_ID,
    FIRST_NAME || ' ' || LAST_NAME || ' - ' || EMAIL || ' - ' || CITY || ', ' || STATE AS customer_info,
    FIRST_NAME, LAST_NAME, EMAIL, CITY, STATE
  FROM PRODUCT_CUSTOMER_DB.STORE_SCHEMA.CUSTOMERS
);

CREATE OR REPLACE CORTEX SEARCH SERVICE PRODUCT_CUSTOMER_DB.STORE_SCHEMA.PRODUCT_SEARCH
  ON product_info
  ATTRIBUTES CATEGORY
  WAREHOUSE = COMPUTE_WH
  TARGET_LAG = '1 hour'
AS (
  SELECT
    PRODUCT_ID,
    PRODUCT_NAME || ' - ' || CATEGORY AS product_info,
    PRODUCT_NAME, CATEGORY, PRICE, STOCK_QUANTITY
  FROM PRODUCT_CUSTOMER_DB.STORE_SCHEMA.PRODUCTS
);

CREATE OR REPLACE MCP SERVER PRODUCT_CUSTOMER_DB.STORE_SCHEMA.MY_MCP_SERVER
FROM SPECIFICATION $$
  tools:
    - name: "customer_search"
      type: "CORTEX_SEARCH_SERVICE_QUERY"
      identifier: "PRODUCT_CUSTOMER_DB.STORE_SCHEMA.CUSTOMER_SEARCH"
      title: "Customer Search"
      description: "Search customers by name, email, city, or state."
    - name: "product_search"
      type: "CORTEX_SEARCH_SERVICE_QUERY"
      identifier: "PRODUCT_CUSTOMER_DB.STORE_SCHEMA.PRODUCT_SEARCH"
      title: "Product Search"
      description: "Search products by name or category."
$$;

DESCRIBE MCP SERVER PRODUCT_CUSTOMER_DB.STORE_SCHEMA.MY_MCP_SERVER;
```

> **NOTE** — Tool `name` values are what the agent's LLM sees. Use snake_case and a clear `description`; this is what makes the model decide to invoke a tool.

---

## 3. Snowflake — role and delegate user

```sql
CREATE ROLE IF NOT EXISTS SALESPROFESSIONAL;
GRANT USAGE ON DATABASE PRODUCT_CUSTOMER_DB TO ROLE SALESPROFESSIONAL;
GRANT USAGE ON SCHEMA PRODUCT_CUSTOMER_DB.STORE_SCHEMA TO ROLE SALESPROFESSIONAL;
GRANT USAGE ON CORTEX SEARCH SERVICE PRODUCT_CUSTOMER_DB.STORE_SCHEMA.CUSTOMER_SEARCH TO ROLE SALESPROFESSIONAL;
GRANT USAGE ON CORTEX SEARCH SERVICE PRODUCT_CUSTOMER_DB.STORE_SCHEMA.PRODUCT_SEARCH TO ROLE SALESPROFESSIONAL;
GRANT USAGE ON MCP SERVER PRODUCT_CUSTOMER_DB.STORE_SCHEMA.MY_MCP_SERVER TO ROLE SALESPROFESSIONAL;
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE SALESPROFESSIONAL;

-- Create a delegate user whose LOGIN_NAME equals the Entra UPN of the end user
CREATE USER IF NOT EXISTS SNOWSQL_DELEGATE_USER
  LOGIN_NAME = '<USER_UPN@yourtenant.onmicrosoft.com>'
  DISPLAY_NAME = 'SnowSQL Delegated User'
  COMMENT = 'Delegate user for SnowSQL/MCP OAuth-based connectivity';

GRANT ROLE SALESPROFESSIONAL TO USER SNOWSQL_DELEGATE_USER;
ALTER USER SNOWSQL_DELEGATE_USER SET DEFAULT_ROLE       = SALESPROFESSIONAL;
ALTER USER SNOWSQL_DELEGATE_USER SET DEFAULT_WAREHOUSE  = COMPUTE_WH;

-- Required when the OAuth scope is session:role-any
ALTER USER SNOWSQL_DELEGATE_USER SET DEFAULT_SECONDARY_ROLES = ('ALL');

SHOW GRANTS TO USER SNOWSQL_DELEGATE_USER;
SHOW GRANTS TO ROLE SALESPROFESSIONAL;
```

> **WHY `LOGIN_NAME` matters** — The `EXTERNAL_OAUTH` integration (next section) maps the incoming Entra `upn` claim to the Snowflake user's `LOGIN_NAME`. They must match exactly (case-insensitive).

---

## 4. Microsoft Entra ID — two app registrations

You need **two** app registrations in your Entra tenant. Follow Snowflake's official walkthrough end-to-end:

- *Snowflake Connector for Microsoft Power Platform: Create OAuth client in Microsoft Entra ID*
- *Snowflake Connector for Microsoft Power Platform: Collect Azure AD information for Snowflake*

### 4a. Resource app — `Snowflake OAuth Resource`
- **Expose an API** → set Application ID URI to `api://<RESOURCE_APP_CLIENT_ID>`.
- Add a delegated scope **`session:role-any`** (or a more specific role scope if you want to lock the agent to one Snowflake role).

### 4b. Client app — `Snowflake OAuth Client`
- **Certificates & secrets** → create a client secret. **Copy the value immediately** — it's only shown once.
- **API permissions** → Add a permission → My APIs → pick the resource app → choose the `session:role-any` delegated permission.
- **Grant admin consent for `<TENANT_NAME>`**.

Collect and keep:

| Value | Where it comes from | Example placeholder |
| --- | --- | --- |
| Tenant ID | Entra → Overview | `<TENANT_ID>` |
| Resource App (client) ID | Resource app → Overview | `<RESOURCE_APP_CLIENT_ID>` |
| Application ID URI | Resource app → Expose an API | `api://<RESOURCE_APP_CLIENT_ID>` |
| Scope | Resource app → Expose an API | `session:role-any` |
| Client App (client) ID | Client app → Overview | `<CLIENT_APP_CLIENT_ID>` |
| Client secret value | Client app → Certificates & secrets | `<CLIENT_SECRET_VALUE>` |

> The Web platform redirect URI is added **after** Copilot Studio creates the connector — see Section 7. Don't try to add it now; you don't have the value yet.

---

## 5. Snowflake — `EXTERNAL_OAUTH` security integration

```sql
USE ROLE ACCOUNTADMIN;

CREATE OR REPLACE SECURITY INTEGRATION external_oauth_azure_1
  TYPE = EXTERNAL_OAUTH
  ENABLED = TRUE
  EXTERNAL_OAUTH_TYPE = AZURE
  EXTERNAL_OAUTH_ISSUER = 'https://sts.windows.net/<TENANT_ID>/'
  EXTERNAL_OAUTH_JWS_KEYS_URL = 'https://login.microsoftonline.com/<TENANT_ID>/discovery/v2.0/keys'
  EXTERNAL_OAUTH_AUDIENCE_LIST = ('api://<RESOURCE_APP_CLIENT_ID>')
  EXTERNAL_OAUTH_TOKEN_USER_MAPPING_CLAIM = 'upn'
  EXTERNAL_OAUTH_SNOWFLAKE_USER_MAPPING_ATTRIBUTE = 'LOGIN_NAME'
  EXTERNAL_OAUTH_ANY_ROLE_MODE = ENABLE;     -- required when scope is session:role-any

DESCRIBE INTEGRATION external_oauth_azure_1;
```

`DESCRIBE` should report `ENABLED = true`, the issuer URL, the JWKS URL, and the audience matching `api://<RESOURCE_APP_CLIENT_ID>`.

---

## 6. Copilot Studio — agent + MCP tool (Manual OAuth)

1. Go to **Copilot Studio** → **Agents → Create agent**, give it a name (e.g. *Snowflake Sales Helper*) and a short description.
2. Open the agent → **Tools** tab → **Add tool → MCP → Add new MCP**.
3. Fill the MCP form:
   - **Name** — e.g. *Snowflake MCP*.
   - **Description** — brief, end-user-friendly.
   - **Server URL** —
     ```
     https://<SNOWFLAKE_ACCOUNT_HOST>/api/v2/databases/PRODUCT_CUSTOMER_DB/schemas/STORE_SCHEMA/mcp-servers/MY_MCP_SERVER
     ```
     where `<SNOWFLAKE_ACCOUNT_HOST>` looks like `<accountid>.snowflakecomputing.com`. **No trailing slash, no `/sse`, no `/mcp`.**
   - **Authentication** — **OAuth 2.0**.
   - Switch from **Dynamic Discovery** → **Manual**. Snowflake does **not** support OAuth Dynamic Client Registration; Dynamic Discovery will silently fail.
4. Manual OAuth fields:

   | Field | Value |
   | --- | --- |
   | Client ID | `<CLIENT_APP_CLIENT_ID>` |
   | Client Secret | `<CLIENT_SECRET_VALUE>` |
   | Authorization URL | `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/authorize` |
   | Token URL | `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token` |
   | Refresh URL | `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token` |
   | Scopes | `api://<RESOURCE_APP_CLIENT_ID>/session:role-any offline_access` |

5. Click **Create**.

> **GOTCHA — Server URL validator** — The Server URL field may keep showing *"Enter the complete server path to continue"* even when the URL is correct, and the **Create** button can look disabled. It is usually actually enabled. If it doesn't respond to a normal click, the field has just lost focus on a stale validation. Click outside the field, then click **Create** again.

After **Create**, Copilot Studio auto-generates a **custom connector** in your Power Platform environment with the same name as the MCP tool. **Copy the redirect URL** that appears on the connector's authentication page — it looks like:

```
https://global.consent.azure-apim.net/redirect/<connector-slug>
```

You'll paste this into Azure next.

---

## 7. Azure — add the connector redirect URI

Open the **Client app** registration → **Authentication** → **Add a platform → Web** → paste the redirect URL from the previous step → **Configure**. You should see *"Successfully updated <Client app name>"*.

> **WHY THIS STEP IS HERE** — The redirect URL is generated by Power Platform when the custom connector is created, so it cannot be added to the Azure app earlier. If you try to connect before adding it, the OAuth round-trip fails with `AADSTS50011: redirect URI mismatch`.

---

## 8. Copilot Studio — connection, discovery, and end-user test connection

### 8a. Maker-side connection
Back in the agent's MCP tool details:

1. Under **Not connected**, choose **Create new connection** → **Create**.
2. The OAuth popup may not appear if you're already signed into the same tenant — that's normal. Watch the connection label flip to your UPN.
3. Click **Add and configure**.
4. Copilot Studio will call the MCP server and **auto-discover the tools** (`customer_search`, `product_search`, etc.). They appear in the Tools blade with the descriptions from the YAML spec.

### 8b. End-user (test pane) connection — easy to miss
The Copilot Studio **Test pane** runs as the end user, not the maker. The first time you ask the agent something that triggers an MCP tool, you'll see:

> *Let's get you connected first… [Open connection manager](#) to verify your credentials.*

1. Click **Open connection manager**. This opens at `copilotstudio.microsoft.com/.../user-connections` and may briefly show *"TenantId mismatched"* if your browser's signed-in user differs from the agent's tenant.
2. **Sign out** of the wrong account, then sign back in with the user that has the matching Snowflake `LOGIN_NAME`.
3. Click **Connect** next to the MCP entry. With same-tenant SSO this typically completes silently.
4. Return to the test pane and click **Retry** on the previous message.

---

## 9. Test the agent

Try natural-language prompts that map to the discovered tools:

- *"Find customers in California"* → should invoke `customer_search` with `query=California`.
- *"What electronics products do we have?"* → should invoke `product_search` with `query=electronics`.

If the agent answers from general knowledge instead of calling the tools, open the **Overview** tab and add an instruction:

> When the user asks about customers or products, use the Snowflake MCP tools. Do not answer from general knowledge.

You can also disable **Web search** and **Use general knowledge** in the agent's settings.

### Verify on the Snowflake side

```sql
-- Was the OAuth handshake successful?
SELECT EVENT_TIMESTAMP, USER_NAME, IS_SUCCESS, ERROR_MESSAGE
FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY
WHERE USER_NAME = 'SNOWSQL_DELEGATE_USER'
  AND EVENT_TIMESTAMP > DATEADD(hour, -1, CURRENT_TIMESTAMP())
ORDER BY EVENT_TIMESTAMP DESC;

-- Did SQL actually run under the delegate user?
SELECT QUERY_ID, USER_NAME, ROLE_NAME, EXECUTION_STATUS, ERROR_MESSAGE,
       LEFT(QUERY_TEXT, 200) AS QT, START_TIME
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE USER_NAME = 'SNOWSQL_DELEGATE_USER'
  AND START_TIME > DATEADD(hour, -1, CURRENT_TIMESTAMP())
ORDER BY START_TIME DESC;
```

> `ACCOUNT_USAGE` views have ~45-minute latency. For real-time inspection use `INFORMATION_SCHEMA.QUERY_HISTORY` and `INFORMATION_SCHEMA.LOGIN_HISTORY` — but those scope to the current session's account context, so call them from an `ACCOUNTADMIN` worksheet.

---

## 10. Troubleshooting

### Inspect the actual MCP error inside Copilot Studio
The most useful diagnostic is the agent's **Activity** tab → click the test conversation → click the tool node (`customer_search`, etc.). The right-hand pane shows:

- **Inputs** — what the LLM sent (e.g. `query: California`).
- **Outputs** — `isError: true` and the verbatim error string from the MCP server.
- **Reasoning** — the LLM's tool-selection rationale.

### Common errors

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `MCP Server tool error: No tool result received calling Cortex Agent` | Cortex Agent disabled on this Snowflake account (e.g. trial). | Enable Cortex / use a paid account. (See top callout.) |
| `AADSTS50011: redirect URI mismatch` during connection | Connector redirect URI not added to the Azure Client app. | Section 7. |
| `Schema validation error` on first invocation from the connector test pane | Known cosmetic warning. Does not block real calls. | Ignore if real calls work. |
| `Insufficient privileges` from Snowflake | Role/grants missing, or default role isn't the granted role. | Re-run the `GRANT` statements in Section 3 and confirm `DEFAULT_ROLE` and `DEFAULT_SECONDARY_ROLES = ('ALL')`. |
| OAuth popup never appears, status stays "Not connected" | Browser blocking popup, or you were already silently SSO'd. | Watch the button label — silent SSO often skips the popup entirely. Refresh and check status. |
| MCP tool list never populates after **Add and configure** | Server URL wrong, OAuth scope wrong, or Cortex Agent missing on the account. | Validate server URL pattern from Section 6, then recheck `DESCRIBE INTEGRATION external_oauth_azure_1`. |
| `LOGIN_HISTORY` shows successes but `QUERY_HISTORY` shows no rows for the delegate user | Tool call dies inside Cortex Agent before SQL is ever issued. | Same root cause as the first row of this table. |

### Re-checking the connector
1. **Power Apps** → environment picker → **More → Custom connectors**.
2. Open your Snowflake MCP connector → **Test** tab → pick the connection → run the operation.
3. If you get an IP-related error, check Snowflake **network policies** allow the Power Platform region's egress IPs.
4. If you get a role/ACL error, verify scope is `session:role-any` and `EXTERNAL_OAUTH_ANY_ROLE_MODE = ENABLE`.

### Re-checking the OAuth round-trip
- Decode the JWT that Power Platform sends to Snowflake (network trace or the connector's diagnostic) and confirm:
  - `aud` = `api://<RESOURCE_APP_CLIENT_ID>`
  - `iss` = `https://sts.windows.net/<TENANT_ID>/`
  - `upn` = the email matching `SNOWSQL_DELEGATE_USER.LOGIN_NAME`

---

## Reference — placeholder cheat sheet

| Placeholder | Where to find it |
| --- | --- |
| `<TENANT_ID>` | Entra → Overview → Tenant ID |
| `<TENANT_NAME>` | Entra → Overview → Primary domain |
| `<RESOURCE_APP_CLIENT_ID>` | Resource app registration → Overview → Application (client) ID |
| `<CLIENT_APP_CLIENT_ID>` | Client app registration → Overview → Application (client) ID |
| `<CLIENT_SECRET_VALUE>` | Client app → Certificates & secrets (visible only at creation) |
| `<SNOWFLAKE_ACCOUNT_HOST>` | Snowsight → Admin → Accounts (e.g. `<accountid>.snowflakecomputing.com`) |
| `<USER_UPN@yourtenant.onmicrosoft.com>` | The end-user's Entra UPN |

---

**End of guide.**
