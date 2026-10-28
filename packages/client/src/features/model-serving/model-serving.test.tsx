import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { ModelServingPage } from "@/pages/settings/model-serving.page";

const mocks = vi.hoisted(() => ({
	runPixel: vi.fn(),
	usePixel: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	runPixel: mocks.runPixel,
	usePixel: mocks.usePixel,
}));
vi.mock("@/hooks/useSettings", () => ({
	useSettings: () => ({ adminMode: true }),
}));

/** A pixel's answer, as runPixel resolves it */
function answer(output: unknown, operationType = ["OPERATION"]) {
	return {
		errors: operationType.includes("ERROR") ? [String(output)] : [],
		insightId: "insight-1",
		pixelReturn: [
			{
				isMeta: false,
				operationType,
				output,
				pixelExpression: "",
				pixelId: "1",
				timeToRun: 1,
			},
		],
	};
}

/** The sample, applied with a manifest, and ready */
const SAMPLE = {
	servedModel: "olmo-2-1b-instruct",
	namespace: "semoss",
	managed: false,
	displayName: null,
	catalogEntry: null,
	state: "READY",
	message: "Serving requests",
	progress: 1,
	lastAction: {
		action: "start",
		userName: "Ada Admin",
		at: "2026-10-27T08:58:00Z",
	},
	endpoint: "http://localhost:8000/v1",
	hostPort: 8000,
	restarts: 0,
	warnings: [],
};

/** A model SEMOSS defined from the catalog, stopped */
const DEFINED = {
	servedModel: "olmo-2-1b",
	namespace: "semoss",
	managed: true,
	displayName: "OLMo 2 1B Instruct",
	catalogEntry: "allenai/OLMo-2-0425-1B-Instruct",
	state: "STOPPED",
	message: "Stopped",
	endpoint: null,
	endpointNote: "Not running",
	restarts: 0,
	warnings: [],
};

/** The GPU is held by the sample, so the other model starts only in its place */
const CAPACITY = {
	namespace: "semoss",
	gpus: {
		offered: 1,
		held: 1,
		free: 0,
		nodes: [{ name: "spark", gpus: 1, schedulable: true }],
		holders: [
			{
				servedModel: "olmo-2-1b-instruct",
				pod: "olmo-pod",
				gpus: 1,
				state: "READY",
				leaving: false,
			},
		],
	},
	memory: {
		budget: 0.7,
		used: 0.2,
		free: 0.5,
		models: [
			{
				servedModel: "olmo-2-1b-instruct",
				fraction: 0.2,
				source: "model",
				leaving: false,
			},
		],
	},
	models: [
		{ servedModel: "olmo-2-1b-instruct", state: "READY", gpus: 1 },
		{
			servedModel: "olmo-2-1b",
			state: "STOPPED",
			gpus: 1,
			canStart: false,
			reason: "The GPU is in use by olmo-2-1b-instruct.",
			blocking: ["olmo-2-1b-instruct"],
			canReplace: true,
		},
	],
	warnings: [],
};

/** The GB10, used by the sample; its live values and history are in serving-gpu-card.test.tsx */
const GPU_STATUS = {
	metrics: "prometheus",
	source: "Prometheus for tests",
	readAt: "2026-10-27T09:00:00Z",
	window: "1h",
	stepSeconds: 60,
	gpus: [
		{
			node: "spark",
			index: "0",
			product: "NVIDIA GB10",
			utilization: 2,
			usedBy: [
				{
					namespace: "semoss",
					pod: "olmo-pod",
					servedModel: "olmo-2-1b-instruct",
				},
			],
			history: {},
		},
	],
	nodes: [],
	grafana: null,
	warnings: [],
};

const CATALOG = {
	source: "ConfigMap semoss/semoss-serving-catalog",
	models: [
		{
			id: "allenai/OLMo-2-0425-1B-Instruct",
			displayName: "OLMo 2 1B Instruct",
			storageUri: "hf://allenai/OLMo-2-0425-1B-Instruct",
			sizeBytes: 2_979_627_008,
			contextWindow: 4096,
			maxTokens: 1024,
			licence: "apache-2.0",
			origin: "Ai2 (US)",
			approvedBy: "ada",
			approvedAt: "2026-10-27",
		},
	],
	problems: [],
};

const scrollIntoView = Element.prototype.scrollIntoView;

// Radix measures menus and switches with ResizeObserver, which jsdom lacks
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});
afterAll(() => {
	vi.unstubAllGlobals();
	Element.prototype.scrollIntoView = scrollIntoView;
});

