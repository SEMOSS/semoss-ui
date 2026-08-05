import { createRouteHref, createSiblingAppHref } from "@semoss/shared";

/**
 * Path the client is served from, used as the BrowserRouter basename.
 *
 * This is Vite's `base`, which comes from VITE_BASE_URL at build time: the
 * Tomcat context path differs per deployment (/semoss-ui locally, /SemossWeb in
 * the WAR) while the dev server serves from /. Keeping the basename and the
 * asset URLs on one value means they cannot drift apart.
 */
export const getRouterBasename = (): string => import.meta.env.BASE_URL;

/** Absolute path for a client route. See {@link createRouteHref}. */
export const toRouteHref = createRouteHref(getRouterBasename());

/** Absolute path into a sibling app. See {@link createSiblingAppHref}. */
export const toSiblingAppHref = createSiblingAppHref(getRouterBasename());
