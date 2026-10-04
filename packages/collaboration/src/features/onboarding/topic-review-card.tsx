import { Globe, RotateCcw, X } from "lucide-react";
import { useId } from "react";
import {
	Badge,
	Button,
	cn,
	FormCheckbox,
	FormInput,
	FormTextarea,
} from "@semoss/ui/next";
import type { ReviewTopic, TopicDraft } from "./topic-review-api";

interface TopicReviewCardProps {
	/** Stable source evidence from the saved review. */
	evidence?: ReviewTopic;
	/** Current form values. */
	value: TopicDraft;
	index: number;
	isSubmitting: boolean;
	onRemovePerson: (personId: string) => void;
	onRestorePerson: (personId: string) => void;
}

/** Readable profile fields with independent keep selection and reversible people corrections. */
export function TopicReviewCard({
	evidence,
	value,
	index,
	isSubmitting,
	onRemovePerson,
	onRestorePerson,
}: TopicReviewCardProps) {
	const id = useId();
	const prefix = `topics.${index}`;
	const people = evidence?.people ?? [];
	return (
		<section
			aria-labelledby={`${id}-heading`}
			className={cn(
				"min-w-0 space-y-4 rounded-xl border p-4",
				value.keep ? "border-primary/30 bg-card" : "bg-muted/30",
			)}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2
					id={`${id}-heading`}
					className="min-w-0 break-words font-semibold text-sm"
				>
					{value.name || "New topic"}
				</h2>
				<FormCheckbox
					name={`${prefix}.keep`}
					label={`Keep ${value.name || "new topic"}`}
					disabled={isSubmitting || evidence?.accepted}
				/>
			</div>
			{evidence?.accepted && (
				<p className="text-muted-foreground text-xs">
					Already saved. You can edit its profile here and manage
					removal from Topics.
				</p>
			)}
			<FormInput
				name={`${prefix}.name`}
				label="Topic name"
				required={value.keep}
				maxLength={255}
				disabled={!value.keep || isSubmitting}
			/>
			<FormTextarea
				name={`${prefix}.description`}
				label="What this topic covers"
				rows={3}
				maxLength={12000}
				disabled={!value.keep || isSubmitting}
			/>
			<details className="text-sm">
				<summary className="cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
					Short label:{" "}
					{value.short || value.name || "uses the topic name"}
				</summary>
				<FormInput
					name={`${prefix}.short`}
					label="Short label (optional)"
					description="Leave blank to use the topic name in navigation."
					maxLength={255}
					disabled={!value.keep || isSubmitting}
					className="mt-3"
				/>
			</details>
			{evidence?.reason && (
				<p className="text-muted-foreground text-sm">
					{evidence.reason}
				</p>
			)}
			{(evidence?.sampleSubjects.length ?? 0) > 0 && (
				<div className="space-y-2">
					<p className="font-medium text-xs">
						Examples behind this suggestion
					</p>
					<ul className="space-y-1 text-muted-foreground text-sm">
						{evidence?.sampleSubjects.map((subject, i) => (
							<li key={`${i}-${subject}`} className="break-words">
								{subject}
							</li>
						))}
					</ul>
				</div>
			)}
			{people.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{people.map((person) => {
						const isRemoved = value.removedPeople.includes(
							person.id,
						);
						return (
							<Badge
								key={person.id}
								variant="outline"
								className={cn(
									"max-w-full gap-1 whitespace-normal",
									isRemoved && "text-muted-foreground",
								)}
							>
								<span className="break-words">
									{person.name}
									{isRemoved ? " · removed" : ""}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={!value.keep || isSubmitting}
									aria-label={`${isRemoved ? "Restore" : "Remove"} ${person.name}`}
									onClick={() =>
										isRemoved
											? onRestorePerson(person.id)
											: onRemovePerson(person.id)
									}
								>
									{isRemoved ? (
										<RotateCcw
											className="size-3"
											aria-hidden="true"
										/>
									) : (
										<X
											className="size-3"
											aria-hidden="true"
										/>
									)}
								</Button>
							</Badge>
						);
					})}
				</div>
			)}
			<div className="flex flex-wrap gap-2">
				<Badge variant="secondary">
					{evidence?.threadIds.length
						? `${evidence.threadIds.length} example threads`
						: value.key.startsWith("added-")
							? "Added by you"
							: "Suggested topic"}
				</Badge>
				{evidence?.domains.map((domain) => (
					<Badge
						key={domain}
						variant="outline"
						className="max-w-full gap-1 whitespace-normal"
					>
						<Globe className="size-3 shrink-0" aria-hidden="true" />
						<span className="break-words">{domain}</span>
					</Badge>
				))}
			</div>
		</section>
	);
}
