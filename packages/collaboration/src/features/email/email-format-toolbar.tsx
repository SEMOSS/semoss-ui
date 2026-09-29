import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
	$deleteTableColumnAtSelection,
	$deleteTableRowAtSelection,
	$getTableCellNodeFromLexicalNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$insertTableColumnAtSelection,
	$insertTableRowAtSelection,
	$isTableSelection,
	INSERT_TABLE_COMMAND,
} from "@lexical/table";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Baseline,
	Bold,
	ChevronDown,
	Columns3,
	Italic,
	Link,
	List,
	ListOrdered,
	Redo2,
	Rows3,
	SlidersHorizontal,
	Table2,
	TableProperties,
	Trash2,
	Underline,
	Undo2,
} from "lucide-react";
import { type ReactElement, useId, useRef, useState } from "react";
import {
	Button,
	ButtonGroup,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { emailLink } from "./email-html";
import { useEmailFormatting } from "./use-email-formatting";

const iconClass = "size-11 p-0 sm:size-8 pointer-coarse:size-11";
const groupClass = "border-l border-border pl-2";
const textFormats = [
	{ value: "bold", label: "Bold", icon: Bold },
	{ value: "italic", label: "Italic", icon: Italic },
	{ value: "underline", label: "Underline", icon: Underline },
] as const;
const alignments = [
	{ value: "left", label: "Align left", icon: AlignLeft },
	{ value: "center", label: "Align center", icon: AlignCenter },
	{ value: "right", label: "Align right", icon: AlignRight },
	{ value: "justify", label: "Justify", icon: AlignJustify },
] as const;
const blockStyles = [
	{ value: "paragraph", label: "Paragraph" },
	{ value: "h1", label: "Heading 1" },
	{ value: "h2", label: "Heading 2" },
	{ value: "h3", label: "Heading 3" },
	{ value: "quote", label: "Quote" },
];

/** Compose tooltips around the actual control, including popover/menu triggers. */
function tooltip(label: string, control: ReactElement): ReactElement {
	return (
		<Tooltip key={label} disableHoverableContent={false}>
			<TooltipTrigger asChild>{control}</TooltipTrigger>
			<TooltipContent side="top" sideOffset={4}>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

/** Compact formatting groups shared by the inline email composer and draft dialog. */
export function EmailFormatToolbar({
	disabled = false,
}: {
	disabled?: boolean;
}) {
	const { editor, formats, canUndo, canRedo, apply, style } =
		useEmailFormatting(disabled);
	const [isExpanded, setIsExpanded] = useState(false);
	const [link, setLink] = useState("");
	const [isLinkOpen, setIsLinkOpen] = useState(false);
	const [color, setColor] = useState("#000000");
	const [isColorOpen, setIsColorOpen] = useState(false);
	const shouldFocusEditor = useRef(false);
	const id = useId();
	const handleCloseAutoFocus = (event: Event): void => {
		if (shouldFocusEditor.current) {
			event.preventDefault();
			shouldFocusEditor.current = false;
			editor.focus();
		}
	};
	return (
		<fieldset
			disabled={disabled}
			className="m-0 min-w-0 space-y-2 rounded-t-lg border-0 border-border border-b bg-muted/30 p-2"
		>
			<legend className="sr-only">Email formatting</legend>
			<div className="flex min-w-0 flex-wrap items-center gap-2">
				<ButtonGroup aria-label="History">
					{tooltip(
						"Undo",
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className={iconClass}
							aria-label="Undo"
							disabled={disabled || !canUndo}
							onClick={() =>
								editor.dispatchCommand(UNDO_COMMAND, undefined)
							}
						>
							<Undo2 aria-hidden="true" />
						</Button>,
					)}
					{tooltip(
						"Redo",
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className={iconClass}
							aria-label="Redo"
							disabled={disabled || !canRedo}
							onClick={() =>
								editor.dispatchCommand(REDO_COMMAND, undefined)
							}
						>
							<Redo2 aria-hidden="true" />
						</Button>,
					)}
				</ButtonGroup>
				<div className="flex items-center border-border border-l pl-2">
					<ToggleGroup
						type="multiple"
						size="sm"
						disabled={disabled}
						aria-label="Text formatting"
						value={textFormats
							.filter(({ value }) => formats[value])
							.map(({ value }) => value)}
					>
						{textFormats.map(({ value, label, icon: Icon }) =>
							tooltip(
								label,
								<ToggleGroupItem
									value={value}
									aria-label={label}
									className={iconClass}
									onMouseDown={(event) =>
										event.preventDefault()
									}
									onClick={() =>
										apply(() =>
											editor.dispatchCommand(
												FORMAT_TEXT_COMMAND,
												value,
											),
										)
									}
								>
									<Icon aria-hidden="true" />
								</ToggleGroupItem>,
							),
						)}
					</ToggleGroup>
				</div>
				<ToggleGroup
					type="single"
					size="sm"
					disabled={disabled}
					aria-label="Lists"
					value={formats.list}
					className={groupClass}
				>
					{(
						[
							{
								value: "bullet",
								label: "Bullets",
								icon: List,
								command: INSERT_UNORDERED_LIST_COMMAND,
							},
							{
								value: "number",
								label: "Numbered list",
								icon: ListOrdered,
								command: INSERT_ORDERED_LIST_COMMAND,
							},
						] as const
					).map(({ value, label, icon: Icon, command }) =>
						tooltip(
							label,
							<ToggleGroupItem
								value={value}
								aria-label={label}
								className={iconClass}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() =>
									apply(() =>
										editor.dispatchCommand(
											formats.list === value
												? REMOVE_LIST_COMMAND
												: command,
											undefined,
										),
									)
								}
							>
								<Icon aria-hidden="true" />
							</ToggleGroupItem>,
						),
					)}
				</ToggleGroup>
				<ButtonGroup aria-label="Insert link" className={groupClass}>
					<Popover
						open={isLinkOpen}
						onOpenChange={(open) => {
							if (open) {
								shouldFocusEditor.current = false;
								setLink(formats.link);
							}
							setIsLinkOpen(open);
						}}
					>
						{tooltip(
							"Link",
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className={iconClass}
									aria-label="Link"
									disabled={disabled}
								>
									<Link aria-hidden="true" />
								</Button>
							</PopoverTrigger>,
						)}
						<PopoverContent
							className="space-y-2"
							align="start"
							onCloseAutoFocus={handleCloseAutoFocus}
						>
							<Label htmlFor={`${id}-link`}>Link address</Label>
							<Input
								id={`${id}-link`}
								value={link}
								disabled={disabled}
								onChange={(event) =>
									setLink(event.target.value)
								}
								placeholder="https://example.com"
							/>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									size="sm"
									disabled={disabled || !emailLink(link)}
									onClick={() => {
										shouldFocusEditor.current = true;
										apply(() =>
											editor.dispatchCommand(
												TOGGLE_LINK_COMMAND,
												emailLink(link) ?? null,
											),
										);
										setIsLinkOpen(false);
									}}
								>
									Apply link
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={disabled || !formats.link}
									onClick={() => {
										shouldFocusEditor.current = true;
										apply(() =>
											editor.dispatchCommand(
												TOGGLE_LINK_COMMAND,
												null,
											),
										);
										setIsLinkOpen(false);
									}}
								>
									Remove link
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				</ButtonGroup>
				{formats.table && (
					<DropdownMenu
						onOpenChange={(open) => {
							if (open) shouldFocusEditor.current = false;
						}}
					>
						{tooltip(
							"Table options",
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className={iconClass}
									aria-label="Table options"
									disabled={disabled}
								>
									<TableProperties aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>,
						)}
						<DropdownMenuContent
							align="end"
							onCloseAutoFocus={handleCloseAutoFocus}
						>
							{[
								{
									label: "Add row",
									icon: Rows3,
									action: () => {
										$insertTableRowAtSelection();
									},
								},
								{
									label: "Add column",
									icon: Columns3,
									action: () => {
										$insertTableColumnAtSelection();
									},
								},
								{
									label: "Delete row",
									icon: Rows3,
									action: $deleteTableRowAtSelection,
								},
								{
									label: "Delete column",
									icon: Columns3,
									action: $deleteTableColumnAtSelection,
								},
							].map(({ label, icon: Icon, action }) => (
								<DropdownMenuItem
									key={label}
									disabled={disabled}
									onSelect={() => {
										shouldFocusEditor.current = true;
										apply(action);
									}}
								>
									<Icon aria-hidden="true" />
									{label}
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								disabled={disabled}
								variant="destructive"
								onSelect={() => {
									shouldFocusEditor.current = true;
									apply(() => {
										const selection = $getSelection();
										if (
											$isRangeSelection(selection) ||
											$isTableSelection(selection)
										) {
											const cell =
												$getTableCellNodeFromLexicalNode(
													selection.anchor.getNode(),
												);
											if (cell) {
												const table =
													$getTableNodeFromLexicalNodeOrThrow(
														cell,
													);
												table.selectPrevious();
												table.remove();
											}
										}
									});
								}}
							>
								<Trash2 aria-hidden="true" />
								Delete table
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				<Button
					type="button"
					variant="ghost"
					className="min-h-9 pointer-coarse:min-h-11 gap-2 px-2 text-muted-foreground"
					disabled={disabled}
					aria-expanded={isExpanded}
					aria-controls={`${id}-advanced`}
					onMouseDown={(event) => event.preventDefault()}
					onClick={() => setIsExpanded((current) => !current)}
				>
					<SlidersHorizontal className="size-4" aria-hidden="true" />
					More formatting
					<ChevronDown
						className={cn("size-4", isExpanded && "rotate-180")}
						aria-hidden="true"
					/>
				</Button>
			</div>
			<div
				id={`${id}-advanced`}
				hidden={!isExpanded}
				className={
					isExpanded
						? "flex min-w-0 flex-wrap items-center gap-2 border-border border-t pt-2"
						: "hidden"
				}
			>
				<ButtonGroup aria-label="Text style" className={groupClass}>
					<Select
						disabled={disabled}
						value={formats.block}
						onValueChange={(value) =>
							apply(() => {
								const selection = $getSelection();
								if ($isRangeSelection(selection))
									$setBlocksType(selection, () =>
										value === "h1" ||
										value === "h2" ||
										value === "h3"
											? $createHeadingNode(value)
											: value === "quote"
												? $createQuoteNode()
												: $createParagraphNode(),
									);
							})
						}
					>
						{tooltip(
							"Paragraph style",
							<SelectTrigger
								size="sm"
								className="min-h-11 pointer-coarse:min-h-11 w-32 bg-background sm:min-h-8"
								aria-label="Paragraph style"
							>
								<SelectValue />
							</SelectTrigger>,
						)}
						<SelectContent
							onCloseAutoFocus={(event) => {
								event.preventDefault();
								editor.focus();
							}}
						>
							{blockStyles.map(({ value, label }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						disabled={disabled}
						value={formats.size}
						onValueChange={(value) => style("font-size", value)}
					>
						{tooltip(
							"Font size",
							<SelectTrigger
								size="sm"
								className="min-h-11 pointer-coarse:min-h-11 w-20 bg-background sm:min-h-8"
								aria-label="Font size"
							>
								<SelectValue placeholder="Size">
									{formats.size || "Size"}
								</SelectValue>
							</SelectTrigger>,
						)}
						<SelectContent
							onCloseAutoFocus={(event) => {
								event.preventDefault();
								editor.focus();
							}}
						>
							{[12, 14, 16, 18, 24, 32].map((size) => (
								<SelectItem key={size} value={`${size}px`}>
									{size}px
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</ButtonGroup>
				<Popover
					open={isColorOpen}
					onOpenChange={(open) => {
						if (open) {
							shouldFocusEditor.current = false;
							// Let the native input validate the selected color and provide its fallback.
							const input = document.createElement("input");
							input.type = "color";
							input.value = formats.color;
							setColor(input.value);
						}
						setIsColorOpen(open);
					}}
				>
					{tooltip(
						"Font color",
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className={iconClass}
								aria-label="Font color"
								disabled={disabled}
							>
								<Baseline aria-hidden="true" />
							</Button>
						</PopoverTrigger>,
					)}
					<PopoverContent
						className="w-48 space-y-2"
						align="start"
						onCloseAutoFocus={handleCloseAutoFocus}
					>
						<Label htmlFor={`${id}-color`}>Font color</Label>
						<Input
							id={`${id}-color`}
							type="color"
							value={color}
							className="h-11 p-1"
							disabled={disabled}
							onChange={(event) => setColor(event.target.value)}
						/>
						<Button
							type="button"
							size="sm"
							disabled={disabled}
							onClick={() => {
								shouldFocusEditor.current = true;
								style("color", color);
								setIsColorOpen(false);
							}}
						>
							Apply color
						</Button>
					</PopoverContent>
				</Popover>
				<ToggleGroup
					type="single"
					size="sm"
					disabled={disabled}
					aria-label="Alignment"
					value={formats.alignment}
					className={groupClass}
				>
					{alignments.map(({ value, label, icon: Icon }) =>
						tooltip(
							label,
							<ToggleGroupItem
								value={value}
								aria-label={label}
								className={iconClass}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() =>
									apply(() =>
										editor.dispatchCommand(
											FORMAT_ELEMENT_COMMAND,
											value,
										),
									)
								}
							>
								<Icon aria-hidden="true" />
							</ToggleGroupItem>,
						),
					)}
				</ToggleGroup>
				<ButtonGroup aria-label="Insert table">
					{tooltip(
						"Insert table",
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className={iconClass}
							aria-label="Insert table"
							disabled={disabled}
							onClick={() =>
								apply(() =>
									editor.dispatchCommand(
										INSERT_TABLE_COMMAND,
										{
											rows: "3",
											columns: "3",
											includeHeaders: true,
										},
									),
								)
							}
						>
							<Table2 aria-hidden="true" />
						</Button>,
					)}
				</ButtonGroup>
			</div>
		</fieldset>
	);
}
