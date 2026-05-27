import { Copy } from "lucide-react";
import { Env } from "@semoss/sdk/react";
import { Button, H4, Markdown, P, toast } from "@semoss/ui/next";

export const getMcpUsage = (id, name = "backend-mcp") => {
	const mcpUrl = `${window.location.origin}${Env.MODULE}/api/ext/mcp/${id}/comms`;
	const mcpKey =
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "backend-mcp";

	return [
		{
			Label: "VS Code (MCP Integration)",
			usage: [
				"Install an MCP-compatible extension in VS Code (like Continue or similar)",
				"Open the extension settings and add a new MCP server",
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Save settings and reload VS Code",
				"You can now use MCP tools directly inside VS Code",
			],
			code:
				'```json\n{\n  "name": "' +
				mcpKey +
				'",\n  "command": "npx",\n  "args": [\n    "mcp-remote",\n     "' +
				mcpUrl +
				'",\n    "--header",\n    "Authorization:Bearer <ACCESS_KEY>:<SECRET_KEY>"\n  ]\n}\n```',
		},
		{
			Label: "Claude Desktop (MCP Server Connection)",
			usage: [
				"Open Claude Desktop settings",
				"Go to Developer or MCP Servers section",
				"Add a new MCP server configuration",
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Restart Claude to load the MCP tools",
			],
			code:
				'```json\n{\n  "mcpServers": {\n    "' +
				mcpKey +
				'": {\n      "command": "npx",\n      "args": [\n        "mcp-remote",\n        "' +
				mcpUrl +
				'",\n        "--header",\n        "Authorization:Bearer <ACCESS_KEY>:<SECRET_KEY>"\n      ]\n    }\n  }\n}\n```',
		},
		{
			Label: "Claude with custom backend and MCP (Best for AI Tooling)",
			description:
				"Use Claude through the Anthropic API with your own backend acting as a bridge to the MCP server. This gives you full control over authentication, logging, and which MCP tools Claude is allowed to use.",
			usage: [
				"Use Claude via the Anthropic API instead of Claude Desktop",
				"Define MCP tools in your backend as callable functions",
				"When Claude requests a tool, your backend calls the MCP server",
				"Replace <ACCESS_KEY>:<SECRET_KEY> in the MCP URL",
				"Return the MCP response back to Claude as the tool result",
				"This setup is ideal for production AI applications",
			],
			code:
				'```javascript\n// Example: Claude tool handler calling MCP\nimport fetch from "node-fetch";\n\nconst MCP_URL = "' +
				mcpUrl +
				'";\n\nexport async function callMcpTool() {\n  const res = await fetch(MCP_URL, {\n    method: "POST",\n    headers: {\n      "Authorization": "Bearer <ACCESS_KEY>:<SECRET_KEY>",\n      "Content-Type": "application/json"\n    },\n    body: JSON.stringify({\n      jsonrpc: "2.0",\n      id: 1,\n      method: "tools/list",\n      params: {}\n    })\n  });\n\n  return await res.json();\n}\n```',
		},
		{
			Label: "OpenAI Codex / CLI Tools (MCP Connection)",
			usage: [
				"Ensure Node.js is installed",
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Run this before starting your Codex-based workflow",
				"This allows Codex tools to communicate with your MCP server",
			],
			code:
				'```bash\nnpx mcp-remote \\\n  "' +
				mcpUrl +
				'" \\\n  --header "Authorization: Bearer <ACCESS_KEY>:<SECRET_KEY>"\n```',
		},
		{
			Label: "Terminal Command (npx mcp-remote)",
			usage: [
				"Make sure Node.js (v18+) is installed",
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Run this command in your terminal",
				"This connects your local tool directly to the MCP server",
			],
			code:
				'```bash\nnpx mcp-remote \\\n  "' +
				mcpUrl +
				'"  \\\n  --header "Authorization: Bearer <ACCESS_KEY>:<SECRET_KEY>"\n```',
		},
		{
			Label: "cURL Command (Manual MCP JSON-RPC Request)",
			usage: [
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Run in Terminal or Command Prompt",
				"If successful, you will receive a JSON response containing MCP tools",
				"If you see 401 or 403, verify your credentials",
				"If you see connection errors, verify the server URL",
			],
			code:
				'```bash\ncurl -X POST \\\n  "' +
				mcpUrl +
				'" \\\n  -H "Authorization: Bearer <ACCESS_KEY>:<SECRET_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "jsonrpc": "2.0",\n    "id": 1,\n    "method": "tools/list",\n    "params": {}\n  }\'\n```',
		},
		{
			Label: "JavaScript (Node.js — fetch / axios)",
			usage: [
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Use fetch (Node 18+) or axios (older Node versions)",
				"Install axios if needed: npm install axios",
				"Use inside backend services or scripts",
				"Ideal when MCP is part of a JS application workflow",
			],
			code:
				'```javascript\n// Using fetch (Node 18+)\nconst url = "' +
				mcpUrl +
				'";\n\nawait fetch(url, {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer <ACCESS_KEY>:<SECRET_KEY>",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    jsonrpc: "2.0",\n    id: 1,\n    method: "tools/list",\n    params: {}\n  })\n});\n\n// OR using axios\nimport axios from "axios";\n\nawait axios.post(\n  url,\n  {\n    jsonrpc: "2.0",\n    id: 1,\n    method: "tools/list",\n    params: {}\n  },\n  {\n    headers: {\n      Authorization: "Bearer <ACCESS_KEY>:<SECRET_KEY>"\n    }\n  }\n);\n```',
		},
		{
			Label: "Python (requests)",
			usage: [
				"Install requests: pip install requests",
				"Replace <ACCESS_KEY>:<SECRET_KEY>",
				"Run as a Python script or backend service",
				"Run the script using 'python filename.py'",
				"If successful, the MCP response JSON will be printed or returned",
				"You can integrate this into backend services or automation scripts",
			],
			code:
				'```python\nimport requests\n\nurl = "' +
				mcpUrl +
				'"\n\nheaders = {\n    "Authorization": "Bearer <ACCESS_KEY>:<SECRET_KEY>",\n    "Content-Type": "application/json"\n}\n\npayload = {\n    "jsonrpc": "2.0",\n    "id": 1,\n    "method": "tools/list",\n    "params": {}\n}\n\nrequests.post(url, json=payload, headers=headers)\n```',
		},
	];
};