/** The engine CreateServedModelEngine made for the sample, and one made by hand */
const ENGINES = {
	namespace: "semoss",
	engines: [
		{
			engineId: "linked-1",
			engineName: "KServe test sample",
			endpoint: "http://localhost:8000/v1",
			model: "olmo-2-1b-instruct",
			servedModel: "olmo-2-1b-instruct",
			namespace: "semoss",
			calls: ["olmo-2-1b-instruct"],
		},
		{
			engineId: "hand-1",
			engineName: "OLMo by hand",
			endpoint: "http://localhost:8000/v1",
			model: "olmo-2-1b-instruct",
			servedModel: null,
			namespace: null,
			calls: ["olmo-2-1b-instruct"],
		},
	],
};

/** Each reactor's answer to the pixels the page sends */
let reactors: Record<string, (pixel: string) => ReturnType<typeof answer>>;

const sent = (reactor: string): string[] =>
	mocks.runPixel.mock.calls
		.map(([pixel]) => String(pixel))
		.filter((pixel) => pixel.startsWith(`${reactor}(`));

beforeEach(() => {
	reactors = {
		ListServedModels: () =>
			answer({ namespace: "semoss", servedModels: [SAMPLE, DEFINED] }),
		GetServingCapacity: () => answer(CAPACITY),
		GetServingGpuStatus: () => answer(GPU_STATUS),
		StartServedModel: () =>
			answer({ ...DEFINED, state: "STARTING", changed: true }),
		StopServedModel: () =>
			answer({ ...SAMPLE, state: "STOPPING", changed: true }),
		RemoveServedModel: () =>
			answer({
				servedModel: "olmo-2-1b",
				removed: true,
				state: "REMOVED",
			}),
		DefineServedModel: () =>
			answer({ ...DEFINED, servedModel: "olmo-2-0425-1b-instruct" }),
		ListServedModelEngines: () => answer(ENGINES),
		LinkServedModelEngine: () =>
			answer({
				...ENGINES.engines[1],
				servedModel: "olmo-2-1b-instruct",
				namespace: "semoss",
				changed: true,
			}),
		UnlinkServedModelEngine: () =>
			answer({
				engineId: "linked-1",
				engineName: "KServe test sample",
				unlinkedFrom: "olmo-2-1b-instruct",
				changed: true,
			}),
	};
	mocks.runPixel.mockImplementation(async (pixel: string) => {
		const reactor = pixel.slice(0, pixel.indexOf("("));
		const handle = reactors[reactor];
		if (!handle) {
			throw new Error(`No answer for ${pixel}`);
		}
		return handle(pixel);
	});
	mocks.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: CATALOG,
		refresh: vi.fn(),
		update: vi.fn(),
	});
});

afterEach(() => {
	cleanup();
	mocks.runPixel.mockReset();
	mocks.usePixel.mockReset();
});

function renderPage() {
	return render(
		<MemoryRouter>
			<ModelServingPage />
		</MemoryRouter>,
	);
}

/** Open a row's More actions menu. */
async function openMenu(servedModel: string): Promise<HTMLElement> {
	fireEvent.keyDown(
		await screen.findByRole("button", {
			name: `More actions for ${servedModel}`,
		}),
		{ key: "Enter" },
	);
	return screen.findByRole("menu");
}

