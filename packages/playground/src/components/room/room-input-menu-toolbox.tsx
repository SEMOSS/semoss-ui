import { CheckIcon, HammerIcon } from "lucide-react";
import React, { useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
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
import { engineProjectToMCP } from "@/components";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, Engine, MCPConfig } from "@/types";

interface RoomInputMenuToolboxProps {
	/**
	 * Options
	 */
	options: RoomStore["options"];

	/**
	 * Callback when a tool is selected
	 */
	onSelect: (tool: MCPConfig) => void;
}

export const RoomInputMenuToolbox: React.FC<RoomInputMenuToolboxProps> = ({
	options,
	onSelect,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const { root } = useRoot();
	const [search, setSearch] = React.useState("");

	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the toolboxes with lazy loading
	 */
	const getToolbox = useIteratorPixel<(App | Engine)[], MCPConfig>(
		(limit, offset) =>
			isOpen
				? `MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`
				: "",
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 15) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response.map(engineProjectToMCP);
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
		disabled: getToolbox.isLoading || !getToolbox.hasMore || !isOpen,
		onNext: () => {
			getToolbox.next();
		},
	});

	// track the selected tools
	const tools = options.mcp.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, MCPConfig>,
	);

	// track the defaults based on the search
	const defaultTools = (root.theme.defaultTools || []).filter(
		(t) =>
			t.name.toLowerCase().indexOf(debouncedSearch.toLowerCase()) !== -1,
	);

	return (
		<DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuSubTrigger>
				<HammerIcon />
				<span className="flex-1">Add Toolbox</span>
				<Badge variant="outline">{Object.keys(tools).length}</Badge>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-72 p-0">
				<Command shouldFilter={false} className="w-full">
					<CommandInput
						placeholder="Search toolboxes"
						value={search}
						onValueChange={setSearch}
						autoFocus
					/>
					<CommandList
						className="max-h-[200px]"
						ref={(ele) => setScroll(ele)}
					>
						{!getToolbox.isLoading &&
						getToolbox.data.length === 0 &&
						defaultTools.length === 0 ? (
							<CommandEmpty>Not Found</CommandEmpty>
						) : null}

						{!getToolbox.isLoading && defaultTools.length > 0 && (
							<CommandGroup>
								{defaultTools.map((item) => (
									<CommandItem
										key={item.id}
										value={item.id}
										onSelect={() => {
											onSelect(item);
										}}
									>
										{item.name}
										<CheckIcon
											className={`ml-auto ${tools[item.id] ? "opacity-100" : "opacity-0"}`}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{!getToolbox.isLoading &&
							getToolbox.data.length > 0 && (
								<CommandGroup heading="All Tools">
									{getToolbox.data.map((item) => (
										<CommandItem
											key={item.id}
											value={item.id}
											onSelect={() => {
												onSelect({
													type: item.type,
													id: item.id,
													name: item.name,
												});
											}}
										>
											{item.name}
											<CheckIcon
												className={`ml-auto ${tools[item.id] ? "opacity-100" : "opacity-0"}`}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							)}

						{getToolbox.isLoading && (
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
