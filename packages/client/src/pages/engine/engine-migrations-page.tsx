import {
	ChevronDown,
	ChevronRight,
	DatabaseZap,
	Loader2,
	RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { useParams } from "react-router-dom";
import { MonacoEditor } from "@semoss/shared";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FileDropzone,
	H4,
	Input,
	Muted,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
	useTheme,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type { MonolithStore } from "@/stores";

interface MigrationListRow {
	migrationId: string;
	scriptName: string;
	version: number;
	createdBy: string;
	createdOn: string;
	notes: string | null;
	lastRunSuccess: boolean | null;
	lastRunOn: string | null;
	lastRunError: string | null;
}

interface MigrationVersionRow extends MigrationListRow {
	sqlContent: string;
	isLatest: boolean;
}

interface RestoreDraft {
	migrationId: string;
	sqlContent: string;
	scriptName: string;
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) {
		return "—";
	}
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) {
			return dateStr;
		}
		return date.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	} catch {
		return dateStr;
	}
}

function StatusBadge({ success }: { success: boolean | null }) {
	if (success === null) {
		return <Badge variant="outline">Never run</Badge>;
	}
	return success ? (
		<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
			Success
		</Badge>
	) : (
		<Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
			Failed
		</Badge>
	);
}

/**
 * Runs a Migrations reactor pixel and returns its output, throwing with the
 * server's error message if the pixel itself errored.
 */
async function runMigrationPixel<T>(
	monolithStore: MonolithStore,
	pixel: string,
): Promise<T> {
	const res = await monolithStore.runQuery(pixel);
	const pixelResult = res?.pixelReturn?.[0];
	const isError = pixelResult?.operationType?.includes("ERROR") ?? false;

	const output = pixelResult?.output;
	if (isError) {
		throw new Error(
			typeof output === "string" ? output : "Migration request failed",
		);
	}
	return output as T;
}

