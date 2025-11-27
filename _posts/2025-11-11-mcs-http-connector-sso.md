---
layout: post
title: "(Nearly) Seamless Sign-In for Custom APIs in Copilot Studio"
date: 2025-11-11
categories: [copilot-studio, authentication, apis]
tags: [entra-id, custom-apis, http-connector, authentication, delegated-permissions]
author: adilei
published: false
---

When building Copilot Studio agents that need to call your custom APIs, you want users to have a smooth authentication experience. While Copilot Studio can automatically handle authentication for many Microsoft services, custom connectors can't leverage this seamless flow because they require first-party Microsoft apps to obtain user tokens.

But there's a solution (or rather a workaround): the **HTTP with Entra ID** connector combined with proper permission configuration. Well, it's **almost** a solution. Users still need to consent once, and you'll need to handle HTTP requests manually rather than having the nice abstracted operations that custom connectors provide. It's still a pretty good workaround, so keep on reading. Or not. Up to you. 
 
![Seamless Authentication Flow](/assets/posts/copilot-studio-custom-api-auth/auth-flow.png){: .shadow w="800" h="450" }
_Users consent once and then access your custom APIs (nearly) seamlessly_

## The Challenge with Custom APIs

Copilot Studio can implicitly create connections for users by letting them provide consent, but only for connectors that support Entra authentication using first-party Microsoft apps. For example, the [Office 365 Users connector](https://learn.microsoft.com/en-us/connectors/office365users/) can seamlessly authenticate because it uses Microsoft's first-party app registrations.

Custom connectors, however, can't leverage this seamless flow even when configured with Entra authentication, because they use app registrations managed by customers, not first-party Microsoft apps that have the necessary privileges to obtain delegated tokens on behalf of users chatting to the agent.

This means users typically face the universally disliked connection manager interface that opens in a separate browser window.

![Connection Manager Interface](/assets/posts/copilot-studio-custom-api-auth/connection-manager.png){: .shadow w="700" h="400" }
_The connection manager interface that interrupts the user experience_

## Enter: the HTTP with Entra ID Connector

The [HTTP with Entra ID connector](https://learn.microsoft.com/en-us/connectors/webcontentsv2/) provides most of what we need, but with some trade-offs. This connector:

- **Uses Microsoft's first-party app**: The connector leverages `HttpWithAADApp` (App ID: `d2ebd3a9-1ada-4480-8b2d-eac162716601`), a Microsoft-owned application registration
- Can obtain delegated tokens for Microsoft services or custom APIs
- Allows tenant admins to grant permissions to custom APIs
- Enables (nearly) seamless user authentication flows
- **But requires manual HTTP payload construction and response parsing**

Because `HttpWithAADApp` is a first-party Microsoft app (not customer-managed), it has the necessary privileges to seamlessly obtain delegated tokens on behalf of users in Copilot Studio—something custom connectors with customer app registrations cannot do.

>  **Trade-off alert**: unlike custom connectors that provide clean, typed operations based on your OpenAPI/Swagger definition, the HTTP with Entra ID connector requires you to manually craft HTTP requests and parse JSON responses. You lose the nice abstraction layer that makes custom connectors maker-friendly.
{: .prompt-info }

## Prerequisites

Before we start, you'll need:

1. **A custom app registration** that exposes your API (we'll use an HR API as an example)
2. **Global Administrator** privileges in your tenant
3. **PowerShell** with Microsoft Graph modules installed

> **Important**: This approach requires tenant admin consent to grant the HTTP with Entra ID app permissions to your custom API. Plan accordingly for your organization's approval processes.
{: .prompt-warning }

## Understanding Your Custom API App Registration

Before we can grant permissions, let's understand what we're working with. Your custom API needs to be represented by an **app registration** in Entra ID that exposes scopes for other applications to request access to.

### The HR API Hub Example

In our example, we have an "HR API Hub" app registration that represents our custom HR API:

![HR API Hub App Registration](/assets/posts/copilot-studio-custom-api-auth/hr-hub-custom-api.png){: .shadow w="800" h="500" }
_An app registration that exposes our custom HR API with defined scopes_

This custom API and its scopes are the **resource** for which we'll grant permissions to the HTTP with Entra ID app in the next step. The custom API represents your endpoint from an identity perspective. 

> **Note**: If you don't have a custom API app registration yet, you'll need to create one first. The app registration represents your API's identity in Entra ID and defines what permissions other applications can request.
{: .prompt-info }

## Step 1: Grant Permissions to the HTTP with Entra ID App

Now that we understand the app registration structure, we need to grant the first-party `HttpWithAADApp` delegated permissions to call your custom API. This creates a trust relationship where the HttpWithAADApp can obtain tokens on behalf of users to access your API.

### What the Script Does

The PowerShell script automates the permission grant process by:
- Finding or creating the service principal for `HttpWithAADApp`
- Locating your custom API registration
- Discovering available OAuth2 scopes and letting you select which to grant
- Creating the necessary permission grants with support for both tenant-wide and user-specific consent

> **Warning**: This script modifies tenant-wide permissions by granting the HttpWithAADApp access to your custom APIs. Never run PowerShell scripts like this in production tenants without thorough review and approval from your security team. The script is provided for reference and educational purposes - always understand what permissions you're granting before execution.
{: .prompt-danger }

### Download the Script

You can download the complete script here: [Grant-DelegatedPermissions.ps1]({{ site.baseurl }}/assets/posts/copilot-studio-custom-api-auth/GrantDelegatedPermissions.ps1)

### Key Script Components

The script takes your custom API's Application ID URI and grants the necessary permissions:

```powershell
param(
    [Parameter(Mandatory=$false)]
    [string]$AppId = "d2ebd3a9-1ada-4480-8b2d-eac162716601", # HttpWithAADApp default
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceAppIdUri, # Your custom API URI
    
    [Parameter(Mandatory=$false)]
    [string[]]$Scopes # Array of permission scopes
)
```

And performs the core permission grant operation:

```powershell
# Find the HttpWithAADApp service principal
$ServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '$AppId'"

# Locate your custom API service principal
$ResourceServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '$extractedAppId'"

# Create the permission grant
$grantParams = @{
    clientId = $ServicePrincipal.Id
    consentType = $ConsentType  # "AllPrincipals" or "Principal"
    resourceId = $ResourceServicePrincipal.Id
    scope = $joinedScopes
}

New-MgOauth2PermissionGrant -BodyParameter $grantParams
```

### Running the Script

**On macOS/Linux:**
```bash
# Download and run the script
curl -O https://microsoft.github.io/mcscatblog/assets/posts/copilot-studio-custom-api-auth/GrantDelegatedPermissions.ps1

# Make the script executable
chmod +x GrantDelegatedPermissions.ps1

# Example: Grant API.Invoke permission to your HR API
pwsh -File "./GrantDelegatedPermissions.ps1" \
  -ResourceAppIdUri "api://f11e5c51-43d0-48d4-8acf-01cb55bbc6f4" \
  -Scopes "API.Invoke"
```

**On Windows (PowerShell):**
```powershell
# Download and run the script
Invoke-WebRequest -Uri "https://microsoft.github.io/mcscatblog/assets/posts/copilot-studio-custom-api-auth/GrantDelegatedPermissions.ps1" -OutFile "GrantDelegatedPermissions.ps1"

# Example: Grant API.Invoke permission to your HR API
.\GrantDelegatedPermissions.ps1 `
  -ResourceAppIdUri "api://f11e5c51-43d0-48d4-8acf-01cb55bbc6f4" `
  -Scopes "API.Invoke"
```

### Successful Script Execution

When the script runs successfully, you'll see output similar to this:

```
Script completed.
Id                                          ClientId                             ConsentType
--                                          --------                             ----------- 
tO_W4Xbsi0uOQ6Z4KPcaHXcfh96BExpMjsr_4UWjgd8 e1d6efb4-ec76-4b8b-8e43-a67828f71a1d AllPrincipals

ClientId               : 14d82eec-204b-4c2f-b7e8-296a70dab67e
TenantId               : efb073bb-283b-4757-a252-22af963721bc
Scopes                 : {Application.Read.All, Directory.AccessAsUser.All, openid, profile…}
AuthType               : Delegated
TokenCredentialType    : InteractiveBrowser
CertificateThumbprint  : 
CertificateSubjectName : 
SendCertificateChain   : False
Account                : adi.leibowitz@copilotstudiotraining.onmicrosoft.com
AppName                : Microsoft Graph Command Line Tools
ContextScope           : CurrentUser
Certificate            : 
PSHostVersion          : 7.4.0
ManagedIdentityId      : 
ClientSecret           : 
Environment            : Global
```

## Step 2: Configure the HTTP with Entra ID Connector

Once permissions are granted, you can add the HTTP with Entra ID connector as a **tool** in your Copilot Studio agent. This allows the agent to invoke your custom API contextually during conversations.

### Adding and Configuring the Tool

1. **In your agent's Tools section**, click "Add a tool"
2. **Search for "HTTP Entra ID"** to find the HTTP with Entra ID options
3. **Select "Invoke an HTTP request"** from the HTTP with Microsoft Entra ID connector
4. **Configure your tool** with a name, description, and the URL input parameter

![Configured HTTP Tool](/assets/posts/copilot-studio-custom-api-auth/get-user-profile.png){: .shadow w="800" h="600" }
_The configured HTTP with Entra ID tool showing the simple setup with name, description, and URL input_

### Key Configuration Points

The tool configuration is simple:

- **Name**: A descriptive name for your tool (e.g., "Get user profile")
- **Description**: What the tool does (e.g., "Get user profile information from HR system")  
- **Method**: Select the HTTP method (GET, POST, PUT, etc.) for your API endpoint
- **URL**: The URL of your custom API endpoint (e.g., `https://hr-api.contoso.com/api/employees/me`)

### How the Agent Uses the Tool

Once configured as a tool, your agent can invoke it contextually during conversations. 

1. **Agent invokes the tool** based on conversation context
2. **User consents** (one-time prompt for new APIs)
3. **Agent responds** based on the API response
   
![API Response](/assets/posts/copilot-studio-custom-api-auth/api-response.png){: .shadow w="800" h="500" }
_The complete flow: consent dialog, API call, and agent response with user-specific data_

### The Authentication Flow in Action

Here's what happens behind the scenes when a user asks "What's my employee ID?" and clicks `Allow`:

**1. Copilot Studio sends a delegated token to your API:**

```json
{
  "aud": "api://f11e5c51-43d0-48d4-8acf-01cb55bbc6f4",
  "iss": "https://sts.windows.net/efb073bb-283b-4757-a252-22af963721bc/",
  "appid": "d2ebd3a9-1ada-4480-8b2d-eac162716601",
  "scp": "API.Invoke",
  "name": "Adi Leibowitz",
  "upn": "adi.leibowitz@copilotstudiotraining.onmicrosoft.com",
  "oid": "b44c0c00-78b8-401b-bc63-6285a8b7a071"
}
```

**2. Your API responds with user-specific data:**

```json
{
  "success": true,
  "data": {
    "id": "67890",
    "firstName": "Adi", 
    "lastName": "Leibowitz",
    "email": "adi.leibowitz@microsoft.com",
    "title": "Principal Program Manager",
    "department": "Copilot Studio CAT",
    "isActive": true
  },
  "message": "Profile retrieved successfully"
}
```

**What made this possible:**
- **First-party app privileges**: `HttpWithAADApp` can obtain delegated tokens on behalf of users
- **Admin-granted permissions**: The tenant admin pre-authorized `HttpWithAADApp` to access your custom API
- **User consent**: One-time permission for the user to allow API access
- **Proper token scoping**: The token includes your API as the audience and the granted scope

This is the core difference from custom connectors - the `HttpWithAADApp` has the necessary Microsoft privileges to seamlessly obtain these delegated tokens in the Copilot Studio context.


## Key Takeaways

1. **HTTP with Entra ID connector enables (nearly) seamless auth** for custom APIs in Copilot Studio
2. **You trade convenience for authentication simplicity** - manual HTTP vs. typed operations
3. **Admin setup is required** to grant permissions to the first-party `HttpWithAADApp`
4. **Users consent once** and then have seamless access to your custom APIs
5. **Consider the development overhead** of manual HTTP request/response handling
6. **This pattern scales** to multiple custom APIs across your organization

> **Important Limitation**: This approach **does not work for MCP (Model Context Protocol) servers** in Copilot Studio (sigh!). MCP servers rely on custom connectors for integration, and custom connectors cannot leverage the `HttpWithAADApp`'s first-party privileges. If you're building MCP servers, you'll still need to handle the traditional connection manager authentication flow (at least for now?).
{: .prompt-warning }

---

*Are you building custom APIs for Copilot Studio integration? What authentication challenges are you facing? Share your experiences in the comments!*