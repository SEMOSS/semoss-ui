import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useWorkbenchNavigation } from "@/features/navigation/use-workbench-navigation";

test.each([true, false])(
	"restores navigation preference %s after temporary work-area overrides",
	(preferred) => {
		const save = vi.fn();
		const { result } = renderHook(() =>
			useWorkbenchNavigation(preferred, save),
		);
		expect(result.current.isNavigationOpen).toBe(preferred);
		act(() => result.current.setWorkbenchOpen(true));
		expect(result.current.isNavigationOpen).toBe(false);
		act(() => result.current.setNavigationOpen(true));
		expect(result.current.isNavigationOpen).toBe(true);
		act(() => result.current.setWorkbenchOpen(true));
		expect(result.current.isNavigationOpen).toBe(true);
		expect(save).not.toHaveBeenCalled();
		act(() => result.current.setWorkbenchOpen(false));
		expect(result.current.isNavigationOpen).toBe(preferred);
		act(() => result.current.setNavigationOpen(!preferred));
		expect(save).toHaveBeenCalledWith(!preferred);
	},
);
