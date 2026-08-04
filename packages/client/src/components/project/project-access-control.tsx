import { MembersTable } from "@semoss/shared";
import { H2 } from "@semoss/ui/next";
import { PendingMembersTable, SettingsTiles } from "@/components/settings";
import { TeamsTable } from "@/components/settings/teams-table";
import { SettingsContext } from "@/contexts";
import { useProject } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

export const ProjectAccessControl = () => {
	const { project, permission, refresh } = useProject();

	const navigate = useNavigate();

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
							onDelete={() => {
								navigate("/app");
							}}
						/>
					</section>
				)}

				<section className="w-full">
					<H2 className="mb-2 font-medium text-xl">
						Member Permissions
					</H2>
					<div className="flex flex-col gap-4">
						<PendingMembersTable
							type="PROJECT"
							id={project.project_id}
						/>
						<MembersTable
							type="PROJECT"
							id={project.project_id}
							onChange={() => refresh()}
						/>
						<div className="mt-6">
							<TeamsTable
								type="PROJECT"
								id={project.project_id}
							/>
						</div>
						pn
					</div>
				</section>
			</div>
		</SettingsContext.Provider>
	);
};
