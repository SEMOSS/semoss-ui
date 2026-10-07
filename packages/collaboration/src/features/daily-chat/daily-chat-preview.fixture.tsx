import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationMessage } from "@/features/messages/types/message";
import { RoomSessionView } from "@/features/rooms/components/room-session-view";
import {
	RoomSession,
	type RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type { RoomSettings } from "@/features/rooms/types/room";
import {
	previewEmailRoomSource,
	readPreviewSourceEmail,
} from "./daily-chat-preview-email.fixture";
import { LandingChatComposerView } from "./landing-chat-composer-view";
import { NewChatWorkbenchProvider } from "./new-chat-workbench-provider";
import { NewChatWorkspace } from "./new-chat-workspace";

const previewMessages: ConversationMessage[] = [
	{
		id: "preview-question",
		role: "user",
		parts: [
			{ type: "text", text: "Help me prepare for the renewal call." },
		],
	},
	{
		id: "preview-answer",
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Start with the customer’s priorities, then confirm the timeline and the decisions they need from us.\n\n- Review the open pricing questions with the account team.\n- Confirm who will own the architecture review.\n- Leave time to agree on next steps and follow-up dates.\n\nWould you like to work through the open questions?",
			},
		],
	},
];

/** Render the room UI without initializing an insight or contacting the backend. */
export function DailyChatPreview() {
	const location = useLocation();
	const navigate = useNavigate();
	const isLanding = location.pathname === "/";
	const isNewChat = location.pathname === "/new";
	const visualState = new URLSearchParams(window.location.search).get(
		"chatState",
	);
	const [hasRecovered, setHasRecovered] = useState(false);
	const { state } = useCollaborationSession();
	const [settings, setSettings] = useState<RoomSettings>({
		instructions: "",
		modelId: "",
		mcp: [],
	});
	const session = useMemo(() => {
		const preview = new RoomSession("preview", "preview-room");
		preview.insight.actions.run = (async (statement: string) => ({
			pixelReturn: [
				{
					output: readPreviewSourceEmail(statement),
					operationType: [],
				},
			],
		})) as typeof preview.insight.actions.run;
		preview.reconnect = async () => setHasRecovered(true);
		preview.send = async () => {
			throw new Error("Preview does not send messages.");
		};
		preview.create = async () => {
			throw new Error("Preview does not store files.");
		};
		preview.selectModel = async () => undefined;
		preview.saveSettings = async () => undefined;
		return preview;
	}, []);
	const live = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
		session.getSnapshot,
	);
	const messages = useMemo(
		() =>
			visualState === "long"
				? Array.from({ length: 6 }, (_, index) =>
						previewMessages.map((message) => ({
							...message,
							id: `${message.id}-${index}`,
						})),
					).flat()
				: previewMessages,
		[visualState],
	);
	const snapshot: RoomSessionSnapshot = {
		...live,
		source:
			visualState === "email" && !isNewChat
				? previewEmailRoomSource
				: null,
		title:
			visualState === "email"
				? previewEmailRoomSource.title
				: visualState === "long"
					? "Prepare for the Northwind renewal call and confirm architecture review ownership, pricing questions and next steps"
					: "Prepare for the renewal call",
		isReady: true,
		isLoading: visualState === "loading",
		error:
			visualState === "error" && !hasRecovered
				? new Error(
						"Unable to restore this conversation. Your draft is still available.",
					)
				: null,
		isLoadingModel: false,
		modelId: "",
		modelName: "Preview",
		turn: {
			...live.turn,
			messages: isNewChat || visualState === "loading" ? [] : messages,
		},
		settings: {
			...live.settings,
			...settings,
			modelId: settings.modelId ?? "",
			temperature: settings.temperature ?? null,
		},
	};
	const saveSettings = async (values: RoomSettings): Promise<void> => {
		setSettings(values);
	};
	if (isLanding)
		return (
			<LandingChatComposerView
				draftId="preview-draft"
				session={session}
				snapshot={snapshot}
				agentError=""
				onInitialize={session.reconnect}
				onSend={session.send}
				onSaveSettings={saveSettings}
				onSelectAgent={async () => undefined}
				onOpenPanel={(panel) => {
					void navigate("/new", { state: { panel } });
				}}
			/>
		);
	if (isNewChat)
		return (
			<NewChatWorkbenchProvider
				session={session}
				snapshot={snapshot}
				onSaveSettings={saveSettings}
			>
				<NewChatWorkspace
					draftId="preview-draft"
					requestedPanel={
						location.state?.panel === "settings" ||
						location.state?.panel === "files"
							? location.state.panel
							: undefined
					}
					session={session}
					snapshot={snapshot}
					userName={state.profile.name}
					agentError=""
					onInitialize={session.reconnect}
					onSend={session.send}
					onSaveSettings={saveSettings}
					onSelectAgent={async () => undefined}
				/>
			</NewChatWorkbenchProvider>
		);
	return <RoomSessionView session={session} snapshot={snapshot} />;
}

export { DailyChatPreview as LandingChatPreview };
