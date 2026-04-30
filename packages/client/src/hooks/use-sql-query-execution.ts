import { useDatabaseQueryExecution } from "./use-database-query-execution";

interface SqlQueryExecutionOptions {
	onSchemaChange?: () => void;
}

export function useSqlQueryExecution(
	engineId: string,
	options: SqlQueryExecutionOptions = {},
) {
	return useDatabaseQueryExecution(
		engineId,
		(id, query) =>
			`SqlQuery(database=["${id}"], query=["<encode>${query}</encode>"], commit=[true]);`,
		options,
	);
}
