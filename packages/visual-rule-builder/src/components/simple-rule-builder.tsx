import type { Edge, Node } from "@xyflow/react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@semoss/ui/next";

interface SimpleRuleBuilderProps {
	onGenerateNodes: (nodes: Node[], edges: Edge[]) => void;
	onShowVisual: () => void;
	initialConfig?: RuleConfig | null;
}

interface Condition {
	id: string;
	field: string;
	operator: string;
	value: string;
}

interface RuleConfig {
	conditions: Condition[];
	logic: "AND" | "OR";
	thenResult: string;
	elseResult: string;
}

const OPERATORS = [
	{ value: "==", label: "Equals (==)" },
	{ value: "!=", label: "Not Equals (!=)" },
	{ value: ">", label: "Greater Than (>)" },
	{ value: "<", label: "Less Than (<)" },
	{ value: ">=", label: "Greater or Equal (>=)" },
	{ value: "<=", label: "Less or Equal (<=)" },
];

const DEFAULT_CONFIG: RuleConfig = {
	conditions: [
		{ id: "cond-1", field: "status", operator: "==", value: '"active"' },
	],
	logic: "AND",
	thenResult: '"Approved"',
	elseResult: '"Rejected"',
};

export function SimpleRuleBuilder({
	onGenerateNodes,
	onShowVisual,
	initialConfig,
}: SimpleRuleBuilderProps) {
	const thenResultId = useId();
	const elseResultId = useId();
	const [config, setConfig] = useState<RuleConfig>(DEFAULT_CONFIG);

	// Update config when initialConfig changes (e.g., when loading a rule)
	useEffect(() => {
		if (initialConfig) {
			setConfig(initialConfig);
		} else {
			// Reset to default when no config provided
			setConfig(DEFAULT_CONFIG);
		}
	}, [initialConfig]);

	const addCondition = () => {
		const newCondition: Condition = {
			id: `cond-${Date.now()}`,
			field: "field_name",
			operator: "==",
			value: '"value"',
		};
		setConfig((prev) => ({
			...prev,
			conditions: [...prev.conditions, newCondition],
		}));
	};

	const removeCondition = (id: string) => {
		setConfig((prev) => ({
			...prev,
			conditions: prev.conditions.filter((c) => c.id !== id),
		}));
	};

	const updateCondition = (
		id: string,
		field: keyof Condition,
		value: string,
	) => {
		setConfig((prev) => ({
			...prev,
			conditions: prev.conditions.map((c) =>
				c.id === id ? { ...c, [field]: value } : c,
			),
		}));
	};

	const generateNodesAndEdges = () => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		let yOffset = 50;
		const xSpacing = 250;

		// Create condition nodes
		const conditionNodeIds: string[] = [];

		config.conditions.forEach((condition) => {
			// Create field value node (no "var." prefix - just the field name)
			const fieldNodeId = `field-${condition.id}`;
			nodes.push({
				id: fieldNodeId,
				type: "value",
				position: { x: 50, y: yOffset },
				data: { label: condition.field },
			});

			// Create comparison value node
			const valueNodeId = `value-${condition.id}`;
			nodes.push({
				id: valueNodeId,
				type: "value",
				position: { x: 50, y: yOffset + 60 },
				data: { label: condition.value },
			});

			// Create operator node
			const operatorNodeId = `op-${condition.id}`;
			nodes.push({
				id: operatorNodeId,
				type: "operator",
				position: { x: xSpacing, y: yOffset + 30 },
				data: {
					label: condition.operator, // Use symbol (==, !=, etc.)
				},
			});

			// Connect operator to field and value (edges go FROM operator TO operands)
			edges.push({
				id: `edge-field-${condition.id}`,
				source: operatorNodeId,
				target: fieldNodeId,
			});
			edges.push({
				id: `edge-value-${condition.id}`,
				source: operatorNodeId,
				target: valueNodeId,
			});

			conditionNodeIds.push(operatorNodeId);
			yOffset += 140;
		});

		// If multiple conditions, create AND/OR node
		let finalConditionNodeId: string;
		if (config.conditions.length > 1) {
			const logicNodeId = "logic-node";
			const logicYPos = 50 + (config.conditions.length * 140) / 2 - 30;
			nodes.push({
				id: logicNodeId,
				type: "operator",
				position: { x: xSpacing * 2, y: logicYPos },
				data: { label: config.logic.toUpperCase() }, // Use uppercase AND/OR to match parser
			});

			// Connect operators to logic node (edges go FROM logic TO each operator)
			conditionNodeIds.forEach((opId) => {
				edges.push({
					id: `edge-logic-${opId}`,
					source: logicNodeId,
					target: opId,
				});
			});

			finalConditionNodeId = logicNodeId;
		} else {
			finalConditionNodeId = conditionNodeIds[0];
		}

		// Create result nodes
		const thenResultId = "result-then";
		const elseResultId = "result-else";

		const finalConditionNode = nodes.find(
			(n) => n.id === finalConditionNodeId,
		);
		const resultYBase = finalConditionNode
			? finalConditionNode.position.y
			: 100;

		nodes.push({
			id: thenResultId,
			type: "result",
			position: {
				x: config.conditions.length > 1 ? xSpacing * 3 : xSpacing * 2,
				y: resultYBase - 40,
			},
			data: { label: config.thenResult },
		});

		nodes.push({
			id: elseResultId,
			type: "result",
			position: {
				x: config.conditions.length > 1 ? xSpacing * 3 : xSpacing * 2,
				y: resultYBase + 40,
			},
			data: { label: config.elseResult },
		});

		// Connect final condition to results
		edges.push({
			id: "edge-then",
			source: finalConditionNodeId,
			target: thenResultId,
			label: "true",
		});
		edges.push({
			id: "edge-else",
			source: finalConditionNodeId,
			target: elseResultId,
			label: "else",
		});

		onGenerateNodes(nodes, edges);
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex-1 space-y-6 overflow-y-auto p-6">
				<div className="space-y-2">
					<h2 className="font-semibold text-2xl">
						Simple Rule Builder
					</h2>
					<p className="text-muted-foreground text-sm">
						Build your rule using a form, then view it as a visual
						graph
					</p>
				</div>

				{/* Conditions Section */}
				<div className="space-y-4 rounded-lg border bg-card p-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-lg">
								Conditions
							</h3>
							<p className="text-muted-foreground text-sm">
								Define what to check
							</p>
						</div>
						<Button size="sm" onClick={addCondition}>
							<Plus className="mr-2 h-4 w-4" />
							Add Condition
						</Button>
					</div>

					{config.conditions.map((condition, index) => (
						<div
							key={condition.id}
							className="space-y-3 rounded-lg border bg-muted/30 p-4"
						>
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">
									Condition {index + 1}
								</span>
								{config.conditions.length > 1 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											removeCondition(condition.id)
										}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								)}
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div>
									<label
										htmlFor={`field-${condition.id}`}
										className="mb-1 block text-sm"
									>
										Field Name
									</label>
									<input
										id={`field-${condition.id}`}
										type="text"
										value={condition.field}
										onChange={(e) =>
											updateCondition(
												condition.id,
												"field",
												e.target.value,
											)
										}
										className="w-full rounded-md border bg-background px-3 py-2 text-sm"
										placeholder="e.g. status, age"
									/>
									<p className="mt-1 text-muted-foreground text-xs">
										Variable from your data
									</p>
								</div>

								<div>
									<label
										htmlFor={`operator-${condition.id}`}
										className="mb-1 block text-sm"
									>
										Operator
									</label>
									<select
										id={`operator-${condition.id}`}
										value={condition.operator}
										onChange={(e) =>
											updateCondition(
												condition.id,
												"operator",
												e.target.value,
											)
										}
										className="w-full rounded-md border bg-background px-3 py-2 text-sm"
									>
										{OPERATORS.map((op) => (
											<option
												key={op.value}
												value={op.value}
											>
												{op.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label
										htmlFor={`value-${condition.id}`}
										className="mb-1 block text-sm"
									>
										Value
									</label>
									<input
										id={`value-${condition.id}`}
										type="text"
										value={condition.value}
										onChange={(e) =>
											updateCondition(
												condition.id,
												"value",
												e.target.value,
											)
										}
										className="w-full rounded-md border bg-background px-3 py-2 text-sm"
										placeholder='"active", 18, etc.'
									/>
									<p className="mt-1 text-muted-foreground text-xs">
										Use "quotes" for text
									</p>
								</div>
							</div>
						</div>
					))}

					{/* Logic selector for multiple conditions */}
					{config.conditions.length > 1 && (
						<div className="rounded-lg border bg-blue-50 p-4">
							<div className="mb-2 block font-medium text-sm">
								How should conditions be combined?
							</div>
							<div className="flex gap-4">
								<label className="flex items-center gap-2">
									<input
										type="radio"
										name="logic"
										value="AND"
										checked={config.logic === "AND"}
										onChange={(e) =>
											setConfig((prev) => ({
												...prev,
												logic: e.target.value as
													| "AND"
													| "OR",
											}))
										}
										className="h-4 w-4"
									/>
									<div>
										<span className="font-medium text-sm">
											AND
										</span>
										<p className="text-muted-foreground text-xs">
											All conditions must be true
										</p>
									</div>
								</label>
								<label className="flex items-center gap-2">
									<input
										type="radio"
										name="logic"
										value="OR"
										checked={config.logic === "OR"}
										onChange={(e) =>
											setConfig((prev) => ({
												...prev,
												logic: e.target.value as
													| "AND"
													| "OR",
											}))
										}
										className="h-4 w-4"
									/>
									<div>
										<span className="font-medium text-sm">
											OR
										</span>
										<p className="text-muted-foreground text-xs">
											Any condition can be true
										</p>
									</div>
								</label>
							</div>
						</div>
					)}
				</div>

				{/* Results Section */}
				<div className="space-y-4 rounded-lg border bg-card p-4">
					<div>
						<h3 className="font-semibold text-lg">Results</h3>
						<p className="text-muted-foreground text-sm">
							Define what to return
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor={thenResultId}
								className="font-medium text-sm"
							>
								When TRUE (conditions pass)
							</label>
							<input
								id={thenResultId}
								type="text"
								value={config.thenResult}
								onChange={(e) =>
									setConfig((prev) => ({
										...prev,
										thenResult: e.target.value,
									}))
								}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm"
								placeholder='"Approved", 100, etc.'
							/>
							<p className="text-muted-foreground text-xs">
								Returned when all conditions match
							</p>
						</div>

						<div className="space-y-2">
							<label
								htmlFor={elseResultId}
								className="font-medium text-sm"
							>
								When FALSE (conditions fail)
							</label>
							<input
								id={elseResultId}
								type="text"
								value={config.elseResult}
								onChange={(e) =>
									setConfig((prev) => ({
										...prev,
										elseResult: e.target.value,
									}))
								}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm"
								placeholder='"Rejected", 0, etc.'
							/>
							<p className="text-muted-foreground text-xs">
								Returned when conditions don't match
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4">
				<div className="text-sm">
					<p className="font-medium">Ready to visualize?</p>
					<p className="text-muted-foreground text-xs">
						Click below to generate your rule graph
					</p>
				</div>
				<Button
					size="lg"
					onClick={() => {
						generateNodesAndEdges();
						onShowVisual();
					}}
					className="gap-2"
				>
					<Eye className="h-4 w-4" />
					Generate & View Graph
				</Button>
			</div>
		</div>
	);
}
