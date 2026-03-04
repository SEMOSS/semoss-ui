import { observer } from "mobx-react-lite";
import { Route, Routes } from "react-router-dom";
import { PromptBuilder } from "@/components/prompt";
import { PromptPage } from "./PromptPage";

export const PromptRouter = observer(() => {
	return (
		<Routes>
			<Route index element={<PromptPage />} />
		</Routes>
	);
});
