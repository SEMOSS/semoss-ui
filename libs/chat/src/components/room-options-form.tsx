import { BotIcon, HammerIcon, PlusIcon, TrashIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import { EngineSelect } from "@semoss/shared";
import {
	Badge,
	Button,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Engine, MCPConfig } from "../types";
import {
	McpOverlay,
	type McpOverlayAgent,
	type McpOverlayWorkspaceRef,
} from "./mcp-overlay";

export interface RoomOptionsFormProps {
	model?: Engine | null;
	onModelChange?: (model: Engine) => void;
	options: {
		instructions?: string;
		mcp: MCPConfig[];
		workspace?: McpOverlayWorkspaceRef;
	};
	onOptionsChange: (options: {
		instructions?: string;
		mcp?: MCPConfig[];
		workspace?: McpOverlayWorkspaceRef;
	}) => void;
	agentEditable?: boolean;
	agents?: readonly McpOverlayAgent[];
}

function splitMcpByType(mcp: MCPConfig[]) {
	return {
		knowledge: mcp.filter((item) => item.type === "VECTOR"),
		toolbox: mcp.filter((item) => item.type !== "VECTOR"),
	};
}

export function RoomOptionsForm({
	model,
	onModelChange,
	options,
	onOptionsChange,
	agentEditable = true,
	agents,
}: RoomOptionsFormProps) {
	const [mcpOverlay, setMcpOverlay] = useState<{
		type: "AGENT" | "KNOWLEDGE" | "TOOLBOX";
		isOpen: boolean;
	}>({
		type: "KNOWLEDGE",
		isOpen: false,
	});

	const { knowledge, toolbox } = splitMcpByType(options.mcp ?? []);

	function handleDeleteMcp(mcp: MCPConfig) {
		if (mcp.fromWorkspace) {
			return;
		}
		onOptionsChange({
			mcp: options.mcp.filter(
				(item) => !(item.id === mcp.id && item.type === mcp.type),
			),
		});
	}

	return (
		<form className="p-4 text-foreground">
			<FieldGroup>
				<FieldSet>
					<FieldLegend className="flex w-full flex-1 items-center justify-between gap-2">
						Room Settings
					</FieldLegend>
					<FieldDescription>
						Configure model, instructions, agent, knowledge, and
						toolboxes.
					</FieldDescription>
					<FieldGroup>
						{model && onModelChange ? (
							<Field>
								<FieldLabel>Model</FieldLabel>
								<div className="rounded-md border border-input bg-transparent px-1 py-1 shadow-xs dark:bg-input/30">
									<EngineSelect
										className="w-full max-w-none"
										name={
											model.engine_display_name ||
											model.engine_name ||
											""
										}
										value={model.engine_id || ""}
										engineTypes={["MODEL"]}
										metaFilters={[
											{ tag: "text-generation" },
										]}
										onChange={onModelChange}
										popoverContentProps={{ align: "start" }}
									/>
								</div>
							</Field>
						) : null}

						<Field>
							<FieldLabel>Instructions</FieldLabel>
							<Textarea
								placeholder="Add room instructions"
								className="h-64 resize-none overflow-y-auto"
								value={options.instructions ?? ""}
								onChange={(event) => {
									onOptionsChange({
										instructions: event.target.value,
									});
								}}
							/>
						</Field>

						{(agentEditable || options.workspace) && (
							<Field>
								<FieldLabel
									onClick={
										agentEditable
											? (
													event: MouseEvent<HTMLLabelElement>,
												) => {
													event.preventDefault();
													event.stopPropagation();
													setMcpOverlay({
														type: "AGENT",
														isOpen: true,
													});
												}
											: undefined
									}
								>
									<div className="flex-1">Agent</div>
								</FieldLabel>
								<div className="space-y-2">
									{options.workspace ? (
										agentEditable ? (
											<button
												type="button"
												className="group flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-start text-card-foreground hover:bg-muted/50"
												onClick={() =>
													setMcpOverlay({
														type: "AGENT",
														isOpen: true,
													})
												}
											>
												<BotIcon className="size-4" />
												<span className="flex-1 truncate text-sm">
													{options.workspace.name ||
														options.workspace
															.workspace_id}
												</span>
											</button>
										) : (
											<div className="flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-start text-card-foreground">
												<BotIcon className="size-4" />
												<span className="flex-1 truncate text-sm">
													{options.workspace.name ||
														options.workspace
															.workspace_id}
												</span>
											</div>
										)
									) : (
										<button
											type="button"
											className="w-full cursor-pointer rounded-md border border-border bg-card py-4 text-center text-card-foreground"
											onClick={() =>
												setMcpOverlay({
													type: "AGENT",
													isOpen: true,
												})
											}
										>
											<span className="text-muted-foreground text-xs">
												Select an agent
											</span>
										</button>
									)}
								</div>
							</Field>
						)}

						<Field>
							<FieldLabel
								onClick={(
									event: MouseEvent<HTMLLabelElement>,
								) => {
									event.preventDefault();
									event.stopPropagation();
									setMcpOverlay({
										type: "KNOWLEDGE",
										isOpen: true,
									});
								}}
							>
								<div className="flex-1">Knowledge</div>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												setMcpOverlay({
													type: "KNOWLEDGE",
													isOpen: true,
												});
											}}
										>
											<PlusIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Add Knowledge
									</TooltipContent>
								</Tooltip>
							</FieldLabel>
							<div className="space-y-2">
								{knowledge.length ? (
									knowledge.map((mcp) => (
										<div
											key={mcp.id}
											className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-card-foreground ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
										>
											<HammerIcon className="size-4" />
											<span className="flex-1 truncate text-sm">
												{mcp.name}
											</span>
											{mcp.fromWorkspace ? (
												<Badge
													variant="outline"
													className="me-2 border border-primary text-primary text-xs"
												>
													From Agent
												</Badge>
											) : (
												<Button
													variant="ghost"
													size="icon-sm"
													className="invisible group-hover:visible"
													onClick={() =>
														handleDeleteMcp(mcp)
													}
												>
													<TrashIcon className="text-destructive" />
												</Button>
											)}
										</div>
									))
								) : (
									<button
										type="button"
										className="w-full cursor-pointer rounded-md border border-border bg-card py-4 text-center text-card-foreground"
										onClick={() =>
											setMcpOverlay({
												type: "KNOWLEDGE",
												isOpen: true,
											})
										}
									>
										<span className="text-muted-foreground text-xs">
											No knowledge found
										</span>
									</button>
								)}
							</div>
						</Field>

						<Field>
							<FieldLabel
								onClick={(
									event: MouseEvent<HTMLLabelElement>,
								) => {
									event.preventDefault();
									event.stopPropagation();
									setMcpOverlay({
										type: "TOOLBOX",
										isOpen: true,
									});
								}}
							>
								<div className="flex-1">Toolbox</div>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												setMcpOverlay({
													type: "TOOLBOX",
													isOpen: true,
												});
											}}
										>
											<PlusIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Add Toolbox</TooltipContent>
								</Tooltip>
							</FieldLabel>
							<div className="space-y-2">
								{toolbox.length ? (
									toolbox.map((mcp) => (
										<div
											key={mcp.id}
											className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-card-foreground ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
										>
											<HammerIcon className="size-4" />
											<span className="flex-1 truncate text-sm">
												{mcp.name}
											</span>
											{mcp.fromWorkspace ? (
												<Badge
													variant="outline"
													className="me-2 border border-primary text-primary text-xs"
												>
													From Agent
												</Badge>
											) : (
												<Button
													variant="ghost"
													size="icon-sm"
													className="invisible group-hover:visible"
													onClick={() =>
														handleDeleteMcp(mcp)
													}
												>
													<TrashIcon className="text-destructive" />
												</Button>
											)}
										</div>
									))
								) : (
									<button
										type="button"
										className="w-full cursor-pointer rounded-md border border-border bg-card py-4 text-center text-card-foreground"
										onClick={() =>
											setMcpOverlay({
												type: "TOOLBOX",
												isOpen: true,
											})
										}
									>
										<span className="text-muted-foreground text-xs">
											No toolboxes found
										</span>
									</button>
								)}
							</div>
						</Field>

						<McpOverlay
							open={mcpOverlay.isOpen}
							defaultTab={mcpOverlay.type}
							values={options.mcp ?? []}
							workspace={options.workspace ?? null}
							agentEditable={agentEditable}
							agents={agents}
							onSave={(nextMcp) => {
								onOptionsChange({ mcp: nextMcp });
							}}
							onSaveWorkspace={(nextWorkspace) => {
								onOptionsChange({
									workspace: nextWorkspace ?? undefined,
								});
							}}
							onOpenChange={(open) => {
								if (!open) {
									setMcpOverlay({
										isOpen: false,
										type: "KNOWLEDGE",
									});
								}
							}}
						/>
					</FieldGroup>
				</FieldSet>
			</FieldGroup>
		</form>
	);
}
