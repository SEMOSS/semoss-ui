import { Fragment, useEffect, useId, useState } from "react";

// ── Layout ──────────────────────────────────────────────────────────────────
const UX = 55,
	UY = 148;
const UX_EDGE = UX + 23; // right edge of user circle — line/dots start here
const AX = 215,
	AY = 148;
const TX = 378;
const TLX = TX - 25; // left edge of tool badges (bw=50, half=25) — line/dot endpoints

const EH_X = 105,
	EH_Y = 20,
	EH_W = 313,
	EH_H = 255;

// Tool y values: 38 px apart, centred on AY=148  →  72, 110, 148, 186, 224
const TOOLS = [
	{
		id: "mcp",
		label: "MCP",
		y: 72,
		fill: "#7F77DD",
		stroke: "#534AB7",
		textColor: "#EEEDFE",
		curve: [262, 48] as [number, number] | null,
	},
	{
		id: "api",
		label: "API",
		y: 110,
		fill: "#378ADD",
		stroke: "#185FA5",
		textColor: "#E6F1FB",
		curve: null,
	},
	{
		id: "web",
		label: "Web",
		y: 148,
		fill: "#5DCAA5",
		stroke: "#0F6E56",
		textColor: "white",
		curve: null,
	},
	{
		id: "code",
		label: "Code",
		y: 186,
		fill: "#85B7EB",
		stroke: "#378ADD",
		textColor: "white",
		curve: null,
	},
	{
		id: "files",
		label: "Files",
		y: 224,
		fill: "#AFA9EC",
		stroke: "#7F77DD",
		textColor: "white",
		curve: [262, 241] as [number, number] | null,
	},
];

// ── Animation timing ─────────────────────────────────────────────────────────
// 10 s cycle:
//   0.00 s – 1.40 s : User → Agent  (single white ball)
//   1.60 s – ~4.67 s: 10-ball cascade Agent ↔ random tools (last return opacity clears by 4.67 s)
//   5.00 s – 6.40 s : Agent → User  (single blue ball, fires only after all tool balls clear)
//   6.40 s – 10.0 s : pause
const CYCLE = "10s";
const FRAC_LONG = 0.14; // 1.4 s / 10 s  (user ↔ agent)
const FRAC_TOOL = 0.06; // 0.6 s / 10 s  (each tool leg)
const STAGGER = 0.18; // seconds between successive balls
const RETURN_OFS = 0.65; // seconds after outbound start → inbound fires (> 0.6 s travel so ball reaches dest first)

// ── Helpers ──────────────────────────────────────────────────────────────────
function toolPath(idx: number, dir: "out" | "in"): string {
	const t = TOOLS[idx];
	if (t.curve) {
		const [cx, cy] = t.curve;
		return dir === "out"
			? `M ${AX},${AY} Q ${cx},${cy} ${TLX},${t.y}`
			: `M ${TLX},${t.y} Q ${cx},${cy} ${AX},${AY}`;
	}
	return dir === "out"
		? `M ${AX},${AY} L ${TLX},${t.y}`
		: `M ${TLX},${t.y} L ${AX},${AY}`;
}

// animateMotion: travel path in first `frac` of CYCLE, hold at destination
function motion(begin: string, path: string, frac: number) {
	const props = {
		keyPoints: "0;1;1",
		keyTimes: `0;${frac};1`,
		calcMode: "linear",
		dur: CYCLE,
		repeatCount: "indefinite",
		begin,
		path,
	};
	// biome-ignore lint/suspicious/noExplicitAny: keyPoints is absent from React SVG types
	return props as any;
}

// opacity: pop in → hold through travel → fade at arrival
function opacity(begin: string, frac: number) {
	return {
		attributeName: "opacity",
		values: "0;1;1;0;0",
		keyTimes: `0;0.02;${frac.toFixed(3)};${(frac + 0.02).toFixed(3)};1`,
		calcMode: "linear",
		dur: CYCLE,
		repeatCount: "indefinite",
		begin,
	};
}

