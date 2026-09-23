import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Markdown } from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import {
	createMarkdownComponents,
	createMarkdownUrlTransform,
} from "../message/response-message-text/create-markdown-components";

interface RoomGreetingProps {
	/** Room the greeting is rendered for. */
	room: RoomStore;

	/** Agent-authored greeting text. Never empty - callers gate on that. */
	greeting: string;
}

/**
 * The agent's scripted opening message. Derived from the workspace config at
 * render time rather than stored as a message, so it carries no message
 * affordances and never reaches room.history or the model. Uses the same
 * markdown renderer and URL allowlist as a real assistant reply.
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

		const urlTransform = useMemo(
			() => createMarkdownUrlTransform(root.theme.allowedUrlPrefixes),
			[root.theme.allowedUrlPrefixes],
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
	},
);
