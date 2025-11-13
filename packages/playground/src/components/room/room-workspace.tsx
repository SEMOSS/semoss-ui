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
import { usePixel } from "@semoss/sdk/react";
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
	useDebouncedValue,
} from "@semoss/ui/next";
import type { App } from "@/types";

type RoomWorkspaceProps = {
	/**
	 * The Current mode
	 */
	mode: {
		type: "chat" | "plan" | "workspace";
		workspace: App | null;
	};

	/**
	 * Callback when mode changes
	 */
	onModeChange: (mode: {
		type: "chat" | "plan" | "workspace";
		workspace: App | null;
	}) => void;
};

export const RoomWorkspace: React.FC<RoomWorkspaceProps> = observer(
	({ mode, onModeChange }) => {
		const [open, setOpen] = useState(false);

		const [search, setSearch] = useState("");

		const debouncedSearch = useDebouncedValue(search);

		/**
		 * Library Hooks
		 */
		const listWorkspaces = usePixel<App[]>(
			open
				? `MyProjects ( type = "WORKSPACE" , filterWord = "${debouncedSearch}", limit = 10 ) ;`
				: null,
			{ data: [] },
		);

		/**
		 * Constants
		 */
		const workspaceMap = listWorkspaces.data.reduce(
			(acc, curr) => {
				acc[curr.project_id] = curr;
				return acc;
			},
			{} as Record<string, App>,
		);

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
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
									{mode.type === "workspace" && (
										<>
											<ComputerIcon />
											<span className="flex-1 truncate">
												{mode.workspace?.project_name ||
													""}
											</span>
										</>
									)}
									<ChevronsUpDown className="opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Command
									filter={(val, search) => {
										if (val === "chat") {
											return "ask".includes(
												search.toLowerCase(),
											)
												? 1
												: 0;
										} else if (
											val
												.toLowerCase()
												.includes(search.toLowerCase())
										) {
											return 1;
										} else if (
											workspaceMap[val]?.project_name
												.toLowerCase()
												.includes(search.toLowerCase())
										) {
											return 1;
										}

										return 0;
									}}
								>
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
														workspace: null,
													});
													setOpen(false);
												}}
											>
												<MessageCircle />
												Ask
											</CommandItem>

											<Tooltip>
												<TooltipTrigger asChild>
													<span>
														<CommandItem
															value="plan"
															onSelect={() => {
																onModeChange({
																	type: "plan",
																	workspace:
																		null,
																});
																setOpen(false);
															}}
														>
															<ListTodoIcon />
															Plan
														</CommandItem>
													</span>
												</TooltipTrigger>
												<TooltipContent>
													Note: This is an
													experimental feature.
												</TooltipContent>
											</Tooltip>
										</CommandGroup>
										<CommandSeparator />
										<CommandGroup heading="Workspaces">
											{(listWorkspaces.status ===
												"LOADING" ||
												search !== debouncedSearch) && (
												<div className="flex items-center justify-center py-4">
													<Spinner />
												</div>
											)}

											{listWorkspaces.data.map((w) => (
												<CommandItem
													key={w.project_id}
													value={w.project_id}
													onSelect={() => {
														onModeChange({
															type: "workspace",
															workspace: w,
														});
														setOpen(false);
													}}
												>
													{w.project_name}
													<CheckIcon
														className={`ml-auto ${mode.type === "workspace" && mode.workspace.project_id === w.project_id ? "opacity-100" : "opacity-0"}`}
													/>
												</CommandItem>
											))}
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
