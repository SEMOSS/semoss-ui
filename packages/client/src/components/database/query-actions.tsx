import type React from "react";
import { Button } from "@semoss/ui/next";

interface QueryActionsProps {
	clearQuery: () => void;
	executeQuery: () => void;
	previewLoading: boolean;
	query: string;
}

export const QueryActions: React.FC<QueryActionsProps> = ({
	executeQuery,
	previewLoading,
	query,
}) => {
	return (
		<div className="flex flex-shrink-0 items-center justify-end border-border/50 border-t px-4 py-2">
			<Button
				variant="default"
				onClick={executeQuery}
				disabled={previewLoading || !query.trim()}
				data-testid="query-run-btn"
			>
				{previewLoading ? "Running..." : "Run Query"}
			</Button>
		</div>
	);
};
