/**
 * RPC (Remote Procedure Call) system for communication between
 * background script and content script
 * Adapted from Taxy AI's pageRPC.ts
 */

import ripple from "./ripple";

// Helper function for delays
export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get unique CSS selector for an element by its data-id
 */
export function getUniqueElementSelector(elementId: number): string {
	return `[data-id="${elementId}"]`;
}

/**
 * Available RPC methods that can be called from background script
 */
export const rpcMethods = {
	/**
	 * Get unique selector for an element
	 */
	getUniqueElementSelector,

	/**
	 * Show ripple effect at coordinates
	 */
	ripple,
} as const;

export type RPCMethods = typeof rpcMethods;
type MethodName = keyof RPCMethods;
type Payload<T extends MethodName> = Parameters<RPCMethods[T]>;
type MethodRT<T extends MethodName> = ReturnType<RPCMethods[T]>;

/**
 * Call an RPC method from background script
 * Includes retry logic for reliability
 */
export const callRPC = async <T extends MethodName>(
	type: T,
	payload?: Payload<T>,
	maxTries = 3,
): Promise<Awaited<MethodRT<T>>> => {
	const queryOptions = { active: true, currentWindow: true };
	const tabs = await chrome.tabs.query(queryOptions);
	const activeTab = tabs[0];

	if (!activeTab?.id) throw new Error("No active tab found");

	let lastError: unknown;

	for (let i = 0; i < maxTries; i++) {
		try {
			const response = await chrome.tabs.sendMessage(activeTab.id, {
				type,
				payload: payload || [],
			});
			return response;
		} catch (e) {
			lastError = e;
			if (i < maxTries - 1) {
				// Content script may not have loaded yet, retry after delay
				console.warn(
					`RPC call failed (attempt ${i + 1}/${maxTries}), retrying...`,
					e,
				);
				await sleep(1000);
			}
		}
	}

	const errorMsg =
		lastError instanceof Error ? lastError.message : String(lastError);
	throw new Error(`RPC call failed after ${maxTries} attempts: ${errorMsg}`);
};

const isKnownMethodName = (type: string): type is MethodName => {
	return type in rpcMethods;
};

// Type guard for promises
function isPromise(value: unknown): value is Promise<unknown> {
	return (
		value !== null &&
		value !== undefined &&
		typeof value === "object" &&
		"then" in value &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

/**
 * Initialize RPC listener in content script
 * This should be called when the content script loads
 */
export const initializeRPC = () => {

	chrome.runtime.onMessage.addListener(
		(message, _sender, sendResponse): true | undefined => {
			const type = message.type;

			if (isKnownMethodName(type)) {
				try {
					// @ts-expect-error - payload types are dynamic
					const resp = rpcMethods[type](...(message.payload || []));

					// Handle both sync and async responses
					if (isPromise(resp)) {
						resp.then((resolvedResp: unknown) => {
							sendResponse(resolvedResp);
						}).catch((error: unknown) => {
							console.error(`RPC method ${type} failed:`, error);
							sendResponse({
								error:
									error instanceof Error
										? error.message
										: String(error),
							});
						});

						return true; // Keep channel open for async response
					} else {
						// Synchronous response
						sendResponse(resp);
					}
				} catch (error) {
					console.error(`RPC method ${type} failed:`, error);
					sendResponse({
						error:
							error instanceof Error
								? error.message
								: String(error),
					});
				}
			}
		},
	);
};
