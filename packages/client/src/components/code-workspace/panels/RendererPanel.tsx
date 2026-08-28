import { RefreshCw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";
import { CodeRenderer } from "../CodeRenderer";

export const RendererPanel = observer(() => {
	// App ID Needed for pixel calls
	const { workspace } = useWorkspace();

	// temporary fix for dead refresh button should be removed
	const [counter, setCounter] = useState(0);

	return (
		<Panel
			actions={
				<Button
					variant="ghost"
					size="icon-sm"
					title={"Refresh"}
					onClick={() => {
						// refreshApp();
						setCounter(counter + 1);
					}}
				>
					<RefreshCw className="h-[1em] w-[1em]" />
				</Button>
			}
		>
			<CodeRenderer appId={workspace.appId} key={counter} />
		</Panel>
	);
});
