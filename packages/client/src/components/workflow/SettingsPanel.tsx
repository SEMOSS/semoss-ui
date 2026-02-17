import { useCallback } from "react";
import { useWorkflowEditor } from "@/stores/workflow";

export function SettingsPanel() {
	const { state, dispatch } = useWorkflowEditor();
	const settings = state.workflow.settings;

	const handleChange = useCallback(
		(updates: Record<string, unknown>) => {
			dispatch({ type: "SET_SETTINGS", settings: updates });
		},
		[dispatch],
	);

	return (
		<div className="flex flex-col gap-3 p-4">
			<div className="font-semibold text-gray-700 text-sm">
				Workflow Settings
			</div>

			{/* Max Steps */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Max Steps
				</span>
				<input
					type="number"
					min={1}
					max={500}
					value={settings.maxSteps}
					onChange={(e) =>
						handleChange({
							maxSteps: Number.parseInt(e.target.value, 10),
						})
					}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<span className="text-[10px] text-gray-400">
					Maximum step executions before aborting (prevents infinite
					loops)
				</span>
			</div>

			{/* Timeout */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Timeout (seconds)
				</span>
				<input
					type="number"
					min={1}
					max={3600}
					value={Math.round(settings.timeoutMs / 1000)}
					onChange={(e) =>
						handleChange({
							timeoutMs:
								Number.parseInt(e.target.value, 10) * 1000,
						})
					}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<span className="text-[10px] text-gray-400">
					Maximum execution time
				</span>
			</div>

			{/* On Error */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					On Error
				</span>
				<select
					value={settings.onError}
					onChange={(e) =>
						handleChange({
							onError: e.target.value as "stop" | "skip",
						})
					}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					<option value="stop">Stop — abort on first error</option>
					<option value="skip">
						Skip — skip failed step's successors
					</option>
				</select>
			</div>
		</div>
	);
}
