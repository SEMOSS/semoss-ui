import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { CodeRenderer } from "@/components/project";
import { useProject } from "@/hooks";

/**
 * Live preview of the published CODE app, rendered in an iframe. The refresh
 * button remounts the iframe by bumping a key — the embedded app has no
 * reload hook of its own.
 */
export const CodeAppRendererPanel: React.FC = () => {
	const { project } = useProject();
	const [counter, setCounter] = useState(0);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
			<div className="flex w-full flex-row items-center border-border border-b bg-card px-1 py-1">
				<Button
					variant="ghost"
					size="icon-sm"
					title="Refresh"
					aria-label="Refresh app"
					data-testid="workbench-app-renderer-refresh"
					onClick={() => setCounter((count) => count + 1)}
				>
					<RefreshCw className="h-[1em] w-[1em]" />
				</Button>
			</div>
			{/* min-h-0 so the iframe fills the remaining height instead of collapsing */}
			<div className="min-h-0 w-full flex-1 overflow-hidden">
				<CodeRenderer appId={project.project_id} key={counter} />
			</div>
		</div>
	);
};
