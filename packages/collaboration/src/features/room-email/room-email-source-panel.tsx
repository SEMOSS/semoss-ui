import { Mail } from "lucide-react";
import { createElement, useEffect, useId } from "react";
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
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { dateLabel } from "@/features/collaboration/date-label";
import { useRoomEmail } from "./room-email.context";
import { RoomSourceEmail } from "./room-source-email";

export const ROOM_EMAIL_SOURCE_PANEL_TYPE = "collaboration-email-source";

interface RoomEmailSourcePanelConfig {
	/** Selection is a provider email UID within the room's imported allowlist. */
	messageId?: string;
}

/** Read an imported email and start a reply through its owning room. */
export function RoomEmailSourcePanel({ id }: WorkbenchPanelProps) {
	const { config, setConfig } =
		useWorkbenchPanel<RoomEmailSourcePanelConfig>(id);
	const {
		source,
		sourceMessages,
		isSourceLoading,
		sourceError,
		reloadSource,
		replyToSource,
		selectSourceMessage,
	} = useRoomEmail();
	const selectorId = useId();
	const allowedIds = new Set(source?.messages.map((message) => message.id));
	const messages = sourceMessages.filter(
		(message) =>
			source?.channel === "email" &&
			allowedIds.has(message.id) &&
			!message.excluded,
	);
	const message =
		messages.find((item) => item.id === config.messageId) ??
		messages.at(-1);
	const messageId = message?.id;
	useEffect(() => {
		if (messageId) selectSourceMessage(messageId);
	}, [messageId, selectSourceMessage]);
	if (source?.channel !== "email")
		return <P className="p-4">This room does not have a source email.</P>;
	return (
		<section
			aria-label="Source email"
			aria-busy={isSourceLoading}
			className="flex size-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-background p-4"
		>
			{messages.length > 1 && (
				<div className="flex min-w-0 flex-col gap-2">
					<Label htmlFor={selectorId}>Email</Label>
					<Select
						value={message?.id}
						onValueChange={(messageId) => setConfig({ messageId })}
					>
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
			{isSourceLoading && <output>Loading email…</output>}
			{sourceError && (
				<Alert variant="destructive">
					<AlertDescription className="space-y-2">
						<P>{sourceError}</P>
						<Button
							type="button"
							variant="outline"
							className="pointer-coarse:min-h-11"
							disabled={isSourceLoading}
							onClick={reloadSource}
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
					isLoading={isSourceLoading}
					onReply={replyToSource}
				/>
			) : !isSourceLoading && !sourceError ? (
				<P>No included email is available in this room.</P>
			) : null}
		</section>
	);
}

const ROOM_EMAIL_SOURCE_PANEL: WorkbenchPanelConfig<RoomEmailSourcePanelConfig> =
	{
		name: "Email",
		icon: ({ className }) =>
			createElement(Mail, { className, "aria-hidden": true }),
		content: RoomEmailSourcePanel,
		mount: "keepAlive",
		canRename: false,
		canSplitTab: false,
		matches: () => true,
	};

/** Register the source reader in the room's existing tool and file dock. */
export const ROOM_EMAIL_SOURCE_PANEL_COMPONENTS = {
	[ROOM_EMAIL_SOURCE_PANEL_TYPE]: ROOM_EMAIL_SOURCE_PANEL,
};
