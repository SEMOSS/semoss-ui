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

/** Validate the supported schema without coercing empty numbers or dropping optional arguments. */
export function validateToolArguments(
	schema: ToolInputSchema,
	values: Record<string, unknown>,
): string | null {
	for (const name of schema.required)
		if (!(name in values)) return `${name} is required.`;
	for (const [name, value] of Object.entries(values)) {
		const property = schema.properties[name];
		if (!property) continue;
		if (property.type === "string" && typeof value !== "string")
			return `${name} must be text.`;
		if (property.type === "boolean" && typeof value !== "boolean")
			return `${name} must be true or false.`;
		if (
			(property.type === "number" || property.type === "integer") &&
			(typeof value !== "number" || !Number.isFinite(value))
		)
			return `${name} must be a number.`;
		if (property.type === "integer" && !Number.isInteger(value))
			return `${name} must be an integer.`;
		if (property.enum && !property.enum.includes(String(value)))
			return `Choose a valid value for ${name}.`;
		if (
			typeof value === "number" &&
			((property.minimum !== undefined && value < property.minimum) ||
				(property.maximum !== undefined && value > property.maximum))
		)
			return `${name} is outside the allowed range.`;
		if (
			typeof value === "string" &&
			((property.minLength !== undefined &&
				value.length < property.minLength) ||
				(property.maxLength !== undefined &&
					value.length > property.maxLength))
		)
			return `${name} has an invalid length.`;
	}
	return null;
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
		schema: parsedInput.success ? parsedInput.data : null,
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
