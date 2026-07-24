import { Plus, Trash2 } from "lucide-react";
import { Checkbox, Input, Select } from "@/components/ui";
import type { ColorRule, KpiColorRule } from "@/types/dashboard";
import { ColorPicker } from "./ColorPicker";
import { ResetButton } from "./ResetButton";

interface ColorByValueProps {
	columns: string[];
	visualizationType:
		| "table"
		| "kpi"
		| "pivot"
		| "wordcloud"
		| "bubble"
		| "bar"
		| "line"
		| "pie"
		| "puck";
	value: ColorRule[] | KpiColorRule[];
	onChange: (rules: ColorRule[] | KpiColorRule[]) => void;
	onReset: () => void;
	/** Unique values per column derived from query rows — drives the value input dropdown suggestions. */
	columnValues?: Record<string, string[]>;
	/**
	 * KPI only: when set, every rule is fixed to this metric column and the
	 * per-rule metric selector is hidden. Used by the per-card KPI editor so a
	 * KPI's color rules are scoped to a single card (mirrors the title tool).
	 */
	fixedMetricColumn?: string;
}

export function ColorByValue({
	columns,
	visualizationType,
	value,
	onChange,
	onReset,
	columnValues,
	fixedMetricColumn,
}: ColorByValueProps) {
	// Pivot, Word Cloud, Bubble, Bar, Line, and Pie reuse the table rule shape
	// (ColorRule). The only difference is the rendered config UI: only `table`
	// shows the "Color entire row" toggle.
	const isTableShape =
		visualizationType === "table" ||
		visualizationType === "pivot" ||
		visualizationType === "wordcloud" ||
		visualizationType === "bubble" ||
		visualizationType === "bar" ||
		visualizationType === "line" ||
		visualizationType === "pie" ||
		visualizationType === "puck";
	const addRule = () => {
		if (isTableShape) {
			const newRule: ColorRule = {
				id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				targetColumn: columns[0] || "",
				color: "#fef3c7",
				colorEntireRow: false,
				valueColumn: columns[0] || "",
				comparator: "eq",
				value: "",
			};
			onChange([...value, newRule] as ColorRule[]);
		} else {
			const newRule: KpiColorRule = {
				id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				metricColumn: fixedMetricColumn || columns[0] || "",
				comparator: "gt",
				value: 0,
				color: "#fef3c7",
				applyTo: "background",
			};
			onChange([...value, newRule] as KpiColorRule[]);
		}
	};

	const updateRule = (
		id: string,
		updates: Partial<ColorRule | KpiColorRule>,
	) => {
		onChange(
			value.map((rule) =>
				rule.id === id ? { ...rule, ...updates } : rule,
			) as any,
		);
	};

	const deleteRule = (id: string) => {
		onChange(value.filter((rule) => rule.id !== id) as any);
	};

	return (
		<div className="space-y-4">
			<button
				type="button"
				onClick={addRule}
				className="inline-flex w-full items-center justify-center gap-2 rounded bg-indigo-50 px-4 py-2 font-semibold text-indigo-600 text-sm transition-colors hover:bg-indigo-100 hover:text-indigo-700"
			>
				<Plus className="h-4 w-4" />
				Add Rule
			</button>

			{value.length === 0 && (
				<p className="py-4 text-center text-stone-400 text-xs">
					No color rules defined
				</p>
			)}

			{value.map((rule) => {
				const isTable = isTableShape;
				const tableRule = isTable ? (rule as ColorRule) : null;
				const kpiRule = !isTable ? (rule as KpiColorRule) : null;

				return (
					<div
						key={rule.id}
						className="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
					>
						{/* Column to Color — hidden for KPI per-card mode (metric is fixed) */}
						<div
							className={
								!isTable && fixedMetricColumn ? "hidden" : ""
							}
						>
							<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
								{isTable
									? "Select Column to Color"
									: "Select KPI Metric"}
							</label>
							<Select
								value={
									isTable
										? tableRule!.targetColumn
										: kpiRule!.metricColumn
								}
								onChange={(e) =>
									updateRule(
										rule.id,
										isTable
											? { targetColumn: e.target.value }
											: { metricColumn: e.target.value },
									)
								}
								className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							>
								{columns.map((col) => (
									<option key={col} value={col}>
										{col}
									</option>
								))}
							</Select>
						</div>

						{/* Color */}
						<ColorPicker
							label="Color"
							value={rule.color}
							onChange={(color) => updateRule(rule.id, { color })}
							defaultColor="#fef3c7"
						/>

						{/* Comparator Section */}
						<div className="space-y-3 border-stone-100 border-t pt-2">
							<p className="font-semibold text-stone-600 text-xs">
								When
							</p>

							{/* Select Column of Values (Table only) */}
							{isTable && (
								<div>
									<label className="mb-1.5 block text-stone-500 text-xs">
										Select Column of Values
									</label>
									<Select
										value={tableRule!.valueColumn}
										onChange={(e) =>
											updateRule(rule.id, {
												valueColumn: e.target.value,
											})
										}
										className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
									>
										{columns.map((col) => (
											<option key={col} value={col}>
												{col}
											</option>
										))}
									</Select>
								</div>
							)}

							{/* Select Comparator */}
							<div>
								<label className="mb-1.5 block text-stone-500 text-xs">
									Select Comparator
								</label>
								<Select
									value={rule.comparator}
									onChange={(e) =>
										updateRule(rule.id, {
											comparator: e.target.value as any,
											maxValue:
												e.target.value === "range"
													? 0
													: undefined,
										})
									}
									className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								>
									{isTable ? (
										<>
											<option value="eq">equals</option>
											<option value="neq">
												not equals
											</option>
											<option value="gt">
												greater than
											</option>
											<option value="lt">
												less than
											</option>
											<option value="gte">
												greater or equal
											</option>
											<option value="lte">
												less or equal
											</option>
											<option value="contains">
												contains
											</option>
										</>
									) : (
										<>
											<option value="gt">
												greater than
											</option>
											<option value="lt">
												less than
											</option>
											<option value="gte">
												greater or equal
											</option>
											<option value="lte">
												less or equal
											</option>
											<option value="eq">equals</option>
											<option value="neq">
												not equals
											</option>
											<option value="range">
												between (range)
											</option>
										</>
									)}
								</Select>
							</div>

							{/* Select Value(s) */}
							<div>
								<label className="mb-1.5 block text-stone-500 text-xs">
									{rule.comparator === "range"
										? "Min Value"
										: "Select Value"}
								</label>
								{isTable &&
								columnValues?.[tableRule!.valueColumn]
									?.length ? (
									<datalist id={`colvals-${rule.id}`}>
										{columnValues[
											tableRule!.valueColumn
										].map((v) => (
											<option key={v} value={v} />
										))}
									</datalist>
								) : null}
								<Input
									type="text"
									value={rule.value}
									list={
										isTable &&
										columnValues?.[tableRule!.valueColumn]
											?.length
											? `colvals-${rule.id}`
											: undefined
									}
									onChange={(e) => {
										const val = e.target.value;
										if (
											!isTable ||
											(tableRule!.comparator !==
												"contains" &&
												tableRule!.comparator !==
													"eq" &&
												tableRule!.comparator !== "neq")
										) {
											const numVal = parseFloat(val);
											updateRule(rule.id, {
												value: isNaN(numVal)
													? val
													: numVal,
											});
										} else {
											updateRule(rule.id, { value: val });
										}
									}}
									placeholder="Enter value"
									className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								/>
							</div>

							{/* Max Value (for range comparator in KPI) */}
							{!isTable && kpiRule!.comparator === "range" && (
								<div>
									<label className="mb-1.5 block text-stone-500 text-xs">
										Max Value
									</label>
									<Input
										type="number"
										value={kpiRule!.maxValue || 0}
										onChange={(e) =>
											updateRule(rule.id, {
												maxValue:
													parseFloat(
														e.target.value,
													) || 0,
											})
										}
										placeholder="Enter max value"
										className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
									/>
								</div>
							)}
						</div>

						{/* Apply Color To (visualization-specific) */}
						{visualizationType !== "pivot" &&
							visualizationType !== "wordcloud" &&
							visualizationType !== "bubble" &&
							visualizationType !== "bar" &&
							visualizationType !== "line" &&
							visualizationType !== "pie" && (
								<div className="border-stone-100 border-t pt-2">
									<label className="mb-2 block font-semibold text-stone-600 text-xs">
										Apply Color To
									</label>
									{isTable ? (
										<label className="flex cursor-pointer items-center gap-2">
											<Checkbox
												checked={
													tableRule!.colorEntireRow
												}
												onChange={(e) =>
													updateRule(rule.id, {
														colorEntireRow:
															e.target.checked,
													})
												}
											/>
											<span className="text-sm text-stone-700">
												Color entire row
											</span>
										</label>
									) : (
										<div className="space-y-2">
											{[
												"background",
												"value",
												"trend",
											].map((target) => (
												<label
													key={target}
													className="flex cursor-pointer items-center gap-2"
												>
													<input
														type="radio"
														name={`apply-to-${rule.id}`}
														value={target}
														checked={
															kpiRule!.applyTo ===
															target
														}
														onChange={(e) =>
															updateRule(
																rule.id,
																{
																	applyTo: e
																		.target
																		.value as
																		| "background"
																		| "value"
																		| "trend",
																},
															)
														}
														className="h-4 w-4 border-stone-300 text-indigo-600"
													/>
													<span className="text-sm text-stone-700 capitalize">
														{target}
													</span>
												</label>
											))}
										</div>
									)}
								</div>
							)}

						{/* Delete Button */}
						<button
							type="button"
							onClick={() => deleteRule(rule.id)}
							className="inline-flex w-full items-center justify-center gap-2 rounded px-3 py-1.5 font-semibold text-red-600 text-xs transition-colors hover:bg-red-50 hover:text-red-700"
						>
							<Trash2 className="h-3.5 w-3.5" />
							Delete Rule
						</button>
					</div>
				);
			})}

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
