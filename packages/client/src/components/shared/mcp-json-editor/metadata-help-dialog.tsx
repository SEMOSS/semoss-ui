import { CheckCircle2, Copy, HelpCircle, Info } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

type MetaKeyDoc = {
	key: string;
	type: string;
	desc: string;
};

// Top-level `_meta` keys (siblings of `SMSS_MCP_UI`). `SMSS_MCP_EXECUTION`
// controls when the tool runs; see response-message.store.ts and tool.store.ts.
const META_TOP_LEVEL_KEYS: MetaKeyDoc[] = [
	{
		key: "SMSS_MCP_EXECUTION",
		type: '"auto" | "ask" | "yesno" | "disabled"',
		desc: "When the tool runs: auto runs it automatically, ask prompts for approval first, yesno prompts for a quick approve/reject decision, disabled prevents it from running. Defaults to ask.",
	},
	{
		key: "SMSS_FUNCTION_NAME",
		type: "string",
		desc: "Name of the backing implementation the tool calls, e.g. the Python function or the Pixel reactor. Without it the tool has nothing to execute.",
	},
];

// Documents the metadata keys the playground actually reads off a tool's
// `_meta`. `SMSS_MCP_UI` controls how the tool surfaces in chat; see
// response-message-tool.tsx, tools-view.tsx and tool.store.ts for consumers.
const META_UI_KEYS: MetaKeyDoc[] = [
	{
		key: "loadingMessage",
		type: "string",
		desc: 'Message shown while the tool runs, e.g. "Loading...". Omit it and the chat cycles through its generic messages instead.',
	},
	{
		key: "displayLocation",
		type: '"sidebar" | "inline" | "hidden"',
		desc: "Where the tool's result/UI renders in the chat. Defaults to sidebar.",
	},
	{
		key: "resourceURI",
		type: "string",
		desc: 'Path to a custom portal page to render as the tool\'s UI, e.g. "/my-portal/page". Requires displayLocation other than hidden.',
	},
	{
		key: "autoOpen",
		type: "boolean",
		desc: "Open the tool's UI automatically when it runs. Defaults to false.",
	},
];

const METADATA_EXAMPLE = `{
  "SMSS_MCP_EXECUTION": "ask",           // auto | ask | yesno | disabled
  "SMSS_FUNCTION_NAME": "my_tool",
  "SMSS_MCP_UI": {
    "loadingMessage": "Loading...",
    "displayLocation": "sidebar",        // inline | sidebar | hidden
    "resourceURI": "/my-portal/page",
    "autoOpen": false                    // true | false
  }
}`;

// Mirrors the JSON above, but persisted from the tool's Python source so the
// metadata survives regeneration. `execution` maps to SMSS_MCP_EXECUTION; the
// remaining keys map into SMSS_MCP_UI.
const METADATA_PYTHON_EXAMPLE = `import smssutil

@smssutil.mcp_metadata({
    "execution": "ask",              # auto | ask | yesno | disabled
    "displayLocation": "sidebar",    # inline | sidebar | hidden
    "loadingMessage": "Loading...",
    "resourceURI": "tools/my-tool/index.html"
})
def my_tool(query: str) -> str:
    """Run my tool."""
    return "ok"`;

// Same metadata from a custom Java reactor: override getMcpToolMetadata() and
// use the MCPUtility constants/enums so the keys stay in sync with the backend.
const METADATA_JAVA_EXAMPLE = `import prerna.reactor.agent.mcp.MCPUtility;

@Override
public Map<String, String> getMcpToolMetadata() {
    Map<String, String> meta = new HashMap<>();
    meta.put(MCPUtility.SMSS_MCP_EXECUTION, MCPUtility.MCPExecution.ASK.getValue()); // auto | ask | yesno | disabled
    meta.put(MCPUtility.UI_DISPLAY_LOCATION, MCPUtility.MCPDisplayOption.SIDEBAR.getValue()); // inline | sidebar | hidden
    meta.put(MCPUtility.UI_LOADING_MESSAGE, "Loading...");
    meta.put(MCPUtility.UI_RESOURCE_URI, "index.html");
    return meta;
}`;

