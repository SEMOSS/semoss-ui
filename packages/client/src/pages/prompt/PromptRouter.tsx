import { observer } from "mobx-react-lite";
import { Route, Routes } from "react-router-dom";
import { PromptDetailPage } from "./PromptDetailPage";
import { PromptPage } from "./PromptPage";

export const PromptRouter = observer(() => {
	return (
		<Routes>
			<Route index element={<PromptPage />} />
			<Route path=":promptId" element={<PromptDetailPage />} />
		</Routes>
	);
});
