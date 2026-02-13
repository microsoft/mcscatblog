---  
layout: post  
title: "[Update] When to use MCP Server vs Power Platform Connectors"  
date: 2026-02-13 11:44:00 +0100  
categories: [copilot-studio, mcp, mcpserver, connector, powerplatform]
tags: [mcp, agent, mcpserver, connector, powerplatformconnector]  
description: Learn when to use MCP Server vs Power Platform Connector as integration tool within Microsoft Copilot Studio
author: jpad5  
image:  
  path: /assets/posts/compare-mcp-servers-pp-connectors/mcp-pp.png
  alt: "Comparing MCS Servers and Power Platform Connectors in Copilot Studio"  
  no_bg: true  
---  
  
**Problem Statement:**
Your team is building an agent in Microsoft Copilot Studio and evaluating tool options: should you add an MCP server or a Power Platform connector action? This decision impacts development velocity, governance, and long-term maintainability.

> **Scope of this article:** This comparison is specifically about choosing between MCP servers and Power Platform connectors **within Microsoft Copilot Studio (MCS)**. If you are deciding whether to build your agent on Copilot Studio vs. another platform (e.g., Azure AI Foundry, non-Microsoft frameworks), that is a separate platform-selection decision. Outside of MCS, Power Platform connectors are not available as an option, so MCP vs. connectors is only a meaningful choice for MCS-based agents.
{: .prompt-warning }

This post provides technical analysis for agent developers evaluating integration approaches. As both technologies evolve and new patterns emerge, check official documentation for the latest information.
{: .prompt-info }

> **Key architectural context:** In Copilot Studio, MCP server integration relies on the Power Platform connector framework under the hood. When you add an MCP server to a Copilot Studio agent, the platform uses a connector and connection mechanism to handle transport, authentication, and token management. This means many infrastructure-level capabilities (auth, token storage, connection management) are shared between MCP and connector-based tools in MCS. The differences that matter most to makers are around **tool configurability, orchestration control, governance, and development workflow**.
{: .prompt-info }  

## Summary

This article compares Model Context Protocol (MCP) and Microsoft Power Platform Connectors as integration approaches for AI agent development. While both enable agents to access external data and services, they differ significantly in architecture, authentication models, and use cases. This analysis provides guidance on selecting the appropriate technology based on development requirements.

Additionally, we explore how Power Platform Custom Connectors can serve as a bridge between MCP servers and the Microsoft ecosystem, enabling organizations to leverage MCP's flexibility while benefiting from Power Platform's enterprise governance, security, and compliance features. This hybrid approach offers a strategic path for enterprises seeking both customization and enterprise-grade management.

---

## 1. Overview

| Aspect | Model Context Protocol (MCP) | Power Platform Connectors |
|--------|------------------------------|---------------------------|
| **Definition** | Open protocol developed by Anthropic<br> that standardizes how AI assistants<br> connect to external data sources and tools | Pre-built or custom API wrappers that<br> enable Power Platform services to <br>integrate with external services<br> and data sources |
| **Protocol** | JSON-RPC 2.0 based architecture | REST APIs with OpenAPI specification |
| **Primary Purpose** | Enable LLMs to discover and interact with<br> external resources through unified interface | Enable Power Platform services<br> (Power Automate, Copilot Studio, Apps)<br> to integrate with external systems |
| **Architecture** | Client-server architecture using<br> JSON-RPC 2.0 | API wrapper layer with visual configuration |
| **Licensing** | Open-source protocol specification | Proprietary Microsoft technology |
| **Integration Design** | Designed specifically for LLM integration | Designed for low-code/no-code integration |
| **Implementation** | Language-agnostic implementation | Platform-specific (Power Platform) |
| **Deployment<br> Options** | Local or remote deployment options | Primarily cloud-based (managed service) |
| **Ecosystem** | Community-driven development | Enterprise-grade connector library<br> (1500+ prebuilt) |
| **Configuration** | Code-based configuration | Visual configuration interface |
| **Target Users** | Developers building AI agents | Business analysts, citizen developers,<br> IT professionals |
| **Vendor** | Anthropic (open standard) | Microsoft |
| **Governance** | Developer-implemented | Built-in governance<br> and compliance features |

---

## 2. Architecture Comparison

### 2.1 Architecture Diagrams

> **Important:** The diagrams below show the general protocol architectures. In Copilot Studio, the MCP architecture includes an additional connector/runtime layer between the AI agent and the MCP server. This means the transport, authentication, and connection management are handled by the Power Platform connector framework in both cases.
{: .prompt-info }

