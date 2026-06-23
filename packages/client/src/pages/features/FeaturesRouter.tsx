import { observer } from "mobx-react-lite";
import { Route, Routes } from "react-router-dom";
import { FeatureDetailPage } from "./FeatureDetailPage";
import { FeaturesPage } from "./FeaturesPage";

export const FeaturesRouter = observer(() => {
	return (
		<Routes>
			<Route index element={<FeaturesPage />} />
			<Route path=":appId/:flagId" element={<FeatureDetailPage />} />
		</Routes>
	);
});
