import type { Migration } from "./migration.types";

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
		const aggregateFormatter1 = (inputData) => {
			if (inputData) {
				const formattedColumns = {};
				inputData.forEach((column, index) => {
					if (column.selector) {
						formattedColumns[index] = {
							[column.selector]: index != 0 ? "Average" : "",
						};
					}
				});
				return formattedColumns;
			}
			return {};
		};

		const aggregateFormatter2 = (inputData) => {
			if (inputData) {
				const formatedData = {};
				Object.entries(inputData).forEach(
					([key, value]: [string, string[]], index) => {
						formatedData[key] = {};
						value.forEach((field) => {
							formatedData[key][field] =
								index !== 0 ? "Average" : "";
						});
					},
				);
				return formatedData;
			}
			return {};
		};

		const aggregateFormatter3 = (inputData) => {
			if (inputData) {
				const formatedData = {};
				Object.entries(inputData).forEach(
					([key, value]: [string, string[]], index) => {
						if (!key.includes("DataType")) {
							formatedData[key] = {};
							value.forEach((field, idx) => {
								formatedData[key][field] =
									index !== 0
										? inputData[`${key}DataType`][idx] ===
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
							b.data.option["customSettings"]["columnDetails"],
						);
						b.data.aggregate =
							b.data.aggregate || aggregateFormatter1(columns);
					} else if (b.data.variation === "echart-pie-chart") {
						const fields = {
							Label: [b.data.option["_state"]["fields"]["Label"]],
							Value: [b.data.option["_state"]["fields"]["Value"]],
						};
						b.data.aggregate =
							b.data.aggregate || aggregateFormatter2(fields);
					} else if (b.data.variation === "echart-line-graph") {
						b.data.aggregate =
							b.data.aggregate ||
							aggregateFormatter2(
								b.data.option["_state"]["fields"],
							);
					} else if (
						b.data.variation === "echart-scatter-plots" ||
						b.data.variation === "echart-stack-chart"
					) {
						b.data.aggregate =
							b.data.aggregate ||
							aggregateFormatter3(
								b.data.option["_state"]["fields"],
							);
					} else if (b.data.variation === "echart-world-map-chart") {
						const fields = {};
						Object.entries(
							b.data.option["_state"]["fields"],
						).forEach(([key, value]) => {
							fields[key] = [value];
						});
						b.data.aggregate =
							b.data.aggregate || aggregateFormatter3(fields);
					}
				}
			});
		}

		return newState;
	},
};

export default config;
