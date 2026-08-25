import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { AppConfig, ReactorParam } from "../../../domain/automation.types";
import { BoundInput } from "./pill-input";
import { AutomationProjectSelect } from "./project-select";

/** Appends a trailing semicolon if the pixel string ends with `)` and lacks one. */
function ensureSemicolon(pixel: string): string {
	const trimmed = pixel.trimEnd();
	return trimmed.endsWith(")") ? `${trimmed};` : pixel;
}

/** Extract key → value pairs from a pixel string like `Foo(a=["x"], b=["y"])`. */
function parsePixelParams(pixel: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const match of pixel.matchAll(/(\w+)=\["([^"]*)"\]/g)) {
		result[match[1]] = match[2];
	}
	return result;
}

/** Compose a pixel string from a reactor name, param definitions, and current values. */
function buildPixel(
	name: string,
	params: ReactorParam[],
	values: Record<string, string>,
): string {
	if (params.length === 0) return `${name}();`;
	const args = params
		.map((p) => `${p.name}=["${values[p.name] ?? ""}"]`)
		.join(", ");
	return `${name}(${args});`;
}

export interface AppEngineFormProps {
	/** Current node config */
	config: AppConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: AppConfig) => void;
	/** The automation's own project ID — used to fetch reactors when no app context is selected */
	currentAppId: string;
	/** When false (business mode), raw pixel textarea is hidden when labeled param fields are available */
	devMode?: boolean;
}

interface ReactorSignature {
	template?: string;
	description?: string;
	params?: ReactorParam[];
}

function getReactorSignature(
	projectId: string,
	reactorName: string,
): Promise<ReactorSignature> {
	return runPixel(
		`GetProjectReactorSignature(project=["${projectId}"], reactor=["${reactorName}"]);`,
	).then((response) => {
		const output =
			response.pixelReturn?.[response.pixelReturn.length - 1]?.output;
		if (typeof output === "string") {
			return JSON.parse(output) as ReactorSignature;
		}
		if (output && typeof output === "object") {
			return output as ReactorSignature;
		}
		throw new Error("No reactor signature response.");
	});
}

