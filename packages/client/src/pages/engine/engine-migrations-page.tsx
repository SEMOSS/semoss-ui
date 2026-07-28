import { Plus, RefreshCw } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Muted,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useEngine, usePixel, useRootStore } from "@/hooks";

/** Mirrors `MigrationStatus.State` on the Java side (see `ListEngineMigrationsReactor`). */
type MigrationState = "PENDING" | "SUCCESS" | "FAILED" | "MISSING" | "OUTDATED";

interface MigrationRow {
	version: string;
	description: string | null;
	fileName: string | null;
	state: MigrationState;
	appliedBy: string | null;
	appliedOn: string | null;
	executionTimeMs: number | null;
	errorMessage: string | null;
}

/**
 * Formats a backend timestamp string for display, falling back to the raw
 * value if it isn't a parseable date (e.g. already-formatted output).
 */
function formatDate(dateStr: string | null): string {
	if (!dateStr) {
		return "—";
	}
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
}

/**
 * Renders the migration state as a color-coded badge -- mirrors the state
 * meanings Flyway's `info` command reports (Pending / Success / Failed /
 * Missing / Outdated).
 */
function StateBadge({ state }: { state: MigrationState }) {
	switch (state) {
		case "SUCCESS":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
					Success
				</Badge>
			);
		case "FAILED":
			return (
				<Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					Failed
				</Badge>
			);
		case "OUTDATED":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					Outdated
				</Badge>
			);
		case "MISSING":
			return (
				<Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
					Missing
				</Badge>
			);
		default:
			return <Badge variant="outline">Pending</Badge>;
	}
}

function formatExecutionTime(ms: number | null): string {
	if (ms === null || ms === undefined) {
		return "—";
	}
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

interface SaveMigrationResult {
	version: string;
	success: boolean;
	errorMessage: string | null;
}

/**
 * Dialog for creating the next migration version -- writes the
 * `V<version>__<description>.sql` file under the engine's own
 * `assets/migrations` folder server-side (never hand-created on disk) and
 * immediately runs it via {@code SaveEngineMigration}.
 */
function NewMigrationDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: (didSave: boolean) => void;
}) {
	const { active } = useEngine();
	const { configStore } = useRootStore();

	const descriptionId = useId();
	const sqlId = useId();
	const [description, setDescription] = useState("");
	const [sqlContent, setSqlContent] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const reset = () => {
		setDescription("");
		setSqlContent("");
	};

	const handleSave = async () => {
		if (!description.trim() || !sqlContent.trim()) {
			toast.error("Description and SQL content are both required");
			return;
		}

		setSubmitting(true);
		try {
			const { errors, pixelReturn } = await configStore.runPixel<
				[SaveMigrationResult]
			>(
				`SaveEngineMigration(engine=["${active.id}"], sql=[${JSON.stringify(sqlContent)}], description=[${JSON.stringify(description)}]);`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			const result = pixelReturn[0]?.output;
			if (result && !result.success) {
				throw new Error(
					result.errorMessage ?? "Migration failed to run",
				);
			}

			toast.success(`Migration V${result?.version} applied successfully`);
			reset();
			onClose(true);
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to save migration",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					reset();
					onClose(false);
				}
			}}
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>New Migration</DialogTitle>
					<DialogDescription>
						Creates the next versioned SQL file under this engine's
						own migrations folder and runs it immediately.
					</DialogDescription>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={descriptionId}>
							Description
						</FieldLabel>
						<Input
							id={descriptionId}
							placeholder="add_status_column"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor={sqlId}>SQL</FieldLabel>
						<Textarea
							id={sqlId}
							className="min-h-48 font-mono text-sm"
							placeholder="ALTER TABLE ORDERS ADD COLUMN STATUS VARCHAR(50);"
							value={sqlContent}
							onChange={(e) => setSqlContent(e.target.value)}
						/>
					</Field>
				</FieldGroup>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							reset();
							onClose(false);
						}}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={submitting}
						data-testid="engineMigrations-save-btn"
					>
						{submitting ? <Spinner className="size-3.5" /> : null}
						Save & Run
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Mirrors `MigrationFileUtils.compareVersions` on the Java side -- numeric, segment-by-segment (e.g. `2` < `2.1` < `10`). */
function compareVersions(left: string, right: string): number {
	const leftParts = left.split(".").map(Number);
	const rightParts = right.split(".").map(Number);
	const maxLength = Math.max(leftParts.length, rightParts.length);
	for (let i = 0; i < maxLength; i++) {
		const l = leftParts[i] ?? 0;
		const r = rightParts[i] ?? 0;
		if (l !== r) {
			return l - r;
		}
	}
	return 0;
}

