import { Badge } from "@semoss/ui/next";

/** Mirrors `MigrationStatus.State` on the Java side (see `ListEngineMigrationsReactor`). */
export type MigrationState =
	| "PENDING"
	| "SUCCESS"
	| "FAILED"
	| "MISSING"
	| "OUTDATED";

interface MigrationStateBadgeProps {
	/** State of the migration to render a badge for. */
	state: MigrationState;
}

/**
 * Renders a migration's state as a color-coded badge -- mirrors the state
 * meanings Flyway's `info` command reports (Pending / Success / Failed /
 * Missing / Outdated). Uses the shared `success`/`destructive` theme tokens
 * where they exist; `OUTDATED`/`MISSING` fall back to raw Tailwind palette
 * colors since no semantic "warning" token is defined yet in `globals.css`.
 */
export function MigrationStateBadge({ state }: MigrationStateBadgeProps) {
	switch (state) {
		case "SUCCESS":
			return (
				<Badge
					variant="outline"
					className="border-success/30 bg-success/10 text-success"
				>
					Success
				</Badge>
			);
		case "FAILED":
			return <Badge variant="destructive">Failed</Badge>;
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
