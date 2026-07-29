import { renderChartSymbol } from "@/components/visualizations/shared/chartShared";
import type { SymbolType } from "@/types/dashboard";
import { ResetButton } from "./ResetButton";

export const DEFAULT_SYMBOL_SIZE = 4;
export const DEFAULT_SYMBOL_TYPE: SymbolType = "circle";

interface SymbolStyleProps {
	symbolType?: SymbolType;
	symbolSize?: number;
	defaultSymbolType?: SymbolType;
	onChange: (updates: {
		symbolType?: SymbolType;
		symbolSize?: number;
	}) => void;
	onReset: () => void;
}

const SYMBOLS: { value: SymbolType; label: string }[] = [
	{ value: "none", label: "None" },
	{ value: "circle", label: "Circle" },
	{ value: "diamond", label: "Diamond" },
	{ value: "triangle", label: "Triangle" },
	{ value: "rectangle", label: "Rectangle" },
	{ value: "round", label: "Rounded" },
	{ value: "arrow", label: "Arrow" },
	{ value: "pin", label: "Pin" },
];

function SymbolPreview({ type, fill }: { type: SymbolType; fill: string }) {
	return (
		<svg width="28" height="22" viewBox="0 0 28 22" aria-hidden>
			{type === "none" ? (
				<line
					x1="4"
					y1="11"
					x2="24"
					y2="11"
					stroke={fill}
					strokeWidth="1.5"
					strokeDasharray="3 2"
				/>
			) : (
				renderChartSymbol(type, 14, 11, 6, fill)
			)}
		</svg>
	);
}

export function SymbolStyle({
	symbolType,
	symbolSize,
	defaultSymbolType = DEFAULT_SYMBOL_TYPE,
	onChange,
	onReset,
}: SymbolStyleProps) {
	const type = symbolType ?? defaultSymbolType;
	const size = symbolSize ?? DEFAULT_SYMBOL_SIZE;

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-2 block font-semibold text-stone-600 text-xs">
					Symbol Shape
				</label>
				<div className="grid grid-cols-4 gap-1.5">
					{SYMBOLS.map((s) => {
						const active = type === s.value;
						return (
							<button
								key={s.value}
								type="button"
								onClick={() =>
									onChange({
										symbolType: s.value,
										symbolSize: size,
									})
								}
								className={`flex flex-col items-center justify-center rounded border px-1 py-1.5 transition-colors ${
									active
										? "border-indigo-400 bg-indigo-50 text-indigo-600"
										: "border-stone-200 text-stone-500 hover:bg-stone-50"
								}`}
							>
								<SymbolPreview
									type={s.value}
									fill={active ? "#6366f1" : "#94a3b8"}
								/>
								<span className="mt-0.5 font-medium text-[9px] leading-none">
									{s.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>
			{type !== "none" && (
				<div>
					<div className="mb-1.5 flex items-center justify-between">
						<label className="font-semibold text-stone-600 text-xs">
							Symbol Size
						</label>
						<span className="font-medium text-stone-700 text-xs">
							{size}px
						</span>
					</div>
					<input
						type="range"
						min={1}
						max={12}
						step={1}
						value={size}
						onChange={(e) =>
							onChange({
								symbolType: type,
								symbolSize: Number(e.target.value),
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			)}
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
