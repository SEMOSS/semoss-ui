import { useCallback, useId, useMemo, useState } from "react";
import {
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { MCPJsonField } from "./mcp-json-field";
import {
	DISPLAY_LOCATION_OPTIONS,
	EXECUTION_OPTIONS,
	META_EXECUTION_KEY,
	META_FUNCTION_NAME_KEY,
	META_UI_KEY,
} from "./mcp-json-utils";

type MetaRecord = Record<string, unknown>;

type MetadataView = "fields" | "json";

const readString = (source: MetaRecord | undefined, key: string): string => {
	const value = source?.[key];
	return typeof value === "string" ? value : "";
};

const readUi = (meta: MetaRecord | undefined): MetaRecord => {
	const ui = meta?.[META_UI_KEY];
	return ui && typeof ui === "object" && !Array.isArray(ui)
		? (ui as MetaRecord)
		: {};
};

/** Keys the structured controls render. Everything else is JSON-only. */
const OWNED_TOP_KEYS = new Set([
	META_EXECUTION_KEY,
	META_FUNCTION_NAME_KEY,
	META_UI_KEY,
]);

export interface MCPMetadataEditorProps {
	/** The tool's `_meta` object, or undefined when the tool has none */
	meta?: MetaRecord;

	/** Disables every control */
	disabled?: boolean;

	/** Receives the next `_meta`, or undefined once it would be empty */
	onChange: (next: MetaRecord | undefined) => void;
}

/**
 * Editor for a tool's `_meta`, as two views of one object rather than two
 * editors owning different halves of it.
 *
 * Fields renders the keys the playground actually reads. JSON renders the
 * whole `_meta` verbatim, so pasting a complete metadata blob works and
 * nothing the backend wrote is hidden.
 */
export const MCPMetadataEditor = ({
	meta,
	disabled = false,
	onChange,
}: MCPMetadataEditorProps) => {
	const executionId = useId();
	const functionId = useId();
	const displayId = useId();
	const loadingId = useId();
	const resourceId = useId();
	const autoOpenId = useId();

	const ui = useMemo(() => readUi(meta), [meta]);

	/** Keys present on the tool that the Fields view has no control for. */
	const unmappedKeys = useMemo(
		() => Object.keys(meta ?? {}).filter((key) => !OWNED_TOP_KEYS.has(key)),
		[meta],
	);

	const [view, setView] = useState<MetadataView>("fields");
	const [jsonDraft, setJsonDraft] = useState("{}");
	const [jsonError, setJsonError] = useState<string | undefined>();

	/** Normalizes away empty objects so saving does not add noise to the file. */
	const commit = useCallback(
		(next: MetaRecord) => {
			const cleaned: MetaRecord = {};
			for (const [key, value] of Object.entries(next)) {
				if (value === undefined) continue;
				if (key === META_UI_KEY) {
					const nested = value as MetaRecord;
					if (Object.keys(nested).length > 0) cleaned[key] = nested;
					continue;
				}
				cleaned[key] = value;
			}
			onChange(Object.keys(cleaned).length > 0 ? cleaned : undefined);
		},
		[onChange],
	);

	const setTopKey = useCallback(
		(key: string, value: string) => {
			const next: MetaRecord = { ...(meta ?? {}) };
			if (value.trim()) {
				next[key] = value;
			} else {
				delete next[key];
			}
			commit(next);
		},
		[meta, commit],
	);

	const setUiKey = useCallback(
		(key: string, value: string | boolean) => {
			const nextUi: MetaRecord = { ...ui };
			const isEmptyString = typeof value === "string" && !value.trim();
			if (isEmptyString || value === false) {
				delete nextUi[key];
			} else {
				nextUi[key] = value;
			}
			commit({ ...(meta ?? {}), [META_UI_KEY]: nextUi });
		},
		[meta, ui, commit],
	);

	const handleViewChange = useCallback(
		(next: string) => {
			if (next === view) return;
			if (next === "json") {
				// Seeded from the live object, so the JSON view always opens
				// showing exactly what is on the tool right now.
				setJsonDraft(JSON.stringify(meta ?? {}, null, 2));
				setJsonError(undefined);
				setView("json");
				return;
			}
			setView("fields");
		},
		[view, meta],
	);

	/**
	 * Writes the parsed object through as-is. Unlike the fields above, this is
	 * the whole of `_meta`, so a key the editor does not model is edited here
	 * rather than being quietly filtered out.
	 */
	const handleJsonChange = useCallback(
		(text: string) => {
			setJsonDraft(text);

			if (!text.trim()) {
				setJsonError(undefined);
				onChange(undefined);
				return;
			}

			try {
				const parsed = JSON.parse(text) as unknown;
				if (
					!parsed ||
					typeof parsed !== "object" ||
					Array.isArray(parsed)
				) {
					setJsonError("Metadata must be a JSON object");
					return;
				}

				setJsonError(undefined);
				const record = parsed as MetaRecord;
				onChange(Object.keys(record).length > 0 ? record : undefined);
			} catch (e) {
				setJsonError(e instanceof Error ? e.message : "Invalid JSON");
			}
		},
		[onChange],
	);

	const execution = readString(meta, META_EXECUTION_KEY) || "ask";
	const displayLocation = readString(ui, "displayLocation") || "sidebar";
	const autoOpen = Boolean(ui.autoOpen);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Label className="font-semibold text-foreground text-sm">
					Metadata
				</Label>
				<Tabs value={view} onValueChange={handleViewChange}>
					<TabsList className="h-7">
						<TabsTrigger
							value="fields"
							disabled={Boolean(jsonError)}
							className="px-2 text-xs"
						>
							Fields
						</TabsTrigger>
						<TabsTrigger value="json" className="px-2 text-xs">
							JSON
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{view === "json" ? (
				<MCPJsonField
					value={jsonDraft}
					error={jsonError}
					disabled={disabled}
					emptyValue="{}"
					placeholder='{"SMSS_MCP_EXECUTION": "ask", "SMSS_MCP_UI": {"displayLocation": "sidebar"}}'
					maxRows={16}
					onChange={handleJsonChange}
				/>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-1">
							<Label
								htmlFor={executionId}
								className="text-muted-foreground text-xs"
							>
								Execution
							</Label>
							<Select
								value={execution}
								onValueChange={(value) =>
									setTopKey(META_EXECUTION_KEY, value)
								}
								disabled={disabled}
							>
								<SelectTrigger
									id={executionId}
									size="sm"
									className="h-9"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{EXECUTION_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<span className="text-muted-foreground text-xs">
								Whether the agent runs this tool without asking.
							</span>
						</div>

						<div className="flex flex-col gap-1">
							<Label
								htmlFor={functionId}
								className="text-muted-foreground text-xs"
							>
								Backing function
							</Label>
							<Input
								id={functionId}
								value={readString(meta, META_FUNCTION_NAME_KEY)}
								onChange={(e) =>
									setTopKey(
										META_FUNCTION_NAME_KEY,
										e.target.value,
									)
								}
								disabled={disabled}
								placeholder="my_python_function"
								className="font-mono text-foreground text-sm"
							/>
							<span className="text-muted-foreground text-xs">
								The implementation this tool calls.
							</span>
						</div>

						<div className="flex flex-col gap-1">
							<Label
								htmlFor={displayId}
								className="text-muted-foreground text-xs"
							>
								Display location
							</Label>
							<Select
								value={displayLocation}
								onValueChange={(value) =>
									setUiKey("displayLocation", value)
								}
								disabled={disabled}
							>
								<SelectTrigger
									id={displayId}
									size="sm"
									className="h-9"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DISPLAY_LOCATION_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1">
							<Label
								htmlFor={loadingId}
								className="text-muted-foreground text-xs"
							>
								Loading message
							</Label>
							<Input
								id={loadingId}
								value={readString(ui, "loadingMessage")}
								onChange={(e) =>
									setUiKey("loadingMessage", e.target.value)
								}
								disabled={disabled}
								placeholder="Loading..."
								className="text-foreground text-sm"
							/>
						</div>

						<div className="flex flex-col gap-1">
							<Label
								htmlFor={resourceId}
								className="text-muted-foreground text-xs"
							>
								Resource URI
							</Label>
							<Input
								id={resourceId}
								value={readString(ui, "resourceURI")}
								onChange={(e) =>
									setUiKey("resourceURI", e.target.value)
								}
								disabled={disabled}
								placeholder="/my-portal/page"
								className="font-mono text-foreground text-sm"
							/>
						</div>

						<div className="flex items-center gap-2 self-end pb-2">
							<Switch
								id={autoOpenId}
								checked={autoOpen}
								onCheckedChange={(checked) =>
									setUiKey("autoOpen", checked)
								}
								disabled={disabled}
								size="sm"
							/>
							<Label
								htmlFor={autoOpenId}
								className="text-muted-foreground text-xs"
							>
								Open the tool UI automatically
							</Label>
						</div>
					</div>

					{unmappedKeys.length > 0 && (
						<p className="text-muted-foreground text-xs">
							Also on this tool and kept on save:{" "}
							<span className="font-mono">
								{unmappedKeys.join(", ")}
							</span>
							. Switch to JSON to edit.
						</p>
					)}
				</>
			)}
		</div>
	);
};
