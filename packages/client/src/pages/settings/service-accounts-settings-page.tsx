import { Navigate } from "react-router-dom";
import { ServiceAccountsTable } from "@/components/settings";
import { useSettings } from "@/hooks";

export const ServiceAccountsSettingsPage = () => {
	const { adminMode } = useSettings();

	if (!adminMode) {
		return <Navigate to="/settings" />;
	}

	return <ServiceAccountsTable />;
};
