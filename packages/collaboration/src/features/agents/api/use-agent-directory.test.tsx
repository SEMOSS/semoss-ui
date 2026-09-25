import { renderHook } from "@testing-library/react";

const useIteratorPixelMock = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk/react", () => ({
	useIteratorPixel: useIteratorPixelMock,
}));

import type { ProjectRow } from "./agent-schemas";
import { useAgentDirectory } from "./use-agent-directory";

function project(id: string): ProjectRow {
	return {
		project_id: id,
		project_name: "workspace",
		project_display_name: `Agent ${id}`,
		project_description: `Description ${id}`,
	};
}

describe("useAgentDirectory", () => {
	beforeEach(() => {
		useIteratorPixelMock.mockReset();
		useIteratorPixelMock.mockReturnValue({
			data: [project("one"), project("one"), project("two")],
			totalCount: 2,
			isError: false,
			error: null,
			isLoading: false,
			hasMore: false,
			next: vi.fn(),
			reset: vi.fn(),
		});
	});

	it("searches MyProjects with a one-row pagination lookahead", () => {
		const { result } = renderHook(() => useAgentDirectory("editor", 3));
		const createStatement = useIteratorPixelMock.mock.lastCall?.[0] as
			| ((limit: number, offset: number) => string)
			| undefined;
		if (!createStatement) throw new Error("Agent iterator was not called.");

		expect(createStatement(12, 24)).toBe(
			'MyProjects(filterWord=["editor"], projectType=["WORKSPACE"], limit=[13], offset=[24]);',
		);
		expect(useIteratorPixelMock.mock.lastCall?.[3]).toEqual({
			limit: 12,
			onSuccess: expect.any(Function),
		});
		expect(useIteratorPixelMock.mock.lastCall?.[4]).toEqual(["editor", 3]);
		expect(result.current.agents.map((agent) => agent.id)).toEqual([
			"one",
			"two",
		]);
		expect(result.current.agents[0]?.description).toBe("Description one");
	});

	it("uses the lookahead row only to determine whether another page exists", () => {
		renderHook(() => useAgentDirectory(""));
		const getTotalCount = useIteratorPixelMock.mock.lastCall?.[1] as
			| ((response: unknown) => number)
			| undefined;
		const getData = useIteratorPixelMock.mock.lastCall?.[2] as
			| ((response: unknown) => ProjectRow[])
			| undefined;
		if (!getTotalCount || !getData) {
			throw new Error("Agent iterator callbacks were not provided.");
		}
		const page = Array.from({ length: 12 }, (_, index) =>
			project(String(index)),
		);

		expect(getTotalCount(page)).toBe(-1);
		expect(getTotalCount([...page, project("lookahead")])).toBe(
			Number.POSITIVE_INFINITY,
		);
		expect(getData([...page, project("lookahead")])).toEqual(page);
	});
});
