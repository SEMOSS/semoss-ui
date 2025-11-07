import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
} from "@semoss/ui/next";
import type { Engine } from "@/types";

/** TODO: Move to @semoss/shared */

interface EngineSelectProps {
	/** Id of the engine to select */
	value: Engine | null;

	/** Update options on change */
	onChange: (value: Engine | null) => void;

	/** Types of engines to pre-filter on */
	engineTypes?: Engine["app_type"][];

	/** Metafilters to pre-filter on */
	metaFilters?: unknown[];

	/**
	 * Proprities for the popover content
	 */
	popoverContentProps?: React.ComponentProps<typeof PopoverContent>;
}

export const EngineSelect = ({
	value,
	onChange,
	engineTypes,
	metaFilters,
	popoverContentProps = {},
}: EngineSelectProps) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the engines
	 */
	const getEngines = usePixel<Engine[]>(
		open
			? `MyEngines(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} ${engineTypes ? `engineTypes=${JSON.stringify(engineTypes)},` : ""} ${metaFilters ? `metaFilters=${JSON.stringify(metaFilters)},` : ""} limit=[${10}], offset=[${0}]);`
			: "",
		{
			data: [],
		},
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between overflow-hidden"
				>
					<span className="truncate">
						{value ? value.app_name : "Select"}
					</span>
					<ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0" {...popoverContentProps}>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>
							{getEngines.status === "LOADING" ? (
								<div className="flex items-center justify-center py-4">
									<Spinner className="size-4" />
								</div>
							) : (
								"Not Found"
							)}
						</CommandEmpty>
						<CommandGroup>
							{getEngines.data.map((engine) => (
								<CommandItem
									key={engine.app_id}
									value={engine.app_id}
									onSelect={() => {
										onChange(engine);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={`mr-2 size-4 ${value?.app_id === engine.app_id ? "opacity-100" : "opacity-0"}`}
									/>
									<div className="flex flex-1 flex-col truncate">
										<span>{engine.app_name}</span>
										{/* {engine.description && (
											<span className="text-muted-foreground text-xs">
												{engine.description}
											</span>
										)} */}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
