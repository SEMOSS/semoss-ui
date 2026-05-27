import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo, useRef } from "react";
import {
	type Block,
	type BlockDef,
	copy,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";
import { QuerySelectionSettings } from "../custom";

interface SelectOptionsSettings<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/** fields to update */
	optionData: {
		label: string;
		path: Paths<Block<D>["data"], 4>;
		updateDataField?: Paths<Block<D>["data"], 4>;
	}[];
}

export const SelectOptionsSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		optionData,
	}: SelectOptionsSettings<D>) => {
		const { setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();

		// get the block
		const block = state.getBlock(id);

		const parsedData = computed(() => {
			return copy(block.data, (instance) => {
				if (typeof instance === "string") {
					// try to extract the variable
					return state.parseVariable(instance);
				}

				return instance;
			});
		}).get();

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		const keys: string[] = useMemo(() => {
			try {
				let arr = [];

				// Check if options has the data.values structure (tabular format)
				if (
					parsedData?.options &&
					typeof parsedData.options === "object" &&
					"data" in parsedData.options &&
					parsedData.options.data &&
					typeof parsedData.options.data === "object" &&
					"values" in parsedData.options.data &&
					Array.isArray(parsedData.options.data.values) &&
					"headers" in parsedData.options.data &&
					Array.isArray(parsedData.options.data.headers)
				) {
					// Handle tabular data format
					const { values, headers } = parsedData.options.data as {
						values: unknown[][];
						headers: string[];
					};

					if (headers.length === 1) {
						// Single column - extract as simple array
						arr = values.map((row: unknown[]) => row[0]);
					} else {
						// Multiple columns - return header names as keys
						arr = headers;
					}
				} else if (!Array.isArray(parsedData?.options)) {
					if (typeof parsedData.options === "string") {
						const opts: string = parsedData.options;
						if (opts.startsWith("[") && opts.endsWith("]")) {
							const parsedArr = JSON.parse(parsedData.options);
							const first = parsedArr[0];
							if (
								typeof first === "object" &&
								!Array.isArray(first) &&
								first !== null
							) {
								arr = Object.keys(first);
							} else {
								arr = parsedArr;
							}
						}
					}
				} else {
					if (
						parsedData.options.length > 0 &&
						typeof parsedData.options[0] === "object" &&
						!Array.isArray(parsedData.options[0]) &&
						parsedData.options[0] !== null
					) {
						arr = Object.keys(parsedData.options[0]);
					} else {
						arr = parsedData.options || [];
					}
				}

				// Add variables as options (like QueryIdSelector pattern)
				const variableKeys = Object.keys(state.variables);
				arr = [...arr, ...variableKeys];

				const finalKeys = arr.map((option) => {
					if (typeof option !== "string") {
						return JSON.stringify(option);
					} else {
						return option;
					}
				});

				return finalKeys;
			} catch (error) {
				console.error("Error extracting keys:", error);
				return [];
			}
		}, [parsedData.options, state.variables]);

		const isJsonOpts = useMemo(() => {
			try {
				// Check if options has the data.values structure (tabular format)
				if (
					parsedData?.options &&
					typeof parsedData.options === "object" &&
					"data" in parsedData.options &&
					parsedData.options.data &&
					typeof parsedData.options.data === "object" &&
					"values" in parsedData.options.data &&
					Array.isArray(parsedData.options.data.values) &&
					"headers" in parsedData.options.data &&
					Array.isArray(parsedData.options.data.headers)
				) {
					// Multiple columns means we have object-like data with properties to map
					const { headers } = parsedData.options.data as {
						headers: string[];
					};
					const result = headers.length > 1;
					return result;
				}

				if (!Array.isArray(parsedData?.options)) {
					if (typeof parsedData.options === "string") {
						const opts: string = parsedData.options;
						if (opts.startsWith("[") && opts.endsWith("]")) {
							const parsedArr = JSON.parse(parsedData.options);
							const first = parsedArr[0];
							if (
								typeof first === "object" &&
								!Array.isArray(first) &&
								first !== null
							) {
								return true;
							} else {
								return false;
							}
						}
					}
				} else {
					if (
						typeof parsedData.options[0] === "object" &&
						!Array.isArray(parsedData.options[0]) &&
						parsedData.options[0] !== null
					) {
						return true;
					} else {
						return false;
					}
				}
				return false;
			} catch (error) {
				console.error("Error checking isJsonOpts:", error);
				return false;
			}
		}, [parsedData.options]);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		/**
		 * Sync the data on change
		 * @param optPath - Select Box Options menu display label, Sub - Label
		 */
		const onChange = (
			value: string,
			optPath: Paths<Block<D>["data"], 4>,
		) => {
			// clear out he old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						optPath,
						value as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		if (!isJsonOpts) {
			if (parsedData[path]) {
				if (parsedData.options) {
					// biome-ignore lint/suspicious/useIterableCallbackReturn: echart callback
					optionData.forEach((d) => {
						setData(
							d.path,
							"" as PathValue<D["data"], typeof path>,
						);
					});
				}
			}
			return (
				<QuerySelectionSettings
					id={id}
					label="Options"
					path="options"
					queryPath="output"
					__onChange={() => {
						setData(
							"value" as Paths<Block<D>["data"], 4>,
							parsedData.multiple
								? ([] as PathValue<D["data"], typeof path>)
								: ("" as PathValue<D["data"], typeof path>),
						);

						// biome-ignore lint/suspicious/useIterableCallbackReturn: echart callback
						optionData.forEach((d) => {
							setData(
								d.path,
								"" as PathValue<D["data"], typeof path>,
							);
						});
					}}
				/>
			);
		}

		return (
			<>
				<QuerySelectionSettings
					id={id}
					label="Options"
					path="options"
					queryPath="output"
					__onChange={() => {
						console.log(
							"go update the value that is dependent on this",
						);
						setData(
							"value" as Paths<Block<D>["data"], 4>,
							parsedData.multiple
								? ([] as PathValue<D["data"], typeof path>)
								: ("" as PathValue<D["data"], typeof path>),
						);

						// biome-ignore lint/suspicious/useIterableCallbackReturn: echart callback
						optionData.forEach((d) => {
							setData(
								d.path,
								"" as PathValue<D["data"], typeof path>,
							);
						});
					}}
				/>
				{optionData.map((d, i) => {
					return (
						<div key={`${d.label}-${i}`}>
							<BaseSettingSection
								key={`${d.label}-${i}`}
								label={""}
							>
								<Select
									value={(parsedData[d.path] as string) ?? ""}
									onValueChange={(val) =>
										onChange(val, d.path)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={d.label} />
									</SelectTrigger>
									<SelectContent>
										{keys.map((key) => (
											<SelectItem key={key} value={key}>
												{key}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</BaseSettingSection>
						</div>
					);
				})}
			</>
		);
	},
);
