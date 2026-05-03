import { useDatabaseQueryExecution } from "./use-database-query-execution";

interface SparqlQueryExecutionOptions {
	onSchemaChange?: () => void;
}

export function useSparqlQueryExecution(
	engineId: string,
	raw: boolean,
	options: SparqlQueryExecutionOptions = {},
) {
	return useDatabaseQueryExecution(
		engineId,
		(id, query) =>
			`SparqlQuery(database=["${id}"], query=["<encode>${query}</encode>"], raw=[${raw}], commit=[true]);`,
		options,
	);
}
