import {
	CalendarDaysIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ListIcon,
} from "lucide-react";
import { type ReactNode, type Ref, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	H4,
	Muted,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	addLocalDays,
	formatDayHeading,
	formatShortDay,
	isSameLocalDay,
} from "../core/connector.format";
import type { ConnectorAccount } from "../core/connector.types";
import {
	type ConnectorCalendarDay as CalendarDay,
	type CalendarEventSchedule,
	type CalendarView,
	calendarDayKey,
} from "../core/connector-calendar";
import type { CalendarWindow } from "../core/use-calendar-window";
import type { ConnectorQuery } from "../core/use-connector-query";
import { ConnectorCalendarMonth } from "./connector-calendar-month";
import { ConnectorCalendarTimeline } from "./connector-calendar-timeline";
import { ConnectorIconButton } from "./connector-icon-button";
import { ConnectorViewerStatus } from "./connector-viewer-status";

const VIEWS: CalendarView[] = ["week", "day", "threeDays", "month"];
const isCalendarView = (value: string): value is CalendarView =>
	VIEWS.some((view) => view === value);

/** Calendar canvas and agenda, shared by providers. */
export interface ConnectorCalendarProps<T> {
	calendar: CalendarWindow;
	query: ConnectorQuery<CalendarDay<T>[]>;
	serviceName: string;
	account?: ConnectorAccount;
	onSignIn?: () => Promise<boolean>;
	focusRef?: Ref<HTMLDivElement>;
	limitNote?: string;
	getTitle: (event: T) => string;
	getEventKey: (event: T) => string;
	getEventLabel?: (event: T) => string;
	getSchedule?: (event: T) => CalendarEventSchedule;
	onOpenEvent: (event: T, itemKey: string) => void;
	renderEvent: (event: T, day: Date) => ReactNode;
}

