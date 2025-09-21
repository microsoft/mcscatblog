---
layout: post
title: "Using Inputs and Outputs in Child and Connected Agents"
date: 2025-09-20
categories: [copilot-studio, tutorial, multi-agent]
tags: [child-agents, connected-agents, orchestration, inputs, outputs]
author: adilei
---

# Connected and child agents

Copilot Studio Agents can orchestrate over child and connected agents. While child agents are fully owned by the main agent, connected agents are fully independent agents that can run standalone.

Child agents are ideal for modularizing logic within your main agent, while connected agents can handle more complex scenarios and can be reused by multiple main agents. 

## Inputs and Outputs for Agents

From an orchestration perspective, inputs and outputs inform the main agent, and help to chain multiple tools and agents together. They define the data flow between different components of your AI agent.

From the child or connected agent's perspective, these same inputs and outputs become the task definition - they specify exactly what the agent is being asked to do. For example, a sentiment analysis child agent might have the following parameters:
- **Input**: `sentence` (the text to analyze)
- **Outputs**: `sentiment` (positive/negative/neutral) and `confidenceLevel` (0-100)

These parameters don't just guide the main agent's orchestrator, they also partly define the task the child agent needs to perform.

## How to Define Inputs and Outputs

**Note**: As of September 2025, inputs and outputs for child and connected agents can only be defined through YAML configuration. There is no UI-based designer available yet.

### Connected Agent Example

```yaml
kind: TaskDialog
modelDisplayName: Mortgages Agent
modelDescription: This agent helps customers with information about their mortgage accounts and products, answering common questions and carrying out common related transactions.
action:
  kind: InvokeConnectedAgentTaskAction
  outputType:
    properties:
      MortgagePaymentDate:
        displayName: PaymentDate
        description: The payment date for the mortgage
        type: String
      Response:
        displayName: AssignedTo
        description: The agent's response
        type: String
  botSchemaName: cr30a_mortgagesAgent
  historyType:
    kind: ConversationHistory
```

### Child Agent Example

```yaml
kind: AgentDialog
inputs:
  - kind: AutomaticTaskInput
    propertyName: TicketId
    description: The ID of the ticket

beginDialog:
  kind: OnToolSelected
  id: main
  description: This tool can be used to obtain the current status / details of a ticket

settings:
  instructions: |-
    If you are asked for the status of a ticket. Assume the following details.
    
    Title is 'Test test'.
    It is currently assigned to Adi Leibowitz. 
    It is currently Active.

inputType:
  properties:
    TicketId:
      displayName: TicketId
      isRequired: true
      type: String

outputType:
  properties:
    Response:
      displayName: AssignedTo
      description: The agent's response
      type: String
    TicketStatus:
      displayName: TicketStatus
      description: The current status of the ticket
      type: String
    Title:
      displayName: Title
      description: The title of the ticket
      type: String
```

---

*Have questions about agent orchestration patterns? Drop a comment below or reach out!*