function shuffle(arr: number[]): number[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

interface AgentNetworkVizProps {
	className?: string;
}

export const AgentNetworkViz: React.FC<AgentNetworkVizProps> = ({
	className,
}) => {
	const [ballSeq, setBallSeq] = useState(() =>
		shuffle([0, 1, 2, 3, 4, 0, 1, 2, 3, 4]),
	);
	const [cycle, setCycle] = useState(0);

	const uid = useId();
	const glowId = `${uid}g`;
	const agentGlowId = `${uid}ag`;
	const glowUrl = `url(#${glowId})`;
	const agentGlowUrl = `url(#${agentGlowId})`;

	useEffect(() => {
		const id = setInterval(() => {
			setBallSeq(shuffle([0, 1, 2, 3, 4, 0, 1, 2, 3, 4]));
			setCycle((c) => c + 1);
		}, 10_000);
		return () => clearInterval(id);
	}, []);

	return (
		<svg
			role="img"
			aria-label="Agent network visualization"
			viewBox="0 0 460 278"
			xmlns="http://www.w3.org/2000/svg"
			className={className ?? "h-full w-full"}
		>
			<defs>
				<filter
					id={glowId}
					x="-60%"
					y="-60%"
					width="220%"
					height="220%"
				>
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<filter
					id={agentGlowId}
					x="-70%"
					y="-70%"
					width="240%"
					height="240%"
				>
					<feGaussianBlur stdDeviation="6" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* ── Enterprise Harness border ── */}
			<rect
				x={EH_X}
				y={EH_Y}
				width={EH_W}
				height={EH_H}
				rx="14"
				fill="rgba(255,255,255,0.08)"
				stroke="rgba(255,255,255,0.4)"
				strokeWidth="1"
				strokeDasharray="5 4"
			/>
			<text
				x={EH_X + EH_W / 2}
				y={EH_Y + 15}
				textAnchor="middle"
				dominantBaseline="central"
				fill="white"
				fontSize="9.5"
				fontWeight="700"
				fontFamily="Geist, sans-serif"
				letterSpacing="2"
			>
				ENTERPRISE HARNESS
			</text>

			{/* ── Connection lines — unified soft white fan ── */}
			<line
				x1={UX_EDGE}
				y1={UY}
				x2={AX}
				y2={AY}
				stroke="rgba(255,255,255,0.5)"
				strokeWidth="1"
				strokeDasharray="4 4"
			/>
			{TOOLS.map((t) =>
				t.curve ? (
					<path
						key={`line-${t.id}`}
						d={`M ${AX},${AY} Q ${t.curve[0]},${t.curve[1]} ${TLX},${t.y}`}
						stroke="rgba(255,255,255,0.35)"
						strokeWidth="1"
						strokeDasharray="4 4"
						fill="none"
					/>
				) : (
					<line
						key={`line-${t.id}`}
						x1={AX}
						y1={AY}
						x2={TLX}
						y2={t.y}
						stroke="rgba(255,255,255,0.35)"
						strokeWidth="1"
						strokeDasharray="4 4"
					/>
				),
			)}

			{/* ── Left Guardrail: solid teal band, centered in user→agent lane ── */}
			<g>
				<rect
					x={137}
					y={108}
					width={18}
					height={80}
					rx="4"
					fill="rgba(34,211,238,0.18)"
					stroke="rgba(34,211,238,0.3)"
					strokeWidth="1"
				/>
				<text
					x={146}
					y={148}
					textAnchor="middle"
					dominantBaseline="central"
					fill="rgba(255,255,255,0.9)"
					fontSize="7"
					fontWeight="600"
					fontFamily="Geist, sans-serif"
					letterSpacing="0.8"
					transform="rotate(-90, 146, 148)"
				>
					Guardrails
				</text>
			</g>

			{/* ── Right Guardrail: solid teal band, centred in agent→tools lane ── */}
			{/* spans badge range: y 79–231, 8 px padding each side               */}
			<g>
				<rect
					x={285}
					y={64}
					width={18}
					height={168}
					rx="4"
					fill="rgba(34,211,238,0.18)"
					stroke="rgba(34,211,238,0.3)"
					strokeWidth="1"
				/>
				<text
					x={294}
					y={148}
					textAnchor="middle"
					dominantBaseline="central"
					fill="rgba(255,255,255,0.9)"
					fontSize="7"
					fontWeight="600"
					fontFamily="Geist, sans-serif"
					letterSpacing="0.8"
					transform="rotate(-90, 294, 148)"
				>
					Guardrails
				</text>
			</g>

			{/* ── Logging & Metering bar (bottom of harness, full inner width) ── */}
			<g>
				<rect
					x={EH_X + 10}
					y={EH_Y + EH_H - 22}
					width={EH_W - 20}
					height={14}
					rx="4"
					fill="rgba(34,211,238,0.18)"
					stroke="rgba(34,211,238,0.3)"
					strokeWidth="1"
				/>
				<text
					x={EH_X + EH_W / 2}
					y={EH_Y + EH_H - 15}
					textAnchor="middle"
					dominantBaseline="central"
					fill="rgba(255,255,255,0.9)"
					fontSize="7"
					fontWeight="600"
					fontFamily="Geist, sans-serif"
					letterSpacing="0.8"
				>
					Logging and Metering
				</text>
			</g>

			{/* ── Animated phases — remounted each cycle so ball order reshuffles ── */}
			<g key={cycle}>
				{/* Phase 1: User → Agent */}
				<circle r="4" fill="white" filter={glowUrl} opacity="0">
					<animateMotion
						{...motion(
							"0s",
							`M ${UX_EDGE},${UY} L ${AX},${AY}`,
							FRAC_LONG,
						)}
					/>
					<animate {...opacity("0s", FRAC_LONG)} />
				</circle>

				{/* Phase 2+3: 10-ball random cascade Agent ↔ Tools */}
				{ballSeq.map((toolIdx: number, i: number) => {
					const t = TOOLS[toolIdx];
					const outT = `${(1.6 + i * STAGGER).toFixed(2)}s`;
					const inT = `${(1.6 + i * STAGGER + RETURN_OFS).toFixed(2)}s`;
					const outPath = toolPath(toolIdx, "out");
					const inPath = toolPath(toolIdx, "in");
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: each slot has a fixed timing offset determined by its position
						<Fragment key={i}>
							<circle
								r="3.5"
								fill={t.fill}
								filter={glowUrl}
								opacity="0"
							>
								<animateMotion
									{...motion(outT, outPath, FRAC_TOOL)}
								/>
								<animate {...opacity(outT, FRAC_TOOL)} />
							</circle>
							<circle
								r="3"
								fill={t.fill}
								fillOpacity="0.85"
								filter={glowUrl}
								opacity="0"
							>
								<animateMotion
									{...motion(inT, inPath, FRAC_TOOL)}
								/>
								<animate {...opacity(inT, FRAC_TOOL)} />
							</circle>
						</Fragment>
					);
				})}

				{/* Phase 4: Agent → User */}
				<circle r="4" fill="#93c5fd" filter={glowUrl} opacity="0">
					<animateMotion
						{...motion(
							"5.0s",
							`M ${AX},${AY} L ${UX_EDGE},${UY}`,
							FRAC_LONG,
						)}
					/>
					<animate {...opacity("5.0s", FRAC_LONG)} />
				</circle>
			</g>

			{/* ── Agent node ── */}
			<circle
				cx={AX}
				cy={AY}
				r="30"
				fill="none"
				stroke="rgba(255,255,255,0.5)"
				strokeWidth="1.5"
			>
				<animate
					attributeName="r"
					values="30;44;30"
					dur="2.8s"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="stroke-opacity"
					values="0.5;0;0.5"
					dur="2.8s"
					repeatCount="indefinite"
				/>
			</circle>
			<circle
				cx={AX}
				cy={AY}
				r="27"
				fill="rgba(59,130,246,0.95)"
				stroke="rgba(255,255,255,0.8)"
				strokeWidth="1.5"
				filter={agentGlowUrl}
			/>
			<text
				x={AX}
				y={AY}
				textAnchor="middle"
				dominantBaseline="central"
				fill="white"
				fontSize="8"
				fontWeight="700"
				fontFamily="Geist, sans-serif"
				letterSpacing="1.2"
			>
				AGENT
			</text>

			{/* ── User node — brighter fill for contrast ── */}
			<circle
				cx={UX}
				cy={UY}
				r="23"
				fill="rgba(255,255,255,0.38)"
				stroke="rgba(255,255,255,0.75)"
				strokeWidth="1.5"
			/>
			<circle cx={UX} cy={UY - 8} r="7" fill="white" />
			<path
				d={`M ${UX - 13},${UY + 14} Q ${UX},${UY + 4} ${UX + 13},${UY + 14}`}
				fill="white"
			/>
			<text
				x={UX}
				y={UY + 34}
				textAnchor="middle"
				dominantBaseline="central"
				fill="white"
				fontSize="8.5"
				fontFamily="Geist, sans-serif"
				fontWeight="500"
			>
				User
			</text>

			{/* ── Badge backing card — subtle enclosure for the tool group ── */}
			<rect
				x={TLX - 8}
				y={72 - 14}
				width={50 + 16}
				height={224 - 72 + 28}
				rx="8"
				fill="rgba(255,255,255,0.06)"
				stroke="rgba(255,255,255,0.12)"
				strokeWidth="1"
			/>

			{/* ── Tool badges (top layer — hides dot endpoints) ── */}
			{TOOLS.map((t) => {
				const bw = 50,
					bh = 20;
				return (
					<g key={`badge-${t.id}`}>
						<rect
							x={TX - bw / 2}
							y={t.y - bh / 2}
							width={bw}
							height={bh}
							rx="5"
							fill={t.fill}
							stroke={t.stroke}
							strokeWidth="1.5"
						/>
						<text
							x={TX}
							y={t.y}
							textAnchor="middle"
							dominantBaseline="central"
							fill={t.textColor}
							fontSize="8"
							fontWeight="600"
							fontFamily="Geist, sans-serif"
						>
							{t.label}
						</text>
					</g>
				);
			})}
		</svg>
	);
};
