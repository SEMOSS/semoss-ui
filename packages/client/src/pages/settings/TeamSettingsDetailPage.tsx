import { useParams } from "react-router-dom";
import { styled } from "@semoss/ui";
import {
	TeamEnginesTable,
	TeamMembersTable,
	TeamProjectsTable,
} from "@/components/teams";
import { TeamMembersProviderBanner } from "@/components/teams/TeamMembersProviderBanner";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	paddingBottom: "16px",
}));

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	flexShrink: "0",
}));

export const TeamSettingsDetailPage = () => {
	// pull :type and :id from the url
	const { type: rawType, id: rawId } = useParams<{
		type: string;
		id: string;
	}>();
	const type = rawType ? decodeURIComponent(rawType) : undefined;
	const id = rawId ? decodeURIComponent(rawId) : undefined;

	return (
		<StyledContainer>
			<StyledContent>
				{type && id && (
					<>
						{type === "CUSTOM" ? (
							<TeamMembersTable groupId={id} name="MEMBERS" />
						) : (
							<TeamMembersProviderBanner type={type} />
						)}
						<TeamProjectsTable
							groupId={id}
							groupType={type}
							name="PROJECTS"
						/>
						<TeamEnginesTable
							groupId={id}
							groupType={type}
							name="ENGINES"
						/>
					</>
				)}
			</StyledContent>
		</StyledContainer>
	);
};
