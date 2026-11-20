import {
	ArrowLeftIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DownloadIcon,
	FolderPlusIcon,
	MessageSquarePlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { downloadVectorFile } from "@semoss/sdk";
import { useConfig, useSessionInsight } from "@semoss/sdk/react";
import { getFileIconComponent, MembersTable } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { formatByteSize } from "@semoss/utility";
import { formatLocalDateTime } from "@semoss/utility/date";
import { getErrorMessage } from "@semoss/utility/error";
import { EmbedDocumentsOverlay } from "@/features/knowledge/embed-documents-overlay";
import { useDocumentPreview } from "@/features/knowledge/use-document-preview";
import { useKnowledgeDocuments } from "@/features/knowledge/use-knowledge-documents";
import {
	readTags,
	useKnowledgeSources,
} from "@/features/knowledge/use-knowledge-sources";

/** A column the documents sort by. */
type DocumentSortColumn = "name" | "size" | "date";

/** Props for {@link KnowledgeDetail}. */
interface KnowledgeDetailProps {
	/** The knowledge base to show. */
	knowledgeId: string;
}

/**
 * A knowledge source's page: its name, description and tags, with New Chat
 * and Embed Documents actions, a Files tab (a sortable document table with
 * preview and download) and a Permissions tab (the source's members).
 */
export const KnowledgeDetail = ({ knowledgeId }: KnowledgeDetailProps) => {
	const { t } = useTranslation(["knowledge", "common"]);
	const navigate = useNavigate();
	const { withInsight, ensure, download } = useSessionInsight();
	const isDirectoryAvailable = useConfig(
		(state) => state.config?.msGraphLookup === true,
	);

	const { sources, status } = useKnowledgeSources(knowledgeId);
	const knowledge = sources[0];
	const {
		documents,
		status: documentsStatus,
		refresh: refreshDocuments,
	} = useKnowledgeDocuments(knowledgeId);

	const [isEmbedDocumentsOpen, setIsEmbedDocumentsOpen] = useState(false);
	const [sortBy, setSortBy] = useState<DocumentSortColumn>("name");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [previewFileName, setPreviewFileName] = useState<string | null>(null);
	const preview = useDocumentPreview(knowledgeId, previewFileName);

	const sortedDocuments = useMemo(
		() =>
			[...documents].sort((a, b) => {
				let comparison = 0;
				if (sortBy === "name") {
					comparison = a.fileName.localeCompare(b.fileName);
				} else if (sortBy === "size") {
					comparison = (a.fileSize ?? 0) - (b.fileSize ?? 0);
				} else {
					comparison = (a.lastModified ?? "").localeCompare(
						b.lastModified ?? "",
					);
				}
				return sortDirection === "asc" ? comparison : -comparison;
			}),
		[documents, sortBy, sortDirection],
	);

	/**
	 * Sorts the documents by a column, or flips the direction when it already
	 * sorts by it.
	 *
	 * @param column - The column.
	 */
	const handleToggleSort = (column: DocumentSortColumn) => {
		if (sortBy === column) {
			setSortDirection((direction) =>
				direction === "asc" ? "desc" : "asc",
			);
		} else {
			setSortBy(column);
			setSortDirection("asc");
		}
	};

	/**
	 * Downloads a document.
	 *
	 * @param fileName - The document's file name.
	 */
	const handleDownload = async (fileName: string) => {
		try {
			// the key only works in the insight that made it, so make the
			// session's insight first rather than run in a throwaway one
			await ensure();
			const fileKey = await withInsight((insightId) =>
				downloadVectorFile(insightId, knowledgeId, fileName),
			);
			await download(fileKey);
		} catch (error) {
			toast.error(
				getErrorMessage(
					error,
					t("common:fileExplorer.toasts.downloadFileFailed"),
				),
			);
		}
	};

	if (status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (status === "ERROR") {
		return <Navigate to="/knowledge" replace />;
	}

	const tags = readTags(knowledge?.tag);
	const PreviewIcon = previewFileName
		? getFileIconComponent(previewFileName)
		: null;

	/**
	 * The arrow on a column's header: which way it sorts, or faint when the
	 * documents sort by another column.
	 *
	 * @param column - The column.
	 * @returns The arrow.
	 */
	const renderSortIcon = (column: DocumentSortColumn) => {
		if (sortBy !== column) {
			return <ChevronUpIcon className="size-3 opacity-30" />;
		}
		return sortDirection === "asc" ? (
			<ChevronUpIcon className="size-3" />
		) : (
			<ChevronDownIcon className="size-3" />
		);
	};

	return (
		<div className="relative h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				<div className="flex flex-wrap items-start gap-3 border-b pb-6">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate(-1)}
						aria-label={t("common:buttons.back")}
					>
						<ArrowLeftIcon className="rtl:-scale-x-100" />
					</Button>

					<div className="min-w-0 flex-1 space-y-2">
						<h1 className="break-words font-semibold text-2xl leading-tight">
							{knowledge?.engine_display_name ||
								knowledge?.engine_name ||
								t("knowledge:detail.knowledge")}
						</h1>
						<p className="text-muted-foreground text-sm">
							{knowledge?.description ||
								t("knowledge:messages.noDescription")}
						</p>
						{tags.length > 0 ? (
							<div className="flex flex-wrap gap-2 pt-2">
								{tags.map((tag) => (
									<Badge key={tag} variant="secondary">
										{tag}
									</Badge>
								))}
							</div>
						) : null}
					</div>

					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline">
							<Link
								to={`/new?knowledgeId=${encodeURIComponent(knowledgeId)}`}
							>
								<MessageSquarePlusIcon />
								{t("knowledge:actions.newChat")}
							</Link>
						</Button>

						<Button
							variant="default"
							onClick={() => setIsEmbedDocumentsOpen(true)}
						>
							<FolderPlusIcon />
							{t("knowledge:detail.embedDocuments")}
						</Button>
					</div>
				</div>

				<EmbedDocumentsOverlay
					open={isEmbedDocumentsOpen}
					knowledgeId={knowledgeId}
					onClose={(success) => {
						setIsEmbedDocumentsOpen(false);
						if (success) {
							refreshDocuments();
						}
					}}
				/>

				<Tabs defaultValue="files">
					<TabsList>
						<TabsTrigger value="files">
							{t("knowledge:studio.files")}
						</TabsTrigger>
						<TabsTrigger value="permissions">
							{t("knowledge:studio.permissions")}
						</TabsTrigger>
					</TabsList>
					<TabsContent value="files">
						<Card className="rounded-xl border-border bg-card shadow-none">
							<CardHeader>
								<CardTitle>
									{t("knowledge:documents.title")}
								</CardTitle>
								<CardDescription>
									{documentsStatus === "READY"
										? t("knowledge:studio.documentCount", {
												count: documents.length,
											})
										: t(
												"knowledge:detail.documentsDescription",
											)}
								</CardDescription>
							</CardHeader>
							<CardContent className="px-0 pb-0">
								{documentsStatus === "LOADING" ? (
									<div className="px-6 pb-6 text-muted-foreground text-sm">
										{t(
											"knowledge:messages.loadingDocuments",
										)}
									</div>
								) : documentsStatus === "ERROR" ? (
									<div className="px-6 pb-6 text-destructive text-sm">
										{t(
											"knowledge:detail.failedToLoadDocuments",
										)}
									</div>
								) : documents.length === 0 ? (
									<div className="px-6 pb-6 text-muted-foreground text-sm">
										{t("knowledge:messages.noDocuments")}
									</div>
								) : (
									<ScrollArea className="h-96">
										<section
											className="overflow-x-auto"
											// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the document table horizontally.
											tabIndex={0}
											aria-label={t(
												"knowledge:documents.title",
											)}
										>
											<table className="w-full min-w-160 table-fixed text-sm">
												<thead>
													<tr className="border-b text-muted-foreground text-xs">
														<th className="px-6 pb-2 text-start font-medium">
															<button
																type="button"
																className="flex items-center gap-1 hover:text-foreground"
																onClick={() =>
																	handleToggleSort(
																		"name",
																	)
																}
															>
																{t(
																	"common:labels.name",
																)}
																{renderSortIcon(
																	"name",
																)}
															</button>
														</th>
														<th className="w-44 px-4 pb-2 text-start font-medium">
															<button
																type="button"
																className="flex items-center gap-1 hover:text-foreground"
																onClick={() =>
																	handleToggleSort(
																		"date",
																	)
																}
															>
																{t(
																	"knowledge:studio.dateUploaded",
																)}
																{renderSortIcon(
																	"date",
																)}
															</button>
														</th>
														<th className="w-28 px-6 pb-2 text-end font-medium">
															<button
																type="button"
																className="flex items-center justify-end gap-1 hover:text-foreground"
																onClick={() =>
																	handleToggleSort(
																		"size",
																	)
																}
															>
																{t(
																	"knowledge:studio.size",
																)}
																{renderSortIcon(
																	"size",
																)}
															</button>
														</th>
														<th className="w-20 pb-2" />
													</tr>
												</thead>
												<tbody>
													{sortedDocuments.map(
														(file) => {
															const DocumentIcon =
																getFileIconComponent(
																	file.fileName,
																);
															return (
																<tr
																	key={`${file.fileName}-${file.lastModified}`}
																	className="border-b transition last:border-0 hover:bg-accent"
																>
																	<td className="px-6 py-2">
																		<div className="flex min-w-0 items-center gap-2">
																			<DocumentIcon className="size-4 shrink-0" />
																			<button
																				type="button"
																				className="cursor-pointer break-all text-start font-medium text-sm hover:underline"
																				onClick={() =>
																					setPreviewFileName(
																						file.fileName,
																					)
																				}
																			>
																				{
																					file.fileName
																				}
																			</button>
																		</div>
																	</td>
																	<td className="w-44 px-4 py-2 text-muted-foreground text-xs tabular-nums">
																		{formatLocalDateTime(
																			file.lastModified,
																		) ??
																			file.lastModified}
																	</td>
																	<td className="w-28 px-6 py-2 text-end text-muted-foreground text-xs tabular-nums">
																		{typeof file.fileSize ===
																		"number"
																			? // the server sends kilobytes
																				formatByteSize(
																					file.fileSize *
																						1024,
																				)
																			: null}
																	</td>
																	<td className="w-20 px-4 py-1">
																		<div className="flex items-center justify-end gap-0.5">
																			<Button
																				variant="ghost"
																				size="icon"
																				className="size-9"
																				title={t(
																					"common:fileExplorer.contextMenu.download",
																				)}
																				aria-label={`${t("common:fileExplorer.contextMenu.download")}: ${file.fileName}`}
																				onClick={() =>
																					handleDownload(
																						file.fileName,
																					)
																				}
																			>
																				<DownloadIcon className="size-4" />
																			</Button>
																		</div>
																	</td>
																</tr>
															);
														},
													)}
												</tbody>
											</table>
										</section>
									</ScrollArea>
								)}
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="permissions">
						<MembersTable
							id={knowledgeId}
							type="ENGINE"
							isDirectoryAvailable={isDirectoryAvailable}
						/>
					</TabsContent>
				</Tabs>
				<Dialog
					open={previewFileName !== null}
					onOpenChange={(open) => {
						if (!open) setPreviewFileName(null);
					}}
				>
					<DialogContent className="flex max-h-[90dvh] flex-col gap-4 overflow-hidden p-0 sm:max-w-5xl">
						<DialogHeader className="px-6 pt-6 pb-0">
							<DialogTitle className="flex min-w-0 items-center gap-2">
								{PreviewIcon ? (
									<PreviewIcon className="size-4 shrink-0" />
								) : null}
								<span className="truncate">
									{previewFileName}
								</span>
							</DialogTitle>
						</DialogHeader>
						{preview.isLoading ? (
							<div className="flex items-center justify-center py-16">
								<Spinner />
							</div>
						) : null}
						{preview.blobUrl && preview.kind === "pdf" ? (
							<iframe
								className="h-[75vh] w-full border-0"
								src={preview.blobUrl}
								title={previewFileName ?? ""}
							/>
						) : null}
						{preview.blobUrl && preview.kind === "image" ? (
							<div className="flex items-center justify-center overflow-auto p-6">
								<img
									src={preview.blobUrl}
									alt={previewFileName ?? ""}
									className="max-w-full"
								/>
							</div>
						) : null}
						{preview.text !== null && preview.kind === "text" ? (
							<div className="max-h-[70vh] overflow-y-auto">
								<pre className="whitespace-pre-wrap p-6 text-xs">
									{preview.text}
								</pre>
							</div>
						) : null}
						{preview.hasError ||
						(previewFileName && !preview.kind) ? (
							<div className="flex items-center justify-center py-16">
								<p className="text-muted-foreground text-sm">
									{preview.hasError
										? t("knowledge:studio.previewError")
										: t(
												"knowledge:studio.previewUnavailable",
											)}
								</p>
							</div>
						) : null}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
};
