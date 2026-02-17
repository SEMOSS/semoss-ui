import { Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useWorkflowEditor } from "@/stores/workflow";

export function VariablesPanel() {
	const { state, dispatch } = useWorkflowEditor();
	const variables = state.workflow.variables;
	const [newKey, setNewKey] = useState("");

	const handleAdd = useCallback(() => {
		const key = newKey.trim();
		if (!key || key in variables) return;
		dispatch({
			type: "SET_VARIABLES",
			variables: { ...variables, [key]: "" },
		});
		setNewKey("");
	}, [newKey, variables, dispatch]);

	const handleRemove = useCallback(
		(key: string) => {
			const updated = { ...variables };
			delete updated[key];
			dispatch({ type: "SET_VARIABLES", variables: updated });
		},
		[variables, dispatch],
	);

	const handleValueChange = useCallback(
		(key: string, value: string) => {
			dispatch({
				type: "SET_VARIABLES",
				variables: { ...variables, [key]: value },
			});
		},
		[variables, dispatch],
	);

	return (
		<div className="flex flex-col gap-3 p-4">
			<div className="font-semibold text-gray-700 text-sm">
				Workflow Variables
			</div>
			<span className="text-[11px] text-gray-400">
				Define default variables. Override at runtime via RunWorkflow.
			</span>

			{/* Existing variables */}
			{Object.entries(variables).map(([key, val]) => (
				<div key={key} className="flex items-center gap-2">
					<span className="min-w-[100px] truncate font-mono text-gray-600 text-xs">
						{key}
					</span>
					<input
						type="text"
						value={
							typeof val === "string" ? val : JSON.stringify(val)
						}
						onChange={(e) => handleValueChange(key, e.target.value)}
						className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
					<button
						type="button"
						onClick={() => handleRemove(key)}
						className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
					>
						<Trash2 className="h-3 w-3" />
					</button>
				</div>
			))}

			{/* Add new variable */}
			<div className="flex items-center gap-2">
				<input
					type="text"
					value={newKey}
					onChange={(e) => setNewKey(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd();
					}}
					placeholder="Variable name..."
					className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={handleAdd}
					disabled={!newKey.trim()}
				>
					<Plus className="mr-1 h-3 w-3" />
					Add
				</Button>
			</div>
		</div>
	);
}
