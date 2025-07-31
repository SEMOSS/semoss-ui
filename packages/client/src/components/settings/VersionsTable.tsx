import React, { useEffect, useState } from "react";
import { Button, styled, Table, useNotification } from "@semoss/ui";
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

/**
 * Represents a single commit version in the project history
 */
interface CommitVersion {
	hash: string;
	date: string;
	message: string;
}

/**
 * Props for the VersionsTable component
 */
interface VersionsTableProps {
	/** The project ID to fetch versions for */
	id: string;
}

/**
 * VersionsTable component displays project commit history with restore functionality
 *
 * @param props - Component props
 * @param props.id - The project ID to fetch versions for
 * @returns JSX element rendering the versions table
 */
export const VersionsTable: React.FC<VersionsTableProps> = ({ id }) => {
	const { monolithStore } = useRootStore();
	const notification = useNotification();

	const [versions, setVersions] = useState<CommitVersion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [restoreLoading, setRestoreLoading] = useState<string | null>(null);

	/**
	 * Fetch versions data from the API
	 */
	useEffect(() => {
		if (!id) return;

		const fetchVersions = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await monolithStore.runQuery(
					`ProjectCommitDetails(project="${id}")`,
				);

				const { output, operationType } = response.pixelReturn[0];

				if (
					operationType.some((type: string) => type.includes("ERROR"))
				) {
					setError("Failed to fetch commit details");
					setVersions([]);
					return;
				}

				// Transform API response to CommitVersion format
				const transformedVersions: CommitVersion[] = output.map(
					([hash, date, message]: [string, string, string]) => ({
						hash,
						date,
						message,
					}),
				);

				setVersions(transformedVersions);
			} catch (err) {
				console.error("Error fetching versions:", err);
				setError("Failed to fetch commit details");
				setVersions([]);
			} finally {
				setLoading(false);
			}
		};

		fetchVersions();
	}, [id, monolithStore]);

	/**
	 * Handle restore action for a specific commit version
	 *
	 * @param version - The commit version to restore
	 */
	const handleRestore = async (version: CommitVersion) => {
		try {
			setRestoreLoading(version.hash);

			const response = await monolithStore.runQuery(
				`ProjectCommitRestore(project="${id}", commitId="${version.hash}")`,
			);

			const { operationType } = response.pixelReturn[0];
			const shortHash = version.hash.substring(0, 8);

			if (operationType.some((type: string) => type.includes("ERROR"))) {
				notification.add({
					color: "error",
					message: `Failed to restore to commit ${shortHash}`,
				});
			} else {
				notification.add({
					color: "success",
					message: `Successfully restored to commit ${shortHash}`,
				});
			}
		} catch (error) {
			console.error("Error restoring commit:", error);
			notification.add({
				color: "error",
				message: `Failed to restore to commit ${version.hash.substring(0, 8)}`,
			});
		} finally {
			setRestoreLoading(null);
		}
	};

	// Loading state
	if (loading) {
		return (
			<StyledLoadingContainer>
				Loading commit details...
			</StyledLoadingContainer>
		);
	}

	// Error state
	if (error) {
		return <StyledErrorContainer>{error}</StyledErrorContainer>;
	}

	// Main table render
	return (
		<StyledContainer>
			<Table>
				<Table.Head>
					<Table.Row>
						<Table.Cell component="th">Commit Message</Table.Cell>
						<Table.Cell component="th">Date</Table.Cell>
						<Table.Cell component="th">Action</Table.Cell>
					</Table.Row>
				</Table.Head>
				<Table.Body>
					{versions.map((version) => (
						<Table.Row key={version.hash}>
							<Table.Cell>{version.message}</Table.Cell>
							<Table.Cell>{version.date}</Table.Cell>
							<Table.Cell>
								<Button
									color="primary"
									size="small"
									variant="contained"
									disabled={restoreLoading === version.hash}
									onClick={() => handleRestore(version)}
								>
									{restoreLoading === version.hash
										? "Restoring..."
										: "Restore"}
								</Button>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		</StyledContainer>
	);
};
