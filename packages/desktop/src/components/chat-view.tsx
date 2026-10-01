import { ArrowUp, MessageSquarePlus, Plus, Sparkles } from "lucide-react";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	type ChatMessage,
	type ChatModel,
	type ChatRoom,
	type ChatSession,
	createChatSession,
	fetchChatModels,
	fetchChatRooms,
	loadChatRoom,
	streamChatMessage,
} from "@semoss/chat";
import {
	Alert,
	AlertDescription,
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type {
	DesktopInstanceProfile,
	DesktopUser,
	InstanceConfig,
} from "@/types";

interface ChatViewProps {
	profile: DesktopInstanceProfile;
	config: InstanceConfig;
	user: DesktopUser | null;
	initialModelId?: string;
	lockModel?: boolean;
}

export const ChatView = ({
	user,
	initialModelId = "",
	lockModel = false,
}: ChatViewProps) => {
	const [models, setModels] = useState<ChatModel[]>([]);
	const [rooms, setRooms] = useState<ChatRoom[]>([]);
	const [selectedModelId, setSelectedModelId] = useState("");
	const [session, setSession] = useState<ChatSession | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [prompt, setPrompt] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState("");

	const loadCatalogs = useCallback(async () => {
		setIsLoading(true);
		setError("");
		try {
			const [nextModels, nextRooms] = await Promise.all([
				fetchChatModels(),
				fetchChatRooms(),
			]);
			setModels(nextModels);
			setRooms(nextRooms);
			setSelectedModelId((current) => {
				if (initialModelId) return initialModelId;
				if (current) return current;
				const preferred = nextModels.find(
					(model) =>
						model.engine_id === user?.defaultTextGenerationModelId,
				);
				return preferred?.engine_id || nextModels[0]?.engine_id || "";
			});
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error
					? loadError.message
					: "Unable to load Chat.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [initialModelId, user?.defaultTextGenerationModelId]);

	useEffect(() => {
		void loadCatalogs();
	}, [loadCatalogs]);

	const selectedModel = useMemo(
		() => models.find((model) => model.engine_id === selectedModelId),
		[models, selectedModelId],
	);
	const firstName = user?.name.trim().split(/\s+/)[0] || "";

	const startNewChat = (): void => {
		setSession(null);
		setMessages([]);
		setPrompt("");
		setError("");
	};

	const openRoom = async (room: ChatRoom): Promise<void> => {
		setIsLoading(true);
		setError("");
		try {
			const loaded = await loadChatRoom(room.ROOM_ID);
			setSession(loaded.session);
			setMessages(loaded.messages);
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error
					? loadError.message
					: "Unable to load this room.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const submitPrompt = async (event: FormEvent): Promise<void> => {
		event.preventDefault();
		const command = prompt.trim();
		if (!command || !selectedModelId || isSending) return;

		setPrompt("");
		setError("");
		setIsSending(true);
		setMessages((current) => [
			...current,
			{
				id: `input-${Date.now()}`,
				role: "user",
				text: command,
			},
		]);

		try {
			const activeSession = session || (await createChatSession());
			if (!session) setSession(activeSession);
			const responseId = `response-${Date.now()}`;
			setMessages((current) => [
				...current,
				{ id: responseId, role: "assistant", text: "" },
			]);
			const response = await streamChatMessage(
				activeSession,
				selectedModelId,
				command,
				{
					onContent: (content) => {
						setMessages((current) =>
							current.map((message) =>
								message.id === responseId
									? {
											...message,
											text: message.text + content,
										}
									: message,
							),
						);
					},
				},
			);
			setMessages((current) =>
				current.map((message) =>
					message.id === responseId ? response : message,
				),
			);
			setRooms(await fetchChatRooms());
		} catch (sendError: unknown) {
			setError(
				sendError instanceof Error
					? sendError.message
					: "Unable to send this message.",
			);
		} finally {
			setIsSending(false);
		}
	};

	const composer = (
		<form
			className="rounded-2xl border border-border/80 bg-background/90 p-2 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl transition focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15"
			onSubmit={(event) => void submitPrompt(event)}
		>
			<Textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				onKeyDown={(event) => {
					if (
						event.key === "Enter" &&
						!event.shiftKey &&
						!event.nativeEvent.isComposing
					) {
						event.preventDefault();
						event.currentTarget.form?.requestSubmit();
					}
				}}
				placeholder="How can I help you today?"
				className="max-h-48 min-h-20 resize-none border-0 bg-transparent px-3 py-2 text-[15px] shadow-none focus-visible:ring-0"
				disabled={isLoading || isSending}
			/>
			<div className="flex items-center gap-2 px-1 pb-1">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="rounded-full text-muted-foreground"
					aria-label="Add context"
				>
					<Plus aria-hidden="true" />
				</Button>
				<div className="flex-1" />
				<Select
					value={selectedModelId}
					onValueChange={setSelectedModelId}
					disabled={lockModel}
				>
					<SelectTrigger
						size="sm"
						className="max-w-56 border-0 bg-transparent shadow-none"
						aria-label="Chat model"
					>
						<SelectValue placeholder="Select model" />
					</SelectTrigger>
					<SelectContent>
						{models.map((model) => (
							<SelectItem
								key={model.engine_id}
								value={model.engine_id}
							>
								{model.engine_display_name ||
									model.engine_name ||
									model.engine_id}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					type="submit"
					size="icon-sm"
					className="rounded-full"
					disabled={
						!prompt.trim() ||
						!selectedModelId ||
						isLoading ||
						isSending
					}
					aria-label="Send message"
				>
					{isSending ? <Spinner /> : <ArrowUp aria-hidden="true" />}
				</Button>
			</div>
		</form>
	);

	return (
		<div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)] bg-background">
			<aside className="flex min-h-0 flex-col border-border/60 border-r bg-sidebar/70 p-3 backdrop-blur-xl">
				<Button
					type="button"
					variant="ghost"
					className="justify-start rounded-xl border border-border/70 bg-background/70 shadow-sm"
					onClick={startNewChat}
				>
					<MessageSquarePlus aria-hidden="true" />
					New chat
				</Button>
				<div className="mt-4 min-h-0 flex-1 overflow-auto">
					<p className="px-2 font-medium text-muted-foreground text-xs">
						Recent
					</p>
					<div className="mt-2 flex flex-col gap-1">
						{rooms.map((room) => (
							<Button
								key={room.ROOM_ID}
								type="button"
								variant={
									session?.roomId === room.ROOM_ID
										? "secondary"
										: "ghost"
								}
								className="h-auto justify-start whitespace-normal rounded-lg px-2 py-2 text-left"
								onClick={() => void openRoom(room)}
							>
								<span className="line-clamp-2">
									{room.ROOM_NAME || "Untitled chat"}
								</span>
							</Button>
						))}
					</div>
				</div>
			</aside>

			<section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_35%,hsl(var(--primary)/0.06),transparent_38%)]">
				<div className="min-h-0 flex-1 overflow-auto px-6 py-5">
					{isLoading ? (
						<output className="flex h-full items-center justify-center gap-3">
							<Spinner />
							<span>Loading Chat...</span>
						</output>
					) : messages.length > 0 ? (
						<div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
							{messages.map((message) => (
								<div
									key={message.id}
									className={
										message.role === "user"
											? "ml-auto max-w-[80%] rounded-2xl bg-muted px-4 py-3"
											: "mr-auto max-w-[90%] whitespace-pre-wrap leading-7"
									}
								>
									{message.text}
								</div>
							))}
							{isSending ? (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Spinner />
									{selectedModel?.engine_display_name ||
										selectedModel?.engine_name ||
										"Model"}{" "}
									is responding...
								</div>
							) : null}
						</div>
					) : (
						<div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4">
							<div className="mb-5 flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm backdrop-blur">
								<Sparkles className="size-5 text-primary" />
							</div>
							<h1 className="mb-7 text-center font-semibold text-3xl tracking-tight">
								{firstName
									? `How can I help, ${firstName}?`
									: "How can I help?"}
							</h1>
							<div className="w-full max-w-2xl">{composer}</div>
						</div>
					)}
				</div>

				{messages.length > 0 ? (
					<div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-6 pt-6 pb-5">
						<div className="mx-auto max-w-3xl">{composer}</div>
					</div>
				) : null}
				<div className="pointer-events-none absolute inset-x-0 bottom-0">
					{error ? (
						<Alert
							variant="destructive"
							className="pointer-events-auto mx-auto mb-4 max-w-2xl"
						>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
				</div>
			</section>
		</div>
	);
};
