import { useEffect, useMemo, useState } from "react";
import {
	Badge,
	H4,
	Muted,
	P,
	ScrollArea,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";
import { formatMessageTime } from "@/features/messages/utils/message-metadata";
import { pendingActionToolId } from "@/features/messages/utils/thread-items";
import { useToolUiUrl } from "../api/use-tool-ui-url";
import { useToolWorkbench } from "../tool-workbench.context";
import { getToolLoadingMessage } from "../utils/tool-metadata";
import { ToolApprovalPanel } from "./tool-approval-panel";
import { ToolUiFrame } from "./tool-ui-frame";
import { ToolUserInput } from "./tool-user-input";

function formatValue(value: unknown): string {
	if (value === undefined || value === null || value === "") return "";
	if (typeof value === "string") {
		try {
			return JSON.stringify(JSON.parse(value) as unknown, null, 2);
		} catch {
			return value;
		}
	}
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function badgeVariant(status: string): "outline" | "destructive" | "secondary" {
	if (status === "FAILED" || status === "REJECTED") return "destructive";
	if (status === "COMPLETED") return "secondary";
	return "outline";
}

/** Shared live tool details used by both inline and workbench locations. */
export function ToolContent({ toolId }: { toolId: string }) {
	const { tools, pendingApprovals, toolCreatedAt } = useToolWorkbench();
	const createdAt = toolCreatedAt?.[toolId];
	const timestamp = formatMessageTime(createdAt, true);
	const storedTool = tools[toolId];
	const uiUrl = useToolUiUrl(storedTool);
	const tool = storedTool ? { ...storedTool, uiUrl } : undefined;
	const pendingAction = pendingApprovals.find(
		(action) => pendingActionToolId(action) === toolId,
	);
	const inputs = useMemo(
		() => formatValue(tool?.arguments ?? pendingAction?.arguments ?? {}),
		[tool?.arguments, pendingAction?.arguments],
	);
	const output = useMemo(
		() => formatValue(tool?.error ?? tool?.output),
		[tool?.error, tool?.output],
	);
	const toolIsActive =
		tool?.status === "QUEUED" || tool?.status === "RUNNING";
	const [tab, setTab] = useState(
		tool?.uiUrl ? "tool" : output || toolIsActive ? "output" : "inputs",
	);

	useEffect(() => {
		if (!tool?.uiUrl && (output || toolIsActive)) setTab("output");
	}, [output, tool?.uiUrl, toolIsActive]);

	if (!tool) {
		return (
			<div className="flex size-full items-center justify-center p-3">
				<Muted className="text-xs">
					This tool is no longer available in the conversation.
				</Muted>
			</div>
		);
	}

	return (
		<div className="flex size-full min-h-0 flex-col overflow-hidden bg-background">
			<header className="flex flex-wrap items-start justify-between gap-2 border-b p-3">
				<div className="min-w-0">
					<H4 className="break-words text-sm">{tool.title}</H4>
					{timestamp && (
						<time
							dateTime={createdAt}
							className="mt-1 block text-muted-foreground text-xs"
						>
							{timestamp}
						</time>
					)}
					{tool.description && (
						<P className="mt-1 text-muted-foreground text-xs">
							{tool.description}
						</P>
					)}
				</div>
				<Badge variant={badgeVariant(tool.status)} className="text-xs">
					{tool.status.replaceAll("_", " ").toLowerCase()}
				</Badge>
			</header>

			{pendingAction?.requiresResponse ? (
				<ToolUserInput
					key={pendingAction.actionId ?? pendingAction.toolId}
					action={pendingAction}
				/>
			) : pendingAction ? (
				<ToolApprovalPanel
					key={pendingAction.actionId ?? pendingAction.toolId}
					tool={tool}
					action={{ ...pendingAction, uiUrl }}
				/>
			) : (
				<Tabs
					value={tab}
					onValueChange={setTab}
					className="min-h-0 flex-1 gap-0"
				>
					<div className="border-b px-3 py-2">
						<TabsList>
							{tool.uiUrl && (
								<TabsTrigger value="tool" className="text-xs">
									Tool UI
								</TabsTrigger>
							)}
							<TabsTrigger value="inputs" className="text-xs">
								Inputs
							</TabsTrigger>
							<TabsTrigger value="output" className="text-xs">
								Output
							</TabsTrigger>
						</TabsList>
					</div>
					{tool.uiUrl && (
						<TabsContent
							value="tool"
							className="min-h-0 overflow-hidden"
						>
							<ToolUiFrame tool={tool} url={tool.uiUrl} />
						</TabsContent>
					)}
					<TabsContent
						value="inputs"
						className="min-h-0 overflow-hidden"
					>
						<ScrollArea className="size-full">
							<div className="p-3">
								<Muted className="text-xs">Parameters</Muted>
								<Textarea
									readOnly
									aria-label={`${tool.title} parameters`}
									className="mt-2 min-h-48 resize-none font-mono text-xs"
									value={inputs || "{}"}
								/>
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent
						value="output"
						className="min-h-0 overflow-hidden"
					>
						<ScrollArea className="size-full">
							<div className="p-3">
								<Muted className="text-xs">Result</Muted>
								{output ? (
									<Textarea
										readOnly
										aria-label={`${tool.title} result`}
										className="mt-2 min-h-48 resize-none font-mono text-xs"
										value={output}
									/>
								) : toolIsActive ? (
									<div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
										<Spinner
											aria-hidden="true"
											className="size-3.5 motion-reduce:animate-none"
										/>
										{tool.status === "QUEUED"
											? "Waiting to start…"
											: getToolLoadingMessage(tool)}
									</div>
								) : (
									<P className="mt-4 text-muted-foreground text-xs">
										The tool did not return output.
									</P>
								)}
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
