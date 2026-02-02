import type { User } from "../types/user";
import { MOCK_USERS } from "./mockUsers";

const ACTIVE_USER_ID = "user-abc-it";
// const ACTIVE_USER_ID = "user-def-hr";
// const ACTIVE_USER_ID = "user-multi";
// const ACTIVE_USER_ID = "user-no-meta";

export const getCurrentUser = (): User => {
	const u = MOCK_USERS.find((x) => x.userId === ACTIVE_USER_ID);
	if (!u) throw new Error(`Unknown userId: ${ACTIVE_USER_ID}`);
	return u;
};