#### 🎯 MCP Architecture (General)

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                        MODEL CONTEXT PROTOCOL (MCP)                         │
    └─────────────────────────────────────────────────────────────────────────────┘
    
         🤖 AI AGENT                  🔧 MCP SERVER                  🌐 EXTERNAL
        ┌───────────┐               ┌─────────────────┐              ┌───────────┐
        │           │               │  ┌───────────┐  │              │           │
        │  Copilot  │   ◄──────►    │  │  OpenAPI  │  │   ◄──────►   │  API      │
        │  Studio   │   JSON-RPC    │  ├───────────┤  │    GraphQL   ├───────────┤
        │           │     2.0       │  │ Resources │  │    Native    │           │
        │           │               │  ├───────────┤  │    APIs      │  APIs     │
        │           │               │  │  Prompts  │  │              │           │
        └───────────┘               │  └───────────┘  │              ├───────────┤
                                    │                 │              │           │
                                    │  Auth Handler   │              │  Cloud    │
                                    │  Business Logic │              │  Services │
                                    └─────────────────┘              └───────────┘
    
    ✨ Key Features:
    • Direct LLM integration          • Dynamic tool discovery
    • Bidirectional communication     • Protocol-level flexibility
    • Local or remote deployment      • Language-agnostic
```

#### 🎯 MCP Architecture (Within Copilot Studio)

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                   MCP IN COPILOT STUDIO (ACTUAL FLOW)                       │
    └─────────────────────────────────────────────────────────────────────────────┘
    
       🤖 AI AGENT          🔌 PP CONNECTOR         🔧 MCP SERVER     🌐 EXTERNAL
      ┌───────────┐       ┌───────────────┐       ┌──────────────┐   ┌──────────┐
      │           │       │  Connection   │       │              │   │          │
      │  Copilot  │◄─────►│  Auth/Tokens  │◄─────►│  Tools       │◄─►│  APIs    │
      │  Studio   │ REST  │  DLP/Govern.  │ MCP   │  Resources   │   │  Cloud   │
      │  Agent    │       │  Runtime      │       │  Business    │   │  Services│
      │           │       │               │       │  Logic       │   │          │
      └───────────┘       └───────────────┘       └──────────────┘   └──────────┘
    
    ✨ Key Insight:
    • The PP connector framework handles auth, tokens, and governance
    • MCP server handles tool definitions, business logic, and orchestration
    • Many infrastructure concerns are shared with regular PP connectors
```

#### 🔗 Power Platform Connector Architecture

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                       POWER PLATFORM CONNECTORS                             │
    └─────────────────────────────────────────────────────────────────────────────┘
    
       🏢 POWER PLATFORM                📦 CONNECTOR                   🌐 EXTERNAL
      ┌─────────────────┐            ┌─────────────────┐            ┌───────────┐
      │                 │            │                 │            │           │
      │  ┌───────────┐  │            │  ┌───────────┐  │            │  REST     │
      │  │ Copilot   │  │  ◄──────►  │  │  OpenAPI  │  │  ◄──────►  │  API      │
      │  │ Studio    │  │   REST     │  │   Spec    │  │   HTTPS    │           │
      │  └───────────┘  │   HTTPS    │  ├───────────┤  │   OAuth    ├───────────┤
      │  ┌───────────┐  │            │  │  Actions  │  │   API Key  │           │
      │  │ Power     │  │            │  ├───────────┤  │            │  Auth     │
      │  │ Automate  │  │            │  │ Triggers  │  │            │  Endpoint │
      │  └───────────┘  │            │  ├───────────┤  │            │           │
      │  ┌───────────┐  │            │  │   Auth    │  │            ├───────────┤
      │  │ Power     │  │            │  │   Config  │  │            │           │
      │  │ Apps      │  │            │  └───────────┘  │            │  Data     │
      │  └───────────┘  │            │                 │            │  Service  │
      └─────────────────┘            └─────────────────┘            └───────────┘
    
    ✨ Key Features:
    • 1500+ pre-built connectors      • Visual configuration
    • Enterprise governance           • Automatic token refresh
    • Azure Key Vault integration     • Built-in audit logging
