import { MembersTable } from "@semoss/shared";
import { H2 } from "@semoss/ui/next";
import { PendingMembersTable, SettingsTiles } from "@/components/settings";
import { TeamsTable } from "@/components/settings/teams-table";
import { SettingsContext } from "@/contexts";
import { useEngine } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

export const EngineSettingsPage = () => {
	const { name, path, type, engine } = useEngine();
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
						id={engine.engine_id}
						name={name}
						direction="row"
						onDelete={() => {
							navigate(`/${path}`);
						}}
					/>
				</section>
				<section className="w-full">
					<H2 className="mb-2 font-medium text-xl">
						Member Permissions
					</H2>
					<div className="flex flex-col gap-4">
						<PendingMembersTable
							type={type}
							id={engine.engine_id}
						/>
						<MembersTable type={type} id={engine.engine_id} />
						<div className="mt-6">
							<TeamsTable type="ENGINE" id={engine.engine_id} />
						</div>
					</div>
				</section>
			</div>
		</SettingsContext.Provider>
	);
};
