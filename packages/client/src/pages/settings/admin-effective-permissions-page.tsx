import { Navigate, useParams } from "react-router";
import { useAdminResourceName } from "@/features/bulk-access-management/use-admin-resource-name";
import { EffectivePermissions } from "@/features/effective-permissions/effective-permissions";
import { useSession } from "@/hooks/use-session";

export interface AdminEffectivePermissionsPageProps {
	/** An app or an engine */
	kind: "PROJECT" | "ENGINE";
	/** The engine's type, such as MODEL, for an engine */
	engineType?: string;
}

/**
 * Effective Permissions in admin mode, from an app's or engine's settings page:
 * an admin sees who can use any app or engine, whatever their own access.
 * Anyone else goes back to the settings page.
 */
export const AdminEffectivePermissionsPage = ({
	kind,
	engineType,
}: AdminEffectivePermissionsPageProps) => {
	// the signed in role, not the admin mode preference, decides who sees this page
	const isAdmin = useSession((state) => state.user.admin);
	// the router decodes the params
	const { id = "" } = useParams<{ id: string }>();
	const name = useAdminResourceName(kind, isAdmin ? id : "");

	if (!isAdmin) {
		return <Navigate to=".." relative="path" replace />;
	}
	if (!id) {
		return null;
	}
	return (
		<EffectivePermissions
			key={id}
			target={{ resourceType: kind, id }}
			name={name}
			backTo=".."
			admin
			isModel={engineType === "MODEL"}
		/>
	);
};
