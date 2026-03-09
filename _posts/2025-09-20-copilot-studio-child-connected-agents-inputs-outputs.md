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

### Child Agent

Inputs and outputs for child agents can be created directly through the Copilot Studio UI. No YAML editing required.

Here's what the YAML looks like under the hood:

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

### Connected Agent

Connected agents require configuration on **both sides**: the main agent that calls the connected agent, and the connected agent itself.

#### Main agent side

In your main agent, the connected agent is represented as a `TaskDialog`. Make sure that the `inputType` and `outputType` properties are defined inside the `action` section:

```yaml
kind: TaskDialog
inputs:
  - kind: AutomaticTaskInput
    propertyName: expenseReportFileFullPath
    description: Full file path, including SharePoint site URL, of an expense report file.

modelDisplayName: Connected Agent
modelDescription: Use this agent to process expense reports in a multi-agent scenario
action:
  kind: InvokeConnectedAgentTaskAction
  inputType:
    properties:
      expenseReportFileFullPath:
        displayName: expenseReportFileFullPath
        isRequired: true
        type: String
  botSchemaName: gd_connectedAgent_QC906u
  historyType:
    kind: ConversationHistory
```

> Note that `inputType` and `outputType` go inside `action`, not at the root level of the `TaskDialog`. This is different from child agents, where they sit at the root level.
{: .prompt-warning }

#### Connected agent side

On the connected agent itself, you need to set up a topic that receives the inputs when the agent is invoked by another agent. The key steps are:

1. Make the variable **global**
2. For inputs, tick **"External source can set the value"**
3. For outputs, tick **"External source can receive the value"**
4. Use the **OnRedirect** trigger, which fires when the agent is called by another agent

Here's what the topic YAML looks like:

```yaml
kind: AdaptiveDialog
modelDescription: Use this tool to initialize the agent when it's called through a different agent
beginDialog:
  kind: OnRedirect
  id: main
  actions:
    - kind: SetVariable
      id: setVariable_1nnsy7
      variable: Global.expenseReportFileFullPath
      value: "https://contoso.sharepoint.com/sites/Reports/Shared%20Documents/ExpenseReports/Expense_Report.xlsx"

inputType: {}
outputType: {}
```

> The `inputType: {}` and `outputType: {}` at the dialog level declare that this topic participates in the input/output contract. The actual variable mapping is handled through the global variable settings.
{: .prompt-info }

---

*Have questions about agent orchestration patterns? Drop a comment below or reach out!*