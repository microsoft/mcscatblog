---
layout: post
title: "Using MCP Resources in Copilot Studio"
date: 2025-10-29
categories: [copilot-studio, mcp, agents]
tags: [model-context-protocol, resources, tools, search, enterprise-patterns]
author: adilei
---

# Resources in MCP: How Copilot Studio Uses Them

If you're building MCP (Model Context Protocol) servers for Copilot Studio, here's something important to understand: Copilot Studio's orchestrator always lists MCP resources through tools, **never directly**. 

This is an architectural choice in Copilot Studio's implementation that makes sense for enterprise environments with large-scale resource catalogs.

## How Copilot Studio Lists Resources

Here's the flow in Copilot Studio:

1. **Discovery through tools**: The agent calls `tools/call` to invoke a tool that returns resources
2. **Tool returns resources**: The tool can return either:
   - **[Resource links](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#resource-links)** (`resource_link`): References that the agent can read via `resources/read` requests
   - **[Embedded resources](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#embedded-resources)** (`resource`): Full content delivered immediately in the tool response
3. **Reading resources** (for resource links): The agent can send `resources/read` requests to fetch resource content
4. **Response generation**: The agent uses the retrieved information to generate its response

This design enables scalability—imagine a documentation system with 10,000 articles. The agent doesn't enumerate all 10,000; it searches for **why do penguins waddle** and gets back 5 relevant references.

> **Note:** The MCP protocol itself supports direct resource enumeration through `resources/list` and clients can call this directly. However, Copilot Studio's orchestrator architecture is designed to use tool-based discovery for resource access. Other MCP clients may implement resource access differently.
{: .prompt-info }

## The Biological Species Sample

The new [search-species-resources-typescript](https://github.com/microsoft/CopilotStudioSamples/tree/main/MCPSamples/search-species-resources-typescript) sample demonstrates this pattern with a practical example. It provides information about animal species through search-based discovery.

**What's in the sample:**
- 5 species (African Elephant, Monarch Butterfly, Great White Shark, Red Panda, Blue Whale)
- 8 total resources (5 text overviews + 3 images)
- Two tools: `searchSpeciesData` (fuzzy search) and `listSpecies` (simple listing)

### How It Works

**1. Define Your Resources**

Resources are dynamically generated from a species database:

```typescript
// Species data with details
export const SPECIES_DATA: Species[] = [
  {
    id: "monarch-butterfly",
    commonName: "Monarch Butterfly",
    scientificName: "Danaus plexippus",
    description: "Famous for its distinctive orange and black wing pattern...",
    habitat: "North America, with migration routes...",
    diet: "Larvae feed on milkweed; adults feed on nectar",
    conservationStatus: "Vulnerable",
    interestingFacts: [...],
    tags: ["insect", "butterfly", "migration"],
    image: encodeImage("butterfly.png")
  },
  // ... more species
];

// Resources generated from species data
export const RESOURCES: SpeciesResource[] = SPECIES_DATA.flatMap(species => {
  const resources = [
    {
      uri: `species:///${species.id}/info`,
      name: `${species.commonName} - Species Overview`,
      description: `Detailed information about the ${species.commonName}`,
      mimeType: "text/plain",
      speciesId: species.id,
      resourceType: "text"
    }
  ];

  // Add image resource if available
  if (species.image) {
    resources.push({
      uri: `species:///${species.id}/image`,
      name: `${species.commonName} - Photo`,
      mimeType: "image/png",
      speciesId: species.id,
      resourceType: "image"
    });
  }

  return resources;
});
```

This generates 8 resources from 5 species (5 text overviews + 3 images).

**2. Implement Search Tool**

The `searchSpeciesData` tool uses Fuse.js for fuzzy matching and returns `resource_link` references (rather than embedded resources).

When Copilot Studio calls your tool (via `tools/call` request), your handler responds with resource links:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "searchSpeciesData") {
    const searchResults = fuse.search(searchTerms);
    const topResults = searchResults.slice(0, 5);

    // Return resource references, not full content
    const content = [
      {
        type: "text",
        text: `Found ${topResults.length} resources matching "${searchTerms}"`
      }
    ];

    topResults.forEach(result => {
      content.push({
        type: "resource_link",
        uri: result.item.uri,
        name: result.item.name,
        description: result.item.description,
        mimeType: result.item.mimeType,
        annotations: {
          audience: ["assistant"],
          priority: 0.8
        }
      });
    });

    return { content };
  }
});
```

