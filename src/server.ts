import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { promises as fs } from 'node:fs'
import axios from "axios";

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

server.tool(
    "Generate-Onboarding-Email",
    "Generates a personalized onboarding email for a user",
    {
        name: z.string(),
        role: z.enum(["developer", "designer", "manager", "founder", "student"]),
        tone: z.enum(["casual", "formal", "witty", "inspirational"]).default("casual"),
    },
    {
        title: "Generate Email",
        openWorldHint: false,
    },
    async ({ name, role, tone }) => {

        const emailTemplate = `
Hi ${name},

Welcome aboard! As a ${role}, you're going to love what we’ve built.

Let’s make this journey ${tone === "witty" ? "less boring and more thrilling" :
                tone === "inspirational" ? "an adventure worth remembering" :
                    tone === "formal" ? "professional and efficient" :
                        "smooth and enjoyable"}.

Cheers,  
The Smol-MCP Team 🚀
    `.trim();

        return {
            content: [
                { type: "text", text: emailTemplate }
            ]
        };
    }
);

//get leetcode data retrival tool
server.tool("GetLeetcodeData", "This tool gets your leetcode total problems solved data ", { username: z.string().toLowerCase() },
    { title: "Create User", destructiveHint: false, openWorldHint: true },
    async (params) => {
        const Leetcodestats = async (param: string) => {
            try {
                const response = await axios.post('https://leetcode.com/graphql', {
                    query: `
                    query userProblemsSolved($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            problemsSolvedBeatsStats {
                                difficulty
                                percentage
                            }
                            submitStatsGlobal {
                                acSubmissionNum {
                                    difficulty
                                    count
                                }
                            }
                        }
                    }
                `,
                    variables: { "username": `${param}` },
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                });
                if (!response || !response.data) throw new Error('No response from Leetcode');
                return response.data;
            }
            catch (error: unknown) {
                console.log(error, "error fetching itself bro")
                throw error;
            }
        }

        try {
            const data = await Leetcodestats(params.username);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(data, null, 2),
                        mimeType: "application/json"
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching Leetcode data: ${error}`,
                        mimeType: "text/plain"
                    }
                ]
            }
        }
    })

// Google Scholar profile data retrieval tool
server.tool("GoogleScholar-Data", "This tool fetches public Google Scholar profile data given a profile ID or URL", { profile: z.string() },
    { title: "Get Google Scholar Data", destructiveHint: false, openWorldHint: true },
    async (params) => {
        const scholarIdRegex = /user=([a-zA-Z0-9_-]+)/;
        let profileId = params.profile;
        // Extract user ID if a full URL is given
        const match = params.profile.match(scholarIdRegex);
        if (match) profileId = match[1];
        const url = `https://scholar.google.com/citations?user=${profileId}`;
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                }
            });
            const html = response.data;
            // Basic scraping for name, affiliation, citation count, h-index, i10-index
            const nameMatch = html.match(/<div id="gsc_prf_in">([^<]+)<\/div>/);
            const affiliationMatch = html.match(/<div class="gsc_prf_il">([^<]+)<\/div>/);
            const citationMatch = html.match(/<td class="gsc_rsb_std">(\d+)<\/td>/g);
            const hIndexMatch = html.match(/<td class="gsc_rsb_std">\d+<\/td>\s*<td class="gsc_rsb_std">(\d+)<\/td>/);
            const i10IndexMatch = html.match(/<td class="gsc_rsb_std">\d+<\/td>\s*<td class="gsc_rsb_std">\d+<\/td>\s*<td class="gsc_rsb_std">(\d+)<\/td>/);
            const data = {
                name: nameMatch ? nameMatch[1] : null,
                affiliation: affiliationMatch ? affiliationMatch[1] : null,
                totalCitations: citationMatch ? citationMatch[0].replace(/\D/g, "") : null,
                hIndex: hIndexMatch ? hIndexMatch[1] : null,
                i10Index: i10IndexMatch ? i10IndexMatch[1] : null,
                profileUrl: url
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(data, null, 2),
                        mimeType: "application/json"
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching Google Scholar data: ${error}`,
                        mimeType: "text/plain"
                    }
                ]
            }
        }
    })

// gettlocaluser resource 
server.resource("Get-LocalUsers", "local://users",
    {
        description: "Retrieve all local users from data.json",
        title: "Local Users",
        mimeType: "application/json",
    },

    // now we are just providng  some context/data/resource to the ai model when accessed.
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

server.tool("Create-User", "This tool will create a user and stores locally",

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

server.tool("Delete-User", "Tool to delete users in the local storage", {
    user: z.string(),
}, { title: "Delete-User", readOnlyHint: false, destructiveHint: true },
    async (params) => {
        const DeleteUser = () => {
            const user = params.user;

        }
        
        return {
            content: [
                { type: 'text', text: `The user ${params.user} deleted successfully` }
            ]
        }
    })
// server.tool("fetch-repos", "This tool fetches the desired github repo",
//     {}, {} async (params) => {

//     })
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
        return params.uid
    } catch {
        throw new Error("Error bro, i think that's enough info. good luck.")
    }
}

main()