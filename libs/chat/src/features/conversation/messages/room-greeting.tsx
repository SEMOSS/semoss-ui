import { useMemo } from "react";
import { Markdown } from "@semoss/ui/next";
import { useChatConfig } from "../../chat/config/chat-config.context";
import type { RoomStore } from "../../room/store/room.store";
import {
	createMarkdownComponents,
	createMarkdownUrlTransform,
} from "./markdown/create-markdown-components";

/** Props for {@link RoomGreeting}. */
interface RoomGreetingProps {
	/** Room the greeting is rendered for. */
	room: RoomStore;

	/** Agent-authored greeting text. Never empty - callers gate on that. */
	greeting: string;
}

/**
 * The agent's scripted opening message. Derived from the workspace config at
 * render time rather than stored as a message, so it carries no message
 * affordances and never reaches `room.history` or the model. Uses the same
 * markdown renderer and URL allowlist as a real assistant reply.
 */
export const RoomGreeting = ({ room, greeting }: RoomGreetingProps) => {
	const { options } = useChatConfig();

	const components = useMemo(
		() => createMarkdownComponents(room, false, options.isTableExportable),
		[room, options.isTableExportable],
	);

	const urlTransform = useMemo(
		() => createMarkdownUrlTransform(options.allowedUrlPrefixes),
		[options.allowedUrlPrefixes],
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
