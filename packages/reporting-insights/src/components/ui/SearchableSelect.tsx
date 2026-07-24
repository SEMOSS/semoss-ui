/**
 * SearchableSelect — a searchable single-select, now built on the shared
 * @semoss/ui Popover + Command combobox (renders in a portal, so it never clips
 * in overflow/narrow containers). Same props as before so call sites don't change.
 */

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
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
} from "@semoss/ui/next";

export interface SelectOption {
	value: string;
	label: string;
}

interface SearchableSelectProps {
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
	placeholder?: string;
	/** Show the search box (default true). */
	searchable?: boolean;
	/** Classes for the trigger (so callers control sizing/typography). */
	className?: string;
	ariaLabel?: string;
	disabled?: boolean;
}

export function SearchableSelect({
	value,
	options,
	onChange,
	placeholder = "Select…",
	searchable = true,
	className,
	ariaLabel,
	disabled = false,
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);
	const current = options.find((o) => o.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					aria-label={ariaLabel}
					disabled={disabled}
					className={cn(
						"w-full justify-between font-normal",
						className,
					)}
				>
					<span
						className={cn(
							"truncate",
							!current && "text-muted-foreground",
						)}
					>
						{current?.label ?? placeholder}
					</span>
					<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[var(--radix-popover-trigger-width)] min-w-[10rem] p-0"
			>
				<Command>
					{searchable && <CommandInput placeholder="Search…" />}
					<CommandList>
						<CommandEmpty>No matches</CommandEmpty>
						<CommandGroup>
							{options.map((o) => (
								<CommandItem
									key={o.value}
									value={o.label}
									onSelect={() => {
										onChange(o.value);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											o.value === value
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									<span className="truncate">{o.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