const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
		{children}
	</code>
);

const MetaKeyList: React.FC<{ keys: MetaKeyDoc[] }> = ({ keys }) => (
	<div className="mt-2 flex flex-col gap-1.5">
		{keys.map((item) => (
			<div key={item.key} className="flex flex-col gap-0.5">
				<div className="flex flex-wrap items-baseline gap-1.5">
					<InlineCode>{item.key}</InlineCode>
					<span className="font-mono text-[11px] text-primary">
						{item.type}
					</span>
				</div>
				<span className="text-muted-foreground">{item.desc}</span>
			</div>
		))}
	</div>
);

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {
			// clipboard blocked; ignore silently
		}
	}, [code]);

	return (
		<div className="relative mt-1.5">
			<pre className="overflow-x-auto rounded bg-muted/60 p-2 pr-9 font-mono text-[11px] text-foreground leading-relaxed">
				{code}
			</pre>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={handleCopy}
						aria-label="Copy example"
						className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
					>
						{copied ? (
							<CheckCircle2 size={14} />
						) : (
							<Copy size={14} />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
			</Tooltip>
		</div>
	);
};

const MetadataHelpContent: React.FC = () => (
	<div className="text-xs">
		<p className="text-muted-foreground">
			Optional JSON object controlling when this tool runs and how it
			renders in chat. Top-level keys:
		</p>
		<MetaKeyList keys={META_TOP_LEVEL_KEYS} />
		<p className="mt-3 text-muted-foreground">
			Nest UI settings under the <InlineCode>SMSS_MCP_UI</InlineCode> key:
		</p>
		<MetaKeyList keys={META_UI_KEYS} />
		<p className="mt-2 text-muted-foreground">Example:</p>
		<CodeBlock code={METADATA_EXAMPLE} />
		<p className="mt-2 text-muted-foreground">
			To persist this metadata so it survives tool regeneration, declare
			it in your Python source with the{" "}
			<InlineCode>@smssutil.mcp_metadata</InlineCode> decorator (
			<InlineCode>execution</InlineCode> maps to{" "}
			<InlineCode>SMSS_MCP_EXECUTION</InlineCode>):
		</p>
		<CodeBlock code={METADATA_PYTHON_EXAMPLE} />
		<p className="mt-2 text-muted-foreground">
			For a custom Java reactor, override{" "}
			<InlineCode>getMcpToolMetadata()</InlineCode> and use the{" "}
			<InlineCode>MCPUtility</InlineCode> constants and enums:
		</p>
		<CodeBlock code={METADATA_JAVA_EXAMPLE} />
	</div>
);

export interface MetadataHelpDialogProps {
	/** Render a borderless ghost button, for inline placement near a field */
	compact?: boolean;

	className?: string;
}

/**
 * Help button that opens the tool-metadata reference (keys, types, and how to
 * persist metadata from Python/Java) in a modal so the guidance is not always
 * taking up space inline.
 */
export const MetadataHelpDialog = ({
	compact = false,
	className,
}: MetadataHelpDialogProps) => (
	<Dialog>
		<DialogTrigger asChild>
			<Button
				type="button"
				variant={compact ? "ghost" : "outline"}
				size="sm"
				className={`flex items-center gap-1.5 ${
					compact ? "text-muted-foreground hover:text-foreground" : ""
				} ${className ?? ""}`}
			>
				<HelpCircle size={14} />
				<span>Metadata guide</span>
			</Button>
		</DialogTrigger>
		<DialogContent className="flex max-h-[85vh] w-[95vw] max-w-4xl flex-col overflow-hidden sm:max-w-4xl">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<Info size={16} className="text-primary" />
					Tool Metadata Guide
				</DialogTitle>
				<DialogDescription>
					What each metadata key does and how to persist it from your
					tool's source code.
				</DialogDescription>
			</DialogHeader>
			<div className="-mr-2 overflow-y-auto pr-2">
				<MetadataHelpContent />
			</div>
		</DialogContent>
	</Dialog>
);
