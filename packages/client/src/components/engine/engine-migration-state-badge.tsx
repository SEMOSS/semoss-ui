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
 * Missing / Outdated). Uses the shared semantic tokens from `globals.css`.
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
				<Badge className="border border-warning/30 bg-warning/10 text-warning">
					Outdated
				</Badge>
			);
		case "MISSING":
			return (
				<Badge className="border border-warning/30 bg-warning/10 text-warning">
					Missing
				</Badge>
			);
		default:
			return <Badge variant="outline">Pending</Badge>;
	}
}
