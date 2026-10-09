import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Button,
	FormSelect,
	FormTextarea,
	H3,
	Label,
	P,
	SelectItem,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import { Failure } from "./onboarding-ui";
import type { useTopicOrganization } from "./use-topic-organization";

interface TopicOrganizationContextProps {
	organization: ReturnType<typeof useTopicOrganization>;
	canGroup: boolean;
	topics: { key: string; name: string }[];
	isBusy: boolean;
	isAsking: boolean;
	hasProposal: boolean;
	error: string | null;
	onAsk: () => void;
	onShowProposal: () => void;
	triggerId: string;
}

/** The owner's organizing context belongs to setup, alongside an optional assistant. */
export function TopicOrganizationContext({
	organization,
	canGroup,
	topics,
	isBusy,
	isAsking,
	hasProposal,
	error,
	onAsk,
	onShowProposal,
	triggerId,
}: TopicOrganizationContextProps) {
	const [chatInput, setChatInput] = useState("");
	const chatInputRef = useRef<HTMLTextAreaElement>(null);
	const [focusChat, setFocusChat] = useState(false);
	useEffect(() => {
		if (!focusChat || isBusy) return;
		chatInputRef.current?.focus();
		setFocusChat(false);
	}, [focusChat, isBusy]);
	return (
		<section
			aria-labelledby={`${triggerId}-heading`}
			className="min-w-0 space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-6"
		>
			<H3 id={`${triggerId}-heading`} className="text-lg">
				How do you organize your work?
			</H3>
			<P className="text-muted-foreground text-sm">
				Describe the projects, clients or areas that matter to you. The
				assistant can align overlapping suggestions and propose a
				smaller starting set.
			</P>
			<FormTextarea
				name="guidance"
				label="Give the assistant some context (optional)"
				rows={3}
				maxLength={6000}
				disabled={isBusy}
				placeholder={
					"Recruiting: working with John M and Taylor J; UNC and VCU emails.\nBank client A: Jim and Hank Z; client A delivery threads."
				}
			/>
			<FormSelect
				name="granularity"
				label="How broad should your topics be?"
				disabled={isBusy}
			>
				<SelectItem value="broad">
					Broad areas — a small starting set
				</SelectItem>
				<SelectItem value="projects">
					Individual projects and clients
				</SelectItem>
				<SelectItem value="detailed">More detailed topics</SelectItem>
			</FormSelect>
			<div className="flex flex-wrap gap-2">
				<Button
					id={triggerId}
					type="button"
					variant="outline"
					disabled={isBusy || !canGroup}
					onClick={onAsk}
				>
					{isAsking ? (
						<Spinner className="size-4" />
					) : (
						<Sparkles aria-hidden="true" />
					)}
					{isAsking
						? "Thinking through your topics…"
						: "Suggest a better grouping"}
				</Button>
				{hasProposal && (
					<Button
						type="button"
						variant="ghost"
						disabled={isBusy}
						onClick={onShowProposal}
					>
						Review suggested groups
					</Button>
				)}
			</div>
			<P className="text-muted-foreground text-xs">
				You choose what to keep. Suggestions become draft changes only
				after you review them.
			</P>
			{error && <Failure error={error} />}
			<div className="space-y-3 border-t pt-4">
				<H3 className="text-base">Talk through your topics</H3>
				<P className="text-muted-foreground text-sm">
					Ask questions or describe a change. You review each proposal
					before it changes your draft.
				</P>
				{organization.chatMessages.length > 0 && (
					<ol
						aria-label="Setup conversation"
						className="max-h-80 space-y-3 overflow-y-auto"
					>
						{organization.chatMessages.map((message, index) => (
							<li key={`${index}-${message.role}`}>
								<P className="font-medium text-sm">
									{message.role === "owner"
										? "You"
										: "Assistant"}
								</P>
								<P className="whitespace-pre-wrap break-words text-sm">
									{message.text}
								</P>
							</li>
						))}
					</ol>
				)}
				<Label htmlFor={`${triggerId}-chat`}>
					Message the setup assistant
				</Label>
				<Textarea
					id={`${triggerId}-chat`}
					ref={chatInputRef}
					value={chatInput}
					maxLength={4000}
					rows={3}
					disabled={isBusy}
					onChange={(event) => setChatInput(event.target.value)}
				/>
				<Button
					type="button"
					variant="outline"
					disabled={isBusy || !chatInput.trim()}
					onClick={() =>
						void organization.sendChat(chatInput).then((sent) => {
							if (sent) {
								setChatInput("");
								setFocusChat(true);
							}
						})
					}
				>
					{organization.isChatting
						? "Thinking…"
						: "Send to setup assistant"}
				</Button>
				{organization.chatError && (
					<Failure error={organization.chatError} />
				)}
				{organization.isChatStale && (
					<output className="text-muted-foreground text-sm">
						Your draft changed. Ask again before using remaining
						proposals.
					</output>
				)}
				{organization.chatReply && (
					<ul
						aria-label="Proposed topic changes"
						className="divide-y"
					>
						{organization.chatReply.changes.map((change, index) => {
							const state = organization.chatStates[index];
							const name =
								change.name ||
								topics.find(
									(topic) => topic.key === change.topicKey,
								)?.name;
							return (
								<li
									key={`${organization.chatReply?.revision}-${index}`}
									className="space-y-2 py-3"
								>
									<P className="break-words font-medium text-sm">
										{
											(
												{
													add_topic: "Add topic",
													edit_topic: "Edit topic",
													keep: "Keep topic",
													skip: "Skip topic",
													combine: "Combine topics",
												} as const
											)[change.type]
										}
										{name ? `: ${name}` : ""}
									</P>
									{change.type === "combine" && (
										<P className="break-words text-sm">
											{change.topicKeys
												.map(
													(key) =>
														topics.find(
															(topic) =>
																topic.key ===
																key,
														)?.name ||
														"Topic unavailable",
												)
												.join(" · ")}
										</P>
									)}
									{change.description && (
										<P className="break-words text-sm">
											{change.description}
										</P>
									)}
									{change.reason && (
										<P className="break-words text-muted-foreground text-sm">
											{change.reason}
										</P>
									)}
									{change.addTerms.length > 0 && (
										<P className="break-words text-sm">
											Add clues:{" "}
											{change.addTerms.join(", ")}
										</P>
									)}
									{change.addPeople.length > 0 && (
										<P className="break-words text-sm">
											Add people:{" "}
											{change.addPeople
												.map((person) => person.name)
												.join(", ")}
										</P>
									)}
									{change.removePeople.length > 0 && (
										<P className="break-words text-sm">
											Remove people:{" "}
											{change.removePeople
												.map((person) => person.name)
												.join(", ")}
										</P>
									)}
									{state ? (
										<P className="text-muted-foreground text-sm">
											{state === "used"
												? "Added to your draft"
												: state === "dismissed"
													? "Dismissed"
													: "Topic changed; ask again"}
										</P>
									) : (
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={
													isBusy ||
													organization.isChatStale
												}
												onClick={() =>
													void organization
														.acceptChatChange(index)
														.then(() => {
															if (
																change.type !==
																"combine"
															)
																setFocusChat(
																	true,
																);
														})
												}
											>
												{change.type === "combine"
													? "Review combination"
													: "Use in my draft"}
											</Button>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												disabled={isBusy}
												onClick={() => {
													organization.dismissChatChange(
														index,
													);
													setFocusChat(true);
												}}
											>
												Dismiss proposal
											</Button>
										</div>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</section>
	);
}
