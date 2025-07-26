# Introduction

This is a Locally running naive MCP Server built using `Typescript-sdk` from the official documentation.

First things first,
Run this command to install the SDK for `Typescript` to get started
```
npm install @modelcontextprotocol/sdk
```

>⚠️ Make sure that MCP requires Node.js v18.x or higher to work fine.

#### Quick Start
Run the server by the follwing command:

```
npm run server:inspect
```
we are using mcp-inspector for a reason which we'll see it later.

In this project we are currently utilizing `StdioServerTransport` as a Transport layer between the AI application and our MCP Server.


### Understanding the MCP Server syntax

We are creating a new object `McpServer()` where we must include the `name, version, title, blah...`

the main game is in the capabilities  of the server which we takes three arguments `resources`,`tools`,`prompts`

#### Resource