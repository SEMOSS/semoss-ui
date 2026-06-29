import type { Migration } from "./migration.types";

interface AggregateColumnLike {
	selector?: string;
}

type AggregateColumnCollection = Array<AggregateColumnLike>;
type AggregateInputMap = Record<string, string[]>;
type AggregateResultCollection = Record<
	string | number,
	Record<string, string>
>;

/**
 * @name config
 * @description
 *
 *  Make every cell a variable if not already
 * */
const config: Migration = {
	versionFrom: "1.0.0-alpha.10",
	versionTo: "1.0.0-alpha.11",
	run: (state) => {
		const newState = { ...state };
		/**
		 * Derives the selector from the backup state if no aggregate data is available.
		 * @returns An array of tuples representing the field and its aggregation method.
		 */
		const aggregateFormatter1 = (inputData: AggregateColumnCollection) => {
			if (inputData) {
				const formattedColumns: AggregateResultCollection = {};
				inputData.forEach(
					(column: AggregateColumnLike, index: number) => {
						if (column.selector) {
							formattedColumns[index] = {
								[column.selector]: index !== 0 ? "Average" : "",
							};
						}
					},
				);
				return formattedColumns;
			}
			return {};
		};

		const aggregateFormatter2 = (inputData: AggregateInputMap) => {
			if (inputData) {
				const formatedData: AggregateResultCollection = {};
				Object.entries(inputData).forEach(
					([key, value]: [string, string[]], index: number) => {
						formatedData[key] = {};
						value.forEach((field: string) => {
							formatedData[key][field] =
								index !== 0 ? "Average" : "";
						});
					},
				);
				return formatedData;
			}
			return {};
		};

		const aggregateFormatter3 = (inputData: AggregateInputMap) => {
			if (inputData) {
				const formatedData: AggregateResultCollection = {};
				Object.entries(inputData).forEach(
					([key, value]: [string, string[]], index: number) => {
						if (!key.includes("DataType")) {
							formatedData[key] = {};
							value.forEach((field: string, idx: number) => {
								formatedData[key][field] =
									index !== 0
										? inputData[`${key}DataType`]?.[idx] ===
											"NUMBER"
											? "Average"
											: "Count"
										: "";
							});
						}
					},
				);
				return formatedData;
			}
			return {};
		};
		if (state.blocks) {
			Object.values(state.blocks).forEach((b) => {
				if (b.widget === "e-chart") {
					if (b.data.variation === "echart-bar-graph") {
						b.data.aggregate =
							b.data.aggregate ||
							aggregateFormatter1(b.data.columns);
					} else if (b.data.variation === "echart-gantt-chart") {
						const columns = Object.values(
							b.data.option.customSettings.columnDetails,
						);
						b.data.aggregate =
							b.data.aggregate ||
							aggregateFormatter1(
								columns as AggregateColumnCollection,
							);
					} else if (b.data.variation === "echart-pie-chart") {
						if (b.data.option._state?.fields) {
							const fields: AggregateInputMap = {
								Label: [b.data.option._state.fields.Label],
								Value: [b.data.option._state.fields.Value],
							};
							b.data.aggregate =
								b.data.aggregate || aggregateFormatter2(fields);
						}
					} else if (b.data.variation === "echart-line-graph") {
						if (b.data.option._state?.fields) {
							b.data.aggregate =
								b.data.aggregate ||
								aggregateFormatter2(
									b.data.option._state.fields,
								);
						}
					} else if (
						b.data.variation === "echart-scatter-plots" ||
						b.data.variation === "echart-stack-chart"
					) {
						if (b.data.option._state?.fields) {
							b.data.aggregate =
								b.data.aggregate ||
								aggregateFormatter3(
									b.data.option._state.fields,
								);
						}
					} else if (b.data.variation === "echart-world-map-chart") {
						if (b.data.option._state?.fields) {
							const fields: AggregateInputMap = {};
							Object.entries(b.data.option._state.fields).forEach(
								([key, value]: [string, unknown]) => {
									fields[key] = [String(value)];
								},
							);
							b.data.aggregate =
								b.data.aggregate || aggregateFormatter3(fields);
						}
					}
				}
			});
		}

		return newState;
	},
};

export default config;
