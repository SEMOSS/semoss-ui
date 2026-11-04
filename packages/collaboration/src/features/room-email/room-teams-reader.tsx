import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription, Button, H4, P, Small } from "@semoss/ui/next";
import { ThreadMessage } from "@/features/collaboration/components/thread-message";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";

/** Said where a chat is read live from Teams, which returns only its latest page. */
export const LIVE_TEAMS_NOTICE =
	"Only the latest Teams messages (up to 30) are shown; older chat history is not included.";

interface RoomTeamsReaderProps {
	/** The chat's name; empty shows "Teams chat". */
	title: string;
	/** The chat's readable messages in any order; they show oldest first. */
	messages: WorkspaceMessage[];
	webLink?: string;
	isLoading: boolean;
	error: string | null;
	onRetry: () => void;
	/** One line under the header, such as how much history is shown. */
	notice?: string;
	/** Shown when nothing failed and there is no message to read. */
	emptyText: string;
}

/** A Teams chat in the dock, oldest message first, with its loading and failure states. */
export function RoomTeamsReader({
	title,
	messages,
	webLink,
	isLoading,
	error,
	onRetry,
	notice,
	emptyText,
}: RoomTeamsReaderProps) {
	const sorted = [...messages].sort((left, right) =>
		left.at.localeCompare(right.at),
	);
	const people = [
		...new Set(
			sorted.flatMap((message) => {
				const name = message.fromName || message.fromAddress;
				return name ? [name] : [];
			}),
		),
	];
	const link = safeSourceUrl(webLink);
	return (
		<section
			aria-label="Teams chat"
			aria-busy={isLoading}
			className="flex size-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-background p-4"
		>
			<header className="flex min-w-0 items-start gap-2">
				<div className="min-w-0 flex-1 space-y-1">
					<H4 className="truncate">{title || "Teams chat"}</H4>
					{people.length > 0 && (
						<Small className="block truncate text-muted-foreground text-xs">
							{people.join(", ")}
						</Small>
					)}
				</div>
				{link && (
					<Button variant="ghost" size="sm" asChild>
						<a
							href={link}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLink aria-hidden="true" />
							Open in Teams
						</a>
					</Button>
				)}
			</header>
			{notice && (
				<Small className="text-muted-foreground">{notice}</Small>
			)}
			{isLoading && <output>Loading chat...</output>}
			{error && (
				<Alert variant="destructive">
					<AlertDescription className="space-y-2">
						<P>{error}</P>
						<Button
							type="button"
							variant="outline"
							className="pointer-coarse:min-h-11"
							disabled={isLoading}
							onClick={onRetry}
						>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{sorted.length ? (
				<div className="flex flex-col gap-5">
					{sorted.map((message) => (
						<ThreadMessage
							key={message.id}
							message={message}
							name={
								message.fromName ||
								message.fromAddress ||
								"Participant"
							}
							channel="teams"
							isIncluded
							isEmpty={!message.text.trim()}
							isFlat
						/>
					))}
				</div>
			) : !isLoading && !error ? (
				<P>{emptyText}</P>
			) : null}
		</section>
	);
}
