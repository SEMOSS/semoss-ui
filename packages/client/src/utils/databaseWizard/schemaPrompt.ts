import { ALLOWED_SQL_TYPES } from "./allowedTypes";

export const schemaPrompt = (
	description: string,
	schema: object,
	includeSampleData: boolean,
	sampleRows: number,
) => {
	let prompt = `Based on the following description, generate a JSON object that defines the database schema.\nDescription: "${description}"\n\nThe JSON object must conform to the following schema:\n${JSON.stringify(schema, null, 2)}\n\nIf the tables are related, define the relationships in the "foreign_keys" property.`;

	prompt += `\n\nUse only these SQL data types for columns: ${ALLOWED_SQL_TYPES.join(", ")}.`;

	if (includeSampleData) {
		prompt += `\n\nAlso, include a "sample_data" property with ${sampleRows} rows of realistic sample data for each table. The sample data should be an object keyed by table name, with each value as an array of row objects. If foreign keys are defined, the sample data must be consistent and reflect those relationships.`;
	} else {
		prompt += '\n\nDo not include the "sample_data" property.';
	}

	prompt += "\n\nJSON Response:";

	return prompt;
};
