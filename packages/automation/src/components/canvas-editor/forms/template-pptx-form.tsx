import { MousePointerClick, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	PptxChartSeries,
	TemplatePptxConfig,
	TemplatePptxReplacement,
} from "../../../domain/automation-workflow.types";
import { BoundInput } from "./pill-input";

export interface PptxShapePayload {
	shapeName: string;
	shapeType: string;
}

/** A shape-selection event stamped with a token so selecting the same shape
 *  twice fires the effect a second time. */
export interface PptxShapeSelection {
	shapeName: string;
	shapeType: string;
	/** Monotonically increasing; bumped on every selection event. */
	token: number;
}

export interface TemplatePptxFormProps {
	config: TemplatePptxConfig;
	upstreamVars: string[];
	onChange: (c: TemplatePptxConfig) => void;
	/** Set by the host when a shape is selected in the PPTX panel. The form
	 *  adds it as a replacement when pick mode is active. */
	pptxShapeSelection?: PptxShapeSelection | null;
	readOnly?: boolean;
}

function deriveReplacementType(
	shapeType: string,
): TemplatePptxReplacement["type"] {
	const t = shapeType.toLowerCase();
	if (t.includes("image") || t.includes("picture")) return "image";
	if (t.includes("chart")) return "chart";
	return "text";
}

function makeDefaultReplacement(
	shapeName: string,
	type: TemplatePptxReplacement["type"],
): TemplatePptxReplacement {
	if (type === "chart") {
		return { shapeName, type: "chart", categories: [], series: [] };
	}
	return { shapeName, type, value: "" };
}

/** Serializes one replacement into the pixel payload object. */
function serializeReplacement(r: TemplatePptxReplacement): object {
	if (r.type === "chart") {
		return {
			type: "chart",
			categories: r.categories,
			series: r.series,
		};
	}
	return { type: r.type, value: r.value };
}

/** Builds the TemplatePPTX pixel string for preview. */
function buildPixelPreview(config: TemplatePptxConfig): string {
	if (!config.templateFile) return "";
	const payload: Record<string, object> = {};
	for (const r of config.replacements) {
		payload[r.shapeName] = serializeReplacement(r);
	}
	const payloadJson = JSON.stringify(payload, null, 2);
	return `TemplatePPTX(template_file=["${config.templateFile}"], payload=["<encode>${payloadJson}</encode>"], fileName=["output.pptx"]);`;
}

// ---------------------------------------------------------------------------
// Chart sub-editor
// ---------------------------------------------------------------------------

let nextSeriesKey = 0;

interface ChartEditorProps {
	categories: string[];
	series: PptxChartSeries[];
	readOnly: boolean;
	onCategoriesChange: (cats: string[]) => void;
	onSeriesChange: (series: PptxChartSeries[]) => void;
}

