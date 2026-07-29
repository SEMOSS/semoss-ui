import { ResetButton } from "../shared/ResetButton";

interface SaveZoomProps {
	value?: boolean;
	savedZoomX?: [number, number];
	savedZoomY?: [number, number];
	zoomXEnabled?: boolean;
	zoomYEnabled?: boolean;
	onChange: (v: boolean) => void;
	onReset: () => void;
}

const toPercent = (v: number) => `${Math.round(v * 100)}%`;

export function SaveZoom({
	value = false,
	savedZoomX,
	savedZoomY,
	zoomXEnabled = false,
	zoomYEnabled = false,
	onChange,
	onReset,
}: SaveZoomProps) {
	const hasZoom = zoomXEnabled || zoomYEnabled;
	const hasSaved =
		(zoomXEnabled && savedZoomX) || (zoomYEnabled && savedZoomY);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-stone-600 text-xs">Save zoom state</span>
				<button
					type="button"
					onClick={() => onChange(!value)}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
						value ? "bg-indigo-500" : "bg-stone-300"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
							value ? "translate-x-[18px]" : "translate-x-[2px]"
						}`}
					/>
				</button>
			</div>

			{value && !hasZoom && (
				<p className="text-stone-400 text-xs italic">
					Enable Zoom X Axis or Zoom Y Axis to use this feature.
				</p>
			)}

			{value && hasZoom && (
				<div className="space-y-2 rounded border border-stone-100 bg-stone-50/50 p-3">
					<p className="text-stone-500 text-xs">
						Drag the zoom brushes on the chart. The position is
						saved automatically when you release.
					</p>

					{hasSaved ? (
						<div className="space-y-1.5 pt-1">
							{zoomXEnabled && savedZoomX && (
								<div className="flex items-center justify-between text-xs">
									<span className="text-stone-500">
										Saved X
									</span>
									<span className="font-mono text-stone-700">
										{toPercent(savedZoomX[0])} –{" "}
										{toPercent(savedZoomX[1])}
									</span>
								</div>
							)}
							{zoomYEnabled && savedZoomY && (
								<div className="flex items-center justify-between text-xs">
									<span className="text-stone-500">
										Saved Y
									</span>
									<span className="font-mono text-stone-700">
										{toPercent(savedZoomY[0])} –{" "}
										{toPercent(savedZoomY[1])}
									</span>
								</div>
							)}
						</div>
					) : (
						<p className="pt-0.5 text-stone-400 text-xs italic">
							No position saved yet.
						</p>
					)}
				</div>
			)}

			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
