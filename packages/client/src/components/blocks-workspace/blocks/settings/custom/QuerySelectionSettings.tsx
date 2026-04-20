import { Check, ChevronsUpDown } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	type CellState,
	getValueByPath,
	type Paths,
	type PathValue,
	type QueryState,
	useBlocks,
	type Variable,
} from "@semoss/renderer";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Command,
	CommandEmpty,
	CommandInput,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
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
	}: QuerySelectionSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();

		// track the value
		const [value, setValue] = useState("");
		const [open, setOpen] = useState(false);
		const [search, setSearch] = useState("");

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
		}, [computedValue]);

		// available options for autocomplete (categorized)
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		const optionMap = useMemo<Record<string, Option>>(() => {
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
			Object.entries(state.queries).forEach(
				([alias, query]: [string, QueryState]) => {
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
							([cellAlias, _cell]: [string, CellState]) => {
								const cellOption = `{{${alias}.${cellAlias}.${queryPath}}}`;
								pathMap[cellOption] = {
									id: cellOption,
									path: cellOption,
									display: `${alias}.${cellAlias}.${queryPath}`,
									type: "cell",
									groupAlias: groupAliasMapper("cell"),
									blockType: "cell",
								};
							},
						);
					}
				},
			);

			// Add placeholder entries for empty categories to ensure they're visible
			const allCategories = ["Block", "Notebook", "Cell", "Variable"];
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
		}, [state.variables, state.blocks, state.queries, queryPath]);

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
		const onChange = (newValue: string) => {
			// set the value
			setValue(newValue);
			setOpen(false);
			setSearch("");

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						path,
						newValue as PathValue<D["data"], typeof path>,
					);

					// If the value is empty/null, clear the options array to show placeholder
					if (!newValue || newValue.trim() === "") {
						setData(
							"options" as Paths<Block<D>["data"], 4>,
							[] as PathValue<D["data"], typeof path>,
						);
					}

					__onChange();
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		const categories = ["Block", "Notebook", "Cell", "Variable"];

		return (
			<BaseSettingSection label={label}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="w-full justify-between font-normal"
						>
							<span className="truncate text-left">
								{value
									? (optionMap[value]?.display ?? value)
									: "Enter text or select option"}
							</span>
							<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[var(--radix-popover-trigger-width)] p-0"
						align="start"
					>
						<Command>
							<CommandInput
								placeholder="Search..."
								value={search}
								onValueChange={setSearch}
							/>
							<CommandList className="max-h-[300px]">
								<CommandEmpty>No options found.</CommandEmpty>
								<Accordion
									type="multiple"
									defaultValue={categories}
								>
									{categories.map((category) => {
										const items = (
											groupedOptions[category] ?? []
										).filter(
											(opt) =>
												!search ||
												opt.display
													.toLowerCase()
													.includes(
														search.toLowerCase(),
													),
										);
										return (
											<AccordionItem
												key={category}
												value={category}
												className="border-0"
											>
												<AccordionTrigger className="px-3 py-2 font-medium text-sm hover:bg-accent/50 hover:no-underline">
													{category}
												</AccordionTrigger>
												<AccordionContent className="pb-0">
													{items.length === 0 ? (
														<div className="px-3 py-2 text-muted-foreground text-sm">
															No options available
														</div>
													) : (
														items.map((option) => (
															// biome-ignore lint/a11y/noStaticElementInteractions: list option div
															// biome-ignore lint/a11y/useKeyWithClickEvents: list option div
															<div
																key={option.id}
																className={`flex cursor-pointer items-center gap-2 px-6 py-1.5 text-sm hover:bg-accent ${
																	option.isPlaceholder
																		? "pointer-events-none opacity-50"
																		: ""
																}`}
																onClick={() => {
																	if (
																		!option.isPlaceholder
																	) {
																		onChange(
																			option.id,
																		);
																	}
																}}
															>
																{value ===
																	option.id && (
																	<Check className="size-3.5 shrink-0" />
																)}
																<span
																	className={
																		value ===
																		option.id
																			? "ml-0"
																			: "ml-5"
																	}
																>
																	{
																		option.display
																	}
																</span>
															</div>
														))
													)}
												</AccordionContent>
											</AccordionItem>
										);
									})}
								</Accordion>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</BaseSettingSection>
		);
	},
);
