/**
 * @semoss/monolith — typed, documented client for the SEMOSS (Monolith) REST API.
 *
 * Source only: `@semoss/sdk` compiles and bundles it, so there is one
 * connection per page. Apps import it through the SDK:
 *
 *     import { Env } from "@semoss/sdk";
 *     import { getProjects } from "@semoss/sdk/monolith/api/auth/admin/project";
 *
 *     Env.update({ MODULE: "/Monolith" }); // also configures ApiClient
 *     const projects = await getProjects({ filterWord: "sales", limit: 20 });
 *
 * This root entry holds connection setup and the error types. Endpoint
 * functions live in one subpath per backend resource, mirroring the URL.
 */

export { ApiClient } from "./lib/api-client";
export { ApiError, UnauthorizedError } from "./lib/api-error";
export type { RequestOptions } from "./types";
