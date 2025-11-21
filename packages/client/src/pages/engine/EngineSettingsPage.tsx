import { useNavigate } from "react-router-dom";
import { styled } from "@semoss/ui";
import {
	MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
import { TeamsTable } from "@/components/settings/TeamsTable";
import { SettingsContext } from "@/contexts";
import { useEngine } from "@/hooks";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(3),
}));

export const EngineSettingsPage = () => {
	const { name, path, type, active } = useEngine();
	const navigate = useNavigate();

	return (
		<SettingsContext.Provider
			value={{
				adminMode: false,
			}}
		>
			<StyledContainer>
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
			</StyledContainer>
			<div style={{ marginTop: 24 }}>
				<TeamsTable type="ENGINE" id={active.id} />
			</div>
		</SettingsContext.Provider>
	);
};
