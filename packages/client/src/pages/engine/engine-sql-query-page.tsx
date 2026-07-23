import { observer } from "mobx-react-lite";
import { QueryWorkspace } from "@/components/query-workspace/query-workspace";
import { useEngine } from "@/hooks";

export const EngineSqlQueryPage = observer(() => {
	const { engine } = useEngine();

	return (
		<div className="h-[calc(100vh-200px)] w-full overflow-hidden">
			<QueryWorkspace engine={engine.engine_id} mode="SQL" />
		</div>
	);
});
