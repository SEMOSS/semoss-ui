import { Check, ChevronsUpDown } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useId, useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	type CellState,
	getValueByPath,
	type NotebookState,
	type Paths,
	type PathValue,
	useBlocks,
	type Variable,
} from "@semoss/renderer";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

interface Option {
	id: string;
	path: string;
	display: string;
	type: string;
	groupAlias: string;
	blockType: "query" | "block" | "cell" | "variable" | "placeholder";
	isPlaceholder?: boolean;
}

// Group name mapper function
const groupAliasMapper = (type: string) => {
	switch (type) {
		case "query":
			return "Notebook";
		case "cell":
			return "Cell";
		case "block":
			return "Block";
		case "variable":
			return "Variable";
		default:
			return "Others";
	}
};

interface QuerySelectionSettingsProps<D extends BlockDef = BlockDef> {
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
	 * Query path to bind to
	 */
	queryPath: "isLoading" | "output";

	/**
	 * Callback
	 */
	__onChange?: () => void;
	/** Allow removing this binding from the settings control. */
	allowClear?: boolean;
}

/**
 * Specifically for selecting a query for to associate with loading/disabled/etc
 */
export const QuerySelectionSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		queryPath,
		__onChange,
		allowClear = false,
	}: QuerySelectionSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();

		const controlId = useId();
		const [open, setOpen] = useState(false);

		// get the value of the input (wrapped in usememo because of path prop)
		const value = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v: unknown = getValueByPath(data, path);
				if (
					typeof v === "undefined" ||
					(queryPath === "isLoading" && v === false)
				) {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path, queryPath]).get();

		// available options for autocomplete (categorized)
		const optionMap = useMemo(
			() =>
				computed(() => {
					const pathMap: Record<string, Option> = {};

					// Add variables (excluding cells as they're handled separately from queries)
					Object.entries(state.variables).forEach(
						([alias, variable]: [string, Variable]) => {
							if (
								variable.type === "query" ||
								variable.type === "array" ||
								variable.type === "block"
							) {
								// Map array type to variable for display purposes
								const blockType =
									variable.type === "array"
										? "variable"
										: variable.type;
								// Use the original variable type for group mapping, not the blockType
								const groupType =
									variable.type === "array"
										? "variable"
										: variable.type;
								pathMap[`{{${alias}.${queryPath}}}`] = {
									id: `{{${alias}.${queryPath}}}`,
									path: `{{${alias}.${queryPath}}}`,
									display: `${alias}.${queryPath}`,
									type: variable.type,
									groupAlias: groupAliasMapper(groupType),
									blockType: blockType as
										| "query"
										| "block"
										| "cell"
										| "variable",
								};
							}
						},
					);

					// Add queries (notebooks)
					Object.entries(state.notebooks).forEach(
						([alias, query]: [string, NotebookState]) => {
							const queryOption = `{{${alias}.${queryPath}}}`;
							if (!pathMap[queryOption]) {
								pathMap[queryOption] = {
									id: queryOption,
									path: queryOption,
									display: `${alias}.${queryPath}`,
									type: "query",
									groupAlias: groupAliasMapper("query"),
									blockType: "query",
								};
							}

							// Add cells within queries
							if (query.cellList.length > 0) {
								Object.entries(query.cells).forEach(
									([cellAlias, _cell]: [
										string,
										CellState,
									]) => {
										const cellOption = `{{${alias}.${cellAlias}.${queryPath}}}`;
										pathMap[cellOption] = {
											id: cellOption,
											path: cellOption,
											display: `${alias}.${cellAlias}.${queryPath}`,
											type: "cell",
											groupAlias:
												groupAliasMapper("cell"),
											blockType: "cell",
										};
									},
								);
							}
						},
					);

					// Add placeholder entries for empty categories to ensure they're visible
					const allCategories = [
						"Block",
						"Notebook",
						"Cell",
						"Variable",
					];
					const existingGroups = new Set(
						Object.values(pathMap).map(
							(option: Option) => option.groupAlias,
						),
					);

					allCategories.forEach((category) => {
						if (!existingGroups.has(category)) {
							// Add a placeholder entry that won't be selectable
							pathMap[`__placeholder_${category}`] = {
								id: `__placeholder_${category}`,
								path: `__placeholder_${category}`,
								display: "No options available",
								type: "placeholder",
								groupAlias: category,
								blockType: "placeholder",
								isPlaceholder: true,
							};
						}
					});

					return pathMap;
				}),
			[state, queryPath],
		).get();

		// Get options grouped by category
		const groupedOptions = useMemo(() => {
			const groups: Record<string, Option[]> = {};
			const allCategories = ["Block", "Notebook", "Cell", "Variable"];

			allCategories.forEach((cat) => {
				groups[cat] = [];
			});

			Object.values(optionMap).forEach((option) => {
				if (!groups[option.groupAlias]) {
					groups[option.groupAlias] = [];
				}
				groups[option.groupAlias].push(option);
			});

			// Sort items within each group by display name
			Object.keys(groups).forEach((group) => {
				groups[group].sort((a, b) =>
					a.display.localeCompare(b.display),
				);
			});

			return groups;
		}, [optionMap]);

		/**
		 * Sync the data on change
		 */
		const onChange = (newValue: string | false) => {
			setOpen(false);
			setData(path, newValue as PathValue<D["data"], typeof path>);
			__onChange?.();
		};

		const categories = ["Block", "Notebook", "Cell", "Variable"];

		return (
			<BaseSettingSection label={label} htmlFor={controlId}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							id={controlId}
							type="button"
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="w-full justify-between font-normal"
						>
							<span className="truncate text-left">
								{value
									? (optionMap[value]?.display ?? value)
									: "Select option..."}
							</span>
							<ChevronsUpDown
								className="ml-2 size-4 shrink-0 opacity-50"
								aria-hidden="true"
							/>
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[var(--radix-popover-trigger-width)] p-0"
						align="start"
					>
						<Command
							label={`Search ${label.toLowerCase()} references`}
						>
							<CommandInput placeholder="Search references..." />
							<CommandList>
								<CommandEmpty>
									No matching references.
								</CommandEmpty>
								{categories.map((category) => {
									const items = (
										groupedOptions[category] ?? []
									).filter((option) => !option.isPlaceholder);
									return items.length > 0 ? (
										<CommandGroup
											key={category}
											heading={category}
										>
											{items.map((option) => (
												<CommandItem
													key={option.id}
													value={option.id}
													keywords={[option.display]}
													onSelect={() =>
														onChange(option.id)
													}
												>
													<Check
														aria-hidden="true"
														className={cn(
															"size-4",
															value !==
																option.id &&
																"invisible",
														)}
													/>
													{option.display}
												</CommandItem>
											))}
										</CommandGroup>
									) : null;
								})}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{allowClear && value && (
					<Button
						type="button"
						variant="ghost"
						aria-label={`Clear ${label.toLowerCase()}`}
						onClick={() =>
							onChange(queryPath === "isLoading" ? false : "")
						}
					>
						Clear
					</Button>
				)}
			</BaseSettingSection>
		);
	},
);
