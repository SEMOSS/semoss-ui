import type React from "react";
import { useId } from "react";
import { Button, Label, P, Textarea } from "@semoss/ui/next";

export type DatabaseWizardManageAndQueryProps = {
	isLoading: boolean;
	schemaSql: string;
	querySql: string;
	onQuerySqlChange: (value: string) => void;
	onRunQuery: () => void;
	onRefreshSchema: () => void;
};

export const DatabaseWizardManageAndQuery: React.FC<
	DatabaseWizardManageAndQueryProps
> = ({
	isLoading,
	schemaSql,
	querySql,
	onQuerySqlChange,
	onRunQuery,
	onRefreshSchema,
}) => {
	const querySqlId = useId();

	return (
		<div className="flex flex-col gap-4">
			<P className="text-muted-foreground text-sm">
				Run queries and refresh schema metadata.
			</P>
			<div className="flex flex-col gap-2">
				<Label htmlFor={querySqlId}>SQL query</Label>
				<Textarea
					id={querySqlId}
					rows={5}
					value={querySql}
					onChange={(event) => onQuerySqlChange(event.target.value)}
					placeholder="SELECT * FROM table_name;"
				/>
				<Button
					variant="default"
					onClick={onRunQuery}
					disabled={isLoading || !querySql}
				>
					Run query
				</Button>
			</div>
			<div className="flex flex-col gap-2">
				<Label>Latest schema</Label>
				<Textarea rows={6} value={schemaSql} readOnly />
				<Button variant="outline" onClick={onRefreshSchema}>
					Refresh schema
				</Button>
			</div>
		</div>
	);
};
