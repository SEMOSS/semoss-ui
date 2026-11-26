import { Sparkles, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	FieldError,
	FormTextarea,
	Input,
	useFormContext,
	z,
} from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { callPixel, pixel } from "@/lib/pixel";
import type {
	EventPlanningSettings,
	MeetingPin,
} from "./event-planning-schema";

const MAX_TOPICS = 5;

const eventSchema = z.object({
	subject: z.string().nullish(),
	body: z.string().nullish(),
	attendees: z.array(z.object({ address: z.string().nullish() })).nullish(),
});
const suggestionsSchema = z.object({
	status: z.string().nullish(),
	items: z.array(
		z.object({ topicId: z.string(), name: z.string(), reason: z.string() }),
	),
});
type Suggestion = z.infer<typeof suggestionsSchema>["items"][number];

// one model call per meeting per page load
const cache = new Map<string, Promise<Suggestion[]>>();

/** Topic suggestions for a meeting from its title, agenda and attendees. */
function useTopicSuggestions(pin: MeetingPin, enabled: boolean) {
	const { actions } = useInsight();
	const [state, setState] = useState<{
		status: "IDLE" | "LOADING" | "DONE" | "ERROR";
		items: Suggestion[];
	}>({ status: "IDLE", items: [] });
	const key = `${pin.kind}:${pin.id}`;
	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		setState({ status: "LOADING", items: [] });
		let request = cache.get(key);
		if (!request) {
			request = (async () => {
				// a series reads as its master event, with the usual agenda and attendees
				const event = await callPixel(
					actions,
					pixel("MicrosoftCalendarGetEvent", {
						id: pin.id,
						maxBodyChars: 3000,
					}),
					eventSchema,
				).catch(() => null);
				const result = await callPixel(
					actions,
					pixel("WorkSuggestEventTopics", {
						title: event?.subject || pin.title,
						agenda: event?.body ?? "",
						attendees: (event?.attendees ?? []).flatMap((a) =>
							a.address ? [a.address] : [],
						),
					}),
					suggestionsSchema,
				);
				return result.items;
			})();
			cache.set(key, request);
			request.catch(() => cache.delete(key));
		}
		request.then(
			(items) => !cancelled && setState({ status: "DONE", items }),
			() => !cancelled && setState({ status: "ERROR", items: [] }),
		);
		return () => {
			cancelled = true;
		};
	}, [actions, enabled, key, pin.id, pin.title]);
	return state;
}

interface MeetingEditorProps {
	index: number;
	pin: MeetingPin;
	onRemove: () => void;
}

/** The selected meeting: what it should achieve and which topics it covers. */
export function EventPlanningMeetingEditor({
	index,
	pin,
	onRemove,
}: MeetingEditorProps) {
	const prefix = useId();
	const form = useFormContext<EventPlanningSettings>();
	const session = useOptionalCollaborationSession();
	const [search, setSearch] = useState("");
	const [asked, setAsked] = useState(false);
	const name = `meetings.${index}.topicIds` as const;
	const linked = form.watch(name);
	// never-tagged meetings get suggestions right away; tagged ones on request
	const suggestions = useTopicSuggestions(pin, linked === undefined || asked);
	const selected = linked ?? [];

	// first suggestions for an untagged meeting are applied; the owner can untick them
	useEffect(() => {
		if (suggestions.status === "DONE" && form.getValues(name) === undefined)
			form.setValue(
				name,
				suggestions.items
					.slice(0, MAX_TOPICS)
					.map((item) => item.topicId),
				{ shouldDirty: true },
			);
	}, [suggestions, form, name]);

	const topics = (session?.state.topics ?? []).filter(
		(topic) => topic.status === "active" || selected.includes(topic.id),
	);
	const reasons = new Map(
		suggestions.items.map((item) => [item.topicId, item.reason]),
	);
	const listed = [
		...suggestions.items.map((item) => ({
			id: item.topicId,
			name: item.name,
		})),
		...selected
			.filter((id) => !reasons.has(id))
			.map((id) => ({
				id,
				name: topics.find((topic) => topic.id === id)?.name ?? "Topic",
			})),
		...topics
			.filter(
				(topic) =>
					!reasons.has(topic.id) && !selected.includes(topic.id),
			)
			.filter((topic) =>
				topic.name.toLowerCase().includes(search.trim().toLowerCase()),
			),
	];
	const toggle = (id: string, on: boolean) =>
		form.setValue(
			name,
			on ? [...selected, id] : selected.filter((other) => other !== id),
			{ shouldDirty: true, shouldValidate: true },
		);

	return (
		<div className="flex min-w-0 flex-col gap-5">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="text-muted-foreground text-xs">
						{pin.kind === "series"
							? "Recurring series"
							: "One-time event"}
					</p>
					<h3 className="truncate font-semibold">{pin.title}</h3>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onRemove}
				>
					<X data-icon="inline-start" aria-hidden="true" />
					Remove
				</Button>
			</div>
			<FormTextarea
				key={`brief-${pin.id}`}
				name={`meetings.${index}.brief`}
				label="What is this meeting for?"
				description="Planning works toward this: the audience, what to show, decisions to get, what to skip."
				placeholder="For example: weekly status for the program leads; show finished work and raise blockers."
				rows={4}
				maxLength={2000}
			/>
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-2">
					<h4 className="font-medium text-sm">Topics it covers</h4>
					<span className="text-muted-foreground text-xs">
						{selected.length} of {MAX_TOPICS}
					</span>
				</div>
				<p className="text-muted-foreground text-sm">
					Lineups draw from these topics' goals, action items and
					recent mail first.
				</p>
				{suggestions.status === "LOADING" && (
					<p className="text-muted-foreground text-sm">
						<Sparkles
							className="mr-1 inline size-3.5"
							aria-hidden="true"
						/>
						Finding topics for this meeting...
					</p>
				)}
				{suggestions.status === "ERROR" && (
					<p className="text-muted-foreground text-sm">
						Topics could not be suggested; pick them below.
					</p>
				)}
				{suggestions.status === "IDLE" && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-fit"
						onClick={() => setAsked(true)}
					>
						<Sparkles data-icon="inline-start" aria-hidden="true" />
						Suggest topics
					</Button>
				)}
				<Input
					type="search"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					aria-label="Find a topic"
					placeholder="Find a topic"
					className="h-8"
				/>
				<div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
					{listed.map((topic) => {
						const checked = selected.includes(topic.id);
						const reason = reasons.get(topic.id);
						return (
							<label
								key={topic.id}
								htmlFor={`${prefix}-${topic.id}`}
								className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
							>
								<Checkbox
									id={`${prefix}-${topic.id}`}
									className="mt-0.5"
									checked={checked}
									disabled={
										!checked &&
										selected.length >= MAX_TOPICS
									}
									onCheckedChange={(on) =>
										toggle(topic.id, on === true)
									}
								/>
								<span className="min-w-0">
									<span className="flex items-center gap-1.5">
										{topic.name}
										{reason !== undefined && (
											<span className="rounded bg-primary/10 px-1 text-[10px] text-primary">
												Suggested
											</span>
										)}
									</span>
									{reason && (
										<span className="block text-muted-foreground text-xs">
											{reason}
										</span>
									)}
								</span>
							</label>
						);
					})}
					{listed.length === 0 && (
						<p className="py-2 text-muted-foreground text-sm">
							No topics yet. The meeting goal will guide planning.
						</p>
					)}
				</div>
				<FieldError>
					{form.formState.errors.meetings?.[index]?.topicIds?.message}
				</FieldError>
			</div>
		</div>
	);
}
