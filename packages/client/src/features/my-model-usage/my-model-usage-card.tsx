import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { UsageLimitGuideButton } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { UsageLimitPathSheet } from "@/features/usage-limit-path/usage-limit-path-sheet";
import { summarizeMyModelUsage } from "./my-model-usage";
import { MyModelUsageRow } from "./my-model-usage-row";
import { useMyModelUsage } from "./use-my-model-usage";

/** The model whose details are open */
interface OpenModel {
	/** The model */
	engineId: string;
	/** Its name */
	name: string;
}

/**
 * My Profile's Model Usage: every model the signed in person can use, the most
 * urgent first, each with the limit their calls stop at, its most used rule and
 * where they stand. Opening a model shows the same details as Your Usage
 * Limit. Models with no limit are listed only on request, so the
 * dashboard stays short.
 */
export const MyModelUsageCard = () => {
	const { models, isLoading, error, refresh } = useMyModelUsage();
	const [isNoLimitShown, setIsNoLimitShown] = useState(false);
	// the model last opened stays while the sheet closes, so its title does not
	// change during the animation; isOpen opens and closes it
	const [open, setOpen] = useState<OpenModel | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const summaries = models ? summarizeMyModelUsage(models) : [];
	const limited = summaries.filter((model) => model.standing !== "NO_LIMIT");
	const noLimitCount = summaries.length - limited.length;
	const shown = isNoLimitShown ? summaries : limited;
	const usedUpCount = summaries.filter(
		(model) => model.standing === "USED_UP",
	).length;
	const almostCount = summaries.filter(
		(model) => model.standing === "ALMOST_REACHED",
	).length;

	return (
		<div className="rounded-lg border bg-card px-6 py-5">
			<div className="mb-4 flex flex-wrap items-start justify-between gap-2">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold text-base">Model Usage</h2>
					<p className="text-muted-foreground text-sm">
						How much of your limit you have used on each model. Open
						a model to see every limit that applies and when each
						resets.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<UsageLimitGuideButton isOwnView={true} />
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isLoading}
						onClick={refresh}
					>
						<RefreshCw className="size-4" aria-hidden />
						Refresh
					</Button>
				</div>
			</div>
			{error ? (
				<Alert variant="destructive" className="mb-3">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			{models === null ? (
				isLoading ? (
					<output className="flex items-center gap-2 text-muted-foreground text-sm">
						{/* the output announces the text, so the spinner is not a second status */}
						<Spinner className="size-4" aria-hidden />
						Reading your model usage...
					</output>
				) : null
			) : summaries.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					You do not have access to any models yet.
				</p>
			) : (
				<div className="flex flex-col gap-3">
					{usedUpCount > 0 || almostCount > 0 ? (
						<p className="text-sm">
							{[
								usedUpCount > 0
									? `${usedUpCount} ${usedUpCount === 1 ? "model is" : "models are"} used up`
									: null,
								almostCount > 0
									? `${almostCount} ${almostCount === 1 ? "model is" : "models are"} almost reached`
									: null,
							]
								.filter(Boolean)
								.join(", and ")}
							.
						</p>
					) : null}
					{shown.length > 0 ? (
						<div className="overflow-x-auto rounded-md border border-border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Model</TableHead>
										<TableHead>Limit Applied By</TableHead>
										<TableHead>Most Used</TableHead>
										<TableHead>Standing</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{shown.map((model) => (
										<MyModelUsageRow
											key={model.engineId}
											model={model}
											onOpen={() => {
												setOpen({
													engineId: model.engineId,
													name: model.name,
												});
												setIsOpen(true);
											}}
										/>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							No limit applies to you on any of your models.
						</p>
					)}
					{noLimitCount > 0 ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="self-start"
							aria-expanded={isNoLimitShown}
							onClick={() =>
								setIsNoLimitShown((isShown) => !isShown)
							}
						>
							{isNoLimitShown
								? "Hide Models With No Limit"
								: `Show ${noLimitCount} ${noLimitCount === 1 ? "Model" : "Models"} With No Limit`}
						</Button>
					) : null}
				</div>
			)}
			<UsageLimitPathSheet
				request={open && isOpen ? { engineId: open.engineId } : null}
				title={
					open
						? `Your Usage Limit on ${open.name}`
						: "Your Usage Limit"
				}
				description="Every limit that applies to your calls to this model, and the one they stop at."
				onClose={() => setIsOpen(false)}
			/>
		</div>
	);
};