/**
 * Mirrors the summary Flyway's `info` command prints above its table --
 * current schema version (highest successfully-applied migration) plus
 * counts by state.
 */
function MigrationsSummary({ rows }: { rows: MigrationRow[] }) {
	const currentVersion = rows
		.filter((r) => r.state === "SUCCESS" || r.state === "OUTDATED")
		.map((r) => r.version)
		.sort(compareVersions)
		.at(-1);

	const counts = rows.reduce<Record<MigrationState, number>>(
		(acc, row) => {
			acc[row.state] += 1;
			return acc;
		},
		{ PENDING: 0, SUCCESS: 0, FAILED: 0, MISSING: 0, OUTDATED: 0 },
	);

	const stats: { label: string; value: number | string }[] = [
		{ label: "Current Version", value: currentVersion ?? "—" },
		{ label: "Applied", value: counts.SUCCESS },
		{ label: "Pending", value: counts.PENDING },
		{ label: "Failed", value: counts.FAILED },
		{ label: "Outdated", value: counts.OUTDATED },
		{ label: "Missing", value: counts.MISSING },
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="flex flex-col gap-0.5 rounded-md border border-border p-3"
				>
					<Muted className="text-xs">{stat.label}</Muted>
					<span className="font-semibold text-lg">{stat.value}</span>
				</div>
			))}
		</div>
	);
}

/**
 * Status board for an engine's database migrations -- merges the
 * `V<version>__<description>.sql` files under the engine's own
 * `assets/migrations` folder with `SEMOSS_SCHEMA_HISTORY` run outcomes.
 * Migrations run automatically the next time the engine is opened
 * (`ENABLE_MIGRATIONS=true` on the engine's smss); the "New Migration" action
 * is the only way a migration file gets created -- SEMOSS owns the folder and
 * file naming, not a person editing the filesystem directly.
 */
export const EngineMigrationsPage = () => {
	const { active } = useEngine();
	const [showNewMigration, setShowNewMigration] = useState(false);

	const listMigrations = usePixel<MigrationRow[]>(
		`ListEngineMigrations(engine=["${active.id}"]);`,
	);

	const rows = useMemo(
		() => listMigrations.data ?? [],
		[listMigrations.data],
	);

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
						version -- the file and folder are created here, not by
						hand.
					</Muted>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => listMigrations.refresh()}
						className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
						data-testid="engineMigrations-refresh-btn"
					>
						<RefreshCw className="size-3.5" />
						Refresh
					</button>
					<Button
						onClick={() => setShowNewMigration(true)}
						data-testid="engineMigrations-new-btn"
					>
						<Plus className="size-3.5" />
						New Migration
					</Button>
				</div>
			</div>

			{rows.length > 0 && <MigrationsSummary rows={rows} />}

			{rows.length === 0 ? (
				<div className="flex items-center justify-center rounded-md border border-border p-8">
					<Muted>No migrations found for this engine</Muted>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Version</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>File</TableHead>
							<TableHead>State</TableHead>
							<TableHead>Applied By</TableHead>
							<TableHead>Applied On</TableHead>
							<TableHead>Execution Time</TableHead>
							<TableHead>Notes</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.version}>
								<TableCell className="font-medium">
									{row.version}
								</TableCell>
								<TableCell>{row.description ?? "—"}</TableCell>
								<TableCell className="font-mono text-muted-foreground text-xs">
									{row.fileName ?? "—"}
								</TableCell>
								<TableCell>
									<StateBadge state={row.state} />
								</TableCell>
								<TableCell>{row.appliedBy ?? "—"}</TableCell>
								<TableCell>
									{formatDate(row.appliedOn)}
								</TableCell>
								<TableCell>
									{formatExecutionTime(row.executionTimeMs)}
								</TableCell>
								<TableCell className="max-w-xs truncate text-muted-foreground text-sm">
									{row.errorMessage ?? "—"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<NewMigrationDialog
				open={showNewMigration}
				onClose={(didSave) => {
					setShowNewMigration(false);
					if (didSave) {
						listMigrations.refresh();
					}
				}}
			/>
		</div>
	);
};
