import {
	Copy,
	ExternalLink,
	Flag,
	Info,
	MoreVertical,
	Pencil,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { FeatureFlagEditDialog } from "@/components/features/FeatureFlagEditDialog";
import { NavbarLeft } from "@/components/shared/NavbarLeft";
import { NavbarHeader } from "@/components/shared/navbar-header";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

interface AppOption {
	app_id: string;
	app_name: string;
	tags: string[];
}

interface FeatureFlag {
	flagId: string;
	appId: string;
	flagKey: string;
	description: string;
	minVersion: number;
	defaultVersion: number;
	createdBy: string;
	createdAt: string;
}

interface CreateFlagForm {
	key: string;
	description: string;
}

const PLATFORM_APP: AppOption = {
	app_id: "SEMOSS",
	app_name: "Platform (SEMOSS)",
	tags: ["SEMOSS"],
};

export const FeaturesPage = observer(() => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [apps, setApps] = useState<AppOption[]>([]);
	const [selectedAppId, setSelectedAppId] = useState("SEMOSS");
	const [flags, setFlags] = useState<FeatureFlag[]>([]);
	const [loadingApps, setLoadingApps] = useState(true);
	const [loadingFlags, setLoadingFlags] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
	const [infoFlag, setInfoFlag] = useState<FeatureFlag | null>(null);
	const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
	const [createForm, setCreateForm] = useState<CreateFlagForm>({
		key: "",
		description: "",
	});
	const [isCreating, setIsCreating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const flagKeyId = useId();
	const flagDescId = useId();

	useEffect(() => {
		setLoadingApps(true);
		monolithStore
			.runQuery(
				'MyProjects(metaKeys=["tag"], filterWord=[""], limit=[50], offset=[0]);',
			)
			.then((response) => {
				const { output } = response.pixelReturn[0];
				if (Array.isArray(output)) {
					const mapped: AppOption[] = output.map(
						(a: Record<string, unknown>) => {
							const raw = a.tag;
							const tags: string[] = Array.isArray(raw)
								? (raw as string[])
								: typeof raw === "string"
									? [raw]
									: [];
							return {
								app_id:
									(a.project_id as string) ??
									(a.app_id as string) ??
									"",
								app_name:
									(a.project_name as string) ??
									(a.app_name as string) ??
									(a.project_id as string) ??
									"",
								tags,
							};
						},
					);
					setApps([PLATFORM_APP, ...mapped]);
				}
			})
			.finally(() => setLoadingApps(false));
	}, [monolithStore]);

	useEffect(() => {
		if (!selectedAppId) {
			setFlags([]);
			return;
		}
		setLoadingFlags(true);
		monolithStore
			.runQuery(`GetAppFeatureFlags(app="${selectedAppId}");`)
			.then((response) => {
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1) {
					toast.error("Failed to load feature flags.");
					setFlags([]);
					return;
				}
				setFlags(Array.isArray(output) ? output : []);
			})
			.finally(() => setLoadingFlags(false));
	}, [selectedAppId, monolithStore]);

	const filteredFlags = useMemo(() => {
		if (!searchValue) return flags;
		const s = searchValue.toLowerCase();
		return flags.filter(
			(f) =>
				f.flagKey?.toLowerCase().includes(s) ||
				f.description?.toLowerCase().includes(s),
		);
	}, [flags, searchValue]);

	const handleCreate = async () => {
		if (!selectedAppId || !createForm.key.trim()) return;
		setIsCreating(true);
		try {
			const response = await monolithStore.runQuery(
				`CreateAppFeatureFlag(app="${selectedAppId}", key="${createForm.key.trim()}", description="<encode>${createForm.description}</encode>");`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to create flag.",
				);
			}
			toast.success(`Feature flag "${createForm.key}" created.`);
			setIsCreateOpen(false);
			setCreateForm({ key: "", description: "" });
			const reload = await monolithStore.runQuery(
				`GetAppFeatureFlags(app="${selectedAppId}");`,
			);
			const { output: reloaded } = reload.pixelReturn[0];
			setFlags(Array.isArray(reloaded) ? reloaded : []);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create flag.",
			);
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deletingFlag || !selectedAppId) return;
		setIsDeleting(true);
		try {
			const response = await monolithStore.runQuery(
				`DeleteAppFeatureFlag(app="${selectedAppId}", flagId="${deletingFlag.flagId}");`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to delete flag.",
				);
			}
			toast.success(`Feature flag "${deletingFlag.flagKey}" deleted.`);
			setFlags((prev) =>
				prev.filter((f) => f.flagId !== deletingFlag.flagId),
			);
			setIsDeleteOpen(false);
			setDeletingFlag(null);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete flag.",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const selectedApp = apps.find((a) => a.app_id === selectedAppId);

	const openFeatureInNewTab = (flag: FeatureFlag) => {
		window.open(
			`#/features/${selectedAppId}/${flag.flagId}`,
			"_blank",
			"noopener,noreferrer",
		);
	};

	const copyFlagId = (flag: FeatureFlag) => {
		try {
			navigator.clipboard.writeText(flag.flagId);
			toast.success("Feature flag ID copied to clipboard");
		} catch {
			toast.error("Failed to copy feature flag ID");
		}
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<div className="flex flex-col gap-6">
				{/* Header */}
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<H3 className="text-2xl">Feature Flags</H3>
						<P className="text-muted-foreground">
							Manage app-scoped feature flags and progressive
							rollouts
						</P>
					</div>
					<Button
						variant="default"
						size="lg"
						disabled={!selectedAppId}
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="size-4" />
						New Flag
					</Button>
				</div>

				{/* App selector + search */}
				<div className="flex flex-wrap items-end gap-3">
					<div className="flex min-w-[220px] flex-col gap-1.5">
						<Label>Application</Label>
						{loadingApps ? (
							<div className="flex h-9 items-center gap-2 text-muted-foreground text-sm">
								<Spinner className="size-4" />
								Loading apps…
							</div>
						) : (
							<Select
								value={selectedAppId}
								onValueChange={setSelectedAppId}
							>
								<SelectTrigger className="w-full min-w-[220px]">
									<SelectValue placeholder="Select an app…" />
								</SelectTrigger>
								<SelectContent>
									{apps.map((app) => (
										<SelectItem
											key={app.app_id}
											value={app.app_id}
										>
											{app.app_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					{selectedAppId && (
						<InputGroup className="h-9 flex-[1_1_240px]">
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								className="h-9"
								placeholder="Search flags…"
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
							/>
							{searchValue ? (
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										size="icon-xs"
										variant="ghost"
										onClick={() => setSearchValue("")}
										aria-label="Clear search"
									>
										<X className="size-4" />
									</InputGroupButton>
								</InputGroupAddon>
							) : null}
						</InputGroup>
					)}
				</div>

				{/* Flag list */}
				{!selectedAppId ? (
					<div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
						<Flag className="mx-auto mb-3 size-8 opacity-30" />
						<P>Select an application to view its feature flags.</P>
					</div>
				) : loadingFlags ? (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Spinner className="size-4" />
						<P>Loading flags…</P>
					</div>
				) : filteredFlags.length === 0 ? (
					<div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
						<Flag className="mx-auto mb-3 size-8 opacity-30" />
						<P>
							{flags.length === 0
								? `No feature flags for ${selectedApp?.app_name ?? selectedAppId}. Create one to get started.`
								: "No flags match your search."}
						</P>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{filteredFlags.map((flag) => (
							<div
								key={flag.flagId}
								className="flex items-center gap-2 rounded-lg border bg-card px-2 py-2 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/30"
							>
								<button
									type="button"
									className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 px-3 py-2 text-left"
									onClick={() =>
										navigate(
											`/features/${selectedAppId}/${flag.flagId}`,
										)
									}
								>
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono font-semibold text-sm">
											{flag.flagKey}
										</span>
										<Badge
											variant={
												flag.defaultVersion > 0
													? "default"
													: "outline"
											}
											className="text-xs"
										>
											default: v{flag.defaultVersion}
										</Badge>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											min: v{flag.minVersion}
										</Badge>
									</div>
									{flag.description ? (
										<P className="truncate text-muted-foreground text-sm">
											{flag.description}
										</P>
									) : null}
									<div className="flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
										<span className="truncate font-mono">
											{flag.flagId}
										</span>
										<button
											type="button"
											className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												copyFlagId(flag);
											}}
											onKeyDown={(e) => {
												if (
													e.key === "Enter" ||
													e.key === " "
												) {
													e.preventDefault();
													e.stopPropagation();
													copyFlagId(flag);
												}
											}}
											aria-label="Copy flag ID"
											title="Copy flag ID"
										>
											<Copy className="size-3.5" />
										</button>
									</div>
									<P className="text-muted-foreground text-xs">
										Created by {flag.createdBy || "unknown"}
									</P>
								</button>
								<div className="mr-1 flex shrink-0 items-center gap-1">
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Open flag in new tab"
										title="Open in new tab"
										onClick={(e) => {
											e.stopPropagation();
											openFeatureInNewTab(flag);
										}}
									>
										<ExternalLink className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="View flag info"
										title="View flag info"
										onClick={(e) => {
											e.stopPropagation();
											setInfoFlag(flag);
											setIsInfoOpen(true);
										}}
									>
										<Info className="size-4" />
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="More options"
												onClick={(e) =>
													e.stopPropagation()
												}
											>
												<MoreVertical className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													copyFlagId(flag);
												}}
											>
												<Copy className="mr-2 size-4" />
												Copy Flag ID
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													setEditingFlag(flag);
													setIsEditOpen(true);
												}}
											>
												<Pencil className="mr-2 size-4" />
												Edit Flag
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													setDeletingFlag(flag);
													setIsDeleteOpen(true);
												}}
												className="text-destructive focus:text-destructive"
											>
												<Trash2 className="mr-2 size-4" />
												Delete Flag
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Flag Info Dialog */}
			<Dialog
				open={isInfoOpen}
				onOpenChange={(open) => {
					setIsInfoOpen(open);
					if (!open) setInfoFlag(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{infoFlag?.flagKey ?? "Feature Flag"}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3 text-sm">
						{infoFlag?.description ? (
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground">
									Description
								</span>
								<P className="text-xs">
									{infoFlag.description}
								</P>
							</div>
						) : null}
						<div className="flex justify-between gap-3">
							<span className="text-muted-foreground">
								Flag ID
							</span>
							<span className="max-w-[240px] truncate font-mono text-xs">
								{infoFlag?.flagId}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Min version
							</span>
							<span>v{infoFlag?.minVersion ?? 0}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Default version
							</span>
							<span>v{infoFlag?.defaultVersion ?? 0}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Created by
							</span>
							<span>{infoFlag?.createdBy || "unknown"}</span>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<FeatureFlagEditDialog
				open={isEditOpen}
				onOpenChange={(open) => {
					setIsEditOpen(open);
					if (!open) {
						setEditingFlag(null);
					}
				}}
				appId={selectedAppId}
				flag={editingFlag}
				monolithStore={monolithStore}
				onSaved={(updated) => {
					setFlags((prev) =>
						prev.map((f) =>
							f.flagId === editingFlag?.flagId
								? {
										...f,
										minVersion: updated.minVersion,
										defaultVersion: updated.defaultVersion,
										description: updated.description,
									}
								: f,
						),
					);
					setInfoFlag((prev) =>
						prev && prev.flagId === editingFlag?.flagId
							? {
									...prev,
									minVersion: updated.minVersion,
									defaultVersion: updated.defaultVersion,
									description: updated.description,
								}
							: prev,
					);
				}}
			/>

			{/* Create Flag Dialog */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>New Feature Flag</DialogTitle>
						<DialogDescription>
							Create a flag for{" "}
							<span className="font-medium">
								{selectedApp?.app_name ?? selectedAppId}
							</span>
							. It starts off for everyone — assign users to a
							version to enable it.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={flagKeyId}>Flag key</Label>
							<InputGroup className="h-9">
								<InputGroupInput
									id={flagKeyId}
									className="h-9 font-mono"
									placeholder="e.g. new-dashboard"
									value={createForm.key}
									onChange={(e) =>
										setCreateForm((prev) => ({
											...prev,
											key: e.target.value
												.toLowerCase()
												.replace(/[^a-z0-9-_]/g, "-"),
										}))
									}
								/>
							</InputGroup>
							<P className="text-muted-foreground text-xs">
								Lowercase letters, numbers, hyphens, underscores
								only.
							</P>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor={flagDescId}>Description</Label>
							<Textarea
								id={flagDescId}
								rows={2}
								placeholder="What does this flag control?"
								value={createForm.description}
								onChange={(e) =>
									setCreateForm((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateOpen(false)}
							disabled={isCreating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={isCreating || !createForm.key.trim()}
						>
							{isCreating ? (
								<>
									<Spinner className="mr-2 size-4" />
									Creating…
								</>
							) : (
								"Create Flag"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirm Dialog */}
			<Dialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsDeleteOpen(false);
						setDeletingFlag(null);
					}
				}}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete Flag</DialogTitle>
						<DialogDescription>
							Delete{" "}
							<span className="font-mono font-semibold">
								{deletingFlag?.flagKey}
							</span>
							? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsDeleteOpen(false);
								setDeletingFlag(null);
							}}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Spinner className="mr-2 size-4" />
									Deleting…
								</>
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
