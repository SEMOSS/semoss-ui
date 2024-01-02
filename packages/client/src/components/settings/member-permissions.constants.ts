export const PERMISSION_DESCRIPTION_MAP: Record<
    string,
    Record<string, string>
> = {
    function: {
        author: 'Ability to hide or delete the function, provision other authors, and all editor permissions',
        editor: 'Ability to edit the function code, provision other users as editors and read-only users, and all read-only permissions',
        readonly: 'Ability to execute the function',
    },
    app: {
        author: 'Ability to hide or delete the data app, provision other authors and all editor permissions',
        editor: 'Ability to edit the data app code, provision other users as editors and read only users, and all  read-only permissions',
        readonly:
            'Ability to view the data app. User still requires permission to all dependent databases, models, remote storage, vector databases, etc',
    },
    model: {
        author: 'Ability to edit the model connection details, set the model as discoverable, delete the model, provision other authors, and all editor permissions',
        editor: 'Ability to edit the model details, provision other users as editors and read-only users, and all read-only permissions',
        readonly: 'Ability to run the model',
    },
    storage: {
        author: 'Ability to hide or delete the remote storage, provision other authors, and all editor permissions',
        editor: 'Ability to push and delete files from the remote storage, and all read-only permissions',
        readonly: 'Ability to view and pull files from the remote storage',
    },
    database: {
        author: 'Ability to edit the database connection details, set the database as discoverable, delete the database, provision other authors, and all editor permissions',
        editor: 'Ability to edit the database structure, provision other users as editors and read-only users, and all read-only permissions',
        readonly: 'Ability to query and read data from the database',
    },
    vector: {
        author: 'Ability to hide or delete the vector database, provision other authors, and all editor permissions',
        editor: 'Ability to add and remove files from the vector database, and all read-only permissions',
        readonly: 'Ability to query against the vector database',
    },
};
