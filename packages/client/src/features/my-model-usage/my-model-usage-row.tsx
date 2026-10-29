import { ChevronRight } from "lucide-react";
import {
	describeModelUsageRule,
	getUsageSourceLabel,
	getUsedPercent,
} from "@semoss/shared";
import {
	Badge,
	Button,
	cn,
	Progress,
	TableCell,
	TableRow,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import {
	describeTightestDetail,
	type ModelUsageStanding,
	type ModelUsageSummary,
	STANDING_LABELS,
} from "./my-model-usage";

/** How each standing's badge looks */
const STANDING_CLASSES: Readonly<Record<ModelUsageStanding, string>> = {
	USED_UP: "border-destructive text-destructive",
	ALMOST_REACHED: "border-warning text-warning",
	WITHIN_LIMIT: "text-foreground",
	NOT_KNOWN: "text-muted-foreground",
	UNLIMITED: "text-muted-foreground",
	NO_LIMIT: "text-muted-foreground",
};

export interface MyModelUsageRowProps {
	/** The model's summary */
	model: ModelUsageSummary;
	/** Called to open the model's details */
	onOpen: () => void;
}

/** One model on the dashboard; its name opens the details */
export const MyModelUsageRow = ({ model, onOpen }: MyModelUsageRowProps) => {
	const { applied, tightest } = model;
	const usedPercent = tightest ? getUsedPercent(tightest.share) : 0;
	const resetsAt = tightest
		? formatLocalDateTime(
				tightest.rule.resetsAt ?? undefined,
				"MMM D [at] h:mm A",
			)
		: "";

	return (
		<TableRow>
			<TableCell className="min-w-40 whitespace-normal">
				<Button
					type="button"
					variant="link"
					className="h-auto gap-1 p-0 text-start font-medium"
					aria-label={`See every limit on ${model.name}`}
					onClick={onOpen}
				>
					{model.name}
					<ChevronRight className="size-3.5 shrink-0" aria-hidden />
				</Button>
			</TableCell>
			<TableCell className="min-w-36 whitespace-normal text-sm">
				{applied ? (
					getUsageSourceLabel(applied.limitType, applied.id)
				) : (
					<span className="text-muted-foreground">No Limit</span>
				)}
			</TableCell>
			<TableCell className="min-w-56 whitespace-normal text-sm">
				{tightest ? (
					<div className="flex flex-col gap-1">
						<span>
							{usedPercent}% of{" "}
							{describeModelUsageRule(
								tightest.rule,
								tightest.source,
							)}
						</span>
						<Progress
							value={tightest.share * 100}
							aria-label={`${usedPercent}% used`}
							className="h-1.5 w-40"
						/>
						<span className="text-muted-foreground text-xs">
							{describeTightestDetail(tightest, resetsAt)}
						</span>
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				)}
			</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={cn(STANDING_CLASSES[model.standing])}
				>
					{STANDING_LABELS[model.standing]}
				</Badge>
			</TableCell>
		</TableRow>
	);
};
