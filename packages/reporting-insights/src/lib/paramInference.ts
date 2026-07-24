/**
 * Parameter inference — register a Parameter for every `{{placeholder}}` used in a
 * dashboard's SQL that isn't already declared.
 *
 * Why: SQL can contain `{{letter}}`-style placeholders, but a placeholder only becomes
 * an interactive filter (and an MCP tool input) if a matching `Parameter` is registered
 * on the query. The AI generator (and hand-written SQL) can leave placeholders
 * unregistered — the portal then can't substitute them and the dashboard's `show_<name>`
 * MCP tool exposes no inputs. Normalizing here makes placeholders first-class so:
 *   • the editor shows a filter control,
 *   • the portal (`ViewMode`) substitutes + auto-runs when values are supplied, and
 *   • `dashboardParameters()` puts them in the MCP tool's `inputSchema`.
 *
 * Applied both when a dashboard is generated (for review) and at deploy time (so every
 * deployed dashboard — however it was authored — is consistent). Idempotent.
 */
import type {
	Dashboard,
	DashboardQuery,
	Parameter,
	Sheet,
} from "@/types/dashboard";

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

function humanize(name: string): string {
	return name.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Distinct `{{placeholder}}` names in a SQL string, in first-seen order. */
export function placeholderNames(sql: string): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	let m: RegExpExecArray | null;
	PLACEHOLDER.lastIndex = 0;
	while ((m = PLACEHOLDER.exec(sql || "")) !== null) {
		if (!seen.has(m[1])) {
			seen.add(m[1]);
			out.push(m[1]);
		}
	}
	return out;
}

function makeParam(name: string): Parameter {
	return {
		id: crypto.randomUUID(),
		name,
		label: humanize(name),
		defaultValue: "",
		inputType: "text",
		required: false,
	};
}

/** `existing` plus a text Parameter for any placeholder in `sql` not already declared. */
function withInferred(sql: string, existing: Parameter[]): Parameter[] {
	const have = new Set(existing.map((p) => p.name));
	const added = placeholderNames(sql)
		.filter((n) => !have.has(n))
		.map(makeParam);
	return added.length ? [...existing, ...added] : existing;
}

/**
 * Return a copy of `dashboard` where every `{{placeholder}}` in its SQL has a
 * registered Parameter. Registers on the shared queries (what the portal resolves for
 * bound visualizations) and on unbound visualizations that carry their own SQL.
 */
export function inferSqlParameters(dashboard: Dashboard): Dashboard {
	const queries: DashboardQuery[] = (dashboard.queries ?? []).map((q) => ({
		...q,
		parameters: withInferred(q.query ?? "", q.parameters ?? []),
	}));

	const sheets: Sheet[] = (dashboard.sheets ?? []).map((s) => ({
		...s,
		visualizations: (s.visualizations ?? []).map((v) =>
			// Bound vizes rely on their query's params; only infer for unbound vizes
			// that carry their own inline SQL.
			!v.queryId && v.query
				? {
						...v,
						parameters: withInferred(v.query, v.parameters ?? []),
					}
				: v,
		),
	}));

	return { ...dashboard, queries, sheets };
}
