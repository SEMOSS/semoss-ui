import { AlertCircle, Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Input,
	Label,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Textarea,
} from "@semoss/ui/next";
import {
	slugifyIdentifier,
	TYPE_OPTIONS,
	uniqueName,
	validateIdentifier,
} from "./mcp-json-utils";
import { MCPMetadataEditor } from "./mcp-metadata-editor";
import { MCPParameterCard } from "./mcp-parameter-card";
import type { EditorTool, MCPTool, MCPToolProperty } from "./types";

export interface MCPToolDetailProps {
	entry: EditorTool;

	/** Names of the other tools in the file, used to reject duplicate renames */
	otherToolNames: string[];

	readOnly?: boolean;

	onUpdateTool: (id: string, changes: Partial<MCPTool>) => void;
	onUpdateProperty: (
		id: string,
		propKey: string,
		changes: Partial<MCPToolProperty>,
	) => void;
	onAddProperty: (id: string, propKey: string, type: string) => void;
	onDeleteProperty: (id: string, propKey: string) => void;
	onRenameProperty: (id: string, oldKey: string, newKey: string) => void;
	onToggleRequired: (id: string, propKey: string, required: boolean) => void;
	onChangePropertyType: (id: string, propKey: string, type: string) => void;
	onDuplicate: (id: string) => void;
	onDelete: (id: string) => void;
	onRestore: (id: string) => void;
}

/**
 * Everything about the selected tool on one scrollable surface: identity,
 * description, every parameter expanded, and the metadata that controls how
 * the tool behaves in chat.
 */
