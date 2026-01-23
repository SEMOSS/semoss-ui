import { Button, CircularProgress } from "@semoss/ui";

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
				variant="outlined"
				size="small"
				onClick={onLoadMore}
				disabled={shouldDisableLoadMore}
				startIcon={loadingMore ? <CircularProgress size={16} /> : null}
				sx={{ width: "100%" }}
			>
				{loadingMore ? "Loading..." : "Load More"}
			</Button>
		</div>
	);
};
