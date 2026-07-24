import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { isEmbedded } from "@/lib/embed";
import { useWorkspace } from "@/workspace/WorkspaceProvider";
import { AppHeader, type HeaderSlot, HeaderSlotContext } from "./AppHeader";

// Soft, playground-style gradient the whole app floats on (light mode).
const BACKDROP =
	"linear-gradient(180deg, #FCFCFC 58.78%, #F6F7FF 81.97%, #F1F8FF 94.04%)";

export function MainLayout() {
	const { loading, dashboards, error, reload } = useWorkspace();
	// First load (no data yet) → show a centered spinner instead of flashing empty states.
	const firstLoad = loading && dashboards.length === 0;
	// Pages inject their title/actions into the single global header via this setter.
	const [slot, setSlot] = useState<HeaderSlot>({});
	// In the playground tool preview (iframe) the app is a read-only embed — drop the
	// header chrome so only the dashboard shows.
	const embedded = isEmbedded();

	return (
		<HeaderSlotContext.Provider value={setSlot}>
			<div
				className="flex h-full w-full flex-col overflow-hidden"
				style={{ background: BACKDROP }}
			>
				{!embedded && <AppHeader slot={slot} />}

				{/* Workspace storage error (e.g. shared store could not be reached) */}
				{error && !firstLoad && (
					<div className="flex flex-shrink-0 items-start gap-2 border-amber-200 border-b bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
						<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
						<span className="min-w-0 flex-1">{error}</span>
						<button
							onClick={() => void reload()}
							className="flex-shrink-0 font-semibold text-amber-900 underline hover:no-underline"
						>
							Retry
						</button>
					</div>
				)}

				<main className="min-h-0 flex-1 overflow-auto">
					{firstLoad ? (
						<div className="flex h-full flex-col items-center justify-center gap-3 text-stone-400">
							<Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
							<p className="font-medium text-sm">
								Loading your workspace…
							</p>
							{error && (
								<div className="mt-2 max-w-md text-center text-amber-700 text-xs">
									{error}{" "}
									<button
										onClick={() => void reload()}
										className="font-semibold underline"
									>
										Retry
									</button>
								</div>
							)}
						</div>
					) : (
						<Outlet />
					)}
				</main>
			</div>
		</HeaderSlotContext.Provider>
	);
}