```
### 2.2 Component Comparison

| Component | MCP | Power Platform Connectors |
|-----------|-----|---------------------------|
| **Client/Consumer** | AI agent/application consuming<br> MCP services | Power Platform Service (Copilot Studio,<br> Power Automate, Power Apps) |
| **Integration Layer** | MCP Server (implements protocol,<br>exposes tools/resources/prompts) | Connector (API wrapper with<br> OpenAPI definition) |
| **Transport Protocol** | stdio (local) or HTTP with<br> Server-Sent Events (SSE) (remote) | REST over HTTPS |
| **Message Format** | JSON-RPC 2.0 messages | REST API requests/responses |
| **Communication Style** | Bidirectional (supports server-initiated<br> messages) | Request-response pattern |
| **Connection Type** | Persistent (stdio) or SSE for streaming | Stateless HTTP connections |
| **Target System** | External Services/APIs | External Service APIs |
| **Authentication Location** | In MCS: handled by connector/connection<br> framework (same as connectors).<br> Standalone: in MCP server implementation | In Connector configuration + Azure<br> Key Vault |
| **Discovery Mechanism** | Dynamic tool/resource discovery<br> via protocol | Static OpenAPI definition |
| **Execution Model** | Direct function calls from LLM | Action execution through Power Platform<br> runtime |

---

## 3. Authentication Mechanisms

### 3.1 Authentication Comparison

> **Within Copilot Studio:** Both MCP servers and Power Platform connectors use the same connector/connection mechanism to obtain, store, and refresh tokens. The MCP server itself validates tokens, just as any downstream API validates tokens sent by a connector. The auth differences below are more relevant when comparing standalone MCP usage vs. connectors.
{: .prompt-info }

| Aspect | MCP (Standalone) | MCP (Within MCS) | Power Platform Connectors |
|--------|-------------------|-------------------|---------------------------|
| **Philosophy** | Protocol does not prescribe<br> authentication; left to server<br> developers | Auth handled by PP connector<br> framework; MCP server validates<br> tokens like any API | Structured authentication<br> frameworks with predefined<br> patterns |
| **Token<br> Obtainment** | Client/developer manages<br> token acquisition | Connector/connection mechanism<br> handles token acquisition | Connector/connection mechanism<br> handles token acquisition |
| **Token<br> Validation** | MCP server validates<br> incoming tokens | MCP server validates<br> incoming tokens | Downstream API/service<br> validates incoming tokens |
| **Credential<br> Storage** | Developer-managed<br> (env vars, config files,<br> secrets manager) | Azure Key Vault, PP secure<br> storage (same as connectors) | Azure Key Vault integration,<br> built-in secure storage |
| **Token<br> Management** | Manual implementation<br> required | Automatic token refresh<br> (handled by PP runtime) | Automatic token refresh<br> for OAuth |
| **Credential Sharing** | Per-server configuration | Connection sharing via PP | Connection sharing across<br> flows and apps |
| **Secret Rotation** | Manual or custom<br> implementation | Supported through Azure<br> Key Vault | Supported through Azure<br> Key Vault |
| **Audit Logging** | Must be implemented<br> by developer | Built-in PP authentication<br> event logging | Built-in authentication<br> event logging |
| **Implementation<br> Complexity** | Higher (must build<br> auth layer) | Lower (PP handles auth<br> infrastructure) | Lower (pre-built auth<br> frameworks) |

> **Key takeaway:** When used within Copilot Studio, MCP authentication infrastructure is largely the same as for connectors — the connector framework handles token acquisition, storage, and refresh. The MCP server's role in auth is analogous to any downstream API that receives and validates a bearer token.
{: .prompt-tip }

### 3.2 Authentication Example Configurations

**MCP Server Authentication (Example):**
```json
{
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": {
      "query": "SELECT * FROM users"
    }
  }
}
```
*Note: Client-to-server auth handled at transport layer (API key header, etc.)*
*Server-to-downstream auth managed within MCP server code*

**Power Platform Connector Authentication (Example):**
```json
{
  "securityDefinitions": {
    "oauth2_auth": {
      "type": "oauth2",
      "flow": "accessCode",
      "authorizationUrl": "https://api.example.com/oauth/authorize",
      "tokenUrl": "https://api.example.com/oauth/token",
      "scopes": {
        "read": "Read access",
        "write": "Write access"
      }
    }
  }
}
```
*Configured in OpenAPI definition, managed by Power Platform*

---
## 4. When to Use What

### Decision Guide: Choose the Right Technology for Your Scenario

| Use Case Category | Choose MCP 🎯 | Choose Power Platform Connectors 🎯 |
|-------------------|---------------|-------------------------------------|
| **AI Agent<br> Development** | ✅ **Custom Tool Development**<br>• Need tools not available as existing connectors<br>• Want to delegate orchestration complexity<br>&nbsp; to the MCP server owner<br>• Wrapping complex APIs where the MCP server<br>&nbsp; owner manages adding new methods<br>• Building with Copilot Studio, GPT, or other LLMs<br>• Need for agentic workflows with sampling<br>• Complex multi-step reasoning | ✅ **Enterprise Agent Development**<br>• Target service has an existing connector<br>• Maker needs fine-grained control over tool<br>&nbsp; descriptions and input configuration<br>• Power Platform already in use<br>• Copilot Studio for agent development<br>• Need conversational AI with workflows<br>• Integration with Teams/SharePoint<br>• Business user-facing chatbots |
| **Development<br> Approach** | ✅ **Development Flexibility**<br>• Need custom authentication flows<br>• Complex data transformations<br>• Specialized protocol support<br>• Unique integration requirements<br>• Custom error handling logic<br>• Advanced request/response processing | ✅ **Pre-built Integrations**<br>• Target service has existing connector<br>• Standard API patterns (REST)<br>• Quick time-to-market<br>• Reduce development effort<br>• Standard CRUD operations<br>• Well-documented public APIs |
| **Philosophy <br>and Control** | ✅ **Orchestration Delegation**<br>• Delegate orchestration and tool<br>&nbsp; management to MCP server owner<br>• MCP server owner adds/removes tools<br>&nbsp; without maker involvement<br>• Reduced maker burden for tool updates<br>• Open-source, community-driven<br>• Code portability across platforms<br>• ⚠️ Maker cannot override tool descriptions<br>&nbsp; or input configs in MCS | ✅ **Maker Control Preference**<br>• Maker sets tool descriptions and<br>&nbsp; configures input values per action<br>• Full visibility into each tool/action<br>• Automatic updates and patches<br>• Enterprise support and SLA<br>• Predictable maintenance costs<br>• Focus on business logic, not<br> infrastructure |
| **Deployment<br> Model** | ✅ **Local/Hybrid Deployment**<br>• On-premises requirements<br>• Air-gapped environments<br>• Data sovereignty concerns<br>• Local-first architecture<br>• Edge computing scenarios<br>• Offline operation capability | ✅ **Cloud-First Deployment**<br>• Cloud-native architecture<br>• Global availability requirements<br>• Automatic scaling needs<br>• Multi-region redundancy<br>• Microsoft Azure infrastructure<br>• Pay-as-you-grow model |
| **Cost & Budget** | ✅ **Cost Sensitivity**<br>• Budget constraints<br>• High API call volume without limits<br>• Need unlimited scaling<br>• Self-hosted infrastructure available<br>• No per-transaction fees<br>• Open-source tools and libraries | ✅ **Predictable Enterprise Licensing**<br>• Enterprise agreements in place<br>• Volume licensing benefits<br>• Bundled with existing licenses<br>• Standard usage patterns<br>• Centralized cost management<br>• Amortized across organization |
| **Team & Skills** | ✅ **Developer-Centric Teams**<br>• Developers with API/backend skills<br>• Comfortable with code and CLI<br>• DevOps capabilities available<br>• Version control and CI/CD expertise<br>• Debugging and troubleshooting skills<br>• Infrastructure management experience | ✅ **Diverse Team Composition**<br>• Business analysts and citizen<br> developers<br>• Low-code/no-code requirements<br>• Visual workflow design preference<br>• Limited coding resources<br>• Business process automation focus<br>• Power Platform Center of Excellence |
| **Compliance &<br> Governance** | ✅ **Custom Compliance**<br>• Specific industry regulations<br>• Custom audit implementations<br>• Proprietary security models<br>• Unique data handling requirements<br>• Non-standard encryption needs<br>• Specialized compliance frameworks | ✅ **Enterprise Compliance**<br>• SOC 2, HIPAA, GDPR requirements<br>• Data loss prevention needs<br>• Pre-built audit trail requirements<br>• Role-based access control (RBAC)<br>• Microsoft compliance certifications<br>• Industry-standard security |
| **Integration<br> Scope** | ✅ **Specialized Integrations**<br>• Custom internal systems<br>• Legacy systems with unique protocols<br>• Proprietary APIs<br>• Real-time data streaming<br>• Complex business logic<br>• Few, highly customized integrations | ✅ **Enterprise Integrations**<br>• Integrating with Dynamics 365<br>• SharePoint/Teams integration<br>• Azure services connectivity<br>• Office 365 workflows<br>• Popular SaaS applications<br>• Many standard integrations |
| **Development<br> Stage** | ✅ **Rapid Prototyping**<br>• Quick POC development<br>• Testing integration patterns<br>• Experimental features<br>• Learning and education<br>• Research and innovation<br>• Iterative development | ✅ **Production & Scale**<br>• Production-ready from day one<br>• Established workflows<br>• Enterprise-scale requirements<br>• Mission-critical applications<br>• 24/7 operation needs<br>• Mature solution deployment |
| **Performance<br> Requirements** | ✅ **Rapid Prototyping & Flexibility**<br>• Fast POC/MVP creation — no need<br>&nbsp; to define individual tool actions<br>• MCP server owner can add tools<br>&nbsp; without maker reconfiguration<br>• ⚠️ Tool discovery polling adds<br>&nbsp; overhead per conversation<br>• Custom caching strategies possible<br>• In MCS, traffic routes through PP<br>&nbsp; connector layer (similar latency) | ✅ **Optimized for Production**<br>• No tool discovery overhead —<br>&nbsp; tools are statically defined<br>• Built-in retry and resilience<br>• Platform-managed scaling<br>• Standard throughput requirements<br>• Typical business application needs<br>• Balanced performance and<br> reliability |

### Quick Decision Tree

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    🚀 TECHNOLOGY DECISION GUIDE                              │
└──────────────────────────────────────────────────────────────────────────────┘

🚀 START: What are you building?
┃
┣━━ 🤖 Custom AI Agent with direct LLM integration?
┃   ┣━━ ✅ YES ────────────► ┌───────────────────┐
┃   ┃                        │   🎯 MCP          │
┃   ┃                        └───────────────────┘
┃   ┗━━ ❌ NO ──► Continue
┃
┣━━ 🏢 Already using Microsoft 365/Power Platform?
┃   ┣━━ ✅ YES ────────────► ┌───────────────────┐
┃   ┃                        │   🔗 Power        │
┃   ┃                        │    Platform       │
┃   ┃                        └───────────────────┘
┃   ┗━━ ❌ NO ──► Continue
┃
┣━━ 🛡️ Need enterprise compliance (SOC 2, HIPAA, GDPR)?
┃   ┣━━ ✅ YES & Microsoft ecosystem ─► 🔗 Power Platform
┃   ┣━━ ✅ YES & custom compliance ───► 🎯 MCP
┃   ┗━━ ❌ NO ──► Continue
┃
┣━━ 🔧 Have pre-built connector for target service?
┃   ┣━━ ✅ YES ────────────► 🔗 Power Platform Connectors
┃   ┗━━ ❌ NO ──► Continue
┃
┣━━ 🏠 Need on-premises/air-gapped deployment?
┃   ┣━━ ✅ YES ────────────► 🎯 MCP
┃   ┗━━ ❌ NO ──► Continue
┃
┣━━ 👨‍💻 Team skilled in backend development?
┃   ┣━━ ✅ YES ────────────► 🎯 MCP
┃   ┗━━ ❌ NO ──► Continue
┃
┗━━ ☁️ Want managed service with no infrastructure?
    ┣━━ ✅ YES ────────────► 🔗 Power Platform Connectors
    ┗━━ ❌ NO ─────────────► 🎯 MCP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 LEGEND:
🎯 MCP = Model Context Protocol (flexibility, control, custom development)
🔗 Power Platform = Enterprise, managed, pre-built integrations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Hybrid Approach

**Consider using BOTH when:**
- Enterprise needs both custom AI agents AND business process automation
- Want MCP flexibility with Power Platform governance
- Migrating from custom solutions to enterprise platform
- Different teams with different skill sets and requirements
- Need rapid innovation with stable enterprise integrations

### 🆕 Important Note: MCP Servers in Copilot Studio

**Microsoft now supports MCP servers directly in Copilot Studio**, creating a powerful third option that combines the best of both worlds:

| Capability | MCP via Copilot Studio | Custom MCP (Direct) | Power Platform Connectors |
|------------|------------------------|---------------------|---------------------------|
| **Access Method** | Native MCP integration in Copilot Studio | Direct client connection | OpenAPI-based connector |
| **Protocol** | MCP protocol (JSON-RPC) | MCP protocol (JSON-RPC) | REST API |
| **Governance** | ✅ Full Power Platform governance | ❌ Custom implementation | ✅ Full Power Platform governance |
| **Authentication** | ✅ Managed by Copilot Studio | ⚠️ Developer-managed | ✅ Managed by Power Platform |
| **Audit & Compliance** | ✅ Built-in Power Platform audit | ❌ Custom implementation | ✅ Built-in Power Platform audit |
| **Development Flexibility** | ✅ Full MCP flexibility | ✅ Full MCP flexibility | ⚠️ Limited to connector framework |
| **Tool Deployment** | MCP server deployed separately | MCP server deployed separately | Connector registered in platform |
| **Use in Power Automate** | ✅ Via Copilot Studio actions | ❌ Not directly | ✅ Direct access |
| **Use in Power Apps** | ✅ Via Copilot Studio | ❌ Not directly | ✅ Direct access |
| **LLM-Optimized** | ✅ Native MCP features | ✅ Native MCP features | ⚠️ REST-based |
| **Best For** | AI agents needing enterprise governance | Custom AI apps, research, prototypes | Business process automation |

**When to use MCP Servers in Copilot Studio:**
1. ✅ Building enterprise AI agents with custom tools
2. ✅ Need MCP's flexibility with Power Platform's governance
3. ✅ Want to leverage existing MCP servers in enterprise context
4. ✅ Require audit trails and compliance for AI agent actions
5. ✅ Team comfortable with MCP development but needs enterprise features
6. ✅ Transitioning from standalone MCP to enterprise deployment
7. ✅ Need both conversational AI (Copilot Studio) and custom tools (MCP)

**Configuration Example:**
```json
{
  "copilotStudio": {
    "mcpServers": [
      {
        "name": "enterprise-data",
        "url": "https://mcp.company.com/enterprise-data",
        "authentication": {
          "type": "managedIdentity"
        }
      }
    ]
  }
}
```

**This approach provides:**
- 🎯 MCP protocol benefits (dynamic tools, LLM-optimized)
- 🎯 Power Platform governance (audit, DLP, compliance)
- 🎯 Enterprise authentication (Azure AD, Key Vault)
- 🎯 Centralized management and monitoring
- 🎯 No need for Custom Connector translation layer

**Updated Decision Logic:**

```
If building AI agent in Copilot Studio:
  ├─ Need custom/complex tools?
  │  └─ ✅ Use Native MCP Servers (Recommended approach)
  │      • Full MCP protocol benefits
  │      • Power Platform governance
  │      • Enterprise authentication
  │      • No translation layer needed
  │
  └─ Need standard integrations?
     └─ Use Power Platform Connectors

