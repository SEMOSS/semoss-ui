import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { useState } from "react";
import {
	Button,
	cn,
	FieldError,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Skeleton,
	ToggleGroup,
	ToggleGroupItem,
	z,
} from "@semoss/ui/next";
import {
	EVENT_PLANNING_MEETING_LIMIT,
	type MeetingPin,
	pinKey,
} from "./event-planning-schema";
import { useCalendarWindow } from "./use-calendar-window";

const eventsSchema = z.object({
	events: z.array(
		z.object({
			id: z.string().nullish(),
			subject: z.string().nullish(),
			start: z.string().nullish(),
			end: z.string().nullish(),
			seriesId: z.string().nullish(),
			showAs: z.string().nullish(),
			isCancelled: z.boolean().nullish(),
			isAllDay: z.boolean().nullish(),
		}),
	),
});

const HOUR_HEIGHT = 52;
/** Side-by-side columns in one time slot before the rest fold into "+N". */
const MAX_LANES = 3;
/** Blocks this long (focus time, travel, out of office) go in the strip, not the grid. */
const LONG_HOURS = 3;
const AWAY = new Set(["oof", "free", "workingElsewhere"]);

export interface PlanningCalendarEvent {
	id: string;
	pin: MeetingPin;
	start: Date;
	end: Date;
	/** Long or away blocks, shown above the grid and never planned. */
	block: boolean;
}

/** Each occurrence stays on the calendar; a recurring one plans as its series. */
export function planningCalendarEvents(
	listing: unknown,
): PlanningCalendarEvent[] {
	const parsed = eventsSchema.safeParse(listing);
	if (!parsed.success) return [];
	return parsed.data.events.flatMap((event) => {
		const title = event.subject?.replace(/\s+/g, " ").trim().slice(0, 120);
		const start = new Date(event.start ?? "");
		if (
			!event.id ||
			!title ||
			event.isAllDay ||
			event.isCancelled ||
			!Number.isFinite(start.getTime())
		)
			return [];
		const parsedEnd = new Date(event.end ?? "");
		const end =
			Number.isFinite(parsedEnd.getTime()) && parsedEnd > start
				? parsedEnd
				: new Date(start.getTime() + 30 * 60000);
		return [
			{
				id: event.id,
				pin: {
					kind: event.seriesId ? "series" : "event",
					id: event.seriesId || event.id,
					title,
				},
				start,
				end,
				block:
					AWAY.has(event.showAs ?? "") ||
					end.getTime() - start.getTime() >= LONG_HOURS * 3600000,
			},
		];
	});
}

interface Placed {
	event: PlanningCalendarEvent;
	lane: number;
	lanes: number;
}

/** Overlapping events sit side by side, up to MAX_LANES; the rest are returned as overflow. */
export function calendarEventLanes(events: PlanningCalendarEvent[]) {
	const placed: Placed[] = [];
	const overflow: { at: Date; events: PlanningCalendarEvent[] }[] = [];
	let group: { event: PlanningCalendarEvent; lane: number }[] = [];
	let ends: number[] = [];
	let until = 0;
	const flush = () => {
		const lanes = Math.min(ends.length, MAX_LANES);
		const hidden = group.filter((item) => item.lane >= MAX_LANES);
		for (const item of group)
			if (item.lane < MAX_LANES) placed.push({ ...item, lanes });
		if (hidden.length)
			overflow.push({
				at: hidden[0].event.start,
				events: hidden.map((item) => item.event),
			});
		group = [];
		ends = [];
	};
	for (const event of [...events].sort(
		(a, b) => a.start.getTime() - b.start.getTime(),
	)) {
		if (event.start.getTime() >= until) flush();
		let lane = ends.findIndex((end) => end <= event.start.getTime());
		if (lane < 0) lane = ends.length;
		ends[lane] = event.end.getTime();
		until = Math.max(...ends);
		group.push({ event, lane });
	}
	flush();
	return { placed, overflow };
}

type Filter = "recurring" | "all" | "selected";

interface EventPlanningCalendarProps {
	meetings: MeetingPin[];
	selectedKey: string;
	/** Adds the meeting when it is new, then opens it. */
	onChoose: (pin: MeetingPin) => void;
	error?: string;
}

