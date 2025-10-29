import {
	CheckIcon,
	ChevronsUpDown,
	ComputerIcon,
	ListTodoIcon,
	MessageCircle,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useState } from "react";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Agent } from "@/types";

const ENABLE_PLANNING = import.meta.env.VITE_ENABLE_PLANNING === "true";

type RoomAgentProps = {
	/**
	 * The Current mode
	 */
	mode: {
		type: "chat" | "plan" | "agent";
		agent: Agent | null;
	};

	/**
	 * Callback when mode changes
	 */
	onModeChange: (mode: {
		type: "chat" | "plan" | "agent";
		agent: Agent | null;
	}) => void;
};

export const RoomAgent: React.FC<RoomAgentProps> = observer(
	({ mode, onModeChange }) => {
		const [open, setOpen] = useState(false);

		const [search, setSearch] = useState("");

		const debouncedSearch = useDebouncedValue(search);

		/**
		 * Library Hooks
		 */
		const listWorkspaces = usePixel<{
			workspaces: Agent[];
		}>(
			open
				? `ListWorkspaces(${debouncedSearch ? `filters=[Filter(NAME ?like "${debouncedSearch}")],` : ""} limit=[5]);`
				: null,
			{ data: { workspaces: [] } },
		);

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<span>
									<Button
										className="w-36 text-left text-muted-foreground"
										variant="outline"
										role="combobox"
										aria-expanded={open}
									>
										{mode.type === "chat" && (
											<>
												<MessageCircle />
												<span className="flex-1 truncate">
													Ask
												</span>
											</>
										)}
										{mode.type === "plan" && (
											<>
												<ListTodoIcon />
												<span className="flex-1 truncate">
													Plan
												</span>
											</>
										)}
										{mode.type === "agent" && (
											<>
												<ComputerIcon />
												<span className="flex-1 truncate">
													{mode.agent?.name}
												</span>
											</>
										)}
										<ChevronsUpDown className="opacity-50" />
									</Button>
								</span>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Command>
									<CommandInput
										placeholder="Search"
										value={search}
										onValueChange={setSearch}
									/>
									<CommandList>
										<CommandEmpty>
											No results found.
										</CommandEmpty>

										<CommandGroup>
											<CommandItem
												value="chat"
												onSelect={() => {
													onModeChange({
														type: "chat",
														agent: null,
													});
													setOpen(false);
												}}
											>
												<MessageCircle />
												Ask
											</CommandItem>
											{ENABLE_PLANNING && (
												<CommandItem
													value="plan"
													onSelect={() => {
														onModeChange({
															type: "plan",
															agent: null,
														});
														setOpen(false);
													}}
												>
													<ListTodoIcon />
													Plan
												</CommandItem>
											)}
										</CommandGroup>
										<CommandSeparator />
										<CommandGroup heading="Agents">
											{listWorkspaces.status ===
												"LOADING" && (
												<div className="flex w-full flex-row items-center">
													<Spinner />
												</div>
											)}

											{listWorkspaces.data.workspaces.map(
												(w) => (
													<CommandItem
														key={w.workspace_id}
														value={w.workspace_id}
														onSelect={() => {
															onModeChange({
																type: "agent",
																agent: w,
															});
															setOpen(false);
														}}
													>
														{w.name}
														<CheckIcon
															className={`ml-auto ${mode.type === "agent" && mode.agent.workspace_id === w.workspace_id ? "opacity-100" : "opacity-0"}`}
														/>
													</CommandItem>
												),
											)}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</span>
				</TooltipTrigger>
				<TooltipContent>Switch Mode</TooltipContent>
			</Tooltip>
		);
	},
);
