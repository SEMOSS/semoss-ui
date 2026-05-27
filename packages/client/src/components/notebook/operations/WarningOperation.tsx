import { observer } from "mobx-react-lite";

interface WarningOperationProps {
	/** Message returned when there is an error */
	output: string;
}

/**
 * Render the content of a cell in the notebook
 */
export const WarningOperation = observer(
	(props: WarningOperationProps): JSX.Element => {
		const { output } = props;

		return <span className="text-xs text-yellow-600">{output}</span>;
	},
);
