import type { CatalogType } from "@semoss/shared";
import { useCatalogDependencyWarning } from "./use-catalog-dependency-warning";

interface CatalogDependencyWarningProps {
	/** The owner's id */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
}

/**
 * Warns once when the user lacks access to any of an engine's or a project's
 * dependencies. Renders nothing; it exists so a page can run the check inside
 * the `InsightProvider` it renders.
 */
export const CatalogDependencyWarning = ({
	catalogId,
	catalogType,
}: CatalogDependencyWarningProps) => {
	useCatalogDependencyWarning({ catalogId, catalogType });
	return null;
};
