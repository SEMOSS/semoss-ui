import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import {
	cn,
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

/** One routine in the list: its name, whether it is on, and how its last run went. */
export interface RoutineNavEntry {
	id: string;
	name: string;
	/** The icon on the routine's card, so the list and the open routine match. */
	icon: LucideIcon;
	/** Shows the icon as a 40px avatar, for icons that paint their own colored tile. */
	isAvatar?: boolean;
	/** Unknown until the routine has loaded. */
	enabled?: boolean;
	lastStatus?: "running" | "completed" | "failed" | null;
}

/** On or off, then a run in progress or a failed last run; a completed run is left to the detail. */
function EntryStatus({ entry }: { entry: RoutineNavEntry }) {
	// a blank line keeps the rows from shifting while the routines load
	if (entry.enabled === undefined) return "\u00a0";
	return (
		<span className="flex items-center gap-1.5">
			<span
				className={cn(
					"size-2 shrink-0 rounded-full",
					entry.enabled
						? "bg-success"
						: "border border-muted-foreground",
				)}
			/>
			{entry.enabled ? "On" : "Off"}
			{/* the leading spaces only reach the description; flex drops them on screen */}
			{entry.lastStatus === "running" && <span> · Running</span>}
			{entry.lastStatus === "failed" && (
				<span className="text-destructive"> · Last run failed</span>
			)}
		</span>
	);
}

interface RoutineNavProps {
	/** Names the list for assistive technology. */
	label: string;
	entries: RoutineNavEntry[];
	selected: string;
	onSelect: (id: string) => void;
	/** Shown under the list, such as a New routine button. */
	footer?: ReactNode;
}

/** The routines down the left; a select on narrow screens. */
export function RoutineNav({
	label,
	entries,
	selected,
	onSelect,
	footer,
}: RoutineNavProps) {
	const id = useId();
	return (
		<div className="flex min-w-0 flex-col gap-3">
			<div className="md:hidden">
				<Select value={selected} onValueChange={onSelect}>
					<SelectTrigger aria-label={label} className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{entries.map((entry) => (
							<SelectItem key={entry.id} value={entry.id}>
								{entry.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<nav aria-label={label} className="hidden md:block">
				<ul className="flex flex-col gap-1">
					{entries.map((entry) => {
						const isSelected = entry.id === selected;
						const Icon = entry.icon;
						return (
							<li key={entry.id}>
								<Item
									asChild
									size="sm"
									className={cn(
										"px-3",
										isSelected
											? "bg-accent"
											: "hover:bg-accent/50",
									)}
								>
									<button
										type="button"
										aria-current={
											isSelected ? "true" : undefined
										}
										aria-describedby={`${id}-${entry.id}`}
										onClick={() => onSelect(entry.id)}
										className="w-full cursor-pointer text-start"
									>
										{entry.isAvatar ? (
											<ItemMedia variant="image">
												<Icon
													aria-hidden="true"
													className="size-full"
												/>
											</ItemMedia>
										) : (
											<ItemMedia
												variant="icon"
												className={cn(
													"text-muted-foreground",
													isSelected &&
														"border-primary/20 bg-primary/10 text-primary",
												)}
											>
												<Icon aria-hidden="true" />
											</ItemMedia>
										)}
										<ItemContent className="min-w-0">
											<ItemTitle>{entry.name}</ItemTitle>
											{/* the status describes the button rather than names it */}
											<ItemDescription
												id={`${id}-${entry.id}`}
												aria-hidden="true"
												className={cn(
													"text-xs",
													// muted grey drops below 4.5:1 on the accent fill
													isSelected &&
														"text-accent-foreground/75",
												)}
											>
												<EntryStatus entry={entry} />
											</ItemDescription>
										</ItemContent>
									</button>
								</Item>
							</li>
						);
					})}
				</ul>
			</nav>
			{footer}
		</div>
	);
}
