import {
	ArrowLeftIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DownloadIcon,
	FileIcon,
	FileImageIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	FolderPlusIcon,
	MessageSquarePlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	addEngineUserPermissions,
	editEngineUserPermissions,
	getEngineUsers,
	getEngineUsersNoCredentials,
	type PostUser,
	removeEngineUserPermissions,
	throwOnPixelErrors,
} from "@semoss/sdk";
import {
	useConfig,
	useSessionInsight,
	useSessionPixel,
} from "@semoss/sdk/react";
import { type UserSource, UserSourceToggle } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { decodeBase64ToBytes } from "@semoss/utility/encoding";
import { getErrorMessage } from "@semoss/utility/error";
import { getFileExtension } from "@semoss/utility/file";
import { getImageMimeType } from "@semoss/utility/image";
import { EmbedDocumentsOverlay } from "@/features/knowledge/embed-documents-overlay";

/** A knowledge source (a vector database), as `MyEngines` returns it. */
type KnowledgeEngine = {
	/** The engine's id. */
	engine_id: string;
	/** The engine's name. */
	engine_name: string;
	/** The name to show, when it differs from the engine's name. */
	engine_display_name?: string;
	/** The engine's description metadata. */
	description?: string;
	/** The engine's tag metadata: one tag or several. */
	tag?: string[] | string;
};

/** A document embedded in the source, as `ListDocumentsInVectorDatabase` returns it. */
type VectorDocument = {
	/** The document's file name. */
	fileName: string;
	/** When the document last changed. */
	lastModified: string;
	/** The document's size: bytes, or a string with a unit such as `12 KB`. */
	fileSize: string | number;
};

/** A member of the source, as `getEngineUsers` returns it. */
type EngineUser = {
	/** The user's id. */
	id: string;
	/** The user's name. */
	name: string;
	/** The user's email. */
	email: string;
	/** The member's role: OWNER, EDIT or READ_ONLY. */
	permission: string;
};

/** A user found by the add-member search. */
type SearchUser = {
	/** The user's id. */
	id: string;
	/** The user's name. */
	name: string | null;
	/** The user's email. */
	email: string | null;
	/** The user's login type. */
	type: string;
	/** The user's username. */
	username: string | null;
};

/**
 * The icon for a document, by its extension.
 *
 * @param fileName - The document's file name.
 * @returns The icon element.
 */
const getFileIcon = (fileName: string) => {
	const ext = getFileExtension(fileName);
	if (ext === "pdf")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-primary" />;
	if (ext === "doc" || ext === "docx")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-primary" />;
	if (ext === "xls" || ext === "xlsx" || ext === "csv")
		return (
			<FileSpreadsheetIcon className="h-4 w-4 shrink-0 text-primary" />
		);
	if (
		ext === "png" ||
		ext === "jpg" ||
		ext === "jpeg" ||
		ext === "gif" ||
		ext === "webp" ||
		ext === "svg"
	)
		return <FileImageIcon className="h-4 w-4 shrink-0 text-primary" />;
	return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
};

/**
 * Reads a document's size in bytes.
 *
 * @param fileSize - The size, in bytes or with a B, KB, MB or GB unit.
 * @returns The size in bytes, or 0 when it does not parse.
 */
const parseSizeBytes = (fileSize: string | number): number => {
	const s = String(fileSize ?? "");
	const match = s.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
	if (!match) return 0;
	const num = parseFloat(match[1]);
	const unit = (match[2] ?? "B").toUpperCase();
	if (unit === "GB") return num * 1024 * 1024 * 1024;
	if (unit === "MB") return num * 1024 * 1024;
	if (unit === "KB") return num * 1024;
	return num;
};

/**
 * Formats a document's size in KB or MB.
 *
 * @param fileSize - The size, as the server sends it.
 * @returns The formatted size, or the input when it does not parse.
 */
