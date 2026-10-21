import { ExternalLink } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type Block,
	type BlockDef,
	type CellState,
	getValueByPath,
	INPUT_BLOCK_TYPES,
	type NotebookState,
	type Paths,
	type PathValue,
	useBlocks,
	type Variable,
	type VariableType,
} from "@semoss/renderer";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	Separator,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface QueryInputSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * Settings label
	 */
	label: string;
	/**
	 * Default path map by default {}
	 */
	defaultPathMap?: Record<string, Option>;
	/**
	 * Spell check for the input
	 */
	spellCheck?: boolean;
}

interface Option {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;
	/**
	 * node path
	 */
	path?: string;
	/**
	 * node value type
	 */
	type: string;
	/**
	 * option display
	 */
	display: string;

	/**
	 * type of block
	 */
	blockType: string;

	/**
	 * whether the option is variabilized
	 * @type {boolean}
	 * @default false
	 */
	variabilized: boolean;

	/**
	 * Group alias for grouping options
	 * @type {string}
	 * @default ""
	 */
	groupAlias: string;
}

// Group name mapper function
const groupAliasMapper = (type: string) => {
	switch (type) {
		case "query":
			return "Notebook";
		case "cell":
			return "Cell";
		case "cell-prop":
			return "Cell Properties";
		case "block":
			return "Block";
		case "query-prop":
			return "Notebook Properties";
		default:
			return "Others";
	}
};

// Priority map for sorting
const DISPLAY_PRIORITY_MAP: Record<string, number> = {
	block: 1,
	query: 2,
	cell: 3,
	"query-prop": 4,
	"cell-prop": 5,
};

const EMPTY_OPTIONS: Record<string, Option> = {};

/**
 * Specifically for selecting a query for to associate with a UI block
 */
