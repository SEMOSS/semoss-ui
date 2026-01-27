import { CheckIcon, ComputerIcon } from "lucide-react";
import React, { useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { App } from "@/types";

interface RoomInputMenuWorkspaceProps {
	/**
	 * The currently selected workspace
	 */
	workspace: App | null;

	/**
	 * Callback when a workspace is selected
	 */
	onSelect: (workspace: App | null) => void;
}

export const RoomInputMenuWorkspace: React.FC<RoomInputMenuWorkspaceProps> = ({
	workspace,
	onSelect,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = React.useState("");

	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			isOpen
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
		[isOpen, debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore || !isOpen,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	return (
		<DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuSubTrigger>
				<ComputerIcon />
				<span className="flex-1">
					{workspace ? workspace.project_name : "Select Workspace"}
				</span>
				{workspace ? (
					<div className="px-1">
						<CheckIcon />
					</div>
				) : null}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-72 p-0">
				<Command shouldFilter={false} className="w-full">
					<CommandInput
						placeholder="Search workspaces"
						value={search}
						onValueChange={setSearch}
						autoFocus
					/>
					<CommandList
						className="max-h-[200px]"
						ref={(ele) => setScroll(ele)}
					>
						{!getWorkspaces.isLoading &&
						getWorkspaces.data.length === 0 ? (
							<CommandEmpty>Not Found</CommandEmpty>
						) : null}

						{getWorkspaces.data.length > 0 && (
							<CommandGroup>
								{getWorkspaces.data.map((w) => (
									<CommandItem
										key={w.project_id}
										value={w.project_id}
										onSelect={() => {
											onSelect(w);
										}}
									>
										<ComputerIcon className="size-4" />
										{w.project_name}
										<CheckIcon
											className={`ml-auto ${workspace?.project_id === w.project_id ? "opacity-100" : "opacity-0"}`}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{getWorkspaces.isLoading && (
							<div className="flex items-center justify-center py-4">
								<Spinner className="size-4" />
							</div>
						)}
					</CommandList>
				</Command>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
