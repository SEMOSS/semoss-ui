import { type ReactNode, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { isAskExecutionMode } from "../mcp/mcp-utils";
import type { ToolStore } from "../messages/tool.store";
import { useTool } from "../messages/use-tool";
import { useRoomSelector } from "../room/use-room-selector";
import { ToolDataView } from "./tool-data-view";
import { ToolInfo } from "./tool-info";
import { ToolInputValue } from "./tool-input-value";

interface ToolInspectorProps {
	tool: ToolStore;
	header?: ReactNode;
	/** An editable form, only while the call can still be executed. */
	inputContent?: ReactNode;
	footer?: ReactNode;
	description?: string;
	inputSchema?: unknown;
	/** Some tools wrap failures in model guidance that should not be displayed. */
	response?: string;
}

/** Information, input, and output stay independently scrollable in the dock. */
export const ToolInspector = ({
	tool,
	header,
	inputContent,
	footer,
	description,
	inputSchema,
	response: responseProp,
}: ToolInspectorProps) => {
	const { t, i18n } = useTranslation("tool");
	const [selectedTab, setSelectedTab] = useState<string | null>(null);
	const [visitedTabs, setVisitedTabs] = useState<string[]>([]);
	const { status, parameters, toolResponse } = useTool(tool, (current) => ({
		status: current.status,
		parameters: current.parameters,
		toolResponse: current.response,
	}));
	// the call's json reads the room's options too
	const { displayName, execution } = useRoomSelector(tool.room, () => ({
		displayName: tool.displayName,
		execution: tool.json._meta?.SMSS_MCP_EXECUTION,
	}));
	const response = responseProp ?? toolResponse;
	const completed = ["SUCCESS", "ERROR", "CANCELLED"].includes(status);
	const activeTab = selectedTab ?? (completed ? "output" : "inputs");
	const statusLabel = t(
		`status.${
			{
				SUCCESS: "completed",
				ERROR: "failed",
				CANCELLED: "cancelled",
				LOADING: "running",
				INITIAL: isAskExecutionMode(execution)
					? "waitingForInput"
					: "queued",
			}[status]
		}`,
	);
	const tabClassName = "min-h-0 min-w-0 flex-1 overflow-hidden";
	const triggerClassName =
		"h-8 flex-none rounded-none border-0 border-b-2 border-transparent px-2.5 text-xs shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent";
	const isVisited = (tab: string) =>
		activeTab === tab || visitedTabs.includes(tab);

	return (
		<div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden bg-background p-3 text-foreground">
			<div className="shrink-0">
				{header ?? (
					<div className="flex min-w-0 items-start gap-2">
						<h2
							className="min-w-0 flex-1 truncate font-medium text-sm"
							title={displayName}
						>
							{displayName}
						</h2>
						<Badge variant="outline" className="shrink-0">
							{statusLabel}
						</Badge>
					</div>
				)}
			</div>
			<Tabs
				dir={i18n.dir()}
				value={activeTab}
				onValueChange={(tab) => {
					setVisitedTabs((visited) => [
						...new Set([...visited, activeTab, tab]),
					]);
					setSelectedTab(tab);
				}}
				className="min-h-0 min-w-0 flex-1 gap-2"
			>
				<TabsList
					className="h-8 shrink-0 justify-start gap-1 rounded-none bg-transparent p-0"
					aria-label={t("inspector.tabsLabel")}
				>
					<TabsTrigger value="info" className={triggerClassName}>
						{t("inspector.info")}
					</TabsTrigger>
					<TabsTrigger value="inputs" className={triggerClassName}>
						{t("inspector.input")}
					</TabsTrigger>
					<TabsTrigger value="output" className={triggerClassName}>
						{t("tabs.output")}
					</TabsTrigger>
				</TabsList>
				<TabsContent
					value="info"
					hidden={activeTab !== "info"}
					forceMount
					className={tabClassName}
				>
					{isVisited("info") && (
						<ToolInfo
							tool={tool}
							description={description}
							inputSchema={inputSchema}
						/>
					)}
				</TabsContent>
				<TabsContent
					value="inputs"
					hidden={activeTab !== "inputs"}
					forceMount
					className={tabClassName}
				>
					{isVisited("inputs") &&
						(inputContent ?? (
							<ToolDataView
								value={parameters ?? {}}
								prettyContent={
									<ToolInputValue
										value={parameters ?? {}}
										schema={inputSchema}
									/>
								}
								label={`${displayName} — ${t("inspector.input")}`}
							/>
						))}
				</TabsContent>
				<TabsContent
					value="output"
					hidden={activeTab !== "output"}
					forceMount
					className={tabClassName}
				>
					{isVisited("output") && (
						<div className="flex h-full min-h-0 flex-col gap-2">
							{(status === "ERROR" || status === "CANCELLED") && (
								<output className="shrink-0 text-destructive text-sm">
									{statusLabel}
								</output>
							)}
							{completed && response !== "" ? (
								<div className="min-h-0 flex-1">
									<ToolDataView
										value={response}
										parseResponse
										label={`${displayName} — ${t("tabs.output")}`}
									/>
								</div>
							) : (
								<output className="p-4 text-center text-muted-foreground text-sm">
									{t(
										completed
											? "inspector.emptyOutput"
											: status === "LOADING"
												? "inspector.runningOutput"
												: "form.noOutput",
									)}
								</output>
							)}
						</div>
					)}
				</TabsContent>
			</Tabs>
			{footer && (
				<div className="max-h-[40%] shrink-0 overflow-auto border-t pt-3">
					{footer}
				</div>
			)}
		</div>
	);
};
