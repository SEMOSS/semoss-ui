import { GrantedAccess } from "@/features/granted-access/granted-access";

/**
 * The Resource Delegated Access page: the permissions the engines and projects the
 * signed in user can edit give apps, agents and engines, read and changed with
 * the user's own permissions, in admin mode too. Admins see every one on All
 * Resource Delegated Access.
 */
export const ResourceDelegatedAccessPage = () => <GrantedAccess />;
