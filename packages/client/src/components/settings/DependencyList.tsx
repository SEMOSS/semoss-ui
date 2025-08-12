import { Add } from "@mui/icons-material";
import { useState } from "react";
import { Box, Button, styled, Typography, useNotification } from "@semoss/ui";
import { useGetProjectDependencies } from "@/pixel/projects";
import type { ProjectDependencyEngine, User } from "@/types";
import { MemberDependencyOverlay } from "./MemberDependencyOverlay";
import type { SETTINGS_ROLE } from "./settings.types";

interface DependencyListProps {
	id: string;
}

const StyledUuidItem = styled("button")(({ theme }) => ({
	padding: theme.spacing(2),
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	marginBottom: theme.spacing(1),
	backgroundColor: theme.palette.background.paper,
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	cursor: "pointer",
	transition: "background-color 0.2s ease",
	width: "100%",
	textAlign: "left",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
}));

const StyledUuidList = styled("div")({
	width: "100%",
	maxHeight: "500px",
	overflowY: "auto",
});

const StyledAddMemberContainer = styled("div")({
	display: "flex",
	padding: "10px 24px 10px 8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledCenteredBox = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "8px",
});

const StyledContainer = styled("div")({
	width: "100%",
});

const StyledHeader = styled("div")({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
});

export const DependencyList = ({ id }: DependencyListProps) => {
	const getProjectDependencies = useGetProjectDependencies(id);
	const notification = useNotification();

	/** Add Member State */
	const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
	const [addModalUser, setAddModalUser] = useState<User | null>(null);

	const openDependencyAddMembersModal = () => {
		setAddModalUser(null); // reset user for add
		setAddMembersModal(true);
	};

	const [userPermission, _setUserPermission] =
		useState<SETTINGS_ROLE>("Read-Only");

	const handleEngineClick = (engineId: string, engineType: string) => {
		if (!engineId || !engineType) {
			notification.add({
				color: "warning",
				message:
					"Engine information is incomplete. Cannot open engine.",
			});
			return;
		}
		try {
			const engineTypeRoute = engineType.toLowerCase();
			const enginePath = `/#/engine/${engineTypeRoute}/${encodeURIComponent(engineId)}`;
			window.open(enginePath, "_blank", "noopener,noreferrer");
		} catch (_error) {
			notification.add({
				color: "error",
				message: "Failed to open engine. Please try again.",
			});
		}
	};

	const renderDependencies = () => {
		if (getProjectDependencies.status === "LOADING") {
			return (
				<Typography variant="body2" color="secondary">
					Loading dependencies...
				</Typography>
			);
		}

		if (getProjectDependencies.status === "ERROR") {
			return (
				<Typography variant="body2" color="error">
					Error loading dependencies. Check console for details.
				</Typography>
			);
		}

		if (
			getProjectDependencies.status === "SUCCESS" &&
			Array.isArray(getProjectDependencies.data) &&
			getProjectDependencies.data.length > 0
		) {
			return getProjectDependencies.data.map(
				(dependency: ProjectDependencyEngine, index: number) => (
					<StyledUuidItem
						key={dependency.engine_id || index}
						onClick={() =>
							handleEngineClick(
								dependency.engine_id,
								dependency.engine_type,
							)
						}
						aria-label={`Open ${dependency.engine_name} engine`}
					>
						<div>
							<Typography variant="subtitle2" color="primary">
								{dependency.engine_name} (
								{dependency.engine_type})
							</Typography>
							<Typography variant="body2" color="secondary">
								ID: {dependency.engine_id}
							</Typography>
						</div>
					</StyledUuidItem>
				),
			);
		}

		return (
			<Typography variant="body2" color="secondary">
				No dependencies found for this application.
			</Typography>
		);
	};

	return (
		<StyledContainer>
			<StyledHeader>
				<Typography variant="h6" sx={{ mb: 2 }}>
					Dependencies
				</Typography>
				<StyledAddMemberContainer>
					<Button
						variant="contained"
						onClick={openDependencyAddMembersModal}
					>
						<StyledCenteredBox>
							<Add />
							Add Members
						</StyledCenteredBox>
					</Button>
				</StyledAddMemberContainer>
			</StyledHeader>
			<Typography variant="body2" sx={{ mb: 2 }}>
				The following resources are associated with this application:
			</Typography>

			<StyledUuidList>
				{renderDependencies()}
				<MemberDependencyOverlay
					id={id}
					open={addMembersModal}
					user={addModalUser}
					setAddModalUser={setAddModalUser}
					userPermission={userPermission}
					onClose={() => setAddMembersModal(false)}
				/>
			</StyledUuidList>
		</StyledContainer>
	);
};
