import { useId } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { dateLabel } from "@/features/collaboration/date-label";
import type {
	Profile,
	WorkspaceMessage,
} from "@/features/collaboration/state/collaboration.types";
import { type EmailReaderSource, RoomSourceEmail } from "./room-source-email";

interface RoomEmailReaderProps {
	/** Names the reader's region. */
	label: string;
	source: EmailReaderSource;
	/** The emails the owner may pick from, oldest first. */
	messages: WorkspaceMessage[];
	/** The email on screen, from {@link shownEmail}. */
	message: WorkspaceMessage | undefined;
	onSelect: (messageId: string) => void;
	isLoading: boolean;
	error: string | null;
	onRetry: () => void;
	/** A line above the email, such as why the email asked for is not the one shown. */
	notice?: string;
	/** Shown when nothing failed and there is no email to read. */
	emptyText: string;
	/** Absent where the owner only reads the thread. */
	onReply?: (messageId: string) => void;
}

/**
 * The owner's pick, else the newest email someone else sent: a reply to the
 * owner's own last email is rarely what they want.
 */
export function shownEmail(
	messages: WorkspaceMessage[],
	messageId: string | undefined,
	profile: Pick<Profile, "id" | "email"> | null | undefined,
): WorkspaceMessage | undefined {
	// sample data calls the owner "me"; live data uses the owner's person id
	const isOwnEmail = (item: WorkspaceMessage) =>
		item.fromId === "me" ||
		item.fromId === profile?.id ||
		(Boolean(profile?.email) &&
			item.fromAddress?.toLowerCase() === profile?.email.toLowerCase());
	return (
		messages.find((item) => item.id === messageId) ??
		messages.filter((item) => !isOwnEmail(item)).at(-1) ??
		messages.at(-1)
	);
}

/** One email of a thread in the dock, with a picker when the thread has more. */
export function RoomEmailReader({
	label,
	source,
	messages,
	message,
	onSelect,
	isLoading,
	error,
	onRetry,
	notice,
	emptyText,
	onReply,
}: RoomEmailReaderProps) {
	const selectorId = useId();
	return (
		<section
			aria-label={label}
			aria-busy={isLoading}
			className="flex size-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-background p-4"
		>
			{messages.length > 1 && (
				<div className="flex min-w-0 flex-col gap-2">
					<Label htmlFor={selectorId}>Email</Label>
					<Select value={message?.id} onValueChange={onSelect}>
						<SelectTrigger
							id={selectorId}
							className="pointer-coarse:min-h-11 w-full min-w-0"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{messages.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.fromName ||
										item.fromAddress ||
										"Email"}{" "}
									· {dateLabel(item.at)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
			{/* a note about what is shown, not an error, so it is announced politely */}
			{notice && (
				<output className="text-muted-foreground text-sm">
					{notice}
				</output>
			)}
			{isLoading && <output>Loading email…</output>}
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
			{message ? (
				<RoomSourceEmail
					source={source}
					message={message}
					isLoading={isLoading}
					onReply={onReply}
				/>
			) : !isLoading && !error ? (
				<P>{emptyText}</P>
			) : null}
		</section>
	);
}
