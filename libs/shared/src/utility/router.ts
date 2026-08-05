/**
 * Build an absolute in-app path from a basename.
 *
 * Every app is served from its own base path: a Tomcat context path plus the
 * package's dist folder when deployed, "/" on the dev server. The basename is
 * bound once per app in `packages/<app>/src/utility/router.ts` rather than read
 * here, so this stays free of build-time env access. Mirrors
 * {@link createMcpPlatformUrl}.
 *
 * Use it for the cases that cannot go through <Link> or navigate(): an anchor
 * that opens a new tab, or window.open. A relative href is not an option under
 * BrowserRouter, since it resolves against the depth of the current route rather
 * than the app root.
 *
 * @param basename - path the app is served from, with or without a trailing slash
 * @returns a function taking a route and returning its absolute path
 */
export const createRouteHref =
	(basename: string) =>
	(route: string): string =>
		`${basename.replace(/\/$/, "")}/${route.replace(/^\//, "")}`;

/**
 * Build an absolute path to a sibling package's build output, for example the
 * client app linking to the playground.
 *
 * Sibling apps are deployed next to this one at `.../packages/<name>/dist/`, so
 * the path is derived from this app's own basename by dropping its
 * `<package>/dist/` tail. Writing these as relative hrefs only works while the
 * linking app sits at its own root, which stops being true with BrowserRouter.
 *
 * @param basename - path the current app is served from
 * @returns a function taking a package name and an optional sub path
 */
export const createSiblingAppHref =
	(basename: string) =>
	(pkg: string, path = "/"): string => {
		const packagesRoot = basename.replace(/[^/]+\/dist\/?$/, "");
		const suffix = path.startsWith("/") ? path : `/${path}`;
		return `${packagesRoot}${pkg}/dist${suffix}`;
	};
