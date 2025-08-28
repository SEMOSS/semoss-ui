import Refresh from "@mui/icons-material/Refresh";
import { useEffect, useState } from "react";
import {
	Button,
	Chip,
	CircularProgress,
	styled,
	Table,
	Typography,
} from "@semoss/ui";
import { Section } from "@/components/ui";
import { useVersionsTable } from "@/hooks";
import type {
	CommitVersion,
	FileSavedEventDetail,
	VersionsTableProps,
} from "@/types/types";
import { AddTagModal } from "./AddTagModal";

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

const StyledActionButtons = styled("div")(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
	whiteSpace: "nowrap",
}));

const StyledCommitCell = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(0.5),
}));

const StyledTagsContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexWrap: "wrap",
	gap: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
}));

const StyledDateCell = styled(Table.Cell)(() => ({
	minWidth: "180px",
	width: "180px",
}));

/**
 * VersionsTable component displays project commit history with restore and tag management functionality.
 *
 * Features:
 * - Display commit history with pagination
 * - Restore functionality for reverting to previous commits
 * - Tag management (add tags to commits)
 * - Real-time tag display with hover effects
 * - Automatic refresh on file save events
 */
export const VersionsTable: React.FC<VersionsTableProps> = ({ id }) => {
	const {
		loading,
		error,
		restoreLoading,
		refreshing,
		currentVersions,
		page,
		rowsPerPage,
		totalCount,
		handlePageChange,
		handleRowsPerPageChange,
		handleRefresh,
		handleRestore,
		getAllTags,
		addTagToVersion,
	} = useVersionsTable(id);

	// State for Add Tag Modal
	const [selectedVersion, setSelectedVersion] =
		useState<CommitVersion | null>(null);
	const [addTagModalOpen, setAddTagModalOpen] = useState(false);

	const handleAddTag = (version: CommitVersion) => {
		setSelectedVersion(version);
		setAddTagModalOpen(true);
	};

	const handleCloseTagModal = () => {
		setAddTagModalOpen(false);
		setSelectedVersion(null);
	};

	const handleTagAdded = (newTag: string) => {
		if (selectedVersion) {
			addTagToVersion(selectedVersion.commitId, newTag);
		}
	};

	// Listen for file save events to automatically refresh the versions table
	useEffect(() => {
		const handleFileSaved = (event: CustomEvent<FileSavedEventDetail>) => {
			// Check if the saved file belongs to the same app/project
			if (event.detail?.appId === id) {
				handleRefresh();
			}
		};

		window.addEventListener("fileSaved", handleFileSaved as EventListener);

		return () => {
			window.removeEventListener(
				"fileSaved",
				handleFileSaved as EventListener,
			);
		};
	}, [id, handleRefresh]);

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
							onClick={handleRefresh}
							disabled={refreshing}
							size="small"
						>
							{refreshing ? "Refreshing..." : "Refresh"}
						</Button>
					}
				>
					<Typography variant="subtitle1">
						Project Version History
					</Typography>
				</Section.Header>

				<Table>
					<Table.Head>
						<Table.Row>
							<Table.Cell component="th">Commit ID</Table.Cell>
							<Table.Cell component="th">
								Commit Message
							</Table.Cell>
							<Table.Cell component="th">Author</Table.Cell>
							<StyledDateCell component="th">Date</StyledDateCell>
							<Table.Cell component="th">Action</Table.Cell>
						</Table.Row>
					</Table.Head>
					<Table.Body>
						{currentVersions.map((version) => (
							<Table.Row key={version.commitId}>
								<Table.Cell>
									<StyledCommitCell>
										<Typography variant="body2">
											{version.commitId}
										</Typography>
										{version.tags &&
											version.tags.length > 0 && (
												<StyledTagsContainer>
													{version.tags.map((tag) => (
														<Chip
															key={tag}
															label={tag}
															size="small"
														/>
													))}
												</StyledTagsContainer>
											)}
									</StyledCommitCell>
								</Table.Cell>
								<Table.Cell>{version.commitMessage}</Table.Cell>
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
								<StyledDateCell>{version.date}</StyledDateCell>
								<Table.Cell>
									<StyledActionButtons>
										<Button
											color="primary"
											size="small"
											variant="contained"
											disabled={
												restoreLoading ===
												version.commitId
											}
											onClick={() =>
												handleRestore(version)
											}
										>
											{restoreLoading ===
											version.commitId ? (
												<StyledLoadingRow>
													<CircularProgress
														size={16}
													/>
													Restoring...
												</StyledLoadingRow>
											) : (
												"Restore"
											)}
										</Button>
										<Button
											color="primary"
											size="small"
											variant="contained"
											onClick={() =>
												handleAddTag(version)
											}
											disabled={
												restoreLoading ===
												version.commitId
											}
										>
											Add Tag
										</Button>
									</StyledActionButtons>
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
					<Table.Footer>
						<Table.Row>
							<Table.Pagination
								rowsPerPageOptions={[10, 25, 50, 100]}
								onPageChange={handlePageChange}
								page={page}
								rowsPerPage={rowsPerPage}
								onRowsPerPageChange={handleRowsPerPageChange}
								count={totalCount}
								disabled={loading || refreshing}
							/>
						</Table.Row>
					</Table.Footer>
				</Table>
			</Section>

			{/* Add Tag Modal */}
			{selectedVersion && (
				<AddTagModal
					open={addTagModalOpen}
					onClose={handleCloseTagModal}
					version={selectedVersion}
					projectId={id}
					existingTags={getAllTags()}
					onTagAdded={handleTagAdded}
				/>
			)}
		</StyledContainer>
	);
};
