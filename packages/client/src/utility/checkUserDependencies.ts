// Utility to check which dependencies a user has access to
// Usage: await checkUserDependencies(dependenciesArray, userId, monolithStore)

/**
 * Checks which dependencies a user has access to by calling GetEngineUserPermission for each dependency.
 * @param dependencies Array of dependency objects (must have .id)
 * @param userId The user id to check
 * @param monolithStore The monolithStore instance (must have runQuery)
 * @returns Promise<{ hasAccess: string[], noAccess: string[] }>
 */
/**
 * Checks which dependencies a user has access to by fetching the user list for each dependency.
 * For engines, uses getEngineUsers; for projects, uses getProjectUsers.
 * @param dependencies Array of dependency objects (must have .id and .type)
 * @param userId The user id to check
 * @param monolithStore The monolithStore instance (must have getEngineUsers/getProjectUsers)
 * @param adminMode Boolean, whether admin mode is enabled
 * @returns Promise<{ hasAccess: string[], noAccess: string[] }>
 */
export async function checkUserDependencies(
    dependencies,
    userId,
    monolithStore,
    adminMode = false,
) {
    const hasAccess = [];
    const noAccess = [];
    const permissions = {};
    for (const dep of dependencies) {
        try {
            let users = [];
            // Engine (DATABASE, STORAGE, MODEL, VECTOR, FUNCTION, etc.)
            const result = await monolithStore.getEngineUsers(
                adminMode,
                dep.engine_id,
                '',
                '',
                0,
                1000,
            );
            users = result?.members || [];
            const userObj = users.find((u) => u.id === userId);
            if (userObj) {
                hasAccess.push(dep.engine_id);
                permissions[dep.engine_id] = userObj.permission || 'Read-Only';
            } else {
                noAccess.push(dep.engine_id);
            }
        } catch {
            noAccess.push(dep.engine_id);
        }
    }
    return { hasAccess, noAccess, permissions };
}
