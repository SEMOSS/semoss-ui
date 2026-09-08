import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Markdown } from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import { createMarkdownComponents } from "../message/response-message-text/create-markdown-components";

interface RoomGreetingProps {
	/** Room the greeting is rendered for. */
	room: RoomStore;

	/** Agent-authored greeting text. Never empty - callers gate on that. */
	greeting: string;
}

/**
 * The agent's scripted opening message. Derived from the workspace config at
 * render time (room.agentGreeting) rather than stored as a message, so it
 * carries none of the message affordances - no id, no feedback/copy/token
 * controls - and never reaches room.history or the model. Reuses the same
 * markdown renderer as a real assistant reply so it's visually
 * indistinguishable from one.
 */
export const RoomGreeting: React.FC<RoomGreetingProps> = observer(
	({ room, greeting }) => {
		const { root } = useRoot();

		const components = useMemo(
			() =>
				createMarkdownComponents(
					room,
					false,
					!!root.theme.featureFlags?.enableTableExport,
				),
			[room, root.theme.featureFlags?.enableTableExport],
		);

		const urlTransform = (url: string) => {
			if (url.startsWith("room://")) return url;
			if (
				root.theme.allowedUrlPrefixes?.some((prefix) =>
					url.startsWith(prefix),
				)
			)
				return url;
			if (/^(https?:|mailto:|#)/.test(url)) return url;
			return "";
		};

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
	},
);
