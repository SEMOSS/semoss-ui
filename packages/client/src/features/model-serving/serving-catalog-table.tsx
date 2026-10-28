import { Plus, RefreshCw, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Muted,
	P,
	Skeleton,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { formatByteSize } from "@semoss/utility";
import { formatLocalDateTime } from "@semoss/utility/date";
import type {
	ServedModel,
	ServingCatalog,
	ServingCatalogEntry,
} from "@/api/model-serving";
import {
	describeStorage,
	SERVED_MODEL_STATE_LABELS,
	servingLabel,
} from "./model-serving-labels";

export interface ServingCatalogTableProps {
	catalog: ServingCatalog | null;
	error: string | null;
	isLoading: boolean;
	/** The models in the cluster, to show which entries they serve; null while unread */
	models: readonly ServedModel[] | null;
	onRefresh: () => void;
	/** Opens the definition form at an entry */
	onDefine: (catalogEntry: string) => void;
}

/** The models in the cluster that serve an entry: defined from it, or with its weights. */
function modelsServing(
	entry: ServingCatalogEntry,
	models: readonly ServedModel[],
): ServedModel[] {
	return models.filter(
		(model) =>
			model.catalogEntry === entry.id ||
			(entry.storageUri !== null &&
				model.storageUri === entry.storageUri),
	);
}

/**
 * The models admins approved for serving, with the policy's record of each
 * (licence, origin, approver), which of them the cluster serves now, and the
 * entries SEMOSS left out and why. It is the list SEMOSS may define models
 * from, not the list of models in the cluster.
 */
export function ServingCatalogTable({
	catalog,
	error,
	isLoading,
	models,
	onRefresh,
	onDefine,
}: ServingCatalogTableProps): ReactElement {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-2">
				<output className="sr-only">Loading the catalog...</output>
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}
	if (error || !catalog) {
		return (
			<Alert variant="destructive">
				<AlertTitle>The catalog could not be read</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-2 break-words">
					{error ?? "The server did not return it."}
					<Button size="sm" variant="outline" onClick={onRefresh}>
						<RefreshCw className="size-4" aria-hidden />
						Try Again
					</Button>
				</AlertDescription>
			</Alert>
		);
	}
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Muted className="max-w-prose text-sm">
					The models SEMOSS may define, as admins approved them in{" "}
					{catalog.source ?? "the serving catalog"}. It is read from
					the cluster, so a change to its file shows here once it is
					applied with kubectl apply. The models in the cluster are on
					the Models tab, whether they came from here or not.
				</Muted>
				<Button size="sm" variant="outline" onClick={onRefresh}>
					<RefreshCw className="size-4" aria-hidden />
					Refresh
				</Button>
			</div>
			{catalog.problems.length > 0 ? (
				<Alert className="border-warning/40 bg-warning/10 text-warning">
					<TriangleAlert aria-hidden />
					<AlertTitle>
						{catalog.problems.length === 1
							? "1 entry is left out"
							: `${catalog.problems.length} entries are left out`}
					</AlertTitle>
					<AlertDescription className="text-foreground">
						<ul className="list-disc pl-4">
							{catalog.problems.map((problem) => (
								<li key={problem} className="break-words">
									{problem}
								</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			) : null}
			{catalog.models.length === 0 ? (
				<div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-6">
					<P className="font-medium">No approved models yet</P>
					<Muted className="text-sm">
						Add an entry to the serving catalog, with its licence,
						origin and approver, and it shows here.
					</Muted>
				</div>
			) : (
				<Table>
					<TableCaption className="sr-only">
						Approved models, with their weights, licence and
						approval
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Model</TableHead>
							<TableHead>Weights</TableHead>
							<TableHead>Context</TableHead>
							<TableHead>Licence and Origin</TableHead>
							<TableHead>Approved</TableHead>
							<TableHead>In the Cluster</TableHead>
							<TableHead className="text-right">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{catalog.models.map((entry) => (
							<TableRow key={entry.id} className="align-top">
								<TableCell className="max-w-72 whitespace-normal">
									<div className="flex min-w-0 flex-col gap-0.5">
										<span className="font-medium">
											{entry.displayName ?? entry.id}
										</span>
										<Muted className="break-all text-xs">
											{entry.id}
										</Muted>
									</div>
								</TableCell>
								<TableCell className="whitespace-normal">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm">
											{describeStorage(entry.storageUri)}
										</span>
										{entry.sizeBytes ? (
											<Muted className="text-xs">
												{formatByteSize(
													entry.sizeBytes,
												)}
											</Muted>
										) : null}
									</div>
								</TableCell>
								<TableCell className="whitespace-normal">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm">
											{entry.contextWindow
												? `${entry.contextWindow} tokens`
												: "Not set"}
										</span>
										{entry.maxTokens ? (
											<Muted className="text-xs">
												Replies up to {entry.maxTokens}
											</Muted>
										) : null}
									</div>
								</TableCell>
								<TableCell className="whitespace-normal">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm">
											{entry.licence ?? "Unknown"}
										</span>
										<Muted className="text-xs">
											{entry.origin ?? "Unknown"}
										</Muted>
									</div>
								</TableCell>
								<TableCell className="whitespace-normal">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm">
											{entry.approvedBy ?? "Unknown"}
										</span>
										{entry.approvedAt ? (
											<Muted className="text-xs">
												{formatLocalDateTime(
													entry.approvedAt,
													"MMM D, YYYY",
												) ?? entry.approvedAt}
											</Muted>
										) : null}
									</div>
								</TableCell>
								<TableCell className="whitespace-normal">
									{models === null ? (
										<Muted className="text-xs">
											Unknown
										</Muted>
									) : modelsServing(entry, models).length ===
										0 ? (
										<Muted className="text-xs">
											Not defined
										</Muted>
									) : (
										<div className="flex flex-col gap-0.5">
											{modelsServing(entry, models).map(
												(model) => (
													<span
														key={model.servedModel}
														className="text-sm"
													>
														<span className="break-all">
															{model.servedModel}
														</span>
														<Muted className="text-xs">
															{" "}
															(
															{servingLabel(
																SERVED_MODEL_STATE_LABELS,
																model.state,
															).toLowerCase()}
															)
														</Muted>
													</span>
												),
											)}
										</div>
									)}
								</TableCell>
								<TableCell className="text-right">
									<Button
										size="sm"
										variant="outline"
										onClick={() => onDefine(entry.id)}
										aria-label={`Define ${entry.displayName ?? entry.id}`}
									>
										<Plus className="size-4" aria-hidden />
										Define
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
