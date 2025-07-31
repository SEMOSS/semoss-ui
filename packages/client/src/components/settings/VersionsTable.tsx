import Refresh from "@mui/icons-material/Refresh";
import React, { useCallback, useEffect, useState } from "react";
import {
	Button,
	CircularProgress,
	styled,
	Table,
	Typography,
	useNotification,
} from "@semoss/ui";
import { Section } from "@/components/ui";
import { useRootStore } from "@/hooks";

// Styled Components
const StyledContainer = styled("div")(() => ({
	width: "100%",
}));

const StyledLoadingContainer = styled("div")(({ theme }) => ({
	width: "100%",
	padding: theme.spacing(2.5),
	textAlign: "center",
	color: theme.palette.text.secondary,
}));

const StyledErrorContainer = styled("div")(({ theme }) => ({
	width: "100%",
	padding: theme.spacing(2.5),
	textAlign: "center",
	color: theme.palette.error.main,
	backgroundColor: theme.palette.error.light,
	border: `1px solid ${theme.palette.error.main}`,
	borderRadius: theme.shape.borderRadius,
}));

const StyledVersionCount = styled(Typography)(({ theme }) => ({
	marginLeft: theme.spacing(1),
	color: theme.palette.text.secondary,
}));

const StyledAuthorContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(0.25),
}));

const StyledAuthorName = styled(Typography)(({ theme }) => ({
	fontWeight: theme.typography.fontWeightMedium,
}));

const StyledAuthorEmail = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledLoadingRow = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
}));

/**
 * Represents a single commit version in the project history
 */
interface CommitVersion {
	commitId: string;
	author: {
		userId: string;
		userEmail: string;
	};
	date: string;
	commitMessage: string;
}

/**
 * VersionsTable component displays project commit history with restore functionality
 */
export const VersionsTable: React.FC<{ id: string }> = ({ id }) => {
	const { monolithStore } = useRootStore();
	const notification = useNotification();
	const [versions, setVersions] = useState<CommitVersion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [restoreLoading, setRestoreLoading] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Fetch versions data from the API

	const fetchVersions = useCallback(async () => {
		try {
			setLoading(true);
			setRefreshing(true);
			setError(null);

			const response = await monolithStore.runQuery(
				`ProjectCommitDetails(project="${id}")`,
			);

			const { output, operationType } = response.pixelReturn[0];

			if (operationType.some((type: string) => type.includes("ERROR"))) {
				setError("Failed to fetch commit details");
				setVersions([]);
				return;
			}

			// Transform API response to CommitVersion format
			const transformedVersions: CommitVersion[] = output || [];
			setVersions(transformedVersions);
		} catch (err) {
			console.error("Error fetching versions:", err);
			setError("Failed to fetch commit details");
			setVersions([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [id, monolithStore]);

	useEffect(() => {
		if (!id) return;
		fetchVersions();
	}, [id, fetchVersions]);

	//Handle restore action for a specific commit version
	const handleRestore = async (version: CommitVersion) => {
		try {
			setRestoreLoading(version.commitId);

			const response = await monolithStore.runQuery(
				`ProjectCommitRestore(project="${id}", commitId="${version.commitId}")`,
			);

			const { operationType } = response.pixelReturn[0];

			if (operationType.some((type: string) => type.includes("ERROR"))) {
				notification.add({
					color: "error",
					message: `Failed to restore to commit ${version.commitId}`,
				});
			} else {
				notification.add({
					color: "success",
					message: `Successfully restored to commit ${version.commitId}`,
				});
				window.location.reload();
			}
		} catch (error) {
			console.error("Error restoring commit:", error);
			notification.add({
				color: "error",
				message: `Failed to restore to commit ${version.commitId}`,
			});
		} finally {
			setRestoreLoading(null);
		}
	};

	// Early returns for loading and error states
	if (loading) {
		return (
			<StyledLoadingContainer>
				Loading commit details...
			</StyledLoadingContainer>
		);
	}

	if (error) {
		return <StyledErrorContainer>{error}</StyledErrorContainer>;
	}

	return (
		<StyledContainer>
			<Section>
				<Section.Header
					actions={
						<Button
							variant="outlined"
							startIcon={<Refresh />}
							onClick={fetchVersions}
							disabled={refreshing}
							size="small"
						>
							{refreshing ? "Refreshing..." : "Refresh"}
						</Button>
					}
				>
					<Typography variant="subtitle1">
						Project Version History
						{versions.length > 0 && (
							<StyledVersionCount
								component="span"
								variant="body2"
							>
								({versions.length} version
								{versions.length !== 1 ? "s" : ""})
							</StyledVersionCount>
						)}
					</Typography>
				</Section.Header>

				<Table>
					<Table.Head>
						<Table.Row>
							<Table.Cell component="th">Commit ID</Table.Cell>
							<Table.Cell component="th">Author</Table.Cell>
							<Table.Cell component="th">
								Commit Message
							</Table.Cell>
							<Table.Cell component="th">Date</Table.Cell>
							<Table.Cell component="th">Action</Table.Cell>
						</Table.Row>
					</Table.Head>
					<Table.Body>
						{versions.map((version) => (
							<Table.Row key={version.commitId}>
								<Table.Cell>{version.commitId}</Table.Cell>
								<Table.Cell>
									<StyledAuthorContainer>
										<StyledAuthorName variant="body2">
											{version.author.userId}
										</StyledAuthorName>
										<StyledAuthorEmail variant="caption">
											{version.author.userEmail}
										</StyledAuthorEmail>
									</StyledAuthorContainer>
								</Table.Cell>
								<Table.Cell>{version.commitMessage}</Table.Cell>
								<Table.Cell>{version.date}</Table.Cell>
								<Table.Cell>
									<Button
										color="primary"
										size="small"
										variant="contained"
										disabled={
											restoreLoading === version.commitId
										}
										onClick={() => handleRestore(version)}
									>
										{restoreLoading === version.commitId ? (
											<StyledLoadingRow>
												<CircularProgress size={16} />
												Restoring...
											</StyledLoadingRow>
										) : (
											"Restore"
										)}
									</Button>
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table>
			</Section>
		</StyledContainer>
	);
};
