import { useContext } from 'react';
import { ImportedDatabaseContext } from '@/contexts/ImportedDatabaseContext';
export const ImportedDatabaseReplaceDataPage = () => {
    const { id, databaseName } = useContext(ImportedDatabaseContext);

    return <div></div>;
};
