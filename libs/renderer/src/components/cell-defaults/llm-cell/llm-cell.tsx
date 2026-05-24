// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Copy, Maximize2, Plus, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { EngineSubtypeIcon, EntityHeader } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Popover,
	PopoverContent,
	PopoverTrigger,
	toast,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";

export interface LLMModelEntry {
	id: string;
	name: string;
	engineType: string;
	engineSubtype?: string;
	/** Optional raw JSON string of extra paramValues (e.g. `{"temperature":0.7}`). */
	params?: string;
}

export interface LLMCellDef extends CellDef<"llm"> {
	widget: "llm";
	parameters: {
		command: string;
		models: LLMModelEntry[];
	};
}

interface AvailableModel {
	id: string;
	name: string;
	engineType: string;
	engineSubtype?: string;
}

export const LLMCell: CellComponent<LLMCellDef> = observer((props) => {
	const { state } = useBlocks();
	const { cell } = props;

	const [availableModels, setAvailableModels] = useState<AvailableModel[]>(
		[],
	);
	const [pickerOpen, setPickerOpen] = useState(false);

	const command = cell.parameters.command ?? "";
	const models = useMemo(
		() => cell.parameters.models ?? [],
		[cell.parameters.models],
	);

	useEffect(() => {
		fetchAllModels();
		// Ensure the parameter exists so the form is stable across re-mounts.
		if (!Array.isArray(cell.parameters.models)) {
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.models",
					value: [],
				},
			});
		}
	}, []);

	const fetchAllModels = async () => {
		const res = await runPixel(`MyEngines(engineTypes=["MODEL"])`);
		const list = res.pixelReturn[0].output as Array<{
			engine_id: string;
			engine_name: string;
			engine_type: string;
			engine_subtype?: string;
		}>;
		setAvailableModels(
			list.map((m) => ({
				id: m.engine_id,
				name: m.engine_name,
				engineType: m.engine_type,
				engineSubtype: m.engine_subtype,
			})),
		);
	};

	const dispatchUpdate = (path: string, value: unknown) => {
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: cell.query.id,
				cellId: cell.id,
				path,
				value,
			},
		});
	};

	const addModel = (model: AvailableModel) => {
		dispatchUpdate("parameters.models", [
			...models,
			{
				id: model.id,
				name: model.name,
				engineType: model.engineType,
				engineSubtype: model.engineSubtype,
				params: "",
			},
		]);
		setPickerOpen(false);
	};

	const removeModel = (idx: number) => {
		const next = models.slice();
		next.splice(idx, 1);
		dispatchUpdate("parameters.models", next);
	};

	const updateModelParams = (idx: number, params: string) => {
		const next = models.slice();
		next[idx] = { ...next[idx], params };
		dispatchUpdate("parameters.models", next);
	};

	const selectedIds = new Set(models.map((m) => m.id));
	const pickerOptions = availableModels.filter((m) => !selectedIds.has(m.id));

	// cell.output is an array (one entry per pixel) when toPixel returns []
	// and a single value otherwise. Normalize to an array aligned with models.
	const outputs = useMemo(() => {
		const out = cell.output;
		if (Array.isArray(out)) return out;
		if (out == null) return [];
		return [out];
	}, [cell.output]);

	const isErrorOp =
		Array.isArray(cell.operation) && cell.operation.includes("ERROR");

	const extractResponse = (raw: unknown): string => {
		if (raw == null) return "";
		if (typeof raw === "string") return raw;
		if (typeof raw === "object") {
			const obj = raw as Record<string, unknown>;
			// Common LLM reactor shapes
			if (typeof obj.response === "string") return obj.response;
			if (typeof obj.content === "string") return obj.content;
			if (typeof obj.message === "string") return obj.message;
			if (typeof obj.output === "string") return obj.output;
			return JSON.stringify(obj, null, 2);
		}
		return String(raw);
	};

	const extractTokens = (
		raw: unknown,
	): { prompt?: number; response?: number } => {
		if (raw == null || typeof raw !== "object") return {};
		const obj = raw as Record<string, unknown>;
		const prompt =
			typeof obj.numberOfTokensInPrompt === "number"
				? obj.numberOfTokensInPrompt
				: undefined;
		const response =
			typeof obj.numberOfTokensInResponse === "number"
				? obj.numberOfTokensInResponse
				: undefined;
		return { prompt, response };
	};

	interface NormalizedPart {
		type: string;
		text?: string;
		data?: Record<string, unknown>;
	}

	// LLM reactor returns `parts: [{ type: "TEXT", text }, { type: "TOOL_CALL", ... }, ...]`.
	// If parts isn't present we fall back to the single-string `extractResponse`.
	const extractParts = (raw: unknown): NormalizedPart[] | null => {
		if (raw == null || typeof raw !== "object") return null;
		const obj = raw as Record<string, unknown>;
		const parts = obj.parts;
		if (!Array.isArray(parts) || parts.length === 0) return null;
		return parts.map((p) => {
			if (p == null || typeof p !== "object") {
				return { type: "TEXT", text: String(p) };
			}
			const part = p as Record<string, unknown>;
			return {
				type:
					typeof part.type === "string"
						? part.type.toUpperCase()
						: "UNKNOWN",
				text: typeof part.text === "string" ? part.text : undefined,
				data: part,
			};
		});
	};

	// Track raw/pretty toggle per model card.
	const [rawCards, setRawCards] = useState<Record<number, boolean>>({});
	const [expandedCard, setExpandedCard] = useState<number | null>(null);

	const renderCardBody = (
		raw: unknown,
		isRaw: boolean,
		isError: boolean,
		maxHeightClass: string,
	) => {
		const rawText =
			typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
		if (isRaw) {
			return rawText ? (
				<pre
					className={`${maxHeightClass} overflow-auto whitespace-pre break-words font-mono text-xs`}
				>
					{rawText}
				</pre>
			) : (
				<span className="text-muted-foreground text-xs italic">
					No response
				</span>
			);
		}
		const parts = extractParts(raw);
		if (parts && parts.length > 0) {
			return (
				<div
					className={`flex ${maxHeightClass} flex-col gap-2 overflow-auto`}
				>
					{parts.map((part, pIdx) => {
						if (part.type === "TEXT") {
							return (
								<pre
									// biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id
									key={pIdx}
									className="whitespace-pre-wrap break-words font-mono text-xs"
								>
									{part.text ?? ""}
								</pre>
							);
						}
						const label = part.type
							.replace(/_/g, " ")
							.toLowerCase();
						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id
								key={pIdx}
								className="rounded-md border border-primary/30 bg-primary/5 p-2"
							>
								<div className="mb-1 inline-flex items-center rounded bg-primary/15 px-1.5 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wider">
									{label}
								</div>
								<pre className="whitespace-pre-wrap break-words font-mono text-[11px]">
									{JSON.stringify(
										part.data ?? part.text,
										null,
										2,
									)}
								</pre>
							</div>
						);
					})}
				</div>
			);
		}
		const prettyText = isError
			? typeof raw === "string"
				? raw
				: JSON.stringify(raw)
			: extractResponse(raw);
		return prettyText ? (
			<pre
				className={`${maxHeightClass} overflow-auto whitespace-pre-wrap break-words font-mono text-xs`}
			>
				{prettyText}
			</pre>
		) : (
			<span className="text-muted-foreground text-xs italic">
				No response
			</span>
		);
	};

	return (
		<div
			className="flex w-full flex-col gap-4"
			id={`${cell.query.id} - ${cell.id}`}
		>
			<div className="flex flex-col gap-1">
				<span className="text-muted-foreground text-xs">Prompt</span>
				<textarea
					className="min-h-[96px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					value={command}
					placeholder="Enter the prompt to send to each selected model..."
					rows={4}
					onChange={(e) =>
						dispatchUpdate("parameters.command", e.target.value)
					}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-xs">
						Models{models.length > 0 ? ` (${models.length})` : ""}
					</span>
					<Popover open={pickerOpen} onOpenChange={setPickerOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								disabled={pickerOptions.length === 0}
							>
								<Plus className="mr-1 size-3.5" />
								Add model
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-[320px] p-0">
							<div className="max-h-[300px] overflow-y-auto py-1">
								{pickerOptions.length === 0 ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										No models available
									</div>
								) : (
									pickerOptions.map((m) => (
										<button
											key={m.id}
											type="button"
											className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
											onClick={() => addModel(m)}
										>
											<EngineSubtypeIcon
												engineType={m.engineType}
												engineSubtype={m.engineSubtype}
												alt={`${m.name} icon`}
												className="size-5 shrink-0 object-contain"
											/>
											<div className="flex min-w-0 flex-col">
												<span className="truncate text-sm">
													{m.name}
												</span>
												<span className="truncate text-muted-foreground text-xs">
													{m.id}
												</span>
											</div>
										</button>
									))
								)}
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{models.length === 0 ? (
					<div className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-muted-foreground text-sm">
						No models selected. Click "Add model" to choose one or
						more.
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{models.map((model, idx) => (
							<div
								key={`${model.id}-${idx}`}
								className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3"
							>
								<div className="flex items-center justify-between gap-2">
									<div className="flex min-w-0 items-center gap-2">
										<EngineSubtypeIcon
											engineType={model.engineType}
											engineSubtype={model.engineSubtype}
											alt={`${model.name} icon`}
											className="size-5 shrink-0 object-contain"
										/>
										<div className="flex min-w-0 flex-col">
											<span className="truncate font-medium text-sm">
												{model.name}
											</span>
											<span className="truncate text-muted-foreground text-xs">
												{model.id}
											</span>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										title="Remove model"
										onClick={() => removeModel(idx)}
									>
										<X className="size-4" />
									</Button>
								</div>
								{(() => {
									const trimmed = (model.params ?? "").trim();
									let paramsState:
										| "empty"
										| "valid"
										| "invalid"
										| "non-object" = "empty";
									let paramsError = "";
									if (trimmed) {
										try {
											const parsed = JSON.parse(trimmed);
											if (
												parsed &&
												typeof parsed === "object" &&
												!Array.isArray(parsed)
											) {
												paramsState = "valid";
											} else {
												paramsState = "non-object";
												paramsError =
													"Must be a JSON object";
											}
										} catch (e) {
											paramsState = "invalid";
											paramsError =
												e instanceof Error
													? e.message
													: "Invalid JSON";
										}
									}
									const isError =
										paramsState === "invalid" ||
										paramsState === "non-object";
									return (
										<div className="flex flex-col gap-1">
											<div className="flex items-center justify-between gap-2">
												<span className="text-muted-foreground text-xs">
													Params (JSON)
												</span>
												{paramsState === "valid" && (
													<span className="text-green-600 text-xs">
														✓ valid
													</span>
												)}
												{isError && (
													<span
														className="truncate text-destructive text-xs"
														title={paramsError}
													>
														{paramsError}
													</span>
												)}
											</div>
											<textarea
												className={`min-h-[60px] w-full resize-y rounded-md border bg-background px-2 py-1.5 font-mono text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 ${
													isError
														? "border-destructive focus-visible:ring-destructive"
														: "border-input focus-visible:ring-ring"
												}`}
												value={model.params ?? ""}
												placeholder='Optional, e.g. { "temperature": 0.7, "max_new_tokens": 512 }'
												rows={3}
												spellCheck={false}
												onChange={(e) =>
													updateModelParams(
														idx,
														e.target.value,
													)
												}
											/>
										</div>
									);
								})()}
							</div>
						))}
					</div>
				)}
			</div>
			{cell.isExecuted && models.length > 0 && (
				<div className="flex flex-col gap-2">
					<span className="text-muted-foreground text-xs">
						Comparison
					</span>
					<div
						className={`grid gap-3 ${
							models.length === 1
								? "grid-cols-1"
								: models.length === 2
									? "grid-cols-1 md:grid-cols-2"
									: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
						}`}
					>
						{models.map((model, idx) => {
							const raw = outputs[idx];
							const isError =
								Array.isArray(cell.operation) &&
								cell.operation[idx] === "ERROR";
							const tokens = extractTokens(raw);
							const isRaw = !!rawCards[idx];
							return (
								<div
									key={`${model.id}-${idx}`}
									className={`flex flex-col gap-2 rounded-md border p-3 ${
										isError
											? "border-destructive/40 bg-destructive/5"
											: "bg-background"
									}`}
								>
									<div className="flex items-center justify-between gap-2 border-b pb-2">
										<div className="flex min-w-0 items-center gap-2">
											<EngineSubtypeIcon
												engineType={model.engineType}
												engineSubtype={
													model.engineSubtype
												}
												alt={`${model.name} icon`}
												className="size-5 shrink-0 object-contain"
											/>
											<div className="flex min-w-0 flex-col">
												<span className="truncate font-medium text-sm">
													{model.name}
												</span>
												<span className="truncate text-muted-foreground text-xs">
													{model.id}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Button
												variant={
													isRaw
														? "secondary"
														: "ghost"
												}
												size="sm"
												className="h-7 px-2 text-xs"
												onClick={() =>
													setRawCards((prev) => ({
														...prev,
														[idx]: !prev[idx],
													}))
												}
											>
												{isRaw ? "Pretty" : "Raw"}
											</Button>
											<Button
												title="Expand"
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-muted-foreground"
												onClick={() =>
													setExpandedCard(idx)
												}
											>
												<Maximize2 className="size-3" />
											</Button>
										</div>
									</div>
									{!isRaw &&
										(tokens.prompt !== undefined ||
											tokens.response !== undefined) && (
											<div className="flex items-center gap-3 text-muted-foreground text-xs">
												{tokens.prompt !==
													undefined && (
													<span>
														Prompt:{" "}
														<span className="font-mono text-foreground">
															{tokens.prompt}
														</span>
													</span>
												)}
												{tokens.response !==
													undefined && (
													<span>
														Response:{" "}
														<span className="font-mono text-foreground">
															{tokens.response}
														</span>
													</span>
												)}
												{tokens.prompt !== undefined &&
													tokens.response !==
														undefined && (
														<span>
															Total:{" "}
															<span className="font-mono text-foreground">
																{tokens.prompt +
																	tokens.response}
															</span>
														</span>
													)}
											</div>
										)}
									{renderCardBody(
										raw,
										isRaw,
										isError,
										"max-h-[300px]",
									)}
								</div>
							);
						})}
					</div>
					{isErrorOp && (
						<span className="text-destructive text-xs">
							One or more models returned an error.
						</span>
					)}
				</div>
			)}

			<Dialog
				open={expandedCard !== null}
				onOpenChange={(o) => !o && setExpandedCard(null)}
			>
				<DialogContent
					showCloseButton={false}
					className="flex max-h-[85vh] w-[80vw] max-w-[80vw] flex-col gap-3 sm:max-w-[80vw]"
				>
					{(() => {
						if (expandedCard === null) return null;
						const idx = expandedCard;
						const model = models[idx];
						if (!model) return null;
						const raw = outputs[idx];
						const isError =
							Array.isArray(cell.operation) &&
							cell.operation[idx] === "ERROR";
						const tokens = extractTokens(raw);
						const isRaw = !!rawCards[idx];
						return (
							<>
								<DialogHeader>
									<DialogTitle className="sr-only">
										{model.name}
									</DialogTitle>
									<EntityHeader
										size="sm"
										copyable={false}
										icon={
											<EngineSubtypeIcon
												engineType={model.engineType}
												engineSubtype={
													model.engineSubtype
												}
												alt={`${model.name} icon`}
												className="size-full object-contain"
											/>
										}
										name={model.name}
										id={model.id}
										actions={
											<>
												<Button
													title={
														isRaw
															? "Show pretty"
															: "Show raw"
													}
													variant={
														isRaw
															? "secondary"
															: "ghost"
													}
													size="sm"
													className="h-7 px-2 text-xs"
													onClick={() =>
														setRawCards((prev) => ({
															...prev,
															[idx]: !prev[idx],
														}))
													}
												>
													{isRaw ? "Pretty" : "Raw"}
												</Button>
												<Button
													title="Copy raw JSON"
													variant="ghost"
													size="sm"
													className="h-7 px-2 text-muted-foreground"
													onClick={async () => {
														const textToCopy =
															typeof raw ===
															"string"
																? raw
																: JSON.stringify(
																		raw,
																		null,
																		2,
																	);
														try {
															await navigator.clipboard.writeText(
																textToCopy,
															);
															toast.success(
																"Raw JSON copied",
															);
														} catch {
															toast.error(
																"Failed to copy",
															);
														}
													}}
												>
													<Copy className="size-3" />
												</Button>
												<DialogClose asChild>
													<Button
														title="Close"
														variant="ghost"
														size="sm"
														className="h-7 px-2 text-muted-foreground"
													>
														<X className="size-3" />
													</Button>
												</DialogClose>
											</>
										}
									/>
								</DialogHeader>
								{!isRaw &&
									(tokens.prompt !== undefined ||
										tokens.response !== undefined) && (
										<div className="flex items-center gap-4 text-muted-foreground text-xs">
											{tokens.prompt !== undefined && (
												<span>
													Prompt:{" "}
													<span className="font-mono text-foreground">
														{tokens.prompt}
													</span>
												</span>
											)}
											{tokens.response !== undefined && (
												<span>
													Response:{" "}
													<span className="font-mono text-foreground">
														{tokens.response}
													</span>
												</span>
											)}
											{tokens.prompt !== undefined &&
												tokens.response !==
													undefined && (
													<span>
														Total:{" "}
														<span className="font-mono text-foreground">
															{tokens.prompt +
																tokens.response}
														</span>
													</span>
												)}
										</div>
									)}
								<div
									className={`min-h-0 flex-1 overflow-y-auto rounded-md border p-3 ${
										isError
											? "border-destructive/40 bg-destructive/5"
											: "bg-muted/20"
									}`}
								>
									{renderCardBody(raw, isRaw, isError, "")}
								</div>
							</>
						);
					})()}
				</DialogContent>
			</Dialog>
		</div>
	);
});
