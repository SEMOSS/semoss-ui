import { useMemo } from "react";
import type { VisualizationConfig } from "@/types/dashboard";

interface Props {
	data: any[];
	config?: VisualizationConfig;
}

/** Linearly interpolate between two hex colors. t in [0,1]. */
function lerpColor(from: string, to: string, t: number): string {
	const parse = (h: string) => {
		const hex = h.replace("#", "");
		return [
			parseInt(hex.slice(0, 2), 16),
			parseInt(hex.slice(2, 4), 16),
			parseInt(hex.slice(4, 6), 16),
		];
	};
	try {
		const [r1, g1, b1] = parse(from);
		const [r2, g2, b2] = parse(to);
		const r = Math.round(r1 + (r2 - r1) * t);
		const g = Math.round(g1 + (g2 - g1) * t);
		const b = Math.round(b1 + (b2 - b1) * t);
		return `rgb(${r},${g},${b})`;
	} catch {
		return t < 0.5 ? from : to;
	}
}

/** Pick black or white based on background luminance. */
function contrastText(rgb: string): string {
	const m = rgb.match(/\d+/g);
	if (!m || m.length < 3) return "#000";
	const lum =
		(parseInt(m[0]) * 299 + parseInt(m[1]) * 587 + parseInt(m[2]) * 114) /
		1000;
	return lum > 140 ? "#1e293b" : "#f1f5f9";
}

const LABEL_W = 90;
const LABEL_H = 52;
const CELL_H = 36;

export function HeatmapChart({ data, config = {} }: Props) {
	const xKey = config.xKey ?? "";
	const yKey = config.heatmapYKey ?? "";
	const valueKey = config.yKeys?.[0] ?? "";
	const minColor = config.styling?.heatmap?.minColor ?? "#dbeafe";
	const maxColor = config.styling?.heatmap?.maxColor ?? "#1d4ed8";
	const showValues = config.styling?.heatmap?.showValues ?? false;

	const { xCats, yCats, valueMap, minVal, maxVal } = useMemo(() => {
		if (!xKey || !yKey || !valueKey || !data.length) {
			return {
				xCats: [],
				yCats: [],
				valueMap: {} as Record<string, number>,
				minVal: 0,
				maxVal: 1,
			};
		}
		const xs = [
			...new Set(data.map((r) => String(r[xKey] ?? ""))),
		] as string[];
		const ys = [
			...new Set(data.map((r) => String(r[yKey] ?? ""))),
		] as string[];
		const vm: Record<string, number> = {};
		data.forEach((r) => {
			const k = `${r[xKey]}||${r[yKey]}`;
			vm[k] = Number(r[valueKey]) || 0;
		});
		const vals = Object.values(vm).filter((v) => isFinite(v));
		return {
			xCats: xs,
			yCats: ys,
			valueMap: vm,
			minVal: vals.length ? Math.min(...vals) : 0,
			maxVal: vals.length ? Math.max(...vals) : 1,
		};
	}, [data, xKey, yKey, valueKey]);

	if (!xKey || !yKey || !valueKey) {
		return (
			<div className="flex h-full items-center justify-center px-8 text-center text-slate-400 text-sm">
				Set X axis, Y axis, and Value columns to render the heatmap
			</div>
		);
	}
	if (!data.length) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data
			</div>
		);
	}

	const getColor = (x: string, y: string) => {
		const val = valueMap[`${x}||${y}`];
		if (val === undefined) return "#f1f5f9";
		const range = maxVal - minVal;
		const t =
			range === 0
				? 0.5
				: Math.max(0, Math.min(1, (val - minVal) / range));
		return lerpColor(minColor, maxColor, t);
	};

	const fmt = (v: number) =>
		Math.abs(v) >= 1000
			? `${(v / 1000).toFixed(1)}k`
			: Number.isInteger(v)
				? String(v)
				: v.toFixed(1);

	return (
		<div className="flex h-full w-full flex-col gap-2 overflow-auto p-1.5">
			{/* Grid */}
			<div
				className="inline-grid flex-shrink-0 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200"
				style={{
					gridTemplateColumns: `${LABEL_W}px repeat(${xCats.length}, minmax(32px, 1fr))`,
					minWidth: LABEL_W + xCats.length * 40,
				}}
			>
				{/* Top-left corner */}
				<div className="bg-slate-50" style={{ height: LABEL_H }} />

				{/* X-axis headers */}
				{xCats.map((x) => (
					<div
						key={x}
						className="flex items-end justify-center bg-slate-50 px-1 pb-1.5"
						style={{ height: LABEL_H }}
					>
						<span
							className="break-words text-center font-semibold text-[10px] text-slate-500 leading-tight"
							style={{ maxWidth: 56 }}
						>
							{x}
						</span>
					</div>
				))}

				{/* Rows */}
				{yCats.map((y) => (
					<>
						{/* Y label */}
						<div
							key={`lbl-${y}`}
							className="flex items-center justify-end bg-slate-50 pr-2.5"
							style={{ height: CELL_H }}
						>
							<span
								className="truncate font-semibold text-[10px] text-slate-500"
								style={{ maxWidth: LABEL_W - 12 }}
							>
								{y}
							</span>
						</div>

						{/* Cells */}
						{xCats.map((x) => {
							const bg = getColor(x, y);
							const val = valueMap[`${x}||${y}`];
							return (
								<div
									key={`${x}-${y}`}
									title={
										val !== undefined
											? `${xKey}: ${x}\n${yKey}: ${y}\n${valueKey}: ${val}`
											: `No data`
									}
									className="flex cursor-default items-center justify-center transition-opacity hover:opacity-75"
									style={{ background: bg, height: CELL_H }}
								>
									{showValues && val !== undefined && (
										<span
											className="select-none font-bold text-[9px]"
											style={{ color: contrastText(bg) }}
										>
											{fmt(val)}
										</span>
									)}
								</div>
							);
						})}
					</>
				))}
			</div>

			{/* Color scale legend */}
			<div className="flex flex-shrink-0 items-center gap-2 px-1">
				<span className="text-[10px] text-slate-400 tabular-nums">
					{fmt(minVal)}
				</span>
				<div
					className="h-2.5 flex-1 rounded-full border border-slate-200"
					style={{
						background: `linear-gradient(to right, ${minColor}, ${maxColor})`,
					}}
				/>
				<span className="text-[10px] text-slate-400 tabular-nums">
					{fmt(maxVal)}
				</span>
			</div>
		</div>
	);
}
