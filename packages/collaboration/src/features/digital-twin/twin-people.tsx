import { useId, useRef, useState } from "react";
import { useConfig } from "@semoss/sdk/react";
import { type AddMembersCandidate, MembersTable } from "@semoss/shared";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Input,
	P,
} from "@semoss/ui/next";
import { formatLocalDateKey, parseLocalWallClock } from "@semoss/utility/date";
import { TwinInviteDialog } from "./twin-invite-dialog";
import { useTwinPeopleSource } from "./use-twin-people-source";

interface TwinPeopleProps {
	/** The owner's twin. */
	twin: { id: string; name: string };
}

/** The people given access last, until the owner leaves the page. */
interface AddedPeople {
	people: AddMembersCandidate[];
	/** The day their access ends, as it is shown; empty for no end. */
	endsOn: string;
	/** Whether a note went to them. */
	isTold: boolean;
}

/**
 * Who an owner's twin is shared with: the list, how long the people added
 * next keep their access, and a note to the ones just added.
 */
export function TwinPeople({ twin }: TwinPeopleProps) {
	const endsId = useId();
	const isDirectoryAvailable = useConfig(
		(config) => config.config?.msGraphLookup === true,
	);
	const [endDay, setEndDay] = useState("");
	const [added, setAdded] = useState<AddedPeople | null>(null);
	const [isInviteOpen, setIsInviteOpen] = useState(false);
	const tellRef = useRef<HTMLButtonElement>(null);
	const people = useTwinPeopleSource(twin.id, {
		accessEnds: endDay,
		onAdded: (list) =>
			setAdded({
				people: list,
				endsOn:
					parseLocalWallClock(endDay)?.toLocaleDateString(undefined, {
						dateStyle: "medium",
					}) ?? "",
				isTold: false,
			}),
	});
	const today = formatLocalDateKey(new Date());
	// day keys sort as dates
	const isPast = endDay !== "" && endDay < today;
	const names =
		added?.people.map(
			(person) => person.name || person.email || person.id,
		) ?? [];

	return (
		<>
			<P className="max-w-prose text-muted-foreground text-sm">
				The people who can chat with your Digital Twin. Each can also
				open the copies it holds and read its instructions. Only you see
				this list.
			</P>
			<Field data-invalid={isPast} className="max-w-md">
				<FieldLabel htmlFor={endsId}>Access ends</FieldLabel>
				<Input
					id={endsId}
					type="date"
					min={today}
					value={endDay}
					aria-invalid={isPast}
					aria-describedby={`${endsId}-hint${isPast ? ` ${endsId}-error` : ""}`}
					onChange={(event) => setEndDay(event.target.value)}
				/>
				<FieldDescription id={`${endsId}-hint`}>
					Optional. The people you add from now on keep their access
					until the end of this day. Leave it empty for access that
					does not end.
				</FieldDescription>
				{isPast && (
					<FieldError id={`${endsId}-error`}>
						This day has already passed. Choose today or a later
						day.
					</FieldError>
				)}
			</Field>
			{added && (
				<div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
					<output className="wrap-anywhere min-w-0 text-sm">
						{names.length > 2
							? `${names[0]} and ${names.length - 1} others`
							: names.join(" and ")}{" "}
						can chat with it now
						{added.endsOn ? `, until ${added.endsOn}` : ""}.{" "}
						{added.isTold
							? "You sent them a note."
							: "Nothing has been sent to them."}
					</output>
					<Button
						ref={tellRef}
						type="button"
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11 shrink-0"
						onClick={() => setIsInviteOpen(true)}
					>
						{added.isTold ? "Send again" : "Tell them"}
					</Button>
				</div>
			)}
			<MembersTable
				source={people}
				isDirectoryAvailable={isDirectoryAvailable}
			/>
			{added && isInviteOpen && (
				<TwinInviteDialog
					twin={twin}
					people={added.people}
					accessEnds={added.endsOn || undefined}
					returnFocusRef={tellRef}
					onClose={(isSent) => {
						setIsInviteOpen(false);
						if (isSent) setAdded({ ...added, isTold: true });
					}}
				/>
			)}
		</>
	);
}
