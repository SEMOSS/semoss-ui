import { Braces, Check } from "lucide-react";
import { useState } from "react";
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
} from "@semoss/ui/next";
import type {
	AutomationScopeAccess,
	AutomationScopeEntry,
} from "../../domain/automation-inspector";

export interface AutomationScopeExplorerProps {
	entries: AutomationScopeEntry[];
	onSelect?: (
		entry: AutomationScopeEntry,
		access: AutomationScopeAccess,
	) => void;
}

type InsertMode = "recommended" | AutomationScopeAccess;

const GROUPS: Array<{
	source: AutomationScopeEntry["source"];
	heading: string;
}> = [
	{ source: "node", heading: "Prior step outputs" },
	{ source: "global", heading: "Automation inputs" },
	{ source: "runtime", heading: "Run metadata" },
];

/** Searchable view of the values available to a custom Python node. */
export function AutomationScopeExplorer({
	entries,
	onSelect,
}: AutomationScopeExplorerProps) {
	const [open, setOpen] = useState(false);
	const [insertMode, setInsertMode] = useState<InsertMode>("recommended");

	const selectEntry = (entry: AutomationScopeEntry) => {
		const access =
			insertMode === "recommended"
				? entry.availability === "conditional"
					? "optional"
					: "required"
				: insertMode;
		onSelect?.(entry, access);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="gap-1"
				>
					<Braces className="size-3.5" />
					Scope
					<span className="text-muted-foreground">
						{entries.length}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-0">
				<div>
					{onSelect && (
						<div className="space-y-2 border-b p-2">
							<p className="font-medium text-xs">Insert as</p>
							<div className="grid grid-cols-3 gap-1">
								{(
									[
										["recommended", "Recommended"],
										["required", "Required"],
										["optional", "Optional"],
									] as const
								).map(([mode, label]) => (
									<Button
										key={mode}
										type="button"
										size="sm"
										variant={
											insertMode === mode
												? "secondary"
												: "ghost"
										}
										aria-pressed={insertMode === mode}
										onClick={() => setInsertMode(mode)}
										className="px-1 text-xs"
									>
										{label}
									</Button>
								))}
							</div>
							<p className="text-muted-foreground text-xs">
								{insertMode === "recommended"
									? 'Uses scope["name"] unless a branch output may be missing.'
									: insertMode === "required"
										? 'Inserts scope["name"]; missing values raise an error.'
										: 'Inserts scope.get("name"); missing values return None.'}
							</p>
						</div>
					)}
					<Command>
						<CommandInput placeholder="Find a scope value…" />
						<CommandList>
							<CommandEmpty>
								No scope values available.
							</CommandEmpty>
							{GROUPS.map((group) => {
								const groupEntries = entries.filter(
									(entry) => entry.source === group.source,
								);
								if (groupEntries.length === 0) return null;
								return (
									<CommandGroup
										key={group.source}
										heading={group.heading}
									>
										{groupEntries.map((entry) => (
											<CommandItem
												key={`${entry.source}:${entry.name}`}
												value={`${entry.name} ${entry.label} ${entry.description}`}
												onSelect={() =>
													selectEntry(entry)
												}
												className="items-start gap-2"
											>
												{onSelect ? (
													<Check className="mt-0.5 size-3.5 text-primary" />
												) : (
													<Braces className="mt-0.5 size-3.5 text-muted-foreground" />
												)}
												<div className="min-w-0 flex-1">
													<code className="text-xs">
														{entry.name}
													</code>
													<p className="truncate text-muted-foreground text-xs">
														{entry.label} ·{" "}
														{entry.valueType
															? `${entry.valueType} · `
															: ""}
														{entry.availability}
													</p>
													{entry.description && (
														<p className="mt-1 line-clamp-2 break-all text-muted-foreground text-xs">
															{entry.description}
														</p>
													)}
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								);
							})}
						</CommandList>
					</Command>
				</div>
			</PopoverContent>
		</Popover>
	);
}
