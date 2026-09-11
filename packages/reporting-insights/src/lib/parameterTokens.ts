const PARAMETER_TOKEN_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

/** Unique `{{token}}` names in first-seen order. */
export function detectParameterTokens(query: string): string[] {
	const seen = new Set<string>();
	const tokens: string[] = [];
	for (const match of query.matchAll(PARAMETER_TOKEN_RE)) {
		if (!seen.has(match[1])) {
			seen.add(match[1]);
			tokens.push(match[1]);
		}
	}
	return tokens;
}

/** Replace known `{{token}}` references, leaving unresolved references intact. */
export function interpolateParameterTokens(
	query: string,
	values: Record<string, string>,
): string {
	return query.replace(PARAMETER_TOKEN_RE, (token, name: string) =>
		Object.hasOwn(values, name) ? values[name] : token,
	);
}

interface DynamicOptionParameter {
	name: string;
	optionsQuery?: string;
	dynamicOptions?: boolean;
}

/** True when the dynamic option-query graph reachable from `startName` contains a cycle. */
export function hasDynamicOptionsCycle(
	parameters: DynamicOptionParameter[],
	startName: string,
): boolean {
	const byName = new Map(
		parameters.map((parameter) => [parameter.name, parameter]),
	);
	const visiting = new Set<string>();
	const visited = new Set<string>();

	const visit = (name: string): boolean => {
		if (visiting.has(name)) return true;
		if (visited.has(name)) return false;

		const parameter = byName.get(name);
		if (!parameter?.dynamicOptions || !parameter.optionsQuery) return false;

		visiting.add(name);
		for (const dependency of detectParameterTokens(
			parameter.optionsQuery,
		)) {
			if (byName.has(dependency) && visit(dependency)) return true;
		}
		visiting.delete(name);
		visited.add(name);
		return false;
	};

	return visit(startName);
}
