import { AlertTriangle, Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { SavedComponent, SavedQuery } from "../../insight.types";

interface InsightBuilderSummaryProps {
	currentBuilderStep: number;
	isBuilderStepComplete: (step: number) => boolean;
	changeBuilderStep: (step: number) => void;
	savedQueries: SavedQuery[];
	onDeleteQuery: (id: string) => void;
	onEditQuery: (query: SavedQuery) => void;
	editingQueryId: string | null;
	editingComponentId: string | null;
	savedComponents: SavedComponent[];
	orphanedComponentIds: string[];
	onAddComponent: () => void;
	onEditComponent: (component: SavedComponent) => void;
	onDeleteComponent: (id: string) => void;
	editMode?: boolean;
}

export const InsightBuilderSummary = (props: InsightBuilderSummaryProps) => {
	const {
		currentBuilderStep,
		isBuilderStepComplete,
		changeBuilderStep,
		savedQueries,
		onDeleteQuery,
		onEditQuery,
		editingQueryId,
		editingComponentId,
		savedComponents,
		orphanedComponentIds,
		onAddComponent,
		onEditComponent,
		onDeleteComponent,
		editMode = false,
	} = props;

	const steps = [
		{ step: 1, label: "Create Queries", key: "queries" },
		{ step: 2, label: "Build Components", key: "components" },
		{ step: 3, label: "Customize Layout", key: "layout" },
		{ step: 4, label: editMode ? "Update App" : "Create App", key: "app" },
		...(editMode ? [{ step: 5, label: "Settings", key: "settings" }] : []),
	];

	return (
		<div className="flex flex-col gap-4">
			<h3 className="font-semibold text-lg">Progress</h3>
			{steps.map((stepInfo) => {
				const isActive = currentBuilderStep === stepInfo.step;
				const isComplete = isBuilderStepComplete(stepInfo.step);

				return (
					<button
						type="button"
						key={stepInfo.step}
						className={`rounded-lg p-3 transition-colors ${
							isActive
								? "pointer-events-none bg-primary"
								: isComplete
									? "cursor-pointer bg-neutral-100 hover:bg-neutral-200"
									: "cursor-default"
						}`}
						onClick={() => {
							if (isComplete) {
								changeBuilderStep(stepInfo.step);
							}
						}}
					>
						<div className="flex items-center gap-3">
							<div
								className={`flex size-6 items-center justify-center rounded-full font-semibold text-xs ${
									isActive
										? "bg-white text-primary"
										: isComplete
											? "bg-primary text-white"
											: "bg-neutral-300 text-muted-foreground"
								}`}
							>
								{isComplete && !isActive ? (
									<Check className="size-4" />
								) : (
									stepInfo.step
								)}
							</div>
							<p
								className={`text-sm ${
									isActive
										? "font-semibold text-white"
										: "text-foreground"
								}`}
							>
								{stepInfo.label}
							</p>
						</div>
					</button>
				);
			})}

			{/* Show saved queries only on step 1 */}
			{currentBuilderStep === 1 && savedQueries.length > 0 && (
				<>
					<div className="mt-4 border-border border-t-2 pt-4" />
					<div>
						<h4 className="mb-2 font-semibold text-base">
							Saved Queries ({savedQueries.length})
						</h4>
						<div className="flex max-h-[30vh] flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-neutral-100 [&::-webkit-scrollbar]:w-1.5">
							{savedQueries.map((query) => (
								<div
									key={query.id}
									className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-neutral-300 p-3 hover:bg-neutral-50"
								>
									<p className="font-bold text-sm">
										{query.frameVariableName}
									</p>
									<div className="flex gap-1">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size="icon-sm"
													variant="ghost"
													onClick={() =>
														onEditQuery(query)
													}
													disabled={
														editingQueryId !==
															query.id &&
														editingQueryId !== null
													}
													className="text-primary hover:text-primary"
												>
													<Pencil className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Edit Query
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size="icon-sm"
													variant="ghost"
													onClick={() =>
														onDeleteQuery(query.id)
													}
													disabled={
														editingQueryId !== null
													}
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Delete Query
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{/* Show saved components with add/edit/delete on step 2 */}
			{currentBuilderStep === 2 && (
				<>
					<div className="mt-4 border-border border-t-2 pt-4" />
					<div>
						<div className="mb-2 flex items-center justify-between">
							<h4 className="font-semibold text-base">
								Components ({savedComponents.length})
							</h4>
							<Button
								size="icon-sm"
								variant="outline"
								onClick={onAddComponent}
								className="rounded-sm border border-primary"
							>
								<Plus className="size-4" />
							</Button>
						</div>
						{savedComponents.length > 0 && (
							<div className="flex max-h-[30vh] flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-neutral-100 [&::-webkit-scrollbar]:w-1.5">
								{savedComponents.map((component) => {
									const isOrphaned =
										orphanedComponentIds.includes(
											component.id,
										);
									return (
										<div
											key={component.id}
											className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-neutral-300 p-3 hover:bg-neutral-50"
										>
											<div className="flex items-center gap-1">
												<p className="flex-1 font-bold text-sm">
													{`${component.id}`}
												</p>
												{isOrphaned && (
													<Tooltip>
														<TooltipTrigger asChild>
															<AlertTriangle className="size-4 text-amber-500" />
														</TooltipTrigger>
														<TooltipContent>
															Query no longer
															exists
														</TooltipContent>
													</Tooltip>
												)}
											</div>
											<div className="flex gap-1">
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="icon-sm"
															variant="ghost"
															onClick={() =>
																onEditComponent(
																	component,
																)
															}
															disabled={
																editingComponentId !==
																	component.id &&
																editingComponentId !==
																	null
															}
															className="text-primary hover:text-primary"
														>
															<Pencil className="size-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														Edit Component
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="icon-sm"
															variant="ghost"
															onClick={() =>
																onDeleteComponent(
																	component.id,
																)
															}
															disabled={
																editingComponentId !==
																null
															}
															className="text-destructive hover:text-destructive"
														>
															<Trash2 className="size-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														Delete Component
													</TooltipContent>
												</Tooltip>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};
