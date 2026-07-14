import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string.
 * @param inputs - The class names to combine.
 * @returns The combined class names.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * The name to actually display for a tool call — real playground renders
 * the backend's clean `title` verbatim rather than the raw `name` (often a
 * project-id-prefixed reactor identifier), only falling back to `name`
 * before `title` has arrived (mid-stream) or for older data that never had
 * one.
 */
export function toolCallDisplayName(toolCall: {
	name: string;
	title?: string;
}): string {
	return toolCall.title || toolCall.name;
}
