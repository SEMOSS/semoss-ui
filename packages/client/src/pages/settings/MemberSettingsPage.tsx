import { Navigate } from "react-router-dom";
import { UserTable } from "@/components/settings";
import { useSettings } from "@/hooks";

export const MemberSettingsPage = () => {
	const { adminMode } = useSettings();

	if (!adminMode) {
		return <Navigate to="/settings" />;
	}

	return <UserTable />;
};
