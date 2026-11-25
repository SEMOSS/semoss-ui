import { Layers } from "lucide-react";
import { createElement, useContext } from "react";
import { H2, P } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { TOPIC_WORK_PANEL_TYPE } from "@/features/room-connectors/room-connectors.constants";
import { TopicWorkList } from "@/features/topic-work/topic-work-list";
import { linkedTopics } from "../use-room-topics";
import { RoomTopicsContext } from "./room-topics.context";

/** The work under every topic this chat is linked to, each under its own name. */
function TopicWorkPanel() {
	const topics = linkedTopics(useContext(RoomTopicsContext)?.topics);
	if (!topics.length)
		return (
			<P className="p-4 text-muted-foreground text-sm">
				This chat has no topic.
			</P>
		);
	return (
		<section
			aria-label="Topic Work"
			className="size-full divide-y divide-border overflow-y-auto p-4"
		>
			{topics.map((topic) => (
				<section
					key={topic.topicId}
					aria-label={topic.name || undefined}
					className="space-y-4 py-6 first:pt-0 last:pb-0"
				>
					{topic.name ? (
						<H2 className="break-words border-b pb-2 font-semibold text-base text-foreground">
							{topic.name}
						</H2>
					) : null}
					<TopicWorkList topicId={topic.topicId} />
				</section>
			))}
		</section>
	);
}

const TOPIC_WORK_PANEL: WorkbenchPanelConfig = {
	name: "Topic Work",
	icon: ({ className }) =>
		createElement(Layers, { className, "aria-hidden": true }),
	content: TopicWorkPanel,
	mount: "keepAlive",
	canClose: false,
	canDrag: false,
	canRename: false,
	canSplitTab: false,
	matches: () => true,
};

export const ROOM_TOPIC_WORK_PANEL_COMPONENTS = {
	[TOPIC_WORK_PANEL_TYPE]: TOPIC_WORK_PANEL,
};
