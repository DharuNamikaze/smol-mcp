import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { promises as fs } from 'node:fs'

const server = new McpServer({
    name: 'smol-mcp',
    version: '1.0.0',
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport)
}

server.resource("GetLocalUsers", "local://users",
    {
        description: "Retrieve all local users from data.json",
        title: "Local Users",
        mimeType: "application/json",
    },
    // same arguements, we are just giving some context/data/resource to the ai model that access this server
    async uri => {
        const users = await import("./data/data.json", { with: { type: "json" } }).then(user => user.default)
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(users),
                    mimeType: "application/json",
                },
            ],
        }
    })


// server tool takes 3 to 5 arguements
// (name: string, description: string, paramsSchema: Args, annotations: ToolAnnotations, callback: ToolCallback<Args>): RegisteredTool

server.tool("create-schema", "This tool will create a schema",

    { uid: z.string(), name: z.string(), email: z.string().email(), ph: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits") },
    { title: "Create User", destructiveHint: false, openWorldHint: true },
    // annotations: ToolAnnotations, these are optional but for learning we are adding it.
    // above we can have readOnlyHint: false and idempotentHint:false
    // but we didnt write it explicitly because the default value is false for both
    // openworldHint:true because we are gonna touch outside our local codebase ex:mongo,firestore
    async (params) => {
        try {
            const id = await createUser(params)
            // the actual core of the tool
            return {
                content: [
                    { type: "text", text: `User ${id} got created successfully!` }
                    // this returns some context to the llm about what happened when it called the tool
                ]
            }
        } catch {
            return {
                content: [{ type: "text", text: "User can\'t be created! we got error at our side" }],
            }
        }
    }

)
async function createUser(params: {
    uid: string,
    name: string,
    email: string,
    ph: string,
}) {
    try {
        const saveUsers = await import("./data/data.json", {
            with: { type: "json" }
        }).then(val => val.default);
        saveUsers.push({ ...params });
        fs.writeFile("./src/data/data.json", JSON.stringify(saveUsers, null, 2))
        return params.uid;
    } catch {
        throw new Error("Error bro, i think that's enough info. good luck.")
    }
}


main()