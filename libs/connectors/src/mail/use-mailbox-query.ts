import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { ConnectorAccount } from "../core/connector.types";
import {
	type ConnectorErrorInfo,
	classifyConnectorError,
	runConnectorPixel,
} from "../core/connector-pixel";
import type { ConnectorQuery } from "../core/use-connector-query";
import { parseMailPage } from "./mail.parsers";
import type { MailMessage, MailPage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";

/** One mailbox read's filters. Every change starts again at its newest mail. */
interface MailboxQueryOptions {
	provider: ConnectorAccount;
	folder: string;
	subject: string;
	unreadOnly: boolean;
}

/** A mailbox listing with an explicit, retryable next-page action. */
export interface MailboxQuery extends ConnectorQuery<MailPage> {
	loadMore: () => void;
	/** An append failure leaves already loaded messages visible. */
	loadMoreError: ConnectorErrorInfo | null;
}

interface MailboxQueryState extends Omit<MailboxQuery, "reload" | "loadMore"> {
	key: string;
}

/** Read each page on demand; the server caps one request, not the mailbox. */
const PAGE_SIZE = 25;

/**
 * Read mail a page at a time, retaining loaded rows during later reads.
 * Loaded pages survive Activity suspending the viewer's effects. In-flight
 * requests belong to one effect lifetime, so hidden or replaced viewers cannot
 * append late responses into the visible listing.
 *
 * @param options - The account and mailbox filters.
 * @return The accumulated listing and actions to refresh or read more.
 */
export const useMailboxQuery = ({
	provider,
	folder,
	subject,
	unreadOnly,
}: MailboxQueryOptions): MailboxQuery => {
	const { insightId } = useInsight();
	const [revision, setRevision] = useState(0);
	const key = JSON.stringify([
		provider,
		insightId,
		folder,
		subject,
		unreadOnly,
		revision,
	]);
	const readRef = useRef<{ key: string; read: () => void } | null>(null);
	const retainedRef = useRef<MailboxQueryState | null>(null);
	const [state, setState] = useState<MailboxQueryState>({
		key: "",
		status: "loading",
		data: null,
		error: null,
		isRefreshing: false,
		loadMoreError: null,
	});

	useEffect(() => {
		let isCancelled = false;
		let isPending = false;
		let snapshot: MailboxQueryState =
			retainedRef.current?.key === key
				? retainedRef.current
				: {
						key,
						status: "loading",
						data: null,
						error: null,
						isRefreshing: false,
						loadMoreError: null,
					};
		let messages: MailMessage[] = snapshot.data?.messages ?? [];
		let offset = snapshot.data?.count ?? 0;
		let hasMore = snapshot.data?.hasMore ?? true;
		let hasLoaded = snapshot.data !== null;
		const publish = (next: MailboxQueryState): void => {
			snapshot = next;
			retainedRef.current = next;
			setState(next);
		};

		const read = async (): Promise<void> => {
			if (!insightId || isCancelled || isPending || !hasMore) return;
			isPending = true;
			const isAppending = hasLoaded;
			publish(
				isAppending
					? { ...snapshot, isRefreshing: true, loadMoreError: null }
					: {
							key,
							status: "loading",
							data: null,
							error: null,
							isRefreshing: false,
							loadMoreError: null,
						},
			);
			try {
				const page = parseMailPage(
					await runConnectorPixel(
						MAIL_APPS[provider].pixels.listMail({
							folder,
							subject,
							unreadOnly,
							limit: PAGE_SIZE,
							offset,
						}),
						insightId,
					),
				);
				if (isCancelled) return;
				if (page.count === 0 && page.hasMore) {
					throw new Error(
						"The mailbox returned an empty page with more mail to read.",
					);
				}
				// Advance by the page count before parsing or deduplicating rows.
				offset += page.count;
				messages = [
					...new Map(
						[...messages, ...page.messages].map((message) => [
							message.id,
							message,
						]),
					).values(),
				];
				hasMore = page.hasMore;
				hasLoaded = true;
				publish({
					key,
					status: "ready",
					data: { messages, count: offset, hasMore },
					error: null,
					isRefreshing: false,
					loadMoreError: null,
				});
			} catch (error) {
				if (isCancelled) return;
				const info = classifyConnectorError(error);
				publish(
					hasLoaded
						? {
								...snapshot,
								isRefreshing: false,
								loadMoreError: info,
							}
						: {
								key,
								status:
									info.kind === "signIn"
										? "signedOut"
										: "error",
								data: null,
								error: info,
								isRefreshing: false,
								loadMoreError: null,
							},
				);
			} finally {
				isPending = false;
			}
		};
		const reader = { key, read: () => void read() };
		readRef.current = reader;
		if (hasLoaded) {
			// Activity canceled pending work, but the next page still starts at
			// the retained offset when the user asks for more.
			publish({ ...snapshot, isRefreshing: false });
		} else {
			reader.read();
		}
		return () => {
			isCancelled = true;
			if (readRef.current === reader) readRef.current = null;
		};
	}, [folder, insightId, key, provider, subject, unreadOnly]);

	const reload = useCallback(() => {
		readRef.current = null;
		setRevision((current) => current + 1);
	}, []);
	const loadMore = useCallback(() => {
		if (readRef.current?.key === key) readRef.current.read();
	}, [key]);
	const current =
		state.key === key
			? state
			: {
					status: "loading" as const,
					data: null,
					error: null,
					isRefreshing: false,
					loadMoreError: null,
				};
	return { ...current, reload, loadMore };
};
