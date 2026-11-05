import { ListChecks } from "lucide-react";
import { Link, useLocation } from "react-router";
import { MembersTable } from "@semoss/shared";
import { Button, H2 } from "@semoss/ui/next";
import { PendingMembersTable, SettingsTiles } from "@/components/settings";
import { TeamsTable } from "@/components/settings/teams-table";
import { SettingsContext } from "@/contexts";
import {
	type AccessControlView,
	getAccessControlPath,
} from "@/features/bulk-access-management/access-control-path";
import { BulkAccessManagement } from "@/features/bulk-access-management/bulk-access-management";
import { BulkAccessManagementCard } from "@/features/bulk-access-management/bulk-access-management-card";
import { EffectivePermissions } from "@/features/effective-permissions/effective-permissions";
import { useConfig, useProject } from "@/hooks";

export interface ProjectAccessControlProps {
	/**
	 * What shows under Member Permissions: the members, Bulk Access Management
	 * or Effective Permissions. The access settings above stay as they are.
	 */
	view?: AccessControlView;
}

/**
 * An app's access control: its access settings, then its members, or Bulk
 * Access Management or Effective Permissions in their place.
 */
export const ProjectAccessControl = ({
	view = "MEMBERS",
}: ProjectAccessControlProps) => {
	const { project, permission, refresh } = useProject();

	// bulk access management, effective permissions and teams go by the user's own access:
	// an admin uses them in admin mode, from the settings pages
	const canEditAccess = permission === "OWNER" || permission === "EDIT";
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);
	// the other views are reached from the access control tab only, not where
	// the page is shown inside another one
	const { pathname } = useLocation();
	const accessControlPath = getAccessControlPath(pathname);
	const canOpenViews = canEditAccess && accessControlPath !== null;
	const target = { resourceType: "PROJECT" as const, id: project.project_id };
	const name =
		project.project_display_name ||
		project.project_name ||
		project.project_id;

	return (
		<SettingsContext.Provider
			value={{
				adminMode: false,
			}}
		>
			<div className="flex w-full flex-col items-start gap-6 self-stretch">
				{permission === "OWNER" && (
					<section className="w-full">
						<H2 className="mb-2 font-medium text-xl">
							Access Settings
						</H2>
						<SettingsTiles
							type="PROJECT"
							direction="row"
							name={
								project?.project_display_name ||
								project?.project_name ||
								"app"
							}
							id={project.project_id}
						/>
					</section>
				)}

				<section className="w-full">
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
						<H2 className="font-medium text-xl">
							Member Permissions
						</H2>
						{view === "MEMBERS" && canOpenViews ? (
							<Button asChild variant="outline" size="sm">
								<Link
									to={`${accessControlPath}/effective-permissions`}
								>
									<ListChecks
										className="size-4"
										aria-hidden
									/>
									Effective Permissions
								</Link>
							</Button>
						) : null}
					</div>
					{view !== "MEMBERS" && !canEditAccess ? (
						<p className="text-muted-foreground text-sm">
							Only this app's editors and owners can use this.
							Admins use it in admin mode, from the app's settings
							page.
						</p>
					) : view === "BULK_ACCESS_MANAGEMENT" ? (
						<BulkAccessManagement
							// a new target starts from its own access, never the last one's staged changes
							key={`${target.resourceType}:${target.id}`}
							target={target}
							name={name}
							noun="app"
							backTo=".."
							admin={false}
							isDirectoryAvailable={isDirectoryAvailable}
							headingLevel={3}
						/>
					) : view === "EFFECTIVE" ? (
						<EffectivePermissions
							// a new target reads its own access afresh
							key={`${target.resourceType}:${target.id}`}
							target={target}
							name={name}
							backTo=".."
							headingLevel={3}
						/>
					) : (
						<div className="flex flex-col gap-4">
							{canOpenViews ? (
								<BulkAccessManagementCard
									to={`${accessControlPath}/bulk-access-management`}
									noun="app"
								/>
							) : null}
							<PendingMembersTable
								type="PROJECT"
								id={project.project_id}
							/>
							<MembersTable
								type="PROJECT"
								id={project.project_id}
								onChange={() => refresh()}
								isDirectoryAvailable={isDirectoryAvailable}
							/>
							<div className="mt-6">
								<TeamsTable
									type="PROJECT"
									id={project.project_id}
									canManage={permission === "OWNER"}
									canViewPeople={canEditAccess}
								/>
							</div>
						</div>
					)}
				</section>
			</div>
		</SettingsContext.Provider>
	);
};
