import { Plus, Trash2, X } from "lucide-react";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
	useTheme,
} from "@semoss/ui/next";
import { formatJson } from "@semoss/utility/json";
import type { AutomationSavedTableColumn } from "../../../domain/automation.types";
import {
	getPurgeValueSamples,
	inferPurgeDraftInput,
	PURGE_COMPARATORS,
	type PurgeFilterDraft,
	parsePurgeFilters,
	purgeDraftScalar,
	purgeDraftValue,
	purgeFilterDrafts,
	serializePurgeFilters,
} from "../../../domain/purge-filters";
import { type InputMode, InputModeToggle } from "./input-mode-toggle";

interface PurgeFilterInputProps {
	/** Shared JSON value saved in the node configuration. */
	value: string;
	/** Publishes the raw JSON, including invalid edits so save validation cannot use stale rules. */
	onChange: (value: string) => void;
	/** Locks edits without preventing inspection in either mode. */
	readOnly?: boolean;
	/** Columns from the selected upstream table's historical output. */
	columns?: AutomationSavedTableColumn[];
	/** Bounded historical rows used only for optional value suggestions. */
	sampleRows?: unknown[][];
}

/** Edits Purge removal rules through a typed builder or their lossless JSON representation. */
export function PurgeFilterInput({
	value,
	onChange,
	readOnly = false,
	columns = [],
	sampleRows = [],
}: PurgeFilterInputProps) {
	const id = useId();
	const { resolvedTheme } = useTheme();
	const parsed = parsePurgeFilters(value);
	const [mode, setMode] = useState<InputMode>(() =>
		parsed.error ? "json" : "form",
	);
	const [drafts, setDrafts] = useState(() => purgeFilterDrafts(value));
	const [jsonDraft, setJsonDraft] = useState(() => formatJson(value));
	const [builderError, setBuilderError] = useState("");
	const publishedValue = useRef(value);

	useEffect(() => {
		if (
			value === publishedValue.current ||
			formatJson(value) === formatJson(publishedValue.current)
		) {
			publishedValue.current = value;
			return;
		}
		publishedValue.current = value;
		setJsonDraft(formatJson(value));
		const incoming = parsePurgeFilters(value);
		if (incoming.error) {
			setMode("json");
		} else {
			setDrafts(purgeFilterDrafts(value));
		}
		setBuilderError("");
	}, [value]);

	const publish = (next: string): void => {
		publishedValue.current = next;
		onChange(next);
	};
	const updateDrafts = (next: PurgeFilterDraft[]): void => {
		if (readOnly) return;
		setDrafts(next);
		const serialized = serializePurgeFilters(next);
		setBuilderError(serialized.error);
		setJsonDraft(serialized.json);
		publish(serialized.json);
	};
	const updateRule = (
		ruleId: string,
		changes: Partial<PurgeFilterDraft>,
	): void => {
		updateDrafts(
			drafts.map((draft) =>
				draft.id === ruleId ? { ...draft, ...changes } : draft,
			),
		);
	};
	const changeMode = (next: InputMode): void => {
		if (next === "form") {
			if (parsed.error) return;
			setDrafts(purgeFilterDrafts(value));
		} else if (builderError) {
			return;
		} else {
			setJsonDraft(formatJson(value));
		}
		setMode(next);
	};
	const addValue = (
		draft: PurgeFilterDraft,
		candidate: Pick<PurgeFilterDraft, "valueType" | "value"> = draft,
	): void => {
		if (readOnly || (draft.values?.length ?? 0) >= 100) return;
		const scalar = purgeDraftScalar(candidate);
		if (scalar === undefined) {
			setBuilderError(
				"Enter a valid value before adding it to the list.",
			);
			return;
		}
		const values = draft.values ?? [];
		if (
			values.some(
				(item) =>
					JSON.stringify(purgeDraftScalar(item)) ===
					JSON.stringify(scalar),
			)
		) {
			updateRule(draft.id, { value: "" });
			return;
		}
		updateRule(draft.id, {
			values: [...values, purgeDraftValue(scalar)],
			value: "",
			valueType: candidate.valueType,
		});
	};

	return (
		<FieldSet className="min-w-0 gap-3">
			<FieldLegend variant="label" className="mb-0">
				Rows to remove
			</FieldLegend>
			<FieldDescription>
				Separate conditions are combined with AND: every condition must
				match to remove a row. Within one Equal to list, matching any
				value is enough (OR).
			</FieldDescription>
			<InputModeToggle
				value={mode}
				onValueChange={changeMode}
				formLabel="Builder"
				formDisabled={Boolean(parsed.error)}
			/>
			{mode === "json" ? (
				<Field>
					<FieldLabel id={`${id}-json-label`}>
						JSON filters
					</FieldLabel>
					<FieldSet
						aria-labelledby={`${id}-json-label`}
						aria-invalid={Boolean(parsed.error)}
						aria-describedby={
							parsed.error ? `${id}-error` : undefined
						}
						className="h-72 min-w-0 overflow-hidden rounded-md border border-border"
					>
						<Suspense
							fallback={
								<output className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
									<Spinner className="size-4" />
									Loading JSON editor...
								</output>
							}
						>
							<MonacoEditor
								height="100%"
								width="100%"
								language="json"
								theme={
									resolvedTheme === "dark" ? "vs-dark" : "vs"
								}
								value={jsonDraft}
								onChange={(nextValue) => {
									if (!readOnly) {
										setJsonDraft(nextValue ?? "");
										publish(nextValue ?? "");
									}
								}}
								options={{
									ariaLabel: "JSON filters",
									automaticLayout: true,
									fontSize: 12,
									lineNumbers: "on",
									minimap: { enabled: false },
									folding: true,
									formatOnPaste: true,
									formatOnType: true,
									insertSpaces: true,
									tabSize: 2,
									scrollBeyondLastLine: false,
									scrollbar: {
										alwaysConsumeMouseWheel: false,
									},
									wordWrap: "on",
									readOnly,
									padding: { top: 8, bottom: 8 },
								}}
							/>
						</Suspense>
					</FieldSet>
					{parsed.error && (
						<FieldError id={`${id}-error`}>
							{parsed.error}
						</FieldError>
					)}
				</Field>
			) : (
				<>
					{drafts.map((draft, index) => {
						const samples = getPurgeValueSamples(
							draft.column,
							columns.map((column) => column.name),
							sampleRows,
						);
						const valueLabel = `${draft.values === undefined ? "Value" : "New value"} ${index + 1}`;
						const columnType = columns.find(
							(column) => column.name === draft.column,
						)?.type;
						return (
							<FieldSet
								key={draft.id}
								aria-labelledby={`${id}-${draft.id}-label`}
								className="min-w-0 gap-3 border-t pt-3"
							>
								<FieldLegend
									variant="label"
									className="mb-0 flex w-full items-center justify-between gap-2"
								>
									<span id={`${id}-${draft.id}-label`}>
										Filter {index + 1}
									</span>
									{!readOnly && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											aria-label={`Remove filter ${index + 1}`}
											onClick={() =>
												updateDrafts(
													drafts.filter(
														(rule) =>
															rule.id !==
															draft.id,
													),
												)
											}
										>
											<Trash2
												className="size-4"
												aria-hidden="true"
											/>
										</Button>
									)}
								</FieldLegend>
								<Field>
									<FieldLabel
										htmlFor={`${id}-${draft.id}-column`}
									>
										Column {index + 1}
									</FieldLabel>
									<Input
										id={`${id}-${draft.id}-column`}
										value={draft.column}
										required
										list={
											columns.length
												? `${id}-columns`
												: undefined
										}
										onChange={(event) =>
											updateRule(draft.id, {
												column: event.target.value,
											})
										}
										placeholder="Column name"
										readOnly={readOnly}
									/>
								</Field>
								<Field>
									<FieldLabel
										htmlFor={`${id}-${draft.id}-operator`}
									>
										Comparator
									</FieldLabel>
									<Select
										value={draft.operator}
										disabled={readOnly}
										onValueChange={(operator) => {
											const comparator =
												PURGE_COMPARATORS.find(
													(candidate) =>
														candidate.value ===
														operator,
												);
											if (comparator)
												updateRule(draft.id, {
													operator: comparator.value,
												});
										}}
									>
										<SelectTrigger
											id={`${id}-${draft.id}-operator`}
											className="w-full"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PURGE_COMPARATORS.filter(
												(comparator) =>
													(draft.valueType !==
														"null" &&
														draft.values ===
															undefined) ||
													comparator.value === "==" ||
													comparator.value === "!=",
											).map((comparator) => (
												<SelectItem
													key={comparator.value}
													value={comparator.value}
												>
													{comparator.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
								{(draft.operator === "==" ||
									draft.operator === "!=") && (
									<Field>
										<FieldLabel
											id={`${id}-${draft.id}-mode`}
										>
											Comparison values
										</FieldLabel>
										<ToggleGroup
											type="single"
											variant="outline"
											size="sm"
											className="self-start"
											aria-labelledby={`${id}-${draft.id}-mode`}
											value={
												draft.values === undefined
													? "single"
													: "multiple"
											}
											onValueChange={(next) => {
												if (readOnly) return;
												if (
													next === "multiple" &&
													draft.values === undefined
												) {
													const scalar =
														purgeDraftScalar(draft);
													if (scalar === undefined) {
														setBuilderError(
															"Enter a valid value before switching to multiple values.",
														);
														return;
													}
													updateRule(draft.id, {
														values:
															draft.valueType ===
																"string" &&
															draft.value === ""
																? []
																: [
																		purgeDraftValue(
																			scalar,
																		),
																	],
														value: "",
														valueType:
															draft.valueType,
													});
												} else if (
													next === "single" &&
													draft.values !==
														undefined &&
													draft.values.length <= 1
												) {
													const first =
														draft.values[0];
													updateRule(draft.id, {
														values: undefined,
														valueType:
															first?.valueType ??
															draft.valueType,
														value:
															first?.value ??
															draft.value,
													});
												}
											}}
										>
											<ToggleGroupItem
												value="single"
												disabled={
													readOnly ||
													(draft.values?.length ??
														0) > 1
												}
											>
												One value
											</ToggleGroupItem>
											<ToggleGroupItem
												value="multiple"
												disabled={readOnly}
											>
												Multiple values
											</ToggleGroupItem>
										</ToggleGroup>
									</Field>
								)}
								<Field>
									<FieldLabel
										htmlFor={`${id}-${draft.id}-type`}
										title={
											columnType
												? `Column schema: ${columnType}`
												: undefined
										}
									>
										Value type
									</FieldLabel>
									<Select
										value={draft.valueType}
										disabled={readOnly}
										onValueChange={(valueType) => {
											if (
												valueType !== "string" &&
												valueType !== "number" &&
												valueType !== "boolean" &&
												valueType !== "null"
											)
												return;
											updateRule(draft.id, {
												valueType,
												value:
													valueType === "null"
														? ""
														: draft.value,
												...(valueType === "null" &&
												draft.operator !== "==" &&
												draft.operator !== "!="
													? {
															operator:
																"==" as const,
														}
													: {}),
											});
										}}
									>
										<SelectTrigger
											id={`${id}-${draft.id}-type`}
											className="w-full"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="string">
												Text
											</SelectItem>
											<SelectItem value="number">
												Number
											</SelectItem>
											<SelectItem value="boolean">
												Boolean
											</SelectItem>
											<SelectItem value="null">
												Null
											</SelectItem>
										</SelectContent>
									</Select>
									{draft.values !== undefined && (
										<FieldDescription>
											Applies to new values.
										</FieldDescription>
									)}
								</Field>
								{samples.length > 0 && (
									<Field>
										<FieldLabel
											htmlFor={`${id}-${draft.id}-sample`}
										>
											Sampled values
										</FieldLabel>
										<Select
											value=""
											disabled={readOnly}
											onValueChange={(selected) => {
												const sample = samples.find(
													(candidate) =>
														candidate.id ===
														selected,
												);
												if (
													sample &&
													draft.values !== undefined
												)
													addValue(draft, sample);
												else if (sample)
													updateRule(draft.id, {
														valueType:
															sample.valueType,
														value: sample.value,
														...(sample.valueType ===
															"null" &&
														draft.operator !==
															"==" &&
														draft.operator !== "!="
															? {
																	operator:
																		"==" as const,
																}
															: {}),
													});
											}}
										>
											<SelectTrigger
												id={`${id}-${draft.id}-sample`}
												className="w-full"
											>
												<SelectValue placeholder="Choose a sampled value" />
											</SelectTrigger>
											<SelectContent>
												{samples.map((sample) => (
													<SelectItem
														key={sample.id}
														value={sample.id}
													>
														<span className="wrap-break-word">
															{sample.label} (
															{sample.valueType})
														</span>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
								<Field>
									<FieldLabel
										htmlFor={`${id}-${draft.id}-value`}
									>
										{draft.values === undefined
											? valueLabel
											: `Values ${index + 1}`}
									</FieldLabel>
									<div className="flex min-h-10 min-w-0 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring">
										{draft.values?.map(
											(item, valueIndex) => (
												<span
													key={item.id}
													className="flex max-w-full items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs"
												>
													<span className="wrap-anywhere min-w-0">
														{item.valueType ===
														"null"
															? "(null)"
															: item.value === ""
																? "(empty text)"
																: item.value}
													</span>
													{!readOnly && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="size-6 shrink-0"
															aria-label={`Remove value ${valueIndex + 1} from filter ${index + 1}`}
															onClick={() =>
																updateRule(
																	draft.id,
																	{
																		values: draft.values?.filter(
																			(
																				value,
																			) =>
																				value.id !==
																				item.id,
																		),
																	},
																)
															}
														>
															<X
																className="size-3"
																aria-hidden="true"
															/>
														</Button>
													)}
												</span>
											),
										)}
										<Input
											id={`${id}-${draft.id}-value`}
											className="h-8 min-w-24 flex-1 basis-24 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
											value={draft.value}
											inputMode={
												inferPurgeDraftInput(
													draft.value,
													undefined,
													draft.valueType,
												).valueType === "number"
													? "decimal"
													: "text"
											}
											onChange={(event) =>
												updateRule(
													draft.id,
													inferPurgeDraftInput(
														event.target.value,
														undefined,
														draft.valueType,
													),
												)
											}
											onKeyDown={(event) => {
												if (
													readOnly ||
													event.nativeEvent
														.isComposing ||
													draft.values === undefined
												)
													return;
												if (event.key === "Enter") {
													event.preventDefault();
													event.stopPropagation();
													if (
														draft.valueType ===
															"null" ||
														draft.value.trim() !==
															""
													)
														addValue(
															draft,
															draft.valueType ===
																"null"
																? {
																		valueType:
																			"null",
																		value: "",
																	}
																: inferPurgeDraftInput(
																		draft.value,
																		undefined,
																		draft.valueType,
																	),
														);
												} else if (
													event.key === "Backspace" &&
													draft.value === "" &&
													draft.values.length > 0
												) {
													event.preventDefault();
													updateRule(draft.id, {
														values: draft.values.slice(
															0,
															-1,
														),
													});
												}
											}}
											readOnly={
												readOnly ||
												draft.valueType === "null" ||
												(draft.values?.length ?? 0) >=
													100
											}
											placeholder={
												draft.valueType === "null" &&
												draft.values === undefined
													? "(null)"
													: draft.values === undefined
														? "Value"
														: "Add a value"
											}
											aria-invalid={Boolean(builderError)}
											aria-describedby={
												[
													draft.values !== undefined
														? `${id}-${draft.id}-hint`
														: null,
													builderError
														? `${id}-builder-error`
														: null,
												]
													.filter(Boolean)
													.join(" ") || undefined
											}
										/>
									</div>
									{draft.values !== undefined && (
										<FieldDescription
											id={`${id}-${draft.id}-hint`}
										>
											Press Enter to add a value.
										</FieldDescription>
									)}
								</Field>
							</FieldSet>
						);
					})}
					{columns.length > 0 && (
						<datalist id={`${id}-columns`}>
							{columns.map((column) => (
								<option key={column.name} value={column.name}>
									{column.type}
								</option>
							))}
						</datalist>
					)}
					{builderError && (
						<FieldError id={`${id}-builder-error`}>
							{builderError}
						</FieldError>
					)}
					{!readOnly && (
						<Button
							type="button"
							variant="outline"
							className="self-start"
							disabled={drafts.length >= 100}
							onClick={() =>
								updateDrafts([
									...drafts,
									{
										id: crypto.randomUUID(),
										column: "",
										operator: "==",
										valueType: "string",
										value: "",
									},
								])
							}
						>
							<Plus className="size-4" aria-hidden="true" />
							Add filter
						</Button>
					)}
				</>
			)}
		</FieldSet>
	);
}
