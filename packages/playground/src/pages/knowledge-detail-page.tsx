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
	Info,
	MessageSquarePlusIcon,
	PencilIcon,
	Trash2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import {
	download,
	Env,
	get,
	post,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
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
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { EmbedDocumentsOverlay } from "@/components/knowledge/embed-documents-overlay";
import { NewKnowledgeOverlay } from "@/components/knowledge/new-knowledge-mcp-overlay";
import { useGlobalBreadcrumbs } from "@/hooks";

type KnowledgeEngine = {
	app_id: string;
	app_name: string;
	description?: string;
	tag?: string[] | string;
	permission?: number;
	low_database_name?: string;
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
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "pdf")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-red-500" />;
	if (ext === "doc" || ext === "docx")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-blue-500" />;
	if (ext === "ppt" || ext === "pptx")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-orange-500" />;
	if (ext === "xls" || ext === "xlsx" || ext === "csv")
		return (
			<FileSpreadsheetIcon className="h-4 w-4 shrink-0 text-green-600" />
		);
	if (
		ext === "png" ||
		ext === "jpg" ||
		ext === "jpeg" ||
		ext === "gif" ||
		ext === "webp" ||
		ext === "svg"
	)
		return <FileImageIcon className="h-4 w-4 shrink-0 text-purple-500" />;
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
	["pdf", "doc", "docx"].includes(name.split(".").pop()?.toLowerCase() ?? "");
const isImage = (name: string) =>
	["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
		name.split(".").pop()?.toLowerCase() ?? "",
	);
const isText = (name: string) =>
	["txt", "md", "csv", "log", "json", "xml", "yaml", "yml"].includes(
		name.split(".").pop()?.toLowerCase() ?? "",
	);
const isPreviewable = (name?: string) =>
	!!name && (isPdf(name) || isImage(name) || isText(name));
const getMimeType = (name: string): string => {
	const mimeTypes: Record<string, string> = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
	};
	return mimeTypes[name.split(".").pop()?.toLowerCase() ?? ""] ?? "image/png";
};

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

	console.log("knowledge object", knowledge);

	const tags = useMemo(() => {
		const raw = knowledge?.tag;
		if (!raw) return [] as string[];
		if (Array.isArray(raw)) return raw;
		return raw.split(/[|,]/).filter(Boolean);
	}, [knowledge?.tag]);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("knowledge:breadcrumbs.home"), path: "/" },
			{
				name: t("knowledge:breadcrumbs.knowledgeLibrary"),
				path: "/knowledge",
			},
			{
				name:
					getKnowledge.status === "SUCCESS"
						? knowledge?.app_name || t("knowledge:detail.knowledge")
						: t("knowledge:breadcrumbs.loading"),
				path: `/knowledge/${knowledgeId}`,
			},
		],
	});

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
	const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
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
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editDescription, setEditDescription] = useState("");
	const [editTagInput, setEditTagInput] = useState("");
	const [editTags, setEditTags] = useState<string[]>([]);

	const insight = useInsight();

	const canEdit = knowledge?.permission === 1;
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
							? getMimeType(previewDoc.fileName)
							: "application/pdf";
						const raw = atob(b64);
						const arr = new Uint8Array(raw.length);
						for (let i = 0; i < raw.length; i++)
							arr[i] = raw.charCodeAt(i);
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
	}, [previewDoc, knowledgeId]);

	const loadMembers = async () => {
		if (!knowledgeId) return;
		setMembersLoading(true);
		try {
			const { data } = await get<{ members: EngineUser[] }>(
				`${Env.MODULE}/api/auth/engine/getEngineUsers?engineId=${knowledgeId}`,
			);
			setMembers(data.members ?? []);
		} finally {
			setMembersLoading(false);
		}
	};

	const handleAddUser = async () => {
		if (!selectedUser) return;
		await post(
			`${Env.MODULE}/api/auth/engine/addEngineUserPermissions`,
			{
				engineId: knowledgeId,
				userpermissions: [
					{
						userid: selectedUser.id,
						permission: selectedRole,
						email: selectedUser.email,
						name: selectedUser.name,
						type: selectedUser.type,
						username: selectedUser.username,
					},
				],
			},
			{},
		);
		setAddOpen(false);
		setUserSearch("");
		setSelectedUser(null);
		setSelectedRole("READ_ONLY");
		void loadMembers();
	};

	const handleRoleChange = async (userId: string, newRole: string) => {
		await post(
			`${Env.MODULE}/api/auth/engine/editEngineUserPermissions`,
			{
				engineId: knowledgeId,
				userpermissions: [{ userid: userId, permission: newRole }],
			},
			{},
		);
		setMembers((prev) =>
			prev.map((m) =>
				m.id === userId ? { ...m, permission: newRole } : m,
			),
		);
	};

	const handleRemoveConfirmed = async () => {
		if (!removeTarget) return;
		await post(
			`${Env.MODULE}/api/auth/engine/removeEngineUserPermissions`,
			{ engineId: knowledgeId, ids: [removeTarget.id] },
			{},
		);
		setRemoveTarget(null);
		void loadMembers();
	};

	useEffect(() => {
		if (activeTab === "permissions") {
			void loadMembers();
		}
	}, [activeTab]);

	useEffect(() => {
		if (!userSearch || !addOpen) {
			setSearchResults([]);
			return;
		}
		const t = setTimeout(async () => {
			setSearchLoading(true);
			try {
				const { data } = await get<SearchUser[]>(
					`${Env.MODULE}/api/auth/engine/getEngineUsersNoCredentials?engineId=${knowledgeId}&searchTerm=${encodeURIComponent(userSearch)}`,
				);
				setSearchResults(data ?? []);
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
		<div className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 px-12 pt-8 pb-4">
				<div className="flex items-start gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate(-1)}
						aria-label={t("common:buttons.back")}
					>
						<ArrowLeftIcon />
					</Button>

					<div className="flex-1 space-y-1">
						<h1 className="font-semibold text-2xl leading-none">
							{knowledge?.app_name ||
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

					<div className="flex gap-2">
						<Button asChild variant="outline">
							<Link
								to={`/new?knowledgeId=${encodeURIComponent(knowledgeId)}`}
							>
								<MessageSquarePlusIcon />
								{t("knowledge:actions.newChat")}
							</Link>
						</Button>

						{canEdit && (
							<Button
								variant="outline"
								onClick={() => {
									setEditDescription(
										knowledge?.description ?? "",
									);
									setEditTags(tags);
									setIsEditOpen(true);
								}}
							>
								<PencilIcon className="h-4 w-4" />
								{t("knowledge:actions.action")}
							</Button>
						)}

						{canEdit && (
							<Button
								variant="default"
								onClick={() => setIsEmbedExistingOpen(true)}
							>
								<FolderPlusIcon />
								{t("knowledge:detail.embedDocuments")}
							</Button>
						)}
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

				<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
					<DialogContent className="w-full sm:max-w-4xl">
						<DialogHeader>
							<DialogTitle>Edit Knowledge Library</DialogTitle>
						</DialogHeader>
						<FieldGroup>
							<Field>
								<FieldLabel>Description</FieldLabel>
								<Textarea
									value={editDescription}
									onChange={(e) =>
										setEditDescription(e.target.value)
									}
									placeholder={t(
										"knowledge:form.descriptionPlaceholder",
									)}
								/>
							</Field>
							<Field>
								<FieldLabel>Tags</FieldLabel>
								<div className="flex min-h-[40px] flex-wrap gap-1 rounded-md border p-2">
									{editTags.map((t) => (
										<span
											key={t}
											className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground text-xs"
										>
											{t}
											<button
												type="button"
												onClick={() =>
													setEditTags((prev) =>
														prev.filter(
															(x) => x !== t,
														),
													)
												}
												className="hover:text-destructive"
											>
												×
											</button>
										</span>
									))}
									<input
										value={editTagInput}
										onChange={(e) =>
											setEditTagInput(e.target.value)
										}
										onKeyDown={(e) => {
											if (
												(e.key === "Enter" ||
													e.key === ",") &&
												editTagInput.trim()
											) {
												e.preventDefault();
												const newTag = editTagInput
													.trim()
													.replace(/,$/, "");
												if (
													newTag &&
													!editTags.includes(newTag)
												) {
													setEditTags((prev) => [
														...prev,
														newTag,
													]);
												}
												setEditTagInput("");
											}
											if (
												e.key === "Backspace" &&
												!editTagInput &&
												editTags.length > 0
											) {
												setEditTags((prev) =>
													prev.slice(0, -1),
												);
											}
										}}
										placeholder={
											editTags.length === 0
												? "Add tags..."
												: ""
										}
										className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
									/>
								</div>
							</Field>
						</FieldGroup>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsEditOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={async () => {
									try {
										const meta: Record<string, string> = {};
										if (editDescription.trim()) {
											meta["description"] =
												editDescription;
										}
										meta["tag"] = editTags.join("|");

										await insight.actions.run(
											`SetDatabaseMetadata(database=["${knowledgeId}"], meta=[${JSON.stringify(meta)}])`,
										);
										setIsEditOpen(false);
										toast.success(
											"Knowledge library updated",
										);
										getKnowledge.refresh?.();
									} catch (err) {
										console.error("Save failed", err);
										toast.error("Failed to save changes");
									}
								}}
							>
								Save
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

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
						<TabsTrigger value="files">Files</TabsTrigger>
						<TabsTrigger value="permissions">
							Permissions
						</TabsTrigger>
					</TabsList>
					<TabsContent value="files">
						<Card className="rounded-xl border-border bg-card shadow-sm">
							<CardHeader>
								<CardTitle>
									{t("knowledge:documents.title")}
								</CardTitle>
								<CardDescription>
									{getDocuments.status === "SUCCESS"
										? `There are currently ${getDocuments.data.length} documents embedded in this knowledge source.`
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
									<ScrollArea className="h-[50vh]">
										<table className="w-full table-fixed text-sm">
											<thead>
												<tr className="border-b text-muted-foreground text-xs">
													{canEdit && (
														<th className="w-10 px-2 pb-2 text-center align-middle">
															{selectedDocs.size >
															0 ? (
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<button
																			type="button"
																			className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-destructive hover:bg-destructive/10"
																			onClick={async () => {
																				const fileNames =
																					Array.from(
																						selectedDocs,
																					);
																				const fileNamesStr =
																					fileNames
																						.map(
																							(
																								f,
																							) =>
																								`"/schema/default/documents/${f}"`,
																						)
																						.join(
																							", ",
																						);

																				await insight.actions.run<
																					[
																						string,
																					]
																				>(
																					`RemoveDocumentFromVectorDatabase(engine=["${knowledgeId}"], fileNames=[${fileNamesStr}]);`,
																				);
																				setSelectedDocs(
																					new Set(),
																				);
																				getDocuments.refresh();
																			}}
																		>
																			<Trash2 className="h-4 w-4" />
																		</button>
																	</TooltipTrigger>
																	<TooltipContent>
																		Delete{" "}
																		{
																			selectedDocs.size
																		}{" "}
																		selected
																	</TooltipContent>
																</Tooltip>
															) : (
																<Checkbox
																	checked={
																		selectedDocs.size ===
																			sortedDocuments.length &&
																		sortedDocuments.length >
																			0
																	}
																	onCheckedChange={(
																		checked: boolean,
																	) => {
																		if (
																			checked
																		) {
																			setSelectedDocs(
																				new Set(
																					sortedDocuments.map(
																						(
																							d,
																						) =>
																							d.fileName,
																					),
																				),
																			);
																		} else {
																			setSelectedDocs(
																				new Set(),
																			);
																		}
																	}}
																/>
															)}
														</th>
													)}

													<th className="px-6 pb-2 text-left font-medium">
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
													<th className="w-48 px-4 pb-2 text-left font-medium">
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
													<th className="w-19 px-6 pb-2 text-right font-medium">
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
													<th className="w-10 w-20 pb-2" />
												</tr>
											</thead>

											<tbody>
												{sortedDocuments.map((d) => (
													<tr
														key={`${d.fileName}-${d.lastModified}`}
														className="border-b transition last:border-0 hover:bg-muted/40"
													>
														{canEdit && (
															<td className="px-2 py-2 text-center align-middle">
																<Checkbox
																	checked={selectedDocs.has(
																		d.fileName,
																	)}
																	onCheckedChange={(
																		checked: boolean,
																	) => {
																		setSelectedDocs(
																			(
																				prev,
																			) => {
																				const next =
																					new Set(
																						prev,
																					);
																				if (
																					checked
																				) {
																					next.add(
																						d.fileName,
																					);
																				} else {
																					next.delete(
																						d.fileName,
																					);
																				}
																				return next;
																			},
																		);
																	}}
																/>
															</td>
														)}

														<td className="whitespace-nowrap px-6 py-2">
															<div className="flex min-w-0 items-center gap-2">
																{getFileIcon(
																	d.fileName,
																)}
																<button
																	type="button"
																	className="cursor-pointer break-all text-left font-medium text-xs hover:underline"
																	onClick={() =>
																		setPreviewDoc(
																			d,
																		)
																	}
																>
																	{d.fileName}
																</button>
															</div>
														</td>
														<td className="w-44 px-4 py-2 text-muted-foreground text-xs tabular-nums">
															{formatDateTime(
																d.lastModified,
															)}
														</td>
														<td className="w-28 px-6 py-2 text-right text-muted-foreground text-xs tabular-nums">
															{formatFileSize(
																d.fileSize,
															)}
														</td>
														<td className="w-20 px-4 py-1">
															<div className="flex items-center justify-end gap-0.5">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7"
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
												))}
											</tbody>
										</table>
									</ScrollArea>
								)}
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="permissions">
						<Card className="rounded-xl border-border bg-card shadow-sm">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>
										{t("knowledge:permissions.title")}{" "}
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-muted-foreground"
												>
													<Info className="h-4 w-4" />
													<span className="sr-only">
														{t(
															"knowledge:permissions.aboutTitle",
														)}
													</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent
												side="right"
												className="max-w-sm"
											>
												<p className="text-sm leading-relaxed">
													{t(
														"knowledge:permissions.description",
													)}
												</p>
											</TooltipContent>
										</Tooltip>
									</CardTitle>
									<Button
										size="sm"
										onClick={() => setAddOpen(true)}
									>
										Add User
									</Button>
								</div>
							</CardHeader>
							<CardContent className="px-0 pb-4">
								{membersLoading ? (
									<div className="flex items-center justify-center py-8">
										<Spinner />
									</div>
								) : members.length === 0 ? (
									<div className="px-6 py-4 text-muted-foreground text-sm">
										No users found.
									</div>
								) : (
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b text-muted-foreground text-xs">
												<th className="w-10 px-6 pb-2 text-left font-medium">
													User
												</th>
												<th className="w-36 px-4 pb-2 text-left font-medium">
													Role
												</th>
												<th className="w-16 pb-2" />
											</tr>
										</thead>
										<tbody>
											{members.map((m) => (
												<tr
													key={m.id}
													className="border-b transition last:border-0 hover:bg-muted/40"
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
															<SelectTrigger className="h-7 text-xs">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="OWNER">
																	Author
																</SelectItem>
																<SelectItem value="EDIT">
																	Editor
																</SelectItem>
																<SelectItem value="READ_ONLY">
																	Read-Only
																</SelectItem>
															</SelectContent>
														</Select>
													</td>
													<td className="w-16 px-2 py-1 text-right">
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
															Remove
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
					<DialogContent
						className="flex max-h-[90vh] flex-col gap-4 overflow-hidden p-0"
						style={{ width: "80vw", maxWidth: "80vw" }}
					>
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
									title="PDF preview"
								/>
							)}
						{previewBlobUrl &&
							previewDoc &&
							isImage(previewDoc.fileName) && (
								<div className="flex items-center justify-center overflow-auto p-6">
									<img
										src={previewBlobUrl}
										alt="Preview"
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
										? "Failed to load preview."
										: "Preview not available for this file type."}
								</p>
							</div>
						)}
					</DialogContent>
				</Dialog>
				<Dialog open={addOpen} onOpenChange={setAddOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Add User</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<input
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								placeholder="Search by name or email..."
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
											className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors${selectedUser?.id === u.id ? "bg-muted font-medium" : ""}`}
											onClick={() => setSelectedUser(u)}
										>
											<span className="font-medium">
												{u.name}
											</span>
											<span className="ml-2 text-muted-foreground">
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
										No users found.
									</p>
								)}
							<Select
								value={selectedRole}
								onValueChange={setSelectedRole}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="OWNER">
										Author
									</SelectItem>
									<SelectItem value="EDIT">Editor</SelectItem>
									<SelectItem value="READ_ONLY">
										Read-Only
									</SelectItem>
								</SelectContent>
							</Select>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setAddOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={handleAddUser}
									disabled={!selectedUser}
								>
									Add
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
							<DialogTitle>Remove User</DialogTitle>
							<DialogDescription>
								Remove {removeTarget?.name} from this knowledge
								source?
							</DialogDescription>
						</DialogHeader>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setRemoveTarget(null)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleRemoveConfirmed}
							>
								Remove
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
});
