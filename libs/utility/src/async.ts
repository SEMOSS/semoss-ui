/** Resolve after the requested delay without accessing timers at import time. */
export const sleep = (milliseconds: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));
