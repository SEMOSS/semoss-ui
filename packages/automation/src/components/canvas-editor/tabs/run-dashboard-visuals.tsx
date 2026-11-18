import {
	CheckCircle2,
	Layers,
	Loader2,
	type LucideIcon,
	XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import type { RunStatus } from "../../../domain/automation.types";
import type { RunSummaryTotals } from "./run-dashboard-rows";

interface Tone {
	pill: string;
	dot: string;
	/** Left edge of a row, so a column of runs reads at a glance. */
	accent: string;
	label: { run: string; node: string };
	pulse?: boolean;
}

const MUTED_TONE = {
	pill: "bg-muted text-muted-foreground ring-border",
	dot: "bg-muted-foreground",
	accent: "border-l-muted-foreground/40",
};

const TONES: Record<string, Tone> = {
	SUCCESS: {
		pill: "bg-success/10 text-success ring-success/25",
		dot: "bg-success",
		accent: "border-l-success",
		label: { run: "Success", node: "Done" },
	},
	FAILED: {
		pill: "bg-destructive/10 text-destructive ring-destructive/25",
		dot: "bg-destructive",
		accent: "border-l-destructive",
		label: { run: "Failure", node: "Failed" },
	},
	RUNNING: {
		pill: "bg-primary/10 text-primary ring-primary/25",
		dot: "bg-primary",
		accent: "border-l-primary",
		label: { run: "Running", node: "Running" },
		pulse: true,
	},
	WAITING_FOR_INPUT: {
		pill: "bg-warning/10 text-warning ring-warning/30",
		dot: "bg-warning",
		accent: "border-l-warning",
		label: { run: "Needs input", node: "Needs input" },
		pulse: true,
	},
	INTERRUPTED: {
		pill: "bg-warning/10 text-warning ring-warning/30",
		dot: "bg-warning",
		accent: "border-l-warning",
		label: { run: "Interrupted", node: "Interrupted" },
	},
	CANCELLED: {
		...MUTED_TONE,
		label: { run: "Cancelled", node: "Cancelled" },
	},
	SKIPPED: {
		...MUTED_TONE,
		label: { run: "Skipped", node: "Skipped" },
	},
	PENDING: {
		...MUTED_TONE,
		label: { run: "Waiting", node: "Waiting" },
	},
};

function toneFor(status: string): Tone {
	return TONES[status] ?? TONES.PENDING;
}

/** Colour of a row's left edge for a status. */
export function statusAccent(status: string): string {
	return toneFor(status).accent;
}

/** A status as a soft pill with a live dot: it pulses while a run is working or waiting. */
export function StatusPill({
	status,
	kind,
}: {
	status: string;
	kind: "run" | "node";
}) {
	const tone = toneFor(status);
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-xs leading-none ring-1 ring-inset",
				tone.pill,
			)}
		>
			<span className="relative flex size-1.5">
				{tone.pulse ? (
					<span
						className={cn(
							"absolute inline-flex size-full animate-ping rounded-full opacity-70",
							tone.dot,
						)}
					/>
				) : null}
				<span
					className={cn(
						"relative inline-flex size-1.5 rounded-full",
						tone.dot,
					)}
				/>
			</span>
			{tone.label[kind]}
		</span>
	);
}

interface StatCard {
	key: string;
	label: string;
	value: ReactNode;
	caption?: string;
	icon: LucideIcon;
	/** Token colour classes for the icon chip and for the ring shown while filtering by it. */
	chip: string;
	ring: string;
	/** Statuses ticked in the filter when the card is clicked; none for a card that only informs. */
	statuses?: RunStatus[];
	/** Clicking the card does this instead; set only for a card that is not a status filter. */
	onClick?: () => void;
}

