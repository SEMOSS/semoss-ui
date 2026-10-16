import { useId, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
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
import { pixel } from "@/lib/pixel";
import { AgendaIgnoredMeetings } from "./agenda-ignored-meetings";
import { AgendaMeetingList } from "./agenda-meeting-list";
import {
	type AgendaMeetingOption,
	agendaMeetingOptions,
	isPartialListing,
	meetingKey,
} from "./agenda-meeting-options";
import {
	AGENDA_IGNORED_LIMIT,
	AGENDA_MEETING_LIMIT,
} from "./agenda-routine-schema";

/** The window each run prepares, matching the server's days_ahead input. */
const CALENDAR_PIXEL = pixel("MicrosoftCalendarListEvents", {
	days: 21,
	limit: 100,
});

interface AgendaMeetingPickerProps {
	/** Chosen meeting titles. */
	meetings: string[];
	/** Titles hidden from the lists. */
	ignored: string[];
	/** Receives the chosen titles after a change. */
	onMeetingsChange: (meetings: string[]) => void;
	/** Receives the ignored titles after a change. */
	onIgnoredChange: (ignored: string[]) => void;
	/** Marks the field touched. */
	onBlur: () => void;
	/** Focus target for a validation error. */
	inputRef: (element: HTMLButtonElement | null) => void;
	/** Titles already saved, listed even when they are not on the calendar. */
	saved: readonly string[];
	/** Locks every control while a save is pending. */
	disabled: boolean;
	/** The field's validation message. */
	error?: string;
}

/**
 * The owner's meetings in the next 3 weeks in Recurring, One-time, and Ignored tabs, each a short scrolling list,
 * with one filter across them.
 */
export function AgendaMeetingPicker({
	meetings,
	ignored,
	onMeetingsChange,
	onIgnoredChange,
	onBlur,
	inputRef,
	saved,
	disabled,
	error,
}: AgendaMeetingPickerProps) {
	const id = useId();
	const [filter, setFilter] = useState("");
	const [status, setStatus] = useState("");
	const calendar = usePixel<unknown>(CALENDAR_PIXEL);
	const isLoading =
		calendar.status === "INITIAL" || calendar.status === "LOADING";
	const listing = calendar.status === "SUCCESS" ? calendar.data : null;
	const needle = meetingKey(filter);
	const matches = (title: string) =>
		!needle || meetingKey(title).includes(needle);
	const hidden = new Set(ignored.map(meetingKey));
	const chosen = new Set(meetings.map(meetingKey));
	const options = agendaMeetingOptions(listing, saved).filter(
		(option) =>
			!hidden.has(meetingKey(option.title)) && matches(option.title),
	);
	const missing = options.filter((option) => !option.next);
	const recurring = options.filter(
		(option) => option.next && option.recurring,
	);
	const oneTime = options.filter(
		(option) => option.next && !option.recurring,
	);
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
				? `Next ${when.format(new Date(option.next))} · ${option.count} in 3 weeks`
				: when.format(new Date(option.next));
	const without = (list: string[], title: string) =>
		list.filter((meeting) => meetingKey(meeting) !== meetingKey(title));
	const ignoredShown = ignored.filter(matches);
	const listProps = {
		chosen,
		describe,
		disabled,
		limitReached: chosen.size >= AGENDA_MEETING_LIMIT,
		ignoreLimitReached: ignored.length >= AGENDA_IGNORED_LIMIT,
		invalid: Boolean(error),
		onBlur,
		onToggle: (title: string, checked: boolean) =>
			onMeetingsChange(
				checked ? [...meetings, title] : without(meetings, title),
			),
		onIgnore: (title: string) => {
			if (chosen.has(meetingKey(title))) {
				onMeetingsChange(without(meetings, title));
			}
			onIgnoredChange([...ignored, title]);
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
			<FieldLegend variant="label">Meetings to prepare</FieldLegend>
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
					{chosen.size} of {AGENDA_MEETING_LIMIT} chosen
				</Small>
			</div>
			{isLoading ? (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<output className="sr-only">Loading your meetings…</output>
				</div>
			) : (
				<>
					{calendar.status === "ERROR" && (
						<Small className="text-muted-foreground">
							Your calendar could not be read. Meetings you
							already chose are still listed.
						</Small>
					)}
					{missing.length > 0 && (
						<div className="flex flex-col gap-2">
							<H3 className="font-medium text-sm">
								Chosen, but not on your calendar
							</H3>
							<AgendaMeetingList
								{...listProps}
								label="Chosen meetings not on your calendar"
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
						<TabsContent value="ignored">
							<AgendaIgnoredMeetings
								titles={ignoredShown}
								total={ignored.length}
								disabled={disabled}
								onRestore={(title) => {
									onIgnoredChange(without(ignored, title));
									setStatus(`${title} restored.`);
								}}
							/>
						</TabsContent>
					</Tabs>
					{isPartialListing(listing) && (
						<Small className="text-muted-foreground">
							Showing your first 100 meetings in the next 3 weeks.
						</Small>
					)}
				</>
			)}
			{error && <FieldError id={`${id}-error`}>{error}</FieldError>}
			<output className="sr-only">{status}</output>
		</FieldSet>
	);
}
