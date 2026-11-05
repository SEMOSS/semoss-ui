import { usePixel } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import { pixel } from "@/lib/pixel";

const propertySchema = z
	.object({
		type: z.string().optional(),
		description: z.string().optional(),
		enum: z.array(z.string()).optional(),
		minimum: z.number().optional(),
		maximum: z.number().optional(),
		minLength: z.number().optional(),
		maxLength: z.number().optional(),
	})
	.catchall(z.unknown());
const inputSchema = z
	.object({
		type: z.literal("object").optional(),
		properties: z.record(z.string(), propertySchema).default({}),
		required: z.array(z.string()).default([]),
	})
	.catchall(z.unknown());
const toolsSchema = z.object({
	tools: z.array(
		z.object({
			name: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			inputSchema: z.unknown(),
		}),
	),
});
export type ToolInputSchema = z.infer<typeof inputSchema>;
export type ToolProperty = z.infer<typeof propertySchema>;

/** Read schemas carried by system calls as well as schemas returned by an MCP. */
export function readToolInputSchema(value: unknown): ToolInputSchema | null {
	const parsed = inputSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

/** Narrow an array item's or nested object's schema at the UI boundary. */
export function readToolProperty(value: unknown): ToolProperty {
	const parsed = propertySchema.safeParse(value);
	return parsed.success ? parsed.data : {};
}

/** Only render schemas whose validation can be represented faithfully by these controls. */
export function supportsToolFields(
	schema: ToolInputSchema,
	values: Record<string, unknown>,
): boolean {
	return (
		Object.keys(values).every((key) => key in schema.properties) &&
		schema.required.every((key) => key in schema.properties) &&
		Object.keys(schema).every((key) =>
			[
				"type",
				"properties",
				"required",
				"title",
				"description",
				"$schema",
				"additionalProperties",
			].includes(key),
		) &&
		Object.entries(schema.properties).every(
			([name, property]) =>
				/^[a-z_][a-z0-9_]*$/i.test(name) &&
				(!property.enum || property.type === "string") &&
				["string", "number", "integer", "boolean"].includes(
					property.type ?? "",
				) &&
				Object.keys(property).every((key) =>
					[
						"type",
						"description",
						"enum",
						"minimum",
						"maximum",
						"minLength",
						"maxLength",
						"title",
						"default",
					].includes(key),
				),
		)
	);
}

/** The first invalid argument, including its location in nested objects and lists. */
export interface ToolArgumentError {
	path: string[];
	message: string;
}

/** Locate schema errors without coercing or dropping proposed values. */
export function findToolArgumentError(
	schema: ToolInputSchema,
	values: Record<string, unknown>,
): ToolArgumentError | null {
	for (const name of schema.required)
		if (!(name in values) || values[name] === undefined)
			return { path: [name], message: `${name} is required.` };
	for (const [name, value] of Object.entries(values)) {
		const property = schema.properties[name];
		if (!property) continue;
		const invalid = (message: string): ToolArgumentError => ({
			path: [name],
			message,
		});
		if (property.type === "object") {
			if (
				value === null ||
				typeof value !== "object" ||
				Array.isArray(value)
			)
				return invalid(`${name} must be an object.`);
			const nested = readToolInputSchema(property);
			const error =
				nested &&
				findToolArgumentError(nested, value as Record<string, unknown>);
			if (error)
				return {
					path: [name, ...error.path],
					message: `${name}: ${error.message}`,
				};
		}
		if (property.type === "array") {
			if (!Array.isArray(value))
				return invalid(`${name} must be a list.`);
			if (
				(typeof property.minItems === "number" &&
					value.length < property.minItems) ||
				(typeof property.maxItems === "number" &&
					value.length > property.maxItems)
			)
				return invalid(`${name} has an invalid number of items.`);
			for (const [index, item] of value.entries()) {
				const itemName = `${name} ${index + 1}`;
				const error = findToolArgumentError(
					{
						properties: {
							[itemName]: readToolProperty(property.items),
						},
						required: [itemName],
					},
					{ [itemName]: item },
				);
				if (error)
					return {
						path: [name, String(index), ...error.path.slice(1)],
						message: error.message,
					};
			}
		}
		if (property.type === "string" && typeof value !== "string")
			return invalid(`${name} must be text.`);
		if (property.type === "boolean" && typeof value !== "boolean")
			return invalid(`${name} must be true or false.`);
		if (
			(property.type === "number" || property.type === "integer") &&
			(typeof value !== "number" || !Number.isFinite(value))
		)
			return invalid(`${name} must be a number.`);
		if (property.type === "integer" && !Number.isInteger(value))
			return invalid(`${name} must be an integer.`);
		if (property.enum && !property.enum.includes(String(value)))
			return invalid(`Choose a valid value for ${name}.`);
		if (
			typeof value === "number" &&
			((property.minimum !== undefined && value < property.minimum) ||
				(property.maximum !== undefined && value > property.maximum))
		)
			return invalid(`${name} is outside the allowed range.`);
		if (
			typeof value === "string" &&
			((property.minLength !== undefined &&
				value.length < property.minLength) ||
				(property.maxLength !== undefined &&
					value.length > property.maxLength))
		)
			return invalid(`${name} has an invalid length.`);
	}
	return null;
}

/** Validate the supported schema, retaining the existing generic approval API. */
export function validateToolArguments(
	schema: ToolInputSchema,
	values: Record<string, unknown>,
): string | null {
	return findToolArgumentError(schema, values)?.message ?? null;
}

/** Resolve a declared tool schema through the current room's SDK insight. */
export function useToolDefinition(tool: ConversationTool): {
	schema: ToolInputSchema | null;
	description?: string;
	isLoading: boolean;
	error: string | null;
} {
	const owner =
		tool.metadata?.SMSS_ENGINE_ID || tool.metadata?.SMSS_PROJECT_ID;
	const query = usePixel<unknown>(
		typeof owner === "string" && owner !== "__room__" && !tool.serverTool
			? pixel("GetMCPTools", { engine: owner })
			: "",
	);
	const parsed = toolsSchema.safeParse(query.data);
	const original = tool.metadata?.SMSS_ORIGINAL_TOOL_NAME;
	const found = parsed.success
		? parsed.data.tools.find(
				(entry) =>
					entry.name === original ||
					entry.name === tool.name ||
					entry.title === tool.title,
			)
		: undefined;
	const parsedInput = inputSchema.safeParse(found?.inputSchema);
	return {
		schema:
			readToolInputSchema(tool.metadata?.SMSS_TOOL_INPUT_SCHEMA) ??
			(parsedInput.success ? parsedInput.data : null),
		description: found?.description,
		isLoading:
			Boolean(owner) &&
			owner !== "__room__" &&
			!tool.serverTool &&
			["INITIAL", "LOADING"].includes(query.status),
		error:
			query.status === "ERROR"
				? "Tool fields could not be loaded. You can still review the JSON arguments."
				: null,
	};
}
