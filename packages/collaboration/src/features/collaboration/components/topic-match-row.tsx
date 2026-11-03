import { useId } from "react";
import {
	Checkbox,
	cn,
	Label,
	Small,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import type { TopicMatch, TopicMatchOp } from "../api/topic-matches";
import { dateLabel } from "../date-label";

// the toggle's own "on" tint is about 1:1 against the dialog and its blue label about 4:1 on it, so the
// choice shows as a ring and the label stays foreground
const choiceClassName =
	"pointer-coarse:min-h-11 data-[state=on]:bg-primary/10 data-[state=on]:text-foreground data-[state=on]:ring-1 data-[state=on]:ring-primary data-[state=on]:ring-inset";

interface TopicMatchRowProps {
	match: TopicMatch;
	/** The topic the review is for. */
	topicName: string;
	/** The owner's topic names by id, for the conversation's current topics. */
	topicNames: ReadonlyMap<string, string>;
	isChecked: boolean;
	op: TopicMatchOp;
	disabled: boolean;
	onCheckedChange: (isChecked: boolean) => void;
	onOpChange: (op: TopicMatchOp) => void;
}

/** One suggested conversation: checked joins the topic by move or also_link, unchecked turns it down. */
export function TopicMatchRow({
	match,
	topicName,
	topicNames,
	isChecked,
	op,
	disabled,
	onCheckedChange,
	onOpChange,
}: TopicMatchRowProps) {
	const id = useId();
	const subject = match.subject?.trim() || "(no subject)";
	const current = match.links
		.map((link) => topicNames.get(link.topicId) ?? "another topic")
		.join(", ");
	let outcome = "No topic yet";
	if (!isChecked) outcome = `Not about ${topicName}`;
	else if (match.links.length && op === "move")
		outcome = `Moves from ${current}`;
	else if (match.links.length)
		outcome = `Stays in ${current}${match.links.some((link) => link.kept) ? " (you filed it)" : ""}`;
	const details = [
		match.lastMessageAt
			? dateLabel(match.lastMessageAt, undefined, "date")
			: "",
		match.channel === "teams" ? "Teams" : "",
		outcome,
		isChecked ? `${match.confidence}% match` : "",
	]
		.filter(Boolean)
		.join(" · ");
	return (
		<li
			className={cn(
				"flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5",
				!isChecked && "bg-muted/30",
			)}
		>
			<Checkbox
				id={`${id}-pick`}
				// a 16px box gets a 36px hit area, as the topic goals do
				className="after:-inset-2.5 relative mt-0.5 after:absolute after:content-['']"
				checked={isChecked}
				disabled={disabled}
				aria-describedby={`${id}-details`}
				onCheckedChange={(checked) => onCheckedChange(checked === true)}
			/>
			<div className="min-w-0 flex-1 basis-48">
				<Label
					htmlFor={`${id}-pick`}
					className={cn(
						"wrap-anywhere block cursor-pointer font-normal leading-5",
						!isChecked && "text-muted-foreground line-through",
					)}
				>
					{subject}
				</Label>
				<Small
					id={`${id}-details`}
					className="font-normal text-muted-foreground text-xs leading-5"
				>
					{details}
				</Small>
			</div>
			{isChecked && match.ops.includes("move") && (
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					className="ml-auto"
					value={op}
					disabled={disabled}
					aria-label={`How "${subject}" joins ${topicName}`}
					onValueChange={(value) => {
						// clicking the chosen item again would clear it; one of the two always applies
						if (value === "move" || value === "also_link")
							onOpChange(value);
					}}
				>
					<ToggleGroupItem value="move" className={choiceClassName}>
						Move here
					</ToggleGroupItem>
					<ToggleGroupItem
						value="also_link"
						className={choiceClassName}
					>
						Also add
					</ToggleGroupItem>
				</ToggleGroup>
			)}
		</li>
	);
}
