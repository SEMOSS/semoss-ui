// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "../../../api/base";
import { ConfigStore } from "../../../stores/config/config.store";
import { InsightStore } from "../../../stores/insight/insight.store";
import { SessionStore } from "../../../stores/session/session.store";
import { InsightContext } from "../contexts/insight.context";
import { SessionProvider } from "../contexts/session.context";
import { useInsightPixel } from "./use-insight-pixel";
import { usePixel } from "./use-pixel";
import { useSessionPixel } from "./use-session-pixel";

vi.mock("../../../api/base", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../../api/base")>()),
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);
const answer = (
	output: unknown = "output",
	operationType = ["CONST_STRING"],
) => ({
	insightId: "returned-insight",
	errors: operationType.includes("ERROR") ? ["failed"] : [],
	pixelReturn: [
		{
			output,
			operationType,
			isMeta: true,
			pixelExpression: "Read();",
			pixelId: "1",
			timeToRun: 0,
		},
	],
});
const createSession = () => new SessionStore({ config: new ConfigStore() });
const setInsight = async (session: SessionStore, insightId: string) => {
	await act(async () => {
		await session.insight.withInsight(async () => ({ insightId }));
	});
};
const workspace = new InsightStore();
const Wrapper = ({
	children,
	session,
	insightId,
}: {
	children: ReactNode;
	session: SessionStore;
	insightId: string;
}) => (
	<SessionProvider session={session}>
		<InsightContext.Provider
			value={{
				insightId,
				isInitialized: true,
				isAuthorized: true,
				isReady: Boolean(insightId),
				error: null,
				system: workspace.system,
				actions: workspace.actions,
			}}
		>
			{children}
		</InsightContext.Provider>
	</SessionProvider>
);

beforeEach(() => {
	mockRunPixel.mockReset();
	mockRunPixel.mockResolvedValue(answer());
});
afterEach(cleanup);

describe("useSessionPixel", () => {
	it("waits for a session ID, ignoring workspace context and initialization actions", async () => {
		const session = createSession();
		const initialize = vi.spyOn(session, "initialize");
		const ensure = vi.spyOn(session.insight, "ensure");
		const run = vi.spyOn(session.insight, "run");
		const { result } = renderHook(() => useSessionPixel("Read();"), {
			wrapper: ({ children }) => (
				<Wrapper session={session} insightId="workspace">
					{children}
				</Wrapper>
			),
		});
		expect(result.current.status).toBe("INITIAL");
		expect(mockRunPixel).not.toHaveBeenCalled();

		await setInsight(session, "session-1");
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(mockRunPixel).toHaveBeenCalledExactlyOnceWith(
			"Read();",
			"session-1",
		);
		expect(initialize).not.toHaveBeenCalled();
		expect(ensure).not.toHaveBeenCalled();
		expect(run).not.toHaveBeenCalled();
	});

	it("drops old results when the session ID clears and resumes with the replacement", async () => {
		const session = createSession();
		await setInsight(session, "old");
		let finish: (value: ReturnType<typeof answer>) => void = () => {};
		mockRunPixel.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(
			() =>
				useSessionPixel("Read();", {
					data: "initial",
					onSuccess,
					onFinal,
				}),
			{
				wrapper: ({ children }) => (
					<SessionProvider session={session}>
						{children}
					</SessionProvider>
				),
			},
		);
		expect(result.current.status).toBe("LOADING");
		act(() => session.insight.clear());
		expect(result.current.status).toBe("INITIAL");
		await act(async () => {
			finish(answer("stale"));
		});
		expect(result.current.data).toBe("initial");
		expect(onSuccess).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();

		await setInsight(session, "new");
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(mockRunPixel).toHaveBeenLastCalledWith("Read();", "new");
	});

	it("keeps consumer state independent and refreshes only the requesting consumer", async () => {
		const session = createSession();
		await setInsight(session, "session-1");
		const { result } = renderHook(
			() => ({
				first: useSessionPixel<string>("First();"),
				second: useSessionPixel<string>("Second();"),
			}),
			{
				wrapper: ({ children }) => (
					<SessionProvider session={session}>
						{children}
					</SessionProvider>
				),
			},
		);
		await waitFor(() =>
			expect(result.current.second.status).toBe("SUCCESS"),
		);
		act(() => result.current.first.update("edited"));
		expect(result.current.first.data).toBe("edited");
		expect(result.current.second.data).toBe("output");
		act(() => result.current.first.refresh());
		await waitFor(() => expect(mockRunPixel).toHaveBeenCalledTimes(3));
		expect(mockRunPixel).toHaveBeenLastCalledWith("First();", "session-1");
	});

	it("unsubscribes and ignores pending results on unmount under StrictMode", async () => {
		const session = createSession();
		await setInsight(session, "session-1");
		let finish: (value: ReturnType<typeof answer>) => void = () => {};
		const pending = new Promise<ReturnType<typeof answer>>((resolve) => {
			finish = resolve;
		});
		mockRunPixel.mockReturnValue(pending);
		const unsubscribe = vi.fn();
		const subscribe = session.insight.subscribe;
		vi.spyOn(session.insight, "subscribe").mockImplementation(
			(listener) => {
				const stop = subscribe(listener);
				return () => {
					stop();
					unsubscribe();
				};
			},
		);
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { unmount } = renderHook(
			() => useSessionPixel("Read();", { onSuccess, onFinal }),
			{
				reactStrictMode: true,
				wrapper: ({ children }) => (
					<SessionProvider session={session}>
						{children}
					</SessionProvider>
				),
			},
		);
		unmount();
		await act(async () => {
			finish(answer());
		});
		expect(unsubscribe).toHaveBeenCalledTimes(2);
		expect(onSuccess).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();
	});
});

