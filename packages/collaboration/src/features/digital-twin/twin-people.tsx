import { CalendarDays, ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useConfig } from "@semoss/sdk/react";
import { type AddMembersCandidate, MembersTable } from "@semoss/shared";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	H2,
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
			<div className="flex min-w-0 @3xl/twins:flex-row flex-col items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<H2 className="font-semibold text-xl tracking-tight">
						People with access
					</H2>
					<P className="max-w-prose text-muted-foreground text-sm">
						These people can chat with this twin and read its shared
						files and instructions. Only you see this list.
					</P>
				</div>
				<Collapsible className="@3xl/twins:w-auto w-full @3xl/twins:max-w-72">
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="group pointer-coarse:min-h-11"
						>
							<CalendarDays aria-hidden="true" />
							{endDay
								? `New access ends ${parseLocalWallClock(endDay)?.toLocaleDateString(undefined, { dateStyle: "medium" }) ?? endDay}`
								: "Set an end date"}
							<ChevronDown
								aria-hidden="true"
								className="group-data-[state=open]:rotate-180"
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="pt-3">
						<Field data-invalid={isPast} className="max-w-md">
							<FieldLabel htmlFor={endsId}>
								Access ends
							</FieldLabel>
							<Input
								id={endsId}
								type="date"
								min={today}
								value={endDay}
								aria-invalid={isPast}
								aria-describedby={`${endsId}-hint${isPast ? ` ${endsId}-error` : ""}`}
								onChange={(event) =>
									setEndDay(event.target.value)
								}
							/>
							<FieldDescription id={`${endsId}-hint`}>
								New people keep access until the end of this
								day. Leave blank for ongoing access.
							</FieldDescription>
							{isPast && (
								<FieldError id={`${endsId}-error`}>
									This day has already passed. Choose today or
									a later day.
								</FieldError>
							)}
						</Field>
					</CollapsibleContent>
				</Collapsible>
			</div>
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
