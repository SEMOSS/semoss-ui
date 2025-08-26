import { CircularProgress } from "@mui/material";
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
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const notification = useNotification();

	// Fetch type when id changes
	useEffect(() => {
		let cancelled = false;
		if (!id) {
			setType(undefined);
			return () => {
				cancelled = true;
			};
		}
		// reset while loading a new id
		setType(undefined);
		setIsLoading(true);
		setError(null);
		(async () => {
			try {
				const fetchedType = await getGroupType(id);
				if (!cancelled) setType(fetchedType);
			} catch {
				if (!cancelled) {
					setError("Failed to load team type");
					notification.add({
						color: "error",
						message: "Failed to load team type",
					});
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id, notification]);

	return (
		<StyledContainer>
			<StyledContent>
				{isLoading && <CircularProgress />}
				{error && <div>{error}</div>}
				{!isLoading && !error && type && (
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
