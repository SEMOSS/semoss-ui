import { type Context, useContext } from "react";

export function useRequiredContext<Value>(
	context: Context<Value | null>,
	name: string,
) {
	const value = useContext(context);
	if (!value) throw new Error(`${name} must be used within its provider`);
	return value;
}
