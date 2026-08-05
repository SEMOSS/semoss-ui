import { Eye, FileText, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Muted,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import {
	compareVersions,
	type MigrationRow,
	MigrationStateBadge,
	MigrationsSummary,
	NewMigrationDialog,
} from "@/components/engine";
import { useEngine, useRootStore } from "@/hooks";

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return dateStr;
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

function formatExecutionTime(ms: number | null): string {
	if (ms === null || ms === undefined) return "—";
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

interface SqlViewState {
	version: string;
	fileName: string;
	sql: string | null;
	loading: boolean;
}

/**
 * Status board for an engine's database migrations -- merges the
 * `V<version>__<description>.sql` files under the engine's own
 * `assets/.migrations` folder with `SEMOSS_SCHEMA_HISTORY` run outcomes.
 * Migrations run automatically the next time the engine is opened
 * (`ENABLE_MIGRATIONS=true` on the engine's smss); the "New Migration" action
 * is the only way a migration file gets created -- SEMOSS owns the folder and
 * file naming, not a person editing the filesystem directly.
 */
export const EngineMigrationsPage = () => {
	const { active } = useEngine();
	const { configStore } = useRootStore();
	const [showNewMigration, setShowNewMigration] = useState(false);
	const [dismissingVersion, setDismissingVersion] = useState<string | null>(
		null,
	);
	const [sqlView, setSqlView] = useState<SqlViewState | null>(null);
	// the tab is exposed to READ_ONLY users (see engine.constants.ts restrict
	// list) so metadata stays visible, but only EDIT/OWNER may create/run a
	// migration -- the backend enforces this too (userCanEditEngine), this
	// just keeps the UI from offering an action that would only fail server-side
	const canEdit = active.role === "EDIT" || active.role === "OWNER";

	const listMigrations = usePixel<MigrationRow[]>(
		`ListEngineMigrations(engine=["${active.id}"]);`,
	);

	const rows = useMemo(
		() => listMigrations.data ?? [],
		[listMigrations.data],
	);

	// mirrors SaveEngineMigrationReactor.nextVersion() so the dialog can show
	// what version will likely be assigned (exact version is confirmed server-side)
	const nextVersion = useMemo(() => {
		if (rows.length === 0) return "1";
		const highest = rows
			.map((r) => r.version)
			.reduce((a, b) => (compareVersions(a, b) > 0 ? a : b), "0");
		return String(parseInt(highest.split(".")[0], 10) + 1);
	}, [rows]);

	const handleDismiss = async (version: string) => {
		setDismissingVersion(version);
		try {
			const { errors } = await configStore.runPixel(
				`DismissEngineMigrationRecord(engine=["${active.id}"], version=["${version}"]);`,
			);
			if (errors.length > 0) throw new Error(errors.join(""));
			listMigrations.refresh();
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to dismiss migration",
			);
		} finally {
			setDismissingVersion(null);
		}
	};

	const handleViewSql = async (row: MigrationRow) => {
		if (!row.fileName) return;
		setSqlView({
			version: row.version,
			fileName: row.fileName,
			sql: null,
			loading: true,
		});
		try {
			const { errors, pixelReturn } = await configStore.runPixel<
				[string]
			>(
				`GetEngineMigrationFile(engine=["${active.id}"], version=["${row.version}"]);`,
			);
			if (errors.length > 0) throw new Error(errors.join(""));
			setSqlView({
				version: row.version,
				fileName: row.fileName,
				sql: pixelReturn[0]?.output ?? "",
				loading: false,
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to load file");
			setSqlView(null);
		}
	};

	if (
		listMigrations.status === "LOADING" ||
		listMigrations.status === "INITIAL"
	) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<Spinner className="size-8" />
				<Muted>Loading migrations</Muted>
			</div>
		);
	}

	if (listMigrations.status === "ERROR") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
				<Muted>
					{listMigrations.error?.message ??
						"Failed to load migrations"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-col gap-4 px-6 py-4">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="font-semibold text-lg">Migrations</h4>
					<Muted>
						Versioned SQL files run automatically the next time this
						engine is opened. Use "New Migration" to create the next
						version — the file and folder are created here, not by
						hand.
					</Muted>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => listMigrations.refresh()}
						data-testid="engineMigrations-refresh-btn"
					>
						<RefreshCw className="size-3.5" />
						Refresh
					</Button>
					{canEdit ? (
						<Button
							onClick={() => setShowNewMigration(true)}
							data-testid="engineMigrations-new-btn"
						>
							<Plus className="size-3.5" />
							New Migration
						</Button>
					) : null}
				</div>
			</div>

			{rows.length > 0 && <MigrationsSummary rows={rows} />}

			{rows.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border p-12 text-center">
					<FileText className="size-8 text-muted-foreground/40" />
					<div className="flex flex-col gap-1">
						<span className="font-medium text-sm">
							No migrations yet
						</span>
						<Muted className="max-w-xs text-sm">
							Use "New Migration" to write the first versioned SQL
							file. SEMOSS manages the folder and naming — nothing
							to set up by hand.
						</Muted>
					</div>
					{canEdit ? (
						<Button
							size="sm"
							onClick={() => setShowNewMigration(true)}
						>
							<Plus className="size-3.5" />
							New Migration
						</Button>
					) : null}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Version</TableHead>
							<TableHead>File</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>State</TableHead>
							<TableHead>Applied By</TableHead>
							<TableHead>Applied On</TableHead>
							<TableHead>Execution Time</TableHead>
							<TableHead>Details</TableHead>
							{canEdit ? <TableHead /> : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => {
							const isDismissable =
								row.state === "MISSING" ||
								row.state === "FAILED";
							return (
								<TableRow key={row.version}>
									<TableCell className="font-medium">
										{row.version}
									</TableCell>
									<TableCell>
										{row.fileName ? (
											<button
												type="button"
												onClick={() =>
													handleViewSql(row)
												}
												className="flex items-center gap-1.5 font-mono text-primary text-xs transition-colors hover:underline"
												title="View SQL"
												aria-label={`View SQL for ${row.fileName}`}
											>
												<Eye className="size-3 shrink-0" />
												{row.fileName}
											</button>
										) : (
											<span className="text-muted-foreground text-xs">
												—
											</span>
										)}
									</TableCell>
									<TableCell className="max-w-sm text-sm">
										{row.description ?? (
											<span className="text-muted-foreground">
												—
											</span>
										)}
									</TableCell>
									<TableCell>
										<MigrationStateBadge
											state={row.state}
										/>
									</TableCell>
									<TableCell>
										{row.appliedBy ?? "—"}
									</TableCell>
									<TableCell>
										{formatDate(row.appliedOn)}
									</TableCell>
									<TableCell>
										{formatExecutionTime(
											row.executionTimeMs,
										)}
									</TableCell>
									<TableCell className="max-w-xs truncate text-muted-foreground text-xs">
										{row.errorMessage ?? "—"}
									</TableCell>
									{canEdit ? (
										<TableCell>
											{isDismissable ? (
												<button
													type="button"
													onClick={() =>
														handleDismiss(
															row.version,
														)
													}
													disabled={
														dismissingVersion ===
														row.version
													}
													className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-destructive disabled:opacity-50"
													title="Dismiss record"
													aria-label={`Dismiss migration record for version ${row.version}`}
												>
													{dismissingVersion ===
													row.version ? (
														<Spinner className="size-3" />
													) : (
														<Trash2 className="size-3" />
													)}
												</button>
											) : null}
										</TableCell>
									) : null}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}

			{canEdit ? (
				<NewMigrationDialog
					open={showNewMigration}
					nextVersion={nextVersion}
					onClose={(didSave) => {
						setShowNewMigration(false);
						if (didSave) listMigrations.refresh();
					}}
				/>
			) : null}

			{sqlView ? (
				<Dialog open onOpenChange={() => setSqlView(null)}>
					<DialogContent className="sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle className="font-mono font-normal text-sm">
								{sqlView.fileName}
							</DialogTitle>
						</DialogHeader>
						{sqlView.loading ? (
							<div className="flex items-center justify-center p-8">
								<Spinner className="size-5" />
							</div>
						) : (
							<pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted p-4 font-mono text-xs">
								{sqlView.sql}
							</pre>
						)}
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setSqlView(null)}
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
};
