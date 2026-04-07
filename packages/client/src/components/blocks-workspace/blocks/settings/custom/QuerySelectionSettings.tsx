import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
	type Variable,
	type QueryState,
	type CellState,
	type Block,
} from "@semoss/renderer";
import { 
	Autocomplete, 
	TextField, 
	List,
	Typography,
	Accordion,
	styled,
} from "@semoss/ui";
import { ExpandMore } from "@mui/icons-material";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";

const StyledMenuSection = styled(Accordion)(({ theme }) => ({
	boxShadow: "none",
	borderRadius: "0 !important",
	border: "0px",
	borderBottom: `1px solid ${theme.palette.divider}`,
	"&:before": {
		display: "none",
	},
	"&.Mui-expanded": {
		margin: "0",
		"&:last-child": {
			borderBottom: "0px",
		},
	},
}));

const StyledMenuSectionTitle = styled(Accordion.Trigger)(({ theme }) => ({
	minHeight: "auto !important",
	height: theme.spacing(6),
}));

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

		// track the expanded accordion group
		const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
		const optionMap = useMemo<Record<string, Option>>(() => {
			const pathMap: Record<string, Option> = {};

			// Add variables (excluding cells as they're handled separately from queries)
			Object.entries(state.variables).forEach(([alias, variable]: [string, Variable]) => {
				if (
					variable.type === "query" ||
					variable.type === "array" ||
					variable.type === "block"
				) {
					// Map array type to variable for display purposes
					const blockType = variable.type === "array" ? "variable" : variable.type;
					// Use the original variable type for group mapping, not the blockType
					const groupType = variable.type === "array" ? "variable" : variable.type;
					pathMap[`{{${alias}.${queryPath}}}`] = {
						id: `{{${alias}.${queryPath}}}`,
						path: `{{${alias}.${queryPath}}}`,
						display: `${alias}.${queryPath}`,
						type: variable.type,
						groupAlias: groupAliasMapper(groupType),
						blockType: blockType as "query" | "block" | "cell" | "variable",
					};
				}
			});

			// Add queries (notebooks)
			Object.entries(state.queries).forEach(([alias, query]: [string, QueryState]) => {
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
					Object.entries(query.cells).forEach(([cellAlias, cell]: [string, CellState]) => {
						const cellOption = `{{${alias}.${cellAlias}.${queryPath}}}`;
						pathMap[cellOption] = {
							id: cellOption,
							path: cellOption,
							display: `${alias}.${cellAlias}.${queryPath}`,
							type: "cell",
							groupAlias: groupAliasMapper("cell"),
							blockType: "cell",
						};
					});
				}
			});

			// Add placeholder entries for empty categories to ensure they're visible
			const allCategories = ["Block", "Notebook", "Cell", "Variable"];
			const existingGroups = new Set(Object.values(pathMap).map((option: Option) => option.groupAlias));
			
			allCategories.forEach(category => {
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

		// Get sorted options for display
		const sortedOptions = useMemo(() => {
			return Object.keys(optionMap).sort((a, b) => {
				const optionA = optionMap[a];
				const optionB = optionMap[b];
				
				// First sort by group
				if (optionA.groupAlias !== optionB.groupAlias) {
					return optionA.groupAlias.localeCompare(optionB.groupAlias);
				}
				
				// Then sort by display name
				return optionA.display.localeCompare(optionB.display);
			});
		}, [optionMap]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
			// set the value
			setValue(value);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, value as PathValue<D["data"], typeof path>);
					
					// If the value is empty/null, clear the options array to show placeholder
					if (!value || value.trim() === "") {
						setData("options" as Paths<Block<D>["data"], 4>, [] as PathValue<D["data"], typeof path>);
					}
					
					__onChange();
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label={label}>
				<Autocomplete
					fullWidth
					disableClearable={value === ""}
					size="small"
					multiple={false}
					value={value}
					options={sortedOptions}
					getOptionLabel={(option: string) => {
						return optionMap[option]?.display ?? option;
					}}
					getOptionDisabled={(option: string) => {
						return optionMap[option]?.isPlaceholder ?? false;
					}}
					groupBy={(option) => optionMap[option]?.groupAlias}
					renderGroup={(params) => {
						return (
							<li key={params.key}>
								<StyledMenuSection
									onChange={() => {
										if (params.group === expandedGroup)
											setExpandedGroup(null);
										else
											setExpandedGroup(params.group);
									}}
									expanded={expandedGroup === params.group}
								>
									<StyledMenuSectionTitle
										expandIcon={<ExpandMore />}
										aria-controls="panel1a-content"
									>
										<Typography variant="body2">
											{params.group}
										</Typography>
									</StyledMenuSectionTitle>
									<Accordion.Content>
										<List disablePadding>
											{params.children}
										</List>
									</Accordion.Content>
								</StyledMenuSection>
							</li>
						);
					}}
					onChange={(_, value) => {
						onChange(value);
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder="Enter text or select option"
							size="small"
							variant="outlined"
						/>
					)}
				/>
			</BaseSettingSection>
		);
	},
);
