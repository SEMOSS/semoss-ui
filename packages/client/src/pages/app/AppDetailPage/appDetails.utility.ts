/**
 * PIXEL CALLS -------------------------------------------------
 */
export const fetchAppInfo = async (monolithStore: any, appId: string) => {
    const res = await monolithStore.runQuery(`ProjectInfo(project="${appId}")`);

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    if (type.indexOf('ERROR') === -1) {
        return {
            type: 'success',
            output,
        };
    } else {
        return {
            type: 'error',
            output,
        };
    }
};

export const fetchMainUses = async (monolithStore: any, appId: string) => {
    const res = await monolithStore.runQuery(
        `GetProjectMarkdown(project="${appId}")`,
    );

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    if (type.indexOf('ERROR') === -1) {
        return {
            type: 'success',
            output,
        };
    } else {
        return {
            type: 'error',
            output,
        };
    }
};

export const fetchDependencies = async (monolithStore: any, appId: string) => {
    const res = await monolithStore.runQuery(
        `GetProjectDependencies(project="${appId}", details=[true])`,
    );

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    if (type.indexOf('ERROR') === -1) {
        return {
            type: 'success',
            output,
        };
    } else {
        return {
            type: 'error',
            output,
        };
    }
};
