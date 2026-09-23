import { Plus, Sun, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
	Button,
	Checkbox,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { EmptyView } from "@/components/common/empty-view";
import { ActivityList } from "@/features/activity/components/activity-list";
import { AttentionCard } from "@/features/activity/components/attention-card";
import type {
	ActivityGroup,
	ActivityPeriod,
	ActivitySource,
} from "@/features/activity/types/activity";
import { createActivityRows } from "@/features/activity/utils/activity-rows";
import {
	selectAttention,
	selectFilteredActivity,
} from "@/features/activity/utils/activity-selectors";
import { AssignedDelegations } from "@/features/delegations/components/assigned-delegations";

export const HomePage = () => {
	const attentionHeadingId = useId();
	const activityHeadingId = useId();
	const sourceId = useId();
	const periodId = useId();
	const quietRunsId = useId();
	const { agents, sessions, openRoom, newRoom } = useMain();
	const [query, setQuery] = useState("");
	const [group, setGroup] = useState<ActivityGroup>("recent");
	const [source, setSource] = useState<ActivitySource>("all");
	const [period, setPeriod] = useState<ActivityPeriod>("7");
	const [showRoutine, setShowRoutine] = useState(false);
	const searchRef = useRef<HTMLInputElement>(null);
	const rows = createActivityRows(agents, sessions);
	const attention = selectAttention(rows);
	const activity = selectFilteredActivity(rows, {
		query,
		group,
		source,
		period,
		showRoutine,
	});
	const chiefOfStaff =
		agents.find((agent) => agent.id === "maya") ?? agents[0];
	useEffect(() => {
		function focusSearch(event: KeyboardEvent) {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k"
			) {
				event.preventDefault();
				searchRef.current?.focus();
			}
		}
		window.addEventListener("keydown", focusSearch);
		return () => window.removeEventListener("keydown", focusSearch);
	}, []);

	function clearSearch() {
		setQuery("");
		searchRef.current?.focus();
	}

	return (
		<div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/40">
			<main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="mt-3 flex items-center gap-2 font-semibold text-2xl leading-8">
							Good morning
							<Sun
								className="size-6 text-chart-4"
								aria-hidden="true"
							/>
						</h1>
						<p className="mt-2 text-muted-foreground text-sm">
							Your agents have been working. Here&apos;s where you
							come in.
						</p>
					</div>

					<Button
						size="sm"
						variant="default"
						onClick={() => newRoom()}
					>
						<Plus aria-hidden="true" />
						New session
					</Button>
				</div>

				<section
					aria-label="Workspace brief"
					className="mt-7 flex flex-col gap-4 rounded-lg border bg-accent p-5 sm:flex-row sm:items-center"
				>
					{chiefOfStaff && (
						<AgentAvatar agent={chiefOfStaff} size="lg" />
					)}
					<div className="min-w-0 flex-1">
						<p className="font-medium text-link text-xs">
							A note from {chiefOfStaff?.name ?? "your team"}
							{chiefOfStaff?.description
								? ` · ${chiefOfStaff.description}`
								: ""}
						</p>
						<h2 className="mt-1 font-semibold text-base">
							{attention.length}{" "}
							{attention.length === 1
								? "decision needs"
								: "decisions need"}{" "}
							your attention. The rest is moving.
						</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							Review what matters. Updates and follow-ups remain
							in the session that started them.
						</p>
					</div>
					<div className="shrink-0 border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
						<div>
							<strong className="block text-xl tabular-nums">
								{attention.length.toString().padStart(2, "0")}
							</strong>
							<span className="text-muted-foreground text-xs">
								need your call
							</span>
						</div>
					</div>
				</section>

				<AssignedDelegations />

				<section aria-labelledby={attentionHeadingId} className="mt-8">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<h2
							id={attentionHeadingId}
							className="flex items-center gap-2 font-semibold text-lg"
						>
							Needs your attention
							<span className="rounded-sm bg-chart-4/10 px-2 py-0.5 font-medium text-chart-4 text-xs">
								{attention.length}
							</span>
						</h2>
					</div>
					{attention.length ? (
						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
							{attention.slice(0, 3).map((row) => (
								<AttentionCard
									key={row.session.id}
									row={row}
									onOpen={openRoom}
								/>
							))}
						</div>
					) : (
						<div className="rounded-lg border bg-card">
							<EmptyView title="You're all caught up">
								New reviews and unread agent updates will appear
								here.
							</EmptyView>
						</div>
					)}
				</section>

				<section aria-labelledby={activityHeadingId} className="mt-8">
					<h2
						id={activityHeadingId}
						className="mb-4 font-semibold text-lg"
					>
						The latest, across your rooms
					</h2>
					<div className="overflow-hidden rounded-lg border bg-card">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
							<ToggleGroup
								aria-label="Group sessions"
								type="single"
								value={
									group === "recent"
										? "By recent activity"
										: "By agent"
								}
								onValueChange={(value) =>
									setGroup(
										value === "By agent"
											? "agent"
											: "recent",
									)
								}
								variant="outline"
								size="sm"
							>
								<ToggleGroupItem value="By recent activity">
									By recent activity
								</ToggleGroupItem>
								<ToggleGroupItem value="By agent">
									By agent
								</ToggleGroupItem>
							</ToggleGroup>
							<div className="flex flex-wrap items-center gap-2">
								<label htmlFor={sourceId} className="sr-only">
									Filter activity source
								</label>
								<Select
									value={source}
									onValueChange={(value) =>
										setSource(value as ActivitySource)
									}
								>
									<SelectTrigger id={sourceId}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											All activity
										</SelectItem>
										<SelectItem value="human">
											Human-started
										</SelectItem>
										<SelectItem value="automated">
											Automated &amp; hooks
										</SelectItem>
									</SelectContent>
								</Select>
								<label htmlFor={periodId} className="sr-only">
									Time range
								</label>
								<Select
									value={period}
									onValueChange={(value) =>
										setPeriod(value as ActivityPeriod)
									}
								>
									<SelectTrigger id={periodId}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7">
											Last 7 days
										</SelectItem>
										<SelectItem value="all">All</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						{activity.length ? (
							<ActivityList rows={activity} onOpen={openRoom} />
						) : (
							<EmptyView
								title={
									rows.length
										? "No matching activity"
										: "No activity yet"
								}
								action={
									query ? (
										<Button
											variant="outline"
											onClick={clearSearch}
										>
											<X />
											Clear search
										</Button>
									) : undefined
								}
							/>
						)}
						<div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
							<div className="flex items-center gap-2 text-sm">
								<Checkbox
									id={quietRunsId}
									checked={showRoutine}
									onCheckedChange={(checked) =>
										setShowRoutine(checked === true)
									}
								/>
								<label
									htmlFor={quietRunsId}
									className="cursor-pointer"
								>
									Show quiet background runs
								</label>
							</div>
							<output
								className="text-muted-foreground text-xs"
								aria-live="polite"
							>
								{activity.length}{" "}
								{activity.length === 1 ? "session" : "sessions"}{" "}
								shown
							</output>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
};