const formatFileSize = (fileSize: string | number): string => {
	const bytes = parseSizeBytes(fileSize);
	if (bytes === 0) return String(fileSize);
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Formats a server timestamp in the user's locale.
 *
 * @param dateStr - The timestamp, as `yyyy-MM-dd HH:mm:ss`.
 * @returns The local date and time, or the input when it does not parse.
 */
const formatDateTime = (dateStr: string): string => {
	const d = new Date(dateStr.replace(" ", "T"));
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

/**
 * Whether a document previews in a PDF frame (Word files included).
 *
 * @param name - The document's file name.
 * @returns Whether it is a PDF or Word file.
 */
const isPdfPreview = (name: string) =>
	["pdf", "doc", "docx"].includes(getFileExtension(name));
/**
 * Whether a document previews as an image.
 *
 * @param name - The document's file name.
 * @returns Whether it has an image extension.
 */
const isImage = (name: string) =>
	["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
		getFileExtension(name),
	);
/**
 * Whether a document previews as plain text.
 *
 * @param name - The document's file name.
 * @returns Whether it has a text extension.
 */
const isText = (name: string) =>
	["txt", "md", "csv", "log", "json", "xml", "yaml", "yml"].includes(
		getFileExtension(name),
	);
/**
 * Whether a document has any preview.
 *
 * @param name - The document's file name.
 * @returns Whether it previews as a PDF, an image or text.
 */
const isPreviewable = (name?: string) =>
	!!name && (isPdfPreview(name) || isImage(name) || isText(name));

/** Props for {@link KnowledgeDetail}. */
interface KnowledgeDetailProps {
	/** The knowledge base to show. */
	knowledgeId?: string;
}

/**
 * A knowledge source's page: its name, description and tags, with New Chat
 * and Embed Documents actions, a Files tab (a sortable document table with
 * preview and download) and a Permissions tab (members, their roles, and
 * adding or removing members).
 */
export const KnowledgeDetail = ({ knowledgeId }: KnowledgeDetailProps) => {
	const { t } = useTranslation(["knowledge", "common"]);
	const navigate = useNavigate();

	const knowledgePixel = useSessionPixel<KnowledgeEngine[]>(
		knowledgeId
			? `MyEngines(engine=["${knowledgeId}"], engineTypes=['VECTOR'], metaKeys=["description","tag"], userT=[true], limit=[1], offset=[0]);`
			: "",
		{ data: [] },
	);

	const knowledge =
		knowledgePixel.status === "SUCCESS" ? knowledgePixel.data?.[0] : null;

	const tags = useMemo(() => {
		const raw = knowledge?.tag;
		if (!raw) {
			return [] as string[];
		}
		return Array.isArray(raw) ? raw : [raw];
	}, [knowledge?.tag]);

	const documentsPixel = useSessionPixel<VectorDocument[]>(
		knowledgeId
			? `ListDocumentsInVectorDatabase(engine=["${knowledgeId}"]);`
			: "",
		{ data: [] },
	);

	const [isEmbedDocumentsOpen, setIsEmbedDocumentsOpen] = useState(false);
	const [docSortBy, setDocSortBy] = useState<"name" | "size" | "date">(
		"name",
	);
	const [docSortDir, setDocSortDir] = useState<"asc" | "desc">("asc");
	const [previewDoc, setPreviewDoc] = useState<VectorDocument | null>(null);
	const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
	const [previewText, setPreviewText] = useState<string | null>(null);
	const [isPreviewLoading, setIsPreviewLoading] = useState(false);
	const [hasPreviewError, setHasPreviewError] = useState(false);
	const [activeTab, setActiveTab] = useState<"files" | "permissions">(
		"files",
	);
	const [members, setMembers] = useState<EngineUser[]>([]);
	const [isLoadingMembers, setIsLoadingMembers] = useState(false);
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [userSearch, setUserSearch] = useState("");
	const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
	const [isSearchingUsers, setIsSearchingUsers] = useState(false);
	const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>("READ_ONLY");
	// with both available, people already in the app are searched first
	const [userSource, setUserSource] = useState<UserSource>("existing");
	const [removeTarget, setRemoveTarget] = useState<EngineUser | null>(null);
	const { run, download } = useSessionInsight();
	const isDirectoryAvailable = useConfig(
		(state) => state.config?.msGraphLookup === true,
	);
	// Without the directory, leave the choice to the backend
	const msGraphLookup = isDirectoryAvailable
		? userSource === "directory"
		: undefined;
	// Load the previewed document: text as text, anything else as a blob URL,
	// revoked when the preview changes or closes
	useEffect(() => {
		if (!previewDoc) {
			setPreviewBlobUrl(null);
			setPreviewText(null);
			setIsPreviewLoading(false);
			setHasPreviewError(false);
			return;
		}
		let cancelled = false;
		let createdBlobUrl: string | null = null;
		setIsPreviewLoading(true);
		setHasPreviewError(false);
		setPreviewBlobUrl(null);
		setPreviewText(null);
		(async () => {
			try {
				const filePath = `/schema/default/documents/${previewDoc.fileName}`;
				if (isText(previewDoc.fileName)) {
					const { pixelReturn } = await run<[string]>(
						`GetEngineAssets(filePath=["${filePath}"], engine=["${knowledgeId}"]);`,
					).then(throwOnPixelErrors);
					const text = pixelReturn[0].output;
					if (!cancelled) setPreviewText(text);
				} else {
					const { pixelReturn } = await run<[string]>(
						`GetEngineAssetsBase64(filePath=["${filePath}"], engine=["${knowledgeId}"]);`,
					).then(throwOnPixelErrors);
					const b64 = pixelReturn[0].output;
					if (!cancelled) {
						const mimeType = isImage(previewDoc.fileName)
							? getImageMimeType(
									getFileExtension(previewDoc.fileName),
								)
							: "application/pdf";
						const arr = decodeBase64ToBytes(b64);
						const blob = new Blob([arr], { type: mimeType });
						const blobUrl = URL.createObjectURL(blob);
						createdBlobUrl = blobUrl;
						setPreviewBlobUrl(blobUrl);
					}
				}
			} catch {
				if (!cancelled) setHasPreviewError(true);
			} finally {
				if (!cancelled) setIsPreviewLoading(false);
			}
		})();
		return () => {
			cancelled = true;
			if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
		};
	}, [previewDoc, knowledgeId, run]);

	/** Reloads the source's members. */
	const loadMembers = useCallback(async () => {
		if (!knowledgeId) return;
		setIsLoadingMembers(true);
		try {
			const { members } = await getEngineUsers(knowledgeId);
			setMembers((members ?? []) as unknown as EngineUser[]);
		} finally {
			setIsLoadingMembers(false);
		}
	}, [knowledgeId]);

	/** Adds the chosen user with the chosen role, then closes the dialog. */
	const handleAddUser = async () => {
		if (!selectedUser) return;
		await addEngineUserPermissions(knowledgeId, [
			{
				userid: selectedUser.id,
				permission: selectedRole,
				email: selectedUser.email,
				name: selectedUser.name,
				type: selectedUser.type,
				username: selectedUser.username,
			},
		] as unknown as PostUser[]);
		closeAddMemberDialog();
		void loadMembers();
	};

	/** Closes the add-member dialog and resets its choices. */
	const closeAddMemberDialog = () => {
		setIsAddMemberOpen(false);
		setUserSearch("");
		setSelectedUser(null);
		setSelectedRole("READ_ONLY");
		setUserSource("existing");
	};

	/**
	 * Changes a member's role.
	 *
	 * @param userId - The member.
	 * @param newRole - The role to give them.
	 */
	const handleRoleChange = async (userId: string, newRole: string) => {
		await editEngineUserPermissions(knowledgeId, [
			{ userid: userId, permission: newRole },
		] as unknown as PostUser[]);
		setMembers((prev) =>
			prev.map((m) =>
				m.id === userId ? { ...m, permission: newRole } : m,
			),
		);
	};

	/** Removes the member awaiting confirmation. */
	const handleRemoveConfirmed = async () => {
		if (!removeTarget) return;
		await removeEngineUserPermissions(knowledgeId, [removeTarget.id]);
		setRemoveTarget(null);
		void loadMembers();
	};

	// Members load when the Permissions tab opens
	useEffect(() => {
		if (activeTab === "permissions") {
			void loadMembers();
		}
	}, [activeTab, loadMembers]);

	// Search users as the add-member search changes, debounced
	useEffect(() => {
		if (!userSearch || !isAddMemberOpen) {
			setSearchResults([]);
			setIsSearchingUsers(false);
			return;
		}
		// a search that a newer one replaced must not overwrite its results
		let isStale = false;
		const timer = setTimeout(async () => {
			setIsSearchingUsers(true);
			try {
				const results = await getEngineUsersNoCredentials(
					knowledgeId,
					false,
					userSearch,
					undefined,
					undefined,
					msGraphLookup,
				);
				if (!isStale) {
					setSearchResults(results as unknown as SearchUser[]);
				}
			} catch (error) {
				if (!isStale) {
					setSearchResults([]);
					toast.error(
						getErrorMessage(
							error,
							t("members:errors.loadUsersFailed"),
						),
					);
				}
			} finally {
				if (!isStale) {
					setIsSearchingUsers(false);
				}
			}
		}, 300);
		return () => {
			isStale = true;
			clearTimeout(timer);
		};
	}, [userSearch, isAddMemberOpen, knowledgeId, msGraphLookup, t]);

	const sortedDocuments = useMemo(() => {
		if (documentsPixel.status !== "SUCCESS") return [];
		return [...documentsPixel.data].sort((a, b) => {
			let cmp = 0;
			if (docSortBy === "name")
				cmp = a.fileName.localeCompare(b.fileName);
			else if (docSortBy === "size")
				cmp = parseSizeBytes(a.fileSize) - parseSizeBytes(b.fileSize);
			else cmp = a.lastModified.localeCompare(b.lastModified);
			return docSortDir === "asc" ? cmp : -cmp;
		});
	}, [documentsPixel.status, documentsPixel.data, docSortBy, docSortDir]);

	/**
	 * Sorts the documents by a column, or flips the direction when it already
	 * sorts by it.
	 *
	 * @param col - The column.
	 */
	const handleToggleSort = (col: "name" | "size" | "date") => {
		if (docSortBy === col) {
			setDocSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setDocSortBy(col);
			setDocSortDir("asc");
		}
	};

	/**
	 * Downloads a document.
	 *
	 * @param fileName - The document's file name.
	 */
	const handleDownload = async (fileName: string) => {
		const { pixelReturn } = await run<[string]>(
			`META | VectorFileDownload(engine = "${knowledgeId}", fileNames=["${fileName}"]);`,
		).then(throwOnPixelErrors);
		const fileKey = pixelReturn[0].output;
		await download(fileKey);
	};

	if (!knowledgeId) {
		return <Navigate to="/knowledge" replace />;
	}

	if (knowledgePixel.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (knowledgePixel.status === "ERROR") {
		return <Navigate to="/knowledge" replace />;
	}

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
							documentsPixel.refresh?.();
						}
					}}
				/>

				<Tabs
					value={activeTab}
					onValueChange={(v) =>
						setActiveTab(v as "files" | "permissions")
					}
				>
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
									{documentsPixel.status === "SUCCESS"
										? t("knowledge:studio.documentCount", {
												count: documentsPixel.data
													.length,
											})
										: t(
												"knowledge:detail.documentsDescription",
											)}
								</CardDescription>
							</CardHeader>
							<CardContent className="px-0 pb-0">
								{documentsPixel.status === "LOADING" ? (
									<div className="px-6 pb-6 text-muted-foreground text-sm">
										{t(
											"knowledge:messages.loadingDocuments",
										)}
									</div>
								) : documentsPixel.status === "ERROR" ? (
									<div className="px-6 pb-6 text-destructive text-sm">
										{t(
											"knowledge:detail.failedToLoadDocuments",
										)}
									</div>
								) : documentsPixel.data.length === 0 ? (
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
																Name
																{docSortBy ===
																"name" ? (
																	docSortDir ===
																	"asc" ? (
																		<ChevronUpIcon className="h-3 w-3" />
																	) : (
																		<ChevronDownIcon className="h-3 w-3" />
																	)
																) : (
																	<ChevronUpIcon className="h-3 w-3 opacity-30" />
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
																Date Uploaded
																{docSortBy ===
																"date" ? (
																	docSortDir ===
																	"asc" ? (
																		<ChevronUpIcon className="h-3 w-3" />
																	) : (
																		<ChevronDownIcon className="h-3 w-3" />
																	)
																) : (
																	<ChevronUpIcon className="h-3 w-3 opacity-30" />
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
																Size
																{docSortBy ===
																"size" ? (
																	docSortDir ===
																	"asc" ? (
																		<ChevronUpIcon className="h-3 w-3" />
																	) : (
																		<ChevronDownIcon className="h-3 w-3" />
																	)
																) : (
																	<ChevronUpIcon className="h-3 w-3 opacity-30" />
																)}
															</button>
														</th>
														<th className="w-20 pb-2" />
													</tr>
												</thead>
												<tbody>
													{sortedDocuments.map(
														(d) => (
															<tr
																key={`${d.fileName}-${d.lastModified}`}
																className="border-b transition last:border-0 hover:bg-accent"
															>
																<td className="px-6 py-2">
																	<div className="flex min-w-0 items-center gap-2">
																		{getFileIcon(
																			d.fileName,
																		)}
																		<button
																			type="button"
																			className="cursor-pointer break-all text-start font-medium text-sm hover:underline"
																			onClick={() =>
																				setPreviewDoc(
																					d,
																				)
																			}
																		>
																			{
																				d.fileName
																			}
																		</button>
																	</div>
																</td>
																<td className="w-44 px-4 py-2 text-muted-foreground text-xs tabular-nums">
																	{formatDateTime(
																		d.lastModified,
																	)}
																</td>
																<td className="w-28 px-6 py-2 text-end text-muted-foreground text-xs tabular-nums">
																	{formatFileSize(
																		d.fileSize,
																	)}
																</td>
																<td className="w-20 px-4 py-1">
																	<div className="flex items-center justify-end gap-0.5">
																		<Button
																			variant="ghost"
																			size="icon"
																			className="size-9"
																			title="Download"
																			onClick={() =>
																				handleDownload(
																					d.fileName,
																				)
																			}
																		>
																			<DownloadIcon className="h-4 w-4" />
																		</Button>
																	</div>
																</td>
															</tr>
														),
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
						<Card className="rounded-xl border-border bg-card shadow-none">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>
										{t("knowledge:studio.userAccess")}
									</CardTitle>
									<Button
										size="sm"
										onClick={() => setIsAddMemberOpen(true)}
									>
										{t("knowledge:studio.addUser")}
									</Button>
								</div>
							</CardHeader>
							<CardContent className="overflow-x-auto px-0 pb-4">
								{isLoadingMembers ? (
									<div className="flex items-center justify-center py-8">
										<Spinner />
									</div>
								) : members.length === 0 ? (
									<div className="px-6 py-4 text-muted-foreground text-sm">
										{t("knowledge:studio.noUsers")}
									</div>
								) : (
									<table className="w-full min-w-128 text-sm">
										<thead>
											<tr className="border-b text-muted-foreground text-xs">
												<th className="px-6 pb-2 text-start font-medium">
													{t("knowledge:studio.user")}
												</th>
												<th className="w-36 px-4 pb-2 text-start font-medium">
													{t("knowledge:studio.role")}
												</th>
												<th className="w-16 pb-2" />
											</tr>
										</thead>
										<tbody>
											{members.map((m) => (
												<tr
													key={m.id}
													className="border-b transition last:border-0 hover:bg-accent"
												>
													<td className="px-6 py-2">
														<p className="font-medium">
															{m.name}
														</p>
														<p className="text-muted-foreground text-xs">
															{m.email}
														</p>
													</td>
													<td className="w-36 px-4 py-2">
														<Select
															value={m.permission}
															onValueChange={(
																v,
															) =>
																handleRoleChange(
																	m.id,
																	v,
																)
															}
														>
															<SelectTrigger
																className="min-h-9 text-sm"
																aria-label={`${t("knowledge:studio.role")}: ${m.name}`}
															>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="OWNER">
																	{t(
																		"knowledge:studio.author",
																	)}
																</SelectItem>
																<SelectItem value="EDIT">
																	{t(
																		"knowledge:studio.editor",
																	)}
																</SelectItem>
																<SelectItem value="READ_ONLY">
																	{t(
																		"knowledge:studio.readOnly",
																	)}
																</SelectItem>
															</SelectContent>
														</Select>
													</td>
													<td className="w-16 px-2 py-1 text-end">
														<Button
															variant="ghost"
															size="sm"
															className="text-destructive text-xs hover:text-destructive"
															onClick={() =>
																setRemoveTarget(
																	m,
																)
															}
														>
															{t(
																"knowledge:studio.remove",
															)}
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
				<Dialog
					open={!!previewDoc}
					onOpenChange={(open) => {
						if (!open) setPreviewDoc(null);
					}}
				>
					<DialogContent className="flex max-h-[90dvh] flex-col gap-4 overflow-hidden p-0 sm:max-w-5xl">
						<DialogHeader className="px-6 pt-6 pb-0">
							<DialogTitle className="flex min-w-0 items-center gap-2">
								{previewDoc && getFileIcon(previewDoc.fileName)}
								<span className="truncate">
									{previewDoc?.fileName}
								</span>
							</DialogTitle>
						</DialogHeader>
						{isPreviewLoading && (
							<div className="flex items-center justify-center py-16">
								<Spinner />
							</div>
						)}
						{previewBlobUrl &&
							previewDoc &&
							isPdfPreview(previewDoc.fileName) && (
								<iframe
									className="w-full border-0"
									style={{ height: "75vh" }}
									src={previewBlobUrl}
									title={previewDoc.fileName}
								/>
							)}
						{previewBlobUrl &&
							previewDoc &&
							isImage(previewDoc.fileName) && (
								<div className="flex items-center justify-center overflow-auto p-6">
									<img
										src={previewBlobUrl}
										alt={previewDoc.fileName}
										className="max-w-full"
									/>
								</div>
							)}
						{previewText !== null &&
							previewDoc &&
							isText(previewDoc.fileName) && (
								<div
									className="overflow-y-auto"
									style={{ maxHeight: "70vh" }}
								>
									<pre className="whitespace-pre-wrap p-6 text-xs">
										{previewText}
									</pre>
								</div>
							)}
						{(hasPreviewError ||
							(!isPreviewLoading &&
								!previewBlobUrl &&
								previewText === null &&
								previewDoc &&
								!isPreviewable(previewDoc.fileName))) && (
							<div className="flex items-center justify-center py-16">
								<p className="text-muted-foreground text-sm">
									{hasPreviewError
										? t("knowledge:studio.previewError")
										: t(
												"knowledge:studio.previewUnavailable",
											)}
								</p>
							</div>
						)}
					</DialogContent>
				</Dialog>
				<Dialog
					open={isAddMemberOpen}
					onOpenChange={(isOpen) =>
						isOpen
							? setIsAddMemberOpen(true)
							: closeAddMemberDialog()
					}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>
								{t("knowledge:studio.addUser")}
							</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							{isDirectoryAvailable && (
								<UserSourceToggle
									value={userSource}
									onValueChange={(next) => {
										setUserSource(next);
										setSelectedUser(null);
									}}
								/>
							)}
							<Input
								aria-label={t("knowledge:studio.searchUsers")}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								placeholder={t("knowledge:studio.searchUsers")}
								value={userSearch}
								onChange={(e) => setUserSearch(e.target.value)}
							/>
							{isSearchingUsers && (
								<div className="flex items-center justify-center py-4">
									<Spinner />
								</div>
							)}
							{searchResults.length > 0 && (
								<div className="max-h-48 overflow-y-auto rounded-md border">
									{searchResults.map((u) => (
										<button
											key={u.id}
											type="button"
											className={cn(
												"w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted",
												selectedUser?.id === u.id &&
													"bg-muted font-medium",
											)}
											aria-pressed={
												selectedUser?.id === u.id
											}
											onClick={() => setSelectedUser(u)}
										>
											<span className="font-medium">
												{u.name || u.email || u.id}
											</span>
											{u.email && (
												<span className="ms-2 text-muted-foreground">
													{u.email}
												</span>
											)}
										</button>
									))}
								</div>
							)}
							{userSearch &&
								!isSearchingUsers &&
								searchResults.length === 0 && (
									<p className="py-2 text-center text-muted-foreground text-sm">
										{t("knowledge:studio.noUsers")}
									</p>
								)}
							<Select
								value={selectedRole}
								onValueChange={setSelectedRole}
							>
								<SelectTrigger
									aria-label={t("knowledge:studio.role")}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="OWNER">
										{t("knowledge:studio.author")}
									</SelectItem>
									<SelectItem value="EDIT">
										{t("knowledge:studio.editor")}
									</SelectItem>
									<SelectItem value="READ_ONLY">
										{t("knowledge:studio.readOnly")}
									</SelectItem>
								</SelectContent>
							</Select>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={closeAddMemberDialog}
								>
									{t("knowledge:studio.cancel")}
								</Button>
								<Button
									onClick={handleAddUser}
									disabled={!selectedUser}
								>
									{t("knowledge:studio.add")}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
				<Dialog
					open={!!removeTarget}
					onOpenChange={(open) => {
						if (!open) setRemoveTarget(null);
					}}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>
								{t("knowledge:studio.removeUser")}
							</DialogTitle>
							<DialogDescription>
								{t("knowledge:studio.removeDescription", {
									name: removeTarget?.name,
								})}
							</DialogDescription>
						</DialogHeader>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setRemoveTarget(null)}
							>
								{t("knowledge:studio.cancel")}
							</Button>
							<Button
								variant="destructive"
								onClick={handleRemoveConfirmed}
							>
								{t("knowledge:studio.remove")}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
};
