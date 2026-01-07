import { HammerIcon, PlusIcon, TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { EngineSelect } from "@semoss/shared";
import {
	Badge,
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
	Input,
	ScrollArea,
	Slider,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { MCPOverlay } from "@/components";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCPConfig } from "@/types";

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";

interface RoomOptionsProps {
	/** Options for the room */
	options: RoomStore["options"];

	/** Update options on change */
	setOptions: (options: RoomStore["options"]) => void;

	/** Update model on change */
	setRoomModel: (modelId: string) => void;
}

export const RoomOptions = observer((props: RoomOptionsProps) => {
	const { options, setOptions, setRoomModel } = props;

	/**
	 * Library hooks
	 */
	const { chat } = useChat();

	/**
	 * State
	 */
	const [mCPOverlay, setMCPOverlay] = useState<{
		type?: "KNOWLEDGE" | "TOOLBOX";
		isOpen: boolean;
	}>({
		isOpen: false,
	});

	// All MCPs are in the mcp array (workspace MCPs have fromWorkspace flag)
	const knowledge = options.mcp.filter((mcp) => mcp.type === "VECTOR");
	const toolbox = options.mcp.filter((mcp) => mcp.type !== "VECTOR");

	/**
	 * Functions
	 */
	const handleDeleteMCP = (mcp: MCPConfig) => {
		// Don't allow deletion of workspace MCPs
		if (mcp.fromWorkspace) {
			return;
		}

		const updatedMCPs = options.mcp.filter(
			(t) => !(t.id === mcp.id && t.type === mcp.type),
		);

		setOptions({
			...options,
			mcp: updatedMCPs,
		});
	};

	return (
		<ScrollArea className="h-full w-full">
			<form className="px-2 py-4">
				<FieldGroup>
					<FieldSet>
						<FieldGroup>
							{ENABLE_MODEL_SELECT && (
								<Field>
									<FieldLabel>Model</FieldLabel>
									<EngineSelect
										name={
											chat.models.selected?.app_name || ""
										}
										value={
											chat.models.selected?.app_id || ""
										}
										engineTypes={["MODEL"]}
										metaFilters={[
											{ tag: "text-generation" },
										]}
										onChange={(v) => {
											chat.setSelectedModel(v);
											setRoomModel(v.app_id);
										}}
										popoverContentProps={{
											align: "start",
										}}
									/>
								</Field>
							)}

							<Field>
								<FieldLabel>Instructions</FieldLabel>
								<Textarea
									placeholder="Update Instructions"
									className="h-64 resize-none overflow-y-auto"
									value={options.instructions}
									onChange={(e) => {
										setOptions({
											...options,
											instructions: e.target.value,
										});
									}}
								/>
							</Field>

							<Field>
								<FieldLabel
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();

										setMCPOverlay({
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

													setMCPOverlay({
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
										knowledge.map((mcp) => {
											return (
												<div
													key={mcp.id}
													className={`group flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
												>
													<HammerIcon className="size-4" />
													<span className="flex-1 truncate text-sm">
														{mcp.name}
													</span>
													{mcp.fromWorkspace ? (
														<Badge
															key={mcp.id}
															variant="outline"
															className="disabled: mr-2 border border-primary text-primary text-xs"
														>
															From Workspace
														</Badge>
													) : (
														<Button
															variant="ghost"
															size="icon-sm"
															color=""
															className="invisible group-hover:visible"
															onClick={() =>
																handleDeleteMCP(
																	mcp,
																)
															}
															disabled={
																mcp.fromWorkspace
															}
															title={
																mcp.fromWorkspace
																	? "Cannot delete workspace MCPs"
																	: "Delete MCP"
															}
														>
															<TrashIcon
																className={
																	mcp.fromWorkspace
																		? "text-muted-foreground"
																		: "text-destructive"
																}
															/>
														</Button>
													)}
												</div>
											);
										})
									) : (
										<button
											type="button"
											className="w-full cursor-pointer rounded-md border border-border py-4 text-center dark:bg-input/30"
											onClick={() =>
												setMCPOverlay({
													type: "KNOWLEDGE",
													isOpen: true,
												})
											}
										>
											<span className="text-muted-foreground text-xs">
												No Knowledge Found
											</span>
										</button>
									)}
								</div>
							</Field>

							<Field>
								<FieldLabel
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();

										setMCPOverlay({
											type: "TOOLBOX",
											isOpen: true,
										});
									}}
								>
									<div className="flex-1">MCPs</div>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={(event) => {
													event.preventDefault();
													event.stopPropagation();

													setMCPOverlay({
														type: "TOOLBOX",
														isOpen: true,
													});
												}}
											>
												<PlusIcon />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Add Toolbox
										</TooltipContent>
									</Tooltip>
								</FieldLabel>
								<div className="space-y-2">
									{toolbox.length ? (
										toolbox.map((mcp) => {
											return (
												<div
													key={mcp.id}
													className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border px-3 py-2 ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
												>
													<HammerIcon className="size-4" />
													<span className="flex-1 truncate text-sm">
														{mcp.name}
													</span>
													{mcp.fromWorkspace ? (
														<Badge
															key={mcp.id}
															variant="outline"
															className="disabled: mr-2 border border-primary text-primary text-xs"
														>
															From Workspace
														</Badge>
													) : (
														<Button
															variant="ghost"
															size="icon-sm"
															className="invisible group-hover:visible"
															onClick={() =>
																handleDeleteMCP(
																	mcp,
																)
															}
															disabled={
																mcp.fromWorkspace
															}
															title={
																mcp.fromWorkspace
																	? "Cannot delete workspace MCPs"
																	: "Delete MCP"
															}
														>
															<TrashIcon
																className={
																	mcp.fromWorkspace
																		? "text-muted-foreground"
																		: "text-destructive"
																}
															/>
														</Button>
													)}
												</div>
											);
										})
									) : (
										<button
											type="button"
											className="w-full cursor-pointer rounded-md border border-border py-4 text-center dark:bg-input/30"
											onClick={() =>
												setMCPOverlay({
													type: "TOOLBOX",
													isOpen: true,
												})
											}
										>
											<span className="text-muted-foreground text-xs">
												No Toolbox Found
											</span>
										</button>
									)}
								</div>
							</Field>
							<MCPOverlay
								open={mCPOverlay.isOpen}
								type={mCPOverlay.type}
								values={
									mCPOverlay.type === "TOOLBOX"
										? toolbox
										: knowledge
								}
								onClose={(mcp) => {
									if (mcp) {
										// Merge updated MCPs with the other type
										const otherTypeMCPs = mCPOverlay.type === "TOOLBOX" 
											? knowledge 
											: toolbox;
										
										setOptions({
											...options,
											mcp: [...otherTypeMCPs, ...mcp],
										});
									}

									// close it
									setMCPOverlay({ isOpen: false });
								}}
							/>
						</FieldGroup>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldGroup>
							<Field>
								<FieldLabel>Max Token</FieldLabel>
								<Input
									type="number"
									placeholder="Update token length"
									value={options.tokenLength}
									onChange={(e) =>
										setOptions({
											...options,
											tokenLength:
												Number(e.target.value) || 0,
										})
									}
									min={0}
									className="w-full"
								/>
							</Field>

							<Field>
								<FieldLabel>
									Temperature (
									{options.temperature?.toFixed(2)})
								</FieldLabel>
								<Slider
									min={0}
									max={1}
									step={0.01}
									value={[options.temperature]}
									onValueChange={(value) =>
										setOptions({
											...options,
											temperature: value[0],
										})
									}
								/>
							</Field>
						</FieldGroup>
					</FieldSet>
				</FieldGroup>
			</form>
		</ScrollArea>
	);
});
