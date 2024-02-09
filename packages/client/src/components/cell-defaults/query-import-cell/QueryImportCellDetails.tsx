import { CellComponent } from '@/stores';
import { QueryImportCellDef } from './config';
import { DatabaseTables } from './DatabaseTables';

export const QueryImportCellDetails: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const { cell, isExpanded } = props;

    if (!isExpanded) {
        return <></>;
    }

    return (
        <>
            {cell.parameters.databaseId && (
                <DatabaseTables databaseId={cell.parameters.databaseId} />
            )}
        </>
    );
};
