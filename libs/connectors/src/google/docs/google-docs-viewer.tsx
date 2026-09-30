import { FileTextIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { cn } from "@semoss/ui/next";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { ConnectorSearchField } from "../../components/connector-search-field";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useConnectorQuery } from "../../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../../core/use-connector-saver";
import { useReturnFocus } from "../../core/use-return-focus";
import { googleDocFileName, googleDocToMarkdown } from "../google.markdown";
import { parseGoogleDocContent, parseGoogleDocs } from "../google.parsers";
import {
	GOOGLE_DOC_MIME_TYPE,
	GOOGLE_PIXELS,
	getDriveFileUrl,
} from "../google.pixels";
import type { GoogleDoc } from "../google.types";
import { GoogleDocDetail } from "./google-doc-detail";

/** How many documents the list reads. */
const DOC_LIMIT = 200;

/** Props for {@link GoogleDocsViewer}. */
export type GoogleDocsViewerProps = ConnectorViewerProps;

/**
 * The user's Google Docs, found by title: open one to read it, and bring its
 * text into the insight.
 */
export const GoogleDocsViewer = (props: GoogleDocsViewerProps) => {
	const { onSignIn } = props;
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("google-docs", props);
	const [search, setSearch] = useState("");
	const [openDoc, setOpenDoc] = useState<GoogleDoc | null>(null);
	const { listRef, rememberItem } = useReturnFocus(openDoc !== null);
	const serviceName = t("services.googleDocs");

	const query = useConnectorQuery(
		GOOGLE_PIXELS.docsList(DOC_LIMIT),
		parseGoogleDocs,
	);
	const needle = search.trim().toLowerCase();
	const filtered = needle
		? (query.data ?? []).filter((doc) =>
				doc.title.toLowerCase().includes(needle),
			)
		: query.data;

	const docRequest = (doc: GoogleDoc): ConnectorSaveRequest => ({
		key: doc.id,
		name: doc.title,
		source: {
			kind: "text",
			fileName: googleDocFileName(doc.title),
			getContent: async () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				return googleDocToMarkdown(
					parseGoogleDocContent(
						await runConnectorPixel(
							GOOGLE_PIXELS.docsRead(doc.id),
							insightId,
						),
					),
					getDriveFileUrl(doc.id, GOOGLE_DOC_MIME_TYPE),
				);
			},
		},
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openDoc !== null && "hidden",
				)}
			>
				<ConnectorViewerHeader
					brand="google-docs"
					icon={FileTextIcon}
					title={serviceName}
				>
					<ConnectorIconButton
						icon={RefreshCwIcon}
						label={t("common.refresh")}
						isSpinning={query.isRefreshing}
						onClick={query.reload}
					/>
				</ConnectorViewerHeader>

				<div className="border-border border-b bg-muted/10 px-3 py-2">
					<ConnectorSearchField
						value={search}
						placeholder={t("googleDocs.searchPlaceholder")}
						onChange={setSearch}
					/>
				</div>

				<ConnectorList
					query={{ ...query, data: filtered ?? null }}
					serviceName={serviceName}
					emptyIcon={FileTextIcon}
					onClearSearch={needle ? () => setSearch("") : undefined}
					account="google"
					onSignIn={onSignIn}
					listRef={listRef}
					isFull={(query.data?.length ?? 0) >= DOC_LIMIT}
					limitNote={t("googleDocs.limitReached", {
						count: DOC_LIMIT,
					})}
					emptyText={
						needle
							? t("common.noResults", { query: search.trim() })
							: t("googleDocs.empty")
					}
				>
					{(docs) =>
						docs.map((doc) => {
							const request = docRequest(doc);
							const isBusy = saver.isBusy(request.key);
							return (
								<ConnectorItemRow
									key={doc.id}
									itemKey={doc.id}
									icon={
										<FileTextIcon
											aria-hidden
											className="size-4"
										/>
									}
									title={doc.title}
									openLabel={t("googleDocs.openDoc", {
										title: doc.title,
									})}
									isBusy={isBusy}
									onOpen={() => {
										rememberItem(doc.id);
										setOpenDoc(doc);
									}}
									actions={{
										itemName: doc.title,
										serviceName: serviceName,
										webUrl: getDriveFileUrl(
											doc.id,
											GOOGLE_DOC_MIME_TYPE,
										),
										saveLabel: saver.saveLabel,
										isBusy: isBusy,
										onAddToContext: saver.addToContext
											? () =>
													saver.addToContext?.(
														request,
													)
											: undefined,
										onSave: () => saver.save(request),
									}}
								/>
							);
						})
					}
				</ConnectorList>
			</div>

			{openDoc ? (
				<GoogleDocDetail
					key={openDoc.id}
					doc={openDoc}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenDoc(null)}
				/>
			) : null}
		</div>
	);
};