function VersionRow({
	version,
	onRestore,
}: {
	version: MigrationVersionRow;
	onRestore: (draft: RestoreDraft) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const { resolvedTheme } = useTheme();

	return (
		<Collapsible open={expanded} onOpenChange={setExpanded}>
			<div className="flex items-center gap-2 border-border/60 border-t py-2">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex flex-1 items-center gap-2 text-left"
					>
						{expanded ? (
							<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
						) : (
							<ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
						)}
						<span className="font-medium text-sm">
							Version {version.version}
						</span>
						{version.isLatest && (
							<Badge variant="secondary" className="text-[10px]">
								Latest
							</Badge>
						)}
						<StatusBadge success={version.lastRunSuccess} />
						<Muted className="text-xs">
							{version.createdBy} •{" "}
							{formatDate(version.createdOn)}
						</Muted>
					</button>
				</CollapsibleTrigger>
				{!version.isLatest && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 gap-1.5 text-muted-foreground text-xs hover:text-foreground"
						onClick={() =>
							onRestore({
								migrationId: version.migrationId,
								sqlContent: version.sqlContent,
								scriptName: version.scriptName,
							})
						}
					>
						<RotateCcw className="size-3" />
						Restore
					</Button>
				)}
			</div>
			<CollapsibleContent>
				<div className="mb-2 ml-6 space-y-2">
					{version.notes && (
						<Muted className="text-xs">{version.notes}</Muted>
					)}
					{version.lastRunError && (
						<div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 font-mono text-destructive text-xs">
							{version.lastRunError}
						</div>
					)}
					<MonacoEditor
						width="100%"
						height="160px"
						theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
						options={{
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							readOnly: true,
							contextmenu: false,
						}}
						value={version.sqlContent}
						language="sql"
					/>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

function MigrationRow({
	migration,
	monolithStore,
	onRestore,
}: {
	migration: MigrationListRow;
	monolithStore: MonolithStore;
	onRestore: (draft: RestoreDraft) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const [versions, setVersions] = useState<MigrationVersionRow[] | null>(
		null,
	);
	const [loadingVersions, setLoadingVersions] = useState(false);

	const fetchVersions = useCallback(async () => {
		if (versions !== null || loadingVersions) {
			return;
		}
		setLoadingVersions(true);
		try {
			const output = await runMigrationPixel<MigrationVersionRow[]>(
				monolithStore,
				`GetMigrationVersions(migrationId=["${migration.migrationId}"]);`,
			);
			setVersions(Array.isArray(output) ? output : []);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to load version history",
			);
			setVersions([]);
		} finally {
			setLoadingVersions(false);
		}
	}, [migration.migrationId, monolithStore, versions, loadingVersions]);

	const handleToggle = (open: boolean) => {
		setExpanded(open);
		if (open) {
			fetchVersions();
		}
	};

	return (
		<Collapsible open={expanded} onOpenChange={handleToggle}>
			<div className="rounded-lg border border-border p-3">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex w-full items-center gap-3 text-left"
					>
						{expanded ? (
							<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
						) : (
							<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
						)}
						<span className="min-w-0 flex-1 truncate font-medium text-sm">
							{migration.scriptName}
						</span>
						<Badge variant="outline" className="text-[10px]">
							v{migration.version}
						</Badge>
						<StatusBadge success={migration.lastRunSuccess} />
						<Muted className="shrink-0 text-xs">
							{formatDate(migration.lastRunOn)}
						</Muted>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="mt-1">
						{loadingVersions && (
							<div className="flex items-center gap-2 py-3 text-muted-foreground text-sm">
								<Loader2 className="size-4 animate-spin" />
								Loading version history...
							</div>
						)}
						{!loadingVersions &&
							versions?.map((version) => (
								<VersionRow
									key={version.version}
									version={version}
									onRestore={onRestore}
								/>
							))}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

function NewMigrationDialog({
	open,
	onClose,
	engineId,
	restoreDraft,
	monolithStore,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	engineId: string;
	restoreDraft: RestoreDraft | null;
	monolithStore: MonolithStore;
	onSaved: () => void;
}) {
	const { resolvedTheme } = useTheme();
	const scriptNameId = useId();
	const notesId = useId();

	const [scriptName, setScriptName] = useState("");
	const [notes, setNotes] = useState("");
	const [sqlContent, setSqlContent] = useState("");
	const [mode, setMode] = useState<"write" | "upload">("write");
	const [file, setFile] = useState<File | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}
		setMode("write");
		setFile(null);
		setSaving(false);
		if (restoreDraft) {
			setScriptName(`restored_${restoreDraft.scriptName}`);
			setNotes(`Restored from an earlier version`);
			setSqlContent(restoreDraft.sqlContent);
		} else {
			setScriptName("");
			setNotes("");
			setSqlContent("");
		}
	}, [open, restoreDraft]);

	const handleFileChange = async (value: File | File[] | null) => {
		const chosen = Array.isArray(value) ? (value[0] ?? null) : value;
		setFile(chosen);
		if (chosen) {
			const text = await chosen.text();
			setSqlContent(text);
			if (!scriptName) {
				setScriptName(chosen.name.replace(/\.sql$/i, ""));
			}
		}
	};

	const handleSave = async () => {
		if (!scriptName.trim()) {
			toast.error("Please name this migration.");
			return;
		}
		if (!sqlContent.trim()) {
			toast.error("Please write or upload SQL content.");
			return;
		}

		setSaving(true);
		try {
			const details: Record<string, unknown> = {
				engine: engineId,
				sqlContent,
				scriptName,
				notes,
			};
			if (restoreDraft) {
				details.migrationId = restoreDraft.migrationId;
			}

			const output = await runMigrationPixel<{
				success: boolean;
				version: number;
				errorMessage: string | null;
				metadataSynced: boolean;
			}>(
				monolithStore,
				`SaveMigration(map=[${JSON.stringify(details)}]);`,
			);

			if (output.success) {
				toast.success(`Saved and ran version ${output.version}.`);
				if (!output.metadataSynced) {
					toast.warning(
						"Ran successfully, but syncing the engine's metadata afterward failed — the Metadata tab may be stale until a manual sync.",
					);
				}
			} else {
				toast.error(
					`Version ${output.version} was saved, but failed to run: ${output.errorMessage ?? "see the version history for details."}`,
				);
			}
			onSaved();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to save migration.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !next && !saving && onClose()}
		>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{restoreDraft ? "Restore migration" : "New migration"}
					</DialogTitle>
					<DialogDescription>
						Saving immediately runs this SQL against the engine —
						there's no separate draft step.
					</DialogDescription>
				</DialogHeader>

				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={scriptNameId}>Name</FieldLabel>
						<Input
							id={scriptNameId}
							value={scriptName}
							onChange={(e) => setScriptName(e.target.value)}
							placeholder="add_status_column"
							disabled={saving}
						/>
					</Field>

					<Field>
						<FieldLabel>SQL</FieldLabel>
						<Tabs
							value={mode}
							onValueChange={(v) =>
								setMode(v as "write" | "upload")
							}
						>
							<TabsList>
								<TabsTrigger value="write" disabled={saving}>
									Write
								</TabsTrigger>
								<TabsTrigger value="upload" disabled={saving}>
									Upload
								</TabsTrigger>
							</TabsList>
							<TabsContent value="write">
								<MonacoEditor
									width="100%"
									height="240px"
									theme={
										resolvedTheme === "dark"
											? "vs-dark"
											: "vs"
									}
									options={{
										minimap: { enabled: false },
										scrollBeyondLastLine: false,
										readOnly: saving,
										contextmenu: false,
									}}
									value={sqlContent}
									language="sql"
									onChange={(value) =>
										setSqlContent(value ?? "")
									}
								/>
							</TabsContent>
							<TabsContent value="upload">
								<FileDropzone
									extensions={[".sql"]}
									multiple={false}
									value={file}
									onChange={handleFileChange}
									disabled={saving}
								/>
								{sqlContent && (
									<Muted className="mt-2 block text-xs">
										{sqlContent.split("\n").length} lines
										loaded from {file?.name}
									</Muted>
								)}
							</TabsContent>
						</Tabs>
					</Field>

					<Field>
						<FieldLabel htmlFor={notesId}>
							Notes (optional)
						</FieldLabel>
						<Input
							id={notesId}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							disabled={saving}
						/>
					</Field>
				</FieldGroup>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={saving}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Saving &amp; running...
							</>
						) : (
							"Save & Run"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const EngineMigrationsPage = () => {
	const { engineId } = useParams<{ engineId: string }>();
	const { monolithStore } = useRootStore();

	const [migrations, setMigrations] = useState<MigrationListRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [restoreDraft, setRestoreDraft] = useState<RestoreDraft | null>(null);

	const fetchMigrations = useCallback(async () => {
		if (!engineId) {
			return;
		}
		setLoading(true);
		setError("");
		try {
			const output = await runMigrationPixel<MigrationListRow[]>(
				monolithStore,
				`ListMigrations(engine=["${engineId}"]);`,
			);
			setMigrations(Array.isArray(output) ? output : []);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to load migrations",
			);
		} finally {
			setLoading(false);
		}
	}, [engineId, monolithStore]);

	useEffect(() => {
		fetchMigrations();
	}, [fetchMigrations]);

	if (!engineId) {
		return null;
	}

	return (
		<div className="px-6 py-4">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<DatabaseZap className="size-5 text-muted-foreground" />
					<H4>Migrations</H4>
				</div>
				<Button
					onClick={() => {
						setRestoreDraft(null);
						setDialogOpen(true);
					}}
				>
					New Migration
				</Button>
			</div>

			{loading && (
				<div className="flex items-center justify-center py-12">
					<Spinner className="size-6" />
				</div>
			)}

			{!loading && error && (
				<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
					<p className="font-medium text-destructive text-sm">
						{error}
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={fetchMigrations}
					>
						Retry
					</Button>
				</div>
			)}

			{!loading && !error && migrations.length === 0 && (
				<div className="rounded-xl border border-border/70 border-dashed bg-muted/20 p-8 text-center">
					<div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
						<DatabaseZap className="size-5 text-muted-foreground" />
					</div>
					<p className="font-medium text-sm">No migrations yet</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Write or upload a SQL script to get started.
					</p>
				</div>
			)}

			{!loading && !error && migrations.length > 0 && (
				<div className="space-y-2">
					{migrations.map((migration) => (
						<MigrationRow
							key={migration.migrationId}
							migration={migration}
							monolithStore={monolithStore}
							onRestore={(draft) => {
								setRestoreDraft(draft);
								setDialogOpen(true);
							}}
						/>
					))}
				</div>
			)}

			<NewMigrationDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				engineId={engineId}
				restoreDraft={restoreDraft}
				monolithStore={monolithStore}
				onSaved={() => {
					setDialogOpen(false);
					fetchMigrations();
				}}
			/>
		</div>
	);
};
