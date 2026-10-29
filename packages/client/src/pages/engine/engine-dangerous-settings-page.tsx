import { DeleteResourceCard } from "@/features/resource-delete/delete-resource-card";
import { useEngine } from "@/hooks/useEngine";
import { useNavigate } from "@/hooks/useNavigate";

/**
 * The Dangerous section of an engine's Settings: deleting the engine, which
 * goes back to its catalog after.
 */
export const EngineDangerousSettingsPage = () => {
	const { catalog, type, engine } = useEngine();
	const navigate = useNavigate();

	return (
		<DeleteResourceCard
			type={type}
			id={engine.engine_id}
			name={engine.engine_display_name || engine.engine_name}
			label={catalog.name}
			onDeleted={() => navigate(catalog.path)}
		/>
	);
};
