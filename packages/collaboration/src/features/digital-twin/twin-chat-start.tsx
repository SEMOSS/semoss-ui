import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	H1,
	Markdown,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { getAgent } from "@/features/agents/api/get-agent";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { MESSAGE_PROSE_CLASS_NAME } from "@/features/messages/components/message-prose.styles";
import type { InsightActions } from "@/lib/pixel";
import { useTwinRead } from "./use-twin-read";

interface TwinChatStartProps {
	/** The twin to chat with, as the address names it; the composer below reads the same address. */
	agentId: string;
}

/**
 * Where a chat with a Digital Twin starts: who it is, its greeting when it
 * has one, and the ask box, which opens the chat on the first message. A twin
 * the signed-in person cannot open gets no ask box.
 */
export function TwinChatStart({ agentId }: TwinChatStartProps) {
	const read = useCallback(
		(actions: InsightActions) =>
			agentId
				? getAgent(actions, agentId)
				: Promise.reject(new Error("The link names no Digital Twin.")),
		[agentId],
	);
	const twin = useTwinRead(read);
	const greeting = twin.data?.config_json?.greeting_enabled
		? twin.data.config_json.greeting?.trim()
		: "";
	return (
		<CollaborationPage>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="-ml-2 pointer-coarse:min-h-11 self-start"
				>
					<Link to="/twins">
						<ArrowLeft aria-hidden="true" />
						Digital Twins
					</Link>
				</Button>
				{twin.data ? (
					<>
						<header className="flex min-w-0 items-center gap-4">
							<AgentAvatar
								agent={{
									name: twin.data.name,
									avatar: agentImageUrl(agentId),
								}}
								size="lg"
							/>
							<div className="min-w-0 space-y-1">
								<H1 className="wrap-anywhere font-medium text-2xl leading-snug tracking-tight">
									{twin.data.name}
								</H1>
								<P className="text-muted-foreground text-sm">
									A Digital Twin: an AI, not the person. It
									answers from the copies its owner put into
									it.
								</P>
							</div>
						</header>
						{greeting && (
							<Markdown
								dir="auto"
								className={cn(
									"min-w-0 rounded-xl border bg-card p-4",
									MESSAGE_PROSE_CLASS_NAME,
								)}
							>
								{greeting}
							</Markdown>
						)}
						<LandingChatComposer />
					</>
				) : twin.error ? (
					<Alert variant="destructive">
						<AlertTitle>
							This Digital Twin could not be opened
						</AlertTitle>
						<AlertDescription>
							It may have been deleted, or it is no longer shared
							with you. The reason given: {twin.error}
						</AlertDescription>
					</Alert>
				) : (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-16 w-2/3" />
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
