import type { ModelUsageLimit } from "@semoss/sdk";
import { ModelUsageLimitRules } from "@semoss/shared";
import { TableCell, TableRow } from "@semoss/ui/next";
import { AccessIdentity } from "@/features/bulk-access-management/access-identity";

export interface ModelLimitRowProps {
	/** The model total, a ceiling on every call, or the public use limit */
	limitType: "MODEL_TOTAL" | "PUBLIC";
	/** Its limit, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
	/** For the public use limit, whether the model is public, so it applies */
	isPublic?: boolean;
	/** Whether the table has a last column for each person's limits */
	hasActionsColumn?: boolean;
}

/**
 * The model total or the public use limit, as one row at the top of the
 * Effective Permissions table: the model total caps every call, whatever it is
 * billed to; the public use limit applies, while the model is public, to
 * everyone with no limit defined anywhere more specific.
 */
export const ModelLimitRow = ({
	limitType,
	usageLimit,
	isPublic = false,
	hasActionsColumn = false,
}: ModelLimitRowProps) => {
	const isTotal = limitType === "MODEL_TOTAL";

	return (
		<TableRow className="bg-muted/30">
			<TableCell className="pl-6">
				<AccessIdentity
					category={isTotal ? "MODEL" : "PUBLIC"}
					type=""
					name={isTotal ? "Model Total" : "Public Use Limit"}
				/>
			</TableCell>
			<TableCell className="text-muted-foreground text-sm">-</TableCell>
			<TableCell className="text-sm">
				{isTotal ? "Everyone Together" : isPublic ? "Everyone" : "-"}
			</TableCell>
			<TableCell className="min-w-40 whitespace-normal text-muted-foreground text-sm">
				{isTotal
					? "A ceiling on every call to this model"
					: isPublic
						? "This model is public"
						: "Applies while this model is public"}
			</TableCell>
			<TableCell className="min-w-40 whitespace-normal text-sm">
				{isTotal ? (
					<span className="text-muted-foreground">
						Always Checked
					</span>
				) : (
					"Public Use Limit"
				)}
			</TableCell>
			<TableCell className="min-w-52 whitespace-normal text-sm">
				<ModelUsageLimitRules
					limit={usageLimit}
					source={isTotal ? "MODEL_TOTAL" : "PUBLIC"}
				/>
			</TableCell>
			{hasActionsColumn ? <TableCell /> : null}
		</TableRow>
	);
};
