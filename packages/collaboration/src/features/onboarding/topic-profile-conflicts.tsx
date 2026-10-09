import { useId, useState } from "react";
import { Button, H3, P } from "@semoss/ui/next";
import type { TopicDraft, TopicProfileConflict } from "./topic-review-api";

interface TopicProfileConflictsProps {
	conflicts: TopicProfileConflict[];
	topics: TopicDraft[];
	isBusy: boolean;
	onChoose: (
		conflict: TopicProfileConflict,
		choice: "saved" | "draft",
	) => void;
}

/** A saved profile conflict has an explicit owner choice; reloading never silently replaces draft edits. */
export function TopicProfileConflicts({
	conflicts,
	topics,
	isBusy,
	onChoose,
}: TopicProfileConflictsProps) {
	const id = useId();
	const [expandedKey, setExpandedKey] = useState<string | null>(null);
	return (
		<section
			aria-labelledby={`${id}-heading`}
			className="space-y-3 rounded-xl border border-warning/50 bg-warning/5 p-4"
		>
			<H3 id={`${id}-heading`} className="text-base">
				Saved topics changed during setup
			</H3>
			<P className="text-sm">
				Compare these changes before continuing. Your draft edits are
				preserved.
			</P>
			{conflicts.map((conflict, index) => {
				const topic = topics.find(
					(value) => value.key === conflict.topicKey,
				);
				if (!topic) return null;
				const isExpanded = expandedKey === conflict.topicKey;
				return (
					<div
						key={conflict.topicKey}
						className="space-y-3 border-t pt-3"
					>
						<Button
							type="button"
							variant="outline"
							disabled={isBusy}
							aria-expanded={isExpanded}
							aria-controls={`${id}-profile-${index}`}
							onClick={() =>
								setExpandedKey(
									isExpanded ? null : conflict.topicKey,
								)
							}
						>
							Compare changes to {topic.name || "this topic"}
						</Button>
						<div
							id={`${id}-profile-${index}`}
							hidden={!isExpanded}
							className="space-y-3"
						>
							<P className="font-medium text-sm">
								Your draft profile
							</P>
							<dl className="space-y-1 break-words text-sm">
								<dt className="text-muted-foreground">
									Name and short label
								</dt>
								<dd>
									{topic.name || "Unnamed"} ·{" "}
									{topic.short || "Uses the topic name"}
								</dd>
								<dt className="text-muted-foreground">Scope</dt>
								<dd className="whitespace-pre-wrap">
									{topic.description || "No description"}
								</dd>
								<dt className="text-muted-foreground">
									Matching clues
								</dt>
								<dd className="whitespace-pre-wrap">
									{topic.terms || "None"}
								</dd>
							</dl>
							{conflict.exists ? (
								<>
									<P className="font-medium text-sm">
										Current saved profile
									</P>
									<dl className="space-y-1 break-words text-sm">
										<dt className="text-muted-foreground">
											Name and short label
										</dt>
										<dd>
											{conflict.savedProfile.name} ·{" "}
											{conflict.savedProfile.short ||
												"Uses the topic name"}
										</dd>
										<dt className="text-muted-foreground">
											Scope
										</dt>
										<dd className="whitespace-pre-wrap">
											{conflict.savedProfile
												.description ||
												"No description"}
										</dd>
										<dt className="text-muted-foreground">
											Matching clues
										</dt>
										<dd className="whitespace-pre-wrap">
											{conflict.savedProfile.terms ||
												"None"}
										</dd>
										<dt className="text-muted-foreground">
											Status and people
										</dt>
										<dd>
											{conflict.savedProfile.status} ·{" "}
											{conflict.savedProfile.people
												.map(
													(person) =>
														`${person.name}${person.state === "removed" ? " (removed)" : ""}`,
												)
												.join(", ") ||
												"No people linked"}
										</dd>
									</dl>
									<P className="text-muted-foreground text-sm">
										Both choices preserve current saved
										membership and other profile settings.
										Your explicit draft removals remain when
										you keep your draft. Kept topics become
										active on final save.
									</P>
								</>
							) : (
								<P className="text-sm">
									This topic was deleted elsewhere. Keep your
									entered profile as a new topic, or remove it
									from this setup draft.
								</P>
							)}
							{!conflict.canReconcile && (
								<output className="block text-sm text-warning">
									{conflict.reason}
								</output>
							)}
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									disabled={isBusy || !conflict.canReconcile}
									onClick={() => onChoose(conflict, "saved")}
								>
									{conflict.exists
										? "Use saved profile"
										: "Remove deleted topic from draft"}
								</Button>
								<Button
									type="button"
									disabled={isBusy || !conflict.canReconcile}
									onClick={() => onChoose(conflict, "draft")}
								>
									{conflict.exists
										? "Keep my draft profile"
										: "Keep as a new draft topic"}
								</Button>
							</div>
						</div>
					</div>
				);
			})}
		</section>
	);
}
