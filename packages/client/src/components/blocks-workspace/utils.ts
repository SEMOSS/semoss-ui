import type { Variable } from "@semoss/renderer";
import { type LLMResponse, runPixel } from "@semoss/sdk";

/**
 * Suggest variable renames using LLM
 */
export const suggestVariableRenames = async (
	state: any,
	agentModelEngine: string,
	variableKey?: string,
): Promise<Record<string, string>> => {
	/**
	 * { previous_variable_name: suggested_variable_name, ..others }
	 */
	const keyHashmap: Record<string, string> = {};

	console.log("state", state);

	// Determine which variables to process
	let variablesToProcess: [string, Variable][];

	if (variableKey) {
		// Process only the specific variable
		if (state.variables[variableKey]) {
			variablesToProcess = [[variableKey, state.variables[variableKey]]];
		} else {
			console.warn(`Variable key "${variableKey}" not found`);
			return keyHashmap;
		}
	} else {
		// Process all variables (original behavior)
		variablesToProcess = Object.entries(state.variables);
	}

	const promises = variablesToProcess.map(
		async ([key, value]: [string, Variable]) => {
			console.log(`${key} value: `, value);

			let prompt;

			// Change prompts per variable

			// PROMPTS START -------------------------------------------------
			if (value.type === "block") {
				prompt = `
 I have this data structure:
 ${JSON.stringify({
		widget: state.blocks[value.to!].widget,
		data: state.blocks[value.to!].data,
 })}
 Based on this data structure would be a good variableName?
 Rules:
 - Please only return the ""variableName""
 - and ensure it is valid python variable naming format.
 `;
			} else if (value.type === "cell") {
				prompt = `
 I have this snippet of code:
 ${JSON.stringify(
		state.queries[value.to!].cells[value.cellId!].parameters.code,
 )}
 I need you to look at the code that gets ran based on above snippet and come up with a valid variableName for it.
 Rules for response:
 - Please only return the ""variable_name""
 - and ensure it is valid python variable naming syntax.
 - Should not be longer than 10 characters
 `;
			} else {
				// Notebooks

				// TODO: Stringify all cells. Or just append all the pixel and python in order to miinimze token count
				return;
			}

			// PROMPTS END -------------------------------------------------

			// Get variable name suggestions from LLM
			const resp = await runPixel(
				`LLM(engine=["${agentModelEngine}"], command = "<encode>${prompt}</encode>", paramValues=[{'max_completion_tokens':10,'temperature':0.3}]);`,
			);

			console.log("-----------------------");
			console.log(`Variable name suggestions for ${key}`, resp);
			console.log("-----------------------");

			const output = resp.pixelReturn[0].output as LLMResponse;

			if (output.response) {
				keyHashmap[key] = output.response;
			}
		},
	);

	await Promise.all(promises);

	console.log("keyHashmap", keyHashmap);

	return keyHashmap;
};
