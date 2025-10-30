import type { Migration } from "./migration.types";

/**
 * @name config
 * @description - id reassign for cells
 * TODO: An optional migration function that reassigns old ids to cells to new incremented ints
 * This is more for cleaning up
 *
 * */
const config: Migration = {
	versionFrom: "1.0.0-alpha.8",
	versionTo: "1.0.0-alpha.9",
	run: (state) => {
		const newState = { ...state };

		// check each cell, convert each cell to a
		Object.entries(newState.queries).forEach((keyValue) => {
			const q = keyValue[1];

			// First get the cell with the highest number to get a starting point
			let highestExistingId = 1;
			console.log("migration 9", q.cells);
			q.cells.forEach((c) => {
				const parsedId = parseInt(c.id);

				if (parsedId > highestExistingId) {
					highestExistingId = parsedId;
				}
			});

			// highest tells us where to start off for rewriting id's on the cell
			// Re point changed id's on variables
			let starter = highestExistingId + 1;

			q.cells.forEach((c) => {
				// to reference in variable reassign below
				if (c.id < highestExistingId) {
					const idBeforeChange = c.id;

					// reassign id
					c.id = `${starter}`;

					// increment
					starter += 1;

					// reassign variable
					Object.values(newState.variables).forEach((variable) => {
						if (variable.to === q.id) {
							if (variable.cellId === idBeforeChange) {
								variable.cellId = `${c.id}`;
							}
						}
					});
				}
			});
		});

		return newState;
	},
};

export default config;
