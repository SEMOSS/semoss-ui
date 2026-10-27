import { Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { type ApiTestResponse, testAutomationRequest } from "../../../api";
import {
	buildSampleScope,
	referencedPaths,
} from "../../../domain/api-request-samples";
import type {
	ApiRequestBodyType,
	ApiRequestConfig,
} from "../../../domain/automation.types";
import { apiRequestWorkflowConfig } from "../../../domain/automation-workflow-adapter";
import { parseCurlCommand } from "../../../domain/curl-import";
import { EnginePickerField } from "./engine-picker-field";
import { PillInput } from "./pill-input";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODY_TYPES: { value: ApiRequestBodyType; label: string }[] = [
	{ value: "none", label: "None" },
	{ value: "json", label: "JSON" },
	{ value: "form", label: "Form" },
	{ value: "raw", label: "Raw" },
];

type Row = { key: string; value: string };

function toRows(text: string): Row[] {
	try {
		const parsed: unknown = JSON.parse(text || "{}");
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return Object.entries(parsed).map(([key, value]) => ({
				key,
				value:
					typeof value === "string" ? value : JSON.stringify(value),
			}));
		}
	} catch {
		// Invalid JSON is shown as no rows; the node validator reports it.
	}
	return [];
}

function fromRows(rows: Row[]): string {
	const object: Record<string, string> = {};
	for (const row of rows) {
		if (row.key.trim()) object[row.key.trim()] = row.value;
	}
	return Object.keys(object).length > 0
		? JSON.stringify(object, null, 2)
		: "";
}

interface KeyValueEditorProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	readOnly: boolean;
	keyPlaceholder: string;
	valuePlaceholder?: string;
}

/** Edits a JSON object of string pairs as rows, the way Postman and Bruno do. */
function KeyValueEditor({
	label,
	value,
	onChange,
	readOnly,
	keyPlaceholder,
	valuePlaceholder = "Value, or ${variable}",
}: KeyValueEditorProps) {
	const [rows, setRows] = useState<Row[]>(() => toRows(value));

	// biome-ignore lint/correctness/useExhaustiveDependencies: rows are compared against the incoming value, not re-run on every edit
	useEffect(() => {
		// Pick up outside changes (such as a cURL import) without losing blank rows.
		if (fromRows(rows) !== fromRows(toRows(value))) setRows(toRows(value));
	}, [value]);

	const commit = (next: Row[]) => {
		setRows(next);
		onChange(fromRows(next));
	};

	return (
		<div className="flex flex-col gap-2">
			{rows.length === 0 && (
				<Small className="text-muted-foreground">
					No {label.toLowerCase()} yet.
				</Small>
			)}
			{rows.map((row, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id while being edited
					key={index}
					className="flex items-center gap-2"
				>
					<Input
						aria-label={`${label} name ${index + 1}`}
						className="w-2/5 font-mono text-xs"
						value={row.key}
						placeholder={keyPlaceholder}
						disabled={readOnly}
						onChange={(event) =>
							commit(
								rows.map((r, i) =>
									i === index
										? { ...r, key: event.target.value }
										: r,
								),
							)
						}
					/>
					<Input
						aria-label={`${label} value ${index + 1}`}
						className="flex-1 font-mono text-xs"
						value={row.value}
						placeholder={valuePlaceholder}
						disabled={readOnly}
						onChange={(event) =>
							commit(
								rows.map((r, i) =>
									i === index
										? { ...r, value: event.target.value }
										: r,
								),
							)
						}
					/>
					{!readOnly && (
						<Button
							type="button"
							size="icon"
							variant="ghost"
							aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
							onClick={() =>
								commit(rows.filter((_, i) => i !== index))
							}
						>
							<Trash2 className="size-4" />
						</Button>
					)}
				</div>
			))}
			{!readOnly && (
				<div>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() =>
							setRows([...rows, { key: "", value: "" }])
						}
					>
						<Plus className="size-4" /> Add
					</Button>
				</div>
			)}
		</div>
	);
}

function statusTone(status: number): "default" | "secondary" | "destructive" {
	if (status >= 400) return "destructive";
	if (status >= 300) return "secondary";
	return "default";
}

export interface ApiRequestFormProps {
	config: ApiRequestConfig;
	upstreamVars: string[];
	onChange: (config: ApiRequestConfig) => void;
	/** Automation project that owns the node; required to send a test request. */
	projectId: string;
	readOnly?: boolean;
}

