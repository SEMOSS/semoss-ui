import { useEffect } from "react";
import { EditMode } from "./components/EditMode";
import { ViewMode } from "./components/ViewMode";
import { usePortalStore } from "./store";

export function App() {
	const { load, loadError, config, mode } = usePortalStore();

	useEffect(() => {
		void load();
	}, [load]);

	if (loadError) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
					<p className="mb-1 font-semibold">
						Failed to load dashboard
					</p>
					<p className="text-sm">{loadError}</p>
				</div>
			</div>
		);
	}

	if (!config) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-gray-500 text-sm">Loading…</div>
			</div>
		);
	}

	return mode === "edit" ? <EditMode /> : <ViewMode />;
}
