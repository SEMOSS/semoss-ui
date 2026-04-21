import { Loader2 } from "lucide-react";
import { Button } from "@semoss/ui/next";

interface GridFooterProps {
	isBatchingEnabled: boolean;
	loadingMore: boolean;
	shouldDisableLoadMore: boolean;
	onLoadMore: () => void;
}

export const GridFooter = ({
	isBatchingEnabled,
	loadingMore,
	shouldDisableLoadMore,
	onLoadMore,
}: GridFooterProps) => {
	if (!isBatchingEnabled) return null;

	return (
		<div
			style={{
				padding: "8px",
				display: "flex",
				justifyContent: "center",
				borderTop: "1px solid rgba(224, 224, 224, 1)",
			}}
		>
			<Button
				variant="outline"
				size="sm"
				onClick={onLoadMore}
				disabled={shouldDisableLoadMore}
				className="w-full"
			>
				{loadingMore && (
					<Loader2 className="mr-1.5 size-4 animate-spin" />
				)}
				{loadingMore ? "Loading..." : "Load More"}
			</Button>
		</div>
	);
};
