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
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe = vi.fn();
			unobserve = vi.fn();
			disconnect = vi.fn();
		},
	);
	Element.prototype.scrollIntoView = vi.fn();
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	runPixel.mockImplementation(async (pixel: string) => ({
		errors: [],
		pixelReturn: [
			{
				operationType: ["SUCCESS"],
				output: pixel.startsWith("CreateModelEngine")
					? { engine_id: "nim-test-engine" }
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
	vi.unstubAllGlobals();
});

/** Exercise the real catalog, editable provider fields, and submission. */
const openNimForm = async () => {
	render(
		<MemoryRouter>
			<ModelImportPage />
		</MemoryRouter>,
	);
	fireEvent.click(
		await screen.findByRole("button", { name: /^Other NVIDIA NIM Model / }),
	);
	await screen.findByLabelText("Model Name", { exact: false });
};

const fillRequiredFields = () => {
	fireEvent.change(screen.getByLabelText("Model Name", { exact: false }), {
		target: { value: "poolside/laguna-xs-2.1" },
	});
	fireEvent.change(screen.getByLabelText("Catalog Name", { exact: false }), {
		target: { value: "Laguna NIM Test" },
	});
	fireEvent.change(screen.getByLabelText("API Key", { exact: false }), {
		target: { value: "test-only-key" },
	});
};

const selectOption = async (label: string, option: string) => {
	fireEvent.keyDown(screen.getByLabelText(label, { exact: false }), {
		key: "ArrowDown",
	});
	fireEvent.click(await screen.findByRole("option", { name: option }));
};

const submitConfiguration = async (): Promise<Record<string, unknown>> => {
	const connect = screen.getByRole("button", { name: "Connect" });
	await waitFor(() => expect(connect).toBeEnabled());
	fireEvent.click(connect);
	await waitFor(() =>
		expect(navigate).toHaveBeenCalledWith("/model/nim-test-engine"),
	);
	const createCall = runPixel.mock.calls.find(([pixel]) =>
		pixel.startsWith("CreateModelEngine"),
	);
	const details = createCall?.[0].match(/modelDetails=\[(.*)\]\)$/)?.[1];
	expect(details).toBeDefined();
	return JSON.parse(details ?? "{}");
};

describe("NVIDIA NIM import", () => {
	it("defaults to hosted chat completions and submits the chosen model", async () => {
		await openNimForm();
		const endpoint = screen.getByLabelText("API Base URL", {
			exact: false,
		});
		expect(endpoint).toHaveValue("https://integrate.api.nvidia.com/v1");
		expect(endpoint).toHaveAccessibleDescription(/including \/v1/);
		expect(
			screen.getByLabelText("Completion Type", { exact: false }),
		).toHaveTextContent("chat-completion");
		expect(
			screen.getByLabelText("Chat Reasoning Control"),
		).toHaveAccessibleDescription(/enable_thinking models such as Laguna/);
		expect(
			screen.getByLabelText("API Key", { exact: false }),
		).toHaveAccessibleDescription(/without authentication, enter EMPTY/);
		fillRequiredFields();
		fireEvent.change(endpoint, { target: { value: "" } });
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Connect" }),
			).toBeDisabled(),
		);
		fireEvent.change(endpoint, {
			target: { value: "https://integrate.api.nvidia.com/v1" },
		});
		const payload = await submitConfiguration();
		expect(payload).toMatchObject({
			MODEL: "poolside/laguna-xs-2.1",
			MODEL_TYPE: "OPEN_AI",
			ENDPOINT: "https://integrate.api.nvidia.com/v1",
			CHAT_TYPE: "chat-completion",
			CHAT_REASONING_MODE: "reasoning_effort",
			SERVING_PROVIDER: "NVIDIA_NIM",
		});
		expect(payload.INIT_MODEL_ENGINE).toBe(
			// biome-ignore lint/suspicious/noTemplateCurlyInString: The server expands Python init placeholders.
			"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = '${ENDPOINT}', model_name='${MODEL}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', preserve_reasoning_content=True, chat_reasoning_mode='${CHAT_REASONING_MODE}')",
		);
	});

	it.each(["chat-completion", "completions", "responses"])(
		"submits a self-hosted endpoint using %s",
		async (mode) => {
			await openNimForm();
			fillRequiredFields();
			fireEvent.change(
				screen.getByLabelText("API Base URL", { exact: false }),
				{
					target: { value: "http://nim.internal:8000/v1" },
				},
			);
			fireEvent.change(
				screen.getByLabelText("API Key", { exact: false }),
				{
					target: { value: "EMPTY" },
				},
			);
			await selectOption("Completion Type", mode);
			await selectOption(
				"Chat Reasoning Control",
				"Chat template (enable_thinking)",
			);
			const payload = await submitConfiguration();
			expect(payload).toMatchObject({
				ENDPOINT: "http://nim.internal:8000/v1",
				OPEN_AI_KEY: "EMPTY",
				MODEL: "poolside/laguna-xs-2.1",
				CHAT_TYPE: mode,
				CHAT_REASONING_MODE: "chat_template",
			});
		},
	);
});
