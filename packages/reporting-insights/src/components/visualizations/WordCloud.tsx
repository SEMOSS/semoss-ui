import { Cloud } from "lucide-react";
import {
	type CSSProperties,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import WordCloudJS from "wordcloud";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	DEFAULT_WORDCLOUD_STYLING,
	type VisualizationConfig,
	type WordCloudShape,
} from "@/types/dashboard";

// Default categorical palette
const DEFAULT_PALETTE = [
	"#6366f1",
	"#0ea5e9",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
	"#f97316",
];

const FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";

// Aggregation helper
function aggregate(values: unknown[], aggregation: string): number {
	const nums = values.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
	switch (aggregation) {
		case "count":
			return values.length;
		case "countUnique":
			return new Set(values).size;
		case "sum":
			return nums.reduce((s, v) => s + v, 0);
		case "avg":
			return nums.length
				? nums.reduce((s, v) => s + v, 0) / nums.length
				: 0;
		case "min":
			return nums.length ? Math.min(...nums) : 0;
		case "max":
			return nums.length ? Math.max(...nums) : 0;
		default:
			return nums.reduce((s, v) => s + v, 0);
	}
}

// Aggregated word shape (one per unique label)
export interface WordCloudWord {
	label: string;
	sizeValue: number;
	tooltipValues?: Record<string, number | string>;
}

/** Aggregate raw rows into one word per unique value of the Words (xKey) column.
 *  Size aggregates the configured Size column per `columnAggregations` (default
 *  sum/count by type); when no Size column is configured the size value falls
 *  back to row count per word (a sensible default for word frequency). */
export function aggregateWordCloudData(
	data: Record<string, unknown>[],
	config: VisualizationConfig | undefined,
): WordCloudWord[] {
	const wordsKey = config?.xKey;
	const sizeKey = config?.yKeys?.[0];
	const tooltipEntries: Array<{ column: string; aggregation: string }> =
		config?.tooltips?.length
			? config.tooltips
			: config?.tooltip
				? [
						{
							column: config.tooltip,
							aggregation:
								config.tooltipAggregation ||
								config.columnAggregations?.[config.tooltip] ||
								"count",
						},
					]
				: [];
	if (!wordsKey) return [];

	const grouped = new Map<
		string,
		{
			label: string;
			sizeValues: unknown[];
			_tooltipValues: Record<string, unknown[]>;
			rowCount: number;
		}
	>();

	for (const row of data) {
		const label = String(row[wordsKey] ?? "").trim();
		if (!label) continue;
		const existing = grouped.get(label);
		if (existing) {
			if (sizeKey) existing.sizeValues.push(row[sizeKey]);
			for (const { column } of tooltipEntries) {
				if (!existing._tooltipValues[column])
					existing._tooltipValues[column] = [];
				existing._tooltipValues[column].push(row[column]);
			}
			existing.rowCount += 1;
		} else {
			const _tooltipValues: Record<string, unknown[]> = {};
			for (const { column } of tooltipEntries)
				_tooltipValues[column] = [row[column]];
			grouped.set(label, {
				label,
				sizeValues: sizeKey ? [row[sizeKey]] : [],
				_tooltipValues,
				rowCount: 1,
			});
		}
	}

	return Array.from(grouped.values()).map((g) => {
		const sizeAgg = sizeKey
			? config?.columnAggregations?.[sizeKey] || "sum"
			: undefined;
		const tooltipValues: Record<string, number | string> = {};
		for (const { column, aggregation } of tooltipEntries) {
			const vals = g._tooltipValues[column] ?? [];
			if (vals.length)
				tooltipValues[column] = aggregate(vals, aggregation);
		}
		return {
			label: g.label,
			sizeValue:
				sizeKey && sizeAgg
					? aggregate(g.sizeValues, sizeAgg)
					: g.rowCount,
			tooltipValues: Object.keys(tooltipValues).length
				? tooltipValues
				: undefined,
		};
	});
}

/** Compare a candidate value against a ColorRule. Mirrors the table evaluator. */
function compare(
	comparator: ColorRule["comparator"],
	candidate: unknown,
	target: string | number,
): boolean {
	if (candidate === undefined || candidate === null) return false;
	const candNum = Number(candidate);
	const targNum = Number(target);
	const candStr = String(candidate);
	const targStr = String(target);
	switch (comparator) {
		case "eq":
			return candStr === targStr;
		case "neq":
			return candStr !== targStr;
		case "gt":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum > targNum
			);
		case "lt":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum < targNum
			);
		case "gte":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum >= targNum
			);
		case "lte":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum <= targNum
			);
		case "contains":
			return candStr.toLowerCase().includes(targStr.toLowerCase());
		default:
			return false;
	}
}

