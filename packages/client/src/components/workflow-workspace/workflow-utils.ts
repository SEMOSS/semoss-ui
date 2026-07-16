import type { Edge, Node } from "@xyflow/react";
import type {
	OutputTransform,
	WorkflowNode,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import type { WorkflowNodeData } from "./nodes/node-card";

// ─── shared constants ─────────────────────────────────────────────────────────

export const TRANSFORM_MODES: {
	value: OutputTransform["mode"];
	label: string;
}[] = [
	{ value: "raw", label: "Raw" },
	{ value: "rows-as-objects", label: "Rows → Objects" },
	{ value: "first-row", label: "First Row" },
	{ value: "column", label: "Column" },
	{ value: "jsonpath", label: "JSONPath" },
];

export const TRANSFORM_ENABLED: Set<WorkflowNodeType> = new Set([
	"database-engine",
	"model-engine",
	"vector-engine",
	"storage-engine",
	"function-engine",
	"custom-pixel",
]);

export function formatDurationMs(
	ms?: number | null,
	fractionDigits = 1,
): string {
	if (ms == null) return "—";
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(fractionDigits)}s`;
	return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function toRFNode(
	wn: WorkflowNode,
	onSettings: (id: string) => void,
): Node<WorkflowNodeData> {
	return {
		id: wn.id,
		type: "workflowNode",
		position: wn.position,
		deletable: wn.type !== "trigger",
		data: {
			nodeType:
				(wn as WorkflowNode & { nodeType?: WorkflowNodeType })
					.nodeType ?? wn.type,
			label: wn.label,
			outputVar: wn.outputVar,
			config: wn.config as unknown as Record<string, unknown>,
			onSettings,
		},
	};
}

export function toRFEdge(e: {
	id: string;
	source: string;
	target: string;
}): Edge {
	return {
		id: e.id,
		source: e.source,
		target: e.target,
		type: "workflowEdge",
		animated: false,
		style: { strokeWidth: 1.5 },
	};
}

// ─── per-node-type descriptor map ────────────────────────────────────────────

type NodeDescriptor = {
	buildPixel: (node: WorkflowNode) => string;
	isReady: (node: WorkflowNode) => boolean;
};

const NODE_DESCRIPTORS: Record<WorkflowNodeType, NodeDescriptor> = {
	"database-engine": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const num = (v: unknown, def: number) =>
				v != null && !Number.isNaN(Number(v)) ? Number(v) : def;
			const eid = str(c.engineId);
			const sql = str(c.expression);
			if (c.operation === "write") {
				return `SqlQuery(database=["${eid}"], query=["<encode>${sql}</encode>"], commit=[true]);`;
			}
			return `SqlQuery(database=["${eid}"], query=["<encode>${sql}</encode>"], limit=[${num(c.limit, 50)}]);`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.engineId) && has(c.expression);
		},
	},

	"model-engine": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const eid = str(c.engineId);
			const op = str(c.operation, "llm");
			if (op === "embeddings") {
				return `Embeddings(engine=["${eid}"], values=["<encode>${str(c.values)}</encode>"]);`;
			}
			if (op === "vision") {
				return `Vision(engine=["${eid}"], command=["<encode>${str(c.command)}</encode>"], image=["${str(c.image)}"]);`;
			}
			if (op === "ner") {
				return `NER(engine=["${eid}"], prompt=["<encode>${str(c.prompt)}</encode>"], entities=["<encode>${str(c.entities)}</encode>"]);`;
			}
			// default: llm
			const parts: string[] = [
				`engine=["${eid}"]`,
				`command=["<encode>${str(c.command)}</encode>"]`,
			];
			if (c.context)
				parts.push(`context=["<encode>${str(c.context)}</encode>"]`);
			if (c.paramValues)
				parts.push(`paramValues=[${str(c.paramValues)}]`);
			return `LLM(${parts.join(", ")});`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			if (!has(c.engineId)) return false;
			const op = c.operation ?? "llm";
			if (op === "embeddings") return has(c.values);
			if (op === "vision" || op === "llm") return has(c.command);
			if (op === "ner") return has(c.prompt);
			return true;
		},
	},

	"vector-engine": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const num = (v: unknown, def: number) =>
				v != null && !Number.isNaN(Number(v)) ? Number(v) : def;
			const eid = str(c.engineId);
			const op = str(c.operation, "search");
			if (op === "search") {
				return `VectorDatabaseQuery(engine=["${eid}"], command=["<encode>${str(c.command)}</encode>"], limit=[${num(c.limit, 5)}]);`;
			}
			if (op === "add-file") {
				const parts = [
					`engine=["${eid}"]`,
					`filePath=["${str(c.filePath)}"]`,
				];
				if (c.source) parts.push(`source=["${str(c.source)}"]`);
				if (c.space) parts.push(`space=["${str(c.space)}"]`);
				return `VectorAttachFileToSource(${parts.join(", ")});`;
			}
			if (op === "add-csv") {
				const parts = [
					`engine=["${eid}"]`,
					`filePaths=["${str(c.filePaths)}"]`,
				];
				if (c.paramValues)
					parts.push(`paramValues=[${str(c.paramValues)}]`);
				return `CreateEmbeddingsFromVectorCSVFile(${parts.join(", ")});`;
			}
			if (op === "list") {
				return `ListDocumentsInVectorDatabase(engine=["${eid}"]);`;
			}
			if (op === "delete") {
				return `RemoveDocumentFromVectorDatabase(engine=["${eid}"], fileNames=["${str(c.fileNames)}"]);`;
			}
			if (op === "download") {
				return `VectorFileDownload(engine=["${eid}"], fileNames=["${str(c.fileNames)}"]);`;
			}
			return `VectorDatabaseQuery(engine=["${eid}"], command=["<encode>${str(c.command)}</encode>"], limit=[${num(c.limit, 5)}]);`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			if (!has(c.engineId)) return false;
			const op = c.operation ?? "search";
			if (op === "search") return has(c.command);
			if (op === "add-file") return has(c.filePath);
			if (op === "add-csv") return has(c.filePaths);
			if (op === "delete" || op === "download") return has(c.fileNames);
			return true;
		},
	},

	"storage-engine": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const eid = str(c.engineId);
			const op = str(c.operation, "list");
			if (op === "list")
				return (
					`ListStoragePath(storage=["${eid}"], storagePath=["${str(c.storagePath, "/")}"])` +
					";"
				);
			if (op === "download")
				return (
					`PullFromStorage(storage=["${eid}"], storagePath=["${str(c.storagePath)}"], filePath=["${str(c.filePath)}"])` +
					";"
				);
			if (op === "upload") {
				const meta = c.metadata
					? `, metadata=[${str(c.metadata)}]`
					: "";
				return `PushToStorage(storage=["${eid}"], storagePath=["${str(c.storagePath)}"], filePath=["${str(c.filePath)}"]${meta});`;
			}
			if (op === "delete")
				return (
					`DeleteFromStorage(storage=["${eid}"], storagePath=["${str(c.storagePath)}"])` +
					";"
				);
			if (op === "read-base64")
				return (
					`GetStorageFileAsBase64(storage=["${eid}"], storagePath=["${str(c.storagePath)}"])` +
					";"
				);
			return (
				`ListStoragePath(storage=["${eid}"], storagePath=["${str(c.storagePath, "/")}"])` +
				";"
			);
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			if (!has(c.engineId)) return false;
			const op = c.operation ?? "list";
			if (op === "download" || op === "upload")
				return has(c.storagePath) && has(c.filePath);
			if (op === "delete" || op === "read-base64")
				return has(c.storagePath);
			return true;
		},
	},

	"function-engine": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const eid = str(c.engineId);
			const map = str(c.params, "{}");
			if (c.operation === "streaming") {
				return `ExecuteStreamingFunctionEngine(engine=["${eid}"], map=["${map.replace(/"/g, '\\"')}"]);`;
			}
			return `ExecuteFunctionEngine(engine=["${eid}"], map=["${map.replace(/"/g, '\\"')}"]);`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.engineId);
		},
	},

	"custom-pixel": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const pixel = str(
				(c.pixel as string | undefined) ??
					(c.pixelExpression as string | undefined),
			);
			const appId = str(c.appId as string | undefined);
			return appId ? `LoadApp(project=["${appId}"]); ${pixel}` : pixel;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			const pixel =
				(c.pixel as string | undefined) ??
				(c.pixelExpression as string | undefined);
			return has(pixel);
		},
	},

	"sub-workflow": {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const projectId = str(c.targetProjectId as string | undefined);
			const mapping = str(c.inputMapping as string | undefined, "{}");
			return `TriggerWorkflow(project=["${projectId}"], inputMapping=["<encode>${mapping}</encode>"]);`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.targetProjectId);
		},
	},

	"for-each": {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.sourceVar) && has(c.iteratorVar);
		},
	},

	conditional: {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const cc =
				c as unknown as import("@/pages/workflow/workflow.types").ConditionalConfig;
			const trueBranch = cc.trueGraph?.nodes?.length ?? 0;
			const falseBranch = cc.falseGraph?.nodes?.length ?? 0;
			return `// If ${str(c.condition)} → TRUE (${trueBranch} steps) | FALSE (${falseBranch} steps)`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.condition);
		},
	},

	trigger: {
		buildPixel: () => "",
		isReady: () => true, // trigger never blocks a run
	},

	email: {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const to = str(c.to as string);
			const subject = str(c.subject as string);
			const body = str(c.body as string);
			const cc = str(c.cc as string);
			const bcc = str(c.bcc as string);
			const isHtml = Boolean(c.isHtml);
			const buildAddr = (addr: string) =>
				addr
					.split(/\s*,\s*/)
					.filter(Boolean)
					.map((a) => `"${a.trim()}"`)
					.join(", ");
			// Match the backend's URL-encoding approach for the message body
			const encodedBody = encodeURIComponent(body).replace(/%20/g, "+");
			const parts: string[] = [`to=[${buildAddr(to)}]`];
			if (cc) parts.push(`cc=[${buildAddr(cc)}]`);
			if (bcc) parts.push(`bcc=[${buildAddr(bcc)}]`);
			parts.push(`subject=["${subject.replace(/"/g, '\\"')}"]`);
			parts.push(`message=["<encode>${encodedBody}</encode>"]`);
			if (isHtml) parts.push(`html=["true"]`);
			return `SendEmail(${parts.join(", ")});`;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.to) && has(c.subject) && has(c.body);
		},
	},

	"while-loop": {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.condition);
		},
	},

	"try-catch": {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady: () => true,
	},

	wait: {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.seconds);
		},
	},

	"set-variable": {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady: () => true,
	},

	"http-request": {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.url);
		},
	},

	notification: {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.recipientId) && has(c.title) && has(c.message);
		},
	},

	switch: {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.switchVar);
		},
	},

	retry: {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady: () => true,
	},

	parallel: {
		buildPixel: () => "", // backend dispatches by type, not builtPixel
		isReady: () => true,
	},
};

