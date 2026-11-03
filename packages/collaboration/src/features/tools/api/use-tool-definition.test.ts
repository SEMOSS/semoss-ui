import {
	supportsToolFields,
	type ToolInputSchema,
	validateToolArguments,
} from "./use-tool-definition";

const schema: ToolInputSchema = {
	properties: {
		query: { type: "string", minLength: 1 },
		count: { type: "integer", minimum: 1, maximum: 10 },
		confirm: { type: "boolean" },
	},
	required: ["query"],
};
it("validates required and typed fields without losing optional values", () => {
	expect(validateToolArguments(schema, {})).toContain("required");
	expect(
		validateToolArguments(schema, { query: "ok", count: 1.5 }),
	).toContain("integer");
	expect(validateToolArguments(schema, { query: "ok", count: 0 })).toContain(
		"range",
	);
	expect(
		validateToolArguments(schema, { query: "ok", confirm: "false" }),
	).toContain("true or false");
	expect(
		validateToolArguments(schema, { query: "ok", confirm: false }),
	).toBeNull();
});
it("uses JSON when a schema or arguments cannot be faithfully represented", () => {
	expect(supportsToolFields(schema, { query: "hello" })).toBe(true);
	expect(supportsToolFields(schema, { undeclared: "retain me" })).toBe(false);
	expect(
		supportsToolFields(
			{
				properties: { query: { type: "string", pattern: "^hello" } },
				required: [],
			},
			{},
		),
	).toBe(false);
	expect(
		supportsToolFields(
			{ properties: { items: { type: "array" } }, required: [] },
			{},
		),
	).toBe(false);
});

it("validates structured approval fields without accepting malformed array items", () => {
	const structured: ToolInputSchema = {
		properties: {
			people: {
				type: "array",
				minItems: 1,
				items: {
					type: "object",
					required: ["email"],
					properties: { email: { type: "string", minLength: 1 } },
				},
			},
		},
		required: ["people"],
	};
	expect(validateToolArguments(structured, { people: [] })).toContain(
		"number of items",
	);
	expect(
		validateToolArguments(structured, { people: ["wrong shape"] }),
	).toContain("must be an object");
	expect(validateToolArguments(structured, { people: [{}] })).toContain(
		"email is required",
	);
	expect(
		validateToolArguments(structured, {
			people: [{ email: "alex@example.com" }],
		}),
	).toBeNull();
});
