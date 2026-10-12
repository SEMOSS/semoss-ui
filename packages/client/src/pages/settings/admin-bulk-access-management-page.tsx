import { Navigate, useParams } from "react-router";
import { BulkAccessManagement } from "@/features/bulk-access-management/bulk-access-management";
import { useAdminResourceName } from "@/features/bulk-access-management/use-admin-resource-name";
import { useConfig, useSession } from "@/hooks";

export interface AdminBulkAccessManagementPageProps {
	/** An app or an engine */
	kind: "PROJECT" | "ENGINE";
	/** The engine's type, such as MODEL, for an engine */
	engineType?: string;
}

/**
 * Bulk Access Management in admin mode, from an app's or engine's settings
 * page: an admin can make any change, whatever their own access. Anyone else
 * goes back to the settings page.
 */
export const AdminBulkAccessManagementPage = ({
	kind,
	engineType,
}: AdminBulkAccessManagementPageProps) => {
	// the signed in role, not the admin mode preference, decides who sees this page
	const isAdmin = useSession((state) => state.user.admin);
	// the router decodes the params
	const { id = "" } = useParams<{ id: string }>();
	const name = useAdminResourceName(kind, isAdmin ? id : "");
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);

	if (!isAdmin) {
		return <Navigate to=".." relative="path" replace />;
	}
	if (!id) {
		return null;
	}
	return (
		<BulkAccessManagement
			key={id}
			target={{ kind, id }}
			name={name}
			noun={kind === "PROJECT" ? "app" : "engine"}
			backTo=".."
			admin
			isDirectoryAvailable={isDirectoryAvailable}
			isModel={engineType === "MODEL"}
		/>
	);
};
