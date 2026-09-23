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
import type { AutomationScopeEntry } from "../../domain/automation-inspector";

export interface AutomationScopeExplorerProps {
	entries: AutomationScopeEntry[];
	onSelect?: (entry: AutomationScopeEntry) => void;
}

/** Searchable view of the values available to a custom Python node. */
export function AutomationScopeExplorer({
	entries,
	onSelect,
}: AutomationScopeExplorerProps) {
	const [open, setOpen] = useState(false);
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
				<Command>
					<CommandInput placeholder="Find a scope value…" />
					<CommandList>
						<CommandEmpty>No upstream scope values.</CommandEmpty>
						<CommandGroup heading="Available to this node">
							{entries.map((entry) => (
								<CommandItem
									key={`${entry.source}:${entry.name}`}
									value={`${entry.name} ${entry.label} ${entry.description}`}
									onSelect={() => {
										onSelect?.(entry);
										setOpen(false);
									}}
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
											{entry.label} · {entry.availability}
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
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
