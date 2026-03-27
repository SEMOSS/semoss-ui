import type React from "react";
import { Box, Button, styled } from "@semoss/ui";

const StyledActions = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(1, 0),
	borderTop: `1px solid ${theme.palette.divider}`,
	flexShrink: 0,
	"& > :first-of-type": {
		marginLeft: "20px",
	},
	"& > :last-child": {
		marginRight: "20px",
	},
}));

interface QueryActionsProps {
	clearQuery: () => void;
	executeQuery: () => void;
	previewLoading: boolean;
	query: string;
	// limit: number;
	// setLimit: (limit: number) => void;
}

export const QueryActions: React.FC<QueryActionsProps> = ({
	executeQuery,
	previewLoading,
	query,
	// limit,
	// setLimit,
}) => {
	// const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	//     const value = parseInt(event.target.value, 10);
	//     if (!isNaN(value) && value > 0) {
	//         setLimit(value);
	//     }
	// };

	return (
		<StyledActions>
			<Box sx={{ display: "flex", gap: 1 }}>
				<Button
					variant="outlined"
					onClick={executeQuery}
					sx={{ textTransform: "none" }}
					disabled={previewLoading || !query.trim()}
				>
					{previewLoading ? "Running..." : "Run Query"}
				</Button>
			</Box>
		</StyledActions>
	);
};
