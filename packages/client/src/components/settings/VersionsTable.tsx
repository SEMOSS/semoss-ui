import React, { useEffect, useState } from "react";
import { Button } from "@semoss/ui";
import { useRootStore } from "@/hooks";

interface CommitVersion {
	hash: string;
	date: string;
	message: string;
}

export const VersionsTable: React.FC<{ id: string }> = ({ id }) => {
	const { monolithStore } = useRootStore();
	const [versions, setVersions] = useState<CommitVersion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchVersions = async () => {
			try {
				setLoading(true);
				setError(null);

				// Call the ProjectCommitDetails reactor with the project id as string
				const response = await monolithStore.runQuery(
					`ProjectCommitDetails(project="${id}")`,
				);

				const output = response.pixelReturn[0].output;
				const operationType = response.pixelReturn[0].operationType;

				if (
					operationType.some((type: string) => type.includes("ERROR"))
				) {
					setError("Failed to fetch commit details");
					setVersions([]);
				} else {
					// Transform the response data into the expected format
					// The API returns an array of arrays: [hash, date, message]
					const transformedVersions: CommitVersion[] = output.map(
						(item: [string, string, string]) => ({
							hash: item[0],
							date: item[1],
							message: item[2],
						}),
					);

					setVersions(transformedVersions);
				}
			} catch (err) {
				console.error("Error fetching versions:", err);
				setError("Failed to fetch commit details");
				setVersions([]);
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchVersions();
		}
	}, [id, monolithStore]);

	if (loading) {
		return (
			<div
				style={{ width: "100%", padding: "20px", textAlign: "center" }}
			>
				Loading commit details...
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					width: "100%",
					padding: "20px",
					textAlign: "center",
					color: "red",
				}}
			>
				{error}
			</div>
		);
	}
	return (
		<div style={{ width: "100%" }}>
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th
							style={{
								textAlign: "left",
								padding: "8px",
								borderBottom: "1px solid #ccc",
							}}
						>
							Commit Message
						</th>
						<th
							style={{
								textAlign: "left",
								padding: "8px",
								borderBottom: "1px solid #ccc",
							}}
						>
							Date
						</th>
						<th
							style={{
								textAlign: "left",
								padding: "8px",
								borderBottom: "1px solid #ccc",
							}}
						>
							Action
						</th>
					</tr>
				</thead>
				<tbody>
					{versions.map((version) => (
						<tr key={version.hash}>
							<td
								style={{
									padding: "8px",
									borderBottom: "1px solid #eee",
								}}
							>
								{version.message}
							</td>
							<td
								style={{
									padding: "8px",
									borderBottom: "1px solid #eee",
								}}
							>
								{version.date}
							</td>
							<td
								style={{
									padding: "8px",
									borderBottom: "1px solid #eee",
								}}
							>
								<Button
									color="primary"
									size="small"
									variant="contained"
									onClick={() => {
										alert(
											`Restore to commit: ${version.hash}\nAppID: ${id}`,
										);
									}}
								>
									Restore
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
