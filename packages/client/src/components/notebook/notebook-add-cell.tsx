import {
	Bot,
	ChevronDown,
	ChevronUp,
	Code2,
	Database,
	Filter,
	FunctionSquare,
	Search,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	ActionMessages,
	type CellStateConfig,
	CodeCellConfig,
	DataImportFormModal,
	type DefaultCellDefinitions,
	DefaultCells,
	type NewCellAction,
	NotebookImportCellConfig,
	type NotebookState,
	TransformationCells,
	useBlocks,
} from "@semoss/renderer";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
} from "@semoss/ui/next";

interface AddCellOption {
	display: string;
	icon: React.ReactNode;
	defaultCellType?: DefaultCellDefinitions["widget"];
	options?: {
		display: string;
		defaultCellType: DefaultCellDefinitions["widget"];
		disabled?: boolean;
	}[];
	disabled?: boolean;
}

const Transformations = Array.from(Object.values(TransformationCells)).map(
	(item) => {
		return {
			display: item.name,
			defaultCellType: item.widget,
		};
	},
);

const DataImportDropdownOptions = [
	{
		display: "Query Builder",
		defaultCellType: null,
	},
	{
		display: "Custom Query",
		defaultCellType: "query-import",
	},
	{
		display: "From CSV",
		defaultCellType: null,
		disabled: true,
	},
];

const DataOptions = [
	{
		display: "Filter Data",
		defaultCellType: "filter-data",
	},
	{
		display: "Unfilter Data",
		defaultCellType: `unfilter-data`,
	},
	{
		display: "Text to SQL",
		defaultCellType: "text-to-sql",
	},
];

const AddCellOptions: Record<string, AddCellOption> = {
	code: {
		display: "Cell",
		defaultCellType: "code",
		icon: <Code2 className="size-4" />,
	},
	"import-data": {
		display: "Import Data",
		icon: <Database className="size-4" />,
		options: DataImportDropdownOptions,
		disabled: false,
	},
	data: {
		display: "Data Filters",
		icon: <Filter className="size-4" />,
		options: DataOptions,
	},
	transformation: {
		display: "Transformation",
		icon: <FunctionSquare className="size-4" />,
		options: Transformations,
	},
	llm: {
		display: "LLM",
		defaultCellType: "llm",
		icon: <Bot className="size-4" />,
	},
};

