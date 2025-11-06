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
import { ToolboxOverlay } from "@/components";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCP, MCPConfig } from "@/types";

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";
const ENABLE_TOOLS = import.meta.env.VITE_ENABLE_TOOLS === "true";

interface RoomOptionsProps {
	/** Options for the room */
	options: RoomStore["options"];

	/** Update options on change */
	setOptions: (options: RoomStore["options"]) => void;
}

export const RoomOptions = observer((props: RoomOptionsProps) => {
	const { options, setOptions } = props;

	/**
	 * Library hooks
	 */
	const { chat } = useChat();

	/**
	 * State
	 */
	const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);

	/**
	 * Functions
	 */
	const handleDeleteMCP = (mcp: MCPConfig) => {
		const updatedMCPs = options.mcp.filter(
			(t) => !(t.id === mcp.id && t.type === mcp.type),
		);

		setOptions({
			...options,
			mcp: updatedMCPs,
		});
	};

	const handleMCPClose = async (success: boolean, mcp: MCP[]) => {
		if (success) {
			// update the mcp list if successful
			const mcpConfigs: MCPConfig[] = mcp.map(({ id, type, name }) => ({
				id,
				type,
				name,
			}));

			// remove from the options
			setOptions({
				...options,
				mcp: mcpConfigs,
			});
		}

		// close it
		setIsToolsOpen(false);
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
												<SelectLabel>Model</SelectLabel>

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

							<Field>
								<FieldLabel>Instructions</FieldLabel>
								<Textarea
									placeholder="Update Instructions"
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
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();

												setIsToolsOpen(true);
											}}
										>
											<div className="flex-1">MCPs</div>

											<Tooltip>
												<TooltipTrigger asChild>
													<span>
														<Button
															variant="outline"
															size="sm"
															onClick={(
																event,
															) => {
																event.preventDefault();
																event.stopPropagation();

																setIsToolsOpen(
																	true,
																);
															}}
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
	);
});