/** Map our `WordCloudShape` to a wordcloud2.js `shape` + `ellipticity` pair.
 *  - rectangle: polar function that returns the rectangle-edge radius for each
 *    angle, scaled to fit the actual canvas aspect — words pack into the full
 *    rectangle including corners.
 *  - circle: built-in `'circle'`, square layout (ellipticity 1).
 *  - ellipse: built-in `'circle'` keyword stretched to the canvas aspect.
 *  - triangle / diamond / pentagon / star: built-in keywords (well-tuned).
 *  - heart: built-in `'cardioid'` (the classic heart-shaped polar curve). */
function shapeForWordCloud2(
	shape: WordCloudShape,
	width: number,
	height: number,
): { shape: string | ((theta: number) => number); ellipticity: number } {
	switch (shape) {
		case "rectangle": {
			// Polar function that returns the radius from the center to the
			// rectangle edge along angle θ, normalized to wordcloud2's unit
			// (where r = 1 ≈ inscribed-circle radius = min(w, h) / 2).
			const w = width;
			const h = height;
			const m = Math.min(w, h);
			return {
				shape: (theta: number) => {
					const cos = Math.abs(Math.cos(theta));
					const sin = Math.abs(Math.sin(theta));
					// Distance to rectangle edge along angle θ in pixels:
					//   min(w / (2·|cosθ|), h / (2·|sinθ|))
					// Then divided by min(w,h)/2 to get wordcloud2 polar units.
					const rx = cos > 1e-6 ? w / (m * cos) : Infinity;
					const ry = sin > 1e-6 ? h / (m * sin) : Infinity;
					return Math.min(rx, ry);
				},
				ellipticity: 1,
			};
		}
		case "circle":
			return { shape: "circle", ellipticity: 1 };
		case "ellipse":
			// wordcloud2 multiplies the y-radius by `ellipticity`. Setting it
			// to height / width stretches the inscribed circle to fill the
			// canvas as an ellipse.
			return {
				shape: "circle",
				ellipticity: width > 0 ? height / width : 1,
			};
		case "triangle":
			return { shape: "triangle", ellipticity: 1 };
		case "diamond":
			return { shape: "diamond", ellipticity: 1 };
		case "pentagon":
			return { shape: "pentagon", ellipticity: 1 };
		case "star":
			return { shape: "star", ellipticity: 1 };
		case "heart":
			return { shape: "cardioid", ellipticity: 1 };
		default:
			return { shape: "circle", ellipticity: 1 };
	}
}

/** Build a `rotationSteps`/`rotateRatio`/`min`/`max` config from our deg-based
 *  Min/Max/Step rotation tools. wordcloud2 uses radians; we convert and let it
 *  pick discrete angles in `[min, max]`. When min === max, ratio falls to 0 so
 *  no random rotation is applied (every word stays at exactly that angle). */
function rotationOptionsFromConfig(min: number, max: number, step: number) {
	const lo = Math.min(min, max);
	const hi = Math.max(min, max);
	const safeStep = Math.max(1, Math.abs(step));
	if (lo === hi && lo === 0) {
		// Pure horizontal — no rotation at all.
		return {
			minRotation: 0,
			maxRotation: 0,
			rotationSteps: 0,
			rotateRatio: 0,
		};
	}
	if (lo === hi) {
		// Single non-zero angle: force every word to that angle.
		const rad = (lo * Math.PI) / 180;
		return {
			minRotation: rad,
			maxRotation: rad,
			rotationSteps: 1,
			rotateRatio: 1,
		};
	}
	// Discretize the range into N + 1 angles per the chosen step.
	const range = hi - lo;
	const steps = Math.max(2, Math.floor(range / safeStep) + 1);
	return {
		minRotation: (lo * Math.PI) / 180,
		maxRotation: (hi * Math.PI) / 180,
		rotationSteps: steps,
		rotateRatio: 1,
	};
}

interface WordCloudProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	/** Optional explicit palette override (otherwise reads `config.styling.colorPalette`). */
	palette?: string[];
}

interface HoveredWord {
	word: WordCloudWord;
	x: number;
	y: number;
}

