import { useMemo } from "react";
import { Markdown } from "@semoss/ui/next";
import {
	createMarkdownComponents,
	createMarkdownUrlTransform,
} from "../../components/message/response-message-text/create-markdown-components";
import { useChat } from "../../host/chat.context";
import type { RoomUiStore } from "../workbench/room-ui.store";

interface RoomGreetingProps {
	/** Room the greeting is rendered for. */
	room: RoomUiStore;

	/** Agent-authored greeting text. Never empty - callers gate on that. */
	greeting: string;
}

/**
 * The agent's scripted opening message. Derived from the workspace config at
 * render time rather than stored as a message, so it carries no message
 * affordances and never reaches room.history or the model. Uses the same
 * markdown renderer and URL allowlist as a real assistant reply.
 */
export const RoomGreeting: React.FC<RoomGreetingProps> = ({
	room,
	greeting,
}) => {
	const { config } = useChat();

	const components = useMemo(
		() =>
			createMarkdownComponents(
				room,
				false,
				!!config.featureFlags?.enableTableExport,
			),
		[room, config.featureFlags?.enableTableExport],
	);

	const urlTransform = useMemo(
		() => createMarkdownUrlTransform(config.allowedUrlPrefixes),
		[config.allowedUrlPrefixes],
	);

	return (
		<div className="group">
			<div className="mb-0 flex w-full flex-col gap-2 pe-3 sm:pe-10">
				<Markdown
					dir="auto"
					components={components}
					className="wrap-anywhere [&>*:first-child]:mt-0"
					urlTransform={urlTransform}
				>
					{greeting}
				</Markdown>
			</div>
		</div>
	);
};
