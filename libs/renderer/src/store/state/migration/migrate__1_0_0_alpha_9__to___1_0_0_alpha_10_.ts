import { Migration } from "./migration.types";

/**
 * @name config
 * @description
 *
 *  Make every cell a variable if not already
 * */
const config: Migration = {
    versionFrom: "1.0.0-alpha.9",
    versionTo: "1.0.0-alpha.10",
    run: (state) => {
        const newState = { ...state };

        // check each cell, convert each cell to a
        for (const q of Object.values(state.queries)) {
            for (const c of q.cells) {
                let found = false;

                for (const variable of Object.values(newState.variables)) {
                    if (variable.to === q.id) {
                        if (c.id === variable.cellId) {
                            found = true;
                        }
                    } else {
                        found = false;
                    }
                }
                // create a variable for cells that arent already there
                // console.log({ found, query: q.id, cell: c.id });
                if (!found) {
                    const variableConfig = {
                        type: "cell",
                        to: q.id,
                        cellId: c.id,
                    };

                    // EDGE CASE: Check if someone coincidentally named there variable nbName--cellId
                    const baseKey = `${q.id}--${c.id}`;
                    let variableKey = baseKey;
                    let attemptCount = 0;

                    while (newState.variables[variableKey]) {
                        const randomSuffix = Math.floor(Math.random() * 100000);
                        variableKey = `${baseKey}--${randomSuffix}`;
                        console.log({ variableKey });

                        attemptCount++;

                        if (attemptCount > 100) {
                            throw new Error(
                                `Failed to generate unique id for variable pointing to -->  sheet: ${q.id} cell:${c.id}`,
                            );
                        }
                    }

                    newState.variables[`${q.id}--${c.id}`] = variableConfig;
                }
            }
        }
        // Object.values(state.queries).forEach((q) => {
        //     q.cells.forEach((c) => {
        //         let found = false;
        //         Object.values(newState.variables).forEach((variable) => {
        //             if (variable.to === q.id) {
        //                 if (c.id === variable.cellId) {
        //                     found = true;
        //                 }
        //             }
        //         });

        //         // create a variable for cells that arent already there
        //         // console.log({ found, query: q.id, cell: c.id });
        //         if (!found) {
        //             console.log({ found, query: q.id, cell: c.id });
        //             const variableConfig = {
        //                 type: "cell",
        //                 to: q.id,
        //                 cellId: c.id,
        //             };

        //             // EDGE CASE: Check if someone coincidentally named there variable nbName--cellId
        //             const baseKey = `${q.id}--${c.id}`;
        //             let variableKey = baseKey;
        //             let attemptCount = 0;

        //             console.log({
        //                 beforeVariableKey: newState.variables[variableKey],
        //                 variables: newState.variables,
        //             });

        //             while (newState.variables[variableKey]) {
        //                 const randomSuffix = Math.floor(Math.random() * 100000);
        //                 variableKey = `${baseKey}--${randomSuffix}`;
        //                 console.log({ variableKey });

        //                 attemptCount++;

        //                 if (attemptCount > 100) {
        //                     throw new Error(
        //                         `Failed to generate unique id for variable pointing to -->  sheet: ${q.id} cell:${c.id}`,
        //                     );
        //                 }
        //             }

        //             newState.variables[`${q.id}--${c.id}`] = variableConfig;
        //             console.log({
        //                 after: newState.variables[`${q.id}--${c.id}`],
        //             });
        //         }
        //     });
        // });

        return newState;
    },
};

export default config;
