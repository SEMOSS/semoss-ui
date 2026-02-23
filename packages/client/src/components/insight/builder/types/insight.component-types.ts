/**
 * Component type definitions for the Insight Builder
 */

export interface ComponentTypeDefinition {
	id: string;
	name: string;
	category: "block";
}

/**
 * Block-based component types (uses actual block components from renderer)
 */
export const BLOCK_COMPONENT_TYPES: ComponentTypeDefinition[] = [
	{
		id: "grid-block",
		name: "Data Grid",
		category: "block",
	},
	{
		id: "visualization-block",
		name: "Visualization",
		category: "block",
	},
	{
		id: "visualization-filter-block",
		name: "Visualization Filter",
		category: "block",
	},
	{
		id: "html-block",
		name: "HTML Block",
		category: "block",
	},
];

/**
 * All available component types for the Insight Builder
 */
export const COMPONENT_TYPES: ComponentTypeDefinition[] = [
	...BLOCK_COMPONENT_TYPES,
];

/**
 * Get component type by ID
 */
export const getComponentType = (
	id: string,
): ComponentTypeDefinition | undefined => {
	return COMPONENT_TYPES.find((type) => type.id === id);
};

/**
 * Generate component prompt for AI-generated visualizations
 */
export const generateComponentPrompt = (basePrompt: string): string => {
	return basePrompt;
};
