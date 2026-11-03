import { useId, useState } from "react";
import {
	FieldDescription,
	FieldError,
	FieldLegend,
	FieldSet,
	H3,
	Input,
	Skeleton,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { AgendaIgnoredMeetings } from "./agenda-ignored-meetings";
import { AgendaMeetingList } from "./agenda-meeting-list";
import { type AgendaMeetingOption, meetingKey } from "./agenda-meeting-options";
import {
	isMediumMeeting,
	isPartialPinListing,
	MEDIUM_MEETING,
	type MeetingPinOption,
	meetingPinOptions,
} from "./event-planning-options";
import {
	EVENT_PLANNING_IGNORED_LIMIT,
	EVENT_PLANNING_MEETING_LIMIT,
	type MeetingPin,
	pinKey,
} from "./event-planning-schema";
import { useCalendarWindow } from "./use-calendar-window";

/** The window each run plans, matching the server's days_ahead input. */
const WINDOW_DAYS = 21;

interface EventPlanningPickerProps {
	/** Pinned meetings. */
	meetings: MeetingPin[];
	/** Meetings hidden from the lists. */
	ignored: MeetingPin[];
	/** Receives the pins after a change. */
	onMeetingsChange: (meetings: MeetingPin[]) => void;
	/** Receives the ignored meetings after a change. */
	onIgnoredChange: (ignored: MeetingPin[]) => void;
	/** Marks the field touched. */
	onBlur: () => void;
	/** Focus target for a validation error. */
	inputRef: (element: HTMLButtonElement | null) => void;
	/** Pins already saved, listed even when they are not on the calendar. */
	saved: readonly MeetingPin[];
	/** The field's validation message. */
	error?: string;
}

/**
 * The owner's meetings in the next 3 weeks to pin, in Recurring, One-time, and Ignored tabs. A series is pinned
 * by its series id and a one-off by its event id, so a rename keeps the pin.
 */
export function EventPlanningPicker({
	meetings,
	ignored,
	onMeetingsChange,
	onIgnoredChange,
	onBlur,
	inputRef,
	saved,
	error,
}: EventPlanningPickerProps) {
	const id = useId();
	const [filter, setFilter] = useState("");
	const [status, setStatus] = useState("");
	const calendar = useCalendarWindow(WINDOW_DAYS);
	const isLoading = calendar.status === "LOADING";
	const listing = calendar.listing;
	const needle = meetingKey(filter);
	const matches = (title: string) =>
		!needle || meetingKey(title).includes(needle);
	const hidden = new Set(ignored.map(pinKey));
	const chosen = new Set(meetings.map(pinKey));
	const pins = new Map<string, MeetingPin>();
	const toOption = ({
		pin,
		next,
		count,
	}: MeetingPinOption): AgendaMeetingOption => {
		pins.set(pinKey(pin), pin);
		return {
			title: pin.title,
			next,
			count,
			recurring: pin.kind === "series",
			key: pinKey(pin),
		};
	};
	const shown = meetingPinOptions(listing, saved).filter(
		(option) =>
			!hidden.has(pinKey(option.pin)) && matches(option.pin.title),
	);
	// 1:1s and very large meetings stay pinnable, in their own tab
	const medium = shown.filter(isMediumMeeting).map(toOption);
	const other = shown
		.filter((option) => option.next && !isMediumMeeting(option))
		.map(toOption);
	const missing = medium.filter((option) => !option.next);
	const recurring = medium.filter(
		(option) => option.next && option.recurring,
	);
	const oneTime = medium.filter((option) => option.next && !option.recurring);
	const when = new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
	const describe = (option: AgendaMeetingOption) =>
		!option.next
			? "Not on your calendar in the next 3 weeks"
			: option.count > 1
				? `Next ${when.format(new Date(option.next))}, ${option.count} in 3 weeks`
				: when.format(new Date(option.next));
	const without = (list: MeetingPin[], key: string) =>
		list.filter((pin) => pinKey(pin) !== key);
	const pinOf = (option: AgendaMeetingOption) =>
		pins.get(option.key ?? "") as MeetingPin;
	const ignoredShown = ignored.filter((pin) => matches(pin.title));
	const listProps = {
		chosen,
		describe,
		disabled: false,
		limitReached: chosen.size >= EVENT_PLANNING_MEETING_LIMIT,
		ignoreLimitReached: ignored.length >= EVENT_PLANNING_IGNORED_LIMIT,
		invalid: Boolean(error),
		onBlur,
		onToggle: (
			_title: string,
			checked: boolean,
			option: AgendaMeetingOption,
		) =>
			onMeetingsChange(
				checked
					? [...meetings, pinOf(option)]
					: without(meetings, option.key ?? ""),
			),
		onIgnore: (title: string, option: AgendaMeetingOption) => {
			const pin = pinOf(option);
			if (chosen.has(pinKey(pin))) {
				onMeetingsChange(without(meetings, pinKey(pin)));
			}
			onIgnoredChange([...ignored, pin]);
			setStatus(`${title} ignored. It is listed in the Ignored tab.`);
		},
	};
	// a validation error focuses the first checkbox shown; only the open tab's list is mounted
	const tabInputRef = missing.length ? undefined : inputRef;

	return (
		<FieldSet
			data-invalid={Boolean(error)}
			aria-describedby={error ? `${id}-error` : undefined}
			className="gap-4"
		>
			<FieldLegend variant="label">Meetings to plan</FieldLegend>
			<FieldDescription>
				Medium-sized meetings you run or present in. Each gets its own
				sheet.
			</FieldDescription>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<Input
					type="search"
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
					placeholder="Filter meetings"
					aria-label="Filter meetings"
					className="max-w-xs"
				/>
				<Small className="text-muted-foreground">
					{chosen.size} of {EVENT_PLANNING_MEETING_LIMIT} pinned
				</Small>
			</div>
			{isLoading ? (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<output className="sr-only">
						Loading your meetings...
					</output>
				</div>
			) : (
				<>
					{calendar.status === "ERROR" && (
						<Small className="text-muted-foreground">
							Your calendar could not be read. Meetings you
							already pinned are still listed.
						</Small>
					)}
					{missing.length > 0 && (
						<div className="flex flex-col gap-2">
							<H3 className="font-medium text-sm">
								Pinned, but not on your calendar
							</H3>
							<AgendaMeetingList
								{...listProps}
								label="Pinned meetings not on your calendar"
								emptyText=""
								options={missing}
								inputRef={inputRef}
							/>
						</div>
					)}
					<Tabs
						defaultValue={
							recurring.length || !oneTime.length
								? "recurring"
								: "oneTime"
						}
						className="gap-3"
					>
						<TabsList className="w-full sm:w-fit">
							<TabsTrigger value="recurring">
								Recurring ({recurring.length})
							</TabsTrigger>
							<TabsTrigger value="oneTime">
								One-time ({oneTime.length})
							</TabsTrigger>
							<TabsTrigger value="other">
								Other ({other.length})
							</TabsTrigger>
							<TabsTrigger value="ignored">
								Ignored ({ignoredShown.length})
							</TabsTrigger>
						</TabsList>
						<TabsContent value="recurring">
							<AgendaMeetingList
								{...listProps}
								label="Recurring meetings"
								emptyText={
									needle
										? "No recurring meetings match the filter."
										: "No recurring meetings in the next 3 weeks."
								}
								options={recurring}
								inputRef={tabInputRef}
							/>
						</TabsContent>
						<TabsContent value="oneTime">
							<AgendaMeetingList
								{...listProps}
								label="One-time meetings"
								emptyText={
									needle
										? "No one-time meetings match the filter."
										: "No one-time meetings in the next 3 weeks."
								}
								options={oneTime}
								inputRef={tabInputRef}
							/>
						</TabsContent>
						<TabsContent
							value="other"
							className="flex flex-col gap-2"
						>
							<Small className="text-muted-foreground">
								1:1s and meetings of more than{" "}
								{MEDIUM_MEETING.max} people. You can still pin
								one.
							</Small>
							<AgendaMeetingList
								{...listProps}
								label="Other meetings"
								emptyText={
									needle
										? "No other meetings match the filter."
										: "No other meetings in the next 3 weeks."
								}
								options={other}
								inputRef={tabInputRef}
							/>
						</TabsContent>
						<TabsContent value="ignored">
							<AgendaIgnoredMeetings
								titles={ignoredShown.map((pin) => pin.title)}
								keys={ignoredShown.map(pinKey)}
								total={ignored.length}
								disabled={false}
								onRestore={(title, index) => {
									const pin = ignoredShown[index];
									if (pin) {
										onIgnoredChange(
											without(ignored, pinKey(pin)),
										);
									}
									setStatus(`${title} restored.`);
								}}
							/>
						</TabsContent>
					</Tabs>
					{isPartialPinListing(listing) && (
						<Small className="text-muted-foreground">
							Showing your first 600 meetings in the next 3 weeks.
						</Small>
					)}
				</>
			)}
			{error && <FieldError id={`${id}-error`}>{error}</FieldError>}
			<output className="sr-only">{status}</output>
		</FieldSet>
	);
}
