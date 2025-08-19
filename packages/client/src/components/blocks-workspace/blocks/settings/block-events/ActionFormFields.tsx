import { ActionMessages } from "@semoss/renderer";
import { BlockEventNameSelector } from "./BlockEventNameSelector";
import { CellIdSelector } from "./CellIdSelector";
import { QueryIdSelector } from "./QueryIdSelector";
import { RedirectDestinationSelector } from "./RedirectDestinationSelector";
import { VariableIdSelector } from "./VariableIdSelector";

interface ActionFormFieldsProps {
	message: ActionMessages;
	control: any;
	setValue: any;
	queries: any[];
	cells: any[];
	queryId: string;
	destinationType: string;
	pages: any[];
	variables: any;
}

export const ActionFormFields = ({
	message,
	control,
	setValue,
	queries,
	cells,
	queryId,
	destinationType,
	pages,
	variables,
	}: ActionFormFieldsProps) => {
	const renderFields = () => {
		switch (message) {
			case ActionMessages.RUN_QUERY:
				return <QueryIdSelector control={control} queries={queries} />;

			case ActionMessages.RUN_CELL:
				return (
					<>
						<QueryIdSelector
							control={control}
							queries={queries}
							label="Notebook"
						/>
						<CellIdSelector
							control={control}
							cells={cells}
							queryId={queryId}
						/>
					</>
				);

			case ActionMessages.DISPATCH_EVENT:
				return <BlockEventNameSelector control={control} />;

			case ActionMessages.DISPATCH_OPEN_EVENT:
				return (
					<RedirectDestinationSelector
						control={control}
						setValue={setValue}
						destinationType={destinationType}
						pages={pages}
					/>
				);

			case ActionMessages.DISPATCH_OUTPUTS_EVENT:
				return null;

			case ActionMessages.SET_DATA_VARIABLE:
				return (
					<>
						<VariableIdSelector control={control} variables={variables || []} />
					</>
				);

			default:
				return null;
		}
	};

	return <>{renderFields()}</>;
};
