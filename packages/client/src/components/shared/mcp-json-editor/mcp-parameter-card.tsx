import { AlertCircle, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { MCPJsonField } from "./mcp-json-field";
import {
	ENUM_TYPE_VALUE,
	formatEnumValue,
	isJsonType,
	NO_DEFAULT_VALUE,
	slugifyIdentifier,
	TYPE_OPTIONS,
	validateIdentifier,
} from "./mcp-json-utils";
import type { MCPToolProperty } from "./types";

export interface MCPParameterCardProps {
	/** Current key of this parameter inside `inputSchema.properties` */
	propKey: string;

	property: MCPToolProperty;

	isRequired: boolean;

	/** Sibling parameter keys, used to reject a duplicate rename */
	siblingKeys: string[];

	readOnly?: boolean;

	onRename: (oldKey: string, newKey: string) => void;
	onDelete: (propKey: string) => void;
	onUpdate: (propKey: string, changes: Partial<MCPToolProperty>) => void;
	onTypeChange: (propKey: string, newType: string) => void;
	onRequiredToggle: (propKey: string, isRequired: boolean) => void;
}

/**
 * One parameter of a tool. Unlike the previous editor, the parameter key itself
 * is editable and the parameter can be removed outright.
 */
export const MCPParameterCard = ({
	propKey,
	property,
	isRequired,
	siblingKeys,
	readOnly = false,
	onRename,
	onDelete,
	onUpdate,
	onTypeChange,
	onRequiredToggle,
}: MCPParameterCardProps) => {
	const requiredId = useId();
	const titleId = useId();
	const descriptionId = useId();
	const defaultId = useId();

	const [keyDraft, setKeyDraft] = useState(propKey);
	const [keyError, setKeyError] = useState<string | undefined>();
	const [enumDraft, setEnumDraft] = useState("");
	const [jsonDraft, setJsonDraft] = useState(() =>
		serializeDefault(property.default),
	);
	const [jsonError, setJsonError] = useState<string | undefined>();

	// A rename performed elsewhere (or a switch to a different tool) has to win
	// over whatever half-typed key is sitting in the input.
	useEffect(() => {
		setKeyDraft(propKey);
		setKeyError(undefined);
	}, [propKey]);

	// Switching the type rewrites `default`, so the raw-JSON draft has to be
	// re-seeded. While the type is unchanged the draft stays authoritative so
	// half-typed JSON is not clobbered on every keystroke.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on type only
	useEffect(() => {
		setJsonDraft(serializeDefault(property.default));
		setJsonError(undefined);
	}, [property.type]);

	const isEnumType = Array.isArray(property.enum);
	const enumOptions = isEnumType ? (property.enum ?? []) : [];
	const displayedType = isEnumType ? ENUM_TYPE_VALUE : property.type;
	const jsonType = isJsonType(property.type);
	const hasDefault = property.default !== undefined;

	// An index of -1 (default set but no longer in the allowed values) reads as
	// "no default" rather than silently snapping to the first option.
	const enumIndex = enumOptions.indexOf(
		property.default as string | number | boolean | null,
	);
	const enumSelectValue =
		hasDefault && enumIndex >= 0 ? String(enumIndex) : NO_DEFAULT_VALUE;
	const booleanSelectValue = hasDefault
		? String(Boolean(property.default))
		: NO_DEFAULT_VALUE;

	const commitKey = useCallback(() => {
		// Parameter keys become argument names on the backing function, so a
		// space is coerced away rather than reported as an error.
		const slug = slugifyIdentifier(keyDraft);
		setKeyDraft(slug);

		if (slug === propKey) {
			setKeyError(undefined);
			return;
		}

		const taken = new Set(siblingKeys.filter((key) => key !== propKey));
		const error = validateIdentifier(slug, taken, "Parameter name");
		if (error) {
			setKeyError(error);
			return;
		}

		setKeyError(undefined);
		onRename(propKey, slug);
	}, [keyDraft, propKey, siblingKeys, onRename]);

	const handleJsonChange = useCallback(
		(text: string) => {
			setJsonDraft(text);

			if (!text.trim()) {
				setJsonError(undefined);
				onUpdate(propKey, { default: undefined });
				return;
			}

			try {
				const parsed = JSON.parse(text) as unknown;
				setJsonError(undefined);
				onUpdate(propKey, { default: parsed });
			} catch (e) {
				setJsonError(e instanceof Error ? e.message : "Invalid JSON");
			}
		},
		[propKey, onUpdate],
	);

	/**
	 * Clearing the input removes `default` from the schema rather than storing
	 * an empty string or a zero, so "no default" is expressible for every type.
	 */
	const handleTextDefaultChange = useCallback(
		(raw: string) => {
			if (raw === "") {
				onUpdate(propKey, { default: undefined });
				return;
			}

			if (property.type === "number") {
				const parsed = Number(raw);
				onUpdate(propKey, {
					default: Number.isNaN(parsed) ? undefined : parsed,
				});
				return;
			}

			onUpdate(propKey, { default: raw });
		},
		[property.type, propKey, onUpdate],
	);

	const handleSelectDefaultChange = useCallback(
		(raw: string, resolve: (value: string) => unknown) => {
			onUpdate(propKey, {
				default: raw === NO_DEFAULT_VALUE ? undefined : resolve(raw),
			});
		},
		[propKey, onUpdate],
	);

	const handleAddEnum = useCallback(() => {
		const trimmed = enumDraft.trim();
		if (!trimmed) return;
		if (enumOptions.some((option) => String(option) === trimmed)) {
			setEnumDraft("");
			return;
		}

		// Adding an allowed value no longer forces it to become the default;
		// having none is a valid state the user may have chosen deliberately.
		onUpdate(propKey, { enum: [...enumOptions, trimmed] });
		setEnumDraft("");
	}, [enumDraft, enumOptions, propKey, onUpdate]);

	const handleDeleteEnum = useCallback(
		(index: number) => {
			const removed = enumOptions[index];
			const nextEnum = enumOptions.filter((_, i) => i !== index);
			onUpdate(propKey, {
				enum: nextEnum,
				// Removing the value that was the default leaves none, rather
				// than promoting an unrelated value in its place.
				...(property.default === removed ? { default: undefined } : {}),
			});
		},
		[enumOptions, property.default, propKey, onUpdate],
	);

	return (
		<div className="rounded-lg border bg-card">
			<div className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-3 py-2">
				<div className="flex min-w-[10rem] flex-1 flex-col gap-1">
					<Input
						value={keyDraft}
						onChange={(e) => setKeyDraft(e.target.value)}
						onBlur={commitKey}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								commitKey();
							}
							if (e.key === "Escape") {
								setKeyDraft(propKey);
								setKeyError(undefined);
							}
						}}
						disabled={readOnly}
						aria-label="Parameter name"
						className={`h-8 font-mono font-semibold text-foreground text-sm ${
							keyError ? "border-destructive" : ""
						}`}
					/>
					{keyError && (
						<span className="flex items-center gap-1 text-destructive text-xs">
							<AlertCircle size={12} className="flex-shrink-0" />
							{keyError}
						</span>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<Label className="text-muted-foreground text-xs">
						Type
					</Label>
					<Select
						value={displayedType}
						onValueChange={(value) => onTypeChange(propKey, value)}
						disabled={readOnly}
					>
						<SelectTrigger size="sm" className="h-8 w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TYPE_OPTIONS.map((option) => (
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

				<div className="flex items-center gap-2">
					<Label
						htmlFor={requiredId}
						className="text-muted-foreground text-xs"
					>
						Required
					</Label>
					<Switch
						id={requiredId}
						checked={isRequired}
						onCheckedChange={(checked) =>
							onRequiredToggle(propKey, checked)
						}
						disabled={readOnly}
						size="sm"
					/>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={() => onDelete(propKey)}
							disabled={readOnly}
							aria-label={`Remove parameter ${propKey}`}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 size={14} />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Remove parameter</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex flex-col gap-3 p-3">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="flex flex-col gap-1">
						<Label
							htmlFor={titleId}
							className="text-muted-foreground text-xs"
						>
							Title
						</Label>
						<Input
							id={titleId}
							value={property.title ?? ""}
							onChange={(e) =>
								onUpdate(propKey, { title: e.target.value })
							}
							disabled={readOnly}
							placeholder="Human-readable label"
							className="text-foreground text-sm"
						/>
					</div>

					{!jsonType && (
						<div className="flex flex-col gap-1">
							<Label
								htmlFor={defaultId}
								className="text-muted-foreground text-xs"
							>
								Default value{" "}
								<span className="font-normal">(optional)</span>
							</Label>
							{isEnumType ? (
								enumOptions.length > 0 ? (
									<Select
										value={enumSelectValue}
										onValueChange={(value) =>
											handleSelectDefaultChange(
												value,
												(raw) =>
													enumOptions[Number(raw)],
											)
										}
										disabled={readOnly}
									>
										<SelectTrigger
											id={defaultId}
											size="sm"
											className="h-9"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem
												value={NO_DEFAULT_VALUE}
											>
												<span className="text-muted-foreground text-xs">
													No default value
												</span>
											</SelectItem>
											{enumOptions.map(
												(option, index) => (
													<SelectItem
														key={`${String(option)}-${index}`}
														value={String(index)}
													>
														<span className="font-mono text-xs">
															{formatEnumValue(
																option,
															)}
														</span>
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								) : (
									<p className="pt-2 text-muted-foreground text-xs">
										Add at least one allowed value below.
									</p>
								)
							) : property.type === "boolean" ? (
								<Select
									value={booleanSelectValue}
									onValueChange={(value) =>
										handleSelectDefaultChange(
											value,
											(raw) => raw === "true",
										)
									}
									disabled={readOnly}
								>
									<SelectTrigger
										id={defaultId}
										size="sm"
										className="h-9"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={NO_DEFAULT_VALUE}>
											<span className="text-muted-foreground text-xs">
												No default value
											</span>
										</SelectItem>
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
									id={defaultId}
									type={
										property.type === "number"
											? "number"
											: "text"
									}
									value={String(property.default ?? "")}
									onChange={(e) =>
										handleTextDefaultChange(e.target.value)
									}
									disabled={readOnly}
									placeholder="No default value"
									className="text-foreground text-sm"
								/>
							)}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<Label
						htmlFor={descriptionId}
						className="text-muted-foreground text-xs"
					>
						Description
					</Label>
					<Textarea
						id={descriptionId}
						value={property.description ?? ""}
						onChange={(e) =>
							onUpdate(propKey, { description: e.target.value })
						}
						disabled={readOnly}
						rows={2}
						placeholder="What this parameter controls. The agent reads this to decide what to pass."
						className="resize-y text-foreground text-sm"
					/>
				</div>

				{isEnumType && (
					<div className="flex flex-col gap-2">
						<Label className="text-muted-foreground text-xs">
							Allowed values ({enumOptions.length})
						</Label>
						{enumOptions.length > 0 && (
							<div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
								{enumOptions.map((option, index) => (
									<span
										key={`${String(option)}-${index}`}
										className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-foreground text-xs"
										title={formatEnumValue(option)}
									>
										<span className="truncate">
											{formatEnumValue(option)}
										</span>
										<button
											type="button"
											onClick={() =>
												handleDeleteEnum(index)
											}
											disabled={readOnly}
											aria-label={`Remove ${String(option)}`}
											className="rounded text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
										>
											<X size={12} />
										</button>
									</span>
								))}
							</div>
						)}
						<div className="flex items-center gap-2">
							<Input
								value={enumDraft}
								onChange={(e) => setEnumDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddEnum();
									}
								}}
								disabled={readOnly}
								placeholder="Type a value and press Enter to add..."
								className="text-foreground text-sm"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddEnum}
								disabled={readOnly || !enumDraft.trim()}
							>
								Add
							</Button>
						</div>
					</div>
				)}

				{jsonType && (
					<MCPJsonField
						label="Default value"
						value={jsonDraft}
						error={jsonError}
						disabled={readOnly}
						emptyValue={property.type === "array" ? "[]" : "{}"}
						placeholder={
							property.type === "array"
								? '["item1", "item2"]'
								: '{"key": "value"}'
						}
						onChange={handleJsonChange}
					/>
				)}
			</div>
		</div>
	);
};

const serializeDefault = (value: unknown): string => {
	if (value === undefined) return "";
	try {
		return JSON.stringify(value, null, 2) ?? "";
	} catch {
		return "";
	}
};
