import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	ActionMessages,
	DefaultBlocks,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Textarea,
	toast,
} from "@semoss/ui/next";
import type {
	CellConfig,
	CellDef,
} from "../../../../../../../../libs/renderer/dist/types/store/state/state.types";
import type { FilterParameter, SavedQuery } from "../../../insight.types";
import { PreviewPanel } from "../../shared";
import { ParameterInputSettings } from "./ParameterInputSettings";

interface ParameterEditorProps {
	parameter: FilterParameter | null;
	savedParameters: FilterParameter[];
	savedQueries: SavedQuery[];
	onSave: (param: FilterParameter) => void;
	onCancel: () => void;
}

interface FormData {
	name: string;
	inputType: FilterParameter["inputType"];
	required: boolean;
	defaultValue: string;
	hint: string;
	optionsText: string; // JSON string of options
	optionsSourceType: FilterParameter["optionsSourceType"];
	optionsSourceQueryId: string;
	optionLabel: string;
	optionValue: string;
	optionSublabel: string;
	multiple: boolean;
	// Radio-specific
	direction: "row" | "column";
	// Additional fields for block-style settings
	label: string;
	size: "small" | "medium";
	color: string;
}

export const ParameterEditor = (props: ParameterEditorProps) => {
	const { parameter, savedParameters, savedQueries, onSave, onCancel } =
		props;
	const isEditMode = !!parameter;
	const baseId = useId();

	// Preview state
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [blockState, setBlockState] = useState<StateStore | null>(null);
	const [blockId, setBlockId] = useState<string | null>(null);
	const [previewInsightId] = useState(`preview-${Date.now()}`);

	const form = useForm<FormData>({
		defaultValues: {
			name: parameter?.name || "",
			inputType: parameter?.inputType || "text",
			required: parameter?.required || false,
			defaultValue: (() => {
				const value =
					parameter?.defaultValue !== undefined
						? Array.isArray(parameter.defaultValue)
							? JSON.stringify(parameter.defaultValue)
							: String(parameter.defaultValue)
						: "";
				return value;
			})(),
			label: parameter?.label || parameter?.name || "",
			hint: parameter?.hint || "",
			optionsText:
				parameter?.options && parameter.options.length > 0
					? JSON.stringify(parameter.options, null, 2)
					: JSON.stringify(
							[{ label: "Option 1", value: "opt1" }],
							null,
							2,
						),
			optionsSourceType: parameter?.optionsSourceType || "manual",
			optionsSourceQueryId: parameter?.optionsSourceQueryId || "",
			optionLabel: parameter?.optionLabel || "",
			optionValue: parameter?.optionValue || "",
			optionSublabel: parameter?.optionSublabel || "",
			multiple: parameter?.multiple || false,
			direction: parameter?.direction || "column",
			size: "medium", // For radio/toggle size
			color: "primary", // For radio/toggle color
		},
	});

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = form;

	const inputType = watch("inputType");
	const optionsSourceType = watch("optionsSourceType");

	// Helper function to execute SQL query and load options
	const loadSqlOptions = useCallback(
		async (
			databaseId: string,
			sqlQuery: string,
			targetBlockState: StateStore,
			targetBlockId: string,
		) => {
			try {
				// Set loading state
				targetBlockState.dispatch({
					message: ActionMessages.SET_BLOCK_DATA,
					payload: {
						id: targetBlockId,
						path: "loading",
						value: true,
					},
				});

				// Escape double quotes in SQL query
				const escapedQuery = sqlQuery.replace(/"/g, '\\"');

				// Build pixel query for preview (limit 100 rows for parameters)
				const reactorPixel = `Database(database=["${databaseId}"]) | Query("${escapedQuery}") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["param_query_preview"])]) ; META | Frame() | QueryAll() | Limit(100) | Collect(500);`;

				const response = await runPixel(reactorPixel);
				const type = response.pixelReturn[0]?.operationType;

				if (type && type.indexOf("ERROR") !== -1) {
					const error = response.pixelReturn[0]?.output;
					console.error("SQL query error:", error);
					toast.error(`Failed to load options: ${String(error)}`);
					targetBlockState.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: targetBlockId,
							path: "loading",
							value: false,
						},
					});
					return;
				}

				const output = response.pixelReturn[1]?.output as {
					data: {
						values: unknown[][];
						headers: string[];
					};
				};

				// Set the options in the format the select block expects
				if (output?.data) {
					targetBlockState.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: targetBlockId,
							path: "options",
							value: {
								data: {
									values: output.data.values || [],
									headers: output.data.headers || [],
								},
							},
						},
					});
				}

				// Clear loading state
				targetBlockState.dispatch({
					message: ActionMessages.SET_BLOCK_DATA,
					payload: {
						id: targetBlockId,
						path: "loading",
						value: false,
					},
				});
			} catch (error) {
				console.error("Error loading SQL options:", error);
				toast.error(
					`Failed to load options: ${error instanceof Error ? error.message : String(error)}`,
				);
				targetBlockState.dispatch({
					message: ActionMessages.SET_BLOCK_DATA,
					payload: {
						id: targetBlockId,
						path: "loading",
						value: false,
					},
				});
			}
		},
		[],
	);

	// Auto-load SQL options when a select block with SQL config is created
	useEffect(() => {
		if (!blockState || !blockId || inputType !== "select") {
			return;
		}

		const block = blockState.getBlock(blockId);
		if (!block) return;

		const parameterDatabaseId = block.data?.parameterDatabaseId as
			| string
			| undefined;
		const parameterSqlQuery = block.data?.parameterSqlQuery as
			| string
			| undefined;
		const currentOptions = block.data?.options;

		// If SQL config exists but options are not loaded, execute the query
		// Check for: no options, empty array, or object without data.values
		const needsLoading =
			parameterDatabaseId &&
			parameterSqlQuery &&
			(!currentOptions ||
				(Array.isArray(currentOptions) &&
					currentOptions.length === 0) ||
				(typeof currentOptions === "object" &&
					!Array.isArray(currentOptions) &&
					!(currentOptions as { data?: { values?: unknown[] } }).data
						?.values?.length));

		if (needsLoading) {
			console.log("Auto-loading SQL options in editor:", {
				databaseId: parameterDatabaseId,
				hasQuery: !!parameterSqlQuery,
				currentOptions,
			});
			loadSqlOptions(
				parameterDatabaseId,
				parameterSqlQuery,
				blockState,
				blockId,
			);
		}
	}, [blockState, blockId, inputType, loadSqlOptions]);

	// Create block state when input type is selected
	useEffect(() => {
		if (!inputType) {
			setShowPreview(false);
			setBlockState(null);
			setBlockId(null);
			return;
		}

		// Only create block state for types that support preview
		if (
			inputType === "text" ||
			inputType === "number" ||
			inputType === "date" ||
			inputType === "select"
		) {
			const newBlockId = `parameter-${inputType}-${Date.now()}`;
			// biome-ignore lint/suspicious/noExplicitAny: Complex state store typing
			let initialState: any;

			if (
				inputType === "text" ||
				inputType === "number" ||
				inputType === "date"
			) {
				initialState = {
					version: STATE_VERSION,
					blocks: {
						[newBlockId]: {
							id: newBlockId,
							widget: "input",
							data: {
								label:
									form.getValues("label") ||
									form.getValues("name") ||
									"",
								value: form.getValues("defaultValue") || "",
								type: inputType,
								rows: 1,
								multiline: false,
								required: form.getValues("required") || false,
								disabled: false,
								hint: form.getValues("hint") || "",
								loading: false,
								style: { width: "100%" },
								show: "true",
							},
							listeners: {
								preProcess: {
									type: "sync" as const,
									order: [],
								},
								onChange: { type: "sync" as const, order: [] },
							},
							slots: {},
						},
					},
					queries: {},
					variables: {},
					executionOrder: [],
				};
			} else if (inputType === "select") {
				// Parse defaultValue for multi-select (form stores as JSON string)
				const formDefaultValue = form.getValues("defaultValue");
				const isMultiple = form.getValues("multiple");
				let blockValue: string | string[] = "";

				if (formDefaultValue && isMultiple) {
					try {
						blockValue = JSON.parse(formDefaultValue);
					} catch {
						blockValue = formDefaultValue;
					}
				} else {
					blockValue = formDefaultValue || "";
				}

				initialState = {
					version: STATE_VERSION,
					blocks: {
						[newBlockId]: {
							id: newBlockId,
							widget: "select",
							data: {
								label:
									form.getValues("label") ||
									form.getValues("name") ||
									"",
								value: blockValue,
								options:
									parameter?.inputType === "select"
										? parameter?.selectOptions || []
										: [],
								multiple: isMultiple,
								required: form.getValues("required") || false,
								disabled: false,
								hint: form.getValues("hint") || "",
								loading: false,
								// Load SQL configuration from parameter if editing
								parameterDatabaseId:
									parameter?.parameterDatabaseId || undefined,
								parameterSqlQuery:
									parameter?.parameterSqlQuery || undefined,
								optionLabel: parameter?.optionLabel || "",
								optionSublabel: parameter?.optionSublabel || "",
								optionValue: parameter?.optionValue || "",
								style: { width: "100%" },
								show: true,
							},
							listeners: {
								preProcess: {
									type: "sync" as const,
									order: [],
								},
								onChange: { type: "sync" as const, order: [] },
								onOpen: { type: "sync" as const, order: [] },
							},
							slots: {},
						},
					},
					queries: {},
					variables: {},
					executionOrder: [],
				};
			}

			const state = new StateStore({
				mode: "static",
				insightId: previewInsightId,
				state: initialState,
				cellRegistry: {} as Record<string, CellConfig<CellDef<string>>>,
			});

			setBlockState(state);
			setBlockId(newBlockId);
			setShowPreview(true);
		} else {
			// Other input types don't have preview yet
			setShowPreview(false);
			setBlockState(null);
			setBlockId(null);
		}
	}, [form, inputType, parameter, previewInsightId]);

	// Auto-sync label from name while label hasn't diverged from the name
	const nameValue = watch("name");
	const prevNameRef = useRef(parameter?.name || "");

	useEffect(() => {
		const prevName = prevNameRef.current;
		prevNameRef.current = nameValue;

		const currentLabel = form.getValues("label");

		// Only mirror name→label if the label is still tracking the name
		if (currentLabel === prevName || currentLabel === "") {
			form.setValue("label", nameValue);
			if (blockState && blockId) {
				blockState.dispatch({
					message: ActionMessages.SET_BLOCK_DATA,
					payload: { id: blockId, path: "label", value: nameValue },
				});
			}
		}
	}, [blockState, blockId, form, nameValue]);

	const validateName = (value: string) => {
		if (!value || value.trim() === "") {
			return "Name is required";
		}
		// Check if name is a valid JavaScript identifier
		if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
			return "Name must be a valid identifier (letters, numbers, underscore, start with letter)";
		}
		// Check for duplicates (excluding current parameter in edit mode)
		const duplicate = savedParameters.find(
			(f) => f.name === value && f.id !== parameter?.id,
		);
		if (duplicate) {
			return "A parameter with this name already exists";
		}
		return true;
	};

	const validateOptions = (value: string) => {
		if (inputType !== "radio" && inputType !== "select") {
			return true;
		}
		if (inputType === "select" && optionsSourceType !== "manual") {
			return true;
		}
		try {
			const parsed = JSON.parse(value);
			if (!Array.isArray(parsed)) {
				return "Options must be a JSON array";
			}
			if (
				parsed.length === 0 ||
				!parsed.every(
					(opt) => typeof opt === "object" && opt.label && opt.value,
				)
			) {
				return "Options must be an array of {label, value} objects";
			}
			return true;
		} catch (_e) {
			return "Invalid JSON format";
		}
	};

	const onSubmit = (data: FormData) => {
		const parameterId = parameter?.id || `parameter-${Date.now()}`;

		let resolvedInputType: FilterParameter["inputType"] = data.inputType;
		if (
			(data.inputType === "text" ||
				data.inputType === "number" ||
				data.inputType === "date") &&
			blockState &&
			blockId
		) {
			const block = blockState.getBlock(blockId);
			const blockType = block?.data?.type;
			if (
				blockType === "text" ||
				blockType === "number" ||
				blockType === "date"
			) {
				resolvedInputType = blockType as FilterParameter["inputType"];
			}
		}

		let defaultValue: FilterParameter["defaultValue"];
		if (data.defaultValue) {
			if (resolvedInputType === "number") {
				defaultValue = Number(data.defaultValue);
			} else if (resolvedInputType === "select" && data.multiple) {
				try {
					defaultValue = JSON.parse(data.defaultValue);
				} catch (e) {
					console.error(e);
					defaultValue = [data.defaultValue];
				}
			} else {
				defaultValue = data.defaultValue;
			}
		}

		let options: FilterParameter["options"];
		if (inputType === "radio" && data.optionsText) {
			try {
				options = JSON.parse(data.optionsText);
			} catch {
				options = [];
			}
		}

		let selectOptions: string[] | undefined;
		let parameterDatabaseId: string | undefined;
		let parameterSqlQuery: string | undefined;
		let optionLabel: string | undefined;
		let optionValue: string | undefined;
		let optionSublabel: string | undefined;

		if (resolvedInputType === "select" && blockState && blockId) {
			const block = blockState.getBlock(blockId);
			const blockOptions = block?.data?.options;
			if (Array.isArray(blockOptions)) {
				selectOptions = blockOptions as string[];
			}

			// Extract SQL configuration if present
			if (block?.data?.parameterDatabaseId) {
				parameterDatabaseId = block.data.parameterDatabaseId as string;
			}
			if (block?.data?.parameterSqlQuery) {
				parameterSqlQuery = block.data.parameterSqlQuery as string;
			}
			if (block?.data?.optionLabel) {
				optionLabel = block.data.optionLabel as string;
			}
			if (block?.data?.optionValue) {
				optionValue = block.data.optionValue as string;
			}
			if (block?.data?.optionSublabel) {
				optionSublabel = block.data.optionSublabel as string;
			}
		}

		const newParameter: FilterParameter = {
			id: parameterId,
			name: data.name,
			label: data.label || data.name,
			inputType: resolvedInputType,
			required: data.required,
			defaultValue,
			hint: data.hint || undefined,
			options,
			...(resolvedInputType === "select" && {
				selectOptions,
				multiple: data.multiple,
				...(parameterDatabaseId && { parameterDatabaseId }),
				...(parameterSqlQuery && { parameterSqlQuery }),
				...(optionLabel && { optionLabel }),
				...(optionValue && { optionValue }),
				...(optionSublabel && { optionSublabel }),
			}),
			...(inputType === "radio" && {
				direction: data.direction,
			}),
		};

		onSave(newParameter);
	};

	return (
		<Card className="h-full overflow-auto p-6">
			<div className="mb-4 flex items-center justify-between">
				<h6 className="font-semibold text-xl">
					{isEditMode ? "Edit Parameter" : "Create Parameter"}
				</h6>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setShowPreview(!showPreview)}
				>
					{showPreview ? "Hide Preview" : "Show Preview"}
				</Button>
			</div>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div
					className="flex flex-col overflow-hidden transition-all duration-300"
					style={{ height: showPreview ? "25vh" : "50vh" }}
				>
					<div className="flex-1 overflow-auto rounded border border-gray-300 p-[18px]">
						<div className="flex flex-col gap-4">
							{/* Parameter Name */}
							<Controller
								name="name"
								control={control}
								rules={{ validate: validateName }}
								render={({ field }) => (
									<div>
										<Label htmlFor="name">
											Parameter Name *
										</Label>
										<Input
											{...field}
											id={`name-${baseId}`}
											disabled={isEditMode}
											className={
												errors.name
													? "border-destructive"
													: ""
											}
										/>
										{(errors.name || true) && (
											<p className="mt-1 text-muted-foreground text-sm">
												{errors.name?.message ||
													"Name used as variable in queries and displayed to users (e.g., statusFilter)"}
											</p>
										)}
									</div>
								)}
							/>

							{/* Input Type */}
							<Controller
								name="inputType"
								control={control}
								render={({ field }) => (
									<div>
										<Label htmlFor="inputType">
											Block Type
										</Label>
										<Select
											value={
												[
													"text",
													"number",
													"date",
												].includes(field.value)
													? "text"
													: field.value
											}
											onValueChange={field.onChange}
										>
											<SelectTrigger
												id={`inputType-${baseId}`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="text">
													Input
												</SelectItem>
												<SelectItem value="select">
													Select
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							/>

							{/* Block Settings Configuration */}
							{(inputType === "radio" ||
								inputType === "text" ||
								inputType === "number" ||
								inputType === "date" ||
								inputType === "select") &&
								blockState &&
								blockId && (
									<div className="mt-2">
										<ParameterInputSettings
											inputType={inputType}
											form={form}
											blockState={blockState}
											blockId={blockId}
										/>
									</div>
								)}

							{/* Text/Number/Date Configuration - Fallback when block settings not available */}
							{(inputType === "text" ||
								inputType === "number" ||
								inputType === "date") &&
								!blockState && (
									<>
										<Controller
											name="defaultValue"
											control={control}
											render={({ field }) => (
												<div>
													<Label htmlFor="defaultValue">
														Default Value
													</Label>
													<Input
														{...field}
														id={`defaultValue-${baseId}`}
														type={
															inputType ===
															"number"
																? "number"
																: inputType ===
																		"date"
																	? "date"
																	: "text"
														}
													/>
												</div>
											)}
										/>
										<Controller
											name="hint"
											control={control}
											render={({ field }) => (
												<div>
													<Label htmlFor="hint">
														Hint Text
													</Label>
													<Input
														{...field}
														id={`hint-${baseId}`}
													/>
													<p className="mt-1 text-muted-foreground text-sm">
														Optional helper text
														shown below the input
													</p>
												</div>
											)}
										/>
									</>
								)}

							{/* Select Configuration — handled by ParameterInputSettings above */}
							{false && inputType === "select" && (
								<>
									<Controller
										name="optionsSourceType"
										control={control}
										render={({ field }) => (
											<div className="mb-2 w-full">
												<Label htmlFor="optionsSourceType">
													Options Source
												</Label>
												<Select
													value={field.value}
													onValueChange={
														field.onChange
													}
												>
													<SelectTrigger
														id={`optionsSourceType-${baseId}`}
													>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="manual">
															Manual Entry
														</SelectItem>
														<SelectItem value="existingQuery">
															From Existing Query
														</SelectItem>
														<SelectItem value="separateQuery">
															From Separate Query
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										)}
									/>

									{optionsSourceType === "manual" && (
										<Controller
											name="optionsText"
											control={control}
											rules={{
												validate: validateOptions,
											}}
											render={({ field }) => (
												<div>
													<Label htmlFor="optionsText">
														Options (JSON)
													</Label>
													<Textarea
														{...field}
														id={`optionsText-${baseId}`}
														rows={6}
														placeholder='[{"label": "Option 1", "value": "opt1"}]'
														className={
															errors.optionsText
																? "border-destructive"
																: ""
														}
													/>
													<p className="mt-1 text-muted-foreground text-sm">
														{errors.optionsText
															?.message ||
															'Format: [{"label": "Option 1", "value": "opt1"}]'}
													</p>
												</div>
											)}
										/>
									)}

									{(optionsSourceType === "existingQuery" ||
										optionsSourceType ===
											"separateQuery") && (
										<>
											{optionsSourceType ===
												"existingQuery" && (
												<Controller
													name="optionsSourceQueryId"
													control={control}
													rules={{
														required:
															"Query is required for this option type",
													}}
													render={({ field }) => (
														<div
															className={
																errors.optionsSourceQueryId
																	? "text-destructive"
																	: ""
															}
														>
															<Label htmlFor="optionsSourceQueryId">
																Select Query
															</Label>
															<Select
																value={
																	field.value
																}
																onValueChange={
																	field.onChange
																}
															>
																<SelectTrigger
																	id={`optionsSourceQueryId-${baseId}`}
																>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{savedQueries.map(
																		(
																			query,
																		) => (
																			<SelectItem
																				key={
																					query.id
																				}
																				value={
																					query.id
																				}
																			>
																				{query.frameVariableName ||
																					query.id}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
															{errors.optionsSourceQueryId && (
																<p className="mt-1 text-destructive text-sm">
																	{
																		errors
																			.optionsSourceQueryId
																			.message
																	}
																</p>
															)}
														</div>
													)}
												/>
											)}
											{optionsSourceType ===
												"separateQuery" && (
												<p className="text-muted-foreground text-sm">
													Note: Separate query
													creation will be available
													in the Queries tab
												</p>
											)}
											<Controller
												name="optionLabel"
												control={control}
												render={({ field }) => (
													<div>
														<Label htmlFor="optionLabel">
															Label Field Path
														</Label>
														<Input
															{...field}
															id={`optionLabel-${baseId}`}
														/>
														<p className="mt-1 text-muted-foreground text-sm">
															Path to label field
															(e.g., "name" or
															"data.label")
														</p>
													</div>
												)}
											/>
											<Controller
												name="optionValue"
												control={control}
												render={({ field }) => (
													<div>
														<Label htmlFor="optionValue">
															Value Field Path
														</Label>
														<Input
															{...field}
															id={`optionValue-${baseId}`}
														/>
														<p className="mt-1 text-muted-foreground text-sm">
															Path to value field
															(e.g., "id" or
															"data.value")
														</p>
													</div>
												)}
											/>
											<Controller
												name="optionSublabel"
												control={control}
												render={({ field }) => (
													<div>
														<Label htmlFor="optionSublabel">
															Sublabel Field Path
															(Optional)
														</Label>
														<Input
															{...field}
															id={`optionSublabel-${baseId}`}
														/>
														<p className="mt-1 text-muted-foreground text-sm">
															Path to sublabel
															field
														</p>
													</div>
												)}
											/>
										</>
									)}

									<Controller
										name="multiple"
										control={control}
										render={({ field }) => (
											<div>
												<p className="mb-2 text-muted-foreground text-sm">
													Allow Multiple Selection
												</p>
												<Switch
													checked={field.value}
													onCheckedChange={
														field.onChange
													}
												/>
											</div>
										)}
									/>

									<Controller
										name="defaultValue"
										control={control}
										render={({ field }) => (
											<div>
												<Label htmlFor="defaultValue-select">
													Default Value
												</Label>
												<Input
													{...field}
													id={`defaultValue-select-${baseId}`}
												/>
												<p className="mt-1 text-muted-foreground text-sm">
													{watch("multiple")
														? "JSON array for multiple values"
														: "Single value"}
												</p>
											</div>
										)}
									/>
								</>
							)}
						</div>
					</div>
					{/* Action Buttons */}
					<div className="mt-2 flex justify-end gap-2">
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="submit">
							{isEditMode
								? "Update Parameter"
								: "Create Parameter"}
						</Button>
					</div>
				</div>
			</form>
			{/* Preview */}
			{showPreview && blockState && blockId && (
				<PreviewPanel
					mode="block"
					title="Preview"
					blockData={{
						blockState: blockState,
						blockId: blockId,
						registry: DefaultBlocks,
					}}
					height="25vh"
					centerBlock={true}
				/>
			)}
		</Card>
	);
};
