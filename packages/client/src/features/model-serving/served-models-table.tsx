import { TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import {
	Badge,
	Button,
	InlineCode,
	Muted,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { ServedModel } from "@/api/model-serving";
import { MissingServedModelRow } from "./missing-served-model-row";
import {
	describeLastAction,
	SERVED_MODEL_FAILURE_LABELS,
	servingLabel,
} from "./model-serving-labels";
import { ServedModelEnginesCell } from "./served-model-engines-cell";
import { ServedModelProgress } from "./served-model-progress";
import {
	type ServedModelRowAction,
	ServedModelRowActions,
} from "./served-model-row-actions";
import { ServedModelStateBadge } from "./served-model-state-badge";
import { ServedModelTime } from "./served-model-time";
import type { ServedModelChange } from "./use-served-model-actions";
import type {
	MissingServedModel,
	ServedModelEngineGroup,
} from "./use-served-model-engines";

export interface ServedModelsTableProps {
	models: ServedModel[];
	/** The change under way for each model, by name */
	busy: Readonly<Record<string, ServedModelChange>>;
	/** Each model's engines */
	enginesOf: (servedModel: string) => ServedModelEngineGroup;
	/** The engines are not read yet, or could not be */
	areEnginesUnknown: boolean;
	/** The models gone from the cluster that engines are still linked to */
	missing?: readonly MissingServedModel[];
	onAction: (action: ServedModelRowAction, model: ServedModel) => void;
	/** Opens the definition form for a missing model */
	onDefineAgain?: (missing: MissingServedModel) => void;
}

/** The served models, one row each, with their state and their actions. */
export function ServedModelsTable({
	models,
	busy,
	enginesOf,
	areEnginesUnknown,
	missing = [],
	onAction,
	onDefineAgain = () => undefined,
}: ServedModelsTableProps): ReactElement {
	return (
		<Table>
			<TableCaption className="sr-only">
				Served models, with their state, endpoint, engines and actions
			</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Model</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Endpoint</TableHead>
					<TableHead>Engines</TableHead>
					<TableHead>Last Change</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{models.map((model) => (
					<TableRow key={model.servedModel} className="align-top">
						<TableCell className="max-w-64 whitespace-normal">
							<div className="flex min-w-0 flex-col items-start gap-1">
								<Button
									variant="link"
									className="h-auto p-0 text-foreground"
									onClick={() => onAction("details", model)}
								>
									{model.servedModel}
								</Button>
								{model.displayName || model.catalogEntry ? (
									<Muted className="break-all text-xs">
										{model.displayName ??
											model.catalogEntry}
									</Muted>
								) : null}
								{model.managed ? null : (
									<Badge variant="secondary">
										Defined outside SEMOSS
									</Badge>
								)}
							</div>
						</TableCell>
						<TableCell className="min-w-56 max-w-80 whitespace-normal">
							<div className="flex min-w-0 flex-col items-start gap-1.5">
								<ServedModelStateBadge state={model.state} />
								{model.state === "STARTING" ? (
									<div className="w-full">
										<ServedModelProgress model={model} />
									</div>
								) : null}
								{model.failure ? (
									<Muted className="text-xs">
										<span className="font-medium text-destructive">
											{servingLabel(
												SERVED_MODEL_FAILURE_LABELS,
												model.failure.cause,
											)}
										</span>
										{model.failure.hint
											? `: ${model.failure.hint}`
											: null}
									</Muted>
								) : model.state !== "STARTING" &&
									model.message ? (
									<Muted className="line-clamp-2 text-xs">
										{model.message}
									</Muted>
								) : null}
								{model.warnings.length > 0 ? (
									<Muted className="flex items-center gap-1 text-xs">
										<TriangleAlert
											className="size-3.5 text-warning"
											aria-hidden
										/>
										{model.warnings.length === 1
											? "1 warning"
											: `${model.warnings.length} warnings`}
									</Muted>
								) : null}
							</div>
						</TableCell>
						<TableCell className="max-w-72 whitespace-normal">
							{model.endpoint ? (
								<div className="flex min-w-0 flex-col items-start gap-1">
									<InlineCode className="break-all text-xs">
										{model.endpoint}
									</InlineCode>
									{model.hostPort !== null ? (
										<Muted className="text-xs">
											Published for the LAN on port{" "}
											{model.hostPort}
										</Muted>
									) : null}
								</div>
							) : (
								<Muted className="text-xs">
									{model.endpointNote ?? "None"}
								</Muted>
							)}
						</TableCell>
						<TableCell className="max-w-56 whitespace-normal">
							<ServedModelEnginesCell
								group={enginesOf(model.servedModel)}
								isUnknown={areEnginesUnknown}
							/>
						</TableCell>
						<TableCell className="whitespace-normal">
							{model.lastAction ? (
								<div className="flex flex-col gap-0.5">
									<span className="text-sm">
										{describeLastAction(model.lastAction)}
									</span>
									{model.lastAction.at ? (
										<Muted className="text-xs">
											<ServedModelTime
												value={model.lastAction.at}
											/>
										</Muted>
									) : null}
								</div>
							) : (
								<Muted className="text-xs">Not recorded</Muted>
							)}
						</TableCell>
						<TableCell>
							<ServedModelRowActions
								model={model}
								busy={busy[model.servedModel]}
								onAction={onAction}
							/>
						</TableCell>
					</TableRow>
				))}
				{missing.map((entry) => (
					<MissingServedModelRow
						key={`missing-${entry.servedModel}`}
						missing={entry}
						onDefineAgain={onDefineAgain}
					/>
				))}
			</TableBody>
		</Table>
	);
}
