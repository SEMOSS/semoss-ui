import type { ChatToolInfo } from "../tools/chat-tool-info";
import { ChatToolRow } from "./chat-tool-row";

/** The bordered list every group of rows sits in, as in Room Settings. */
export const CHAT_TOOL_LIST_CLASS_NAME =
	"flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border";

/** Props for {@link ChatToolList}. */
export interface ChatToolListProps {
	/** The tools, in the order they are shown. */
	tools: ChatToolInfo[];
}

/** Tools as one bordered list of rows that open to their details. */
export const ChatToolList = ({ tools }: ChatToolListProps) => (
	<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
		{tools.map((tool) => (
			<ChatToolRow key={tool.name} tool={tool} />
		))}
	</ul>
);