export const MCPToolDetail = ({
	entry,
	otherToolNames,
	readOnly = false,
	onUpdateTool,
	onUpdateProperty,
	onAddProperty,
	onDeleteProperty,
	onRenameProperty,
	onToggleRequired,
	onChangePropertyType,
	onDuplicate,
	onDelete,
	onRestore,
}: MCPToolDetailProps) => {
	const { id, tool, isDeleted } = entry;
	const disabled = readOnly || isDeleted;

	const nameId = useId();
	const titleId = useId();
	const descriptionId = useId();

	const [nameDraft, setNameDraft] = useState(tool.name);
	const [nameError, setNameError] = useState<string | undefined>();
	const [newParamKey, setNewParamKey] = useState("");
	const [newParamType, setNewParamType] = useState("string");
	const [newParamError, setNewParamError] = useState<string | undefined>();

	useEffect(() => {
		setNameDraft(tool.name);
		setNameError(undefined);
	}, [tool.name]);

	const propertyEntries = useMemo(
		() => Object.entries(tool.inputSchema.properties),
		[tool.inputSchema.properties],
	);
	const propertyKeys = useMemo(
		() => propertyEntries.map(([key]) => key),
		[propertyEntries],
	);
	const requiredCount = tool.inputSchema.required.length;

	const commitName = useCallback(() => {
		// Coerced rather than rejected: a name with spaces would be refused by
		// the model provider, and "Get bank statement" clearly means
		// "Get_bank_statement".
		const slug = slugifyIdentifier(nameDraft);
		setNameDraft(slug);

		if (slug === tool.name) {
			setNameError(undefined);
			return;
		}

		const error = validateIdentifier(
			slug,
			new Set(otherToolNames),
			"Tool name",
		);
		if (error) {
			setNameError(error);
			return;
		}

		setNameError(undefined);
		onUpdateTool(id, {
			name: slug,
			inputSchema: {
				...tool.inputSchema,
				title: `${slug}_Arguments`,
			},
		});
	}, [
		nameDraft,
		tool.name,
		tool.inputSchema,
		otherToolNames,
		id,
		onUpdateTool,
	]);

	const handleAddParameter = useCallback(() => {
		const slug =
			slugifyIdentifier(newParamKey) ||
			uniqueName("new_param", new Set(propertyKeys));
		const error = validateIdentifier(
			slug,
			new Set(propertyKeys),
			"Parameter name",
		);
		if (error) {
			setNewParamKey(slug);
			setNewParamError(error);
			return;
		}

		setNewParamError(undefined);
		setNewParamKey("");
		onAddProperty(id, slug, newParamType);
	}, [newParamKey, newParamType, propertyKeys, id, onAddProperty]);

	return (
		<ScrollArea className="h-full min-h-0">
			<div className="flex flex-col gap-5 p-4">
				{isDeleted && (
					<div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
						<span className="flex items-center gap-2 text-destructive text-sm">
							<AlertCircle size={16} />
							This tool will be removed from the file when you
							save.
						</span>
						{!readOnly && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => onRestore(id)}
								className="flex items-center gap-1.5"
							>
								<RotateCcw size={14} />
								Restore
							</Button>
						)}
					</div>
				)}

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex min-w-0 flex-col gap-0.5">
						<h3 className="truncate font-semibold text-foreground text-lg">
							{tool.title || tool.name || "Untitled tool"}
						</h3>
						<div className="flex flex-wrap items-center gap-1.5">
							<Badge variant="outline" className="text-xs">
								{propertyEntries.length}{" "}
								{propertyEntries.length === 1
									? "parameter"
									: "parameters"}
							</Badge>
							{requiredCount > 0 && (
								<Badge variant="outline" className="text-xs">
									{requiredCount} required
								</Badge>
							)}
							{tool._type && (
								<Badge variant="outline" className="text-xs">
									{tool._type}
								</Badge>
							)}
						</div>
					</div>

					{!readOnly && (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onDuplicate(id)}
								className="flex items-center gap-1.5"
							>
								<Copy size={14} />
								Duplicate
							</Button>
							{!isDeleted && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => onDelete(id)}
									className="flex items-center gap-1.5 text-destructive hover:text-destructive"
								>
									<Trash2 size={14} />
									Delete
								</Button>
							)}
						</div>
					)}
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<div className="flex flex-col gap-1">
						<Label
							htmlFor={nameId}
							className="text-muted-foreground text-xs"
						>
							Tool name
						</Label>
						<Input
							id={nameId}
							value={nameDraft}
							onChange={(e) => setNameDraft(e.target.value)}
							onBlur={commitName}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									commitName();
								}
								if (e.key === "Escape") {
									setNameDraft(tool.name);
									setNameError(undefined);
								}
							}}
							disabled={disabled}
							placeholder="my_tool"
							className={`font-mono text-foreground text-sm ${
								nameError ? "border-destructive" : ""
							}`}
						/>
						{nameError ? (
							<span className="flex items-center gap-1 text-destructive text-xs">
								<AlertCircle
									size={12}
									className="flex-shrink-0"
								/>
								{nameError}
							</span>
						) : (
							<span className="text-muted-foreground text-xs">
								The identifier the agent calls.
							</span>
						)}
					</div>

					<div className="flex flex-col gap-1">
						<Label
							htmlFor={titleId}
							className="text-muted-foreground text-xs"
						>
							Display title
						</Label>
						<Input
							id={titleId}
							value={tool.title ?? ""}
							onChange={(e) =>
								onUpdateTool(id, { title: e.target.value })
							}
							disabled={disabled}
							placeholder="My Tool"
							className="text-foreground text-sm"
						/>
						<span className="text-muted-foreground text-xs">
							Shown to people in chat.
						</span>
					</div>
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
						value={tool.description ?? ""}
						onChange={(e) =>
							onUpdateTool(id, { description: e.target.value })
						}
						disabled={disabled}
						rows={3}
						placeholder="Describe what this tool does and when the agent should reach for it..."
						className="resize-y text-foreground text-sm"
					/>
				</div>

				<Separator />

				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<Label className="font-semibold text-foreground text-sm">
							Parameters
						</Label>
						<span className="text-muted-foreground text-xs">
							{propertyEntries.length === 0
								? "None"
								: `${propertyEntries.length} total, ${requiredCount} required`}
						</span>
					</div>

					{!readOnly && !isDeleted && (
						<div className="flex flex-col gap-1">
							<div className="flex flex-wrap items-center gap-2">
								<Input
									value={newParamKey}
									onChange={(e) =>
										setNewParamKey(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddParameter();
										}
									}}
									placeholder="new_parameter"
									aria-label="New parameter name"
									className={`h-9 max-w-[16rem] flex-1 font-mono text-foreground text-sm ${
										newParamError
											? "border-destructive"
											: ""
									}`}
								/>
								<Select
									value={newParamType}
									onValueChange={setNewParamType}
								>
									<SelectTrigger
										size="sm"
										className="h-9 w-[120px]"
									>
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
								<Button
									variant="outline"
									size="sm"
									onClick={handleAddParameter}
									className="flex items-center gap-1.5"
								>
									<Plus size={14} />
									Add parameter
								</Button>
							</div>
							{newParamError && (
								<span className="flex items-center gap-1 text-destructive text-xs">
									<AlertCircle
										size={12}
										className="flex-shrink-0"
									/>
									{newParamError}
								</span>
							)}
						</div>
					)}

					{propertyEntries.length === 0 ? (
						<div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
							This tool takes no parameters.
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{propertyEntries.map(([propKey, property]) => (
								<MCPParameterCard
									key={propKey}
									propKey={propKey}
									property={property}
									isRequired={tool.inputSchema.required.includes(
										propKey,
									)}
									siblingKeys={propertyKeys}
									readOnly={disabled}
									onRename={(oldKey, newKey) =>
										onRenameProperty(id, oldKey, newKey)
									}
									onDelete={(key) =>
										onDeleteProperty(id, key)
									}
									onUpdate={(key, changes) =>
										onUpdateProperty(id, key, changes)
									}
									onTypeChange={(key, type) =>
										onChangePropertyType(id, key, type)
									}
									onRequiredToggle={(key, required) =>
										onToggleRequired(id, key, required)
									}
								/>
							))}
						</div>
					)}
				</div>

				<Separator />

				<MCPMetadataEditor
					meta={tool._meta}
					disabled={disabled}
					onChange={(next) => onUpdateTool(id, { _meta: next })}
				/>
			</div>
		</ScrollArea>
	);
};
