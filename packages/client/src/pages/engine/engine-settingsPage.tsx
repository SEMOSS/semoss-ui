import { useNavigate } from "react-router-dom";
import { MembersTable } from "@semoss/shared";
import { H2 } from "@semoss/ui/next";
import { PendingMembersTable, SettingsTiles } from "@/components/settings";
import { TeamsTable } from "@/components/settings/teams-table";
import { SettingsContext } from "@/contexts";
import { useEngine } from "@/hooks";

export const EngineSettingsPage = () => {
	const { name, path, type, active } = useEngine();
	const navigate = useNavigate();

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
						id={active.id}
						name={name}
						direction="row"
						onDelete={() => {
							navigate(`/engine/${path}`);
						}}
					/>
				</section>
				<section className="w-full">
					<H2 className="mb-2 font-medium text-xl">
						Member Permissions
					</H2>
					<div className="flex flex-col gap-4">
						<PendingMembersTable type={type} id={active.id} />
						<MembersTable type={type} id={active.id} />
						<div className="mt-6">
							<TeamsTable type="ENGINE" id={active.id} />
						</div>
					</div>
				</section>
			</div>
		</SettingsContext.Provider>
	);
};
