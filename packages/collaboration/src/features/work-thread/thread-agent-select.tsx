import { Bot, ChevronDown } from "lucide-react";
import { type Ref, useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Command,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
} from "@semoss/ui/next";
import { useAgentDirectory } from "@/features/agents/api/use-agent-directory";

interface ThreadAgentSelectProps {
	/** Current workspace id; blank uses the built-in assistant. */
	value: string;
	/** Resolved agent name, retained when the catalog no longer lists it. */
	name: string;
	disabled: boolean;
	/** Match the conversation toolbar while preserving touch target size. */
	compact?: boolean;
	onBlur?: () => void;
	onChange: (id: string) => void;
}

type ThreadAgentSelectPresentation =
	| {
			presentation?: "field";
			/** Connect the field trigger to form focus handling. */
			triggerRef?: Ref<HTMLButtonElement>;
	  }
	| {
			presentation: "menu";
			/** Restore focus to the submenu row after saving. */
			triggerRef?: Ref<HTMLDivElement>;
	  };

/** Search the same authorized agent catalog used by Collaboration. */
export function ThreadAgentSelect(
	props: ThreadAgentSelectProps & ThreadAgentSelectPresentation,
) {
	const { value, name, disabled, compact = false, onBlur, onChange } = props;
	const [isOpen, setIsOpen] = useState(false);
	const isMenu = props.presentation === "menu";
	const searchRef = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState("");
	const query = useAgentDirectory(useDebouncedValue(search));
	const isLoading = query.isLoading || (query.isRefreshing && !query.error);
	useEffect(() => {
		if (disabled) setIsOpen(false);
	}, [disabled]);
	const handleSelect = (id: string) => {
		if (disabled) return;
		onChange(id);
		setIsOpen(false);
	};
	const catalog = (
		<Command
			shouldFilter={false}
			label="Search agents"
			onKeyDown={(event) => {
				// Keep search typing and list navigation out of menu typeahead.
				if (isMenu && event.key !== "Escape") event.stopPropagation();
			}}
		>
			<CommandInput
				ref={searchRef}
				autoFocus={isMenu}
				aria-label="Search agents"
				placeholder="Search agents…"
				value={search}
				onValueChange={setSearch}
				disabled={disabled}
			/>
			<CommandList>
				<CommandItem
					value="builtin"
					disabled={disabled}
					className="min-h-9 pointer-coarse:min-h-11"
					onSelect={() => handleSelect("")}
				>
					Assistant{!value && " · Selected"}
				</CommandItem>
				{query.agents.map((agent) => (
					<CommandItem
						key={agent.id}
						value={agent.id}
						disabled={disabled || query.isRefreshing}
						className="min-h-9 pointer-coarse:min-h-11"
						onSelect={() => handleSelect(agent.id)}
					>
						<span className="min-w-0 flex-1 break-words">
							{agent.name}
						</span>
						{agent.id === value && " · Selected"}
					</CommandItem>
				))}
				{isLoading && (
					<Spinner className="m-4" aria-label="Loading agents" />
				)}
				{query.error && (
					<Alert variant="destructive">
						<AlertDescription>
							Could not load agents.
							<Button
								type="button"
								variant="outline"
								disabled={disabled || query.isLoading}
								onClick={query.reset}
							>
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}
				{!isLoading && !query.error && query.agents.length === 0 && (
					<CommandItem disabled>No matching agents</CommandItem>
				)}
				{query.hasMore && (
					<CommandItem
						disabled={disabled || isLoading}
						className="min-h-9 pointer-coarse:min-h-11"
						onSelect={() => {
							if (!disabled && !isLoading) query.next();
						}}
					>
						Load more agents
					</CommandItem>
				)}
			</CommandList>
		</Command>
	);
	if (props.presentation === "menu") {
		return (
			<DropdownMenuSub
				open={isOpen && !disabled}
				onOpenChange={(open) => setIsOpen(open && !disabled)}
			>
				<DropdownMenuSubTrigger
					ref={props.triggerRef}
					disabled={disabled}
					onBlur={onBlur}
					aria-label={`Select agent: ${name || "Assistant"}`}
					className="pointer-coarse:min-h-11"
				>
					<Bot aria-hidden="true" />
					Select agent
				</DropdownMenuSubTrigger>
				<DropdownMenuPortal>
					<DropdownMenuSubContent
						aria-label="Select agent"
						className="w-72 max-w-(--radix-dropdown-menu-content-available-width) p-0"
						onFocus={(event) => {
							if (event.target === event.currentTarget)
								searchRef.current?.focus();
						}}
					>
						{catalog}
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		);
	}
	return (
		<Popover
			open={isOpen && !disabled}
			onOpenChange={(open) => setIsOpen(open && !disabled)}
		>
			<PopoverTrigger asChild>
				<Button
					ref={props.triggerRef}
					type="button"
					variant="outline"
					role="combobox"
					aria-label={`Agent: ${name || "Assistant"}`}
					aria-expanded={isOpen && !disabled}
					disabled={disabled}
					onBlur={onBlur}
					className={cn(
						"pointer-coarse:min-h-11 w-full min-w-0 justify-start",
						compact && "h-9 text-xs",
					)}
				>
					<Bot aria-hidden="true" />
					<span className="min-w-0 flex-1 truncate text-start">
						{name || "Assistant"}
					</span>
					<ChevronDown aria-hidden="true" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				aria-label="Select agent"
				className="w-72 max-w-(--radix-popover-content-available-width) p-0"
			>
				{catalog}
			</PopoverContent>
		</Popover>
	);
}
