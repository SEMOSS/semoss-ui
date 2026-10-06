import { ListFilter } from "lucide-react";
import {
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";

/** A single topic vocabulary shared by the daily brief and chat composer. */
export function BriefTopicFilter({
	value = "",
	onChange,
	compact = false,
	disabled = false,
	isSample,
}: {
	value?: string;
	onChange: (value: string) => void;
	compact?: boolean;
	disabled?: boolean;
	/** Limit chat choices to the same data boundary as its conversation. */
	isSample?: boolean;
}) {
	const { state } = useCollaborationSession();
	return (
		<Select
			value={value || "all"}
			disabled={disabled}
			onValueChange={(next) => onChange(next === "all" ? "" : next)}
		>
			<SelectTrigger
				aria-label="Topic scope"
				className={cn(
					"h-10 w-auto max-w-full gap-2 rounded-xl bg-card",
					compact &&
						"h-8 border-0 bg-transparent px-1 font-mono text-muted-foreground text-xs shadow-none",
				)}
			>
				{!compact && (
					<ListFilter aria-hidden="true" className="size-4" />
				)}
				<SelectValue placeholder="All topics" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">All topics</SelectItem>
				{state.topics
					.filter(
						(topic) =>
							topic.status === "active" &&
							(isSample === undefined ||
								topic.isSample === isSample),
					)
					.map((topic) => (
						<SelectItem key={topic.id} value={topic.id}>
							{topic.name}
						</SelectItem>
					))}
			</SelectContent>
		</Select>
	);
}
