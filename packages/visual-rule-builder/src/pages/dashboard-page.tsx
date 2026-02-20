import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Alert, AlertDescription, Spinner } from "@semoss/ui/next";
import { DatabaseSelector } from "@/components/database-selector";
import { type Database, databaseStore } from "@/stores/database-store";

export const DashboardPage = observer(() => {
	useEffect(() => {
		const fetchDatabases = async () => {
			databaseStore.setLoading(true);
			databaseStore.setError(null);

			try {
				// Run the MyEngines reactor
				const response = await runPixel(
					`MyEngines(metaKeys=["tag","domain","data classification","data restrictions","description"], metaFilters=[{}], filterWord=[""], userT=[true], engineTypes=['DATABASE'], offset=[0], limit=[10]);`,
				);

				if (response.pixelReturn?.[0]) {
					const { operationType, output } = response.pixelReturn[0];

					if (operationType.includes("ERROR")) {
						const errorMessage =
							typeof output === "object" &&
							output !== null &&
							"message" in output
								? String(output.message)
								: "Failed to fetch databases";
						throw new Error(errorMessage);
					}

					const databases = Array.isArray(output) ? output : [];

					// Filter databases that have tag "json_rules"
					const filteredDatabases = databases.filter(
						(db: Database) => {
							if (Array.isArray(db.tag)) {
								return db.tag.includes("json_rules");
							}
							return db.tag === "json_rules";
						},
					);

					databaseStore.setDatabases(filteredDatabases);

					// Auto-select first database if available
					if (
						filteredDatabases.length > 0 &&
						!databaseStore.selectedDatabaseId
					) {
						databaseStore.setSelectedDatabaseId(
							filteredDatabases[0].database_id,
						);
					}
				}
			} catch (error) {
				console.error("Error fetching databases:", error);
				databaseStore.setError(
					error instanceof Error
						? error.message
						: "Failed to fetch databases",
				);
			} finally {
				databaseStore.setLoading(false);
			}
		};

		fetchDatabases();
	}, []);

	const handleDatabaseSelect = (databaseId: string) => {
		databaseStore.setSelectedDatabaseId(databaseId);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">
					Select a database to get started
				</p>
			</div>

			{databaseStore.error && (
				<Alert variant="destructive">
					<AlertDescription>{databaseStore.error}</AlertDescription>
				</Alert>
			)}

			<div className="space-y-4">
				<div>
					<label
						htmlFor="database-selector"
						className="mb-2 block font-medium text-sm"
					>
						Database
					</label>
					{databaseStore.isLoading ? (
						<div className="flex items-center gap-2 rounded-lg border p-4">
							<Spinner className="h-4 w-4" />
							<span className="text-muted-foreground text-sm">
								Loading databases...
							</span>
						</div>
					) : (
						<DatabaseSelector
							databases={databaseStore.databases}
							selectedDatabaseId={
								databaseStore.selectedDatabaseId
							}
							onSelect={handleDatabaseSelect}
						/>
					)}
				</div>

				{databaseStore.selectedDatabase && (
					<div className="rounded-lg border p-6">
						<h2 className="mb-4 font-semibold text-lg">
							Selected Database
						</h2>
						<dl className="grid gap-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Name:</dt>
								<dd className="font-medium">
									{databaseStore.selectedDatabase.app_name}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">ID:</dt>
								<dd className="font-mono text-xs">
									{databaseStore.selectedDatabase.database_id}
								</dd>
							</div>
							{databaseStore.selectedDatabase
								.database_subtype && (
								<div className="flex justify-between">
									<dt className="text-muted-foreground">
										Type:
									</dt>
									<dd className="font-medium">
										{
											databaseStore.selectedDatabase
												.database_subtype
										}
									</dd>
								</div>
							)}
							{databaseStore.selectedDatabase.description && (
								<div className="flex justify-between">
									<dt className="text-muted-foreground">
										Description:
									</dt>
									<dd className="font-medium">
										{
											databaseStore.selectedDatabase
												.description
										}
									</dd>
								</div>
							)}
						</dl>
					</div>
				)}

				{!databaseStore.isLoading &&
					databaseStore.databases.length === 0 && (
						<Alert>
							<AlertDescription>
								No databases with tag "json_rules" found.
							</AlertDescription>
						</Alert>
					)}
			</div>
		</div>
	);
});
