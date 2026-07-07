import type { Edge, Node } from "@xyflow/react";
import type {
	OutputTransform,
	WorkflowNode,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import type { WorkflowNodeData } from "./nodes/node-card";

export function toRFNode(
	wn: WorkflowNode,
	onSettings: (id: string) => void,
): Node<WorkflowNodeData> {
	return {
		id: wn.id,
		type: "workflowNode",
		position: wn.position,
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
		type: "smoothstep",
		animated: false,
		style: { strokeWidth: 1.5 },
	};
}

/** Assemble the correct SEMOSS pixel for a node from its config fields. */
export function buildPixelPreview(node: WorkflowNode): string {
	const c = node.config as unknown as Record<string, unknown>;
	const str = (v: unknown, fallback = "") =>
		v != null && v !== "" ? String(v) : fallback;
	const num = (v: unknown, def: number) =>
		v != null && !Number.isNaN(Number(v)) ? Number(v) : def;

	switch (node.type) {
		case "database-engine": {
			const eid = str(c.engineId);
			const sql = str(c.expression);
			if (c.operation === "write") {
				return `SqlQuery(database=["${eid}"], query=["<encode>${sql}</encode>"], commit=[true]);`;
			}
			return `SqlQuery(database=["${eid}"], query=["<encode>${sql}</encode>"], limit=[${num(c.limit, 50)}]);`;
		}

		case "model-engine": {
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
		}

		case "vector-engine": {
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
			return `VectorDatabaseQuery(engine=["${eid}"], command=["${str(c.command)}"], limit=[${num(c.limit, 5)}]);`;
		}

		case "storage-engine": {
			const eid = str(c.engineId);
			const op = str(c.operation, "list");
			if (op === "list")
				return `ListStoragePath(storage=["${eid}"], storagePath=["${str(c.storagePath, "/")}"])`;
			if (op === "download")
				return `PullFromStorage(storage=["${eid}"], storagePath=["${str(c.storagePath)}"], filePath=["${str(c.filePath)}"])`;
			if (op === "upload") {
				const meta = c.metadata
					? `, metadata=[${str(c.metadata)}]`
					: "";
				return `PushToStorage(storage=["${eid}"], storagePath=["${str(c.storagePath)}"], filePath=["${str(c.filePath)}"]${meta})`;
			}
			if (op === "delete")
				return `DeleteFromStorage(storage=["${eid}"], storagePath=["${str(c.storagePath)}"])`;
			if (op === "read-base64")
				return `GetStorageFileAsBase64(storage=["${eid}"], storagePath=["${str(c.storagePath)}"])`;
			return `ListStoragePath(storage=["${eid}"], storagePath=["${str(c.storagePath, "/")}"])`;
		}

		case "function-engine": {
			const eid = str(c.engineId);
			const map = str(c.params, "{}");
			if (c.operation === "streaming") {
				return `ExecuteStreamingFunctionEngine(engine=["${eid}"], map=["${map.replace(/"/g, '\\"')}"]);`;
			}
			return `ExecuteFunctionEngine(engine=["${eid}"], map=["${map.replace(/"/g, '\\"')}"]);`;
		}

		case "app": {
			const appId = str(c.appId);
			let pixel = str(
				(c.pixel as string | undefined) ??
					(c.pixelExpression as string | undefined),
			);
			// Wrap parameter values containing ${varName} in <encode> tags
			// so the pixel parser doesn't break on substituted JSON
			pixel = pixel.replace(
				/\["([^"]*\$\{[^"]*)"]/g,
				'["<encode>$1</encode>"]',
			);
			return appId ? `LoadApp(project=["${appId}"]); ${pixel}` : pixel;
		}

		case "custom-pixel":
			return str(
				(c.pixel as string | undefined) ??
					(c.pixelExpression as string | undefined),
			);

		case "transform":
			return `// Transform (${str(c.operation, "convert-to-objects")}): ${str(c.inputVar)} → ${str(node.outputVar)}`;

		default:
			return `// ${node.type}`;
	}
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
	const ds = parsed as {
		data?: { headers?: string[]; values?: unknown[][] };
	};
	const headers: string[] = ds?.data?.headers ?? [];
	const values: unknown[][] = ds?.data?.values ?? [];

	switch (transform.mode) {
		case "rows-as-objects": {
			const rows = values.map((row) =>
				Object.fromEntries(headers.map((h, i) => [h, row[i]])),
			);
			return JSON.stringify(rows, null, 2);
		}
		case "first-row": {
			if (values.length === 0) return "{}";
			return JSON.stringify(
				Object.fromEntries(headers.map((h, i) => [h, values[0][i]])),
				null,
				2,
			);
		}
		case "column": {
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
