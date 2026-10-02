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
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	addEngineUserPermissions,
	editEngineUserPermissions,
	getEngineUsers,
	getEngineUsersNoCredentials,
	type PostUser,
	removeEngineUserPermissions,
} from "@semoss/sdk";
import { download, useInsight, usePixel } from "@semoss/sdk/react";
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
import { decodeBase64 } from "@semoss/utility/encoding";
import { getFileExtension } from "@semoss/utility/file";
import { getImageMimeType } from "@semoss/utility/image";
import { EmbedDocumentsOverlay } from "@/components/knowledge/embed-documents-overlay";
import { NewKnowledgeOverlay } from "@/components/knowledge/new-knowledge-mcp-overlay";

type KnowledgeEngine = {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	description?: string;
	tag?: string[] | string;
};

type VectorDocument = {
	fileName: string;
	lastModified: string;
	fileSize: string | number;
};

type EngineUser = {
	id: string;
	name: string;
	email: string;
	permission: string;
};

type SearchUser = {
	id: string;
	name: string;
	email: string;
	type: string;
	username: string;
};

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

const formatFileSize = (fileSize: string | number): string => {
	const bytes = parseSizeBytes(fileSize);
	if (bytes === 0) return String(fileSize);
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

const isPdf = (name: string) =>
	["pdf", "doc", "docx"].includes(getFileExtension(name));
const isImage = (name: string) =>
	["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
		getFileExtension(name),
	);
const isText = (name: string) =>
	["txt", "md", "csv", "log", "json", "xml", "yaml", "yml"].includes(
		getFileExtension(name),
	);
const isPreviewable = (name?: string) =>
	!!name && (isPdf(name) || isImage(name) || isText(name));
/**
 * Knowledge detail page
 */
export const KnowledgeDetailPage = observer(() => {
	const { t } = useTranslation(["knowledge", "common"]);
	const navigate = useNavigate();
	const { knowledgeId } = useParams<{ knowledgeId: string }>();

	const getKnowledge = usePixel<KnowledgeEngine[]>(
		knowledgeId
			? `MyEngines(engine=["${knowledgeId}"], engineTypes=['VECTOR'], metaKeys=["description","tag"], userT=[true], limit=[1], offset=[0]);`
			: "",
		{ data: [] },
	);

	const knowledge =
		getKnowledge.status === "SUCCESS" ? getKnowledge.data?.[0] : null;

	const tags = useMemo(() => {
		const raw = knowledge?.tag;
		if (!raw) {
			return [] as string[];
		}
		return Array.isArray(raw) ? raw : [raw];
	}, [knowledge?.tag]);

	const getDocuments = usePixel<VectorDocument[]>(
		knowledgeId
			? `ListDocumentsInVectorDatabase(engine=["${knowledgeId}"]);`
			: "",
		{ data: [] },
	);

	const [isEmbedOpen, setIsEmbedOpen] = useState(false);
	const [isEmbedExistingOpen, setIsEmbedExistingOpen] = useState(false);
	const [docSortBy, setDocSortBy] = useState<"name" | "size" | "date">(
		"name",
	);
	const [docSortDir, setDocSortDir] = useState<"asc" | "desc">("asc");
	const [previewDoc, setPreviewDoc] = useState<VectorDocument | null>(null);
	const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
	const [previewText, setPreviewText] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState(false);
	const [activeTab, setActiveTab] = useState<"files" | "permissions">(
		"files",
	);
	const [members, setMembers] = useState<EngineUser[]>([]);
	const [membersLoading, setMembersLoading] = useState(false);
	const [addOpen, setAddOpen] = useState(false);
	const [userSearch, setUserSearch] = useState("");
	const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>("READ_ONLY");
	const [removeTarget, setRemoveTarget] = useState<EngineUser | null>(null);
	const insight = useInsight();
	useEffect(() => {
		if (!previewDoc) {
			setPreviewBlobUrl(null);
			setPreviewText(null);
			setPreviewLoading(false);
			setPreviewError(false);
			return;
		}
		let cancelled = false;
		let createdBlobUrl: string | null = null;
		setPreviewLoading(true);
		setPreviewError(false);
		setPreviewBlobUrl(null);
		setPreviewText(null);
		(async () => {
			try {
				const filePath = `/schema/default/documents/${previewDoc.fileName}`;
				if (isText(previewDoc.fileName)) {
					const { pixelReturn } = await insight.actions.run<[string]>(
						`GetEngineAssets(filePath=["${filePath}"], engine=["${knowledgeId}"]);`,
					);
					const text = pixelReturn[0].output;
					if (!cancelled) setPreviewText(text);
				} else {
					const { pixelReturn } = await insight.actions.run<[string]>(
						`GetEngineAssetsBase64(filePath=["${filePath}"], engine=["${knowledgeId}"]);`,
					);
					const b64 = pixelReturn[0].output;
					if (!cancelled) {
						const mimeType = isImage(previewDoc.fileName)
							? getImageMimeType(
									getFileExtension(previewDoc.fileName),
								)
							: "application/pdf";
						const arr = decodeBase64(b64);
						const blob = new Blob([arr], { type: mimeType });
						const blobUrl = URL.createObjectURL(blob);
						createdBlobUrl = blobUrl;
						setPreviewBlobUrl(blobUrl);
					}
				}
			} catch {
				if (!cancelled) setPreviewError(true);
			} finally {
				if (!cancelled) setPreviewLoading(false);
			}
		})();
		return () => {
			cancelled = true;
			if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
		};
	}, [previewDoc, knowledgeId, insight.actions.run]);

	const loadMembers = useCallback(async () => {
		if (!knowledgeId) return;
		setMembersLoading(true);
		try {
			const { members } = await getEngineUsers(knowledgeId);
			setMembers((members ?? []) as unknown as EngineUser[]);
		} finally {
			setMembersLoading(false);
		}
	}, [knowledgeId]);

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
		setAddOpen(false);
		setUserSearch("");
		setSelectedUser(null);
		setSelectedRole("READ_ONLY");
		void loadMembers();
	};

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

	const handleRemoveConfirmed = async () => {
		if (!removeTarget) return;
		await removeEngineUserPermissions(knowledgeId, [removeTarget.id]);
		setRemoveTarget(null);
		void loadMembers();
	};

	useEffect(() => {
		if (activeTab === "permissions") {
			void loadMembers();
		}
	}, [activeTab, loadMembers]);

	useEffect(() => {
		if (!userSearch || !addOpen) {
			setSearchResults([]);
			return;
		}
		const t = setTimeout(async () => {
			setSearchLoading(true);
			try {
				const results = await getEngineUsersNoCredentials(
					knowledgeId,
					false,
					userSearch,
				);
				setSearchResults(results as unknown as SearchUser[]);
			} finally {
				setSearchLoading(false);
			}
		}, 300);
		return () => clearTimeout(t);
	}, [userSearch, addOpen, knowledgeId]);

	const sortedDocuments = useMemo(() => {
		if (getDocuments.status !== "SUCCESS") return [];
		return [...getDocuments.data].sort((a, b) => {
			let cmp = 0;
			if (docSortBy === "name")
				cmp = a.fileName.localeCompare(b.fileName);
			else if (docSortBy === "size")
				cmp = parseSizeBytes(a.fileSize) - parseSizeBytes(b.fileSize);
			else cmp = a.lastModified.localeCompare(b.lastModified);
			return docSortDir === "asc" ? cmp : -cmp;
		});
	}, [getDocuments.status, getDocuments.data, docSortBy, docSortDir]);

	const toggleSort = (col: "name" | "size" | "date") => {
		if (docSortBy === col) {
			setDocSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setDocSortBy(col);
			setDocSortDir("asc");
		}
	};

	const handleDownload = async (fileName: string) => {
		const { pixelReturn } = await insight.actions.run<[string]>(
			`META | VectorFileDownload(engine = "${knowledgeId}", fileNames=["${fileName}"]);`,
		);
		const fileKey = pixelReturn[0].output;
		await download(insight.insightId, fileKey);
	};

	if (!knowledgeId) {
		return <Navigate to="/knowledge" replace />;
	}

	if (getKnowledge.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getKnowledge.status === "ERROR") {
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
							onClick={() => setIsEmbedExistingOpen(true)}
						>
							<FolderPlusIcon />
							{t("knowledge:detail.embedDocuments")}
						</Button>
					</div>
				</div>

				<NewKnowledgeOverlay
					open={isEmbedOpen}
					onClose={(knowledgeCreated) => {
						setIsEmbedOpen(false);
						if (knowledgeCreated) {
							toast.info(
								t("knowledge:detail.newKnowledgeCreated"),
							);
						}
					}}
				/>

				<EmbedDocumentsOverlay
					open={isEmbedExistingOpen}
					knowledgeId={knowledgeId}
					onClose={(success) => {
						setIsEmbedExistingOpen(false);
						if (success) {
							getDocuments.refresh?.();
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
									{getDocuments.status === "SUCCESS"
										? t("knowledge:studio.documentCount", {
												count: getDocuments.data.length,
											})
										: t(
												"knowledge:detail.documentsDescription",
											)}
								</CardDescription>
							</CardHeader>
							<CardContent className="px-0 pb-0">
								{getDocuments.status === "LOADING" ? (
									<div className="px-6 pb-6 text-muted-foreground text-sm">
										{t(
											"knowledge:messages.loadingDocuments",
										)}
									</div>
								) : getDocuments.status === "ERROR" ? (
									<div className="px-6 pb-6 text-destructive text-sm">
										{t(
											"knowledge:detail.failedToLoadDocuments",
										)}
									</div>
								) : getDocuments.data.length === 0 ? (
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
																	toggleSort(
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
																	toggleSort(
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
																	toggleSort(
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
										onClick={() => setAddOpen(true)}
									>
										{t("knowledge:studio.addUser")}
									</Button>
								</div>
							</CardHeader>
							<CardContent className="overflow-x-auto px-0 pb-4">
								{membersLoading ? (
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
						{previewLoading && (
							<div className="flex items-center justify-center py-16">
								<Spinner />
							</div>
						)}
						{previewBlobUrl &&
							previewDoc &&
							isPdf(previewDoc.fileName) && (
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
						{(previewError ||
							(!previewLoading &&
								!previewBlobUrl &&
								previewText === null &&
								previewDoc &&
								!isPreviewable(previewDoc.fileName))) && (
							<div className="flex items-center justify-center py-16">
								<p className="text-muted-foreground text-sm">
									{previewError
										? t("knowledge:studio.previewError")
										: t(
												"knowledge:studio.previewUnavailable",
											)}
								</p>
							</div>
						)}
					</DialogContent>
				</Dialog>
				<Dialog open={addOpen} onOpenChange={setAddOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>
								{t("knowledge:studio.addUser")}
							</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<Input
								aria-label={t("knowledge:studio.searchUsers")}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								placeholder={t("knowledge:studio.searchUsers")}
								value={userSearch}
								onChange={(e) => setUserSearch(e.target.value)}
							/>
							{searchLoading && (
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
											className={`w-full px-3 py-2 text-start text-sm hover:bg-muted transition-colors${selectedUser?.id === u.id ? "bg-muted font-medium" : ""}`}
											onClick={() => setSelectedUser(u)}
										>
											<span className="font-medium">
												{u.name}
											</span>
											<span className="ms-2 text-muted-foreground">
												{u.email}
											</span>
										</button>
									))}
								</div>
							)}
							{userSearch &&
								!searchLoading &&
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
									onClick={() => setAddOpen(false)}
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
});
