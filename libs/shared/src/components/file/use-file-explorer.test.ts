import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useFileExplorer } from "./use-file-explorer";

const backend = vi.hoisted(() => ({
	actions: { run: vi.fn().mockResolvedValue({}) },
	listing: { status: "SUCCESS", data: [], refresh: vi.fn() },
}));

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: backend.actions, insightId: "insight-1" }),
	usePixel: () => backend.listing,
}));
vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

it("refreshes a companion listing after writes and manual refresh, including inside folders", async () => {
	const onRefresh = vi.fn();
	const { result, rerender } = renderHook(() =>
		useFileExplorer({ mode: { type: "USER" }, onRefresh }),
	);
	const file = { name: "first.md", path: "/folder/first.md" };
	act(() => result.current.tree.selectItem(file));
	act(() => result.current.newFile.close(false));
	rerender();
	expect(onRefresh).not.toHaveBeenCalled();

	act(() => result.current.commands.refresh());
	expect(onRefresh).toHaveBeenCalledTimes(1);
	act(() => result.current.newFile.close(true, "/folder"));
	expect(onRefresh).toHaveBeenCalledTimes(2);
	await act(() => result.current.commands.renameTo(file, "second.md"));
	expect(onRefresh).toHaveBeenCalledTimes(3);
	await act(() =>
		result.current.commands.remove([
			{ name: "second.md", path: "/folder/second.md" },
		]),
	);
	expect(onRefresh).toHaveBeenCalledTimes(4);
});
