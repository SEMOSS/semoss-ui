import {
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CATALOG_IMAGE_MAX_BYTES,
	uploadEngineImage,
	uploadProjectImage,
} from "@semoss/sdk";
import { CatalogImageSettings } from "./catalog-image-settings";
import {
	type CatalogImageResource,
	useCatalogImageUrl,
} from "./use-catalog-image";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	uploadEngineImage: vi.fn(),
	uploadProjectImage: vi.fn(),
}));

const photo = () => new File(["photo"], "agent.png", { type: "image/png" });
const result = {
	message: "Saved",
	id: "saved",
	name: "Agent",
	imageUrl: "/image",
	contentType: "image/png" as const,
};
let recordId = 0;

/** Each test uses a separate saved resource to isolate its image revision. */
function renderSettings(
	resource: CatalogImageResource = "PROJECT",
	canEdit = true,
) {
	const id = `image-settings-${++recordId}`;
	const mounted = render(
		<CatalogImageSettings
			key={id}
			resource={resource}
			id={id}
			name="Image Test Agent"
			canEdit={canEdit}
		/>,
	);
	return { ...mounted, id };
}

describe("CatalogImageSettings", () => {
	beforeEach(() => {
		vi.mocked(uploadProjectImage).mockReset().mockResolvedValue(result);
		vi.mocked(uploadEngineImage).mockReset().mockResolvedValue(result);
		vi.stubGlobal(
			"URL",
			class extends URL {
				static createObjectURL = vi.fn(() => "blob:selected-image");
				static revokeObjectURL = vi.fn();
			},
		);
	});
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it.each(["PROJECT", "ENGINE"] as const)(
		"uploads a %s image only on submission and refreshes that resource",
		async (resource) => {
			const { id } = renderSettings(resource);
			const imageUrl = renderHook(() => useCatalogImageUrl(resource, id));
			const unrelatedUrl = renderHook(() =>
				useCatalogImageUrl(resource, "another-resource"),
			);
			const original = imageUrl.result.current;
			const unrelated = unrelatedUrl.result.current;
			const file = photo();
			fireEvent.change(screen.getByLabelText("Choose image"), {
				target: { files: [file] },
			});
			expect(URL.createObjectURL).toHaveBeenCalledWith(file);
			expect(uploadProjectImage).not.toHaveBeenCalled();
			expect(uploadEngineImage).not.toHaveBeenCalled();
			fireEvent.click(
				screen.getByRole("button", { name: "Upload image" }),
			);
			await waitFor(() =>
				expect(
					resource === "PROJECT"
						? uploadProjectImage
						: uploadEngineImage,
				).toHaveBeenCalledWith(id, file),
			);
			await waitFor(() =>
				expect(imageUrl.result.current).not.toBe(original),
			);
			expect(imageUrl.result.current).toContain("?v=");
			expect(unrelatedUrl.result.current).toBe(unrelated);
			expect(URL.revokeObjectURL).toHaveBeenCalledWith(
				"blob:selected-image",
			);
		},
	);

	it("preserves the selected file after a server failure and retries without refreshing early", async () => {
		vi.mocked(uploadProjectImage).mockRejectedValueOnce(
			new Error("Image storage unavailable"),
		);
		const { id } = renderSettings();
		const url = renderHook(() => useCatalogImageUrl("PROJECT", id));
		const original = url.result.current;
		const file = photo();
		fireEvent.change(screen.getByLabelText("Choose image"), {
			target: { files: [file] },
		});
		fireEvent.click(screen.getByRole("button", { name: "Upload image" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Image storage unavailable",
		);
		expect(url.result.current).toBe(original);
		expect(URL.revokeObjectURL).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Upload image" }));
		await waitFor(() =>
			expect(uploadProjectImage).toHaveBeenCalledTimes(2),
		);
		expect(uploadProjectImage).toHaveBeenLastCalledWith(id, file);
		await waitFor(() => expect(url.result.current).not.toBe(original));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it.each([
		[
			new File(["text"], "test.txt", { type: "text/plain" }),
			"Choose a PNG, JPEG, or GIF image.",
		],
		[
			new File([], "empty.png", { type: "image/png" }),
			"Choose an image that is not empty.",
		],
		[
			new File(
				[new Uint8Array(CATALOG_IMAGE_MAX_BYTES + 1)],
				"large.png",
				{ type: "image/png" },
			),
			"Choose an image no larger than 10 MiB.",
		],
	])(
		"rejects invalid file %s with an associated field error",
		async (file, message) => {
			renderSettings();
			const input = screen.getByLabelText("Choose image");
			fireEvent.change(input, { target: { files: [file] } });
			expect(await screen.findByRole("alert")).toHaveTextContent(message);
			expect(input).toHaveAttribute("aria-invalid", "true");
			expect(input).toHaveAccessibleDescription(
				expect.stringContaining(message),
			);
			fireEvent.click(
				screen.getByRole("button", { name: "Upload image" }),
			);
			await waitFor(() => expect(input).toHaveFocus());
			expect(uploadProjectImage).not.toHaveBeenCalled();
			expect(URL.createObjectURL).not.toHaveBeenCalled();
		},
	);

	it("requires a selection before uploading", async () => {
		renderSettings();
		fireEvent.click(screen.getByRole("button", { name: "Upload image" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Choose an image to upload.",
		);
		expect(uploadProjectImage).not.toHaveBeenCalled();
	});

	it("disables changes and duplicate uploads while pending", async () => {
		let finish: (value: typeof result) => void = () => {};
		vi.mocked(uploadProjectImage).mockReturnValue(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		renderSettings();
		fireEvent.change(screen.getByLabelText("Choose image"), {
			target: { files: [photo()] },
		});
		fireEvent.click(screen.getByRole("button", { name: "Upload image" }));
		await waitFor(() =>
			expect(uploadProjectImage).toHaveBeenCalledTimes(1),
		);
		expect(screen.getByLabelText("Choose image")).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /Uploading image/ }),
		).toBeDisabled();
		fireEvent.submit(screen.getByRole("form", { name: "Catalog image" }));
		await waitFor(() =>
			expect(uploadProjectImage).toHaveBeenCalledTimes(1),
		);
		expect(screen.getByLabelText("Choose image")).toBeDisabled();
		finish(result);
		await waitFor(() =>
			expect(screen.getByLabelText("Choose image")).toBeEnabled(),
		);
	});

	it("cancels a selection, releases its preview and returns focus to the picker", async () => {
		renderSettings();
		fireEvent.change(screen.getByLabelText("Choose image"), {
			target: { files: [photo()] },
		});
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:selected-image");
		expect(screen.getByLabelText("Choose image")).toHaveFocus();
		fireEvent.click(screen.getByRole("button", { name: "Upload image" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Choose an image to upload.",
		);
		expect(uploadProjectImage).not.toHaveBeenCalled();
	});

	it("does not expose upload controls without edit permission", () => {
		renderSettings("PROJECT", false);
		expect(screen.queryByLabelText("Choose image")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Upload image" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText("You need edit permission to change this image."),
		).toBeInTheDocument();
	});

	it("discards the file and releases its preview when switching resources", () => {
		const { rerender } = renderSettings();
		const nextId = "different";
		fireEvent.change(screen.getByLabelText("Choose image"), {
			target: { files: [photo()] },
		});
		rerender(
			<CatalogImageSettings
				key="different"
				id={nextId}
				name="Another agent"
				resource="PROJECT"
				canEdit
			/>,
		);
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:selected-image");
		expect(screen.getByLabelText("Choose image")).toHaveValue("");
		expect(uploadProjectImage).not.toHaveBeenCalled();
	});
});