**3. Handle Resource Reads**

When the agent sends `resources/read` requests, your server provides the full content:

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const resource = RESOURCES.find(r => r.uri === uri);
  const species = SPECIES_DATA.find(s => s.id === resource.speciesId);

  if (resource.resourceType === 'text') {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: formatSpeciesText(species)
      }]
    };
  }

  if (resource.resourceType === 'image') {
    return {
      contents: [{
        uri,
        mimeType: "image/png",
        blob: species.image  // Base64-encoded PNG
      }]
    };
  }
});
```

## Quickstart with Copilot Studio

To get started quickly:

1. **Clone the repository**
   ```bash
   git clone https://github.com/microsoft/CopilotStudioSamples.git
   cd CopilotStudioSamples/MCPSamples/search-species-resources-typescript
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

4. **Create a public dev tunnel** for port 3000

5. **Configure in Copilot Studio** under Tools → + Add a tool → + New Tool → Model Context Protocol

> **Important URL Format**: Use `https://abc123-3000.devtunnels.ms/mcp` (port in hostname with hyphen), not `https://abc123.devtunnels.ms:3000/mcp`. The wrong format will cause connection failures.
{: .prompt-warning }

The sample includes detailed instructions for dev tunnel setup and deployment options in the README.

## How It Works in Copilot Studio

Let's walk through a real example of how the agent uses resources to answer questions.

**User asks**: "Tell me about the Blue Whale"

The agent:
1. Calls `searchSpeciesData("blue whale")` tool
2. Receives resource links for two resources: Blue Whale text overview and photo
3. Reads both resources via `resources/read` requests
4. Generates a response combining information from the text resource and displays the image

The response includes details about habitat, diet, conservation status, and interesting facts, along with a photo of the blue whale.

![Blue Whale Response](/assets/posts/mcp-tools-resources/blue-whale.png){: .shadow w="972" h="589" }
_Agent provides comprehensive information from text resource with embedded image from image resource_

**User asks**: "What does the Red Panda look like?"

Following the same pattern:
1. Agent calls `searchSpeciesData("red panda")`
2. Receives resource links for both text and image resources
3. Selects and reads resources via `resources/read`
4. Provides a detailed visual description based on the image that was returned from the server

![Red Panda Search](/assets/posts/mcp-tools-resources/red-panda.png){: .shadow w="972" h="589" }
_Agent selects the appropriate resource (image) from the links and provides a detailed description_

## Key Takeaways

1. **Resources need tool-based discovery**: Copilot Studio won't enumerate resources directly. Tools provide filtered references or content
2. **Tools can return references or content**: Use `resource_link` for lazy loading or embedded `resource` for immediate delivery
3. **The agent uses resources to inform responses**: It determines which resource content is relevant to answering the user's question
4. **The pattern scales**: Works for 5 resources or 50,000

## Important Note: Resource Pre-Registration Not Required

If you check Copilot Studio's UI under Tools → Resources, you might see only 5 resources listed, or even an error message about limiting resources. **Don't worry—this isn't a problem when using `resource_link` in your tools.**

![Resource Limit Display](/assets/posts/mcp-tools-resources/resources-list.png){: .shadow w="972" h="589" }
_Copilot Studio UI shows a limitation, but this doesn't affect resource_link functionality_

Here's why: when your tool returns a `resource_link`, the agent can request that resource via `resources/read` even if it was never listed in a `resources/list` response. According to the [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#resource-links):

> Resource links returned by tools are not guaranteed to appear in the results of a resources/list request.

This means you can:
- Generate resource URIs dynamically based on search results
- Return links to resources that don't exist until they're requested
- Scale to large numbers of potential resources without listing them all

## Try It Yourself

Clone the [search-species-resources-typescript sample](https://github.com/microsoft/CopilotStudioSamples/tree/main/MCPSamples/search-species-resources-typescript) and experiment with your Copilot Studio agent. Try:

---

*Have you used MCP resources for Copilot Studio? What discovery patterns are you using? Share your experiences in the comments!*