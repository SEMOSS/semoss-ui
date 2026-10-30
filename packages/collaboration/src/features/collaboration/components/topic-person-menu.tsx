import { MoreHorizontal } from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { selectTopicIgnores } from "../state/collaboration.selectors";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

/** A topic member's settings for this topic only: VIP here, or ignored here. */
export function TopicPersonMenu({
	topic,
	personId,
	name,
	className,
}: {
	topic: Topic;
	personId: string;
	/** The member's name, for the menu button's accessible name. */
	name: string;
	className?: string;
}) {
	const { state, dispatch } = useCollaborationSession();
	const member = topic.people.find(
		(candidate) => candidate.personId === personId,
	);
	const isIgnored = selectTopicIgnores(state.rules, topic.id).some(
		(rule) => rule.personId === personId,
	);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={`Settings for ${name} in this topic`}
					className={className}
				>
					<MoreHorizontal aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuCheckboxItem
					checked={member?.vip === true}
					onCheckedChange={(vip) =>
						dispatch({
							type: "topic.person",
							topicId: topic.id,
							personId,
							state: "member",
							vip: vip === true,
						})
					}
				>
					VIP in this topic
				</DropdownMenuCheckboxItem>
				<DropdownMenuItem
					disabled={isIgnored}
					onSelect={() =>
						dispatch({
							type: "rule.add",
							rule: {
								kind: "exclude_topic",
								value: "",
								topicId: topic.id,
								personId,
								isSample: topic.isSample,
							},
						})
					}
				>
					{isIgnored
						? "Ignored in this topic"
						: "Ignore in this topic"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
