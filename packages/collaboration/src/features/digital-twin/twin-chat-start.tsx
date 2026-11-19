import {
	ArrowLeft,
	ArrowUpRight,
	BookOpenText,
	Files,
	MessageCircle,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	H1,
	H2,
	Markdown,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { topicTone } from "@/features/collaboration/topic-tone";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { MESSAGE_PROSE_CLASS_NAME } from "@/features/messages/components/message-prose.styles";
import type { InsightActions } from "@/lib/pixel";
import { twinContentsPath } from "@/lib/workspace-paths";
import { getTwinChatWelcome } from "./api/digital-twin";
import { markTwinOpened } from "./opened-twins";
import { useTwinRead } from "./use-twin-read";
import "./twin-gallery.css";

interface TwinChatStartProps {
	/** The twin to chat with. The composer reads the same id from the address. */
	agentId: string;
}

const KNOWLEDGE_PROMPTS = [
	{
		id: "topics",
		title: "What can I ask about?",
		context:
			"What topics can you help me with? Give me a few examples from the material shared with you.",
	},
	{
		id: "decisions",
		title: "Catch me up on decisions",
		context:
			"Which decisions are mentioned in the material shared with you? Summarize them and tell me where each one came from.",
	},
];
const OWNER_PROMPTS = [
	...KNOWLEDGE_PROMPTS,
	{
		id: "add-document",
		title: "Add a document",
		context:
			"I'd like to add a document to this twin. What should I attach here, and what will others be able to see?",
	},
];
const SHARED_PROMPTS = [
	...KNOWLEDGE_PROMPTS,
	{
		id: "sources",
		title: "Find a source",
		context:
			"Which shared documents could help me get up to speed? Tell me what each one covers.",
	},
];

/** Introduces the twin, its sources and, for its owner, the changes they can approve in chat. */
export function TwinChatStart({ agentId }: TwinChatStartProps) {
	const read = useCallback(
		(actions: InsightActions) => getTwinChatWelcome(actions, agentId),
		[agentId],
	);
	const welcome = useTwinRead(read);
	const twin = welcome.data?.agent;
	const fileAccess = welcome.data?.fileAccess;
	const canAdd = fileAccess === "manage" || fileAccess === "add";
	const { profile } = useCollaborationSession().state;
	const person = profile.email || profile.id;
	const isOpened = twin !== undefined;
	useEffect(() => {
		if (isOpened) markTwinOpened(person, agentId);
	}, [isOpened, person, agentId]);
	const portrait = agentImageUrl(agentId);
	const greeting = twin?.config_json?.greeting_enabled
		? twin.config_json.greeting?.trim()
		: "";
	return (
		<CollaborationPage>
			<div className="@container/twins mx-auto flex w-full max-w-4xl flex-col gap-5">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="-ms-2 pointer-coarse:min-h-11 self-start"
				>
					<Link to="/twins">
						<ArrowLeft
							aria-hidden="true"
							className="rtl:rotate-180"
						/>
						Digital Twins
					</Link>
				</Button>
				{twin ? (
					<>
						<header className="twin-gallery-cover relative isolate @lg/twins:flex grid @3xl/twins:min-h-52 @lg/twins:min-h-48 min-w-0 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 overflow-hidden rounded-xl border @lg/twins:border-0 bg-card @lg/twins:p-8 p-4">
							<div
								aria-hidden="true"
								className={cn(
									"twin-gallery-art -z-10 pointer-events-none absolute inset-0 @lg/twins:block hidden overflow-hidden",
									topicTone(agentId),
								)}
							>
								<span
									className="twin-gallery-wash"
									style={{
										backgroundImage: `url("${portrait}")`,
									}}
								/>
							</div>
							<AgentAvatar
								agent={{ name: twin.name, avatar: portrait }}
								size="lg"
								shape="rounded"
								className="twin-gallery-portrait size-14 @lg/twins:max-w-56"
							/>
							<div className="@lg/twins:relative @lg/twins:z-10 @lg/twins:flex contents @lg/twins:w-3/5 @lg/twins:flex-col @lg/twins:gap-3 @lg/twins:text-primary-foreground">
								<H1 className="wrap-anywhere min-w-0 font-display font-medium @3xl/twins:text-5xl @lg/twins:text-4xl text-3xl leading-none tracking-tight">
									{twin.name}
								</H1>
								<P className="col-span-full max-w-prose @lg/twins:text-base @lg/twins:text-inherit text-muted-foreground text-sm leading-relaxed">
									{canAdd
										? "Your AI twin answers questions using the emails, chats, and files you’ve shared with it."
										: "Ask this AI twin about the emails, chats, and files its owner chose to share."}
								</P>
							</div>
						</header>
						<section
							aria-label="Start a conversation"
							className="flex min-w-0 flex-col gap-3"
						>
							<H2 className="font-semibold text-xl tracking-tight">
								Start a conversation
							</H2>
							{greeting && (
								<div className="flex min-w-0 items-start gap-3">
									<MessageCircle
										aria-hidden="true"
										className="mt-1 size-4 shrink-0 text-muted-foreground"
									/>
									<Markdown
										dir="auto"
										className={cn(
											"min-w-0",
											MESSAGE_PROSE_CLASS_NAME,
										)}
									>
										{greeting}
									</Markdown>
								</div>
							)}
							<LandingChatComposer
								isAgentLocked
								starterPrompts={
									canAdd ? OWNER_PROMPTS : SHARED_PROMPTS
								}
							/>
						</section>
						{canAdd ? (
							<section className="flex min-w-0 items-start @lg/twins:gap-4 gap-3 rounded-xl border border-assistant/20 bg-assistant/5 @lg/twins:p-5 p-4">
								<Files
									aria-hidden="true"
									className="mt-0.5 size-5 shrink-0 text-assistant"
								/>
								<div className="min-w-0 space-y-1">
									<H2 className="font-semibold text-base">
										Choose what your twin shares
									</H2>
									<P className="max-w-prose text-sm leading-relaxed">
										{fileAccess === "manage"
											? "Ask your twin to add a document from this chat or stop sharing one by deleting its saved copy. You review and approve each change. Your original files stay where they are."
											: "Ask your twin to add a document from this chat. You review and approve each addition before anyone else can use the copy in a chat with your twin."}
									</P>
									{twin.permission === "OWNER" && (
										<Button
											asChild
											size="sm"
											variant="link"
											className="h-auto min-h-8 pointer-coarse:min-h-11 px-0"
										>
											<Link
												to={twinContentsPath(
													"files",
													agentId,
												)}
											>
												{fileAccess === "manage"
													? "View shared documents"
													: "View or remove shared documents"}{" "}
												<ArrowUpRight aria-hidden="true" />
											</Link>
										</Button>
									)}
								</div>
							</section>
						) : (
							<aside className="flex items-start gap-3 border-t py-4">
								<BookOpenText
									aria-hidden="true"
									className="mt-0.5 size-5 shrink-0 text-muted-foreground"
								/>
								<div className="min-w-0 space-y-1">
									<H2 className="font-semibold text-base">
										Ask for the source
									</H2>
									<P className="max-w-prose text-muted-foreground text-sm leading-relaxed">
										Ask which shared email, conversation, or
										file supports an answer. The twin has no
										access to your own mail, calendar, or
										files unless you bring material into
										this chat.
									</P>
								</div>
							</aside>
						)}
					</>
				) : welcome.error ? (
					<Alert variant="destructive">
						<AlertTitle>
							This Digital Twin could not be opened
						</AlertTitle>
						<AlertDescription>
							It may have been deleted, or it is no longer shared
							with you. {welcome.error}
						</AlertDescription>
					</Alert>
				) : (
					<div className="flex flex-col gap-5">
						<Skeleton className="@lg/twins:h-48 h-32 w-full" />
						<Skeleton className="h-7 w-48" />
						<Skeleton className="h-32 w-full" />
						<output className="sr-only">
							Loading the Digital Twin…
						</output>
					</div>
				)}
			</div>
		</CollaborationPage>
	);
}
