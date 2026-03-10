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

Inputs and outputs for child agents can be defined directly through the Copilot Studio UI. For connected agents, the configuration on the main agent side still requires YAML. The examples below show what the configuration looks like under the hood.

### Child Agent

![Child agent inputs UI in Copilot Studio](/assets/posts/copilot-studio-child-connected-agents-inputs-outputs/child-agent-inputs-ui.png){: .shadow w="700" }
_Defining inputs for a child agent directly in the Copilot Studio UI_

Here's what the resulting YAML looks like:

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

Consider a scenario where you have a main agent that orchestrates HR queries. When a user asks about someone's role, the main agent passes the user's email to a specialized HR connected agent, which looks up the role and returns it. The connected agent is independent, it can also be invoked directly or by other main agents.

#### Main agent side

In your main agent, the connected agent is represented as a `TaskDialog`. Make sure that the `inputType` and `outputType` properties are defined inside the `action` section:

```yaml
kind: TaskDialog
inputs:
  - kind: AutomaticTaskInput
    propertyName: userEmail
    description: The email address of the user to look up

modelDisplayName: HR Specialist
modelDescription: Helps with HR information, including user role
outputs:
  - propertyName: userRole

action:
  kind: InvokeConnectedAgentTaskAction
  inputType:
    properties:
      userEmail:
        displayName: userEmail
        isRequired: true
        type: String
  outputType:
    properties:
      userRole:
        displayName: userRole
        description: The role of the user in the organization
        type: String
  botSchemaName: cr26e_hrSpecialist
  historyType:
    kind: ConversationHistory
```

> Note that `inputType` and `outputType` go inside `action`, not at the root level of the `TaskDialog`. This is different from child agents, where they sit at the root level.
{: .prompt-warning }

#### Connected agent side

On the connected agent itself, you need to set up topics that handle the input/output variables. The key steps are:

1. Make the variable **global**
2. For inputs, tick **"External source can set the value"**
3. For outputs, tick **"External source can receive the value"**

The connected agent typically has two relevant topics: one with an `OnRecognizedIntent` trigger for standalone use, and one with an `OnRedirect` trigger that fires when the agent is called by another agent.

**Standalone topic** (handles the query when invoked directly):

```yaml
kind: AdaptiveDialog
modelDescription: What's my role
beginDialog:
  kind: OnRecognizedIntent
  id: main
  intent: {}
  actions:
    - kind: SetMultipleVariables
      id: setVariable_L7LrdA
      assignments:
        - variable: Global.userRole
          value: project management
        - variable: Topic.userRole
          value: project management

inputType: {}
outputType:
  properties:
    userRole:
      displayName: userRole
      type: String
```

**Redirect topic** (receives inputs when called by another agent):

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnRedirect
  id: main
  actions:
    - kind: SetVariable
      id: setVariable_vSrSNN
      variable: Global.userName
      value: "\"\""

inputType: {}
outputType:
  properties:
    userRole:
      displayName: userRole
      type: String
```

> Information passes from the connected agent back to the main agent via the **global variable** only. The `outputType` on the connected agent's topics is for making the output visible internally within the connected agent itself. You'll notice the standalone topic sets the value to both `Global.userRole` (which is what the main agent receives) and `Topic.userRole` (which makes the tool output visible to the connected agent's own orchestrator). Setting `Topic.userRole` is one approach, but there are others, for example, a dedicated topic that runs at the end of every plan and populates global variables from tool outputs.
{: .prompt-info }

---

*Have questions about agent orchestration patterns? Drop a comment below or reach out!*