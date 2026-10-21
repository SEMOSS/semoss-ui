/**
 * @semoss/monolith — typed, documented client for the SEMOSS (Monolith) REST API.
 *
 * This root entry holds only connection setup and the error type. Endpoint
 * functions live in one subpath per backend resource, mirroring the URL:
 *
 *     import { ApiClient } from "@semoss/monolith";
 *     import { getProjects } from "@semoss/monolith/api/auth/admin/project";
 *
 *     ApiClient.configure({ basePath: "/Monolith" });
 *     const projects = await getProjects({ filterWord: "sales", limit: 20 });
 */

export { ApiClient } from "@/lib/api-client";
export { ApiError } from "@/lib/api-error";
export type { RequestOptions } from "@/types";
