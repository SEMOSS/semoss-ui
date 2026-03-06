import { useNavigate } from "react-router-dom";
import { H2 } from "@semoss/ui/next";
import {
	MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
import { TeamsTable } from "@/components/settings/teams-table";
import { SettingsContext } from "@/contexts";

// Component props
interface AccessProps {
	appInfo: {
		project_name?: string;
	};
	appId: string;
	fetchUserSpecificData: () => void;
	permission: string;
}

export const AccessControl = ({
	appInfo,
	appId,
	fetchUserSpecificData,
	permission,
}: AccessProps) => {
	const navigate = useNavigate();

	return (
		<div className="w-full">
			{permission === "author" && (
				<section className="w-full pb-6">
					<H2 className="mb-2 font-medium text-xl">Acess Settings</H2>
					<SettingsContext.Provider value={{ adminMode: false }}>
						<SettingsTiles
							type="PROJECT"
							direction="row"
							name={appInfo?.project_name || "app"}
							id={appId}
							onDelete={() => {
								navigate("/settings/app");
							}}
						/>
					</SettingsContext.Provider>
				</section>
			)}

			<section className="w-full pb-6">
				<H2 className="mb-2 font-medium text-xl">Member Permissions</H2>
				<SettingsContext.Provider value={{ adminMode: false }}>
					<div className="flex flex-col gap-4">
						<PendingMembersTable type="PROJECT" id={appId} />
						<MembersTable
							type="PROJECT"
							id={appId}
							onChange={fetchUserSpecificData}
						/>
						<div className="mt-6">
							<TeamsTable type="PROJECT" id={appId} />
						</div>
					</div>
				</SettingsContext.Provider>
			</section>
		</div>
	);
};
