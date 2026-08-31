import type {
	AppConfig,
	AutomationNode,
	AutomationNodeType,
	DatabaseEngineConfig,
	FunctionEngineConfig,
	ModelEngineConfig,
	StorageEngineConfig,
	VectorEngineConfig,
	WaitConfig,
} from "./automation.types";

export function formatDurationMs(
	ms?: number | null,
	fractionDigits = 1,
): string {
	if (ms == null) return "—";
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(fractionDigits)}s`;
	return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/** Removes markup from server-generated HTML error documents without changing plain-text errors. */
export function normalizeAutomationErrorMessage(value: string): string {
	const isHtmlDocument = /<(?:!doctype\s+html|html)(?:\s|>)/i.test(value);
	if (!isHtmlDocument) return value;
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

// ─── per-node-type descriptor map ────────────────────────────────────────────

type NodeDescriptor = {
	buildPixel: (node: AutomationNode) => string;
	isReady: (node: AutomationNode) => boolean;
};

const NODE_DESCRIPTORS: Record<AutomationNodeType, NodeDescriptor> = {
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
			// Use a high default so SQL-level LIMIT controls the result set;
			// only fall back to config.limit if explicitly set by older saved automations
			return `SqlQuery(database=["${eid}"], query=["<encode>${sql}</encode>"], limit=[${num(c.limit, 5000)}]);`;
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

	app: {
		buildPixel(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const str = (v: unknown, fallback = "") =>
				v != null && v !== "" ? String(v) : fallback;
			const pixel = str(c.pixel as string | undefined);
			const appId = str(c.appId as string | undefined);
			return appId ? `LoadApp(project=["${appId}"]); ${pixel}` : pixel;
		},
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.pixel);
		},
	},

	trigger: {
		buildPixel: () => "",
		isReady: () => true,
	},

	wait: {
		buildPixel: () => "",
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			const has = (v: unknown) => v != null && v !== "";
			return has(c.seconds);
		},
	},
	branch: {
		buildPixel: () => "",
		isReady(node) {
			const c = node.config as unknown as Record<string, unknown>;
			return typeof c.condition === "string" && c.condition.trim() !== "";
		},
	},
};

/** Assemble the correct SEMOSS pixel for a node from its config fields. */
export function buildPixelPreview(node: AutomationNode): string {
	return NODE_DESCRIPTORS[node.type]?.buildPixel(node) ?? `// ${node.type}`;
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

// Normalizes common SEMOSS data-set output into a table-friendly shape.
export function extractDataset(
	parsed: unknown,
): { headers: string[]; rows: unknown[][] } | null {
	if (
		Array.isArray(parsed) &&
		parsed.length > 0 &&
		typeof parsed[0] === "object" &&
		!Array.isArray(parsed[0])
	) {
		const keys = Object.keys(parsed[0] as Record<string, unknown>);
		return {
			headers: keys,
			rows: (parsed as Record<string, unknown>[]).map((row) =>
				keys.map((key) => row[key]),
			),
		};
	}
	const inner = (parsed as Record<string, unknown>)?.data ?? parsed;
	if (inner && typeof inner === "object" && !Array.isArray(inner)) {
		const headers = (inner as Record<string, unknown>).headers;
		const values = (inner as Record<string, unknown>).values;
		if (Array.isArray(headers) && Array.isArray(values)) {
			return {
				headers: headers as string[],
				rows: values as unknown[][],
			};
		}
	}
	return null;
}

// ─── pre-run validation ───────────────────────────────────────────────────────

/** Returns an array of human-readable error strings for a node's required fields. Empty = valid. */
export function validateNode(node: AutomationNode): string[] {
	const errors: string[] = [];
	const { type, config } = node;

	if (type === "database-engine") {
		const c = config as DatabaseEngineConfig;
		if (!c.engineId) errors.push("A database engine is required");
		if (!c.expression?.trim()) errors.push("A database query is required");
	} else if (type === "model-engine") {
		const c = config as ModelEngineConfig;
		if (!c.engineId) errors.push("A model engine is required");
		if (c.operation === "llm" || c.operation === "vision") {
			if (!c.prompt?.trim() && !c.command?.trim())
				errors.push("A prompt is required");
		} else if (c.operation === "embeddings") {
			if (!c.values?.trim()) errors.push("Text to embed is required");
		}
	} else if (type === "vector-engine") {
		const c = config as VectorEngineConfig;
		if (!c.engineId) errors.push("A vector engine is required");
		if (c.operation === "search" && !c.command?.trim())
			errors.push("A search query is required");
	} else if (type === "storage-engine") {
		const c = config as StorageEngineConfig;
		if (!c.engineId) errors.push("A storage engine is required");
	} else if (type === "function-engine") {
		const c = config as FunctionEngineConfig;
		if (!c.engineId) errors.push("A function engine is required");
	} else if (type === "app") {
		const c = config as AppConfig;
		if (!c.pixel?.trim()) errors.push("A function call is required");
	} else if (type === "wait") {
		const c = config as WaitConfig;
		if (!c.seconds?.trim()) errors.push("A wait duration is required");
	}

	return errors;
}
