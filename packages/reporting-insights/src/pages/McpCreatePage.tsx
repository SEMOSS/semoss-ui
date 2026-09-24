/**
 * McpCreatePage — the auto-build target for the SEMOSS playground `create_dashboard`
 * MCP tool. The host project's portal forwards the tool's parameters here as URL
 * query params (see services/portalGenerator.mcpHostRedirectHtml), e.g.
 *   #/mcp/create?description=Sales%20by%20region&database=alphabet2
 *
 * On mount it runs the SAME pipeline the AI Builder modal uses — resolve a database
 * + model, `generateDashboard(...)`, then `createDashboard(..., { published })` — so a
 * real dashboard PROJECT is created and deployed in SEMOSS with no manual steps. When
 * done it navigates to the new dashboard, which renders inline in the tool panel.
 *
 * This is what makes "create a dashboard" from the playground actually produce a
 * deployed app (the tool itself only opens this page; the app does the work using the
 * proven frontend deploy path).
 */

import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useInsight } from "@semoss/sdk-react";
import { escapeSqlForPixel } from "@/lib/pixel";
import { fetchModels, generateDashboard } from "@/services/aiBuilder";
import { ProjectStore } from "@/services/projectStore";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

type RawRecord = Record<string, unknown>;
const asRecord = (v: unknown): RawRecord =>
	v && typeof v === "object" ? (v as RawRecord) : {};
const str = (v: unknown): string => (v == null ? "" : String(v));

