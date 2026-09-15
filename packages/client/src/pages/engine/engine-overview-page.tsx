import { observer } from "mobx-react-lite";
import { EngineOverview } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineOverviewPage = observer(() => {
	const { engine, permission, refresh } = useEngine();

	return (
		<EngineOverview
			engine={engine}
			permission={permission}
			refresh={refresh}
		/>
	);
});
