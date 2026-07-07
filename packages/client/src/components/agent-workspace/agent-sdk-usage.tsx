import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import {
	Button,
	CodeContainer,
	cn,
	H4,
	Muted,
	Separator,
	toast,
} from "@semoss/ui/next";

interface AgentSdkUsageProps {
	workspaceId: string;
	workspaceName?: string;
	className?: string;
}

const buildReactSnippet = (workspaceId: string) =>
	`from genai_client.agents.langgraph_agent import SemossAgent

agent = SemossAgent.from_workspace(
    workspace_id="${workspaceId}",
    access_key="YOUR_ACCESS_KEY",
    secret_key="YOUR_SECRET_KEY",
    room_id="ROOM_ID",              # any room this agent should log to
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "hello"}]}
)
print(result["messages"][-1].content)
`;

const buildDeepSnippet = (workspaceId: string) =>
	`agent = SemossAgent.from_workspace(
    workspace_id="${workspaceId}",
    access_key="YOUR_ACCESS_KEY",
    secret_key="YOUR_SECRET_KEY",
    room_id="ROOM_ID",
    mode="deep",   # planning tool + virtual filesystem + subagents
)
`;

const INSTALL_SNIPPET =
	"pip install semoss langgraph langchain-mcp-adapters deepagents";

interface SnippetProps {
	language: string;
	code: string;
}

const SnippetBlock: React.FC<SnippetProps> = ({ language, code }) => {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Failed to copy");
		}
	};
	return (
		<div className="overflow-hidden rounded-md border border-border">
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				<span className="font-mono text-muted-foreground text-xs">
					{language}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleCopy}
					className="h-7 px-2 text-muted-foreground text-xs"
				>
					{copied ? (
						<>
							<CheckIcon className="size-3" />
							Copied
						</>
					) : (
						<>
							<CopyIcon className="size-3" />
							Copy
						</>
					)}
				</Button>
			</div>
			<div className="overflow-x-auto bg-muted/30">
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4 text-xs">
					{code}
				</CodeContainer>
			</div>
		</div>
	);
};

const Param: React.FC<{
	name: string;
	required?: boolean;
	children: React.ReactNode;
}> = ({ name, required, children }) => (
	<div className="grid grid-cols-[minmax(8rem,10rem)_1fr] items-baseline gap-3 text-sm">
		<div className="flex items-center gap-1.5">
			<code className="font-mono text-xs">{name}</code>
			{required ? (
				<span className="text-[10px] text-destructive uppercase tracking-wide">
					required
				</span>
			) : null}
		</div>
		<div className="text-muted-foreground text-sm leading-6">
			{children}
		</div>
	</div>
);

export const AgentSdkUsage: React.FC<AgentSdkUsageProps> = ({
	workspaceId,
	workspaceName,
	className,
}) => {
	if (!workspaceId) return null;
	const displayName = workspaceName || "this agent";

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div>
				<H4 className="font-semibold text-base tracking-tight">
					Programmatic access
				</H4>
				<Muted className="text-muted-foreground text-sm leading-6">
					Consume {displayName} from Python as a LangGraph{" "}
					<code className="font-mono text-xs">CompiledGraph</code>.
					The adapter reads this workspace's system prompt, MCPs, and
					subagents, so the settings on this page are the source of
					truth — updates take effect the next time your code builds
					the agent.
				</Muted>
			</div>

			<div className="flex flex-col gap-2">
				<span className="font-medium text-sm">1. Install</span>
				<SnippetBlock language="bash" code={INSTALL_SNIPPET} />
			</div>

			<div className="flex flex-col gap-2">
				<span className="font-medium text-sm">
					2. Build the agent (React mode — default)
				</span>
				<SnippetBlock
					language="python"
					code={buildReactSnippet(workspaceId)}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-baseline justify-between gap-3">
					<span className="font-medium text-sm">
						3. Deep mode (opt-in)
					</span>
					<span className="text-muted-foreground text-xs">
						planning tool + virtual filesystem + subagents
					</span>
				</div>
				<Muted className="text-muted-foreground text-xs leading-5">
					Deep mode routes construction through{" "}
					<code className="font-mono text-[11px]">deepagents</code>{" "}
					instead of the plain react agent — useful for long tasks
					that benefit from an internal task list and scratch memory.
					No workspace changes required; opt in at build time.
				</Muted>
				<SnippetBlock
					language="python"
					code={buildDeepSnippet(workspaceId)}
				/>
			</div>

			<Separator />

			<div className="flex flex-col gap-3">
				<span className="font-medium text-sm">Parameters</span>
				<div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
					<Param name="workspace_id" required>
						This workspace's id. Pre-filled above. The adapter uses
						it to fetch <code>GetWorkspace(...)</code> and any
						referenced subagent workspaces.
					</Param>
					<Param name="access_key" required>
						Your SEMOSS user access key. Combined with{" "}
						<code>secret_key</code> and <code>room_id</code> into a
						bearer token used to reach the workspace's MCP servers.
					</Param>
					<Param name="secret_key" required>
						Your SEMOSS user secret key.
					</Param>
					<Param name="room_id" required>
						A room id the run should log against. Use any active
						room the caller has access to. MCP calls made by the
						agent are scoped to this room.
					</Param>
					<Param name="mode">
						<code>"react"</code> (default) builds via{" "}
						<code>create_react_agent</code>. <code>"deep"</code>{" "}
						builds via <code>deepagents.create_deep_agent</code> and
						adds a planning tool, virtual filesystem, and subagent
						routing. Can also be set via{" "}
						<code>CONFIG_JSON.mode</code> on the workspace.
					</Param>
					<Param name="model">
						Override the model used for this run. Accepts a{" "}
						<code>ModelEngine</code>, a LangChain{" "}
						<code>BaseChatModel</code>, or a model engine id string.
						Defaults to whatever the workspace has configured.
					</Param>
					<Param name="max_subagent_depth">
						Depth cap for nested subagent delegation (default{" "}
						<code>1</code>). Mirrors{" "}
						<code>AgentConfig.SubAgentSpawnPolicy</code> on the
						harness side.
					</Param>
					<Param name="pixel_loader">
						Advanced: swap the default in-SEMOSS pixel loader for an
						external REST-backed loader if you're consuming this
						workspace from Python code that runs outside SEMOSS.
					</Param>
				</div>
			</div>

			<div className="rounded-md border border-border bg-muted/30 p-3">
				<Muted className="text-muted-foreground text-xs leading-5">
					The returned <code>CompiledGraph</code> supports the full
					LangGraph API — <code>.invoke</code>, <code>.stream</code>,{" "}
					<code>.get_state</code>, composition, LangSmith tracing. You
					can wire it into LangGraph Studio for visual debugging by
					pointing at the same construction call from your{" "}
					<code>langgraph.json</code>.
				</Muted>
			</div>
		</div>
	);
};
