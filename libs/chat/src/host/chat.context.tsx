import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { PortalContainerProvider } from "@semoss/ui/next";
import type { ChatHostConfig } from "./chat-host-config";
import {
	type ChatRoomsClient,
	createChatRoomsClient,
	resolveChatHostConfig,
} from "./chat-rooms-client";

/** What `<ChatProvider>` hands the chat UI. */
export interface ChatContextValue {
	/** The host's config, with defaults filled in. */
	config: ChatHostConfig;
	/** The user's rooms. */
	chat: ChatRoomsClient;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/** Props for {@link ChatProvider}. */
export interface ChatProviderProps {
	/**
	 * The host's config. Read when the provider mounts: keep its identity
	 * stable, since a new config does not remake the rooms client.
	 */
	config: ChatHostConfig;
	/**
	 * The rooms client, when the host keeps its own (as tests do); the
	 * provider makes and initializes one from `config` otherwise.
	 */
	chat?: ChatRoomsClient;
	children: ReactNode;
}

/**
 * Supply the host's config and the user's rooms to the chat UI beneath it,
 * whose overlays portal into the host's `portalContainer`.
 *
 * @component
 */
export const ChatProvider = ({ config, chat, children }: ChatProviderProps) => {
	const resolved = useMemo(() => resolveChatHostConfig(config), [config]);
	// made once; the provider owns it only when the host passed none
	const [ownChat] = useState(() =>
		chat ? null : createChatRoomsClient(resolveChatHostConfig(config)),
	);

	useEffect(() => {
		void ownChat?.initialize();
	}, [ownChat]);

	const rooms = chat ?? ownChat;
	const value = useMemo(
		() => (rooms ? { config: resolved, chat: rooms } : undefined),
		[resolved, rooms],
	);
	return (
		<ChatContext.Provider value={value}>
			{/* overlays follow the host, as into an embed's Shadow DOM */}
			<PortalContainerProvider
				container={resolved.portalContainer ?? null}
			>
				{children}
			</PortalContainerProvider>
		</ChatContext.Provider>
	);
};

/**
 * The host's config and the user's rooms.
 *
 * @returns The chat context.
 */
export const useChat = (): ChatContextValue => {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error("useChat must be used within a ChatProvider");
	}
	return context;
};
