import { useNavigate } from "react-router-dom";
import { MembersTable } from "@semoss/shared";
import { styled } from "@semoss/ui";
import {
	// MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
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
				<SettingsTiles
					type={type}
					id={active.id}
					name={name}
					direction="row"
					onDelete={() => {
						navigate(`/engine/${path}`);
					}}
				/>
				<PendingMembersTable type={type} id={active.id} />
				<MembersTable type={type} id={active.id} />
			</div>
			<div style={{ marginTop: 24 }}>
				<TeamsTable type="ENGINE" id={active.id} />
			</div>
		</SettingsContext.Provider>
	);
};
