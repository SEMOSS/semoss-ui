export interface AgentCardProps {
	name: string;
}

// const StyledCardItem = styled(Stack)(({ theme }) => ({
// 	display: "flex",
// 	width: "100%",
// 	backgroundColor: theme.palette.background.paper,
// 	borderWidth: "1px",
// 	borderStyle: "solid",
// 	borderColor: "rgba(64, 160, 255, 0.50)",
// 	borderRadius: theme.shape.borderRadius,
// 	cursor: "pointer",
// 	padding: theme.spacing(3),
// 	flexDirection: "column",
// 	alignItems: "flex-start",
// 	gap: theme.spacing(1),
// 	minWidth: "0",
// }));

// const StyledGridCard = styled(Grid)(({ theme }) => ({
// 	background: theme.palette.background.paper,
// 	paddingLeft: "0",
// 	paddingTop: "0",
// }));

/**
 * Renders a card representing an agent
 *
 * @component
 */
export const AgentCard = ({ name }: AgentCardProps) => {
	return <div>{name}</div>;
};