export const NotebookAddCell = observer(
	(props: { query: NotebookState; previousCellId?: string }): JSX.Element => {
		const [selectedAddCell, setSelectedAddCell] = useState<string>("");
		const [isDataImportModalOpen, setIsDataImportModalOpen] =
			useState<boolean>(false);
		const { query, previousCellId = "" } = props;
		const { state, notebook } = useBlocks();
		const [searchQuery, setSearchQuery] = useState("");

		/**
		 * @description - organizes transformation menu in a ds to map
		 */
		const TransformationCategories = useMemo(() => {
			const categories = {
				Text: [],
				"Data & Time": [],
				Numeric: [],
				Column: [],
			} as Record<string, typeof Transformations>;

			Transformations.forEach((transformation) => {
				switch (transformation.display) {
					case "Uppercase":
						categories.Text.push(transformation);
						break;
					case "Date Difference":
					case "Timestamp":
						categories["Data & Time"].push(transformation);
						break;
					case "Cumulative Sum":
					case "Encode Column":
						categories.Numeric.push(transformation);
						break;
					case "Update Row":
					case "Change Column Type":
					case "Join":
					case "Collapse":
						categories.Column.push(transformation);
						break;
					default:
						break;
				}
			});

			return categories;
		}, []);

		/**
		 * filters transformations based on search term
		 */
		const filteredCategories = Object.entries(TransformationCategories)
			.map(([category, transformations]) => {
				const filteredTransformations = searchQuery
					? transformations.filter((t) =>
							t.display
								.toLowerCase()
								.includes(searchQuery.toLowerCase()),
						)
					: transformations;

				return {
					category,
					transformations: filteredTransformations,
				};
			})
			.filter(({ transformations }) => transformations.length > 0);

		/**
		 * @description - Create a New Cell and Add to Notebook
		 *
		 */
		const appendCell = async (widget: string) => {
			try {
				const config: NewCellAction["payload"]["config"] = {
					widget: DefaultCells[widget].widget,
					parameters: DefaultCells[widget].parameters,
				};

				if (widget === NotebookImportCellConfig.widget) {
					config.parameters = {
						...DefaultCells[widget].parameters,
						frameVariableName: `FRAME_${Math.floor(
							Math.random() * 100000,
						)}`,
					};
				}

				if (
					previousCellId &&
					state.notebooks[query.id].cells[previousCellId].widget ===
						widget &&
					widget === CodeCellConfig.widget
				) {
					const previousCellType =
						state.notebooks[query.id].cells[previousCellId]
							.parameters?.type ?? "pixel";
					config.parameters = {
						...DefaultCells[widget].parameters,
						type: previousCellType,
					};
				}

				// copy and add the step
				const newCellId = (await state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: query.id,
						previousCellId: previousCellId,
						config: config as Omit<CellStateConfig, "id">,
					},
				})) as string;

				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${query.id}--${newCellId}`,
						type: "cell",
						to: query.id,
						cellId: newCellId,
					},
				});

				notebook.selectCell(query.id, newCellId);
			} catch (e) {
				console.error(e);
			}
		};

		return (
			<>
				<div className="group relative flex h-8 w-full items-center">
					<div className="flex-1" />

					{/* Hover-reveal button bar centered over the divider */}
					<div
						className={`absolute inset-0 flex items-center justify-center transition-opacity ${selectedAddCell ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
					>
						<div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-0.5 shadow-sm">
							{AddCellOptions &&
								Object.entries(AddCellOptions).map(
									(add, _i) => {
										const [key, value] = add;

										if (!value.options) {
											// Simple button — no dropdown
											return (
												<Button
													key={`${query.id}-${previousCellId}-${value.display}`}
													title={value.display}
													variant="ghost"
													size="sm"
													disabled={
														query.isLoading ||
														value.disabled
													}
													className="h-7 w-7 p-0 text-muted-foreground"
													onClick={() => {
														appendCell(
															value.defaultCellType,
														);
														setSelectedAddCell(key);
													}}
												>
													{value.icon}
												</Button>
											);
										}

										// Button with dropdown menu
										return (
											<DropdownMenu
												key={`${query.id}-${previousCellId}-${value.display}`}
												onOpenChange={(open) => {
													setSelectedAddCell(
														open ? key : "",
													);
												}}
											>
												<DropdownMenuTrigger asChild>
													<Button
														title={value.display}
														variant="ghost"
														size="sm"
														disabled={
															query.isLoading ||
															value.disabled
														}
														className="h-7 w-7 p-0 text-muted-foreground"
													>
														{value.icon}
														{selectedAddCell ===
														key ? (
															<ChevronUp className="-ml-1 size-2.5" />
														) : (
															<ChevronDown className="-ml-1 size-2.5" />
														)}
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="start">
													{key ===
														"transformation" && (
														<>
															<div className="p-2">
																<div className="relative">
																	<Search className="-translate-y-1/2 absolute top-1/2 left-2 size-3.5 text-muted-foreground" />
																	<Input
																		placeholder="Search"
																		className="h-7 pl-7 text-xs"
																		value={
																			searchQuery
																		}
																		onChange={(
																			e,
																		) =>
																			setSearchQuery(
																				e
																					.target
																					.value,
																			)
																		}
																	/>
																	{searchQuery && (
																		<button
																			type="button"
																			className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground"
																			onClick={() =>
																				setSearchQuery(
																					"",
																				)
																			}
																		>
																			<X className="size-3" />
																		</button>
																	)}
																</div>
															</div>
															<div className="max-h-[300px] overflow-y-auto">
																{filteredCategories.map(
																	({
																		category,
																		transformations,
																	}) => (
																		<div
																			key={`${query.id}-${previousCellId}-${category}`}
																		>
																			<DropdownMenuLabel className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
																				{
																					category
																				}
																			</DropdownMenuLabel>
																			{transformations.map(
																				(
																					transformation,
																				) => (
																					<DropdownMenuItem
																						key={`${query.id}-${previousCellId}-${transformation.display}`}
																						onClick={() => {
																							appendCell(
																								transformation.defaultCellType,
																							);
																							setSearchQuery(
																								"",
																							);
																						}}
																					>
																						{
																							transformation.display
																						}
																					</DropdownMenuItem>
																				),
																			)}
																			<DropdownMenuSeparator />
																		</div>
																	),
																)}
															</div>
														</>
													)}
													{key !== "transformation" &&
														Array.from(
															value.options || [],
															({
																display,
																defaultCellType,
																disabled,
																// biome-ignore lint/suspicious/noExplicitAny: dynamic option type
															}: any) => (
																<DropdownMenuItem
																	key={`${query.id}-${previousCellId}-${display}`}
																	disabled={
																		disabled
																	}
																	onClick={() => {
																		if (
																			key ===
																				"import-data" &&
																			!defaultCellType
																		) {
																			setIsDataImportModalOpen(
																				true,
																			);
																		} else {
																			appendCell(
																				defaultCellType,
																			);
																		}
																	}}
																>
																	{display}
																</DropdownMenuItem>
															),
														)}
												</DropdownMenuContent>
											</DropdownMenu>
										);
									},
								)}
						</div>
					</div>
				</div>

				{isDataImportModalOpen && (
					<DataImportFormModal
						setIsDataImportModalOpen={setIsDataImportModalOpen}
						query={query}
						previousCellId={previousCellId}
						cell={null}
						editMode={false}
					/>
				)}
			</>
		);
	},
);
