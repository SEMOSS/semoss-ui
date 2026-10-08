import type { ToolCallOutcome, ToolViewCall } from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import type { ConnectorAccount } from "./connector.types";

/*
 * Reading a tool call for a connector's tool views. A call's arguments are
 * the model's, so a value can arrive as the reactor declares it or in a
 * looser form, such as a list as one comma separated string.
 */

/** A tool call's arguments, as the view receives them. */
export type ToolArguments = Readonly<Record<string, unknown>>;

/**
 * The account a tool view reads: the URI's `provider`, which the connector
 * reactors always declare, or else the one the reactor's name starts with.
 *
 * @param params - The view's URI parameters.
 * @param functionName - The reactor the call runs, such as `GoogleGmailSendMail`.
 * @return The account; Microsoft when neither names Google.
 */
export const readToolAccount = (
	params: Readonly<Record<string, string>>,
	functionName: string,
): ConnectorAccount => {
	if (params.provider === "microsoft" || params.provider === "google") {
		return params.provider;
	}
	return functionName.startsWith("Google") ? "google" : "microsoft";
};

/**
 * What a call returned, read as JSON.
 *
 * @param call - The call.
 * @return The parsed output, the text itself when it is not JSON, or
 * undefined before the call ran.
 */
export const readToolResult = (call: ToolViewCall): unknown => {
	if (call.result === undefined || call.result === "") {
		return undefined;
	}
	return tryParseJson(call.result) ?? call.result;
};

/**
 * What the user did instead of a call, when the call was resolved that way
 * rather than run.
 *
 * @param result - The call's parsed result.
 * @return The outcome, or null when the call ran.
 */
export const readToolOutcome = (result: unknown): ToolCallOutcome | null =>
	isRecord(result) &&
	typeof result.userAction === "string" &&
	typeof result.summary === "string"
		? {
				userAction: result.userAction,
				summary: result.summary,
				result: result.result,
			}
		: null;

/**
 * A text argument.
 *
 * @param args - The call's arguments.
 * @param key - The argument.
 * @return Its text, or an empty string.
 */
export const readArgText = (args: ToolArguments, key: string): string => {
	const value = args[key];
	if (typeof value === "string") {
		return value;
	}
	return typeof value === "number" ? String(value) : "";
};

/**
 * A list argument, such as recipients. A single string counts as a comma or
 * semicolon separated list.
 *
 * @param args - The call's arguments.
 * @param key - The argument.
 * @return Its values, trimmed, without blanks.
 */
export const readArgList = (args: ToolArguments, key: string): string[] => {
	const value = args[key];
	const items = Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: typeof value === "string"
			? value.split(/[,;]/)
			: [];
	return items.map((item) => item.trim()).filter(Boolean);
};

/**
 * A yes or no argument. Models sometimes quote them.
 *
 * @param args - The call's arguments.
 * @param key - The argument.
 * @param fallback - What a missing value means, as the reactor reads it.
 * @return The value.
 */
export const readArgFlag = (
	args: ToolArguments,
	key: string,
	fallback = false,
): boolean => {
	const value = args[key];
	if (value === true || value === "true") {
		return true;
	}
	if (value === false || value === "false") {
		return false;
	}
	return fallback;
};

/**
 * Whether one entry of an address list is an address, alone or after a
 * name, as in `Ada Lovelace <ada@example.com>`.
 *
 * @param entry - The entry.
 * @return Whether it is an address.
 */
export const isAddressEntry = (entry: string): boolean =>
	z.email().safeParse(entry.match(/<([^<>]+)>$/)?.[1] ?? entry).success;

/**
 * Split what a person typed into a list, such as addresses.
 *
 * @param value - The text.
 * @return The values, trimmed, without blanks.
 */
export const splitList = (value: string): string[] =>
	value
		.split(/[,;\n]/)
		.map((item) => item.trim())
		.filter(Boolean);
