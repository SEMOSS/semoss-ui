/**
 * Throw when a pixel run reported errors. `Session.insight.run` (and
 * `useSessionInsight().run`) return a pixel's errors rather than throwing, unlike
 * an insight's `actions.run`; this keeps a caller that expects a throw working.
 *
 * @param result - What the run returned.
 * @returns The same result, when it has no errors.
 * @throws An error naming every pixel error.
 */
export const throwOnPixelErrors = <R extends { errors: string[] }>(
	result: R,
): R => {
	if (result.errors.length > 0) {
		throw new Error(result.errors.join(""));
	}
	return result;
};
