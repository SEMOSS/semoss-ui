import { Navigate } from "react-router";
import { ModelServing } from "@/features/model-serving/model-serving";
import { useSettings } from "@/hooks/useSettings";

/** Mount the served models only while Settings is in admin mode, as the reactors require. */
export const ModelServingPage = () => {
	const { adminMode } = useSettings();
	return adminMode ? <ModelServing /> : <Navigate to="/settings" replace />;
};