describe("useInsightPixel", () => {
	it("requires workspace context", () => {
		expect(() => renderHook(() => useInsightPixel("Read();"))).toThrow(
			"useInsight must be used within InsightProvider",
		);
		expect(mockRunPixel).not.toHaveBeenCalled();
	});

	it("waits for a workspace ID without falling back to the session", async () => {
		const session = createSession();
		await setInsight(session, "session-1");
		let insightId = "";
		const { result, rerender } = renderHook(
			() => useInsightPixel("Read();"),
			{
				wrapper: ({ children }) => (
					<Wrapper session={session} insightId={insightId}>
						{children}
					</Wrapper>
				),
			},
		);
		expect(result.current.status).toBe("INITIAL");
		expect(mockRunPixel).not.toHaveBeenCalled();
		insightId = "workspace";
		rerender();
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(mockRunPixel).toHaveBeenCalledExactlyOnceWith(
			"Read();",
			"workspace",
		);
		insightId = "";
		rerender();
		expect(result.current.status).toBe("INITIAL");
		expect(mockRunPixel).toHaveBeenCalledTimes(1);
	});

	it("handles changed pixels, empty pixels, and latest callbacks", async () => {
		const session = createSession();
		const onSuccess = vi.fn();
		const nextSuccess = vi.fn();
		const { result, rerender } = renderHook(
			({ pixel, callback }) =>
				useInsightPixel(pixel, {
					data: "initial",
					onSuccess: callback,
				}),
			{
				initialProps: { pixel: "First();", callback: onSuccess },
				wrapper: ({ children }) => (
					<Wrapper session={session} insightId="workspace">
						{children}
					</Wrapper>
				),
			},
		);
		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("output"));
		rerender({ pixel: "Second();", callback: nextSuccess });
		await waitFor(() => expect(nextSuccess).toHaveBeenCalledWith("output"));
		expect(mockRunPixel).toHaveBeenLastCalledWith("Second();", "workspace");
		rerender({ pixel: "", callback: nextSuccess });
		expect(result.current.status).toBe("INITIAL");
		expect(result.current.data).toBe("initial");
		expect(mockRunPixel).toHaveBeenCalledTimes(2);
	});

	it.each(["transport", "pixel", "empty"])(
		"surfaces %s errors and final callbacks",
		async (failure) => {
			if (failure === "transport")
				mockRunPixel.mockRejectedValueOnce(new Error("offline"));
			if (failure === "pixel")
				mockRunPixel.mockResolvedValueOnce(answer("failed", ["ERROR"]));
			if (failure === "empty")
				mockRunPixel.mockResolvedValueOnce({
					insightId: "workspace",
					errors: [],
					pixelReturn: [],
				});
			const session = createSession();
			const onError = vi.fn();
			const onFinal = vi.fn();
			const { result } = renderHook(
				() =>
					useInsightPixel("Read();", {
						data: "initial",
						onError,
						onFinal,
					}),
				{
					wrapper: ({ children }) => (
						<Wrapper session={session} insightId="workspace">
							{children}
						</Wrapper>
					),
				},
			);
			await waitFor(() => expect(result.current.status).toBe("ERROR"));
			expect(result.current.data).toBe("initial");
			expect(onError).toHaveBeenCalledWith("initial", expect.any(Error));
			expect(onFinal).toHaveBeenCalledTimes(1);
		},
	);
});

describe("usePixel compatibility", () => {
	it.each([
		["explicit", "workspace", "explicit"],
		[undefined, "workspace", "workspace"],
		[undefined, "", ""],
		["", "workspace", ""],
	])(
		"retains routing for explicit ID %s and workspace ID %s",
		async (explicitId, workspaceId, expectedId) => {
			const session = createSession();
			await setInsight(session, "session-1");
			const { result } = renderHook(
				() => usePixel("Read();", undefined, explicitId),
				{
					wrapper: ({ children }) => (
						<Wrapper session={session} insightId={workspaceId}>
							{children}
						</Wrapper>
					),
				},
			);
			await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
			expect(mockRunPixel).toHaveBeenCalledExactlyOnceWith(
				"Read();",
				expectedId,
			);
		},
	);

	it("still allows an empty ID without creating it through the session store", async () => {
		const session = createSession();
		const { result } = renderHook(() => usePixel("Read();"), {
			wrapper: ({ children }) => (
				<SessionProvider session={session}>{children}</SessionProvider>
			),
		});
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(mockRunPixel).toHaveBeenCalledExactlyOnceWith(
			"Read();",
			undefined,
		);
		expect(session.insight.getSnapshot().insightId).toBe("");
	});
});
