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
import { useIteratorPixel } from "@semoss/sdk/react";
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
	useInfiniteScroll,
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
		 * Get all of the workspaces with lazy loading
		 */
		const getWorkspaces = useIteratorPixel<App[], App>(
			(limit, offset) =>
				open
					? `MyProjects(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} type = "WORKSPACE", limit=[${limit}], offset=[${offset}]);`
					: "",
			(response) => {
				// if its less than the limit, we know its the end
				if (response.length < 15) {
					return -1;
				}

				return Infinity;
			},
			(response) => {
				return response;
			},
			{
				limit: 15,
			},
			[open, debouncedSearch],
		);

		/**
		 * Setup infinite scroll for the command list
		 */
		const { setScroll } = useInfiniteScroll({
			disabled:
				getWorkspaces.isLoading || !getWorkspaces.hasMore || !open,
			onNext: () => {
				getWorkspaces.next();
			},
		});

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
								<Command shouldFilter={false}>
									<CommandInput
										placeholder="Search"
										value={search}
										onValueChange={setSearch}
									/>
									<CommandList
										className="max-h-[200px]"
										ref={(ele) => setScroll(ele)}
									>
										<CommandEmpty>
											{getWorkspaces.isLoading &&
											getWorkspaces.data.length === 0 ? (
												<div className="flex items-center justify-center py-4">
													<Spinner className="size-4" />
												</div>
											) : (
												"Not Found"
											)}
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
											{getWorkspaces.data.map((w) => (
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

											{getWorkspaces.isLoading &&
												getWorkspaces.data.length >
													0 && (
													<div className="flex items-center justify-center py-2">
														<Spinner className="size-4" />
													</div>
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