export const QueryInputSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		defaultPathMap = EMPTY_OPTIONS,
		spellCheck,
	}: QueryInputSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();
		const inputId = useId();

		// track the value
		const [value, setValue] = useState("");
		// internal state of the input component
		const [inputValue, setInputValue] = useState("");
		// track the modal
		const [open, setOpen] = useState(false);
		// Track the input ref to grab the cursor position
		const inputRef = useRef<HTMLInputElement>(null);
		const suggestionRef = useRef<HTMLDivElement>(null);
		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, path);

				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
			setInputValue(computedValue);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
			// set the value
			setValue(value);
			setInputValue(value);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, value as PathValue<D["data"], typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		// MobX tracks nested changes inside this computed, including removed cells.
		const { optionMap, missingReferences } = useMemo(
			() =>
				computed(() => {
					const pathMap: Record<string, Option> = {};
					const variabilizedList: string[] = [];
					const missingReferences: string[] = [];

					// iterate over the variables
					Object.entries(state.variables).forEach(
						(keyValue: [string, Variable]) => {
							const alias = keyValue[0];
							const variable = keyValue[1];

							const query =
								variable.type === "query" ||
								variable.type === "cell"
									? state.getNotebook(variable.to)
									: undefined;
							if (
								(variable.type === "query" && !query) ||
								(variable.type === "cell" &&
									!query?.getCell(variable.cellId)) ||
								(variable.type === "block" &&
									!state.blocks[variable.to])
							) {
								missingReferences.push(alias);
								return;
							}
							const ref = state.getVariable(
								variable.to,
								variable.type,
								[alias],
								variable.cellId,
							);

							// check if the variable is variabilized
							if (
								variable.type === "block" &&
								!variabilizedList.includes(variable.to)
							)
								variabilizedList.push(variable.to);
							else if (
								variable.type === "cell" &&
								!variabilizedList.includes(variable.cellId)
							)
								variabilizedList.push(variable.cellId);
							else if (
								variable.type === "query" &&
								!variabilizedList.includes(variable.to)
							)
								variabilizedList.push(variable.to);

							pathMap[alias] = {
								id: alias,
								path: alias,
								type: typeof ref,
								display: alias,
								blockType: variable.type,
								variabilized: true,
								groupAlias: groupAliasMapper(variable.type),
							};

							if (variable.type === "query") {
								const q = state.getNotebook(variable.to);
								if (q) {
									for (const f in q._exposed) {
										pathMap[`${alias}.${f}`] = {
											id: `${alias}.${f}`,
											path: `${alias}.${f}`,
											type: typeof q[f], // TODO: get value
											display: `${alias}.${f}`,
											blockType: "query-prop",
											variabilized: true,
											groupAlias:
												groupAliasMapper("query-prop"),
										};
									}
								}
							}

							if (variable.type === "cell") {
								const q = state.getNotebook(variable.to);

								if (q) {
									const c = q.getCell(variable.cellId);
									if (!c) return;

									for (const f in c._exposed) {
										pathMap[`${alias}.${f}`] = {
											id: `${alias}.${f}`,
											path: `${alias}.${f}`,
											type: typeof c[f], // TODO: get value
											display: `${alias}.${f}`,
											blockType: "cell-prop",
											variabilized: true,
											groupAlias:
												groupAliasMapper("cell-prop"),
										};
									}
								}
							}
						},
					);

					// iterate over the blocks
					Object.entries(state.blocks).forEach(
						(keyValue: [string, Block]) => {
							const alias = keyValue[0];
							const block = keyValue[1];
							//filter only valid(variabilizable) blocks
							if (
								INPUT_BLOCK_TYPES.indexOf(block.widget) > -1 &&
								!variabilizedList.includes(alias)
							) {
								pathMap[alias] = {
									id: alias,
									path: alias,
									type: typeof block,
									display: alias,
									blockType: "block",
									variabilized: Object.keys(
										state.variables,
									).includes(alias),
									groupAlias: groupAliasMapper("block"),
								};
							}
						},
					);

					// iterate over the Queries
					Object.entries(state.notebooks).forEach(
						(keyValue: [string, NotebookState]) => {
							const alias = keyValue[0];
							const query = keyValue[1];
							if (!query) return;

							if (!variabilizedList.includes(alias)) {
								pathMap[alias] = {
									id: alias,
									path: alias,
									type: typeof query,
									display: alias,
									blockType: "query",
									variabilized: Object.keys(
										state.variables,
									).includes(alias),
									groupAlias: groupAliasMapper("query"),
								};

								const q = state.getNotebook(alias);
								if (!q) return;
								for (const f in q._exposed) {
									pathMap[`${alias}.${f}`] = {
										id: `${alias}.${f}`,
										path: `${alias}.${f}`,
										type: typeof q[f], // TODO: get value
										display: `${alias}.${f}`,
										blockType: "query-prop",
										variabilized: true,
										groupAlias:
											groupAliasMapper("query-prop"),
									};
								}
							}
							// iterate over the un-variabilized cells
							if (query.cellList.length > 0) {
								Object.entries(query.cells).forEach(
									(keyValue: [string, CellState]) => {
										const cellAlias = keyValue[0];
										const cell = keyValue[1];
										if (!cell) return;

										if (
											!variabilizedList.includes(cell.id)
										) {
											pathMap[`${alias}.${cellAlias}`] = {
												id: `${alias}.${cellAlias}`,
												path: `${alias}.${cellAlias}`,
												type: typeof cell,
												display: `${alias}.${cellAlias}`,
												blockType: "cell",
												variabilized: false,
												groupAlias:
													groupAliasMapper("cell"),
											};

											const q = state.getNotebook(alias);
											const c = q?.getCell(cellAlias);
											if (!c) return;

											for (const f in c._exposed) {
												pathMap[
													`${alias}.${cellAlias}.${f}`
												] = {
													id: `${alias}.${cellAlias}.${f}`,
													path: `${alias}.${cellAlias}.${f}`,
													type: typeof c[f], // TODO: get value
													display: `${alias}.${cellAlias}.${f}`,
													blockType: "cell-prop",
													variabilized: true,
													groupAlias:
														groupAliasMapper(
															"cell-prop",
														),
												};
											}
										}
									},
								);
							}
						},
					);
					//iterate over defaultPathMap if available
					if (Object.keys(defaultPathMap).length > 0) {
						Object.keys(defaultPathMap).forEach((key) => {
							pathMap[key] = defaultPathMap[key];
						});
					}
					return { optionMap: pathMap, missingReferences };
				}),
			[state, defaultPathMap],
		).get();

		/**
		 * @name handleVariablize
		 * Adds a new variable to the state
		 */
		const handleVariablize = (option: Option) => {
			// add variable
			const success = state.dispatch({
				message: ActionMessages.ADD_VARIABLE,
				payload: {
					id:
						option.blockType === "cell"
							? option?.path?.split(".")[1]
							: option.id,
					to:
						option.blockType === "cell"
							? option?.path?.split(".")[0]
							: option?.path,
					cellId:
						option.blockType === "cell"
							? option?.path?.split(".")[1]
							: undefined,
					type: option.blockType as VariableType,
				},
			});

			// Create notification
			if (success) {
				toast.success(`Successfully added ${option.id} as a variable.`);
			} else {
				toast.error(
					`Unable to add ${option.id}, due to syntax or a duplicated alias`,
				);
			}
		};

		const handleSelectOption = (val: string) => {
			if (!val) {
				onChange("");
				return;
			}
			const cursorPosition = inputRef?.current
				? inputRef.current?.selectionStart
				: value.length;
			const leftText = value.substring(0, cursorPosition);
			const rightText = value.substring(cursorPosition);
			const option = optionMap?.[val];
			if (!option) return;
			const valf =
				option.blockType === "cell"
					? (option?.path?.split(".")[1] ?? option?.path)
					: option?.path || "";
			if (option?.path === undefined) {
				onChange(
					leftText +
						(optionMap?.[val]?.id
							? optionMap?.[val]?.id
							: valf.toString()) +
						rightText,
				);
			} else {
				onChange(`${leftText} {{${valf}}} ${rightText}`);
			}
			if (!optionMap?.[val]?.variabilized) {
				handleVariablize(optionMap?.[val]);
			}
		};

		const groupedOptions = useMemo(() => {
			const groups: Record<string, string[]> = {};
			Object.keys(optionMap).forEach((key) => {
				const group = optionMap[key].groupAlias;
				if (!groups[group]) groups[group] = [];
				groups[group].push(key);
			});
			return groups;
		}, [optionMap]);

		const wordArray = inputValue.split(" ");
		const filteredSuggestions = !inputValue
			? []
			: Object.keys(optionMap)
					.sort(
						(a, b) =>
							(DISPLAY_PRIORITY_MAP[optionMap[a].blockType] ||
								Infinity) -
							(DISPLAY_PRIORITY_MAP[optionMap[b].blockType] ||
								Infinity),
					)
					.filter((option) =>
						option.includes(
							wordArray[wordArray.length - 1]
								.replace("{{", "")
								.replace("}}", ""),
						),
					);

		const suggestion = filteredSuggestions.length
			? filteredSuggestions[0]
			: "";

		const cursorIndex = inputRef.current?.selectionStart ?? value.length;
		const textBeforeCursor = value.substring(0, cursorIndex);
		const textAfterCursor = value.substring(cursorIndex);

		const incompleteWordArray = textBeforeCursor
			.split(" ")
			.map((word) => word.replace("{{", "").replace("}}", ""));
		const suggestionToDisplay =
			suggestion && inputValue.length
				? suggestion.replace(
						incompleteWordArray[incompleteWordArray.length - 1],
						"",
					)
				: "";

		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<div className="flex flex-col gap-2">
					<div className="flex flex-row items-center justify-between">
						<Label htmlFor={inputId}>{label}</Label>
						<div className="flex flex-row items-center">
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<DialogTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label={`Expand ${label.toLowerCase()} editor`}
										>
											<ExternalLink
												className="size-4"
												aria-hidden="true"
											/>
										</Button>
									</DialogTrigger>
								</TooltipTrigger>
								<TooltipContent>{`Expand ${label.toLowerCase()} editor`}</TooltipContent>
							</Tooltip>
						</div>
					</div>
					{missingReferences.length > 0 && (
						<Alert>
							<AlertDescription>
								Some references are unavailable:{" "}
								{missingReferences.join(", ")}. Restore or
								reconnect them in Variables. Your saved value
								has been kept.
							</AlertDescription>
						</Alert>
					)}
					<div className="relative overflow-hidden">
						<Input
							id={inputId}
							ref={inputRef}
							className="w-full overflow-x-auto whitespace-nowrap"
							placeholder="Enter text or select query"
							value={inputValue}
							spellCheck={spellCheck ?? false}
							onChange={(e) => {
								const updatedValue = e.target.value;
								setInputValue(updatedValue);
								onChange(updatedValue);
							}}
							onScroll={(e) => {
								if (suggestionRef.current)
									suggestionRef.current.scrollLeft =
										e.currentTarget.scrollLeft;
							}}
							onKeyDown={(e) => {
								if (
									e.key === "Tab" &&
									!e.shiftKey &&
									suggestionToDisplay &&
									!textAfterCursor
								) {
									e.preventDefault();
									const textArr = textBeforeCursor.split(" ");
									textArr.splice(-1, 1, `{{${suggestion}}}`);
									const completeValue = textArr.join(" ");
									onChange(completeValue);
									setInputValue(completeValue);
								}
							}}
						/>
						{suggestionToDisplay && !textAfterCursor && (
							<div
								ref={suggestionRef}
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 text-base text-muted-foreground md:text-sm"
							>
								<div className="relative whitespace-nowrap">
									<span className="invisible">
										{textBeforeCursor}
									</span>
									<span>{suggestionToDisplay}</span>
								</div>
							</div>
						)}
					</div>
					<Select value="" onValueChange={handleSelectOption}>
						<SelectTrigger
							className="w-full"
							aria-label={`Insert reference into ${label.toLowerCase()}`}
						>
							<SelectValue placeholder="Select option..." />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(groupedOptions).map(
								([group, keys]) => (
									<SelectGroup key={group}>
										<SelectLabel>{group}</SelectLabel>
										{[...keys]
											.sort(
												(a, b) =>
													(DISPLAY_PRIORITY_MAP[
														optionMap[a].blockType
													] || Infinity) -
													(DISPLAY_PRIORITY_MAP[
														optionMap[b].blockType
													] || Infinity),
											)
											.map((key) => (
												<SelectItem
													key={key}
													value={key}
												>
													{optionMap[key].display}
												</SelectItem>
											))}
									</SelectGroup>
								),
							)}
						</SelectContent>
					</Select>
				</div>
				<DialogContent
					className={
						Object.hasOwn(data, "type") && data.type === "date"
							? "max-w-sm"
							: "max-w-4xl"
					}
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">{`Edit ${label}`}</DialogTitle>
						<DialogDescription>
							Changes are saved automatically.
						</DialogDescription>
					</DialogHeader>
					<Separator />
					<Textarea
						aria-label={label}
						className="field-sizing-fixed w-full resize-y"
						rows={
							Object.hasOwn(data, "type") && data.type === "date"
								? 1
								: 15
						}
						placeholder="Enter Text..."
						value={value}
						onChange={(e) => {
							// sync the data on change
							onChange(e.target.value);
						}}
						autoComplete="off"
						spellCheck={spellCheck ?? false}
					/>
				</DialogContent>
			</Dialog>
		);
	},
);
