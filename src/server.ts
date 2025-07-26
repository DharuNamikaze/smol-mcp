import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { promises as fs } from 'node:fs'
import { callbackify } from "node:util";

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

server.tool("create-schema", "This tool will create a schema",
    { uid: z.string(), name: z.string(), email: z.string().email(), ph: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits") },
    { title: "Create User", destructiveHint: false, openWorldHint: true },
    // above we can have readOnlyHint: false also idempotentHint:false
    // create is not gona be readonly and it's gonna create the same data for all the user 
    // but we didnt because the default value is false for both
    // openworldHint is true because we are gonna touch outside our local codebase ex:mongo,firestore
    // also these annotations are optional we dont have to explicitly do it but yeah we are building somethng!
    async (params) => {
        try {
            const id = await createUser(params)
            return {
                content: [
                    { type: "text", text: `User ${id} got created successfully!` }
                ]
            }
        } catch {
            return {
                content: [{ type: "text", text: "User can\'t be created! we got error at our side" }]
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
        }).then(val => val.default)

        saveUsers.push({ ...params })
        fs.writeFile("./src/data/data.json", JSON.stringify(saveUsers, null, 2))
        return params.uid;
    } catch {
        throw new Error("Error bro, i think that's enough info. good luck.")
    }

}
main()