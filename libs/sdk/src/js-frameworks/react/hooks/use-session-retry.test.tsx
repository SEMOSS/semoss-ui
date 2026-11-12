// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { getSystemConfig } from "../../../api/base";
import { ConfigStore } from "../../../stores/config/config.store";
import { SessionStore } from "../../../stores/session/session.store";
import { SessionProvider } from "../contexts/session.context";
import { useSessionRetry } from "./use-session-retry";

vi.mock("../../../api/base", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../../api/base")>()),
	getSystemConfig: vi.fn(),
}));

it("retries the provider's session and is busy while it reads", async () => {
	let failConfig = (_error: Error) => {};
	vi.mocked(getSystemConfig)
		.mockRejectedValueOnce(new Error("down"))
		.mockImplementationOnce(
			() =>
				new Promise((_resolve, reject) => {
					failConfig = reject;
				}),
		);
	const session = new SessionStore({ config: new ConfigStore() });
	const wrapper = ({ children }: { children: ReactNode }) => (
		<SessionProvider session={session}>{children}</SessionProvider>
	);
	const { result } = renderHook(() => useSessionRetry(), { wrapper });
	await act(() => session.initialize());
	expect(result.current.isRetrying).toBe(false);
	const { retry } = result.current;

	let retrying: Promise<unknown> = Promise.resolve();
	act(() => {
		retrying = retry();
	});
	expect(result.current.isRetrying).toBe(true);
	// the same retry while it reads, so a button does not re-render for it
	expect(result.current.retry).toBe(retry);

	await act(async () => {
		failConfig(new Error("still down"));
		await retrying;
	});
	expect(result.current.isRetrying).toBe(false);
	expect(session.getSnapshot().status).toBe("ERROR");
});
