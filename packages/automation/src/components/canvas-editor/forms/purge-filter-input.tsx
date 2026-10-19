import { Plus, Trash2 } from "lucide-react";
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
	useTheme,
} from "@semoss/ui/next";
import { formatJson } from "@semoss/utility/json";
import {
	inferPurgeDraftInput,
	PURGE_COMPARATORS,
	type PurgeFilterDraft,
	parsePurgeFilters,
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
}

/** Edits scalar Purge rules through a typed builder or equivalent JSON. */
export function PurgeFilterInput({
	value,
	onChange,
	readOnly = false,
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

	return (
		<FieldSet className="min-w-0 gap-3">
			<FieldLegend variant="label" className="mb-0">
				Rows to remove
			</FieldLegend>
			<FieldDescription>
				Every condition must match for a row to be removed. Values may
				be text, numbers, booleans, or Automation variables.
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
					{drafts.map((draft, index) => (
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
														rule.id !== draft.id,
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
									Column
								</FieldLabel>
								<Input
									id={`${id}-${draft.id}-column`}
									value={draft.column}
									required
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
										if (comparator) {
											updateRule(draft.id, {
												operator: comparator.value,
											});
										}
									}}
								>
									<SelectTrigger
										id={`${id}-${draft.id}-operator`}
										className="w-full"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PURGE_COMPARATORS.map((comparator) => (
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
							<Field>
								<FieldLabel htmlFor={`${id}-${draft.id}-type`}>
									Value type
								</FieldLabel>
								<Select
									value={draft.valueType}
									disabled={readOnly}
									onValueChange={(valueType) => {
										if (
											valueType === "string" ||
											valueType === "number" ||
											valueType === "boolean"
										) {
											updateRule(draft.id, {
												valueType,
												value:
													valueType === "boolean"
														? "false"
														: draft.value,
											});
										}
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
									</SelectContent>
								</Select>
							</Field>
							<Field>
								<FieldLabel htmlFor={`${id}-${draft.id}-value`}>
									Value
								</FieldLabel>
								{draft.valueType === "boolean" ? (
									<Select
										value={draft.value}
										disabled={readOnly}
										onValueChange={(next) =>
											updateRule(draft.id, {
												value: next,
											})
										}
									>
										<SelectTrigger
											id={`${id}-${draft.id}-value`}
											className="w-full"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">
												True
											</SelectItem>
											<SelectItem value="false">
												False
											</SelectItem>
										</SelectContent>
									</Select>
								) : (
									<Input
										id={`${id}-${draft.id}-value`}
										value={draft.value}
										inputMode={
											draft.valueType === "number"
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
										readOnly={readOnly}
										placeholder="Value or ${variable}"
										aria-invalid={Boolean(builderError)}
										aria-describedby={
											builderError
												? `${id}-builder-error`
												: undefined
										}
									/>
								)}
							</Field>
						</FieldSet>
					))}
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
