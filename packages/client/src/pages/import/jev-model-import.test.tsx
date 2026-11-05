import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelImportPage } from "./model-import-page";

const { runPixel, navigate } = vi.hoisted(() => ({
	runPixel: vi.fn(),
	navigate: vi.fn(),
}));

vi.mock("@/hooks", () => ({
	useSession: (selector: (state: { runPixel: typeof runPixel }) => unknown) =>
		selector({ runPixel }),
	useStepper: () => {
		const [isLoading, setIsLoading] = useState(false);
		return { isLoading, setIsLoading };
	},
}));

vi.mock("@/hooks/useNavigate", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/shared", () => ({
	NavbarHeader: () => null,
	NavbarLeft: ({ children }: { children: ReactNode }) => children,
}));

beforeEach(() => {
	vi.clearAllMocks();
	Element.prototype.scrollIntoView = vi.fn();
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	runPixel.mockImplementation(async (pixel: string) => ({
		errors: [],
		pixelReturn: [
			{
				operationType: ["SUCCESS"],
				output: pixel.startsWith("CreateModelEngine")
					? { engine_id: "jev-test-engine" }
					: pixel.includes("CheckEngineName")
						? { exists: false }
						: {},
			},
		],
	}));
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

/** Mount the real catalog and shared form; only transport and app chrome are mocked. */
const openCard = async (display: string) => {
	render(
		<MemoryRouter>
			<ModelImportPage />
		</MemoryRouter>,
	);
	fireEvent.click(
		await screen.findByRole("button", { name: new RegExp(`^${display} `) }),
	);
	return screen.findByLabelText("Model ID", { exact: false });
};

describe("Jev model import", () => {
	it.each([
		["Jev Latest", "jev-latest"],
		["Jev 1.13", "jev-1.13.0"],
		["Jev Preview", "jev-preview"],
	])(
		"opens %s with its evaluation configuration",
		async (display, modelId) => {
			const modelField = await openCard(display);
			expect(modelField).toHaveValue(modelId);
			expect(modelField).toBeDisabled();
			expect(
				screen.getByLabelText("TypeSafe API Key", { exact: false }),
			).toHaveAttribute("type", "password");
			expect(
				screen.getByLabelText("API Base URL", { exact: false }),
			).toHaveValue("https://api.typesafe.ai");
			expect(
				screen.queryByText("Keep Conversation History"),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText("Input Modalities"),
			).not.toBeInTheDocument();
			expect(runPixel).not.toHaveBeenCalledWith(
				expect.stringContaining("GetStaticModelMetadata"),
			);
		},
	);

	it("requires credentials and submits a custom ID to the TypeSafe engine", async () => {
		const modelField = await openCard("Custom Jev Model");
		expect(modelField).toBeEnabled();
		expect(modelField).toHaveValue("");
		const connect = screen.getByRole("button", {
			name: "Connect",
		});
		expect(connect).toBeDisabled();
		fireEvent.change(modelField, {
			target: { value: "jev-custom-version" },
		});
		fireEvent.change(
			screen.getByLabelText("Catalog Name", { exact: false }),
			{ target: { value: "Jev Test" } },
		);
		expect(connect).toBeDisabled();
		fireEvent.change(
			screen.getByLabelText("TypeSafe API Key", { exact: false }),
			{ target: { value: "test-only-key" } },
		);
		fireEvent.change(
			screen.getByLabelText("API Base URL", { exact: false }),
			{ target: { value: "https://example.test" } },
		);
		await waitFor(() => expect(connect).toBeEnabled());
		fireEvent.click(connect);
		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith("/model/jev-test-engine"),
		);
		const createCall = runPixel.mock.calls.find(([pixel]) =>
			pixel.startsWith("CreateModelEngine"),
		);
		expect(createCall).toBeDefined();
		const details = createCall?.[0].match(/modelDetails=\[(.*)\]\)$/)?.[1];
		expect(details).toBeDefined();
		const payload = JSON.parse(details ?? "{}");
		expect(payload).toMatchObject({
			NAME: "Jev Test",
			MODEL: "jev-custom-version",
			MODEL_TYPE: "TYPESAFE",
			MODEL_BRAND: "TYPESAFE",
			API_KEY: "test-only-key",
			BASE_URL: "https://example.test",
			INIT_MODEL_ENGINE: expect.stringContaining("TypeSafeClientWrapper"),
		});
		expect(payload).not.toHaveProperty("CAPABILITY");
		expect(payload).not.toHaveProperty("KEEP_CONVERSATION_HISTORY");
		expect(runPixel).not.toHaveBeenCalledWith(
			expect.stringContaining("MatchStaticModelMetadata"),
		);
	});
});
