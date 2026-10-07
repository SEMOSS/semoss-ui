import { FolderOpen, Settings2 } from "lucide-react";
import {
	DraftChatComposer,
	type DraftChatComposerProps,
} from "./draft-chat-composer";
import type { NewChatPanel } from "./use-new-chat-controller";

interface LandingChatComposerViewProps
	extends Omit<DraftChatComposerProps, "isCompact" | "panelActions"> {
	/** Continues this same editable draft on its dedicated chat page. */
	onOpenPanel: (panel: NewChatPanel) => void;
}

/** Compact overview presentation, shared with the backend-free design preview. */
export function LandingChatComposerView({
	onOpenPanel,
	...props
}: LandingChatComposerViewProps) {
	return (
		<section
			aria-label="Start a chat"
			className="flex min-w-0 flex-col gap-3"
		>
			<DraftChatComposer
				{...props}
				isCompact
				panelActions={[
					{
						id: "settings",
						label: "Settings",
						icon: Settings2,
						onSelect: () => onOpenPanel("settings"),
					},
					{
						id: "files",
						label: "Show chat files",
						icon: FolderOpen,
						onSelect: () => onOpenPanel("files"),
					},
				]}
			/>
		</section>
	);
}
