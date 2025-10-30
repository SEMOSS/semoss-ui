import { HammerIcon, PlusIcon, TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
	Input,
	ScrollArea,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	Slider,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	RoomSidebar,
	ToolboxOverlay,
	WorkspaceCard,
	WorkspaceOverlay,
} from "@/components";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCP, MCPConfig } from "@/types";

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";
const ENABLE_TOOLS = import.meta.env.VITE_ENABLE_TOOLS === "true";

interface RoomConfigurationProps {
	/** Options for the room */
	options: RoomStore["options"];

	/** Update options on change */
	setOptions: (options: RoomStore["options"]) => void;

	/** Close the Menu */
	onClose?: () => void;

	/** The room, used to make updates */
	room?: Pick<RoomStore, "removeMCP" | "setMCPs">;
}

export const RoomConfiguration = observer((props: RoomConfigurationProps) => {
	const { options, setOptions, onClose, room } = props;

	/**
	 * Library hooks
	 */
	const { chat } = useChat();

	// get the workspace if there is one
	const workspaceId = options.workspace?.workspace_id ?? null;
	const workspace = chat.workspaces[workspaceId] ?? null;

	/**
	 * State
	 */
	const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
	const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] =
		useState<boolean>(false);

	/**
	 * Functions
	 */
	const handleDeleteMCP = async (mcp: MCPConfig) => {
		// Remove the MCP from the options
		if (room) {
			await room.removeMCP(mcp);
		} else {
			// otherwise we're creating a new room, just update the options
			const updatedMCPs = options.mcp.filter(
				(t) => !(t.id === mcp.id && t.type === mcp.type),
			);
			setOptions({
				...options,
				mcp: updatedMCPs,
			});
		}
	};

	const handleMCPClose = async (success: boolean, mcp: MCP[]) => {
		if (success) {
			// update the mcp list if successful
			const mcpConfigs: MCPConfig[] = mcp.map(({ id, type, name }) => ({
				id,
				type,
				name,
			}));
			if (room) {
				await room.setMCPs(mcpConfigs);
			} else {
				// otherwise we're creating a new room, just update the options
				setOptions({
					...options,
					mcp: mcpConfigs,
				});
			}
		}

		// close it
		setIsToolsOpen(false);
	};

	return (
		<RoomSidebar header={"Configuration"} onClose={() => onClose()}>
			<ScrollArea className="h-full w-full">
				<form>
					<FieldGroup>
						<FieldSet>
							<FieldGroup>
								{ENABLE_MODEL_SELECT && (
									<Field>
										<FieldLabel>Model</FieldLabel>
										<Select
											value={chat.models.selected}
											onValueChange={(value) => {
												chat.setSelectedModel(value);
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select Model" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectLabel>
														Model
													</SelectLabel>

													{chat.models.options.map(
														(m) => (
															<SelectItem
																key={m.app_id}
																value={m.app_id}
															>
																{m.app_name}
															</SelectItem>
														),
													)}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}

								{workspace && (
									<Field>
										<FieldLabel>Workspace</FieldLabel>
										<WorkspaceCard
											workspace={workspace}
											onPrimaryClick={() =>
												setIsWorkspaceModalOpen(true)
											}
										/>
									</Field>
								)}

								<Field>
									<FieldLabel>System Prompt</FieldLabel>
									<Textarea
										placeholder="Update System Prompt"
										className="min-h-[220px] resize-none"
										value={options.instructions}
										onChange={(e) => {
											setOptions({
												...options,
												instructions: e.target.value,
											});
										}}
									/>
								</Field>

								{ENABLE_TOOLS && (
									<>
										<Field>
											<FieldLabel
												onClick={() =>
													setIsToolsOpen(true)
												}
											>
												<div className="flex-1">
													MCPs
												</div>

												<Tooltip>
													<TooltipTrigger asChild>
														<span>
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	setIsToolsOpen(
																		true,
																	)
																}
															>
																<PlusIcon />
															</Button>
														</span>
													</TooltipTrigger>
													<TooltipContent>
														Add Tools
													</TooltipContent>
												</Tooltip>
											</FieldLabel>
											<div className="space-y-2">
												{options.mcp.length ? (
													options.mcp.map((mcp) => {
														return (
															<div
																key={mcp.id}
																className="group flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted/50"
															>
																<HammerIcon className="size-4" />
																<span className="flex-1 truncate text-sm">
																	{mcp.name}
																</span>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	className="invisible text-error group-hover:visible"
																	onClick={() =>
																		handleDeleteMCP(
																			mcp,
																		)
																	}
																>
																	<TrashIcon />
																</Button>
															</div>
														);
													})
												) : (
													<button
														type="button"
														className="w-full cursor-pointer rounded-md border border-border py-4 text-center dark:bg-input/30"
														onClick={() =>
															setIsToolsOpen(true)
														}
													>
														<span className="text-muted-foreground text-xs">
															No MCPs added
														</span>
													</button>
												)}
											</div>
										</Field>
										<ToolboxOverlay
											open={isToolsOpen}
											mcp={options.mcp}
											onClose={(success, mcp) =>
												handleMCPClose(success, mcp)
											}
										/>
										<WorkspaceOverlay
											workspaceInfo={workspace}
											open={isWorkspaceModalOpen}
											onClose={() =>
												setIsWorkspaceModalOpen(false)
											}
										/>
									</>
								)}
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
		</RoomSidebar>
	);
});
