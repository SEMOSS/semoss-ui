import { GripVertical, Trash2 } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "react-beautiful-dnd";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
	type CellState,
} from "../../../store";
import type { QueryImportCellDef } from "../query-import-cell";

export interface TransformationTargetCell {
	id: string;
	frameVariableName: string;
}
export interface FilterDataCellDef extends CellDef<"filter-data"> {
	widget: "filter-data";
	parameters: {
		/** Ouput variable name */
		frameName: string;
		/** Select query rendered in the cell */
		filterQuery: string;
		targetCell: TransformationTargetCell;
	};
}
type Rule = {
	id: number;
	field: string;
	operator: string;
	value: string[] | number[];
};
type RuleGroup = {
	id: number;
	condition: "AND" | "OR";
	rules: (Rule | RuleGroup)[];
};
export const FilterDataCell: CellComponent<FilterDataCellDef> = observer(
	(props) => {
		const { cell } = props;
		const { state } = useBlocks();
		const [selectedFrameHeaders, setSelectedFrameHeaders] = useState([]);
		const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
		const [framelist, setFramelist] = useState([]);
		const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([
			{
				id: Date.now(),
				condition: "AND",
				rules: [{ id: Date.now(), field: "", operator: "", value: [] }],
			},
		]);
		const [query, setQuery] = useState<string>(
			cell.parameters.filterQuery || "",
		);
		const [valueOptionsMap, setValueOptionsMap] = useState<
			Record<string | number, string[] | number[]>
		>({});
		/**
		 * Cell that Transformation will be made to
		 */
		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			let c: CellState<QueryImportCellDef> | undefined;
			let cellId: number | null = null;
			Object.values(state.queries).forEach((query) => {
				Object.entries(query.cells).forEach(
					([key, value], _cellIndex) => {
						const parsedId =
							value.parameters?.frameVariableName || null;
						if (cellId || parsedId === null) return;

						const target = (parsedId as string)?.match(/\d+/);
						const targetID = target ? target[0] : null;
						if (
							targetID &&
							Number(targetID) ===
								Number(cell.parameters.targetCell.id) &&
							cellId === null
						) {
							cellId = parseInt(key, 10);
						}
					},
				);

				if (query.cells[cell.parameters.targetCell.id]) {
					c = query.cells[
						cell.parameters.targetCell.id
					] as CellState<QueryImportCellDef>;
				}
				if (!query.cells[cell.parameters.targetCell.id] && cellId) {
					c = query.cells[cellId] as CellState<QueryImportCellDef>;
				}
				cellId = null;
			});
			return c;
		}).get();
		/**
		 * Determines if Target Cell is a frame and is executed
		 */
		const doesFrameExist: boolean = computed(() => {
			return (
				!!targetCell && (targetCell.isExecuted || !!targetCell.output)
			);
		}).get();
		useEffect(() => {
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.filterQuery",
					value: query,
				},
			});
		}, [query]);
		useEffect(() => {
			if (doesFrameExist && targetCell.isExecuted !== undefined) {
				handleTargetCellChange();
			}
		}, [targetCell?.isExecuted, doesFrameExist, selectedFrame]);
		const myDbs =
			usePixel<{ app_id: string; app_name: string }[]>(`GetFrames();`);
		useEffect(() => {
			if (myDbs.status !== "SUCCESS") {
				return;
			}
			handleFrame();
			const query = parseQuery(cell.parameters.filterQuery);
			setRuleGroups(query);
		}, [myDbs.status]);
		useEffect(() => {
			setSelectedFrame(cell.parameters.frameName);
		}, [framelist]);
		const stringOperators = [
			{ label: "Equals", value: "==" },
			{ label: "Not Equals", value: "!=" },
		];
		const numberOperators = [
			{ label: "Equals", value: "==" },
			{ label: "Not Equals", value: "!=" },
			{ label: "Less Than", value: "<" },
			{ label: "Less Than or Equal", value: "<=" },
			{ label: "Greater Than", value: ">" },
			{ label: "Greater Than or Equal", value: ">=" },
		];
		async function handleTargetCellChange() {
			const parsedRules = parseQuery(query);
			setRuleGroups(parsedRules);
			const getFrames = await state.runSideEffect("GetFrames();");
			const list = getFrames.pixelReturn[0].output as string[];
			if (list.length > 0) {
				setFramelist((_prev) => [...list]);
			}
			const headerResponse = await state.runSideEffect(
				`META | ${selectedFrame} | FrameHeaders();`,
			);
			if (headerResponse) {
				const headers =
					headerResponse.pixelReturn[0].output.headerInfo.headers.map(
						(element) => ({
							name: element.displayName,
							type: element.dataType,
						}),
					);
				setSelectedFrameHeaders(headers);
			}
			const response = await state.runSideEffect(
				`META | Frame("${selectedFrame}") | QueryAll()| Limit(1000) | CollectAll()`,
			);
			const responseData = response.pixelReturn[0].output.data;
			const headers = response.pixelReturn[0].output.headerInfo.map(
				(element) => ({
					name: element.header,
					type: element.dataType,
				}),
			);
			// biome-ignore lint/suspicious/noExplicitAny: external API type
			const fieldToValues: Record<string, any[]> = {};
			headers.forEach((name, index) => {
				const rawValues = responseData.values.map((row) => row[index]);
				const numbers: number[] = [];
				const strings: Set<string> = new Set();
				let hasNaNString = false;
				rawValues.forEach((val) => {
					if (val === "NaN") {
						hasNaNString = true; // Keep only one "NaN"
					} else if (
						!Number.isNaN(Number(val)) &&
						val !== null &&
						val !== undefined &&
						val !== ""
					) {
						numbers.push(Number(val));
					} else {
						strings.add(String(val));
					}
				});
				// Remove duplicates from numbers, sort ascending
				const uniqueSortedNumbers = Array.from(new Set(numbers)).sort(
					(a, b) => a - b,
				);
				// Sort strings alphabetically
				const sortedStrings = Array.from(strings).sort((a, b) =>
					a.localeCompare(b),
				);
				// Add single "NaN" if present
				if (hasNaNString) {
					sortedStrings.unshift("NaN");
				}
				// Combine numbers first, then strings
				fieldToValues[name.name] = [
					...uniqueSortedNumbers,
					...sortedStrings,
				];
			});
			setValueOptionsMap(fieldToValues);
			const usedFields = new Set<string>();
			const extractFields = (rules: (Rule | RuleGroup)[]) => {
				for (const rule of rules) {
					if ("condition" in rule) extractFields(rule.rules);
					else if (rule.field) usedFields.add(rule.field);
				}
			};
			parsedRules.forEach((group) => {
				extractFields(group.rules);
			});
		}
		function parseQuery(query: string): RuleGroup[] {
			query = query.replace(/\s+/g, " ").trim();
			const parseRule = (expression: string): Rule => {
				let expr = expression.trim();
				// Strip outer parentheses recursively
				while (expr.startsWith("(") && expr.endsWith(")")) {
					const inner = expr.slice(1, -1).trim();
					// If removing parens still leaves a valid rule, use it
					if (/^\w+\s*[!=<>]+\s*\[.*?\]$/.test(inner)) {
						expr = inner;
						break;
					}
					expr = inner;
				}
				const match = expr.match(/^(\w+)\s*([!=<>]+)\s*(\[.*?\])$/);
				if (!match)
					throw new Error(`Invalid rule format: ${expression}`);
				const [, field, operator, valueRaw] = match;
				const parts = valueRaw
					.replace(/[[\]]/g, "")
					.split(",")
					.map((v) => v.trim().replace(/^["']|["']$/g, ""));
				const allAreNumbers = parts.every(
					(p) => !Number.isNaN(Number(p)),
				);
				const value = allAreNumbers ? parts.map(Number) : parts;
				return {
					id: Date.now() + Math.random(),
					field,
					operator,
					value,
				};
			};
			const buildGroup = (expr: string): RuleGroup => {
				expr = expr.trim();
				if (expr.startsWith("(") && expr.endsWith(")")) {
					expr = expr.slice(1, -1).trim();
				}
				const condition: "AND" | "OR" = "AND";
				const parts: (Rule | RuleGroup)[] = [];
				let buffer = "";
				let bracketCount = 0;
				let currentCondition: "AND" | "OR" | null = null;
				const flushBuffer = () => {
					const trimmed = buffer.trim();
					if (!trimmed) return;
					const isGroup = /(?:^|\s)(?:AND|OR)(?:\s|$)/.test(trimmed);
					parts.push(
						isGroup ? buildGroup(trimmed) : parseRule(trimmed),
					);
					buffer = "";
				};
				const tokens =
					expr.match(/\(|\)|AND|OR|\[.*?\]|[^\s()]+/g) || [];
				for (let i = 0; i < tokens.length; i++) {
					const token = tokens[i];
					if (token === "(") bracketCount++;
					if (token === ")") bracketCount--;
					if (
						(token === "AND" || token === "OR") &&
						bracketCount === 0
					) {
						flushBuffer();
						if (!currentCondition)
							currentCondition = token as "AND" | "OR";
						else if (currentCondition !== token) {
							throw new Error(
								"Mixed operators at same level not supported.",
							);
						}
						continue;
					}
					buffer += `${token} `;
				}
				flushBuffer();
				return {
					id: Date.now() + Math.random(),
					condition: currentCondition ?? condition,
					rules: parts,
				};
			};
			return [buildGroup(query)];
		}
		const handleConditionChange = (
			groupId: number,
			newCond: "AND" | "OR",
		) => {
			const updateCondition = (groups: RuleGroup[]): RuleGroup[] => {
				return groups.map((group) => {
					if (group.id === groupId) {
						return { ...group, condition: newCond };
					}
					const updatedRules = group.rules.map((rule) => {
						if ("condition" in rule) {
							return updateCondition([rule])[0];
						}
						return rule;
					});
					return { ...group, rules: updatedRules };
				});
			};
			setRuleGroups((prev) => {
				const updated = updateCondition(prev);
				const newQuery = stringifyQuery(updated); // Convert updated rules back to query
				setQuery(newQuery); // Update the query state
				return updated;
			});
		};
		function stringifyQuery(groups: RuleGroup[]): string {
			const buildQueryString = (group: RuleGroup): string => {
				const ruleStr = group.rules
					.map((rule) => {
						if ("rules" in rule) {
							return `(${buildQueryString(rule)})`; // For nested groups
						}
						const valueStr = rule.value
							.map((v) => `[${v}]`)
							.join(", ");
						return `${rule.field} ${rule.operator} ${valueStr}`;
					})
					.join(` ${group.condition} `); // Join with AND/OR condition
				return ruleStr;
			};
			return groups.map(buildQueryString).join(" AND "); // You can modify the root condition here (AND by default)
		}
		const updateRules = (
			groups: RuleGroup[],
			groupId: number,
			updateFn: (rules: (Rule | RuleGroup)[]) => (Rule | RuleGroup)[],
			newCondition?: "AND" | "OR",
		): RuleGroup[] => {
			return groups.map((group) => {
				if (group.id === groupId) {
					return {
						...group,
						rules: updateFn(group.rules),
						condition: newCondition ?? group.condition, // Only update condition if provided
					};
				} else {
					return {
						...group,
						rules: group.rules.map((rule) =>
							"condition" in rule
								? updateRules(
										[rule],
										groupId,
										updateFn,
										newCondition,
									)[0]
								: rule,
						),
					};
				}
			});
		};
		const addRule = (groupId: number) => {
			setRuleGroups((prev) =>
				updateRules(prev, groupId, (rules) => [
					...rules,
					{ id: Date.now(), field: "", operator: "", value: [] },
				]),
			);
		};
		const addNestedGroup = (groupId: number) => {
			setRuleGroups((prev) =>
				prev.map((group) =>
					group.id === groupId
						? {
								...group,
								rules: [
									...group.rules,
									{
										id: Date.now(),
										condition: "AND", // Default condition for new groups
										rules: [
											{
												id: Date.now() + 1,
												field: "",
												operator: "",
												value: [],
											},
										],
									},
								],
							}
						: {
								...group,
								rules: group.rules.map((rule) =>
									"condition" in rule
										? addNestedGroupToRule(rule, groupId)
										: rule,
								),
							},
				),
			);
		};
		const addNestedGroupToRule = (
			ruleGroup: RuleGroup,
			groupId: number,
		): RuleGroup => {
			if (ruleGroup.id === groupId) {
				return {
					...ruleGroup,
					rules: [
						...ruleGroup.rules,
						{
							id: Date.now(),
							condition: "AND",
							rules: [
								{
									id: Date.now() + 1,
									field: "",
									operator: "",
									value: [],
								},
							],
						},
					],
				};
			} else {
				return {
					...ruleGroup,
					rules: ruleGroup.rules.map((rule) =>
						"condition" in rule
							? addNestedGroupToRule(rule, groupId)
							: rule,
					),
				};
			}
		};
		const removeRuleOrGroup = (_groupId: number, ruleId: number) => {
			const deepRemove = (
				rules: (Rule | RuleGroup)[],
			): (Rule | RuleGroup)[] => {
				return rules
					.filter((rule) => rule.id !== ruleId) // Remove the rule/group if it matches the ID
					.map((rule) =>
						"condition" in rule // If it's a group, recurse deeper
							? { ...rule, rules: deepRemove(rule.rules) }
							: rule,
					);
			};
			setRuleGroups((prev) => {
				const updatedRules = prev.map((group) => ({
					...group,
					rules: deepRemove(group.rules),
				}));
				setQuery(buildQuery(updatedRules)); // Update query after deletion
				return updatedRules;
			});
		};
		const updateRuleValue = (
			groupId: number,
			ruleId: number,
			field: keyof Rule,
			value: string | number | (string | number)[],
		) => {
			setRuleGroups((prev) => {
				const updatedRules = updateRules(prev, groupId, (rules) =>
					rules.map((rule) => {
						if ("condition" in rule) return rule;
						if (rule.id === ruleId) {
							const updatedRule: Rule = {
								...rule,
								[field]: Array.isArray(value) ? value : value,
							};
							if (field === "field") {
								const selectedFieldName = value as string;
								const validOperators =
									getOperatorsForField(selectedFieldName);
								const currentOperator = rule.operator;
								updatedRule.value = [];
								if (
									!currentOperator ||
									!validOperators.some(
										(op) => op.value === currentOperator,
									)
								) {
									updatedRule.operator = "==";
								}
							}
							return updatedRule;
						}
						return rule;
					}),
				);
				setQuery(buildQuery(updatedRules));
				return updatedRules;
			});
		};
		const buildQuery = (groups: RuleGroup[]): string => {
			const generate = (group: RuleGroup): string => {
				const conditions = group.rules
					.map((rule) => {
						if ("condition" in rule) {
							return generate(rule); // Recursive for nested group
						} else {
							const valuePart = Array.isArray(rule.value)
								? `[${rule.value
										.map((v) =>
											typeof v === "string"
												? `"${v}"`
												: v,
										)
										.join(", ")}]`
								: typeof rule.value === "string"
									? `"${rule.value}"`
									: rule.value;
							return `(${rule.field} ${rule.operator} ${valuePart})`;
						}
					})
					.join(` ${group.condition} `);
				return conditions ? `(${conditions})` : "";
			};
			return groups.map(generate).join(" AND ");
		};
		async function handleFrame() {
			const getFrames = await state.runSideEffect("GetFrames();");
			const list = getFrames.pixelReturn[0].output as string[];
			if (list.length > 0) {
				setFramelist((_prev) => [...list]);
			}
		}
		async function handleFrameSelected(frameSelected) {
			setSelectedFrame(frameSelected);
			const target = frameSelected.match(/\d+/);
			const targetID = target ? parseInt(target[0], 10) : null;
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.frameName",
					value: frameSelected,
				},
			});
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.targetCell",
					value: {
						id: targetID,
						frameVariableName: frameSelected,
					},
				},
			});
			resetAllRules();
		}
		const resetAllRules = () => {
			setRuleGroups((prev) => {
				if (prev.length === 0) return prev;
				// Keep only the top-level group and empty its rules
				const rootGroup = { ...prev[0], rules: [] };
				return [rootGroup];
			});
			setQuery(""); // Reset the query string
		};
		const helpText =
			!doesFrameExist && cell.parameters.targetCell.id
				? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying filter.`
				: "";
		const getOperatorsForField = (fieldName: string) => {
			const field = selectedFrameHeaders.find(
				(h) => h.name === fieldName,
			);
			if (!field) return []; // fallback if field not found
			return field.type === "NUMBER" ? numberOperators : stringOperators;
		};
		const onDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			const sourceGroupId = parseFloat(result.source.droppableId);
			const destGroupId = parseFloat(result.destination.droppableId);
			const sourceIndex = result.source.index;
			const destIndex = result.destination.index;
			if (sourceGroupId !== destGroupId) return; // only allow reordering within the same group
			setRuleGroups((prev) => {
				const updated = [...prev];
				const group = findGroupById(updated, sourceGroupId);
				if (!group) return prev;
				const rules = [...group.rules];
				const [movedRule] = rules.splice(sourceIndex, 1);
				rules.splice(destIndex, 0, movedRule);
				group.rules = rules;
				const newQuery = buildQuery(updated);
				setQuery(newQuery); // Update query immediately
				return [...updated];
			});
		};
		const findGroupById = (
			groups: RuleGroup[],
			groupId: number,
		): RuleGroup | undefined => {
			for (const group of groups) {
				if (group.id === groupId) return group;
				for (const rule of group.rules) {
					if ("condition" in rule) {
						const found = findGroupById([rule], groupId);
						if (found) return found;
					}
				}
			}
			return undefined;
		};
		const renderRules = (group: RuleGroup, parentId?: number) => {
			return (
				<div
					key={group.id}
					className="relative m-2.5 border-2 border-border border-dashed p-2.5"
				>
					<div className="flex w-full">
						{/* Condition selector */}
						{group.rules.length > 1 && (
							<Select
								value={group.condition}
								onValueChange={(newCondition: "AND" | "OR") => {
									handleConditionChange(
										group.id,
										newCondition,
									);
									setRuleGroups((prev) =>
										updateRules(
											prev,
											group.id,
											(rules) => rules,
											newCondition,
										),
									);
								}}
							>
								<SelectTrigger className="h-8 w-20 shrink-0">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="AND">AND</SelectItem>
									<SelectItem value="OR">OR</SelectItem>
								</SelectContent>
							</Select>
						)}
						{/* Render Rules with DragDropContext */}
						<DragDropContext onDragEnd={onDragEnd}>
							<Droppable droppableId={group.id.toString()}>
								{(provided) => (
									<div
										className="w-full"
										ref={provided.innerRef}
										{...provided.droppableProps}
									>
										{group.rules.map((rule, index) =>
											"condition" in rule ? (
												<div key={rule.id}>
													{renderRules(
														rule,
														group.id,
													)}
												</div>
											) : (
												<Draggable
													key={rule.id}
													draggableId={rule.id.toString()}
													index={index}
												>
													{(provided) => (
														<div
															ref={
																provided.innerRef
															}
															{...provided.draggableProps}
															style={{
																display: "flex",
																gap: "8px",
																padding:
																	"12px 16px",
																alignItems:
																	"center",
																...provided
																	.draggableProps
																	.style,
															}}
														>
															{/* Header Select */}
															<Select
																disabled={
																	cell.isLoading
																}
																defaultValue={
																	rule.field
																}
																onValueChange={(
																	value,
																) => {
																	updateRuleValue(
																		group.id,
																		rule.id,
																		"field",
																		value,
																	);
																}}
															>
																<SelectTrigger className="min-w-0 flex-1">
																	<SelectValue placeholder="Select Header" />
																</SelectTrigger>
																<SelectContent>
																	{selectedFrameHeaders.map(
																		(
																			framelist,
																		) => (
																			<SelectItem
																				key={
																					framelist.name
																				}
																				value={
																					framelist.name ??
																					""
																				}
																			>
																				{framelist.name ??
																					""}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
															{/* Operator Select */}
															<Select
																disabled={
																	cell.isLoading
																}
																value={
																	rule.operator
																}
																onValueChange={(
																	value,
																) => {
																	updateRuleValue(
																		group.id,
																		rule.id,
																		"operator",
																		value,
																	);
																}}
															>
																<SelectTrigger className="min-w-0 flex-1">
																	<SelectValue placeholder="Select Operator" />
																</SelectTrigger>
																<SelectContent>
																	{getOperatorsForField(
																		rule.field,
																	).map(
																		(
																			op,
																		) => (
																			<SelectItem
																				key={
																					op.value
																				}
																				value={
																					op.value
																				}
																			>
																				{
																					op.label
																				}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
															{/* Value multi-select via checkboxes in a dropdown */}
															<div className="relative min-w-0 flex-1">
																<div className="max-h-[120px] overflow-y-auto rounded-md border border-input px-3 py-2 text-sm">
																	{(
																		valueOptionsMap[
																			rule
																				.field
																		] ?? []
																	).length ===
																	0 ? (
																		<span className="text-muted-foreground text-xs">
																			Select
																			Data
																		</span>
																	) : (
																		(
																			valueOptionsMap[
																				rule
																					.field
																			] ??
																			[]
																		).map(
																			(
																				option,
																			) => {
																				const isChecked =
																					Array.isArray(
																						rule.value,
																					)
																						? (
																								rule.value as (
																									| string
																									| number
																								)[]
																							).includes(
																								option as
																									| string
																									| number,
																							)
																						: false;
																				return (
																					// biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input
																					<label
																						key={String(
																							option,
																						)}
																						className="flex cursor-pointer items-center gap-2 py-0.5"
																					>
																						<Checkbox
																							checked={
																								isChecked
																							}
																							onCheckedChange={(
																								checked,
																							) => {
																								const current =
																									Array.isArray(
																										rule.value,
																									)
																										? [
																												...(rule.value as (
																													| string
																													| number
																												)[]),
																											]
																										: [];
																								const newVal =
																									checked
																										? [
																												...current,
																												option,
																											]
																										: current.filter(
																												(
																													v,
																												) =>
																													v !==
																													option,
																											);
																								updateRuleValue(
																									group.id,
																									rule.id,
																									"value",
																									newVal as (
																										| string
																										| number
																									)[],
																								);
																							}}
																						/>
																						<span className="text-sm">
																							{String(
																								option,
																							)}
																						</span>
																					</label>
																				);
																			},
																		)
																	)}
																</div>
															</div>
															<div
																{...provided.dragHandleProps}
															>
																<GripVertical
																	style={{
																		cursor: "grab",
																		color: "#888",
																	}}
																/>
															</div>
															{/* Delete Icon */}
															<Trash2
																style={{
																	marginBottom:
																		"7px",
																}}
																onClick={() =>
																	removeRuleOrGroup(
																		group.id,
																		rule.id,
																	)
																}
															/>
														</div>
													)}
												</Draggable>
											),
										)}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					</div>
					{/* Action buttons */}
					<div>
						{parentId === undefined && (
							<div className="mt-1.5 flex gap-2.5">
								<Button onClick={() => addRule(group.id)}>
									+ Add Rule
								</Button>
								<Button
									onClick={() => addNestedGroup(group.id)}
								>
									+ Add Nested Rule
								</Button>
							</div>
						)}
						{parentId !== undefined && (
							<div className="mt-1.5 mr-[15px] flex justify-end gap-2.5">
								<Button onClick={() => addRule(group.id)}>
									+ Add Rule
								</Button>
								<Button
									onClick={() => addNestedGroup(group.id)}
								>
									+ Add Nested Rule
								</Button>
								<Trash2
									style={{ marginTop: "5px" }}
									onClick={() =>
										removeRuleOrGroup(parentId, group.id)
									}
								/>
							</div>
						)}
					</div>
				</div>
			);
		};
		return (
			<div className="relative w-full">
				<div className="flex flex-col gap-1">
					<div className="pr-2.5 pb-5 pl-5">
						<Select
							disabled={cell.isLoading}
							value={selectedFrame ?? ""}
							onValueChange={(value) =>
								handleFrameSelected(value)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Frame" />
							</SelectTrigger>
							<SelectContent>
								{framelist.map((f) => (
									<SelectItem key={f} value={f}>
										{f}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						{doesFrameExist &&
							ruleGroups.map((group) => renderRules(group))}
					</div>
					<div className="w-full py-0.75">
						<p className="text-muted-foreground text-xs">
							<em>{helpText}</em>
						</p>
					</div>
				</div>
			</div>
		);
	},
);
