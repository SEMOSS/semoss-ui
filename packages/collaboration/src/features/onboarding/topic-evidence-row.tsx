import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";
import {
	Badge,
	Button,
	H3,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import type { InsightActions } from "@/lib/pixel";
import { TopicConversationContext } from "./topic-conversation-context";
import type {
	TopicEvidenceItem,
	TopicReviewChange,
} from "./topic-evidence-api";
import { previewTopicLinks } from "./topic-evidence-preview";
import type { TopicDraft, TopicReview } from "./topic-review-api";

interface TopicEvidenceRowProps {
	/** Active owner and saved review, including pending relationship choices. */
	actions: InsightActions;
	review: TopicReview;
	/** Current readable topic profiles. */
	topics: TopicDraft[];
	topic: TopicDraft;
	item: TopicEvidenceItem;
	/** Mutations are blocked while a draft write or refreshed preview is pending. */
	isBusy: boolean;
	onChange: (change: TopicReviewChange) => void;
}

/** One real conversation, its current links, explicit draft impact and an in-place source reader. */
export function TopicEvidenceRow({
	actions,
	review,
	topics,
	topic,
	item,
	isBusy,
	onChange,
}: TopicEvidenceRowProps) {
	const id = useId();
	const [isContextOpen, setIsContextOpen] = useState(false);
	const [targetKey, setTargetKey] = useState("");
	const targets = topics.filter(
		(candidate) => candidate.keep && candidate.key !== topic.key,
	);
	const target = targets.find((candidate) => candidate.key === targetKey);
	const corrections = (review.draft.corrections ?? []).filter(
		(correction) => correction.threadId === item.id,
	);
	const preview = previewTopicLinks(item, review, topics);
	const isDisabled = isBusy || !topic.keep || !item.canCorrect;
	const handleChange = (
		type: "confirm" | "reject" | "move" | "also_link",
	): void =>
		onChange({
			type,
			topicKey: topic.key,
			threadIds: [item.id],
			versions: { [item.id]: item.version },
			...(type === "move" || type === "also_link"
				? { targetKey: target?.key }
				: {}),
		});
	return (
		<article
			aria-labelledby={`${id}-subject`}
			className="min-w-0 space-y-4 border-b py-5 last:border-b-0"
		>
			<div className="space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">
						{item.source === "email"
							? "Email"
							: item.source === "teams"
								? "Teams"
								: "Calendar"}
					</Badge>
					<Small className="text-muted-foreground">
						{formatLocalDateTime(item.lastMessageAt ?? undefined) ||
							"Date unavailable"}{" "}
						· {item.messageCount}{" "}
						{item.messageCount === 1 ? "message" : "messages"}
					</Small>
				</div>
				<H3 id={`${id}-subject`} className="break-words text-base">
					{item.subject}
				</H3>
				{item.people.length > 0 && (
					<P className="break-words text-muted-foreground text-sm">
						{item.people
							.map((person) => person.name || person.email)
							.join(" · ")}
					</P>
				)}
				<P className="break-words text-sm">
					Currently:{" "}
					{item.links.length
						? item.links
								.map(
									(link) =>
										`${link.name}${link.primary ? " (primary)" : ""}`,
								)
								.join(" · ")
						: "Not filed under a topic"}
				</P>
			</div>
			{corrections.length > 0 && (
				<div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
					<Small>After saving this setup</Small>
					<div className="flex flex-wrap gap-2">
						{preview.length ? (
							preview.map((link) => (
								<Badge
									key={link.key}
									variant="secondary"
									className="max-w-full whitespace-normal break-words"
								>
									{link.name}
									{link.primary ? " · primary" : ""}
								</Badge>
							))
						) : (
							<P className="text-sm">No topic links remain.</P>
						)}
					</div>
					<P className="break-words text-muted-foreground text-sm">
						{corrections
							.filter(
								(correction) => correction.state === "exclude",
							)
							.map(
								(correction) =>
									`Keep out of ${topics.find((candidate) => candidate.key === correction.topicKey)?.name || "this topic"}`,
							)
							.join(" · ") ||
							"Confirmed relationships will be protected during automatic filing."}
					</P>
				</div>
			)}
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isDisabled}
					onClick={() => handleChange("confirm")}
					aria-label={`Belongs here in ${topic.name}: ${item.subject}`}
				>
					Belongs here
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isDisabled}
					onClick={() => handleChange("reject")}
					aria-label={`Does not belong here in ${topic.name}: ${item.subject}`}
				>
					Doesn’t belong here
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setIsContextOpen((open) => !open)}
					aria-expanded={isContextOpen}
					aria-controls={`${id}-context`}
				>
					{isContextOpen ? (
						<ChevronUp aria-hidden="true" />
					) : (
						<ChevronDown aria-hidden="true" />
					)}
					{isContextOpen
						? "Close message preview"
						: "Read recent messages"}
				</Button>
			</div>
			{targets.length > 0 && item.canCorrect && (
				<div className="space-y-2">
					<Label htmlFor={`${id}-target`}>
						Another topic for this conversation
					</Label>
					<div className="flex min-w-0 flex-wrap items-center gap-2">
						<Select
							value={target?.key ?? ""}
							onValueChange={setTargetKey}
							disabled={isDisabled}
						>
							<SelectTrigger
								id={`${id}-target`}
								className="w-full min-w-0 sm:w-64"
							>
								<SelectValue placeholder="Choose another topic" />
							</SelectTrigger>
							<SelectContent>
								{targets.map((candidate) => (
									<SelectItem
										key={candidate.key}
										value={candidate.key}
									>
										{candidate.name || "New topic"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isDisabled || !target}
							onClick={() => handleChange("move")}
						>
							Move
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isDisabled || !target}
							onClick={() => handleChange("also_link")}
						>
							Also link
						</Button>
					</div>
					{target && (
						<P className="break-words text-muted-foreground text-sm">
							Move removes the relationship with {topic.name} and
							makes {target.name} primary. Also link keeps both
							topics and preserves the existing primary. Other
							topic links stay.
						</P>
					)}
				</div>
			)}
			{!topic.keep && (
				<P className="text-muted-foreground text-sm">
					Turn on Keep to make conversation corrections for this
					topic.
				</P>
			)}
			{!item.canCorrect && (
				<P className="text-muted-foreground text-sm">
					{item.source === "teams"
						? "This chat may span several topics. Whole-chat correction is unavailable here; you can read its recent messages."
						: "Calendar items are read-only in this email review."}
				</P>
			)}
			{isContextOpen && (
				<div
					id={`${id}-context`}
					className="min-w-0 rounded-lg bg-muted/30 p-4"
				>
					<TopicConversationContext
						actions={actions}
						threadId={item.id}
					/>
				</div>
			)}
		</article>
	);
}