export function McpCreatePage() {
	const { actions } = useInsight();
	const { createDashboard, createDashboardInProject } = useWorkspace();
	const navigate = useNavigate();
	const [params] = useSearchParams();

	const description = (params.get("description") || "").trim();
	const databaseParam = (params.get("database") || "").trim();
	const modelParam = (params.get("model") || "").trim();
	// "public" (default) | "private" — published visibility of the created dashboard.
	const visibility = (params.get("visibility") || "public").toLowerCase();
	// When set, deploy into this already-existing project instead of creating a new one.
	const targetProject = (params.get("target_project") || "").trim();

	const [status, setStatus] = useState("Starting…");
	const [error, setError] = useState<string | null>(null);
	const startedRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once, actions is stable
	const runPixel = useCallback(
		(pixel: string) =>
			actions
				.run<[{ output: unknown }]>(pixel)
				.then((r) => r.pixelReturn[0].output),
		[],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once, actions is stable
	const runSql = useCallback(
		async (
			dbId: string,
			sql: string,
		): Promise<{ ok: boolean; error?: string; headers?: string[] }> => {
			try {
				const pixel = `Database(database=["${dbId}"]) | Query("${escapeSqlForPixel(sql)}") | Collect(1);`;
				const { pixelReturn } =
					await actions.run<
						[{ output: unknown; operationType?: string[] }]
					>(pixel);
				const pr = pixelReturn[0];
				if (
					Array.isArray(pr.operationType) &&
					pr.operationType.includes("ERROR")
				) {
					return {
						ok: false,
						error: String(pr.output ?? "Query failed."),
					};
				}
				const result = asRecord(pr.output);
				const resultData = asRecord(result.data);
				const headers: string[] = Array.isArray(resultData.headers)
					? resultData.headers
					: Array.isArray(result.headers)
						? result.headers
						: [];
				return { ok: true, headers };
			} catch (e) {
				return { ok: false, error: String((e as Error)?.message ?? e) };
			}
		},
		[],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount by design (startedRef guards re-entry)
	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		(async () => {
			try {
				if (!description)
					throw new Error(
						"No dashboard description was provided by the tool.",
					);

				// 0. Idempotency: the playground/assistant re-mounts this page (with the
				//    same URL params) every time the chat is reloaded, which would otherwise
				//    rebuild the dashboard on every reload. Check the SERVER for a dashboard
				//    already deployed for this exact request signature and reopen it instead
				//    of rebuilding. This is durable — unlike client storage, which is
				//    blocked/partitioned in a cross-origin tool iframe.
				const signature = `${databaseParam.toLowerCase()}|${description.toLowerCase()}|${visibility}`;
				const sigTag = ProjectStore.sigTag(signature);

				if (targetProject) {
					// Same request already deployed into THIS app? Check the target
					// project's own tags rather than searching every project.
					setStatus("Checking for an existing dashboard…");
					try {
						const info = asRecord(
							await runPixel(
								`ProjectInfo(project=["${targetProject}"]);`,
							),
						);
						const rawTag = info.tag ?? info.tags;
						const tags = Array.isArray(rawTag)
							? rawTag.map((t) => str(t).trim())
							: typeof rawTag === "string"
								? rawTag
										.split(/[,;]/)
										.map((t: string) => t.trim())
								: [];
						if (tags.includes(sigTag)) {
							setStatus("Opening your dashboard…");
							navigate(`/dashboard/${targetProject}`, {
								replace: true,
							});
							return;
						}
					} catch {
						/* fall through to build if the lookup fails */
					}
				} else {
					setStatus("Checking for an existing dashboard…");

					// Look for a dashboard already deployed for this exact request (tagged with
					// its signature) and reopen it instead of rebuilding on every reload.
					let prior: string | null = null;
					try {
						const out = await runPixel(
							'MyProjects(metaKeys=["tag"], metaFilters=[{}], userT=[true], limit=[500], offset=[0]);',
						);
						const outRecord = asRecord(out);
						const rows: RawRecord[] = Array.isArray(out)
							? (out as RawRecord[])
							: Array.isArray(outRecord.data)
								? (outRecord.data as RawRecord[])
								: [];
						for (const r of rows) {
							const id = str(
								r.project_id ??
									r.app_id ??
									r.id ??
									r.PROJECT_ID,
							);
							const rawTag = r.tag ?? r.tags ?? r.TAG;
							const tags = Array.isArray(rawTag)
								? rawTag.map((t) => str(t).trim())
								: typeof rawTag === "string"
									? rawTag
											.split(/[,;]/)
											.map((t: string) => t.trim())
									: [];
							if (id && tags.includes(sigTag)) {
								prior = id;
								break;
							}
						}
					} catch {
						/* fall through to build if the lookup fails */
					}

					if (prior) {
						setStatus("Opening your dashboard…");
						navigate(`/dashboard/${prior}`, { replace: true });
						return;
					}
				}

				// 1. Resolve the database — match the tool's value against MyEngines by
				//    id first, then by name (case-insensitive).
				setStatus("Finding the database…");
				const engines = await runPixel(
					`MyEngines(engineTypes=['DATABASE'], sort=[{"ENGINENAME":"ASC"}], userT=[true], limit=[1000], offset=[0]);`,
				);
				const dbs: { id: string; name: string }[] = (
					Array.isArray(engines) ? (engines as RawRecord[]) : []
				)
					.map((d) => ({
						id: str(d.app_id ?? d.database_id ?? d.engine_id),
						name: str(d.engine_name ?? d.app_name ?? d.app_id),
					}))
					.filter((d) => d.id);
				if (!dbs.length)
					throw new Error(
						"You have no accessible databases to build against.",
					);

				const wanted = databaseParam.toLowerCase();
				const db =
					(wanted &&
						dbs.find((d) => d.id.toLowerCase() === wanted)) ||
					(wanted &&
						dbs.find((d) => d.name.toLowerCase() === wanted)) ||
					(wanted &&
						dbs.find((d) =>
							d.name.toLowerCase().includes(wanted),
						)) ||
					(!wanted && dbs[0]);
				if (!db) {
					throw new Error(
						`Database "${databaseParam}" not found. Available: ${dbs.map((d) => d.name).join(", ")}.`,
					);
				}

				// 2. Resolve a model engine (tool-provided or the first available).
				setStatus("Selecting a model…");
				const models = await fetchModels(runPixel);
				if (!models.length)
					throw new Error(
						"No model engine is available to generate the dashboard.",
					);
				const wantedModel = modelParam.toLowerCase();
				const model =
					(wantedModel &&
						models.find(
							(m) =>
								m.id.toLowerCase() === wantedModel ||
								(m.name || "").toLowerCase() === wantedModel,
						)) ||
					models[0];

				// 3. Generate the dashboard (schema-grounded, SQL validated/repaired).
				const dashboard = await generateDashboard({
					runPixel,
					runSql,
					modelId: model.id,
					description,
					databaseId: db.id,
					databaseName: db.name,
					onProgress: setStatus,
				});

				// 4. Deploy it as a real, published SEMOSS project — either into the
				//    caller's own app (overwriting it) or as a new, separate project.
				setStatus(
					targetProject
						? "Turning this app into the dashboard…"
						: "Deploying the dashboard…",
				);
				const newId = targetProject
					? await createDashboardInProject(targetProject, dashboard, {
							published: visibility !== "private",
							// Tag with the request signature so a reload of this same
							// request shows the existing dashboard instead of rebuilding
							// (see step 0). Hidden from folders.
							tags: [sigTag],
						})
					: await createDashboard(dashboard, {
							published: visibility !== "private",
							// Tag with the request signature so a reload finds + reopens this
							// dashboard instead of rebuilding (see step 0). Hidden from folders.
							tags: [sigTag],
						});

				setStatus("Opening your dashboard…");
				navigate(`/dashboard/${newId}`, { replace: true });
			} catch (e) {
				setError(
					(e as Error)?.message ?? "Failed to create the dashboard.",
				);
			}
		})();
	}, []);

	if (error) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
				<AlertTriangle className="h-8 w-8 text-amber-500" />
				<div>
					<p className="font-semibold text-sm text-stone-800">
						Couldn’t auto-create the dashboard
					</p>
					<p className="mt-1 max-w-md text-[13px] text-stone-600">
						{error}
					</p>
				</div>
				<Link
					to="/dashboards/new"
					className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-[13px] text-white hover:bg-indigo-700"
				>
					Open the builder instead
				</Link>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
			<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
			<div>
				<p className="font-semibold text-sm text-stone-800">
					Building your dashboard…
				</p>
				<p className="mt-1 max-w-md text-[13px] text-stone-600">
					{status}
				</p>
				{description && (
					<p className="mt-3 max-w-md text-[12px] text-stone-400 italic">
						“{description}”
					</p>
				)}
			</div>
		</div>
	);
}