function ChartEditor({
	categories,
	series,
	readOnly,
	onCategoriesChange,
	onSeriesChange,
}: ChartEditorProps) {
	// Series have no id and their names are editable and non-unique, so keep a
	// parallel list of stable keys that follows adds and removals.
	const seriesKeysRef = useRef<string[]>([]);
	while (seriesKeysRef.current.length < series.length) {
		seriesKeysRef.current.push(`series-${nextSeriesKey++}`);
	}
	seriesKeysRef.current.length = series.length;

	const addSeries = () => {
		onSeriesChange([...series, { name: "", values: [] }]);
	};

	const removeSeries = (idx: number) => {
		seriesKeysRef.current = seriesKeysRef.current.filter(
			(_, i) => i !== idx,
		);
		onSeriesChange(series.filter((_, i) => i !== idx));
	};

	const updateSeriesName = (idx: number, name: string) => {
		onSeriesChange(series.map((s, i) => (i === idx ? { ...s, name } : s)));
	};

	const updateSeriesValues = (idx: number, raw: string) => {
		const values = raw
			.split(",")
			.map((v) => Number(v.trim()))
			.filter((v) => !Number.isNaN(v));
		onSeriesChange(
			series.map((s, i) => (i === idx ? { ...s, values } : s)),
		);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-1">
				<span className="text-[11px] text-muted-foreground">
					Categories (comma-separated)
				</span>
				<Input
					className="h-7 text-xs"
					value={categories.join(", ")}
					placeholder="Q1, Q2, Q3, Q4"
					disabled={readOnly}
					onChange={(e) =>
						onCategoriesChange(
							e.target.value
								.split(",")
								.map((v) => v.trim())
								.filter(Boolean),
						)
					}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<span className="text-[11px] text-muted-foreground">
					Series
				</span>
				{series.map((s, idx) => (
					<div
						key={seriesKeysRef.current[idx]}
						className="flex items-center gap-1.5"
					>
						<Input
							className="h-7 w-28 shrink-0 text-xs"
							value={s.name}
							placeholder="Series name"
							disabled={readOnly}
							onChange={(e) =>
								updateSeriesName(idx, e.target.value)
							}
						/>
						<Input
							className="h-7 min-w-0 flex-1 text-xs"
							value={s.values.join(", ")}
							placeholder="5.1, 5.8, 6.9, 7.7"
							disabled={readOnly}
							onChange={(e) =>
								updateSeriesValues(idx, e.target.value)
							}
						/>
						{!readOnly && (
							<button
								type="button"
								className="text-muted-foreground transition-colors hover:text-destructive"
								onClick={() => removeSeries(idx)}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				))}
				{!readOnly && (
					<Button
						variant="outline"
						size="sm"
						className="h-7 self-start text-xs"
						onClick={addSeries}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add series
					</Button>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function TemplatePptxForm({
	config,
	upstreamVars,
	onChange,
	pptxShapeSelection,
	readOnly = false,
}: TemplatePptxFormProps) {
	const [pickMode, setPickMode] = useState(false);
	const pickModeRef = useRef(pickMode);
	pickModeRef.current = pickMode;

	const configRef = useRef(config);
	configRef.current = config;
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		if (!pptxShapeSelection || !pickModeRef.current || readOnly) return;
		const { shapeName, shapeType } = pptxShapeSelection;
		const c = configRef.current;
		if (c.replacements.some((r) => r.shapeName === shapeName)) return;
		onChangeRef.current({
			...c,
			replacements: [
				...c.replacements,
				makeDefaultReplacement(
					shapeName,
					deriveReplacementType(shapeType),
				),
			],
		});
	}, [pptxShapeSelection, readOnly]);

	const changeType = (
		index: number,
		type: TemplatePptxReplacement["type"],
	) => {
		if (readOnly) return;
		const next = config.replacements.map((existing, i) =>
			i === index
				? makeDefaultReplacement(existing.shapeName, type)
				: existing,
		);
		onChange({ ...config, replacements: next });
	};

	const updateValue = (index: number, value: string) => {
		if (readOnly) return;
		const next = config.replacements.map((r, i) =>
			i === index && (r.type === "text" || r.type === "image")
				? { ...r, value }
				: r,
		);
		onChange({ ...config, replacements: next });
	};

	const updateChartCategories = (index: number, categories: string[]) => {
		if (readOnly) return;
		const next = config.replacements.map((r, i) =>
			i === index && r.type === "chart" ? { ...r, categories } : r,
		);
		onChange({ ...config, replacements: next });
	};

	const updateChartSeries = (index: number, series: PptxChartSeries[]) => {
		if (readOnly) return;
		const next = config.replacements.map((r, i) =>
			i === index && r.type === "chart" ? { ...r, series } : r,
		);
		onChange({ ...config, replacements: next });
	};

	const removeReplacement = (index: number) => {
		if (readOnly) return;
		onChange({
			...config,
			replacements: config.replacements.filter((_, i) => i !== index),
		});
	};

	const pixelPreview = buildPixelPreview(config);

	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Template File"
				required
				value={config.templateFile}
				placeholder="path/to/template.pptx"
				description="Path to the .pptx file in the insight folder."
				onChange={(v) => onChange({ ...config, templateFile: v })}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
			/>

			<Field>
				<FieldLabel>Shape Replacements</FieldLabel>
				<FieldDescription>
					Open the PPTX file in a panel, then click{" "}
					<strong>Pick Shapes</strong> and select shapes to configure.
				</FieldDescription>

				{!readOnly && (
					<Button
						variant={pickMode ? "default" : "outline"}
						size="sm"
						className="mt-1 flex items-center gap-1.5 self-start text-xs"
						onClick={() => setPickMode((v) => !v)}
					>
						<MousePointerClick className="h-3.5 w-3.5" />
						{pickMode ? "Picking — click a shape" : "Pick Shapes"}
					</Button>
				)}

				{config.replacements.length === 0 ? (
					<p className="mt-2 text-[11px] text-muted-foreground">
						No shapes selected. Use Pick Shapes to add replacements.
					</p>
				) : (
					<div className="mt-2 flex flex-col gap-3">
						{config.replacements.map((r, i) => (
							<div
								key={r.shapeName}
								className="rounded-lg border bg-muted/30 p-3"
							>
								<div className="mb-2 flex items-center justify-between">
									<span className="font-mono text-[11px] text-foreground">
										{r.shapeName}
									</span>
									{!readOnly && (
										<button
											type="button"
											className="text-muted-foreground transition-colors hover:text-destructive"
											onClick={() => removeReplacement(i)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									)}
								</div>

								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<span className="w-10 shrink-0 text-[11px] text-muted-foreground">
											Type
										</span>
										<Select
											value={r.type}
											onValueChange={(v: string) =>
												changeType(
													i,
													v as TemplatePptxReplacement["type"],
												)
											}
											disabled={readOnly}
										>
											<SelectTrigger className="h-7 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="text">
													Text
												</SelectItem>
												<SelectItem value="image">
													Image
												</SelectItem>
												<SelectItem value="chart">
													Chart
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{r.type === "chart" ? (
										<ChartEditor
											categories={r.categories}
											series={r.series}
											readOnly={readOnly}
											onCategoriesChange={(cats) =>
												updateChartCategories(i, cats)
											}
											onSeriesChange={(s) =>
												updateChartSeries(i, s)
											}
										/>
									) : (
										<BoundInput
											label="Value"
											value={r.value}
											placeholder={
												r.type === "image"
													? "path/to/image.png"
													: "Replacement text"
											}
											onChange={(v) => updateValue(i, v)}
											upstreamVars={upstreamVars}
											readOnly={readOnly}
										/>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</Field>

			{pixelPreview && (
				<div className="rounded-lg border bg-muted/30 px-3 py-2">
					<p className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
						Generated Pixel
					</p>
					<pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] text-foreground/70">
						{pixelPreview}
					</pre>
				</div>
			)}
		</div>
	);
}
