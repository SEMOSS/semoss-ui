import type { ReactNode } from "react";
import { useId } from "react";
import {
	Badge,
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";

/** One routine in the list: its name, whether it is on, and how its last run went. */
export interface RoutineNavEntry {
	id: string;
	name: string;
	/** Unknown until the routine has loaded. */
	enabled?: boolean;
	lastStatus?: "running" | "completed" | "failed" | null;
}

const LAST_RUN = {
	running: "Running",
	completed: "Last run completed",
	failed: "Last run failed",
} as const;

function EntryStatus({ entry }: { entry: RoutineNavEntry }) {
	return (
		<span className="flex flex-wrap items-center gap-1.5">
			{entry.enabled !== undefined && (
				<Badge variant={entry.enabled ? "outline" : "secondary"}>
					{entry.enabled ? "On" : "Off"}
				</Badge>
			)}
			{entry.lastStatus && (
				<Small
					className={cn(
						"text-muted-foreground",
						entry.lastStatus === "failed" && "text-destructive",
					)}
				>
					{LAST_RUN[entry.lastStatus]}
				</Small>
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
					{entries.map((entry) => (
						<li key={entry.id}>
							<button
								type="button"
								aria-current={
									entry.id === selected ? "true" : undefined
								}
								aria-describedby={`${id}-${entry.id}`}
								onClick={() => onSelect(entry.id)}
								className={cn(
									"flex w-full min-w-0 flex-col items-start gap-1 rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
									entry.id === selected &&
										"border-border bg-accent",
								)}
							>
								{/* the badges describe the button rather than name it */}
								<span className="w-full truncate font-medium">
									{entry.name}
								</span>
								<span
									id={`${id}-${entry.id}`}
									aria-hidden="true"
								>
									<EntryStatus entry={entry} />
								</span>
							</button>
						</li>
					))}
				</ul>
			</nav>
			{footer}
		</div>
	);
}
