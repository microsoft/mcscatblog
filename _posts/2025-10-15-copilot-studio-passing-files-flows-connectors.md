---
layout: post
title: "Tutorial: Passing Files from Copilot Studio to Agent Flows, Connectors and Tools"
date: 2025-10-15
categories: [copilot-studio, tutorial, integration]
tags: [agent-flows, power-automate, connectors, tools, file-handling]
author: raemone
---

# Passing Files from Copilot Studio to Agent Flows, Connectors and Tools

Passing files from your Microsoft Copilot Studio (MCS) agent to downstream systems using Agent Flows (or Power Automate) and connectors/tools (e.g., Outlook, ServiceNow) unlocks powerful automation scenarios such as ticket creation with attachments, document processing, and more. The version 2025.7.2 of Copilot Studio FINALLY unlocks this possibility - but you need to know how to use it! Here's a simple step-by-step guide to help you leverage this new powerful feature.

Let's dive in!

## Check Your Version First

In order to use this new feature, your environment needs to be running version **2025.7.2.xxxx** or higher. To check your Copilot Studio version, simply look at the session details in your agent interface.

> Older versions will simply raise an error when passing the file to a Flow if you try this configuration.
{: .prompt-warning }

![version validation](/assets/posts/copilot-studio-passing-files-flows-connectors/version.png){: .shadow w="700" h="400"}
_Validate your version_

## Requesting Files from Users

First, create a new topic to retrieve the user's file. Add a **Question node** in your topic, set the entity to **File**, and check the box **Include file metadata** (under Entity recognition). This ensures the bot collects both the file and its metadata (name, content type, content).

![include file metadata](/assets/posts/copilot-studio-passing-files-flows-connectors/include-file-metadata.png){: .shadow w="700" h="400"}
_Make sure to check "Include file metadata"_

### Alternative Approach

You can use `First(System.Activity.Attachments)` to check if a file is already attached (e.g., from a Teams conversation). If not, prompt the user to upload a file as described above.

![alternative approach](/assets/posts/copilot-studio-passing-files-flows-connectors/alternative.png){: .shadow w="700" h="400"}
_Another way to capture a file without prompting the user with a question node_

The Power FX to capture the file from the Activity.Attachments is:

```text
First(System.Activity.Attachments)
```

## Passing Files to Power Automate Flows

Create a new **Agent Flow node** after your file question. In your Flow, add an input parameter of type **File** (e.g., `inputFile`). This variable will receive the file from Copilot Studio.

![alternative approach](/assets/posts/copilot-studio-passing-files-flows-connectors/agent-flow.png){: .shadow w="700" h="400"}
_File input in Agent Flow_

You can add logic in your flow to send this file to SharePoint, ServiceNow, D365 Customer Service, etc. Add your newly created flow to your topic and pass the variable using this Power FX formula:

```text
{ contentBytes: Topic.userReceipt.Content, name: Topic.userReceipt.Name }
```

![alternative approach](/assets/posts/copilot-studio-passing-files-flows-connectors/agent-flow-formula.png){: .shadow w="700" h="400"}
_You need to use a Power FX formula to pass the file with its metadata_

And that's it! You can now pass a file to an Agent Flow (same for Power Automate) and pass this file to all the connectors available in your Flow (ServiceNow, Outlook, SharePoint, etc).

![alternative approach](/assets/posts/copilot-studio-passing-files-flows-connectors/agent-flow-result.png){: .shadow w="700" h="400"}
_My agent was able to send a PDF to an Agent Flow which returned its name as an output_

## Passing Files to Connectors

The same principle applies to passing files to connectors by sending `Topic.File.Content` where the file base64 is required. This is supported in all connectors.

> Some connectors have particular requirements to wrap "File" inputs. For example, the "Send an email (V2)" connector has an Attachments input that is a Table of records with `contentBytes` and `name` keys.
{: .prompt-info }

![alternative approach](/assets/posts/copilot-studio-passing-files-flows-connectors/pass-file-connector.png){: .shadow w="700" h="400"}
_Passing file to a connector / action._

The attachments object uses the same pattern:

```text
{ contentBytes: Topic.File.Content, Name: Topic.File.Name }
```

## Passing Files to Tools

File inputs only work on the Tools page when set as a Power FX formula via the **"Custom value"** option (not "Dynamically fill with AI"). Use `System.Activity.Attachments` to fill the value with a formula that matches the connector input.

![alternative approach](/assets/posts/copilot-studio-passing-files-flows-connectors/pass-file-tool.png){: .shadow w="700" h="400"}
_Passing a file to a tool via custom value_

Here is the Power FX formula for this example:

```text
If(
    IsEmpty(System.Activity.Attachments), 
    [], 
    [{ contentBytes: First(System.Activity.Attachments).Content, name: First(System.Activity.Attachments).Name }]
)
```

## Summary Checklist

When you want to pass a file to a Flow or a connector/tool:

1. **Prompt the user for file** (using the question node with File entity, don't forget to check "include metadata" in the entity recognition menu) or retrieve it from the activity attachment variable
2. **Pass file as `{ contentBytes, Name }`** to connectors and flows
3. **Use `base64ToBinary()`** in your Flow if needed (some actions still require binary content)

## Key Takeaways

With version 2025.7.2, Copilot Studio agents can finally pass files to Power Automate Flows (aka Agent Flows) and connectors! This unlocks many use cases like:

- Attaching files to ServiceNow tickets
- Sending email attachments via Outlook
- Uploading documents to SharePoint
- Creating Dynamics 365 records with attachments
- Processing documents in custom workflows

The key is understanding the proper Power FX syntax and ensuring your environment is running the compatible version.

---

*What will you build with this new feature? Have questions about file handling in Copilot Studio? Drop a comment below or reach out!*

---

**Originally published on [LinkedIn](https://www.linkedin.com/pulse/tutorial-passing-files-from-copilot-studio-agent-flow-r%C3%A9mi-dyon-hx3be/)**