If building standalone AI agent (non-Copilot Studio):
  └─ Use Direct MCP (Claude, GPT, custom apps)

If building business workflows (Power Automate/Apps):
  └─ Use Power Platform Connectors

Microsoft's Strategic Direction: Native MCP > Custom Connector Bridge > Direct API calls
```

---

## 5. Agent Development Considerations

### 5.1 Development Workflow Comparison

| Phase | MCP Approach | Power Platform Approach |
|-------|--------------|------------------------|
| **1. Discovery** | Define tools/resources needed | Check for existing connector in catalog |
| **2. Development** | Implement MCP server (Python/Go/etc.)<br>• Write tool functions<br>• Define schemas<br>• Implement business logic | Create custom connector if needed<br>• Define OpenAPI specification<br>• Configure actions<br>• Map request/response |
| **3. Authentication** | Configure authentication in server code<br>• Environment variables<br>• Config files<br>• OAuth implementation | Configure authentication in connector<br>• Select auth type (OAuth/API Key/etc.)<br>• Connect to Azure Key Vault |
| **4. Testing** | Test with MCP client/inspector<br>• Use stdio for local testing<br>• Test HTTP endpoints<br>• Validate tool calls | Test actions in connector tester<br>• Test in Power Automate<br>• Validate in Copilot Studio |
| **5. Integration** | Integrate with AI agent<br>• Add to agent config<br>• Configure client connection<br>• Test end-to-end | Add to Copilot Studio agent<br>• Enable connector<br>• Build conversational flows<br>• Configure triggers |
| **6. Deployment** | Deploy server<br>• Docker container<br>• VM/cloud instance<br>• Serverless function | Publish<br>• Submit for certification (optional)<br>• Share with organization<br>• Set permissions |
| **7. Operations** | Monitor and maintain<br>• Set up logging<br>• Configure alerts<br>• Scale infrastructure<br>• Update server code | Monitor<br>• View built-in analytics<br>• Check error logs<br>• Update connector version |
| **Time to First<br> Integration** | 2-4 hours (simple tools) | 1-2 hours (with existing connector)<br>4-8 hours (custom connector) |
| **Ongoing<br> Maintenance** | Higher (infrastructure + code) | Lower (managed service) |

### 5.2 Tool/Action Definition Comparison

| Aspect | MCP Tool Definition | Power Platform Action Definition |
|--------|---------------------|----------------------------------|
| **Format** | JSON Schema in code | OpenAPI Specification |
| **Definition Location** | In MCP server code | In connector OpenAPI file |
| **Schema Language** | JSON Schema | OpenAPI 2.0/3.0 |
| **Discovery** | Dynamic (tools/list endpoint) | Static (defined at connector registration) |
| **Versioning** | Server version | Connector version |
| **Parameter Types** | Full JSON Schema support | OpenAPI types (string, number, boolean, array, object) |
| **Response Schema** | JSON Schema | OpenAPI response definitions |
| **Documentation** | In description fields | In OpenAPI documentation |

**MCP Tool Example:**
```json
{
  "name": "get_customer_data",
  "description": "Retrieves customer information by ID",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Unique customer identifier"
      }
    },
    "required": ["customer_id"]
  }
}
```

**Power Platform Action Example:**
```json
{
  "summary": "Get customer data",
  "description": "Retrieves customer information by ID",
  "operationId": "GetCustomerData",
  "parameters": [
    {
      "name": "customer_id",
      "in": "query",
      "required": true,
      "type": "string",
      "description": "Unique customer identifier"
    }
  ],
  "responses": {
    "200": {
      "description": "Customer data retrieved successfully"
    }
  }
}
```

### 5.3 Performance Considerations

> **Within Copilot Studio:** MCP traffic routes through the Power Platform connector/runtime layer, so the "direct connection" latency advantage of standalone MCP does not apply. Additionally, MCP requires periodic tool discovery (the agent polls the MCP server to learn available tools), which adds overhead that static connector action definitions do not incur.
{: .prompt-warning }

| Aspect | MCP (Standalone) | MCP (Within MCS) | Power Platform Connectors |
|--------|-------------------|-------------------|---------------------------|
| **Latency** | Low (direct connection,<br> 10-50ms overhead) | Medium (routes through PP<br> connector runtime) | Medium (platform hop,<br> 100-300ms overhead) |
| **Tool Discovery<br> Overhead** | Minimal (client caches<br> tool list) | Periodic polling per<br> conversation to discover<br> available tools | None — tools are statically<br> defined at design time |
| **Throughput** | High (depends on<br> server capacity) | Subject to PP runtime<br> + MCP server capacity | Subject to throttling<br> limits (varies by license) |
| **Scalability** | Manual (scale servers,<br> load balancing) | MCP server: manual.<br> PP runtime: automatic | Automatic (platform<br> managed) |
| **Caching** | Custom implementation<br> (Redis, in-memory, etc.) | Custom on MCP server side | Built-in connector caching<br> (configurable TTL) |
| **Rate Limiting** | Custom implementation | PP platform limits +<br> MCP server limits | Built-in (connector tier<br> dependent) |
| **Cold Start** | Minimal (unless<br> serverless) | MCP server cold start +<br> PP connection warm-up | Minimal (warm connections) |
| **Best For** | High-frequency,<br> low-latency tool calls | Rapid prototyping, flexible<br> tool sets, delegated<br> orchestration | Production workloads,<br> standard business<br> workflows |

---


## 6. Microsoft's MCP Ecosystem

Microsoft has significantly invested in MCP integration across its platform, making it a strategic choice for enterprises already using Microsoft technologies.

> Note: This section lists available MCP Servers as of Jan 2026 and some of the MCP Servers might be in preview. Check MS Learn documentation for latest information.
{: .prompt-info }  

### 6.1 Microsoft-Provided MCP Servers

Microsoft provides a comprehensive catalog of built-in MCP servers available in Copilot Studio:

#### Core Platform MCP Servers

| Service | MCP Server | Key Tools | Use Cases |
|---------|------------|-----------|----------|
| **Dataverse** | Dataverse <br>MCP Server | Table operations, schema discovery,<br> record CRUD, relationship traversal | Customer data, business records, <br>Power Apps integration |
| **Microsoft<br> Fabric** | Fabric MCP | Data engineering, analytics, lakehouse<br> operations | Big data analytics,<br> data warehousing |
| **Kusto Query** | Kusto Query MCP | KQL query execution, data exploration | Log analytics, telemetry analysis,<br> Azure Data Explorer |

#### Dynamics 365 MCP Servers

| Service | MCP Server | Key Tools | Use Cases |
|---------|------------|-----------|----------|
| **Dynamics 365<br> Sales** | D365 Sales<br> MCP | Lead qualification,<br> account research, competitor analysis,<br> opportunity management | Sales automation,<br> CRM workflows |
| **Dynamics 365<br> Finance** | D365 Finance<br> MCP | Financial data access,<br> reporting, GL operations | Financial management,<br> accounting |
| **Dynamics 365<br> Supply Chain** | D365 Supply Chain<br> MCP | Inventory management,<br> procurement, logistics | Supply chain<br> operations |
| **Dynamics 365<br> Customer Service** | D365 Service<br> MCP | Case management,<br> knowledge search, customer insights | Customer support,<br> service desk |
| **Dynamics 365<br> ERP** | D365 ERP<br> MCP | Enterprise resource<br> planning operations | Business operations<br> management |
| **Dynamics 365<br> Contact Center** | D365 Contact Center<br> MCP | Omnichannel engagement,<br> agent assistance | Contact center<br> operations |

#### Microsoft 365 MCP Servers

| Service | MCP Server | Key Tools | Use Cases |
|---------|------------|-----------|----------|
| **Outlook Mail** | Microsoft Outlook Mail MCP | Email management, send/receive, search | Email automation, communication workflows |
| **Outlook Calendar** | Microsoft Outlook Calendar MCP | Calendar operations, meeting management, scheduling | Scheduling, availability management |
| **Microsoft Teams** | Microsoft Teams MCP | Channel management, messaging, notifications | Team collaboration, notifications |
| **SharePoint & OneDrive** | Microsoft SharePoint and OneDrive MCP | File operations, document management, sharing | Document management, collaboration |
| **SharePoint Lists** | Microsoft SharePoint Lists MCP | List operations, item management | Data tracking, project management |
| **Microsoft Word** | Microsoft Word MCP | Document creation, editing, templates | Document automation |
| **User Profile** | Microsoft 365 User Profile MCP | User information, directory access | Identity, user context |
| **Admin Center** | Microsoft 365 Admin Center MCP | Tenant administration, user management | IT administration |
| **Copilot Search** | Microsoft 365 Copilot (Search) MCP | Semantic search across M365 | Enterprise search, knowledge discovery |

#### Developer & DevOps MCP Servers

| Service | MCP Server | Key Tools | Use Cases |
|---------|------------|-----------|----------|
| **GitHub** | GitHub MCP | Repository management, issues, PRs, code review | Software development, project management |
| **Azure Services** | Azure MCP Server | Resource management, deployment, monitoring | Cloud infrastructure, DevOps |

#### Third-Party MCP Servers (Certified)

| Service | MCP Server | Key Tools | Use Cases |
|---------|------------|-----------|----------|
| **Box.com** | Box MCP | File storage, sharing, collaboration | Enterprise file management |
| **Learn Docs** | Learn Docs MCP | Documentation search, retrieval | Technical documentation |
| **Gieni** | Gieni Actions MCP | Answer fetching, knowledge retrieval | Knowledge management |

### 6.2 Microsoft MCP Integration Points

| Integration | Description | Benefits |
|-------------|-------------|----------|
| **Windows ODR** | On-device Agent Registry for local MCP servers | Security containment, local discovery, admin control |
| **Copilot Studio** | Native MCP protocol support | No translation layer, full governance, enterprise features |
| **Visual Studio/VS Code** | GitHub Copilot agent mode with MCP | Development workflow integration, code-aware assistance |
| **Azure AI Foundry** | Hosted MCP server endpoints | Managed infrastructure, scalable deployment |
| **Power Platform** | Custom Connector bridge support | Hybrid integration, enterprise governance |

### 6.3 Microsoft Security Model for MCP

| Security Layer | Implementation | Benefit |
|----------------|----------------|---------|
| **Windows Containment** | MCP servers run in isolated environments | Protection against cross-prompt injection, limited resource access |
| **Azure AD Integration** | Native authentication for MCP servers | Single sign-on, enterprise identity management |
| **Managed Identity** | Service-to-service authentication | No stored credentials, automatic token management |
| **Key Vault Integration** | Secure credential storage | Enterprise secret management, automatic rotation |
| **Audit Logging** | Comprehensive MCP tool execution logs | Compliance, troubleshooting, usage analytics |
| **Data Loss Prevention** | ⚠️ DLP policies apply at the connector level; MCP tools that are not aggregations of connector actions may not be governed by DLP (Data Policies and Advanced Connector Policies). Verify DLP coverage for your specific MCP tools | Data protection — verify governance coverage |

---

## 7. Decision Matrix

| Factor | Favor MCP | Favor Power Platform |
|--------|-----------|---------------------|
| **Development Approach** | Custom tools not available as connectors | Target service has existing connector |
| **Team Skills** | Developers with API/backend skills | Business analysts, citizen developers |
| **Compliance Requirements** | Standard/custom compliance | Enterprise compliance (SOC 2, HIPAA) |
| **Budget** | Limited, usage-based | Enterprise license available |
| **Time to Market** | Fast POC — no individual tool setup needed | Pre-built connector exists |
| **Maker Control<br> (in MCS)** | ⚠️ Makers CANNOT override tool descriptions<br> or input configurations. Control sits with<br> the MCP server owner | ✅ Makers CAN set/override tool descriptions<br> and configure input values per action |
| **Orchestration<br> Ownership** | Delegated to MCP server owner —<br> new tools auto-appear, but maker<br> has less visibility | Maker explicitly adds and configures<br> each action as a tool |
| **Maintenance<br> Burden** | Lower for makers — MCP server owner<br> manages tool changes. Higher for<br> MCP server owner | Maker or connector owner must add<br> wrappers for each new API method |
| **Authentication<br> (in MCS)** | Handled by PP connector framework<br> (same as connectors) | Handled by PP connector framework |
| **DLP Governance** | ⚠️ DLP applied at connector level;<br> individual MCP tools may not be<br> governed | ✅ DLP policies apply per connector action |
| **Deployment Model** | On-premises/hybrid (standalone) or<br> cloud (via MCS) | Cloud-first |
| **Integration Count** | Few specialized or rapidly changing tools | Many standard integrations |
| **Vendor Preference** | Vendor-agnostic | Microsoft-centric |

---
## 8. Conclusion

Both MCP servers and Power Platform connectors serve critical roles in agent development:

**Within Copilot Studio**, both MCP servers and Power Platform connectors share much of the same underlying infrastructure (connector framework, auth/token management, runtime). The real differences are:

**Favor MCP servers when:**
- You need tools that don't exist as connectors
- You want to delegate orchestration and tool lifecycle to the MCP server owner (new tools appear automatically without maker reconfiguration)
- You're building a rapid POC/MVP and want to avoid defining individual tool actions
- You need the MCP protocol's flexibility (resources, prompts, sampling)

**Favor Power Platform connectors when:**
- An existing connector covers your target service
- Makers need fine-grained control over tool descriptions and input configurations (MCP does not support this in MCS today)
- DLP governance at the individual tool/action level is required
- You want statically-defined tools with no discovery overhead
- Your team prefers low-code/visual configuration

**Key tradeoffs to consider:**
- **Orchestration control**: MCP delegates orchestration to the server owner, reducing maker burden but also reducing maker visibility and configurability
- **DLP**: DLP policies apply at the connector level; individual MCP tools may not be separately governed
- **Performance**: In MCS, MCP traffic routes through the PP connector layer (similar latency), but MCP adds tool discovery polling overhead
- **Maker control**: Connector actions allow makers to override descriptions and inputs; MCP tools do not support this in MCS currently

As AI agent development matures, expect both technologies to evolve and potentially converge, offering developers the best of both worlds.

---

## 9. References

### Official Specifications
- Model Context Protocol Specification: https://modelcontextprotocol.io/
- OpenAPI Specification: https://spec.openapis.org/

### Microsoft Learn Documentation
- **Model Context Protocol (MCP) on Windows**: https://learn.microsoft.com/en-us/windows/ai/mcp/overview
- **Connect to Dataverse with Model Context Protocol**: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp
- **Use agent tools to extend, automate, and enhance your agents**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools
- **Create a new Model Context Protocol (MCP) server**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-create-new-server
- **Microsoft Power Platform Connectors Documentation**: https://learn.microsoft.com/en-us/connectors/
- **Custom Connectors Documentation**: https://learn.microsoft.com/en-us/connectors/custom-connectors/
- **Power Platform Copilot Studio**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/
- **Azure Key Vault Integration**: https://learn.microsoft.com/en-us/azure/key-vault/
- **Power BI MCP servers**: https://learn.microsoft.com/en-us/power-bi/developer/mcp/mcp-servers-overview
- **Dynamics 365 Sales MCP**: https://learn.microsoft.com/en-us/dynamics365/sales/connect-to-model-context-protocol-sales

---
Happy Automating! <br>
---
thought: "When your AI agent can seamlessly access any tool or data source, what business problems will you solve first?"
---