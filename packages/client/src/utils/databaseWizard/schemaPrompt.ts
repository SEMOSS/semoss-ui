export const schemaPrompt = (
	description: string,
	schema: object,
	includeSampleData: boolean,
	sampleRows: number,
) => {
	let prompt = `You are a data modeler. Convert the user's description into a JSON object matching the schema below.\n\nDescription: "${description}"\n\nThe JSON object must conform to the following schema:\n${JSON.stringify(schema, null, 2)}\n\nIf the tables are related, define the relationships in the "foreign_keys" property.`;

	if (includeSampleData) {
		prompt += `\n\nAlso, include a "sample_data" property with ${sampleRows} rows of realistic sample data for each table. The sample data should be an array of objects where keys match the column names. If foreign keys are defined, the sample data must be consistent and reflect those relationships.`;
	} else {
		prompt += '\n\nDo not include the "sample_data" property.';
	}

	prompt += "\n\nJSON Response:";

	return prompt;
};
