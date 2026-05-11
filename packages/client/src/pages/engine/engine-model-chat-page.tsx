import { Bot, Copy, Pencil, RefreshCw, Send, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Avatar,
	AvatarFallback,
	Button,
	Card,
	H4,
	Markdown,
	Muted,
	P,
	Separator,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import { FeedbackButtons } from "@/components/engine/FeedbackButtons";
import { EngineModelTestSidebar } from "@/components/settings";
import { useEngine } from "@/hooks";

interface Message {
	id: string;
	content: string;
	isUser: boolean;
	timestamp: Date;
	tokens?: number;
}

interface Model {
	model_id: string;
	model_name: string;
	tag?: string;
}

export const EngineModelChatPage = () => {
	const { active } = useEngine();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);

	const [selectedModel, setSelectedModel] = useState<Model>({
		model_id: active.id,
		model_name: "",
	});
	const [temperature, setTemperature] = useState<number>(0.1);
	const [maxTokens, setMaxTokens] = useState<number>(2000);
	const [insightId, setInsightId] = useState<string>("");
	const [isInsightLoading, setIsInsightLoading] = useState<boolean>(true);

	const { control, handleSubmit, reset, watch } = useForm({
		defaultValues: {
			prompt: "",
		},
	});

	const promptValue = watch("prompt");
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Helper to create a new insight from backend
	const createNewInsight = useCallback(async () => {
		setIsInsightLoading(true);
		try {
			const { insightId: newId } = await runPixel("1+1;", "new");
			setInsightId(newId);
		} catch (e) {
			setError(e.message || "Failed to create new chat session.");
		} finally {
			setIsInsightLoading(false);
		}
	}, []);

	useEffect(() => {
		setSelectedModel({
			model_id: active.id,
			model_name: "",
		});
		setMessages([]);
		createNewInsight(); // Get a new insightId from backend
	}, [active.id, createNewInsight]);

	useEffect(() => {
		const el = messagesContainerRef.current;
		if (el && (messages.length >= 0 || isLoading !== undefined)) {
			el.scrollTop = el.scrollHeight;
		}
	}, [messages, isLoading]);

	const sendMessage = async (data: { prompt: string }) => {
		if (!data.prompt.trim()) return;

		setError("");
		setIsLoading(true);
		const userMessage: Message = {
			id: `user-${Date.now()}`,
			content: data.prompt,
			isUser: true,
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, userMessage]);
		try {
			const pixel = `LLM(engine="${selectedModel.model_id}", command=["<encode>${data.prompt}</encode>"], paramValues=[{"temperature":${temperature}, "max_tokens":${maxTokens}}])`;
			const response = await runPixel(pixel, insightId);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				const errorMessage =
					output.response ||
					output ||
					"An error occurred while processing your request";
				throw new Error(errorMessage);
			}
			const assistantMessage: Message = {
				id: output.messageId,
				content: output.response || "No response received",
				isUser: false,
				timestamp: new Date(),
				tokens: output.numberOfTokensInResponse || 0,
			};
			setMessages((prev) => [...prev, assistantMessage]);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An unexpected error occurred",
			);
		} finally {
			setIsLoading(false);
			reset();
			textareaRef.current?.focus();
		}
	};

	const [feedbackMap, setFeedbackMap] = useState<{
		[messageId: string]: "true" | "false" | null;
	}>({});

	//Call LLM Feedback reactor to save user's feedback on a message
	const sendFeedback = async (messageId: string, rating: string) => {
		const pixel = `SubmitLlmFeedback(messageId="${messageId}", feedbackText="", rating="${rating}", roomId=${JSON.stringify(insightId)})`;
		try {
			const response = await runPixel(pixel);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				const errorMessage =
					`${output}` ||
					"An error occurred while submitting feedback";
				throw new Error(errorMessage);
			} else {
				return output;
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while submitting feedback",
			);
		}
	};

	const handleFeedback = (messageId: string, value: "true" | "false") => {
		setFeedbackMap((prev) => ({
			...prev,
			[messageId]: value,
		}));
		sendFeedback(messageId, value);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			// Plain Enter → submit
			e.preventDefault();
			if (!isLoading && !isInsightLoading && promptValue?.trim()) {
				handleSubmit(sendMessage)();
			}
		}
		// Shift+Enter → browser default inserts a newline
	};

	const handleRewrite = async (messageId: string) => {
		const modelMessageIndex = messages.findIndex(
			(msg) => msg.id === messageId,
		);
		const previousUserMessage =
			modelMessageIndex > 0 && messages[modelMessageIndex - 1].isUser
				? messages[modelMessageIndex - 1]
				: null;
		if (previousUserMessage) {
			// reset({ prompt: messages[modelMessageIndex].content });
			sendMessage({ prompt: previousUserMessage.content });
		} else {
			setError("No previous user message found to rewrite from.");
		}
	};

	return (
		<div className="flex flex-col gap-2 md:flex-row">
			<EngineModelTestSidebar
				selectedModel={selectedModel}
				setSelectedModel={setSelectedModel}
				temperature={temperature}
				setTemperature={setTemperature}
				maxTokens={maxTokens}
				setMaxTokens={setMaxTokens}
			/>
			<div className="flex flex-1 flex-col">
				<Card className="gap-4 p-6 md:h-[calc(100vh-240px)]">
					<div className="flex flex-col gap-4 md:h-full md:overflow-hidden">
						<div className="flex flex-row items-center justify-between">
							<H4>Chat with the Model</H4>
						</div>
						<P className="mb-2">
							Test and interact with this LLM model. Ask
							questions, experiment with different prompts, and
							adjust parameters to see how the model responds.
							Chat history is not retained across sessions.
						</P>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>
									<div className="flex items-center justify-between">
										<span>{error}</span>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => setError("")}
											className="ml-2"
										>
											<span className="sr-only">
												Close
											</span>
											×
										</Button>
									</div>
								</AlertDescription>
							</Alert>
						)}
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-transparent">
							<div className="flex items-center justify-between bg-primary/10 p-2">
								<P className="font-medium">Chat History</P>
								{messages.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setMessages([]);
											createNewInsight();
										}}
										disabled={isLoading || isInsightLoading}
									>
										<RefreshCw className="size-4" />
										Clear Chat
									</Button>
								)}
							</div>
							<div
								ref={messagesContainerRef}
								className="flex min-h-[300px] flex-col overflow-y-auto md:min-h-0 md:flex-1"
							>
								{isInsightLoading ? (
									<Muted className="mt-4 block text-center">
										Initializing chat session...
									</Muted>
								) : messages.length === 0 ? (
									<div className="flex flex-1 flex-col items-center justify-center gap-4">
										<div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-(--muted)">
											<Pencil className="h-6 w-6 text-(--foreground)" />
										</div>
										<Muted className="text-center">
											Ask a question to start a
											conversation
										</Muted>
									</div>
								) : (
									messages.map((message) =>
										message.isUser ? (
											/* ── User bubble (right) ── */
											<div
												key={message.id}
												className="flex items-end justify-end gap-2 px-4 py-2"
											>
												<div className="max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground sm:max-w-[75%]">
													<p className="whitespace-pre-wrap break-words text-sm">
														{message.content}
													</p>
												</div>
												<div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
													<User className="size-4" />
												</div>
											</div>
										) : (
											/* ── Model bubble (left) ── */
											<div
												key={message.id}
												className="flex items-end gap-2 px-4 py-2"
											>
												<Avatar className="size-8 flex-shrink-0 bg-muted text-muted-foreground">
													<AvatarFallback>
														<Bot className="size-4" />
													</AvatarFallback>
												</Avatar>
												<div className="flex max-w-[90%] flex-col gap-1 sm:max-w-[85%]">
													<div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5">
														<Markdown>
															{message.content}
														</Markdown>
													</div>
													{message.tokens && (
														<div className="flex flex-wrap items-center gap-1">
															<Muted className="text-xs">
																{message.tokens}{" "}
																tokens
															</Muted>
															<Separator
																orientation="vertical"
																className="h-3"
															/>
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	handleRewrite(
																		message.id,
																	)
																}
																disabled={
																	isLoading ||
																	isInsightLoading
																}
																className="h-6 px-2 text-muted-foreground text-xs"
															>
																<RefreshCw className="size-3" />
																Rewrite
															</Button>
															<FeedbackButtons
																messageId={
																	message.id
																}
																onFeedbackCall={
																	handleFeedback
																}
																initialValue={
																	feedbackMap[
																		message
																			.id
																	] || null
																}
															/>
															<Button
																variant="ghost"
																size="icon-sm"
																onClick={() =>
																	navigator.clipboard.writeText(
																		message.content,
																	)
																}
																aria-label="Copy response"
															>
																<Copy className="size-3 opacity-70" />
															</Button>
														</div>
													)}
												</div>
											</div>
										),
									)
								)}
								{isLoading && (
									<div className="flex items-end gap-2 px-4 py-2">
										<Avatar className="size-8 flex-shrink-0 bg-muted text-muted-foreground">
											<AvatarFallback>
												<Bot className="size-4" />
											</AvatarFallback>
										</Avatar>
										<div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5">
											<Spinner className="size-4" />
											<Muted className="text-sm">
												Generating response…
											</Muted>
										</div>
									</div>
								)}
							</div>
							<form
								onSubmit={handleSubmit(sendMessage)}
								className="border-border border-t p-3"
							>
								<Controller
									name="prompt"
									control={control}
									render={({
										field: { ref: fieldRef, ...fieldProps },
									}) => (
										<div className="relative w-full">
											<Textarea
												{...fieldProps}
												ref={(el) => {
													textareaRef.current = el;
													fieldRef(el);
												}}
												autoFocus
												placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
												disabled={
													isLoading ||
													isInsightLoading
												}
												className="max-h-32 min-h-[44px] w-full resize-none py-[11px] pr-12"
												onKeyDown={handleKeyDown}
											/>
											<Button
												type="submit"
												variant="ghost"
												size="icon-sm"
												disabled={
													isLoading ||
													!promptValue?.trim() ||
													isInsightLoading
												}
												aria-label="Send message"
												className="absolute right-2 bottom-2 hover:bg-transparent hover:text-primary"
											>
												{isLoading ? (
													<Spinner className="size-5" />
												) : (
													<Send className="size-5" />
												)}
											</Button>
										</div>
									)}
								/>
							</form>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
};
