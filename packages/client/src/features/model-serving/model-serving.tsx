import { Plus, RefreshCw, TriangleAlert } from "lucide-react";
import { type ReactElement, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Muted,
	P,
	Skeleton,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { getErrorMessage } from "@semoss/utility/error";
import type {
	ServedModel,
	ServedModelEngine,
	ServedModelEngineLink,
} from "@/api/model-serving";
import { CreateServedModelEngineDialog } from "./create-served-model-engine-dialog";
import { DefineServedModelDialog } from "./define-served-model-dialog";
import { LinkServedModelEngineDialog } from "./link-served-model-engine-dialog";
import {
	SERVED_MODEL_STATE_LABELS,
	servingLabel,
} from "./model-serving-labels";
import { ServedModelChangeDialog } from "./served-model-change-dialog";
import {
	ServedModelDetailsSheet,
	type ServedModelSheetTab,
} from "./served-model-details-sheet";
import type { ServedModelRowAction } from "./served-model-row-actions";
import { ServedModelsTable } from "./served-models-table";
import { ServingCapacitySummary } from "./serving-capacity-summary";
import { ServingCatalogTable } from "./serving-catalog-table";
import { ServingGpuCard } from "./serving-gpu-card";
import { useServedModelActions } from "./use-served-model-actions";
import {
	findMissingModels,
	groupEngines,
	type MissingServedModel,
	useServedModelEngines,
} from "./use-served-model-engines";
import { useServedModels } from "./use-served-models";
import { useServingCatalog } from "./use-serving-catalog";

/** The page's two views */
type ModelServingView = "models" | "catalog";

const isView = (value: string): value is ModelServingView =>
	value === "models" || value === "catalog";

/** "1 ready, 2 stopped": how many models are in each state, for screen readers. */
function summarizeStates(models: readonly ServedModel[]): string {
	const counts = new Map<string, number>();
	for (const model of models) {
		counts.set(model.state, (counts.get(model.state) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(
			([state, count]) =>
				`${count} ${servingLabel(SERVED_MODEL_STATE_LABELS, state).toLowerCase()}`,
		)
		.join(", ");
}

/**
 * Model Serving: the models SEMOSS serves on KServe, with the GPU and memory
 * they share, their state and actions, and the catalog of models admins
 * approved for serving. Admins only, like the reactors behind it.
 */
export function ModelServing(): ReactElement {
	const navigate = useNavigate();
	const {
		list,
		capacity,
		capacityError,
		error,
		isLoading,
		isReading,
		updatedAt,
		refresh,
	} = useServedModels();
	const catalog = useServingCatalog();
	const engines = useServedModelEngines();
	const actions = useServedModelActions(capacity, refresh);
	const [view, setView] = useState<ModelServingView>("models");
	// each form opens fresh (a new key); the dialogs and the sheet keep what
	// they show while they close, so their words do not change mid-animation
	const [define, setDefine] = useState<{
		key: number;
		entry: string | null;
		/** A missing model's name, to define it again under it */
		name: string | null;
		linked: ServedModelEngineLink[];
		open: boolean;
	}>({ key: 0, entry: null, name: null, linked: [], open: false });
	const [engine, setEngine] = useState<{
		key: number;
		model: ServedModel | null;
		open: boolean;
	}>({ key: 0, model: null, open: false });
	const [linking, setLinking] = useState<{
		key: number;
		model: ServedModel | null;
		open: boolean;
	}>({ key: 0, model: null, open: false });
	const [sheet, setSheet] = useState<{
		model: ServedModel | null;
		open: boolean;
		tab: ServedModelSheetTab;
	}>({ model: null, open: false, tab: "status" });

	const models = list?.servedModels ?? [];
	const existingNames = useMemo(
		() => (list?.servedModels ?? []).map((model) => model.servedModel),
		[list],
	);

	const enginesOf = (servedModel: string | undefined) =>
		groupEngines(engines.list, servedModel ?? "");
	// engines linked to a model the cluster no longer has, such as one deleted with kubectl
	const missing = findMissingModels(
		engines.list,
		list ? existingNames : null,
	);

	const openCreateEngine = (model: ServedModel): void => {
		setEngine((previous) => ({ key: previous.key + 1, model, open: true }));
	};

	/** Link an engine from the sheet's list, where a refusal is a toast. */
	const linkFromSheet = (link: ServedModelEngineLink): void => {
		const servedModel = sheet.model?.servedModel;
		if (!servedModel) {
			return;
		}
		engines.link(servedModel, link).catch((cause: unknown) => {
			toast.error(
				getErrorMessage(
					cause,
					`${link.engineName} could not be linked.`,
				),
			);
		});
	};

	const openDefine = (entry: string | null): void => {
		setDefine((previous) => ({
			key: previous.key + 1,
			entry,
			name: null,
			linked: [],
			open: true,
		}));
	};

	const defineAgain = (gone: MissingServedModel): void => {
		setDefine((previous) => ({
			key: previous.key + 1,
			entry: null,
			name: gone.servedModel,
			linked: gone.engines,
			open: true,
		}));
	};

	const handleDefined = (servedModel?: string): void => {
		setDefine((previous) => ({ ...previous, open: false }));
		if (servedModel) {
			setView("models");
			refresh();
			// the definition may have created an engine for it
			engines.refresh();
		}
	};

	const handleEngineCreated = (created?: ServedModelEngine): void => {
		setEngine((previous) => ({ ...previous, open: false }));
		if (created) {
			engines.refresh();
			toast.success(`Created the engine ${created.name ?? created.id}.`, {
				action: {
					label: "Open Settings",
					onClick: () =>
						navigate(
							`/settings/model/${encodeURIComponent(created.id)}`,
						),
				},
			});
		}
	};

	const handleRowAction = (
		action: ServedModelRowAction,
		model: ServedModel,
	): void => {
		switch (action) {
			case "start":
				void actions.start(model);
				return;
			case "stop":
			case "remove":
				actions.ask(action, model);
				return;
			case "details":
			case "engines":
			case "logs":
				setSheet({
					model,
					open: true,
					tab:
						action === "logs"
							? "logs"
							: action === "engines"
								? "engines"
								: "status",
				});
				return;
			case "engine":
				openCreateEngine(model);
				return;
			case "link-engine":
				setLinking((previous) => ({
					key: previous.key + 1,
					model,
					open: true,
				}));
				return;
			case "copy-endpoint":
				if (model.endpoint) {
					void copyTextToClipboard(model.endpoint, {
						onSuccess: () => toast.success("Copied the endpoint."),
						onError: (message) => toast.error(message),
					});
				}
				return;
		}
	};

	return (
		<div className="flex w-full min-w-0 flex-col gap-6 pb-8">
			<Tabs
				value={view}
				onValueChange={(next) => {
					if (isView(next)) setView(next);
				}}
				className="flex flex-col gap-4"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<TabsList>
						<TabsTrigger value="models">Models</TabsTrigger>
						<TabsTrigger value="catalog">Catalog</TabsTrigger>
					</TabsList>
					<div className="flex flex-wrap items-center gap-2">
						{updatedAt ? (
							<Muted className="text-xs">
								Updated {updatedAt.toLocaleTimeString()}
							</Muted>
						) : null}
						<Button
							variant="outline"
							onClick={() => {
								refresh();
								engines.refresh();
								if (view === "catalog") catalog.refresh();
							}}
							disabled={isReading}
						>
							{isReading ? (
								<Spinner className="size-4" />
							) : (
								<RefreshCw className="size-4" aria-hidden />
							)}
							Refresh
						</Button>
						<Button onClick={() => openDefine(null)}>
							<Plus className="size-4" aria-hidden />
							Define Model
						</Button>
					</div>
				</div>

				<TabsContent value="models" className="flex flex-col gap-6">
					<ServingCapacitySummary
						capacity={capacity}
						error={capacityError}
						isLoading={isLoading}
					/>
					<ServingGpuCard />
					{error && list ? (
						<Alert className="border-warning/40 bg-warning/10 text-warning">
							<TriangleAlert aria-hidden />
							<AlertTitle>
								Showing the models as of{" "}
								{updatedAt?.toLocaleTimeString() ??
									"the last read"}
							</AlertTitle>
							<AlertDescription className="break-words text-foreground">
								They could not be read again: {error}
							</AlertDescription>
						</Alert>
					) : null}
					{isLoading ? (
						<div className="flex flex-col gap-2">
							<output className="sr-only">
								Loading the served models...
							</output>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : !list ? (
						<Alert variant="destructive">
							<AlertTitle>
								The served models could not be read
							</AlertTitle>
							<AlertDescription className="flex flex-col items-start gap-2 break-words">
								{error ?? "The server did not return them."}
								<Button
									size="sm"
									variant="outline"
									onClick={refresh}
								>
									<RefreshCw className="size-4" aria-hidden />
									Try Again
								</Button>
							</AlertDescription>
						</Alert>
					) : models.length === 0 && missing.length === 0 ? (
						<div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-6">
							<P className="font-medium">No served models yet</P>
							<Muted className="text-sm">
								Define one from the catalog of approved models.
								It stays stopped, holding no GPU, until it is
								started.
							</Muted>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setView("catalog")}
							>
								Open the Catalog
							</Button>
						</div>
					) : (
						<>
							<output className="sr-only">
								{summarizeStates(models)}
							</output>
							<Muted className="max-w-prose text-sm">
								The models KServe has in the cluster
								{list.namespace
									? ` (namespace ${list.namespace})`
									: ""}
								, running or stopped. To free the GPU, stop a
								model rather than delete it: a model deleted
								with kubectl leaves this list, and shows as Not
								in the cluster while engines are still linked to
								it.
							</Muted>
							{engines.error ? (
								<P className="flex items-start gap-2 text-muted-foreground text-sm">
									<TriangleAlert
										className="mt-0.5 size-4 shrink-0 text-warning"
										aria-hidden
									/>
									<span>
										The models' engines could not be read:{" "}
										{engines.error}
									</span>
								</P>
							) : null}
							<ServedModelsTable
								models={models}
								busy={actions.busy}
								enginesOf={enginesOf}
								areEnginesUnknown={engines.list === null}
								missing={missing}
								onAction={handleRowAction}
								onDefineAgain={defineAgain}
							/>
						</>
					)}
				</TabsContent>

				<TabsContent value="catalog">
					<ServingCatalogTable
						catalog={catalog.catalog}
						error={catalog.error}
						isLoading={catalog.isLoading}
						models={list?.servedModels ?? null}
						onRefresh={catalog.refresh}
						onDefine={openDefine}
					/>
				</TabsContent>
			</Tabs>

			<ServedModelChangeDialog
				confirmation={actions.confirmation}
				open={actions.isAsking}
				onConfirm={actions.confirm}
				onDismiss={actions.dismiss}
			/>
			<DefineServedModelDialog
				key={define.key}
				open={define.open}
				catalog={catalog.catalog}
				catalogError={catalog.error}
				initialEntry={define.entry}
				initialName={define.name}
				linkedEngines={define.linked}
				existingNames={existingNames}
				onSubmit={handleDefined}
			/>
			<CreateServedModelEngineDialog
				key={engine.key}
				open={engine.open}
				model={engine.model}
				group={enginesOf(engine.model?.servedModel)}
				onSubmit={handleEngineCreated}
			/>
			<LinkServedModelEngineDialog
				key={`link-${linking.key}`}
				open={linking.open}
				model={linking.model}
				group={enginesOf(linking.model?.servedModel)}
				onLink={(link) =>
					engines.link(linking.model?.servedModel ?? "", link)
				}
				onSubmit={() =>
					setLinking((previous) => ({ ...previous, open: false }))
				}
			/>
			<ServedModelDetailsSheet
				model={sheet.model}
				open={sheet.open}
				tab={sheet.tab}
				engines={{
					group: enginesOf(sheet.model?.servedModel),
					isLoading: engines.isLoading,
					error: engines.error,
					busy: engines.busy,
					onLink: linkFromSheet,
					onUnlink: (link) => void engines.unlink(link),
					onCreate: () => {
						if (sheet.model) openCreateEngine(sheet.model);
					},
				}}
				onTabChange={(tab) =>
					setSheet((previous) => ({ ...previous, tab }))
				}
				onOpenChange={(open) =>
					setSheet((previous) => ({ ...previous, open }))
				}
			/>
		</div>
	);
}
