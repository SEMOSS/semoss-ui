import { Bot, ChevronDown } from "lucide-react";
import { type Ref, useCallback, useEffect, useRef, useState } from "react";
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
import { listTwins } from "@/features/digital-twin/api/digital-twin";
import { useMainTwin } from "@/features/digital-twin/use-main-twin";
import { useTwinRead } from "@/features/digital-twin/use-twin-read";
import type { InsightActions } from "@/lib/pixel";

interface ThreadAgentSelectProps {
	/** Current workspace id; blank is the person's own Digital Twin. */
	value: string;
	/** Who the chat is with, as the chat names them; retained when the catalog no longer lists the agent. */
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

/**
 * Choose who a chat is with: the person's own Digital Twin first, then the
 * authorized agent catalog Collaboration uses, where a twin says whose it is.
 */
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
	const twin = useMainTwin();
	const isTwinSelected = !value || value === twin.agentId;
	const label = name || (isTwinSelected ? twin.name : "Agent");
	// the seeded agent is the first row, under the twin's name: its own row would list it twice
	const agents = query.agents.filter((agent) => agent.id !== twin.agentId);
	const isPickerOpen = isOpen && !disabled;
	// Each opening reads whose twin a row is again. What the last one found stays until the new answer lands,
	// so the rows only grow a second line the first time.
	const [openings, setOpenings] = useState(0);
	// shortcut: two list reads each time the picker opens; have the agent list carry the owner if that shows
	const readTwins = useCallback(
		async (actions: InsightActions) =>
			openings > 0 ? listTwins(actions) : undefined,
		[openings],
	);
	const twins = useTwinRead(readTwins).data;
	const twinLines = new Map<string, string>([
		...(twins?.mine ?? []).map(
			(mine) => [mine.id, "A twin you share"] as const,
		),
		...(twins?.shared ?? []).map(
			(shared) =>
				[
					shared.id,
					shared.ownerName
						? `Shared by ${shared.ownerName}`
						: "Shared with you",
				] as const,
		),
	]);
	useEffect(() => {
		if (disabled) setIsOpen(false);
	}, [disabled]);
	const handleOpenChange = (isNextOpen: boolean) => {
		const isOpening = isNextOpen && !disabled;
		setIsOpen(isOpening);
		if (isOpening) setOpenings((count) => count + 1);
	};
	const handleSelect = (id: string, isSelected = false) => {
		if (disabled) return;
		if (!isSelected) onChange(id);
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
					// choosing the twin again changes nothing
					onSelect={() => handleSelect(twin.agentId, isTwinSelected)}
				>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="break-words">{twin.name}</span>
						{twin.name !== "Your Digital Twin" && (
							<span className="text-muted-foreground text-xs">
								Your Digital Twin
							</span>
						)}
					</span>
					{isTwinSelected && " · Selected"}
				</CommandItem>
				{agents.map((agent) => (
					<CommandItem
						key={agent.id}
						value={agent.id}
						disabled={disabled || query.isRefreshing}
						className="min-h-9 pointer-coarse:min-h-11"
						onSelect={() => handleSelect(agent.id)}
					>
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="break-words">{agent.name}</span>
							{twinLines.has(agent.id) && (
								<span className="break-words text-muted-foreground text-xs">
									{twinLines.get(agent.id)}
								</span>
							)}
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
				{!isLoading && !query.error && agents.length === 0 && (
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
				open={isPickerOpen}
				onOpenChange={handleOpenChange}
			>
				<DropdownMenuSubTrigger
					ref={props.triggerRef}
					disabled={disabled}
					onBlur={onBlur}
					aria-label={`Select agent: ${label}`}
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
		<Popover open={isPickerOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					ref={props.triggerRef}
					type="button"
					variant="outline"
					role="combobox"
					aria-label={`Talking To: ${label}`}
					aria-expanded={isPickerOpen}
					disabled={disabled}
					onBlur={onBlur}
					className={cn(
						"pointer-coarse:min-h-11 w-full min-w-0 justify-start",
						compact && "h-9 text-xs",
					)}
				>
					<Bot aria-hidden="true" />
					<span className="min-w-0 flex-1 truncate text-start">
						{label}
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
