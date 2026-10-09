import { Check, MessageSquare, Send, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Button, cn, H3, Label, P, Spinner, Textarea } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { message as errorMessage, Failure } from "./onboarding-ui";
import type { TopicReview } from "./topic-review-api";
import {
	chatTopicSetup,
	type SetupChange,
	type SetupMessage,
} from "./topic-setup-api";

interface TopicSetupChatProps {
	actions: InsightActions;
	reviewId: string;
	/** Current topic names, for describing proposed changes. */
	topics: { key: string; name: string }[];
	isBusy: boolean;
	/** Save the current draft and return the saved review the chat reads. */
	onSave: () => Promise<TopicReview>;
	/** Apply one proposed change to the draft; false when it no longer fits. */
	onApply: (
		change: SetupChange,
		options?: { stay?: boolean },
	) => Promise<boolean> | boolean;
	/** The owner's own words, kept as context for grouping suggestions. */
	onOwnerWords: (text: string) => void;
	className?: string;
}

const GREETING =
	"Tell me how you organize your work, for example one line per topic with the people on it. I propose changes you can apply; nothing changes until you do.";

/** A general setup chat beside the topic walk-through. */
export function TopicSetupChat({
	actions,
	reviewId,
	topics,
	isBusy,
	onSave,
	onApply,
	onOwnerWords,
	className,
}: TopicSetupChatProps) {
	const id = useId();
	const storageKey = `collaboration-topic-setup-chat:${reviewId}`;
	const [messages, setMessages] = useState<SetupMessage[]>(() => {
		try {
			const saved = sessionStorage.getItem(storageKey);
			return saved ? (JSON.parse(saved) as SetupMessage[]) : [];
		} catch {
			return [];
		}
	});
	const [draft, setDraft] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(messages));
		} catch {
			// storage is best effort
		}
		const list = listRef.current;
		if (list) list.scrollTop = list.scrollHeight;
	}, [messages, storageKey]);

	const send = async (): Promise<void> => {
		const text = draft.trim();
		if (!text || isSending) return;
		const next: SetupMessage[] = [...messages, { role: "owner", text }];
		setMessages(next);
		setDraft("");
		setError(null);
		setIsSending(true);
		onOwnerWords(
			next
				.filter((item) => item.role === "owner")
				.map((item) => item.text)
				.join("\n")
				.slice(-6000),
		);
		try {
			const saved = await onSave();
			const answer = await chatTopicSetup(actions, saved, next);
			setMessages([
				...next,
				{
					role: "assistant",
					text: answer.reply,
					changes: answer.changes,
				},
			]);
		} catch (cause: unknown) {
			setError(errorMessage(cause));
		} finally {
			setIsSending(false);
		}
	};

	const handle = async (
		messageIndex: number,
		changeIndex: number,
		apply: boolean,
	): Promise<void> => {
		const change = messages[messageIndex]?.changes?.[changeIndex];
		if (!change) return;
		if (apply && !(await onApply(change))) {
			setError(
				"That change no longer fits your topics. Ask the assistant again.",
			);
			return;
		}
		setMessages((current) =>
			current.map((item, index) =>
				index === messageIndex
					? {
							...item,
							handled: [...(item.handled ?? []), changeIndex],
						}
					: item,
			),
		);
	};

	// combinations open a preview each, so they stay for the owner to apply one at a time
	const applyAll = async (messageIndex: number): Promise<void> => {
		const item = messages[messageIndex];
		if (!item?.changes) return;
		const done: number[] = [];
		let failed = 0;
		for (const [changeIndex, change] of item.changes.entries()) {
			if (
				item.handled?.includes(changeIndex) ||
				change.type === "combine"
			)
				continue;
			if (await onApply(change, { stay: true })) done.push(changeIndex);
			else failed++;
		}
		setError(
			failed
				? `${failed} of these no longer fit your topics. Ask the assistant again.`
				: null,
		);
		setMessages((current) =>
			current.map((entry, index) =>
				index === messageIndex
					? { ...entry, handled: [...(entry.handled ?? []), ...done] }
					: entry,
			),
		);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void send();
		}
	};

	return (
		<section
			aria-labelledby={`${id}-heading`}
			className={cn(
				"flex min-w-0 flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4",
				className,
			)}
		>
			<H3
				id={`${id}-heading`}
				className="flex items-center gap-2 pr-8 text-base"
			>
				<MessageSquare className="size-4" aria-hidden="true" />
				Set up with the assistant
			</H3>
			<div
				ref={listRef}
				className="flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto"
				aria-live="polite"
			>
				<P className="text-muted-foreground text-sm">{GREETING}</P>
				{messages.map((item, messageIndex) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only
						key={messageIndex}
						className={
							item.role === "owner"
								? "self-end rounded-lg bg-background px-3 py-2 text-sm"
								: "space-y-2 text-sm"
						}
					>
						<P className="whitespace-pre-wrap break-words text-sm">
							{item.text}
						</P>
						{(item.changes?.filter(
							(change, changeIndex) =>
								change.type !== "combine" &&
								!item.handled?.includes(changeIndex),
						).length ?? 0) > 1 && (
							<Button
								type="button"
								size="sm"
								disabled={isBusy || isSending}
								onClick={() => void applyAll(messageIndex)}
							>
								<Check aria-hidden="true" /> Apply all
							</Button>
						)}
						{item.changes?.map((change, changeIndex) => {
							const isHandled =
								item.handled?.includes(changeIndex) ?? false;
							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: changes are fixed per reply
									key={changeIndex}
									className="space-y-2 rounded-lg border bg-background p-3"
								>
									<P className="break-words font-medium text-sm">
										{title(change, topics)}
									</P>
									{details(change).map((line) => (
										<P
											key={line}
											className="break-words text-muted-foreground text-xs"
										>
											{line}
										</P>
									))}
									{isHandled ? (
										<P className="text-muted-foreground text-xs">
											Done
										</P>
									) : (
										<div className="flex gap-2">
											<Button
												type="button"
												size="sm"
												disabled={isBusy || isSending}
												onClick={() =>
													void handle(
														messageIndex,
														changeIndex,
														true,
													)
												}
											>
												<Check aria-hidden="true" />{" "}
												Apply
											</Button>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												disabled={isBusy || isSending}
												onClick={() =>
													void handle(
														messageIndex,
														changeIndex,
														false,
													)
												}
											>
												<X aria-hidden="true" /> Dismiss
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				))}
				{isSending && (
					<P className="flex items-center gap-2 text-muted-foreground text-sm">
						<Spinner className="size-4" /> Thinking...
					</P>
				)}
			</div>
			{error && <Failure error={error} />}
			<Label htmlFor={`${id}-input`} className="sr-only">
				Message the setup assistant
			</Label>
			<Textarea
				id={`${id}-input`}
				rows={3}
				value={draft}
				maxLength={4000}
				disabled={isSending}
				placeholder="For example: recruiting with two colleagues, and a client project with their delivery team"
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={onKeyDown}
			/>
			<Button
				type="button"
				className="self-end"
				disabled={isBusy || isSending || !draft.trim()}
				onClick={() => void send()}
			>
				<Send aria-hidden="true" /> Send
			</Button>
		</section>
	);
}

function title(change: SetupChange, topics: { key: string; name: string }[]) {
	const nameOf = (key: string) =>
		topics.find((topic) => topic.key === key)?.name || "a topic";
	switch (change.type) {
		case "add_topic":
			return `Add topic: ${change.name}`;
		case "edit_topic":
			return `Update ${nameOf(change.topicKey)}`;
		case "keep":
			return `Keep ${nameOf(change.topicKey)}`;
		case "skip":
			return `Skip ${nameOf(change.topicKey)}`;
		case "combine":
			return `Combine ${change.topicKeys.map(nameOf).join(", ")}${change.name ? ` into ${change.name}` : ""}`;
	}
}

function details(change: SetupChange): string[] {
	const lines: string[] = [];
	if (change.type === "edit_topic" && change.name)
		lines.push(`Rename to ${change.name}`);
	if (change.addPeople.length)
		lines.push(
			`Add ${change.addPeople.map((person) => person.name).join(", ")}`,
		);
	if (change.removePeople.length)
		lines.push(
			`Remove ${change.removePeople.map((person) => person.name).join(", ")}`,
		);
	if (change.addTerms.length)
		lines.push(`Clues: ${change.addTerms.join(", ")}`);
	if (change.description && change.type !== "combine")
		lines.push(change.description);
	if (change.reason) lines.push(change.reason);
	return lines;
}
