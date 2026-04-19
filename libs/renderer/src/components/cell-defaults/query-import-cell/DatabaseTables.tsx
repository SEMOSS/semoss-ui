import { CalendarDays, Clock, Hash, Table, Type } from "lucide-react";
import { useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { Progress, Separator } from "@semoss/ui/next";

export const DatabaseTables = (props: { databaseId: string }) => {
	const [tables, setTables] = useState({});
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const databaseMetamodel = usePixel<{
		dataTypes: Record<string, "INT" | "DOUBLE" | "STRING">;
		nodes: { propSet: string[]; conceptualName: string }[];
	}>(
		`GetDatabaseMetamodel( database=["${props.databaseId}"], options=["dataTypes"]); `,
	);

	useMemo(() => {
		if (databaseMetamodel.status !== "SUCCESS") {
			setIsLoading(true);
			return;
		}
		const { nodes = [], dataTypes = {} } = databaseMetamodel.data;
		const retrievedTables = {};
		nodes.forEach((n) => {
			const tableName = n.conceptualName;
			const filteredDataTypes = Object.keys(dataTypes).filter((colName) =>
				colName.includes(`${tableName}__`),
			);
			retrievedTables[n.conceptualName] = {
				columnNames: [...n.propSet],
				columnTypes: filteredDataTypes.reduce((acc, colName) => {
					acc[colName] = dataTypes[colName];
					return acc;
				}, {}),
			};
		});
		setTables(retrievedTables);
		setIsLoading(false);
	}, [databaseMetamodel.status, databaseMetamodel.data]);

	const getIconForDataType = (dataType: string) => {
		switch (dataType) {
			case "INT":
			case "DOUBLE":
			case "DECIMAL":
			case "NUMBER":
				return <Hash className="size-4" />;
			case "STRING":
			case "TEXT":
				return <Type className="size-4" />;
			case "DATE":
			case "DATETIME":
				return <CalendarDays className="size-4" />;
			case "TIME":
				return <Clock className="size-4" />;
			default:
				return null;
		}
	};

	if (isLoading) {
		return <Progress value={undefined} className="w-full" />;
	}

	return (
		<div>
			<div className="flex w-full flex-row gap-4 overflow-auto p-0.5">
				{Array.from(Object.keys(tables), (tableName, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
						key={`${tableName}-${index}`}
						className="min-w-[140px] rounded-md border bg-card shadow-sm"
					>
						<div className="flex items-center gap-2 px-3 py-2">
							<Table className="size-4 shrink-0" />
							<span className="truncate font-medium text-sm">
								{tableName}
							</span>
						</div>
						<Separator />
						<ul className="max-h-[60px] overflow-auto">
							{Array.from(
								tables[tableName].columnNames,
								(columnName: string, idx) => (
									<li
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										key={`${columnName}-${idx}`}
										className="flex items-center gap-2 px-3 py-1"
									>
										<span className="shrink-0">
											{getIconForDataType(
												tables[tableName].columnTypes[
													`${tableName}__${columnName}`
												],
											)}
										</span>
										<span className="truncate text-xs">
											{columnName}
										</span>
									</li>
								),
							)}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
};
