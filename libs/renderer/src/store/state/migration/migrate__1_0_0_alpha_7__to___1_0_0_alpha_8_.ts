import type { Migration } from "./migration.types";

/**
 * @name config
 * @description - Missed a spot with pre-process clean up
 *
 * 1. Remove and Rename onClick to onChange
 *  */
const config: Migration = {
	versionFrom: "1.0.0-alpha.7",
	versionTo: "1.0.0-alpha.8",
	run: (state) => {
		const newState = { ...state };

		Object.entries(newState.blocks).forEach((keyValue) => {
			const block = keyValue[1];
			if (block.widget === "upload") {
				let copy = null;
				if (block.listeners["onClick"]) {
					copy = block.listeners["onClick"].order;
				}

				if (!block.listeners["onChange"]) {
					block.listeners["onChange"] = copy;
				}

				if (block.listeners["onClick"]) {
					delete block.listeners["onClick"];
				}
			}
		});

		return newState;
	},
};

export default config;
