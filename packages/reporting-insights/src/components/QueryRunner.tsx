/**
 * QueryRunner — a per-dashboard shared query cache.
 *
 * Many visualizations can be built from ONE query (different chart types over
 * the same data). To avoid running that query once per chart, this provider
 * memoises results by (database + batch size + run version + query): the first
 * chart triggers the fetch, and every other chart with an identical key reuses
 * the same in-flight promise / cached rows.
 *
 * The `version` is the caller's per-query run counter. All charts bound to the
 * same shared query pass the SAME version (and the same interpolated query), so
 * they collapse onto one fetch. A re-run bumps the version → a new key → exactly
 * one fresh fetch shared across every bound chart (no per-chart `force`, which
 * previously caused N parallel fetches for N charts).
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
} from "react";
import { useInsight } from "@semoss/sdk-react";
import {
	buildQueryPixel,
	isDataProduct,
	lastPixelOutput,
	type RunnableQuery,
	sourcesSignature,
} from "@/lib/queryPixel";
import type { JoinSpec, QuerySourceLeg } from "@/types/dashboard";

export interface QueryRows {
	headers: string[] | null;
	values: any[][] | null;
	/** Raw output, for the rare case the result is already an array of objects. */
	raw: any;
}

/**
 * Optional cross-source legs for a data-product query. Leg SQL must be ALREADY
 * param-interpolated by the caller (multiselect expansion etc. lives there).
 */
export interface QueryRunSource {
	sources?: QuerySourceLeg[];
	joins?: JoinSpec[];
}

export type QueryRunFn = (
	databaseId: string,
	query: string,
	batchSize: number,
	version?: number | string,
	source?: QueryRunSource,
) => Promise<QueryRows>;

const QueryRunnerContext = createContext<QueryRunFn | null>(null);

export function QueryRunnerProvider({ children }: { children: ReactNode }) {
	const { actions } = useInsight();
	const cache = useRef<Map<string, Promise<QueryRows>>>(new Map());

	const run = useCallback<QueryRunFn>(
		async (
			databaseId,
			query,
			batchSize,
			version: number | string = 0,
			source,
		) => {
			// A data-product source (≥2 legs) is executed as a frame-merge pixel; a
			// normal query is `Database | Query | Collect` exactly as written.
			const rq: RunnableQuery = {
				databaseId,
				query,
				sources: source?.sources,
				joins: source?.joins,
			};
			const dp = isDataProduct(rq);
			const bodyKey = dp
				? (rq.sources ?? [])
						.map((s) => `${s.databaseId}:${s.query}`)
						.join("|") +
					"::" +
					JSON.stringify(rq.joins ?? [])
				: query;
			const key = `${sourcesSignature(rq)}::${batchSize}::${version}::${bodyKey}`;
			const hit = cache.current.get(key);
			if (hit) return hit;
			// batchSize is the Collect size: a finite page size for table pagination, or
			// -1 for "all rows". Leg SQL is already param-interpolated by the caller.
			const promise = (async (): Promise<QueryRows> => {
				const pixel = buildQueryPixel(rq, { collect: batchSize });
				const { pixelReturn } =
					await actions.run<
						[{ output: any; operationType?: string[] }]
					>(pixel);
				const { output: result, error } = lastPixelOutput(pixelReturn);
				if (error) throw new Error(error);
				const values =
					result?.data?.values ??
					result?.values ??
					(Array.isArray(result?.data) ? result.data : null);
				const headers =
					result?.data?.headers ?? result?.headers ?? null;
				return { headers, values, raw: result };
			})();
			cache.current.set(key, promise);
			try {
				return await promise;
			} catch (e) {
				cache.current.delete(key); // don't cache failures
				throw e;
			}
		},
		[actions],
	);

	return (
		<QueryRunnerContext.Provider value={run}>
			{children}
		</QueryRunnerContext.Provider>
	);
}

export const useQueryRunner = (): QueryRunFn | null =>
	useContext(QueryRunnerContext);