/** Switch date spans and toggle between the calendar canvas and list view. */
export const ConnectorCalendar = <T,>({
	calendar,
	query,
	serviceName,
	account,
	onSignIn,
	focusRef,
	limitNote,
	getTitle,
	getEventKey,
	getEventLabel,
	getSchedule,
	onOpenEvent,
	renderEvent,
}: ConnectorCalendarProps<T>) => {
	const { t, i18n } = useTranslation("connectors");
	const [isGridOpen, setIsGridOpen] = useState(true);
	const gridId = useId();
	const days = query.data ?? [];
	const titles = new Map(
		days.map(({ day, events }) => [
			calendarDayKey(day),
			events.map(getTitle),
		]),
	);
	const selected = days.find(({ day }) =>
		isSameLocalDay(day, calendar.selectedDay),
	);
	const shownDays = isGridOpen
		? [{ day: calendar.selectedDay, events: selected?.events ?? [] }]
		: days.filter(
				({ day, events }) =>
					events.length > 0 &&
					(calendar.view !== "month" ||
						(day.getMonth() === calendar.month.getMonth() &&
							day.getFullYear() ===
								calendar.month.getFullYear())),
			);
	const label =
		calendar.view === "month"
			? calendar.month.toLocaleDateString(i18n.language, {
					month: "long",
					year: "numeric",
				})
			: calendar.view === "day"
				? formatDayHeading(calendar.selectedDay, i18n.language)
				: t("calendar.range", {
						start: formatShortDay(
							calendar.range.start,
							i18n.language,
						),
						end: formatShortDay(
							addLocalDays(calendar.range.end, -1),
							i18n.language,
						),
					});
	const isCanvasAvailable =
		query.status === "ready" || query.status === "loading";
	const isTimeline =
		isGridOpen && calendar.view !== "month" && isCanvasAvailable;
	return (
		<div
			ref={focusRef}
			dir={i18n.dir()}
			className="@container/calendar flex min-h-0 flex-1 flex-col"
		>
			<div className="flex shrink-0 flex-wrap items-center gap-x-2 border-border border-b bg-muted/10 px-2">
				<div className="flex min-w-0 flex-1 @lg/calendar:basis-0 basis-full items-center gap-1 py-1">
					<ConnectorIconButton
						icon={ChevronLeftIcon}
						isDirectional
						label={t(`calendar.previousView.${calendar.view}`)}
						onClick={() => calendar.move(-1)}
					/>
					<span
						title={label}
						aria-live="polite"
						className="min-w-0 flex-1 truncate text-center font-medium text-sm"
					>
						{label}
					</span>
					<ConnectorIconButton
						icon={ChevronRightIcon}
						isDirectional
						label={t(`calendar.nextView.${calendar.view}`)}
						onClick={() => calendar.move(1)}
					/>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 px-2 text-xs"
						onClick={calendar.today}
					>
						{t("calendar.today")}
					</Button>
				</div>
				<div className="ms-auto flex flex-wrap items-center justify-end gap-1 py-1">
					<Select
						value={calendar.view}
						onValueChange={(value) => {
							if (isCalendarView(value)) calendar.setView(value);
						}}
						dir={i18n.dir()}
					>
						<SelectTrigger
							size="sm"
							aria-label={t("calendar.view")}
							className="h-8 w-auto min-w-24 gap-2 bg-background text-xs shadow-none"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{VIEWS.map((view) => (
								<SelectItem key={view} value={view}>
									{t(`calendar.${view}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="min-w-32 text-xs shadow-none"
						aria-expanded={isGridOpen}
						aria-controls={
							isGridOpen && isCanvasAvailable ? gridId : undefined
						}
						onClick={() => setIsGridOpen((open) => !open)}
					>
						{isGridOpen ? (
							<ListIcon aria-hidden />
						) : (
							<CalendarDaysIcon aria-hidden />
						)}
						{t(
							isGridOpen
								? "calendar.listView"
								: "calendar.calendarView",
						)}
					</Button>
				</div>
			</div>
			{limitNote && query.status === "ready" ? (
				<Muted
					aria-live="polite"
					className="shrink-0 border-border border-b bg-muted/30 px-3 py-2 text-xs"
				>
					{limitNote}
				</Muted>
			) : null}
			{isTimeline ? (
				<div
					id={gridId}
					className="flex min-h-0 flex-1 flex-col"
					aria-busy={query.status === "loading" || undefined}
				>
					{!getSchedule ? (
						<Muted className="px-3 py-1 text-xs">
							{t("calendar.openForTime")}
						</Muted>
					) : null}
					{query.status === "loading" ? (
						<output className="px-3 py-1 text-muted-foreground text-xs">
							{t("common.loading")}
						</output>
					) : null}
					<ConnectorCalendarTimeline
						calendar={calendar}
						days={days}
						getTitle={getTitle}
						getEventKey={getEventKey}
						getEventLabel={getEventLabel}
						getSchedule={getSchedule}
						onOpenEvent={onOpenEvent}
					/>
				</div>
			) : (
				<ScrollArea className="[&>div>div]:block! min-h-0 flex-1">
					{isGridOpen && isCanvasAvailable ? (
						<div id={gridId}>
							<ConnectorCalendarMonth
								calendar={calendar}
								titles={titles}
							/>
						</div>
					) : null}
					{query.status !== "ready" ? (
						<ConnectorViewerStatus
							query={query}
							serviceName={serviceName}
							account={account}
							onSignIn={onSignIn}
						/>
					) : (
						<>
							{!isGridOpen ? (
								<H4 className="border-border border-b bg-muted px-3 py-2 font-medium text-xs">
									{t("calendar.agenda")}
								</H4>
							) : null}
							<ul>
								{shownDays.map(({ day, events }) => (
									<li key={calendarDayKey(day)}>
										<H4 className="sticky top-0 z-10 border-border border-b bg-muted px-3 py-2 font-medium text-xs">
											{formatDayHeading(
												day,
												i18n.language,
											)}
										</H4>
										{events.length ? (
											<ul>
												{events.map((event) =>
													renderEvent(event, day),
												)}
											</ul>
										) : (
											<Muted className="px-3 py-6 text-center text-sm">
												{t(
													limitNote
														? "calendar.noLoadedEvents"
														: "calendar.emptyDay",
												)}
											</Muted>
										)}
									</li>
								))}
							</ul>
							{shownDays.length === 0 ? (
								<Muted className="px-3 py-8 text-center">
									{t(
										limitNote
											? "calendar.noLoadedEvents"
											: "calendar.emptyRange",
									)}
								</Muted>
							) : null}
						</>
					)}
				</ScrollArea>
			)}
		</div>
	);
};