/** Assemble the correct SEMOSS pixel for a node from its config fields. */
export function buildPixelPreview(node: WorkflowNode): string {
	return NODE_DESCRIPTORS[node.type]?.buildPixel(node) ?? `// ${node.type}`;
}

/** Returns true when a node has all required fields to produce a runnable pixel. */
export function isNodeReady(node: WorkflowNode): boolean {
	return NODE_DESCRIPTORS[node.type]?.isReady(node) ?? true;
}

/** Replace ${varName} tokens in a pixel with stored outputs or mock values. */
export function substituteVars(
	pixel: string,
	outputs: Record<string, string>,
): string {
	return pixel.replace(/\$\{([^}]+)\}/g, (match, v) => outputs[v] ?? match);
}

/** Extract all ${varName} references from a pixel string. */
export function extractVarRefs(pixel: string): string[] {
	return [...pixel.matchAll(/\$\{([^}]+)\}/g)].map((m) => m[1]);
}

/**
 * Apply an output transform to a raw pixel result string.
 * Handles FORMATTED_DATA_SET envelope (SqlQuery / vector search).
 * Falls back to raw if the input isn't parseable JSON or the shape doesn't match.
 */
export function applyOutputTransform(
	rawStr: string,
	transform?: OutputTransform,
): string {
	if (!transform || transform.mode === "raw") return rawStr;

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawStr);
	} catch {
		return rawStr;
	}

	// Unwrap FORMATTED_DATA_SET: {data: {headers: string[], values: unknown[][]}}
	// If the shape is absent (e.g. model-engine returning {response: "..."}),
	// fall back to rawStr rather than silently producing empty arrays/objects.
	const ds = parsed as {
		data?: { headers?: string[]; values?: unknown[][] };
	};
	const headers: string[] | undefined = ds?.data?.headers;
	const values: unknown[][] | undefined = ds?.data?.values;

	switch (transform.mode) {
		case "rows-as-objects": {
			if (!headers || !values) return rawStr;
			const rows = values.map((row) =>
				Object.fromEntries(headers.map((h, i) => [h, row[i]])),
			);
			return JSON.stringify(rows, null, 2);
		}
		case "first-row": {
			if (!headers || !values) return rawStr;
			if (values.length === 0) return "{}";
			return JSON.stringify(
				Object.fromEntries(headers.map((h, i) => [h, values[0][i]])),
				null,
				2,
			);
		}
		case "column": {
			if (!headers || !values) return rawStr;
			const col = transform.column ?? headers[0] ?? "";
			const idx = headers.indexOf(col);
			if (idx === -1) return "[]";
			return JSON.stringify(
				values.map((row) => row[idx]),
				null,
				2,
			);
		}
		case "jsonpath": {
			const resolved = resolveSimplePath(parsed, transform.path ?? "");
			return resolved !== null ? resolved : rawStr;
		}
		default:
			return rawStr;
	}
}

/** Minimal dot-notation path resolver: "$.data.headers" or "data.headers" */
function resolveSimplePath(obj: unknown, path: string): string | null {
	if (!path) return null;
	const parts = path
		.replace(/^\$\.?/, "")
		.split(".")
		.filter(Boolean);
	let cur: unknown = obj;
	for (const part of parts) {
		if (cur == null || typeof cur !== "object") return null;
		cur = (cur as Record<string, unknown>)[part];
	}
	if (cur == null) return null;
	return typeof cur === "string" ? cur : JSON.stringify(cur, null, 2);
}
