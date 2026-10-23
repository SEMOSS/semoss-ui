/**
 * INTERNAL URL helpers for endpoint files: encode path parameters and build
 * full URLs.
 */

import { Env } from "../env";
import type { QueryParams } from "./request-types";

/**
 * Tagged template for paths with parameters. Each interpolated value is
 * `encodeURIComponent`-encoded, so ids containing spaces, `/`, `?` or `#`
 * cannot change the route.
 *
 * @name path
 * @param strings - The literal parts of the template.
 * @param values - The path parameters.
 * @returns The encoded path.
 * @example path`/project-${projectId}/runReactor/${reactorName}`
 */
export const path = (
	strings: TemplateStringsArray,
	...values: Array<string | number>
): string =>
	strings.reduce(
		(out, chunk, i) =>
			`${out}${encodeURIComponent(String(values[i - 1]))}${chunk}`,
	);

/**
 * Build a full URL: `Env.MODULE` + full path + query string. Used
 * for requests and by the `…Url()` builders (OAuth logins, HTML pages).
 *
 * @name url
 * @param endpointPath - The full path below the context root, e.g. `"/api/auth/whoami"`.
 * @param query - Query parameters; arrays become repeated keys, `null` / `undefined` are dropped.
 * @returns The URL.
 */
export const url = (endpointPath: string, query?: QueryParams): string => {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(query ?? {})) {
		for (const item of Array.isArray(value) ? value : [value]) {
			if (item !== undefined && item !== null) {
				search.append(key, String(item));
			}
		}
	}
	const qs = search.toString();
	const base = Env.MODULE.replace(/\/+$/, "");
	return `${base}${endpointPath}${qs ? `?${qs}` : ""}`;
};
