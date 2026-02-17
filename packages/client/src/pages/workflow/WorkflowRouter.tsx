import { Route, Routes } from "react-router-dom";
import { WorkflowEditorPage } from "./WorkflowEditorPage";
import { WorkflowListPage } from "./WorkflowListPage";

export function WorkflowRouter() {
	return (
		<Routes>
			<Route index element={<WorkflowListPage />} />
			<Route path=":workflowId" element={<WorkflowEditorPage />} />
		</Routes>
	);
}