export function ApiRequestForm({
	config,
	upstreamVars,
	onChange,
	projectId,
	readOnly = false,
}: ApiRequestFormProps) {
	const [curl, setCurl] = useState("");
	const [curlMessage, setCurlMessage] = useState<{
		error: boolean;
		text: string;
	} | null>(null);
	const [samples, setSamples] = useState<Record<string, string>>({});
	const [confirming, setConfirming] = useState(false);
	const [sending, setSending] = useState(false);
	const [response, setResponse] = useState<ApiTestResponse | null>(null);
	const [sendError, setSendError] = useState<string | null>(null);

	const references = useMemo(() => referencedPaths(config), [config]);
	const isRead = config.method === "GET" || config.method === "HEAD";
	const canHaveBody = !isRead;

	const importCurl = () => {
		try {
			const result = parseCurlCommand(curl);
			onChange({
				...config,
				method: result.method,
				url: result.url,
				headers: Object.keys(result.headers).length
					? JSON.stringify(result.headers, null, 2)
					: "",
				bodyType: result.bodyType,
				body: result.body,
			});
			setCurl("");
			setCurlMessage({
				error: false,
				text: result.warnings.length
					? result.warnings.join(" ")
					: "Request imported.",
			});
		} catch (error) {
			setCurlMessage({
				error: true,
				text: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const send = async () => {
		setConfirming(false);
		setSending(true);
		setSendError(null);
		try {
			setResponse(
				await testAutomationRequest(
					projectId,
					apiRequestWorkflowConfig(config),
					buildSampleScope(samples),
				),
			);
		} catch (error) {
			setResponse(null);
			setSendError(
				error instanceof Error ? error.message : String(error),
			);
		} finally {
			setSending(false);
		}
	};

	const missingSamples = references.filter(
		(path) => !(samples[path] ?? "").trim(),
	);
	const sendDisabled =
		readOnly ||
		sending ||
		!projectId ||
		!config.url.trim() ||
		missingSamples.length > 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-end gap-2">
				<div className="flex w-32 flex-col gap-1">
					<Small className="font-medium">Method</Small>
					<Select
						value={config.method}
						disabled={readOnly}
						onValueChange={(method) =>
							onChange({
								...config,
								method,
								...(method === "GET" || method === "HEAD"
									? { bodyType: "none" as const, body: "" }
									: {}),
							})
						}
					>
						<SelectTrigger aria-label="Method">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{METHODS.map((method) => (
								<SelectItem key={method} value={method}>
									{method}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="min-w-0 flex-1">
					<PillInput
						label="URL"
						required
						value={config.url}
						placeholder={
							config.connectionId
								? "/path/${id}"
								: "https://api.example.com/items/${id}"
						}
						onChange={(url) => onChange({ ...config, url })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
				</div>
				<Button
					type="button"
					disabled={sendDisabled}
					onClick={() => (isRead ? send() : setConfirming(true))}
				>
					<Send className="size-4" /> {sending ? "Sending…" : "Send"}
				</Button>
			</div>

			{confirming && (
				<Alert>
					<AlertTitle>
						Send a real {config.method} request?
					</AlertTitle>
					<AlertDescription>
						<p>
							This calls the service now, with real credentials,
							and may change data.
						</p>
						<div className="mt-2 flex gap-2">
							<Button type="button" size="sm" onClick={send}>
								Send {config.method}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => setConfirming(false)}
							>
								Cancel
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{!readOnly && (
				<details className="rounded-md border border-border p-3">
					<summary className="cursor-pointer font-medium text-sm">
						Import from cURL
					</summary>
					<div className="mt-3 flex flex-col gap-2">
						<Textarea
							aria-label="cURL command"
							className="font-mono text-xs"
							rows={4}
							value={curl}
							placeholder={`curl -X POST https://api.example.com/items -H 'Content-Type: application/json' -d '{"name":"demo"}'`}
							onChange={(event) => setCurl(event.target.value)}
						/>
						<div>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={!curl.trim()}
								onClick={importCurl}
							>
								Import
							</Button>
						</div>
						{curlMessage && (
							<Small
								role={curlMessage.error ? "alert" : "status"}
								className={
									curlMessage.error
										? "text-destructive"
										: "text-muted-foreground"
								}
							>
								{curlMessage.text}
							</Small>
						)}
					</div>
				</details>
			)}

			<Tabs defaultValue="params">
				<TabsList>
					<TabsTrigger value="params">Params</TabsTrigger>
					<TabsTrigger value="headers">Headers</TabsTrigger>
					<TabsTrigger value="body">Body</TabsTrigger>
					<TabsTrigger value="auth">Auth</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>
				<TabsContent value="params" className="pt-3">
					<KeyValueEditor
						label="Query parameters"
						value={config.query}
						onChange={(query) => onChange({ ...config, query })}
						readOnly={readOnly}
						keyPlaceholder="name"
					/>
				</TabsContent>
				<TabsContent value="headers" className="pt-3">
					<KeyValueEditor
						label="Headers"
						value={config.headers}
						onChange={(headers) => onChange({ ...config, headers })}
						readOnly={readOnly}
						keyPlaceholder="Header-Name"
					/>
				</TabsContent>
				<TabsContent value="body" className="flex flex-col gap-3 pt-3">
					<ToggleGroup
						type="single"
						variant="outline"
						size="sm"
						value={canHaveBody ? config.bodyType : "none"}
						aria-label="Body type"
						onValueChange={(value) => {
							if (!value || readOnly) return;
							onChange({
								...config,
								bodyType: value as ApiRequestBodyType,
							});
						}}
					>
						{BODY_TYPES.map((type) => (
							<ToggleGroupItem
								key={type.value}
								value={type.value}
								disabled={
									readOnly ||
									(!canHaveBody && type.value !== "none")
								}
							>
								{type.label}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					{!canHaveBody && (
						<Small className="text-muted-foreground">
							{config.method} requests cannot send a body.
						</Small>
					)}
					{canHaveBody && config.bodyType === "form" && (
						<KeyValueEditor
							label="Form fields"
							value={config.body}
							onChange={(body) => onChange({ ...config, body })}
							readOnly={readOnly}
							keyPlaceholder="field"
						/>
					)}
					{canHaveBody &&
						(config.bodyType === "json" ||
							config.bodyType === "raw") && (
							<PillInput
								label={
									config.bodyType === "json"
										? "JSON body"
										: "Raw body"
								}
								value={config.body}
								placeholder={
									config.bodyType === "json"
										? '{"name": "${name}"}'
										: "Text to send"
								}
								onChange={(body) =>
									onChange({ ...config, body })
								}
								upstreamVars={upstreamVars}
								readOnly={readOnly}
								mono
							/>
						)}
				</TabsContent>
				<TabsContent value="auth" className="flex flex-col gap-3 pt-3">
					<EnginePickerField
						label="Connection (optional)"
						name={config.connectionName || ""}
						value={config.connectionId}
						engineTypes={["FUNCTION"]}
						disabled={readOnly}
						onChange={(engine) =>
							onChange({
								...config,
								connectionId: engine.engine_id,
								connectionName:
									engine.engine_display_name ??
									engine.engine_name,
							})
						}
					/>
					{config.connectionId && !readOnly && (
						<div>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() =>
									onChange({
										...config,
										connectionId: "",
										connectionName: "",
									})
								}
							>
								Remove connection
							</Button>
						</div>
					)}
					<Small className="text-muted-foreground">
						A Connection supplies the host and its saved
						credentials; the URL above is then just the path.
						Without one, call a full URL and put secrets in a header
						as a reference, for example{" "}
						<span className="font-mono">Bearer {"${token}"}</span> —
						typing a token into a credential header is not allowed.
					</Small>
					{!readOnly && !config.connectionId && (
						<div>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => {
									const rows = toRows(config.headers).filter(
										(row) =>
											row.key.toLowerCase() !==
											"authorization",
									);
									onChange({
										...config,
										headers: fromRows([
											...rows,
											{
												key: "Authorization",
												value: "Bearer ${token}",
											},
										]),
									});
								}}
							>
								Add bearer token header
							</Button>
						</div>
					)}
				</TabsContent>
				<TabsContent value="settings" className="pt-3">
					<div className="flex w-40 flex-col gap-1">
						<Small className="font-medium">Timeout (seconds)</Small>
						<Input
							type="number"
							min={1}
							max={120}
							aria-label="Timeout in seconds"
							value={config.timeoutSeconds}
							disabled={readOnly}
							onChange={(event) =>
								onChange({
									...config,
									timeoutSeconds: event.target.value,
								})
							}
						/>
					</div>
					<Small className="mt-2 block text-muted-foreground">
						Every status code, including 404 and 500, is returned as
						a result you can branch on. Redirects are not followed;
						the Location header is returned. Responses over 1 MB are
						cut off.
					</Small>
				</TabsContent>
			</Tabs>

			{references.length > 0 && (
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<p className="font-medium text-sm">
						Sample values for testing
					</p>
					<Small className="text-muted-foreground">
						Used only when you press Send; they are not saved with
						the automation.
					</Small>
					<div className="mt-2 flex flex-col gap-2">
						{references.map((path) => (
							<div key={path} className="flex items-center gap-2">
								<span className="w-2/5 truncate font-mono text-xs">
									{path}
								</span>
								<Input
									aria-label={`Sample value for ${path}`}
									className="flex-1 font-mono text-xs"
									value={samples[path] ?? ""}
									onChange={(event) =>
										setSamples({
											...samples,
											[path]: event.target.value,
										})
									}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			{sendError && (
				<Alert variant="destructive">
					<AlertTitle>Request did not complete</AlertTitle>
					<AlertDescription>{sendError}</AlertDescription>
				</Alert>
			)}
			{response && (
				<div className="flex flex-col gap-2 rounded-md border border-border p-3">
					<div className="flex items-center gap-2">
						<Badge variant={statusTone(response.status)}>
							{response.status}
						</Badge>
						<Small className="text-muted-foreground">
							{response.durationMs} ms
							{response.truncated
								? " · body cut off at 1 MB"
								: ""}
						</Small>
					</div>
					<details>
						<summary className="cursor-pointer text-sm">
							Headers
						</summary>
						<pre className="mt-1 overflow-auto text-xs">
							{Object.entries(response.headers)
								.map(([name, value]) => `${name}: ${value}`)
								.join("\n")}
						</pre>
					</details>
					<pre className="max-h-80 overflow-auto rounded bg-muted/40 p-2 text-xs">
						{typeof response.body === "string"
							? response.body
							: JSON.stringify(response.body, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
