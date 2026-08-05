import { Muted } from "@semoss/ui/next";
import { compareVersions, type MigrationRow } from "./engine-migrations.types";

export type { MigrationRow };
export { compareVersions };

interface MigrationsSummaryProps {
	/** Migration rows to summarize. */
	rows: MigrationRow[];
}

/**
 * Mirrors the summary Flyway's `info` command prints above its table --
 * current schema version (highest successfully-applied migration) plus
 * counts by state.
 */
export function MigrationsSummary({ rows }: MigrationsSummaryProps) {
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
