import { observer } from "mobx-react-lite";
import { QueryWorkspace } from "@/components/query-workspace/query-workspace";
import { useEngine } from "@/hooks";

export const EngineSqlQueryPage = observer(() => {
	const { active } = useEngine();
	const engineId = active.id || "";

	return (
		<div className="h-[calc(100vh-200px)] w-full overflow-hidden">
			<QueryWorkspace engine={engineId} mode="SQL" />
		</div>
	);
});
