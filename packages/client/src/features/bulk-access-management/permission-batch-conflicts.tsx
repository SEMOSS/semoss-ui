import { TriangleAlert } from "lucide-react";
import type { PermissionGrant } from "@semoss/sdk";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { AccessIdentity } from "./access-identity";
import {
	type BatchConflict,
	describeModelLimit,
	getLevelLabel,
} from "./permission-batch";

/**
 * @param grant - a grant, or null for none
 * @returns a short description, such as "Editor, until Dec 31, 2026, 10,000 tokens a day"
 */
const describeGrant = (grant: PermissionGrant | null): string => {
	if (!grant) {
		return "Removed in your changes";
	}
	const endDate = formatLocalDateTime(
		grant.endDate ?? undefined,
		"MMM D, YYYY",
	);
	const limit = describeModelLimit(grant);
	// a model's people can differ only in their usage limits
	return [
		getLevelLabel(grant.level),
		endDate ? `until ${endDate}` : null,
		limit === "No limit" ? null : limit,
	]
		.filter(Boolean)
		.join(", ");
};

export interface PermissionBatchConflictsProps {
	/** The conflicts to settle */
	conflicts: BatchConflict[];
	/** Called to settle one: true takes the copied access, false keeps the batch's */
	onResolve: (key: string, useIncoming: boolean) => void;
	/** Called to settle every conflict the same way */
	onResolveAll: (useIncoming: boolean) => void;
}

/**
 * The copied people whose access differs from what the permission batch gives
 * them. The user picks, for each, the access to keep; the changes cannot be
 * reviewed while any is open.
 */
export const PermissionBatchConflicts = ({
	conflicts,
	onResolve,
	onResolveAll,
}: PermissionBatchConflictsProps) => (
	<Card className="border-warning">
		<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex flex-col gap-1.5">
				<CardTitle className="flex items-center gap-2">
					<TriangleAlert
						className="size-4 text-warning"
						aria-hidden
					/>
					Choose What to Keep ({conflicts.length})
				</CardTitle>
				<CardDescription>
					These people already have different access in your changes.
					Choose which access each one keeps before you review.
				</CardDescription>
			</div>
			<div className="flex shrink-0 flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => onResolveAll(false)}
				>
					Keep All My Changes
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => onResolveAll(true)}
				>
					Use All From Source
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
				{conflicts.map((conflict) => {
					const label =
						conflict.person.name ||
						conflict.person.email ||
						conflict.person.id;
					return (
						<li
							key={conflict.key}
							className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between"
						>
							<AccessIdentity
								kind="USER"
								type={conflict.person.type}
								name={label}
								id={conflict.person.id}
								email={conflict.person.email}
								compact
							>
								<span className="text-muted-foreground text-xs">
									In My Changes:{" "}
									{describeGrant(conflict.kept)}
								</span>
								<span className="text-muted-foreground text-xs">
									{conflict.note}:{" "}
									{describeGrant(conflict.incoming)}
								</span>
							</AccessIdentity>
							<div className="flex shrink-0 gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									aria-label={`Keep my change for ${label}`}
									onClick={() =>
										onResolve(conflict.key, false)
									}
								>
									Keep My Change
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									aria-label={`Use from source for ${label}`}
									onClick={() =>
										onResolve(conflict.key, true)
									}
								>
									Use From Source
								</Button>
							</div>
						</li>
					);
				})}
			</ul>
		</CardContent>
	</Card>
);
