import { FolderIcon, HardDriveIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
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
import { googleDocFileName, googleDocToMarkdown } from "../google.markdown";
import { parseDriveFiles, parseGoogleDocContent } from "../google.parsers";
import {
	GOOGLE_DOC_MIME_TYPE,
	GOOGLE_FOLDER_MIME_TYPE,
	GOOGLE_PIXELS,
	getDriveFileUrl,
} from "../google.pixels";
import type { GoogleDriveFile } from "../google.types";

/** How many files the list reads. */
const FILE_LIMIT = 200;

/** Google's own file types, drawn with the icon of the format they export to. */
const GOOGLE_TYPE_ICON_NAMES: Record<string, string> = {
	[GOOGLE_DOC_MIME_TYPE]: "document.docx",
	"application/vnd.google-apps.spreadsheet": "sheet.xlsx",
	"application/vnd.google-apps.presentation": "slides.pptx",
};

/** Props for {@link GoogleDriveViewer}. */
export type GoogleDriveViewerProps = ConnectorViewerProps;

/**
 * The files in the user's Google Drive, found by name. Every file opens in
 * Drive; Google Docs can also be added to the conversation or saved into the
 * insight's files as text, since the backend reads no other file's contents.
 */
export const GoogleDriveViewer = (props: GoogleDriveViewerProps) => {
	const { onSignIn } = props;
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("google-drive", props);
	const [search, setSearch] = useState("");
	const serviceName = t("services.googleDrive");

	const query = useConnectorQuery(
		GOOGLE_PIXELS.driveList(FILE_LIMIT),
		parseDriveFiles,
	);
	const needle = search.trim().toLowerCase();
	const filtered = needle
		? (query.data ?? []).filter((file) =>
				file.name.toLowerCase().includes(needle),
			)
		: query.data;

	const docRequest = (file: GoogleDriveFile): ConnectorSaveRequest => ({
		key: file.id,
		name: file.name,
		source: {
			kind: "text",
			fileName: googleDocFileName(file.name),
			getContent: async () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				return googleDocToMarkdown(
					parseGoogleDocContent(
						await runConnectorPixel(
							GOOGLE_PIXELS.docsRead(file.id),
							insightId,
						),
					),
					getDriveFileUrl(file.id, file.mimeType),
				);
			},
		},
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<ConnectorViewerHeader
				brand="google-drive"
				icon={HardDriveIcon}
				title={serviceName}
			>
				<ConnectorIconButton
					icon={RefreshCwIcon}
					label={t("common.refresh")}
					isSpinning={query.isRefreshing}
					onClick={query.reload}
				/>
			</ConnectorViewerHeader>

			<div className="flex flex-col gap-2 px-3 py-2">
				<ConnectorSearchField
					value={search}
					placeholder={t("googleDrive.searchPlaceholder")}
					onChange={setSearch}
				/>
				<Muted>{t("googleDrive.docsOnly")}</Muted>
			</div>

			<ConnectorList
				query={{ ...query, data: filtered ?? null }}
				serviceName={serviceName}
				emptyIcon={HardDriveIcon}
				onClearSearch={needle ? () => setSearch("") : undefined}
				account="google"
				onSignIn={onSignIn}
				isFull={(query.data?.length ?? 0) >= FILE_LIMIT}
				limitNote={t("googleDrive.limitReached", { count: FILE_LIMIT })}
				emptyText={
					needle
						? t("common.noResults", { query: search.trim() })
						: t("googleDrive.empty")
				}
			>
				{(files) =>
					files.map((file) => {
						const isFolder =
							file.mimeType === GOOGLE_FOLDER_MIME_TYPE;
						const isDoc = file.mimeType === GOOGLE_DOC_MIME_TYPE;
						const FileIcon = getFileIconComponent(
							(file.mimeType &&
								GOOGLE_TYPE_ICON_NAMES[file.mimeType]) ??
								file.name,
						);
						const request = isDoc ? docRequest(file) : null;
						const isBusy = saver.isBusy(file.id);
						return (
							<ConnectorItemRow
								key={file.id}
								itemKey={file.id}
								icon={
									isFolder ? (
										<FolderIcon
											aria-hidden
											className="size-4"
										/>
									) : (
										<FileIcon className="size-4" />
									)
								}
								title={file.name}
								isBusy={isBusy}
								actions={{
									itemName: file.name,
									serviceName: serviceName,
									webUrl: getDriveFileUrl(
										file.id,
										file.mimeType,
									),
									saveLabel: saver.saveLabel,
									isBusy: isBusy,
									onAddToContext:
										request && saver.addToContext
											? () =>
													saver.addToContext?.(
														request,
													)
											: undefined,
									onSave: request
										? () => saver.save(request)
										: undefined,
								}}
							/>
						);
					})
				}
			</ConnectorList>
		</div>
	);
};
