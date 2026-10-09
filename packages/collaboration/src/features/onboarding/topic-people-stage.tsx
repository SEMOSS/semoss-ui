import { Plus, X } from "lucide-react";
import { useState } from "react";
import {
	Button,
	cn,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import type { OnboardingPerson } from "./onboarding-api";
import { type TopicPerson, topicPeople } from "./topic-flow-utils";
import { TopicPeoplePicker } from "./topic-people-picker";
import type { TopicReview, TopicReviewDraft } from "./topic-review-api";

interface TopicPeopleStageProps {
	actions: InsightActions;
	review: TopicReview;
	values: TopicReviewDraft;
	/** Kept topics, in the order the owner saw them. */
	keys: string[];
	contacts: OnboardingPerson[];
	addedNames: Record<string, string>;
	isBusy: boolean;
	onAdd: (key: string, people: TopicPerson[]) => void;
	onRemove: (key: string, ids: string[]) => void;
}

/** Every kept topic on one screen, its people as chips the owner turns off or adds to. */
export function TopicPeopleStage({
	actions,
	review,
	values,
	keys,
	contacts,
	addedNames,
	isBusy,
	onAdd,
	onRemove,
}: TopicPeopleStageProps) {
	const [adding, setAdding] = useState<string | null>(null);
	if (keys.length === 0)
		return (
			<P className="rounded-lg border p-4 text-muted-foreground text-sm">
				No topics are kept yet. Go back and keep at least one.
			</P>
		);
	return (
		<ul className="divide-y rounded-lg border">
			{keys.map((key) => {
				const value = values.topics.find((topic) => topic.key === key);
				if (!value) return null;
				const evidence = review.draft.topics.find(
					(topic) => topic.key === key,
				);
				const { suggested, added } = topicPeople(
					evidence,
					value,
					addedNames,
				);
				const taken = new Set([
					...suggested.map((person) => person.id),
					...added.map((person) => person.id),
				]);
				return (
					<li
						key={key}
						className="grid gap-2 px-3 py-3 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start"
					>
						<P className="break-words pt-1 font-medium text-sm">
							{value.name || "New topic"}
						</P>
						<div className="flex flex-wrap items-center gap-1.5">
							{suggested.map((person) => (
								<button
									key={person.id}
									type="button"
									aria-pressed={!person.removed}
									disabled={isBusy}
									title={
										person.removed
											? `Put ${person.name} back on ${value.name}`
											: `Take ${person.name} off ${value.name}`
									}
									onClick={() =>
										person.removed
											? onAdd(key, [person])
											: onRemove(key, [person.id])
									}
									className={cn(
										"rounded-full border px-2.5 py-1 text-sm transition-colors motion-reduce:transition-none",
										person.removed
											? "border-dashed bg-transparent text-muted-foreground line-through"
											: "border-primary/30 bg-primary/10 hover:bg-primary/15",
									)}
								>
									{person.name}
								</button>
							))}
							{added.map((person) => (
								<span
									key={person.id}
									className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-1 pr-1 pl-2.5 text-sm"
								>
									{person.name}
									<button
										type="button"
										disabled={isBusy}
										aria-label={`Take ${person.name} off ${value.name}`}
										onClick={() =>
											onRemove(key, [person.id])
										}
										className="rounded-full p-0.5 hover:bg-primary/20"
									>
										<X
											className="size-3"
											aria-hidden="true"
										/>
									</button>
								</span>
							))}
							{suggested.length === 0 && added.length === 0 && (
								<span className="text-muted-foreground text-sm">
									No one yet
								</span>
							)}
							<Popover
								open={adding === key}
								onOpenChange={(open) =>
									setAdding(open ? key : null)
								}
							>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 rounded-full"
										disabled={isBusy}
										aria-label={`Add someone to ${value.name || "this topic"}`}
									>
										<Plus aria-hidden="true" /> Add
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-96 max-w-[90vw]"
								>
									<TopicPeoplePicker
										actions={actions}
										contacts={contacts}
										taken={taken}
										disabled={isBusy}
										onAdd={(person) => onAdd(key, [person])}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
