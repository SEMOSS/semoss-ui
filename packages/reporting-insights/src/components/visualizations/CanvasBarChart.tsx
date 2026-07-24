/**
 * Canvas bar / stacked-bar renderer for LARGE datasets.
 *
 * Recharts draws SVG — one DOM node per bar — so a chart with hundreds of thousands
 * of bars (e.g. 16k categories × 46 series) exhausts the browser and crashes. This
 * component paints the same bars onto a single <canvas> (pixels, not DOM nodes), so
 * it renders huge datasets the way SEMOSS legacy (ECharts/canvas) did. `Bar_Chart`
 * falls back to it automatically past the SVG-safe mark count.
 *
 * It receives the ALREADY-aggregated rows + series keys from Bar_Chart, so grouping
 * semantics (facet / multi-measure) stay identical to the Recharts path.
 */
import {
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

interface CanvasBarChartProps {
	/** Aggregated rows: each has the x value under `xKey` plus one numeric field per series key. */
	renderData: Record<string, unknown>[];
	/** Series to draw (stacked or grouped) — measure names or facet values. */
	seriesKeys: string[];
	xKey: string;
	palette: string[];
	stacked: boolean;
}

const PAD = { left: 52, right: 10, top: 10, bottom: 22 };

function niceNum(v: number): string {
	if (!isFinite(v)) return "";
	const abs = Math.abs(v);
	if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
	if (abs >= 1_000) return (v / 1_000).toFixed(1) + "k";
	return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function CanvasBarChart({
	renderData,
	seriesKeys,
	xKey,
	palette,
	stacked,
}: CanvasBarChartProps) {
	const wrapRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [size, setSize] = useState({ w: 0, h: 0 });
	const [hover, setHover] = useState<{
		x: number;
		y: number;
		idx: number;
	} | null>(null);

	// Track container size (canvas needs explicit pixel dimensions).
	useLayoutEffect(() => {
		const el = wrapRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			const r = entries[0].contentRect;
			setSize({
				w: Math.max(0, Math.floor(r.width)),
				h: Math.max(0, Math.floor(r.height)),
			});
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Draw.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || size.w <= 0 || size.h <= 0) return;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.floor(size.w * dpr);
		canvas.height = Math.floor(size.h * dpr);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, size.w, size.h);

		const plotW = size.w - PAD.left - PAD.right;
		const plotH = size.h - PAD.top - PAD.bottom;
		const n = renderData.length;
		if (plotW <= 0 || plotH <= 0 || !n || !seriesKeys.length) return;

		// Y scale.
		let yMax = 0;
		for (const row of renderData) {
			if (stacked) {
				let sum = 0;
				for (const k of seriesKeys) sum += Number(row[k]) || 0;
				if (sum > yMax) yMax = sum;
			} else {
				for (const k of seriesKeys) {
					const v = Number(row[k]) || 0;
					if (v > yMax) yMax = v;
				}
			}
		}
		if (yMax <= 0) yMax = 1;

		// Gridlines + Y tick labels.
		ctx.font = "10px system-ui, sans-serif";
		ctx.textBaseline = "middle";
		const TICKS = 4;
		for (let t = 0; t <= TICKS; t++) {
			const val = (yMax / TICKS) * t;
			const y = PAD.top + plotH - (val / yMax) * plotH;
			ctx.strokeStyle = "#f1f5f9";
			ctx.beginPath();
			ctx.moveTo(PAD.left, y);
			ctx.lineTo(size.w - PAD.right, y);
			ctx.stroke();
			ctx.fillStyle = "#94a3b8";
			ctx.fillText(niceNum(val), 6, y);
		}

		// Bars.
		const band = plotW / n;
		const groupPad = Math.min(0.2, 2 / band) * band; // small gap; collapses to ~0 when dense
		const usable = Math.max(0.5, band - groupPad);
		for (let i = 0; i < n; i++) {
			const row = renderData[i];
			const bx = PAD.left + i * band + groupPad / 2;
			if (stacked) {
				let acc = 0;
				for (let s = 0; s < seriesKeys.length; s++) {
					const v = Number(row[seriesKeys[s]]) || 0;
					if (v <= 0) continue;
					const h = (v / yMax) * plotH;
					const y = PAD.top + plotH - ((acc + v) / yMax) * plotH;
					ctx.fillStyle = palette[s % palette.length];
					ctx.fillRect(bx, y, usable, h);
					acc += v;
				}
			} else {
				const bw = usable / seriesKeys.length;
				for (let s = 0; s < seriesKeys.length; s++) {
					const v = Number(row[seriesKeys[s]]) || 0;
					if (v <= 0) continue;
					const h = (v / yMax) * plotH;
					const y = PAD.top + plotH - h;
					ctx.fillStyle = palette[s % palette.length];
					ctx.fillRect(bx + s * bw, y, Math.max(0.5, bw), h);
				}
			}
		}

		// Axis baseline.
		ctx.strokeStyle = "#e2e8f0";
		ctx.beginPath();
		ctx.moveTo(PAD.left, PAD.top + plotH);
		ctx.lineTo(size.w - PAD.right, PAD.top + plotH);
		ctx.stroke();
	}, [size, renderData, seriesKeys, stacked, palette]);

	// Hover → which category column is under the cursor.
	const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
		const el = wrapRef.current;
		if (!el || !renderData.length) return;
		const rect = el.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;
		const plotW = size.w - PAD.left - PAD.right;
		if (mx < PAD.left || mx > size.w - PAD.right) {
			setHover(null);
			return;
		}
		const idx = Math.min(
			renderData.length - 1,
			Math.max(
				0,
				Math.floor(((mx - PAD.left) / plotW) * renderData.length),
			),
		);
		setHover({ x: mx, y: my, idx });
	};

	const hoveredRow = hover ? renderData[hover.idx] : null;
	const hoveredTotal = hoveredRow
		? seriesKeys.reduce((sum, k) => sum + (Number(hoveredRow[k]) || 0), 0)
		: 0;

	return (
		<div
			ref={wrapRef}
			className="relative h-full w-full"
			onMouseMove={onMove}
			onMouseLeave={() => setHover(null)}
		>
			<canvas
				ref={canvasRef}
				style={{ width: size.w, height: size.h, display: "block" }}
			/>
			{hoveredRow && (
				<div
					className="pointer-events-none absolute z-10 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg"
					style={{
						left: Math.min(hover!.x + 10, size.w - 160),
						top: Math.max(4, hover!.y - 40),
						maxWidth: 200,
					}}
				>
					<div className="truncate font-semibold text-slate-700">
						{String(hoveredRow[xKey] ?? "")}
					</div>
					<div className="text-slate-500">
						{stacked
							? `Total: ${niceNum(hoveredTotal)}`
							: `${seriesKeys.length} series`}
					</div>
				</div>
			)}
		</div>
	);
}
