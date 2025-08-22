import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { styled, useNotification } from "@semoss/ui";
import { getGroupType } from "@/api/teams";
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
	// pull :id from the url
	const { id: rawId } = useParams<{ id: string }>();
	const id = rawId ? decodeURIComponent(rawId) : undefined;
	const [type, setType] = useState<string | undefined>();
	const notification = useNotification();

	// Fetch type when id changes
	useEffect(() => {
		if (!id) {
			setType(undefined);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const fetchedType = await getGroupType(id);
				if (!cancelled) setType(fetchedType);
			} catch (_) {
				if (!cancelled) {
					notification.add({
						color: "error",
						message: "Failed to load team type",
					});
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);

	return (
		<StyledContainer>
			<StyledContent>
				{type && (
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
