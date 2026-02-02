export type MetaSchema = Record<string, { allowedValues: string[] }>;

export const META_SCHEMA: MetaSchema = {
	office: { allowedValues: ["ABC", "DEF", "GHI"] },
	department: { allowedValues: ["IT", "HR", "Finance"] },
};
