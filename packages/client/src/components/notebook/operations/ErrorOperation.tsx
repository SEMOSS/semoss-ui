import { observer } from "mobx-react-lite";

interface ErrorOperationProps {
	/** Message returned when there is an error */
	output: string;
}

/**
 * Render the content of a cell in the notebook
 */
export const ErrorOperation = observer(
	(props: ErrorOperationProps): JSX.Element => {
		const { output } = props;

		return <span className="text-destructive text-xs">{output}</span>;
	},
);
