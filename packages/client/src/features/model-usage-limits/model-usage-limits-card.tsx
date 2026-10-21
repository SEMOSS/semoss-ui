import { Gauge } from "lucide-react";
import { useState } from "react";
import { type ModelUsageLimit, savePermissionBatches } from "@semoss/sdk";
import {
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
} from "@semoss/shared";
import { Alert, AlertDescription, Button, P, toast } from "@semoss/ui/next";
import type { ModelLimitCategory } from "@/features/bulk-access-management/permission-batch";
import { UsageLimitDialog } from "@/features/bulk-access-management/usage-limit-dialog";
import { UsageLimitEditButton } from "@/features/bulk-access-management/usage-limit-edit-button";
import { UsageLimitSummary } from "@/features/bulk-access-management/usage-limit-summary";
import {
	MODEL_LIMIT_NAMES,
	MODEL_TOTAL_DESCRIPTION,
	PUBLIC_USE_DESCRIPTION,
	PUBLIC_USE_NOT_PUBLIC_DESCRIPTION,
	toModelLimitBatch,
} from "./model-usage-limits";
import { useModelUsageLimits } from "./use-model-usage-limits";

/** What each row says about its limit, under its name */
const ROW_HINTS: Readonly<Record<ModelLimitCategory, string>> = {
	MODEL: "Every call to this model, by anyone, counts toward it.",
	PUBLIC: "Everyone with no limit from their own grant or a team.",
};

export interface ModelUsageLimitsCardProps {
	/** The model */
	engineId: string;
	/** Whether to read and save in admin mode */
	admin?: boolean;
}

/**
 * A model's total and its public use limit on the model's Access Control tab,
 * each with its summary. The model's owners, and admins in admin mode, open
 * either one and save it at once, as one permission batch; everyone else sees
 * them with the reason they cannot change them.
 */
export const ModelUsageLimitsCard = ({
	engineId,
	admin = false,
}: ModelUsageLimitsCardProps) => {
	const limits = useModelUsageLimits(engineId, admin);
	const [editing, setEditing] = useState<ModelLimitCategory | null>(null);
	const [dialogKey, setDialogKey] = useState(0);
	const isPublic = limits.publicUse?.isPublic ?? false;

	const limitOf = (category: ModelLimitCategory): ModelUsageLimit | null =>
		(category === "MODEL"
			? limits.modelTotal?.usageLimit
			: limits.publicUse?.usageLimit) ?? null;

	const handleOpen = (category: ModelLimitCategory) => {
		setDialogKey((key) => key + 1);
		setEditing(category);
	};

	const handleSave = async (usageLimit: ModelUsageLimit | null) => {
		if (!editing) {
			return;
		}
		// a refused change rejects, and the dialog shows the backend's reason
		await savePermissionBatches(
			[toModelLimitBatch(engineId, editing, usageLimit)],
			admin,
		);
		const name = editing === "MODEL" ? "model total" : "public use limit";
		setEditing(null);
		toast.success(`The ${name} was saved`);
		limits.refresh();
	};

	const isRead = limits.modelTotal !== null && limits.publicUse !== null;

	return (
		<div className="flex w-full items-start gap-3 rounded-md border border-border p-4">
			<Gauge
				className="mt-0.5 size-4 shrink-0 text-muted-foreground"
				aria-hidden
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-3">
				<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<span className="font-medium text-sm">
							Model Usage Limits
						</span>
						<P className="text-muted-foreground text-sm">
							Caps on the whole model, on top of each person's and
							team's own limit. Every rule in a limit applies: a
							call must be within all of them.
						</P>
					</div>
					<UsageLimitGuideButton
						className="-mt-1 shrink-0"
						viewer={{
							canSetModelLimits: limits.canChangeModelLimits,
							isAdminMode: admin,
						}}
					/>
				</div>
				{limits.error !== null ? (
					<Alert variant="destructive">
						<AlertDescription className="flex flex-wrap items-center gap-2">
							The limits could not be read. {limits.error}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={limits.refresh}
							>
								Try Again
							</Button>
						</AlertDescription>
					</Alert>
				) : (
					// side by side on wide screens, each limit's name beside its rules
					<dl className="grid divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
						{(["MODEL", "PUBLIC"] as const).map((category) => {
							const source =
								category === "MODEL" ? "MODEL_TOTAL" : "PUBLIC";
							const limit = limitOf(category);
							const summary = (
								<UsageLimitSummary
									limit={limit}
									isChanged={false}
									source={source}
								/>
							);
							return (
								<div
									key={category}
									className="grid gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-center xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] xl:px-6 xl:py-0 xl:last:pe-0 xl:first:ps-0"
								>
									<dt className="flex flex-col gap-0.5">
										<span className="text-sm">
											{MODEL_LIMIT_NAMES[category]}
										</span>
										<span className="text-muted-foreground text-xs">
											{category === "PUBLIC" &&
											!isPublic &&
											isRead
												? PUBLIC_USE_NOT_PUBLIC_DESCRIPTION
												: ROW_HINTS[category]}
										</span>
									</dt>
									<dd className="text-sm">
										{!isRead ? (
											<span className="text-muted-foreground">
												{limits.isLoading
													? "Loading..."
													: "Unknown"}
											</span>
										) : limits.canChangeModelLimits ? (
											<UsageLimitEditButton
												context={
													MODEL_LIMIT_NAMES[category]
												}
												// the summary lines up with the names above and below it
												className="-ms-2 max-w-none"
												onClick={() =>
													handleOpen(category)
												}
											>
												{summary}
											</UsageLimitEditButton>
										) : (
											summary
										)}
									</dd>
								</div>
							);
						})}
					</dl>
				)}
				{isRead && !limits.canChangeModelLimits ? (
					<P className="text-muted-foreground text-xs">
						{OWNERS_ONLY_LIMIT_REASON}.
					</P>
				) : null}
			</div>
			{editing ? (
				<UsageLimitDialog
					// a new key per open starts from the limit saved now, with no problems shown
					key={dialogKey}
					open
					title={
						editing === "MODEL" ? "Model Total" : "Public Use Limit"
					}
					description={
						editing === "MODEL"
							? MODEL_TOTAL_DESCRIPTION
							: isPublic
								? PUBLIC_USE_DESCRIPTION
								: PUBLIC_USE_NOT_PUBLIC_DESCRIPTION
					}
					source={editing === "MODEL" ? "MODEL_TOTAL" : "PUBLIC"}
					defaultValue={limitOf(editing)}
					isCostAvailable={limits.costLimitsAvailable}
					saveLabel="Save Limit"
					onSave={handleSave}
					onClose={() => setEditing(null)}
				/>
			) : null}
		</div>
	);
};