export function WordCloud({ data, config, palette }: WordCloudProps) {
	const wordsKey = config?.xKey;
	const sizeKey = config?.yKeys?.[0];
	const tooltipEntries: Array<{ column: string; aggregation: string }> =
		config?.tooltips?.length
			? config.tooltips
			: config?.tooltip
				? [
						{
							column: config.tooltip,
							aggregation:
								config.tooltipAggregation ||
								config.columnAggregations?.[config.tooltip] ||
								"count",
						},
					]
				: [];

	const styling = config?.styling?.wordcloud ?? {};
	const showTooltip =
		styling.showTooltip ?? DEFAULT_WORDCLOUD_STYLING.showTooltip;
	const rotationMin =
		styling.rotationMin ?? DEFAULT_WORDCLOUD_STYLING.rotationMin;
	const rotationMax =
		styling.rotationMax ?? DEFAULT_WORDCLOUD_STYLING.rotationMax;
	const rotationStep =
		styling.rotationStep ?? DEFAULT_WORDCLOUD_STYLING.rotationStep;
	const shape = styling.shape ?? DEFAULT_WORDCLOUD_STYLING.shape;
	const fontMin = styling.fontMin ?? DEFAULT_WORDCLOUD_STYLING.fontMin;
	const fontMax = styling.fontMax ?? DEFAULT_WORDCLOUD_STYLING.fontMax;
	// Stabilize the colorRules reference so the colorForWord memo doesn't
	// re-fire on every render (the spread/?? always returns a new array).
	const colorRules = useMemo(
		() => styling.colorRules ?? [],
		[styling.colorRules],
	);

	// Resolve palette from config.styling.colorPalette → fall back to default
	const resolvedPalette = useMemo(() => {
		if (palette?.length) return palette;
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : DEFAULT_PALETTE;
	}, [palette, config?.styling?.colorPalette]);

	const words = useMemo(
		() => aggregateWordCloudData(data, config),
		[data, config],
	);

	// Linear scale of size values to [fontMin, fontMax]
	const fontSizeFor = useMemo(() => {
		if (!words.length) return () => fontMin;
		const sizes = words.map((w) => w.sizeValue);
		const lo = Math.min(...sizes);
		const hi = Math.max(...sizes);
		const range = hi - lo;
		if (range <= 0) return () => (fontMin + fontMax) / 2;
		return (v: number) =>
			fontMin + ((v - lo) / range) * (fontMax - fontMin);
	}, [words, fontMin, fontMax]);

	// Container measurement (drives the canvas dimensions)
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [size, setSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const update = () => {
			const r = el.getBoundingClientRect();
			setSize((prev) =>
				Math.abs(prev.width - r.width) < 0.5 &&
				Math.abs(prev.height - r.height) < 0.5
					? prev
					: { width: r.width, height: r.height },
			);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Hover tooltip state (anchored to cursor inside the canvas)
	const [hovered, setHovered] = useState<HoveredWord | null>(null);

	// Resolve a fill color for a given word — ColorRule overrides, else palette by index
	const colorForWord = useMemo(() => {
		const indexByLabel = new Map<string, number>();
		words.forEach((w, i) => indexByLabel.set(w.label, i));
		return (label: string, sizeValue: number): string => {
			for (const rule of colorRules) {
				const candidate: unknown =
					rule.valueColumn === sizeKey ? sizeValue : label;
				if (compare(rule.comparator, candidate, rule.value))
					return rule.color;
			}
			const idx = indexByLabel.get(label) ?? 0;
			return resolvedPalette[idx % resolvedPalette.length];
		};
	}, [words, colorRules, sizeKey, resolvedPalette]);

	// Render the cloud onto the canvas via wordcloud2.js. Re-renders when data,
	// size, shape, rotation, font range, or coloring inputs change.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !words.length || size.width <= 0 || size.height <= 0)
			return;

		// HiDPI: scale the pixel buffer by devicePixelRatio for crisp rendering
		// on retina displays. CSS dimensions track the displayed size; the
		// canvas pixel buffer is dpr× larger.
		const dpr = Math.max(1, window.devicePixelRatio || 1);
		canvas.width = Math.round(size.width * dpr);
		canvas.height = Math.round(size.height * dpr);
		canvas.style.width = `${size.width}px`;
		canvas.style.height = `${size.height}px`;

		const { shape: wcShape, ellipticity } = shapeForWordCloud2(
			shape,
			canvas.width,
			canvas.height,
		);
		const rot = rotationOptionsFromConfig(
			rotationMin,
			rotationMax,
			rotationStep,
		);

		// wordcloud2 list entries support arbitrary trailing extras that come
		// back through the `hover` callback. Stash the WordCloudWord payload at
		// index 2 so we can render the tooltip without a separate map lookup.
		const list = words.map<[string, number, WordCloudWord]>((w) => [
			w.label,
			w.sizeValue,
			w,
		]);

		// Reset any stale hover state from the previous render
		setHovered(null);

		WordCloudJS(canvas, {
			list,
			fontFamily: FONT_FAMILY,
			// weightFactor receives the raw `sizeValue` from the list entry
			// and returns the rendered font size in **canvas pixels** — multiply
			// by dpr so HiDPI scaling preserves the configured font range.
			weightFactor: (weight: number) => fontSizeFor(weight) * dpr,
			color: (word, weight) => colorForWord(String(word), Number(weight)),
			shape: wcShape,
			ellipticity,
			minRotation: rot.minRotation,
			maxRotation: rot.maxRotation,
			rotationSteps: rot.rotationSteps,
			rotateRatio: rot.rotateRatio,
			backgroundColor: "rgba(0,0,0,0)",
			drawOutOfBound: false,
			shrinkToFit: true,
			gridSize: Math.max(4, Math.round(8 * dpr)),
			hover: (item, _dim, evt) => {
				if (!showTooltip) return;
				if (!item) {
					setHovered(null);
					return;
				}
				const payload = item[2] as WordCloudWord | undefined;
				if (!payload) return;
				setHovered({
					word: payload,
					x: evt.offsetX,
					y: evt.offsetY,
				});
			},
		});

		return () => {
			// Best-effort: stop any still-drawing layout when deps change /
			// unmount. wordcloud2 exposes a global stop().
			try {
				WordCloudJS.stop();
			} catch {
				// wordcloud2 may not have a draw in progress; ignore.
			}
		};
	}, [
		words,
		size.width,
		size.height,
		shape,
		rotationMin,
		rotationMax,
		rotationStep,
		fontSizeFor,
		colorForWord,
		showTooltip,
	]);

	//  No-data guard
	if (!wordsKey) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<Cloud className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drop a column into Words to render the cloud
					</p>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="relative h-full w-full">
			{words.length > 0 && size.width > 0 && size.height > 0 ? (
				<canvas
					ref={canvasRef}
					style={{ display: "block", width: "100%", height: "100%" }}
					onMouseLeave={() => setHovered(null)}
				/>
			) : (
				<div className="flex h-full items-center justify-center">
					<div className="px-6 text-center text-slate-400">
						<Cloud className="mx-auto mb-3 h-12 w-12 opacity-30" />
						<p className="font-medium text-sm">
							No words to display
						</p>
						<p className="mt-1 text-xs">
							Run a query that returns rows for the Words column
						</p>
					</div>
				</div>
			)}

			{/* Tooltip popover */}
			{showTooltip && hovered && (
				<div
					className="pointer-events-none absolute z-10 min-w-[180px] rounded border border-slate-200 bg-white p-2 text-xs shadow-lg"
					style={tooltipStyle(hovered.x, hovered.y)}
				>
					<div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
						<span
							className="inline-block h-2 w-2 rounded-full"
							style={{
								background: colorForWord(
									hovered.word.label,
									hovered.word.sizeValue,
								),
							}}
						/>
						{hovered.word.label}
					</div>
					<div className="text-slate-700">
						{sizeKey
							? `${sizeKey} (${config?.columnAggregations?.[sizeKey] || "sum"}):`
							: "Count:"}{" "}
						<span className="font-medium tabular-nums">
							{Number(hovered.word.sizeValue).toLocaleString(
								undefined,
								{ maximumFractionDigits: 2 },
							)}
						</span>
					</div>
					{tooltipEntries.map(({ column, aggregation }) =>
						hovered.word.tooltipValues?.[column] !== undefined ? (
							<div
								key={column}
								className="mt-1 border-slate-200 border-t pt-1 text-slate-700"
							>
								{column} ({aggregation}):{" "}
								<span className="font-medium tabular-nums">
									{typeof hovered.word.tooltipValues![
										column
									] === "number"
										? (
												hovered.word.tooltipValues![
													column
												] as number
											).toLocaleString(undefined, {
												maximumFractionDigits: 2,
											})
										: String(
												hovered.word.tooltipValues![
													column
												],
											)}
								</span>
							</div>
						) : null,
					)}
				</div>
			)}
		</div>
	);
}

/* ── Tooltip placement: nudge so it never extends past the right/bottom edge ─ */
function tooltipStyle(x: number, y: number): CSSProperties {
	return {
		left: x + 12,
		top: y + 12,
	};
}