/** A week of the owner's calendar for choosing which meetings to plan. */
export function EventPlanningCalendar({
	meetings,
	selectedKey,
	onChoose,
	error,
}: EventPlanningCalendarProps) {
	const [week, setWeek] = useState(0);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<Filter>("recurring");
	const [showWeekend, setShowWeekend] = useState(false);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const monday = -((today.getDay() + 6) % 7) + week * 7;
	const calendar = useCalendarWindow(7, monday);
	const days = Array.from({ length: 7 }, (_, index) => {
		const day = new Date(today);
		day.setDate(day.getDate() + monday + index);
		return day;
	});
	const visibleDays = showWeekend ? days : days.slice(0, 5);
	const gridStyle = {
		gridTemplateColumns: `3.5rem repeat(${visibleDays.length}, minmax(0, 1fr))`,
	};
	const chosen = new Set(meetings.map(pinKey));
	const all = planningCalendarEvents(calendar.listing).filter((event) =>
		event.pin.title.toLowerCase().includes(search.trim().toLowerCase()),
	);
	const blocks = all.filter((event) => event.block);
	const events = all.filter(
		(event) =>
			!event.block &&
			(filter === "all" ||
				(filter === "recurring"
					? event.pin.kind === "series" ||
						chosen.has(pinKey(event.pin))
					: chosen.has(pinKey(event.pin)))),
	);
	const hour = (date: Date) => date.getHours() + date.getMinutes() / 60;
	const firstHour = Math.max(
		0,
		Math.min(8, ...events.map((event) => Math.floor(hour(event.start)))),
	);
	const lastHour = Math.min(
		24,
		Math.max(
			18,
			...events.map((event) => Math.ceil(hour(event.end)) || 24),
		),
	);
	const hours = Array.from(
		{ length: lastHour - firstHour },
		(_, i) => firstHour + i,
	);
	const time = new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
	const dateLabel = new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
	});
	const full = meetings.length >= EVENT_PLANNING_MEETING_LIMIT;
	const top = (date: Date) => (hour(date) - firstHour) * HOUR_HEIGHT;

	const tile = (event: PlanningCalendarEvent, className?: string) => {
		const key = pinKey(event.pin);
		const selected = chosen.has(key);
		const disabled = !selected && full;
		return (
			<button
				key={event.id}
				type="button"
				disabled={disabled}
				onClick={() => onChoose(event.pin)}
				aria-pressed={selected}
				title={`${event.pin.title}\n${time.format(event.start)} - ${time.format(event.end)}${disabled ? "\nRemove a meeting to add another." : ""}`}
				className={cn(
					"overflow-hidden rounded-md border border-l-4 bg-background px-1.5 py-1 text-left text-xs leading-tight shadow-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
					event.pin.kind === "series"
						? "border-l-primary/40"
						: "border-l-muted-foreground/30",
					selected &&
						"border-primary/60 border-l-primary bg-primary/10 text-primary hover:bg-primary/15",
					key === selectedKey && "z-10 ring-2 ring-primary",
					className,
				)}
			>
				<span className="block truncate font-medium">
					{event.pin.title}
				</span>
				<span className="flex items-center gap-1 truncate text-muted-foreground">
					{time.format(event.start)}
					{event.pin.kind === "series" && (
						<Repeat
							className="size-3 shrink-0"
							aria-label="recurring"
						/>
					)}
				</span>
			</button>
		);
	};

	return (
		<section
			aria-label="Choose meetings from your calendar"
			className="flex min-w-0 flex-col gap-3"
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Previous week"
						disabled={week === 0}
						onClick={() => setWeek(week - 1)}
					>
						<ChevronLeft />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Next week"
						disabled={week === 3}
						onClick={() => setWeek(week + 1)}
					>
						<ChevronRight />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={week === 0}
						onClick={() => setWeek(0)}
					>
						This week
					</Button>
					<h3 className="ml-1 font-medium text-sm">
						{dateLabel.format(days[0])} -{" "}
						{dateLabel.format(days[6])}
					</h3>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<ToggleGroup
						type="single"
						variant="outline"
						size="sm"
						value={filter}
						onValueChange={(value) =>
							value && setFilter(value as Filter)
						}
						aria-label="Which events to show"
					>
						<ToggleGroupItem value="recurring">
							Recurring
						</ToggleGroupItem>
						<ToggleGroupItem value="all">All</ToggleGroupItem>
						<ToggleGroupItem value="selected">
							Selected ({meetings.length})
						</ToggleGroupItem>
					</ToggleGroup>
					<Input
						type="search"
						aria-label="Find a meeting"
						placeholder="Find a meeting"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="h-8 w-40"
					/>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						aria-pressed={showWeekend}
						onClick={() => setShowWeekend(!showWeekend)}
					>
						{showWeekend ? "Hide weekend" : "Weekend"}
					</Button>
				</div>
			</div>
			{calendar.status === "LOADING" ? (
				<>
					<Skeleton className="h-120 w-full" />
					<output className="sr-only">Loading calendar...</output>
				</>
			) : calendar.status === "ERROR" ? (
				<p className="rounded-md border p-6 text-sm">
					Your calendar could not be loaded. Your selected meetings
					are still listed above.
				</p>
			) : (
				<div className="max-h-160 overflow-auto rounded-lg border">
					<div className="min-w-160">
						<div
							className="sticky top-0 z-20 grid border-b bg-background"
							style={gridStyle}
						>
							<div />
							{visibleDays.map((day) => (
								<div
									key={day.toDateString()}
									className={cn(
										"border-l px-1 py-2 text-center text-xs",
										day.getTime() === today.getTime() &&
											"font-semibold text-primary",
									)}
								>
									{day.toLocaleDateString(undefined, {
										weekday: "short",
									})}{" "}
									<span className="text-sm">
										{day.getDate()}
									</span>
								</div>
							))}
							{blocks.length > 0 && (
								<>
									<div className="border-t px-1 py-1 text-[10px] text-muted-foreground">
										Long / away
									</div>
									{visibleDays.map((day) => (
										<div
											key={day.toDateString()}
											className="flex min-w-0 flex-col gap-0.5 border-t border-l p-0.5"
										>
											{blocks
												.filter(
													(event) =>
														event.start.toDateString() ===
														day.toDateString(),
												)
												.map((event) => (
													<span
														key={event.id}
														title={`${event.pin.title}\n${time.format(event.start)} - ${time.format(event.end)}`}
														className="truncate rounded bg-muted px-1 text-[11px] text-muted-foreground"
													>
														{event.pin.title}
													</span>
												))}
										</div>
									))}
								</>
							)}
						</div>
						<div className="grid" style={gridStyle}>
							<div>
								{hours.map((h) => (
									<div
										key={h}
										style={{ height: HOUR_HEIGHT }}
										className="-mt-1.5 pr-1 text-right text-[10px] text-muted-foreground"
									>
										{h === firstHour
											? ""
											: new Date(
													2000,
													0,
													1,
													h,
												).toLocaleTimeString(
													undefined,
													{ hour: "numeric" },
												)}
									</div>
								))}
							</div>
							{visibleDays.map((day) => {
								const { placed, overflow } = calendarEventLanes(
									events.filter(
										(event) =>
											event.start.toDateString() ===
											day.toDateString(),
									),
								);
								return (
									<div
										key={day.toDateString()}
										className={cn(
											"relative border-l",
											day.getTime() === today.getTime() &&
												"bg-primary/3",
										)}
										style={{
											height: hours.length * HOUR_HEIGHT,
										}}
									>
										{hours.map((h) => (
											<div
												key={h}
												className="pointer-events-none border-border/60 border-t"
												style={{ height: HOUR_HEIGHT }}
											/>
										))}
										{placed.map(
											({ event, lane, lanes }) => (
												<div
													key={event.id}
													className="absolute flex"
													style={{
														top:
															top(event.start) +
															1,
														height: Math.max(
															30,
															((event.end.getTime() -
																event.start.getTime()) /
																3600000) *
																HOUR_HEIGHT -
																2,
														),
														left: `calc(${(lane / lanes) * 100}% + 2px)`,
														width: `calc(${100 / lanes}% - 4px)`,
													}}
												>
													{tile(
														event,
														"h-full w-full",
													)}
												</div>
											),
										)}
										{overflow.map((more) => (
											<Popover
												key={more.at.toISOString()}
											>
												<PopoverTrigger asChild>
													<Button
														type="button"
														size="sm"
														variant="secondary"
														className="absolute right-0.5 z-10 h-5 px-1.5 text-[11px]"
														style={{
															top:
																top(more.at) +
																2,
														}}
														aria-label={`${more.events.length} more events`}
													>
														+{more.events.length}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="flex w-64 flex-col gap-1 p-2">
													{more.events.map((event) =>
														tile(event),
													)}
												</PopoverContent>
											</Popover>
										))}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
			{calendar.status === "SUCCESS" && !events.length && (
				<p className="text-muted-foreground text-sm">
					{filter === "recurring"
						? "No recurring meetings this week. Try All or another week."
						: "No meetings match this week."}
				</p>
			)}
			{calendar.listing?.hasMore && (
				<p className="text-muted-foreground text-xs">
					This week has more events than could be listed; some may be
					missing.
				</p>
			)}
			{error && <FieldError>{error}</FieldError>}
		</section>
	);
}