function cardsFor(
	totals: RunSummaryTotals,
	showing: number,
	overall: number,
	filtersActive: boolean,
	onClearFilters: () => void,
): StatCard[] {
	return [
		{
			key: "total",
			label: "Runs showing",
			value: showing.toLocaleString(),
			caption: filtersActive
				? `of ${overall.toLocaleString()} · click to clear filters`
				: "All messages",
			icon: Layers,
			chip: "bg-primary/10 text-primary",
			ring: "ring-primary/40",
			onClick: filtersActive ? onClearFilters : undefined,
		},
		{
			key: "success",
			label: "Succeeded",
			value: totals.succeeded.toLocaleString(),
			caption: "Click to filter",
			icon: CheckCircle2,
			chip: "bg-success/10 text-success",
			ring: "ring-success/50",
			statuses: ["SUCCESS"],
		},
		{
			key: "failed",
			label: "Failed",
			value: totals.failed.toLocaleString(),
			caption: "Click to filter",
			icon: XCircle,
			chip: "bg-destructive/10 text-destructive",
			ring: "ring-destructive/50",
			statuses: ["FAILED"],
		},
		{
			key: "progress",
			label: "In progress",
			value: totals.inProgress.toLocaleString(),
			caption: "Running or waiting",
			icon: Loader2,
			chip: "bg-primary/10 text-primary",
			ring: "ring-primary/50",
			statuses: ["RUNNING", "WAITING_FOR_INPUT"],
		},
	];
}

const CARD_BASE =
	"relative overflow-hidden rounded-xl border bg-card p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/**
 * Headline numbers for the runs on the page. Cards for an outcome double as filters:
 * clicking one ticks that outcome in the status filter, and clicking again clears it.
 */
export function RunStatsStrip({
	totals,
	showing,
	overall,
	filtersActive,
	onClearFilters,
	statusFilters,
	onToggleGroup,
}: {
	/** Outcome counts for the runs every filter but status lets through. */
	totals: RunSummaryTotals;
	/** Runs the list is showing now, with every filter applied. */
	showing: number;
	/** Every run loaded, before any filter. */
	overall: number;
	filtersActive: boolean;
	onClearFilters: () => void;
	statusFilters: ReadonlySet<RunStatus>;
	onToggleGroup: (statuses: RunStatus[]) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-3 border-b bg-muted/30 px-4 py-4 md:grid-cols-4">
			{cardsFor(
				totals,
				showing,
				overall,
				filtersActive,
				onClearFilters,
			).map((card) => {
				const Icon = card.icon;
				const active =
					card.statuses?.every((status) =>
						statusFilters.has(status),
					) ?? false;
				const content = (
					<>
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{card.label}
								</p>
								<p className="mt-1 font-semibold text-2xl tabular-nums leading-none tracking-tight">
									{card.value}
								</p>
							</div>
							<span
								className={cn(
									"flex size-8 shrink-0 items-center justify-center rounded-lg",
									card.chip,
								)}
							>
								<Icon
									className={cn(
										"size-4",
										card.key === "progress" &&
											totals.inProgress > 0 &&
											"animate-spin",
									)}
									aria-hidden
								/>
							</span>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							{card.caption}
						</p>
					</>
				);
				if (card.statuses === undefined) {
					const onClick = card.onClick;
					if (onClick === undefined) {
						return (
							<div key={card.key} className={CARD_BASE}>
								{content}
							</div>
						);
					}
					return (
						<button
							key={card.key}
							type="button"
							onClick={onClick}
							className={cn(
								CARD_BASE,
								"cursor-pointer hover:bg-accent",
							)}
						>
							{content}
						</button>
					);
				}
				const statuses = card.statuses;
				return (
					<button
						key={card.key}
						type="button"
						aria-pressed={active}
						onClick={() => onToggleGroup(statuses)}
						className={cn(
							CARD_BASE,
							"cursor-pointer hover:bg-accent",
							active && ["ring-2", card.ring],
						)}
					>
						{content}
					</button>
				);
			})}
		</div>
	);
}

/** A friendly stand-in for a list with nothing to show. */
export function DashboardEmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center">
			<span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<Icon className="size-6" aria-hidden />
			</span>
			<div>
				<p className="font-semibold text-sm">{title}</p>
				<p className="mt-1 max-w-sm text-muted-foreground text-xs">
					{description}
				</p>
			</div>
		</div>
	);
}