export function AppEngineForm({
	config,
	upstreamVars,
	onChange,
	currentAppId,
	devMode = false,
}: AppEngineFormProps) {
	const [reactorSearch, setReactorSearch] = useState("");
	const [sigLoading, setSigLoading] = useState<string | null>(null);
	const [reactorDescription, setReactorDescription] = useState("");
	// Derive reactor name from existing config.pixel so labeled fields survive collapse/reopen
	const [reactorName, setReactorName] = useState<string>(
		() => config.pixel.match(/^(\w+)\s*\(/)?.[1] ?? "",
	);
	const [reactorParams, setReactorParams] = useState<ReactorParam[]>([]);
	const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
		parsePixelParams(config.pixel),
	);
	const [noParamInfo, setNoParamInfo] = useState(false);

	const effectiveProjectId = config.appId || currentAppId;

	// When a reactor name was derived from config.pixel on mount (i.e. after a collapse/reopen),
	// silently re-fetch its signature so labeled param fields are restored in business mode.
	useEffect(() => {
		if (!reactorName || !effectiveProjectId || reactorParams.length > 0)
			return;
		getReactorSignature(effectiveProjectId, reactorName)
			.then((signature) => {
				if (signature.params?.length)
					setReactorParams(signature.params);
				if (signature.description)
					setReactorDescription(signature.description);
			})
			.catch(() => setNoParamInfo(true));
	}, [reactorName, effectiveProjectId, reactorParams.length]);

	const { data: reactorData, status: reactorStatus } = usePixel<string[]>(
		effectiveProjectId
			? `GetProjectAvailableReactors(project=["${effectiveProjectId}"]);`
			: "",
		{ data: [] },
	);

	const reactors = reactorData ?? [];

	// GetProjectAvailableReactors doesn't support a filterWord param, so we filter client-side.
	// The list is bounded by project reactor count and never approaches a problematic size.
	const filteredReactors = useMemo(() => {
		const q = reactorSearch.trim().toLowerCase();
		if (!q) return reactors;
		return reactors.filter((r) => r.toLowerCase().includes(q));
	}, [reactors, reactorSearch]);

	const loading = reactorStatus === "INITIAL" || reactorStatus === "LOADING";

	/** Loads the project reactor's MCP-derived parameter signature, with a bounded fallback to a bare call. */
	const handleReactorClick = async (name: string) => {
		setSigLoading(name);
		setReactorDescription("");
		setReactorParams([]);
		setReactorName(name);
		setNoParamInfo(false);
		try {
			const timeout = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("timeout")), 2000),
			);
			const signature = await Promise.race([
				getReactorSignature(effectiveProjectId, name),
				timeout,
			]);
			if (signature) {
				const template = signature.template ?? `${name}()`;
				const initial = parsePixelParams(template);
				setParamValues(initial);
				onChange({
					...config,
					pixel: ensureSemicolon(template),
				});
				if (signature.description)
					setReactorDescription(signature.description);
				if (signature.params?.length)
					setReactorParams(signature.params);
			} else {
				setParamValues({});
				onChange({ ...config, pixel: ensureSemicolon(`${name}()`) });
				setNoParamInfo(true);
			}
		} catch {
			setParamValues({});
			onChange({ ...config, pixel: ensureSemicolon(`${name}()`) });
			setNoParamInfo(true);
		} finally {
			setSigLoading(null);
		}
	};

	const handleParamChange = (name: string, value: string) => {
		const next = { ...paramValues, [name]: value };
		setParamValues(next);
		onChange({
			...config,
			pixel: buildPixel(reactorName, reactorParams, next),
		});
	};

	// Show labeled param fields in business mode when params are available this session
	const showParamFields = !devMode && reactorParams.length > 0;

	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>App Context (optional)</FieldLabel>
				<AutomationProjectSelect
					name={config.appName || ""}
					value={config.appId || ""}
					projectTypes={["CODE", "BLOCKS"]}
					onChange={(projectId, projectName) =>
						onChange({
							...config,
							appId: projectId,
							appName: projectName,
						})
					}
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					Run this function inside a specific app's context
					(optional).
				</p>
			</Field>

			{/* Reactor browser */}
			{!loading && reactors.length === 0 && (
				<p className="text-[11px] text-muted-foreground">
					No custom functions found for this app. Enter a function
					call manually below.
				</p>
			)}
			{(loading || reactors.length > 0) && (
				<Field>
					<FieldLabel>Custom Functions</FieldLabel>
					{loading ? (
						<p className="text-muted-foreground text-xs">
							Loading functions...
						</p>
					) : (
						<>
							{reactors.length > 5 && (
								<Input
									value={reactorSearch}
									onChange={(e) =>
										setReactorSearch(e.target.value)
									}
									placeholder="Search functions..."
									className="mb-1.5 h-7 text-xs"
								/>
							)}
							<div className="max-h-36 divide-y overflow-y-auto rounded-lg border">
								{filteredReactors.length === 0 ? (
									<p className="px-3 py-2 text-muted-foreground text-xs">
										No functions match "{reactorSearch}"
									</p>
								) : (
									filteredReactors.map((name) => (
										<button
											key={name}
											type="button"
											disabled={sigLoading !== null}
											className={`flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-xs transition-colors disabled:opacity-50 ${reactorName === name ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
											onClick={() =>
												handleReactorClick(name)
											}
										>
											<span>{name}</span>
											{sigLoading === name && (
												<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
											)}
										</button>
									))
								)}
							</div>
							<p className="mt-1 text-[11px] text-muted-foreground">
								Click a function to auto-fill its parameters.
							</p>
						</>
					)}
				</Field>
			)}

			{reactorDescription && (
				<p className="text-[11px] text-muted-foreground">
					{reactorDescription}
				</p>
			)}

			{/* Business mode: labeled param fields */}
			{showParamFields && (
				<div className="flex flex-col gap-3">
					{reactorParams.map((p) => (
						<BoundInput
							key={p.name}
							label={`${p.name}${p.required ? "" : " (optional)"}`}
							required={p.required}
							value={paramValues[p.name] ?? ""}
							description={p.description ?? ""}
							onChange={(v) => handleParamChange(p.name, v)}
							upstreamVars={upstreamVars}
						/>
					))}
					{noParamInfo && (
						<p className="text-[11px] text-muted-foreground">
							No parameter info available. Edit the function call
							in developer mode.
						</p>
					)}
				</div>
			)}

			{/* Raw pixel textarea: always in dev mode; fallback in business mode when no params */}
			{(devMode || !showParamFields) && (
				<div className="relative">
					<BoundInput
						label="Function Call"
						required
						value={config.pixel}
						placeholder='MyFunction(param=[""])'
						onChange={(v) =>
							onChange({ ...config, pixel: ensureSemicolon(v) })
						}
						upstreamVars={upstreamVars}
						mono
					/>
					{sigLoading !== null && (
						<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						</div>
					)}
				</div>
			)}

			{!showParamFields &&
				noParamInfo &&
				!reactorDescription &&
				reactorParams.length === 0 && (
					<p className="text-[11px] text-muted-foreground">
						No parameter info available for this function. Edit the
						call manually above.
					</p>
				)}

			{/* Dev mode: show param reference panel */}
			{devMode && reactorParams.length > 0 && (
				<div className="rounded-lg border bg-muted/30 px-3 py-2">
					<p className="mb-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
						Parameters
					</p>
					<div className="flex flex-col gap-1">
						{reactorParams.map((p) => (
							<div
								key={p.name}
								className="flex items-baseline gap-2 text-[11px]"
							>
								<code className="font-mono text-foreground">
									{p.name}
								</code>
								<span className="text-muted-foreground/70">
									{p.type}
								</span>
								<span
									className={
										p.required
											? "text-foreground/60"
											: "text-muted-foreground/50"
									}
								>
									{p.required ? "required" : "optional"}
								</span>
								{p.description && (
									<span className="text-muted-foreground/60">
										— {p.description}
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
