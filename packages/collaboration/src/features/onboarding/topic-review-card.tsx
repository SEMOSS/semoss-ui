import { ChevronDown, ChevronUp, Globe, RotateCcw, X } from "lucide-react";
import { useId } from "react";
import {
	Badge,
	Button,
	cn,
	FormCheckbox,
	FormInput,
	FormTextarea,
	H3,
	P,
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
	/** Open real conversation evidence without leaving setup. */
	onInspect: (trigger: HTMLButtonElement) => void;
	inspectId: string;
	/** Keep the review compact; only one profile editor is expanded. */
	isExpanded: boolean;
	onToggle: () => void;
	onCombine: (trigger: HTMLButtonElement) => void;
}

/** Readable profile fields with independent keep selection and reversible people corrections. */
export function TopicReviewCard({
	evidence,
	value,
	index,
	isSubmitting,
	onRemovePerson,
	onRestorePerson,
	onInspect,
	inspectId,
	isExpanded,
	onToggle,
	onCombine,
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
				<H3 id={`${id}-heading`} className="min-w-0 flex-1 text-base">
					<Button
						type="button"
						variant="ghost"
						className="h-auto min-h-11 w-full justify-start whitespace-normal px-2 text-left"
						aria-expanded={isExpanded}
						aria-controls={`${id}-editor`}
						aria-label={`Edit ${value.name || "new topic"}`}
						disabled={isSubmitting}
						onClick={onToggle}
					>
						<span className="min-w-0 flex-1 break-words">
							{value.name || "New topic"}
						</span>
						{isExpanded ? (
							<ChevronUp aria-hidden="true" />
						) : (
							<ChevronDown aria-hidden="true" />
						)}
					</Button>
				</H3>
				<FormCheckbox
					name={`${prefix}.keep`}
					label={`Keep ${value.name || "new topic"}`}
					disabled={isSubmitting || evidence?.accepted}
				/>
			</div>
			{!isExpanded && value.description && (
				<P className="line-clamp-2 break-words text-muted-foreground text-sm">
					{value.description}
				</P>
			)}
			<div id={`${id}-editor`} hidden={!isExpanded}>
				{isExpanded && (
					<div className="space-y-4 border-t pt-4">
						{evidence?.accepted && (
							<P className="text-muted-foreground text-sm">
								Already saved. You can edit its profile here and
								manage removal from Topics.
							</P>
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
						<FormTextarea
							name={`${prefix}.terms`}
							label="Project names and other clues (optional)"
							description="One distinctive phrase or alias per line, such as UNC, VCU or a client project name. People can work across topics."
							rows={2}
							maxLength={4000}
							disabled={!value.keep || isSubmitting}
						/>
						<details className="text-sm">
							<summary className="cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
								Short label:{" "}
								{value.short ||
									value.name ||
									"uses the topic name"}
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
							<P className="text-muted-foreground text-sm">
								{evidence.reason}
							</P>
						)}
						{(evidence?.sampleSubjects.length ?? 0) > 0 && (
							<div className="space-y-2">
								<P className="font-medium text-sm">
									Examples behind this suggestion
								</P>
								<ul className="space-y-1 text-muted-foreground text-sm">
									{evidence?.sampleSubjects.map(
										(subject, i) => (
											<li
												key={`${i}-${subject}`}
												className="break-words"
											>
												{subject}
											</li>
										),
									)}
								</ul>
							</div>
						)}
						{people.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{people.map((person) => {
									const isRemoved =
										value.removedPeople.includes(person.id);
									return (
										<Badge
											key={person.id}
											variant="outline"
											className={cn(
												"max-w-full gap-1 whitespace-normal",
												isRemoved &&
													"text-muted-foreground",
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
												disabled={
													!value.keep || isSubmitting
												}
												aria-label={`${isRemoved ? "Restore" : "Remove"} ${person.name}`}
												onClick={() =>
													isRemoved
														? onRestorePerson(
																person.id,
															)
														: onRemovePerson(
																person.id,
															)
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
					</div>
				)}
			</div>
			<div className="flex flex-wrap gap-2">
				<Button
					id={inspectId}
					type="button"
					variant="outline"
					size="sm"
					disabled={isSubmitting}
					onClick={(event) => onInspect(event.currentTarget)}
					aria-label={`Inspect conversations for ${value.name || "new topic"}`}
				>
					Inspect conversations
				</Button>
				<Badge variant="secondary">
					{evidence?.threadIds.length
						? `${evidence.threadIds.length} example threads`
						: evidence?.accepted
							? "Saved topic"
							: value.key.startsWith("added-")
								? "Added by you"
								: "Suggested topic"}
				</Badge>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!value.keep || isSubmitting}
					onClick={(event) => onCombine(event.currentTarget)}
					aria-label={`Combine ${value.name || "new topic"} with other topics`}
				>
					Combine with another topic
				</Button>
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
