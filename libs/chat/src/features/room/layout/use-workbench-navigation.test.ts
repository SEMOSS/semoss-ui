import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useWorkbenchNavigation } from "./use-workbench-navigation";

test.each([true, false])(
	"restores navigation preference %s after temporary work-area overrides",
	(preferred) => {
		const save = vi.fn();
		const { result } = renderHook(() =>
			useWorkbenchNavigation(preferred, save),
		);
		expect(result.current.isNavigationOpen).toBe(preferred);
		act(() => result.current.setIsWorkbenchOpen(true));
		expect(result.current.isNavigationOpen).toBe(false);
		act(() => result.current.setIsNavigationOpen(true));
		expect(result.current.isNavigationOpen).toBe(true);
		act(() => result.current.setIsWorkbenchOpen(true));
		expect(result.current.isNavigationOpen).toBe(true);
		expect(save).not.toHaveBeenCalled();
		act(() => result.current.setIsWorkbenchOpen(false));
		expect(result.current.isNavigationOpen).toBe(preferred);
		act(() => result.current.setIsNavigationOpen(!preferred));
		expect(save).toHaveBeenCalledWith(!preferred);
	},
);
