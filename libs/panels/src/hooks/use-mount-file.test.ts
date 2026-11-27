import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileSource } from "@semoss/shared";
import { useMountFile } from "./use-mount-file";

/** A source whose reads resolve when the test says. */
const createSource = () => {
	const pending: Array<{
		path: string;
		resolve: (bytes: Uint8Array) => void;
	}> = [];
	const source = {
		read: vi.fn(
			(path: string) =>
				new Promise<Uint8Array>((resolve) => {
					pending.push({ path, resolve });
				}),
		),
	} as unknown as FileSource;
	return { source, pending };
};

const HELLO = new Uint8Array([104, 105]);

describe("useMountFile", () => {
	it("reads a text file", async () => {
		const { source, pending } = createSource();
		const onLoad = vi.fn();
		const { result } = renderHook(() =>
			useMountFile({
				source,
				path: "/a.md",
				base64: false,
				enabled: true,
				missingMessage: "Not here",
				onLoad,
			}),
		);

		act(() => pending[0]?.resolve(HELLO));

		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(result.current.data).toBe("hi");
		expect(onLoad).toHaveBeenCalledTimes(1);
	});

	it("hands bytes over as base64 for a panel that reads them", async () => {
		const { source, pending } = createSource();
		const { result } = renderHook(() =>
			useMountFile({
				source,
				path: "/a.png",
				base64: true,
				enabled: true,
				missingMessage: "Not here",
				onLoad: () => undefined,
			}),
		);

		act(() => pending[0]?.resolve(HELLO));

		await waitFor(() => expect(result.current.data).toBe("aGk="));
	});

	it("says the mount is not here rather than waiting", () => {
		const { result } = renderHook(() =>
			useMountFile({
				source: null,
				path: "/a.md",
				base64: false,
				enabled: true,
				missingMessage: "Not here",
				onLoad: () => undefined,
			}),
		);

		expect(result.current.status).toBe("ERROR");
		expect(result.current.error?.message).toBe("Not here");
	});

	it("drops a read that lands after the panel moved on", async () => {
		const { source, pending } = createSource();
		const { result, rerender } = renderHook(
			({ path }) =>
				useMountFile({
					source,
					path,
					base64: false,
					enabled: true,
					missingMessage: "Not here",
					onLoad: () => undefined,
				}),
			{ initialProps: { path: "/old.md" } },
		);

		rerender({ path: "/new.md" });
		act(() => pending[1]?.resolve(new Uint8Array([110])));
		await waitFor(() => expect(result.current.data).toBe("n"));
		act(() => pending[0]?.resolve(new Uint8Array([111])));

		expect(result.current.data).toBe("n");
	});
});
