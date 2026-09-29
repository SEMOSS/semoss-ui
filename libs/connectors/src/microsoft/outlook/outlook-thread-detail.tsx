import { useTranslation } from "@semoss/i18n";
import { Muted } from "@semoss/ui/next";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import {
	outlookThreadFileName,
	outlookThreadToMarkdown,
} from "../microsoft.markdown";
import { parseMailList } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { OutlookMessage } from "../microsoft.types";
import {
	normalizeMailSubject,
	type OutlookConversation,
	selectThread,
} from "./outlook-mail.threads";
import { OutlookThreadMessage } from "./outlook-thread-message";

/** The most emails of one thread read at once. */
export const THREAD_LIMIT = 50;

/**
 * Read a whole thread with its bodies, from every folder, so replies kept in
 * Sent Items come too.
 *
 * @param read - Runs a reactor call and resolves to its output.
 * @param conversationId - The thread.
 * @return The thread's emails, oldest first.
 */
export const readConversation = async (
	read: (pixel: string) => Promise<unknown>,
	conversationId: string,
): Promise<OutlookMessage[]> =>
	selectThread(
		parseMailList(
			await read(
				MICROSOFT_PIXELS.outlookListConversation({
					conversationId: conversationId,
					limit: THREAD_LIMIT,
				}),
			),
		),
		conversationId,
	);

/**
 * How to save a whole thread: its emails are read with their bodies, from
 * every folder, and written out as one Markdown file.
 *
 * @param key - Identifies the save, for its busy state.
 * @param name - What to call it in messages.
 * @param subject - The thread's subject, for the file name.
 * @param readThread - Reads the thread's emails, oldest first.
 * @return The save request.
 */
export const threadSaveRequest = (
	key: string,
	name: string,
	subject: string | undefined,
	readThread: () => Promise<OutlookMessage[]>,
): ConnectorSaveRequest => ({
	key: key,
	name: name,
	source: {
		kind: "text",
		fileName: outlookThreadFileName(subject),
		getContent: async () => outlookThreadToMarkdown(await readThread()),
	},
});

/** Props for {@link OutlookThreadDetail}. */
export interface OutlookThreadDetailProps {
	/** The thread as the folder's list shows it. */
	conversation: OutlookConversation & { conversationId: string };
	/** Where the list is, for the back button. */
	folderName: string;
	/** Saves the thread and its attachments into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One email thread, read from every folder so the user's own replies are in
 * it, and laid out the way Outlook shows a conversation: newest first, each
 * email on its own with only its own text, the newest open and the others
 * showing how they begin. The whole thread can be added to the conversation
 * or saved as one file, oldest first.
 */
export const OutlookThreadDetail = ({
	conversation,
	folderName,
	saver,
	onBack,
	onSignIn,
}: OutlookThreadDetailProps) => {
	const { t } = useTranslation("connectors");
	const query = useConnectorQuery(
		MICROSOFT_PIXELS.outlookListConversation({
			conversationId: conversation.conversationId,
			limit: THREAD_LIMIT,
		}),
		parseMailList,
	);
	const thread = query.data
		? selectThread(query.data, conversation.conversationId)
		: null;
	const serviceName = t("services.outlookMail");
	const title =
		normalizeMailSubject(conversation.latest.subject) ||
		t("common.noSubject");
	const people = [
		...new Set(
			(thread ?? conversation.messages)
				.map((message) => message.fromName ?? message.from)
				.filter((from): from is string => !!from),
		),
	].join(", ");
	const newestFirst = thread ? [...thread].reverse() : [];

	const request = (emails: OutlookMessage[]) =>
		threadSaveRequest(
			conversation.key,
			title,
			conversation.latest.subject,
			async () => emails,
		);

	return (
		<ConnectorDetailView
			title={title}
			backLabel={t("mail.backTo", { folder: folderName })}
			onBack={onBack}
			fields={[
				{ label: t("mail.people"), value: people },
				{
					label: t("mail.emails"),
					value: thread
						? t("mail.emailCount", { count: thread.length })
						: "",
				},
			]}
			actions={
				thread ? (
					<ConnectorActionBar
						serviceName={serviceName}
						saveLabel={saver.saveLabel}
						isBusy={saver.isBusy(conversation.key)}
						onAddToContext={
							saver.addToContext
								? () => saver.addToContext?.(request(thread))
								: undefined
						}
						onSave={() => saver.save(request(thread))}
					/>
				) : null
			}
		>
			{thread ? (
				thread.length === 0 ? (
					<Muted>{t("mail.threadEmpty")}</Muted>
				) : (
					<div className="flex flex-col gap-2">
						{thread.length >= THREAD_LIMIT ? (
							<Muted>
								{t("mail.threadLimit", {
									count: thread.length,
								})}
							</Muted>
						) : null}
						{newestFirst.map((message, index) => (
							<OutlookThreadMessage
								key={message.uid}
								message={message}
								isInitiallyExpanded={index === 0}
								saver={saver}
								onSignIn={onSignIn}
							/>
						))}
					</div>
				)
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					onSignIn={onSignIn}
					skeletonRows={4}
				/>
			)}
		</ConnectorDetailView>
	);
};
