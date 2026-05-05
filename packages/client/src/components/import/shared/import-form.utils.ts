import type { FormField } from "./import-form.types";

export function computeVisibility(
	field: FormField,
	watched: Record<string, unknown>,
): boolean {
	if (!field.showWhen) return field.hidden !== true;
	const rules = Array.isArray(field.showWhen)
		? field.showWhen
		: [field.showWhen];
	return rules.every((rule) => {
		const val = String(watched[rule.field] ?? "").toLowerCase();
		if (rule.oneOf)
			return rule.oneOf.map((v) => v.toLowerCase()).includes(val);
		if (rule.notOneOf)
			return !rule.notOneOf.map((v) => v.toLowerCase()).includes(val);
		if (rule.eq !== undefined) return String(rule.eq).toLowerCase() === val;
		return true;
	});
}

export function computeOptions(
	field: FormField,
	watched: Record<string, unknown>,
): Array<{ display: string; value: string }> {
	const base = field.options?.options ?? [];
	if (!field.optionsWhen) return base;
	for (const rule of field.optionsWhen) {
		if (
			String(watched[rule.field] ?? "").toLowerCase() ===
			rule.eq.toLowerCase()
		) {
			return base.filter((o) => rule.restrictTo.includes(o.value));
		}
	}
	return base;
}
