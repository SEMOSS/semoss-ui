import { useNavigate } from "react-router-dom";
import { Box, Stack, styled, Typography } from "@semoss/ui";
import {
	MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
import { TeamsTable } from "@/components/settings/TeamsTable";
import { SettingsContext } from "@/contexts";

// Styled components
const StyledBox = styled(Box)(({ theme }) => ({
	padding: theme.spacing(3),
	width: "100%",
}));

const StyledSection = styled("section")(({ theme }) => ({
	paddingBottom: theme.spacing(3),
	width: "100%",
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
	fontSize: 20,
	fontWeight: "500",
	marginBottom: theme.spacing(1),
}));

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
		<StyledBox>
			{permission === "author" && (
				<StyledSection>
					<SectionHeading variant="h2">Access</SectionHeading>
					<SettingsContext.Provider value={{ adminMode: false }}>
						<SettingsTiles
							type="PROJECT"
							direction="row"
							name={appInfo?.project_name || "app"}
							id={appId}
							skipGuardrailCheck={true}
							onDelete={() => {
								navigate("/settings/app");
							}}
						/>
					</SettingsContext.Provider>
				</StyledSection>
			)}

			<StyledSection>
				<SectionHeading variant="h2">Current Member</SectionHeading>
				<SettingsContext.Provider value={{ adminMode: false }}>
					<Stack direction="column" spacing={2}>
						<PendingMembersTable type="PROJECT" id={appId} />
						<MembersTable
							type="PROJECT"
							id={appId}
							onChange={fetchUserSpecificData}
						/>
						<div style={{ marginTop: 24 }}>
							<TeamsTable type="PROJECT" id={appId} />
						</div>
					</Stack>
				</SettingsContext.Provider>
			</StyledSection>
		</StyledBox>
	);
};
