import { CheckIcon, ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
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
} from "@semoss/ui/next";
import { AGENT_RUN_FILTER_OPTION_LIMIT } from "@/api/agent-runs";
import { useAgentRunFilterOptions } from "./use-agent-run-filter-options";

/** The list's value for the choice that clears the filter */
const ALL_VALUE = "__all__";

/** The chosen item's highlight */
const CHOSEN_CLASS = "bg-primary/10 data-[selected=true]:bg-primary/15";

export interface AgentRunFilterSelectProps<T> {
	/** What the filter chooses, such as "Agent", shown before the choice */
	label: string;
	/** The choice that clears the filter, such as "All agents" */
	allLabel: string;
	/** The chosen option's name, or null when the filter is clear */
	selectedLabel: string | null;
	/** The chosen option's key, or null when the filter is clear */
	selectedKey: string | null;
	/** Reads the options for a search; the same function each render */
	loadOptions: (search: string) => Promise<T[]>;
	/** A key unique to each option */
	getOptionKey: (option: T) => string;
	/** How an option is shown in the list */
	renderOption: (option: T) => ReactNode;
	/** Called with the option chosen, or null for the choice that clears the filter */
	onSelect: (option: T | null) => void;
	/** The list's search box placeholder */
	searchPlaceholder: string;
}

/**
 * A filter of the admin Agent Runs page that picks one agent or one user from
 * a searchable list, read from the backend as the list opens and as the search
 * changes. The button shows the filter's name and its choice.
 */
export const AgentRunFilterSelect = <T,>({
	label,
	allLabel,
	selectedLabel,
	selectedKey,
	loadOptions,
	getOptionKey,
	renderOption,
	onSelect,
	searchPlaceholder,
}: AgentRunFilterSelectProps<T>) => {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const { options, isLoading, error } = useAgentRunFilterOptions(
		loadOptions,
		search,
		isOpen,
	);
	const isSearching = search.trim() !== "";

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setSearch("");
		}
	};

	const choose = (option: T | null) => {
		onSelect(option);
		handleOpenChange(false);
	};

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={isOpen}
					aria-label={`${label}: ${selectedLabel ?? allLabel}`}
					className="w-full min-w-0 justify-between sm:w-56"
				>
					<span className="flex min-w-0 items-center gap-1.5">
						<span className="shrink-0 text-muted-foreground">
							{label}:
						</span>
						<span className="truncate">
							{selectedLabel ?? allLabel}
						</span>
					</span>
					<ChevronDown
						aria-hidden="true"
						className="size-4 shrink-0 opacity-70"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-72 p-0">
				<Command shouldFilter={false} label={searchPlaceholder}>
					<CommandInput
						placeholder={searchPlaceholder}
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						{isLoading || error ? null : (
							<CommandEmpty>No matches</CommandEmpty>
						)}
						<CommandGroup>
							{isSearching ? null : (
								<CommandItem
									value={ALL_VALUE}
									onSelect={() => choose(null)}
									className={cn(
										selectedKey === null && CHOSEN_CLASS,
									)}
								>
									<span className="flex-1 truncate">
										{allLabel}
									</span>
									{selectedKey === null ? (
										<CheckIcon
											aria-hidden="true"
											className="size-4 shrink-0 text-primary"
										/>
									) : null}
								</CommandItem>
							)}
							{options.map((option) => {
								const key = getOptionKey(option);
								const isChosen = key === selectedKey;
								return (
									<CommandItem
										key={key}
										value={key}
										onSelect={() => choose(option)}
										className={cn(isChosen && CHOSEN_CLASS)}
									>
										<span className="min-w-0 flex-1">
											{renderOption(option)}
										</span>
										{isChosen ? (
											<CheckIcon
												aria-hidden="true"
												className="size-4 shrink-0 text-primary"
											/>
										) : null}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
					{isLoading && options.length === 0 ? (
						<output className="flex items-center justify-center gap-2 px-3 py-3 text-muted-foreground text-sm">
							<Spinner className="size-4" />
							Loading...
						</output>
					) : null}
					{error ? (
						<p
							role="alert"
							className="px-3 py-3 text-destructive text-sm"
						>
							{error}
						</p>
					) : null}
					{!isSearching &&
					options.length >= AGENT_RUN_FILTER_OPTION_LIMIT ? (
						<p className="px-3 py-2 text-muted-foreground text-xs">
							Showing the most recently active. Search to find
							others.
						</p>
					) : null}
				</Command>
			</PopoverContent>
		</Popover>
	);
};
