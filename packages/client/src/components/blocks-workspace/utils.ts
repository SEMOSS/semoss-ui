import type { StateStore, Variable } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk";

/**
 * Suggest variable renames using LLM
 */
const rules = `I need you to look at the code that gets ran based on above snippet and come up with a valid variableName for it.
 Rules for response:
 - Do not return the same name as the current name
 - Must start with letter or underscore can only contain letters, numbers and underscores
 - and ensure it is valid python variable naming syntax.
 - Should not be longer than 10 characters.
 - Suggest a new name, only if the current name is not already intuitive."
 - Please only return the ""variable_name""
`;

interface LLMResponse {
	response?: string;
	[key: string]: unknown;
}

export const suggestVariableRenames = async (
	state: StateStore,
	agentModelEngine: string,
	variableKey?: string,
): Promise<Record<string, string>> => {
	/**
	 * { previous_variable_name: suggested_variable_name, ..others }
	 */
	const keyHashmap: Record<string, string> = {};

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
			let prompt: string;

			// Change prompts per variable

			// PROMPTS START -------------------------------------------------
			if (value.type === "block") {
				prompt = `
 I have this data structure:
 ${JSON.stringify({
		widget: state.blocks[value.to!].widget,
		data: state.blocks[value.to!].data,
 })},
 the current variable name for this data structure is "${key}".
 ${rules}
 `;
			} else if (value.type === "cell") {
				prompt = `
 I have this snippet of code:
 ${JSON.stringify(
		state.notebooks[value.to!].cells[value.cellId!].parameters.code,
 )},
 the current variable name for this code is "${key}".
 I need you to look at the code that gets ran based on above snippet and come up with a valid variableName for it.
 ${rules}
 `;
			} else {
				// Notebooks

				// TODO: Stringify all cells. Or just append all the pixel and python in order to miinimze token count
				return;
			}

			// PROMPTS END -------------------------------------------------

			// Get variable name suggestions from LLM
			const resp = await runPixel(
				`LLM(engine=["${agentModelEngine}"], command = "<encode>${prompt}</encode>", paramValues=[{'max_completion_tokens':10}]);`,
			);

			const output = resp.pixelReturn[0].output as LLMResponse;

			if (output.response) {
				keyHashmap[key] = output.response;
			}
		},
	);

	await Promise.all(promises);

	return keyHashmap;
};
