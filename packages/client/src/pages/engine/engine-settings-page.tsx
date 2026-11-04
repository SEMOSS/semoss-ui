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
import { ModelUsageLimitsCard } from "@/features/model-usage-limits/model-usage-limits-card";
import { useConfig, useEngine } from "@/hooks";

export interface EngineSettingsPageProps {
	/**
	 * What shows under Member Permissions: the members, Bulk Access Management
	 * or Effective Permissions. The access settings above stay as they are.
	 */
	view?: AccessControlView;
}

/**
 * An engine's access control: its access settings, then its members, or Bulk
 * Access Management or Effective Permissions in their place.
 */
export const EngineSettingsPage = ({
	view = "MEMBERS",
}: EngineSettingsPageProps) => {
	const { catalog, type, engine, permission } = useEngine();
	// bulk access management, effective permissions and teams go by the user's own access:
	// an admin uses them in admin mode, from the settings pages
	const canEditAccess = permission === "OWNER" || permission === "EDIT";
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);
	// the other views are reached from the access control tab only, not where
	// the page is shown in a panel
	const { pathname } = useLocation();
	const accessControlPath = getAccessControlPath(pathname);
	const canOpenViews = canEditAccess && accessControlPath !== null;
	const target = { resourceType: "ENGINE" as const, id: engine.engine_id };
	const name =
		engine.engine_display_name || engine.engine_name || engine.engine_id;

	return (
		<SettingsContext.Provider
			value={{
				adminMode: false,
			}}
		>
			<div className="flex w-full flex-col items-start gap-6 self-stretch">
				<section className="w-full">
					<H2 className="mb-2 font-medium text-xl">
						Access Settings
					</H2>
					<SettingsTiles
						type={type}
						id={engine.engine_id}
						name={catalog.name}
						direction="row"
					/>
				</section>
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
							Only this engine's editors and owners can use this.
							Admins use it in admin mode, from the engine's
							settings page.
						</p>
					) : view === "BULK_ACCESS_MANAGEMENT" ? (
						<BulkAccessManagement
							// a new target starts from its own access, never the last one's staged changes
							key={`${target.resourceType}:${target.id}`}
							target={target}
							name={name}
							noun="engine"
							backTo=".."
							admin={false}
							isDirectoryAvailable={isDirectoryAvailable}
							isModel={type === "MODEL"}
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
							isModel={type === "MODEL"}
						/>
					) : (
						<div className="flex flex-col gap-4">
							{canOpenViews ? (
								<BulkAccessManagementCard
									to={`${accessControlPath}/bulk-access-management`}
									noun="engine"
								/>
							) : null}
							{type === "MODEL" && canEditAccess ? (
								<ModelUsageLimitsCard
									// a new model reads its own limits afresh
									key={engine.engine_id}
									engineId={engine.engine_id}
								/>
							) : null}
							<PendingMembersTable
								type={type}
								id={engine.engine_id}
							/>
							<MembersTable
								type={type}
								id={engine.engine_id}
								isDirectoryAvailable={isDirectoryAvailable}
							/>
							<div className="mt-6">
								<TeamsTable
									type="ENGINE"
									id={engine.engine_id}
									canManage={permission === "OWNER"}
									canViewPeople={canEditAccess}
									model={
										type === "MODEL"
											? {
													isPublic:
														engine.engine_global ===
														true,
												}
											: undefined
									}
								/>
							</div>
						</div>
					)}
				</section>
			</div>
		</SettingsContext.Provider>
	);
};
