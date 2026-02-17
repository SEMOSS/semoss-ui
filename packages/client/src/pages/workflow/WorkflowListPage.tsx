import {
	Pencil,
	Play,
	Plus,
	Trash2,
	Workflow as WorkflowIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import { createWorkflow, deleteWorkflow, runWorkflow } from "@/api/workflow";

interface WorkflowProject {
	project_id: string;
	project_name: string;
	project_date_created: string;
}

export function WorkflowListPage() {
	const navigate = useNavigate();
	const [workflows, setWorkflows] = useState<WorkflowProject[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [showCreate, setShowCreate] = useState(false);

	const fetchWorkflows = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const { pixelReturn } = await runPixel<
				[{ data: WorkflowProject[] }]
			>('MyEngines(engineTypes=["WORKFLOW"]);');
			const output = pixelReturn[0];
			if (output.operationType[0] === "ERROR") {
				throw new Error(String(output.output));
			}
			setWorkflows(Array.isArray(output.output) ? output.output : []);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load workflows",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchWorkflows();
	}, [fetchWorkflows]);

	const handleCreate = async () => {
		if (!newName.trim()) return;
		setCreating(true);
		try {
			const result = await createWorkflow(newName.trim());
			setShowCreate(false);
			setNewName("");
			navigate(`/workflow/${result.project_id}`);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to create workflow",
			);
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (projectId: string) => {
		if (!window.confirm("Are you sure you want to delete this workflow?"))
			return;
		try {
			await deleteWorkflow(projectId);
			await fetchWorkflows();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to delete workflow",
			);
		}
	};

	const handleRun = async (projectId: string) => {
		try {
			await runWorkflow(projectId);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to run workflow",
			);
		}
	};

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-gray-900">
						Workflows
					</h1>
					<p className="mt-1 text-gray-500 text-sm">
						Build and manage automated multi-step workflows
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700"
				>
					<Plus className="h-4 w-4" />
					New Workflow
				</button>
			</div>

			{/* Create Dialog */}
			{showCreate && (
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div className="flex items-end gap-3">
						<div className="flex flex-1 flex-col gap-1">
							<span className="font-medium text-gray-700 text-xs">
								Workflow Name
							</span>
							<input
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) =>
									e.key === "Enter" && handleCreate()
								}
								placeholder="My Workflow"
								className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<button
							type="button"
							onClick={handleCreate}
							disabled={creating || !newName.trim()}
							className="rounded-md bg-blue-600 px-4 py-1.5 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						>
							{creating ? "Creating…" : "Create"}
						</button>
						<button
							type="button"
							onClick={() => {
								setShowCreate(false);
								setNewName("");
							}}
							className="rounded-md border border-gray-300 px-4 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-50"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Error */}
			{error && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
					{error}
				</div>
			)}

			{/* Loading */}
			{loading && (
				<div className="flex items-center justify-center py-12 text-gray-400 text-sm">
					Loading workflows…
				</div>
			)}

			{/* Empty state */}
			{!loading && workflows.length === 0 && (
				<div className="flex flex-col items-center gap-4 py-16 text-center">
					<WorkflowIcon className="h-12 w-12 text-gray-300" />
					<div>
						<h2 className="font-semibold text-gray-600 text-lg">
							No workflows yet
						</h2>
						<p className="mt-1 text-gray-400 text-sm">
							Create your first workflow to get started
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700"
					>
						<Plus className="h-4 w-4" />
						New Workflow
					</button>
				</div>
			)}

			{/* Table */}
			{!loading && workflows.length > 0 && (
				<div className="overflow-hidden rounded-lg border border-gray-200">
					<table className="w-full text-left text-sm">
						<thead className="border-gray-200 border-b bg-gray-50 text-gray-500 text-xs uppercase">
							<tr>
								<th className="px-4 py-3">Name</th>
								<th className="px-4 py-3">Created</th>
								<th className="px-4 py-3 text-right">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{workflows.map((w) => (
								<tr
									key={w.project_id}
									className="border-gray-50 border-b hover:bg-gray-50"
								>
									<td className="px-4 py-3 font-medium text-gray-900">
										{w.project_name}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{new Date(
											w.project_date_created,
										).toLocaleDateString()}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() =>
													navigate(
														`/workflow/${w.project_id}`,
													)
												}
												className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
												title="Edit"
											>
												<Pencil className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() =>
													handleRun(w.project_id)
												}
												className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-green-600"
												title="Run"
											>
												<Play className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() =>
													handleDelete(w.project_id)
												}
												className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
												title="Delete"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
