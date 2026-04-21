import { useEffect, useRef, useState } from "react";
import { type AuditLog, parseArg } from "./types/audit";

interface LatencyChartProps {
	data: AuditLog[];
	dark?: boolean;
}

interface TooltipState {
	x: number;
	y: number;
	log: AuditLog;
}

const LatencyChart = ({ data, dark }: LatencyChartProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [dims, setDims] = useState({ w: 600, h: 220 });
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const obs = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			if (width > 0 && height > 0) setDims({ w: width, h: height });
		});
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	if (!data.length) {
		return (
			<div
				ref={containerRef}
				className="flex h-full w-full items-center justify-center text-muted-foreground text-xs"
			>
				No data
			</div>
		);
	}

	const PL = 44;
	const PR = 72;
	const PT = 14;
	const PB = 52;

	const chartW = Math.max(dims.w - PL - PR, 1);
	const chartH = Math.max(dims.h - PT - PB, 1);

	const maxVal = Math.max(...data.map((l) => l.latency), 1);
	const avg = data.reduce((s, l) => s + l.latency, 0) / data.length;

	// Round maxVal up to a nice ceiling for Y axis
	const niceMax = Math.ceil(maxVal);
	const tickStep = Math.max(1, Math.ceil(niceMax / 5));
	const yMax = tickStep * 5;
	const yTicks = Array.from(
		{ length: Math.floor(yMax / tickStep) + 1 },
		(_, i) => i * tickStep,
	);

	const groupW = chartW / data.length;
	const barGap = Math.max(2, groupW * 0.18);
	const barW = Math.max(2, groupW - barGap * 2);

	const yVal = (v: number) => PT + chartH - (v / yMax) * chartH;
	const xBar = (i: number) => PL + i * groupW + barGap;

	// ── Colors ────────────────────────────────────────────────────────────────
	const gridColor = dark ? "hsl(228,15%,15%)" : "hsl(220,13%,88%)";
	const tickColor = dark ? "hsl(220,8%,50%)" : "hsl(220,8%,55%)";
	const okFill = "hsla(239,84%,67%,0.82)";
	const failFill = "hsla(0,84%,60%,0.82)";
	const avgColor = "hsl(38,92%,50%)";
	const tooltipBg = dark ? "hsl(228,18%,9%)" : "#fff";
	const tooltipBd = dark ? "hsl(228,15%,18%)" : "hsl(220,13%,88%)";
	const tooltipFg = dark ? "hsl(220,14%,70%)" : "hsl(220,20%,25%)";

	const avgY = yVal(avg);

	return (
		<div ref={containerRef} className="relative h-full w-full select-none">
			<svg
				role="img"
				aria-label="Latency Chart"
				width={dims.w}
				height={dims.h}
				className="overflow-visible"
				onMouseMove={(e) => {
					const rect = containerRef.current?.getBoundingClientRect();
					if (!rect) return;
					const mx = e.clientX - rect.left;
					const my = e.clientY - rect.top;
					const idx = Math.floor((mx - PL) / groupW);
					if (
						idx >= 0 &&
						idx < data.length &&
						my >= PT &&
						my <= PT + chartH
					) {
						setTooltip({
							x: e.clientX - rect.left,
							y: e.clientY - rect.top,
							log: data[idx],
						});
					} else {
						setTooltip(null);
					}
				}}
				onMouseLeave={() => setTooltip(null)}
			>
				{yTicks.map((tick) => {
					const y = yVal(tick);
					return (
						<g key={tick}>
							<line
								x1={PL}
								y1={y}
								x2={PL + chartW}
								y2={y}
								stroke={gridColor}
								strokeWidth={0.5}
							/>
							<text
								x={PL - 5}
								y={y}
								textAnchor="end"
								dominantBaseline="middle"
								fontSize={8}
								fill={tickColor}
								fontFamily="var(--font-mono, 'JetBrains Mono', monospace)"
							>
								{tick}ms
							</text>
						</g>
					);
				})}

				<line
					x1={PL}
					y1={avgY}
					x2={PL + chartW}
					y2={avgY}
					stroke={avgColor}
					strokeWidth={1.5}
					strokeDasharray="5 4"
				/>
				<text
					x={PL + chartW + 4}
					y={avgY - 3}
					fontSize={8}
					fill={avgColor}
					fontFamily="var(--font-mono, 'JetBrains Mono', monospace)"
				>
					avg {avg.toFixed(1)}ms
				</text>

				{data.map((log, i) => {
					const x = xBar(i);
					const bH = (log.latency / yMax) * chartH;
					const y = PT + chartH - bH;
					const fill = log.status ? okFill : failFill;
					const label = `${parseArg(log.request)} #${i + 1}`;
					const cx = x + barW / 2;
					const labelY = PT + chartH + 10;

					return (
						<g key={log.spanId ?? i}>
							<rect
								x={x}
								y={y}
								width={barW}
								height={Math.max(bH, 1)}
								fill={fill}
								rx={2}
								ry={2}
								opacity={0.85}
							/>
							<text
								x={cx}
								y={labelY}
								textAnchor="end"
								fontSize={7}
								fill={tickColor}
								fontFamily="var(--font-mono, 'JetBrains Mono', monospace)"
								transform={`rotate(-35, ${cx}, ${labelY})`}
							>
								{label.length > 16
									? label.slice(0, 15) + "…"
									: label}
							</text>
						</g>
					);
				})}

				<line
					x1={PL}
					y1={PT}
					x2={PL}
					y2={PT + chartH}
					stroke={gridColor}
					strokeWidth={0.5}
				/>
				<line
					x1={PL}
					y1={PT + chartH}
					x2={PL + chartW}
					y2={PT + chartH}
					stroke={gridColor}
					strokeWidth={0.5}
				/>
			</svg>

			{tooltip && (
				<div
					className="pointer-events-none absolute z-50 max-w-xs rounded border px-2.5 py-2 text-[10px] leading-snug"
					style={{
						left: tooltip.x + 12,
						top: Math.max(0, tooltip.y - 52),
						background: tooltipBg,
						borderColor: tooltipBd,
						color: tooltipFg,
						fontFamily:
							"var(--font-mono, 'JetBrains Mono', monospace)",
						boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
						minWidth: 90,
					}}
				>
					<div className="truncate text-[9px] opacity-70">
						{parseArg(tooltip.log.request)}
					</div>
					<div
						style={{
							color: "hsl(239,84%,67%)",
							fontWeight: 600,
							fontSize: 12,
						}}
					>
						{tooltip.log.latency} ms
					</div>
					<div
						className="text-[9px]"
						style={{
							color: tooltip.log.status
								? "hsl(160,84%,39%)"
								: "hsl(0,84%,60%)",
						}}
					>
						{tooltip.log.status ? "OKk" : "FAIL"}
					</div>
				</div>
			)}
		</div>
	);
};

export default LatencyChart;
