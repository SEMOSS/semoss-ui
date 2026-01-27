import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Engine } from "@/types";

interface EngineSelectProps {
	/** css classes */
	className?: string;

	/** disabled */
	disabled?: boolean;

	/** Name of the selected engine */
	name: string;

	/** Id of the selected engine */
	value: string;

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
	className,
	disabled,
	name,
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
	 * Get all of the engines with lazy loading
	 */
	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			open
				? `MyEngines(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} ${engineTypes ? `engineTypes=${JSON.stringify(engineTypes)},` : ""} ${metaFilters ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} limit=[${limit}], offset=[${offset}]);`
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
		[
			open,
			debouncedSearch,
			JSON.stringify(engineTypes),
			JSON.stringify(metaFilters),
		],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getEngines.isLoading || !getEngines.hasMore || !open,
		onNext: () => {
			getEngines.next();
		},
	});

	return (
		<Popover open={open && !disabled} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						`w-full justify-between overflow-hidden`,
						className,
					)}
				>
					<span className="truncate">{name || "Select"}</span>
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
					<CommandList ref={(ele) => setScroll(ele)}>
						<CommandEmpty>
							{getEngines.isLoading &&
							getEngines.data.length === 0 ? (
								<div className="flex items-center justify-center py-4">
									<Spinner />
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
										className={`mr-2 size-4 ${value === engine.app_id ? "opacity-100" : "opacity-0"}`}
									/>
									<div className="flex flex-1 flex-col truncate">
										<span className="truncate">
											{engine.app_name}
										</span>
										{engine.description && (
											<span
												title={engine.description}
												className="truncate text-muted-foreground text-xs"
											>
												{engine.description}
											</span>
										)}
									</div>
								</CommandItem>
							))}
							{getEngines.isLoading &&
								getEngines.data.length > 0 && (
									<div className="flex items-center justify-center py-2">
										<Spinner className="size-4" />
									</div>
								)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
