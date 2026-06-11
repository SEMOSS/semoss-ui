import { useEngine } from "@/hooks";
import { DatabaseLimitsPanel } from "../settings/usage-limits/components/database-limits-panel";
import { StorageLimitsPanel } from "../settings/usage-limits/components/storage-limits-panel";
import { VectorLimitsPanel } from "../settings/usage-limits/components/vector-limits-panel";

/**
 * Engine-level usage limits tab.
 * Renders different limit panels depending on engine type:
 * - DATABASE → Record and data size limits
 * - VECTOR → Chunk, retrieval, indexing, embedding limits
 * - STORAGE → Upload/download size and file count limits
 */
export const EngineUsageLimitsPage = () => {
	const { name, type, active } = useEngine();

	const engineName = active.name || name;

	const renderPanel = () => {
		switch (type) {
			case "DATABASE":
				return (
					<DatabaseLimitsPanel
						entityId={active.id}
						entityName={engineName}
					/>
				);
			case "VECTOR":
				return (
					<VectorLimitsPanel
						entityId={active.id}
						entityName={engineName}
					/>
				);
			case "STORAGE":
				return (
					<StorageLimitsPanel
						entityId={active.id}
						entityName={engineName}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="flex w-full flex-col items-start gap-6 self-stretch">
			{renderPanel()}
		</div>
	);
};
