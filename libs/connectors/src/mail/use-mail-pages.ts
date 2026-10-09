import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ConnectorAccount } from "../core/connector.types";
import {
	type ConnectorErrorInfo,
	classifyConnectorError,
	runConnectorPixel,
} from "../core/connector-pixel";
import type { ConnectorQuery } from "../core/use-connector-query";
import { parseMailPage } from "./mail.parsers";
import type { MailMessage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";

/** Filters that start a new mailbox pagination sequence. */
export interface MailPageOptions {
	provider: ConnectorAccount;
	folder: string;
	subject: string;
	unreadOnly: boolean;
	isGrouped: boolean;
}

/** A growing mailbox list and its separately recoverable page request. */
export interface MailPages extends ConnectorQuery<MailMessage[]> {
	hasMore: boolean;
	pageError: ConnectorErrorInfo | null;
	loadMore: () => void;
}

interface PageState {
	key: string;
	data: MailMessage[] | null;
	error: ConnectorErrorInfo | null;
	pageError: ConnectorErrorInfo | null;
	hasMore: boolean;
	isLoading: boolean;
}

interface PageRun {
	key: string;
	nextOffset: number;
	hasMore: boolean;
	isPending: boolean;
	isCancelled: boolean;
}

/** Read fixed-size pages; raw server counts advance the cursor independently of valid IDs. */
export const useMailPages = (options: MailPageOptions): MailPages => {
	const { provider, folder, subject, unreadOnly, isGrouped } = options;
	const { insightId } = useInsight();
	const { t } = useTranslation("connectors");
	const key = JSON.stringify([
		insightId,
		provider,
		folder,
		subject,
		unreadOnly,
		isGrouped,
	]);
	const [refreshId, setRefreshId] = useState(0);
	const [state, setState] = useState<PageState>({
		key,
		data: null,
		error: null,
		pageError: null,
		hasMore: false,
		isLoading: true,
	});
	const runRef = useRef<PageRun | null>(null);
	const emptyPageMessage = t("mail.emptyPage");

	const readPage = useCallback(
		async (run: PageRun): Promise<void> => {
			if (!insightId || run.isPending || run.isCancelled) return;
			run.isPending = true;
			const offset = run.nextOffset;
			setState((previous) => ({
				...previous,
				isLoading: true,
				pageError: null,
			}));
			try {
				const raw = await runConnectorPixel(
					MAIL_APPS[provider].pixels.listMail({
						folder,
						subject,
						unreadOnly,
						limit: 25,
						offset,
					}),
					insightId,
				);
				if (run.isCancelled || runRef.current !== run) return;
				const page = parseMailPage(raw);
				if (page.rawCount === 0 && page.hasMore)
					throw new Error(emptyPageMessage);
				run.nextOffset += page.rawCount;
				run.hasMore = page.hasMore;
				setState((previous) => {
					const messages = new Map(
						(offset === 0 ? [] : (previous.data ?? [])).map(
							(message) => [message.id, message],
						),
					);
					for (const message of page.messages)
						if (!messages.has(message.id))
							messages.set(message.id, message);
					return {
						key: run.key,
						data: [...messages.values()],
						error: null,
						pageError: null,
						hasMore: page.hasMore,
						isLoading: false,
					};
				});
			} catch (error) {
				if (run.isCancelled || runRef.current !== run) return;
				const info = classifyConnectorError(error);
				setState((previous) => ({
					...previous,
					isLoading: false,
					error: previous.data === null ? info : null,
					pageError: previous.data === null ? null : info,
				}));
			} finally {
				run.isPending = false;
			}
		},
		[insightId, provider, folder, subject, unreadOnly, emptyPageMessage],
	);

	// refreshId explicitly starts a new sequence even when its filters are unchanged.
	// biome-ignore lint/correctness/useExhaustiveDependencies: explicit refresh sequence
	useEffect(() => {
		const run: PageRun = {
			key,
			nextOffset: 0,
			hasMore: true,
			isPending: false,
			isCancelled: false,
		};
		runRef.current = run;
		setState({
			key,
			data: null,
			error: null,
			pageError: null,
			hasMore: false,
			isLoading: true,
		});
		void readPage(run);
		return () => {
			run.isCancelled = true;
		};
	}, [key, readPage, refreshId]);

	const reload = useCallback(() => {
		if (runRef.current) runRef.current.isCancelled = true;
		setRefreshId((value) => value + 1);
	}, []);
	const loadMore = useCallback(() => {
		const run = runRef.current;
		if (run && run.key === key && run.hasMore) void readPage(run);
	}, [key, readPage]);
	const isCurrent = state.key === key;
	const data = isCurrent ? state.data : null;
	const error = isCurrent ? state.error : null;
	return {
		data,
		error,
		status:
			data !== null
				? "ready"
				: error
					? error.kind === "signIn"
						? "signedOut"
						: "error"
					: "loading",
		isRefreshing: data !== null && state.isLoading,
		hasMore: isCurrent && state.hasMore,
		pageError: isCurrent ? state.pageError : null,
		reload,
		loadMore,
	};
};
