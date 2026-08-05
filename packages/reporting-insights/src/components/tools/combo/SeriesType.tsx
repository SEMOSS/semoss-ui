import { ResetButton } from "../shared/ResetButton";

type OverlayRenderType = "line" | "area";

interface SeriesTypeProps {
	barKeys: string[];
	lineKeys: string[];
	seriesTypes: Record<string, OverlayRenderType>;
	onChange: (updates: {
		seriesTypes: Record<string, OverlayRenderType>;
	}) => void;
	onReset: () => void;
}

const TYPE_OPTIONS: { value: OverlayRenderType; label: string }[] = [
	{ value: "line", label: "Line" },
	{ value: "area", label: "Area" },
];

export function SeriesType({
	barKeys,
	lineKeys,
	seriesTypes,
	onChange,
	onReset,
}: SeriesTypeProps) {
	if (!barKeys.length && !lineKeys.length) {
		return (
			<p className="text-[12px] text-stone-400">
				Add columns to configure overlay style.
			</p>
		);
	}

	const setType = (key: string, type: OverlayRenderType) => {
		onChange({ seriesTypes: { ...seriesTypes, [key]: type } });
	};

	return (
		<div className="space-y-3">
			{barKeys.length > 0 && (
				<div className="space-y-1">
					<p className="font-semibold text-[10px] text-stone-400 uppercase tracking-wider">
						Bar Series
					</p>
					{barKeys.map((key) => (
						<div
							key={key}
							className="flex items-center justify-between gap-2"
						>
							<p
								className="flex-1 truncate text-[11px] text-stone-600"
								title={key}
							>
								{key}
							</p>
							<span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] text-stone-400">
								Bar
							</span>
						</div>
					))}
				</div>
			)}

			{lineKeys.length > 0 && (
				<div className="space-y-2">
					<p className="font-semibold text-[10px] text-stone-400 uppercase tracking-wider">
						Overlay Series
					</p>
					{lineKeys.map((key) => {
						const active = seriesTypes[key] ?? "line";
						return (
							<div key={key} className="space-y-1">
								<p
									className="truncate font-medium text-[11px] text-stone-600"
									title={key}
								>
									{key}
								</p>
								<div className="inline-flex w-full items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
									{TYPE_OPTIONS.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() =>
												setType(key, opt.value)
											}
											className={`flex-1 rounded-md py-1 font-medium text-[12px] transition-colors ${
												active === opt.value
													? "bg-white text-stone-800 shadow-soft"
													: "text-stone-500 hover:text-stone-700"
											}`}
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
