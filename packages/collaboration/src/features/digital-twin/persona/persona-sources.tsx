import { ArrowRight } from "lucide-react";
import { useId, useState } from "react";
import { Button, Label, P, Switch } from "@semoss/ui/next";
import type { InterviewSource } from "./api/persona-interview";

const PLACES: { source: InterviewSource; label: string; hint: string }[] = [
	{
		source: "mail",
		label: "Mail you sent",
		hint: "Your own words in the last month of sent mail, without what you were replying to.",
	},
	{
		source: "teams",
		label: "Your Teams messages",
		hint: "What you wrote in your most recent chats. Usually your more casual voice.",
	},
	{
		source: "memory",
		label: "What the assistant has learned about you",
		hint: "How you like things done, as Collaboration saved it from your chats.",
	},
];

interface PersonaSourcesProps {
	/** Called with the places the owner allows, which may be none. */
	onStart: (sources: InterviewSource[]) => void;
}

/**
 * Before the interview: what it may read to learn how the owner writes.
 * Everything is on to begin with, and nothing is read before Start.
 */
export function PersonaSources({ onStart }: PersonaSourcesProps) {
	const [allowed, setAllowed] = useState<InterviewSource[]>(
		PLACES.map((place) => place.source),
	);
	const id = useId();

	return (
		<div className="flex min-w-0 max-w-2xl flex-col gap-6">
			<div className="flex flex-col gap-2">
				<P className="font-medium text-lg">May I read how you write?</P>
				<P className="max-w-prose text-muted-foreground text-sm">
					I start by reading a little of your own writing, so I can
					guess before I ask. Only your account is read, only now, and
					I keep my notes on how you write, never what I read. Switch
					off anything you would rather I skip.
				</P>
			</div>
			<ul className="flex min-w-0 flex-col gap-3">
				{PLACES.map((place) => (
					<li
						key={place.source}
						className="flex min-w-0 items-start gap-3 rounded-xl border bg-card p-4"
					>
						<Switch
							id={`${id}-${place.source}`}
							checked={allowed.includes(place.source)}
							aria-describedby={`${id}-${place.source}-hint`}
							className="mt-0.5"
							onCheckedChange={(isOn) =>
								setAllowed(
									isOn
										? [...allowed, place.source]
										: allowed.filter(
												(source) =>
													source !== place.source,
											),
								)
							}
						/>
						<div className="flex min-w-0 flex-col gap-1">
							<Label htmlFor={`${id}-${place.source}`}>
								{place.label}
							</Label>
							<P
								id={`${id}-${place.source}-hint`}
								className="text-muted-foreground text-sm"
							>
								{place.hint}
							</P>
						</div>
					</li>
				))}
			</ul>
			<P className="max-w-prose text-muted-foreground text-sm">
				It takes under ten minutes, and you can wrap up early. Nothing
				changes for your Digital Twins until you save what I write.
			</P>
			<Button
				type="button"
				className="pointer-coarse:min-h-11 self-start"
				onClick={() =>
					// in the order they are read, whatever order they were switched in
					onStart(
						PLACES.map((place) => place.source).filter((source) =>
							allowed.includes(source),
						),
					)
				}
			>
				{allowed.length > 0 ? "Start" : "Start without reading"}
				<ArrowRight aria-hidden="true" />
			</Button>
		</div>
	);
}