export const McpUsage = ({ id, name }: { id: string; name?: string }) => {
	const usageData = getMcpUsage(id, name);

	const copyCode = (text: string) => {
		const cleanCode = text.replace(/```[a-z]*\n|```/g, "");
		navigator.clipboard.writeText(cleanCode);
		toast.success("Successfully copied to clipboard");
	};
	return (
		<div className="space-y-4 md:space-y-6">
			{usageData.map((item) => (
				<div
					key={item.Label}
					className="rounded-2xl border border-base p-4 shadow-xs md:p-6"
				>
					<div className="grid gap-4 md:grid-cols-2 md:gap-8">
						{/* LEFT SIDE */}
						<div>
							<H4 data-testid={`mcp-usage-title-${item.Label}`}>
								{item.Label}
							</H4>

							{item.description && (
								<P
									data-testid={`mcp-usage-description-${item.Label}`}
								>
									{item.description}
								</P>
							)}

							<ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700 text-sm">
								{item.usage.map((point) => (
									<li
										data-testid={`mcp-usage-point-${item.Label}-${point}`}
										key={point}
									>
										{point}
									</li>
								))}
							</ul>
						</div>

						{/* RIGHT SIDE */}
						<div className="min-w-0 overflow-hidden rounded-xl border border-base shadow-xs">
							<div className="flex items-center justify-end border-border border-b bg-gray-100 px-2 py-1">
								<Button
									aria-label="copy"
									color="default"
									variant="ghost"
									size="icon-sm"
									type="button"
									data-testid={`mcp-usage-copy-button-${item.Label}`}
									onClick={() => copyCode(item.code)}
								>
									<Copy className="size-3.5" />
								</Button>
							</div>
							<Markdown
								components={{
									pre: ({ children }) => (
										<div className="max-h-64 overflow-x-auto overflow-y-auto bg-gray-50 p-4 text-sm">
											{children}
										</div>
									),
									code: ({ children }) => (
										<code className="block whitespace-pre font-mono text-xs leading-relaxed">
											{children}
										</code>
									),
								}}
							>
								{item.code}
							</Markdown>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
