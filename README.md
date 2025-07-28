# Introduction

This is a Locally running naive MCP Server built using `Typescript-sdk` from the official documentation.

First things first,
Run this command to install the SDK for `Typescript` to get started

```
npm install @modelcontextprotocol/sdk
```

> ⚠️ Make sure that MCP requires Node.js v18.x or higher to work fine.

#### Quick Start

Run the server by the follwing command:

```
npm run server:inspect
```

we are using mcp-inspector for a reason which we'll see it later.

In this project we are currently utilizing `StdioServerTransport` as a Transport layer between the AI application and our MCP Server.

### Understanding the MCP Server syntax

We are the `McpServer()` class takes `name, version, title, blah...`

the game is in the capabilities of the server which takes three main arguments `resources`,`tools`,`prompts`

so coming to the build, we can use vscode to create

![alt text](/public/addserver.png)

go to the cmd palette -> search for >mcp:add server

![alt text](/public/addserver2.png)

select stdio as we are currently using it

![alt text](/public/addserver3.png)

Enter the configured build command

![alt text](/public/addserver4.png)

Enter a name for the server

now let's configure the local mcp build (your_mcp.json)

![alt text](/public/buildjson.png)

change it to your configuration or take a refernce here

### Final Steps to see if the tool is actually working

1. Click the restart to start the server running

2. The output window aside terminal shows the entire conversation between our server and any client
3. Mention the server file `#your_mcp.json` and the tool `#your_tool`to copilot and tada!🎉💃

![alt text](/public/tooloutput.png)