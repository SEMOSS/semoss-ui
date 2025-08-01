import Refresh from "@mui/icons-material/Refresh";
import React from "react";
import {
	Button,
	CircularProgress,
	styled,
	Table,
	Typography,
} from "@semoss/ui";
import { Section } from "@/components/ui";
import { useVersionsTable } from "@/hooks";

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

// VersionsTable component displays project commit history with restore functionality

export const VersionsTable: React.FC<{ id: string }> = ({ id }) => {
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
	} = useVersionsTable(id);

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
							<Table.Cell component="th">Date</Table.Cell>
							<Table.Cell component="th">Action</Table.Cell>
						</Table.Row>
					</Table.Head>
					<Table.Body>
						{currentVersions.map((version) => (
							<Table.Row key={version.commitId}>
								<Table.Cell>{version.commitId}</Table.Cell>
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
		</StyledContainer>
	);
};
