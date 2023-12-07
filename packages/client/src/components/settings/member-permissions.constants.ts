export const PERMISSION_DESCRIPTION_MAP: Record<
    string,
    Record<string, string>
> = {
    Function: {
        Author: 'Ability to hide or delete the function, provision other authors, and all editor permissions',
        Editor: 'Ability to edit the function code, provision other users as editors and read-only users, and all read-only permissions',
        ['Read-Only']: 'Ability to execute the function',
    },
    App: {
        Author: 'Ability to hide or delete the data app, provision other authors and all editor permissions',
        Editor: 'Ability to edit the data app code, provision other users as editors and read only users, and all  read-only permissions',
        ['Read-Only']:
            'Ability to view the data app. User still requires permission to all dependent databases, models, remote storage, vector databases, etc',
    },
    Model: {
        Author: 'Ability to edit the model connection details, set the model as discoverable, delete the model, provision other authors, and all editor permissions',
        Editor: 'Ability to edit the model details, provision other users as editors and read-only users, and all read-only permissions',
        'Read-Only': 'Ability to run the model',
    },
    VectorDb: {
        Author: 'Ability to hide or delete the vector database, provision other authors, and all editor permissions',
        Editor: 'Ability to add and remove files from the vector database, and all read-only permissions',
        'Read-Only': 'Ability to query against the vector database',
    },
    Storage: {
        Author: 'Ability to hide or delete the remote storage, provision other authors, and all editor permissions',
        Editor: 'Ability to push and delete files from the remote storage, and all read-only permissions',
        'Read-Only': 'Ability to view and pull files from the remote storage',
    },
    Database: {
        Author: 'Ability to edit the database connection details, set the database as discoverable, delete the database, provision other authors, and all editor permissions',
        Editor: 'Ability to edit the database structure, provision other users as editors and read-only users, and all read-only permissions',
        'Read-Only': 'Ability to query and read data from the database',
    },
};
