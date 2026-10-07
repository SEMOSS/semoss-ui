import { Settings2 } from "lucide-react";
import { createElement, useContext, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { ThreadSettings } from "@/features/collaboration/components/thread-settings";
import { WorkChatSettings } from "./work-chat-settings";
import { WorkContextDetails } from "./work-context-details";
import { WorkEmailContext } from "./work-email.context";
import { useWorkThread } from "./work-thread-context";

/** Settings retain edits while switching between chat, thread, and diagnostics. */
export function WorkSettingsPanel() {
	const context = useWorkThread();
	const [localSection, setLocalSection] = useState<
		"chat" | "thread" | "advanced"
	>("chat");
	const settingsSection = context.settingsSection ?? localSection;
	const setSettingsSection = context.setSettingsSection ?? setLocalSection;
	const email = useContext(WorkEmailContext);
	return (
		<Tabs
			value={settingsSection}
			onValueChange={(value) => {
				if (
					value === "chat" ||
					value === "thread" ||
					value === "advanced"
				)
					setSettingsSection?.(value);
			}}
			className="flex h-full min-h-0 flex-col gap-0"
		>
			<TabsList className="m-2 shrink-0" aria-label="Settings sections">
				<TabsTrigger value="chat">Chat</TabsTrigger>
				<TabsTrigger value="thread">Thread</TabsTrigger>
				<TabsTrigger value="advanced">Advanced</TabsTrigger>
			</TabsList>
			<TabsContent
				value="chat"
				forceMount
				className="min-h-0 flex-1 data-[state=inactive]:hidden"
			>
				<WorkChatSettings />
			</TabsContent>
			<TabsContent
				value="thread"
				forceMount
				className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
			>
				{email && (
					<ThreadSettings
						thread={email.thread}
						sections={["topics", "visibility"]}
					/>
				)}
			</TabsContent>
			<TabsContent
				value="advanced"
				className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
			>
				<WorkContextDetails />
			</TabsContent>
		</Tabs>
	);
}
export const WORK_SETTINGS_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) =>
		createElement(Settings2, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	content: WorkSettingsPanel,
};
