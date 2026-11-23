import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogDependencyRow } from "@semoss/shared";
import { ManageEnginesDialog } from "./manage-engines-dialog";

const mocks = vi.hoisted(() => ({
	runPixel: vi.fn(),
	/** What the engine search lists */
	/** Why the engine search failed, if it did */
	error: null as Error | null,
	options: [] as {
		engine_id: string;
		engine_name: string;
		engine_type: string;
	}[],
}));

vi.mock("@semoss/sdk/react", () => ({
	runPixel: mocks.runPixel,
	useDebouncedValue: (value: string) => value,
	useIteratorPixel: (
		_pixel: unknown,
		_next: unknown,
		map: (response: unknown) => unknown[],
	) => ({
		data: map(mocks.options),
		isLoading: false,
		hasMore: false,
		error: mocks.error,
		next: vi.fn(),
	}),
}));

vi.mock("@semoss/shared", () => ({
	AppCatalogAvatar: () => <span data-testid="project-avatar" />,
	EngineSubtypeIcon: () => <span data-testid="engine-icon" />,
	useCatalogImageUrl: () => "",
}));

afterEach(() => {
	cleanup();
	mocks.runPixel.mockReset();
	mocks.options = [];
	mocks.error = null;
});

const row = (
	id: string,
	fields: Partial<CatalogDependencyRow>,
): CatalogDependencyRow => ({
	catalog_id: id,
	catalog_type: "MODEL",
	catalog_name: id,
	permission_name: "READ_ONLY",
	is_automatic: false,
	role: "MANUAL",
	dependency_name: null,
	dependency_description: null,
	...fields,
});

/** The `dependencies` the last `SetCatalogDependencies` sent */
const sentPayload = (): unknown => {
	const pixel: string = mocks.runPixel.mock.calls[0]?.[0];
	return JSON.parse(pixel.slice(pixel.indexOf("dependencies=") + 13, -2));
};

describe("ManageEnginesDialog", () => {
	it("names a picked engine after itself, unique among the owner's links, and keeps the rest", async () => {
		mocks.runPixel.mockResolvedValue({ errors: [], pixelReturn: [] });
		mocks.options = [
			{ engine_id: "gpt-2", engine_name: "GPT", engine_type: "MODEL" },
		];
		const onClose = vi.fn();
		render(
			<ManageEnginesDialog
				category="MODEL"
				catalogId="app-1"
				catalogType="CODE"
				dependencies={[
					row("gpt-1", {
						catalog_name: "GPT",
						dependency_name: "GPT",
						dependency_description: "Writes answers",
					}),
					row("db-1", {
						catalog_type: "DATABASE",
						dependency_name: "Sales",
					}),
					row("judge-1", {
						is_automatic: true,
						role: "JUDGE_MODEL",
					}),
				]}
				onClose={onClose}
			/>,
		);
		const dialog = screen.getByRole("dialog");
		// automatic engines are listed read-only and never sent
		expect(
			within(dialog).getByText(/Automatic: set by the/),
		).toBeInTheDocument();
		fireEvent.click(within(dialog).getByRole("button", { name: /GPT/ }));
		fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
		expect(sentPayload()).toEqual([
			{ id: "db-1", type: "DATABASE", name: "Sales" },
			{
				id: "gpt-1",
				type: "MODEL",
				name: "GPT",
				description: "Writes answers",
			},
			{ id: "gpt-2", type: "MODEL", name: "GPT 2" },
		]);
	});

	it("says why the engines could not be read, instead of finding none", () => {
		mocks.error = new Error("You cannot list models");
		render(
			<ManageEnginesDialog
				category="MODEL"
				catalogId="app-1"
				catalogType="CODE"
				dependencies={[]}
				onClose={vi.fn()}
			/>,
		);
		expect(
			screen.getByText(
				"Couldn't read the models: You cannot list models",
			),
		).toBeInTheDocument();
		expect(screen.queryByText(/No models found/)).toBeNull();
	});
});