describe("Model Serving", () => {
	it("lists the served models with the GPU and memory they share", async () => {
		renderPage();

		expect(
			await screen.findByRole("button", { name: "olmo-2-1b-instruct" }),
		).toBeInTheDocument();
		const table = screen.getByRole("table", { name: /Served models/ });
		const sampleRow = within(table).getByRole("row", {
			name: /olmo-2-1b-instruct/,
		});
		expect(within(sampleRow).getByText("Ready")).toBeInTheDocument();
		expect(
			within(sampleRow).getByText("Defined outside SEMOSS"),
		).toBeInTheDocument();
		expect(
			within(sampleRow).getByText("http://localhost:8000/v1"),
		).toBeInTheDocument();
		expect(
			within(sampleRow).getByText("Started by Ada Admin"),
		).toBeInTheDocument();
		expect(screen.getByText("1 of 1 in use")).toBeInTheDocument();
		expect(
			await screen.findByRole("heading", { name: "GPU status" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Used by olmo-2-1b-instruct"),
		).toBeInTheDocument();
		expect(
			screen.getByText("20% in use of the 70% models may use"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Start olmo-2-1b" }),
		).toBeEnabled();
	});

	it("asks before starting a model in place of the one holding the GPU", async () => {
		renderPage();

		fireEvent.click(
			await screen.findByRole("button", { name: "Start olmo-2-1b" }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Start olmo-2-1b in place of olmo-2-1b-instruct?",
		});
		expect(sent("StartServedModel")).toEqual([]);
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Stop It and Start" }),
		);

		await waitFor(() =>
			expect(sent("StartServedModel")).toEqual([
				'StartServedModel(servedModel=["olmo-2-1b"], replace=[true]);',
			]),
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	});

	it("starts a model that fits without asking", async () => {
		reactors.GetServingCapacity = () =>
			answer({
				...CAPACITY,
				models: [
					{
						servedModel: "olmo-2-1b",
						state: "STOPPED",
						gpus: 1,
						canStart: true,
					},
				],
			});
		renderPage();

		await waitFor(() => expect(sent("GetServingCapacity")).toHaveLength(1));
		fireEvent.click(
			await screen.findByRole("button", { name: "Start olmo-2-1b" }),
		);

		await waitFor(() =>
			expect(sent("StartServedModel")).toEqual([
				'StartServedModel(servedModel=["olmo-2-1b"]);',
			]),
		);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("keeps the stop dialog open with the reason when the stop is refused", async () => {
		reactors.StopServedModel = () =>
			answer("Kubernetes refused the request (HTTP 403)", ["ERROR"]);
		renderPage();

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Stop olmo-2-1b-instruct",
			}),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Stop olmo-2-1b-instruct?",
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Stop Model" }),
		);

		expect(
			await within(dialog).findByText(
				"Kubernetes refused the request (HTTP 403)",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("dialog", { name: "Stop olmo-2-1b-instruct?" }),
		).toBeInTheDocument();
	});

	it("removes only the models SEMOSS defined, after asking", async () => {
		renderPage();

		const sampleMenu = await openMenu("olmo-2-1b-instruct");
		expect(
			within(sampleMenu).getByRole("menuitem", { name: /Remove/ }),
		).toHaveAttribute("aria-disabled", "true");
		fireEvent.keyDown(sampleMenu, { key: "Escape" });
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

		const definedMenu = await openMenu("olmo-2-1b");
		fireEvent.click(
			within(definedMenu).getByRole("menuitem", { name: "Remove..." }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Remove olmo-2-1b?",
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Remove Model" }),
		);

		await waitFor(() =>
			expect(sent("RemoveServedModel")).toEqual([
				'RemoveServedModel(servedModel=["olmo-2-1b"]);',
			]),
		);
	});

	it("defines a model from the catalog under the name it suggests", async () => {
		renderPage();

		fireEvent.click(
			await screen.findByRole("button", { name: "Define Model" }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Define a Served Model",
		});
		expect(
			within(dialog).getByText(
				/Leave it blank for olmo-2-0425-1b-instruct/,
			),
		).toBeInTheDocument();
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Define Model" }),
		);

		await waitFor(() =>
			expect(sent("DefineServedModel")).toEqual([
				'DefineServedModel(servedModel=["olmo-2-0425-1b-instruct"], catalogEntry=["allenai/OLMo-2-0425-1B-Instruct"], createEngine=[true]);',
			]),
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	});

	it("refuses a name that is already taken, sending nothing", async () => {
		renderPage();

		// the names taken come from the list, so wait for it before opening the form
		await screen.findByRole("button", { name: "olmo-2-1b" });
		fireEvent.click(screen.getByRole("button", { name: "Define Model" }));
		const dialog = await screen.findByRole("dialog", {
			name: "Define a Served Model",
		});
		fireEvent.change(
			within(dialog).getByRole("textbox", { name: "Name" }),
			{
				target: { value: "olmo-2-1b" },
			},
		);
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Define Model" }),
		);

		expect(
			await within(dialog).findByText(
				"A served model named olmo-2-1b already exists.",
			),
		).toBeInTheDocument();
		expect(sent("DefineServedModel")).toEqual([]);
	});

	it("shows why the models cannot be read, with a way to try again", async () => {
		reactors.ListServedModels = () =>
			answer("KServe is not configured: set KSERVE_NAMESPACE", ["ERROR"]);
		renderPage();

		expect(
			await screen.findByText(
				"KServe is not configured: set KSERVE_NAMESPACE",
			),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		await waitFor(() => expect(sent("ListServedModels")).toHaveLength(2));
	});

	it("shows each model's engines, linking to their settings", async () => {
		renderPage();

		const link = await screen.findByRole("link", {
			name: "KServe test sample",
		});
		expect(link).toHaveAttribute("href", "/settings/model/linked-1");
		const row = screen.getByRole("row", { name: /olmo-2-1b-instruct/ });
		expect(
			within(row).getByText("OLMo by hand calls it without the link"),
		).toBeInTheDocument();
		const definedRow = screen.getByRole("row", { name: /^olmo-2-1b OLMo/ });
		expect(within(definedRow).getByText("None")).toBeInTheDocument();
	});

	it("links an engine made by hand from the row's menu", async () => {
		renderPage();

		await screen.findByRole("link", { name: "KServe test sample" });
		const menu = await openMenu("olmo-2-1b-instruct");
		fireEvent.click(
			within(menu).getByRole("menuitem", { name: "Link an Engine..." }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Link an Engine to olmo-2-1b-instruct",
		});
		expect(
			within(dialog).getByText(/Already linked: KServe test sample/),
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("radio", { name: /OLMo by hand/ }),
		).toBeChecked();
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Link Engine" }),
		);

		await waitFor(() =>
			expect(sent("LinkServedModelEngine")).toEqual([
				'LinkServedModelEngine(servedModel=["olmo-2-1b-instruct"], engine=["hand-1"]);',
			]),
		);
		await waitFor(() =>
			expect(sent("ListServedModelEngines")).toHaveLength(2),
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	});

	it("says how to make an engine linkable when none calls the model", async () => {
		renderPage();

		await screen.findByRole("link", { name: "KServe test sample" });
		const menu = await openMenu("olmo-2-1b");
		fireEvent.click(
			within(menu).getByRole("menuitem", { name: "Link an Engine..." }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Link an Engine to olmo-2-1b",
		});

		expect(
			within(dialog).getByText(
				/No engine calls olmo-2-1b without the link/,
			),
		).toBeInTheDocument();
		expect(
			within(dialog).queryByRole("button", { name: "Link Engine" }),
		).toBeNull();
	});

	it("warns before creating a second engine for a model", async () => {
		renderPage();

		await screen.findByRole("link", { name: "KServe test sample" });
		const menu = await openMenu("olmo-2-1b-instruct");
		fireEvent.click(
			within(menu).getByRole("menuitem", {
				name: "Create SEMOSS Engine...",
			}),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Create an Engine for olmo-2-1b-instruct",
		});

		expect(
			within(dialog).getByText(
				"olmo-2-1b-instruct already has an engine",
			),
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("button", {
				name: "Create Another Engine",
			}),
		).toBeInTheDocument();
	});

	it("unlinks an engine from the model's Engines tab", async () => {
		renderPage();

		await screen.findByRole("link", { name: "KServe test sample" });
		const menu = await openMenu("olmo-2-1b-instruct");
		fireEvent.click(
			within(menu).getByRole("menuitem", { name: "Engines" }),
		);
		const sheet = await screen.findByRole("dialog", {
			name: "olmo-2-1b-instruct",
		});
		fireEvent.click(
			within(sheet).getByRole("button", {
				name: "Unlink KServe test sample",
			}),
		);

		await waitFor(() =>
			expect(sent("UnlinkServedModelEngine")).toEqual([
				'UnlinkServedModelEngine(engine=["linked-1"]);',
			]),
		);
		await waitFor(() =>
			expect(sent("ListServedModelEngines")).toHaveLength(2),
		);
	});

	it("shows a model deleted from the cluster while engines are linked to it, and defines it again", async () => {
		reactors.ListServedModelEngines = () =>
			answer({
				...ENGINES,
				engines: [
					...ENGINES.engines,
					{
						engineId: "gone-1",
						engineName: "Old model engine",
						endpoint: "http://localhost:8009/v1",
						model: "olmo-gone",
						servedModel: "olmo-gone",
						namespace: "semoss",
						calls: [],
					},
				],
			});
		renderPage();

		const row = await screen.findByRole("row", { name: /olmo-gone/ });
		expect(within(row).getByText("Not in the cluster")).toBeInTheDocument();
		expect(
			within(row).getByRole("link", { name: "Old model engine" }),
		).toHaveAttribute("href", "/settings/model/gone-1");
		fireEvent.click(
			within(row).getByRole("button", { name: "Define olmo-gone again" }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Define olmo-gone Again",
		});
		expect(
			within(dialog).getByRole("textbox", { name: "Name" }),
		).toHaveValue("olmo-gone");
		expect(
			within(dialog).getByText(
				/Old model engine is still linked to olmo-gone/,
			),
		).toBeInTheDocument();
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Define Model" }),
		);

		await waitFor(() =>
			expect(sent("DefineServedModel")).toEqual([
				'DefineServedModel(servedModel=["olmo-gone"], catalogEntry=["allenai/OLMo-2-0425-1B-Instruct"]);',
			]),
		);
	});

	it("shows which catalog entries the cluster serves", async () => {
		renderPage();

		await screen.findByRole("button", { name: "olmo-2-1b" });
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Catalog" }));
		const row = await screen.findByRole("row", {
			name: /OLMo 2 1B Instruct/,
		});

		expect(within(row).getByText("olmo-2-1b")).toBeInTheDocument();
		expect(within(row).getByText(/stopped/)).toBeInTheDocument();
		expect(
			screen.getByText(
				/It is read from the cluster, so a change to its file/,
			),
		).toBeInTheDocument();
	});
});
