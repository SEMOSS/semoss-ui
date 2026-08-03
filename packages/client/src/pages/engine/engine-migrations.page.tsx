import { Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Muted,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import {
	type MigrationRow,
	MigrationStateBadge,
	MigrationsSummary,
	NewMigrationDialog,
} from "@/components/engine";
import { useEngine } from "@/hooks";

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

/** Formats a migration's execution time for display, in ms below 1s and seconds above. */
function formatExecutionTime(ms: number | null): string {
	if (ms === null || ms === undefined) {
		return "—";
	}
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
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
									<MigrationStateBadge state={row.state} />
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

			{canEdit ? (
				<NewMigrationDialog
					open={showNewMigration}
					onClose={(didSave) => {
						setShowNewMigration(false);
						if (didSave) {
							listMigrations.refresh();
						}
					}}
				/>
			) : null}
		</div>
	);
};
