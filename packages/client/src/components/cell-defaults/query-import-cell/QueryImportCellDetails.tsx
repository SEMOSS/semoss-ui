import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks } from '@/hooks';
import { QueryImportCellDef } from './config';
import { DatabaseTables } from './DatabaseTables';

export const QueryImportCellDetails: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const { cell } = props;

    return (
        <>
            {cell.parameters.databaseId && (
                <DatabaseTables databaseId={cell.parameters.databaseId} />
            )}
        </>
    );
};
