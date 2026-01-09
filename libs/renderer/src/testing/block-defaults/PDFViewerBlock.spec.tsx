import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";
import * as sdk from "@semoss/sdk/react";
import { PDFViewerBlock } from "../../components/block-defaults/pdfViewer-block/PDFViewerBlock";
import { render } from "../utils/index";

vi.mock("@semoss/sdk/react", () => ({
	runPixel: vi.fn(),
	Env: {
		MODULE: "http://localhost",
	},
}));

vi.mock("react-router-dom", () => ({
	useParams: () => ({ appId: "test-app-id" }),
}));

const mockBase64PDF = "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK";

type MockPixelResponse = {
	errors: string[];
	insightId: string;
	pixelReturn: Array<{
		isMeta: boolean;
		operationType: string[];
		output: string;
		pixelExpression: string;
		pixelId: string;
		additionalOutput?: unknown;
		timeToRun: number;
	}>;
};

const blocks = {
	pdfViewer: {
		data: {
			style: {
				width: "100%",
				height: "82%",
				padding: "8px",
			},
			selectedPdf: null,
			engineId: "",
			show: "true",
		},
		id: "pdfViewer",
		widget: "pdfViewer",
		slots: {},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
	},
	pdfViewerWithFile: {
		data: {
			style: {
				width: "100%",
				height: "82%",
				padding: "8px",
			},
			selectedPdf: "version/assets/test-document.pdf",
			engineId: "",
			show: "true",
		},
		id: "pdfViewerWithFile",
		widget: "pdfViewer",
		slots: {},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
	},
	pdfViewerWithEngine: {
		data: {
			style: {
				width: "100%",
				height: "82%",
				padding: "8px",
			},
			selectedPdf: "version/assets/test-document.pdf",
			engineId: "test-engine-id",
			show: "true",
		},
		id: "pdfViewerWithEngine",
		widget: "pdfViewer",
		slots: {},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
	},
	pdfViewerHidden: {
		data: {
			style: {
				width: "100%",
				height: "82%",
				padding: "8px",
			},
			selectedPdf: "version/assets/test-document.pdf",
			engineId: "",
			show: "false",
		},
		id: "pdfViewerHidden",
		widget: "pdfViewer",
		slots: {},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
	},
};

describe("PDF Viewer Block", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		globalThis.fetch = vi.fn() as typeof fetch;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders correctly with mocked provider", async () => {
		const { container } = render(
			<PDFViewerBlock id={blocks.pdfViewer.id} />,
			{
				blocks: blocks,
			},
		);

		const pdfViewer = container.querySelector("[data-block='pdfViewer']");
		expect(pdfViewer).toBeInTheDocument();
	});

	it("renders empty state when no PDF is selected", async () => {
		const { container } = render(
			<PDFViewerBlock id={blocks.pdfViewer.id} />,
			{
				blocks: blocks,
			},
		);

		const emptyMessage = screen.getByText(
			"Select a PDF from settings to view it here",
		);
		expect(emptyMessage).toBeInTheDocument();

		const pdfViewer = container.querySelector("[data-block='pdfViewer']");
		expect(pdfViewer).toHaveStyle("width: 100%");
		expect(pdfViewer).toHaveStyle("height: 82%");
		expect(pdfViewer).toHaveStyle("padding: 8px");
	});

	it("renders header with filename when PDF is selected", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockResolvedValueOnce({
			errors: [],
			insightId: "test-insight",
			pixelReturn: [
				{
					isMeta: false,
					operationType: [],
					output: mockBase64PDF,
					pixelExpression: "",
					pixelId: "test-pixel",
					timeToRun: 0,
				},
			],
		} as MockPixelResponse);

		render(<PDFViewerBlock id={blocks.pdfViewerWithEngine.id} />, {
			blocks: blocks,
		});

		await waitFor(() => {
			const header = screen.getByText("test-document.pdf");
			expect(header).toBeInTheDocument();
		});
	});

	it("calls DownloadAsset pixel when no engineId provided", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockRejectedValueOnce(new Error("Network error"));

		render(<PDFViewerBlock id={blocks.pdfViewerWithFile.id} />, {
			blocks: blocks,
		});

		await waitFor(
			() => {
				expect(mockRunPixel).toHaveBeenCalledWith(
					expect.stringContaining("DownloadAsset"),
				);
				expect(mockRunPixel).toHaveBeenCalledWith(
					expect.stringContaining("version/assets/test-document.pdf"),
				);
			},
			{ timeout: 3000 },
		);
	});

	it("calls GetEngineAssetsBase64 pixel when engineId is provided", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockResolvedValueOnce({
			errors: [],
			insightId: "test-insight",
			pixelReturn: [
				{
					isMeta: false,
					operationType: [],
					output: mockBase64PDF,
					pixelExpression: "",
					pixelId: "test-pixel",
					timeToRun: 0,
				},
			],
		} as MockPixelResponse);

		render(<PDFViewerBlock id={blocks.pdfViewerWithEngine.id} />, {
			blocks: blocks,
		});

		await waitFor(() => {
			const header = screen.getByText("test-document.pdf");
			expect(header).toBeInTheDocument();
		});

		expect(mockRunPixel).toHaveBeenCalledWith(
			expect.stringContaining("GetEngineAssetsBase64"),
		);
		expect(mockRunPixel).toHaveBeenCalledWith(
			expect.stringContaining("test-engine-id"),
		);
	});

	it("displays error message when PDF fails to load", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockRejectedValueOnce(new Error("Network error"));

		render(<PDFViewerBlock id={blocks.pdfViewerWithFile.id} />, {
			blocks: blocks,
		});

		await waitFor(
			() => {
				const errorMessage = screen.getByText("Failed to load PDF");
				expect(errorMessage).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it("renders clear button when PDF is selected", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockResolvedValueOnce({
			errors: [],
			insightId: "test-insight",
			pixelReturn: [
				{
					isMeta: false,
					operationType: [],
					output: mockBase64PDF,
					pixelExpression: "",
					pixelId: "test-pixel",
					timeToRun: 0,
				},
			],
		} as MockPixelResponse);

		const { container } = render(
			<PDFViewerBlock id={blocks.pdfViewerWithEngine.id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const clearButton = container.querySelector(
				'button[aria-label="clear pdf"]',
			);
			expect(clearButton).toBeInTheDocument();
		});
	});

	it("clears PDF when clear button is clicked", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockResolvedValueOnce({
			errors: [],
			insightId: "test-insight",
			pixelReturn: [
				{
					isMeta: false,
					operationType: [],
					output: mockBase64PDF,
					pixelExpression: "",
					pixelId: "test-pixel",
					timeToRun: 0,
				},
			],
		} as MockPixelResponse);

		const { container } = render(
			<PDFViewerBlock id={blocks.pdfViewerWithEngine.id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const clearButton = container.querySelector(
				'button[aria-label="clear pdf"]',
			);
			expect(clearButton).toBeInTheDocument();
		});

		const clearButton = container.querySelector(
			'button[aria-label="clear pdf"]',
		);
		if (clearButton) {
			fireEvent.click(clearButton);
		}

		await waitFor(() => {
			expect(
				screen.getByText("Select a PDF from settings to view it here"),
			).toBeInTheDocument();
		});
	});

	it("does not render content when show is false", async () => {
		const { container } = render(
			<PDFViewerBlock id={blocks.pdfViewerHidden.id} />,
			{
				blocks: blocks,
			},
		);

		const pdfViewer = container.querySelector(
			"[data-block='pdfViewerHidden']",
		);
		expect(pdfViewer).toBeInTheDocument();
		expect(pdfViewer).toBeEmptyDOMElement();
	});

	it("renders loading state while fetching PDF", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		let resolvePixel: ((value: MockPixelResponse) => void) | undefined;
		const pixelPromise = new Promise<MockPixelResponse>((resolve) => {
			resolvePixel = resolve;
		});
		mockRunPixel.mockReturnValueOnce(pixelPromise);

		const { container } = render(
			<PDFViewerBlock id={blocks.pdfViewerWithEngine.id} />,
			{
				blocks: blocks,
			},
		);

		// Component should show loading while promise is pending
		await waitFor(() => {
			const loadingIndicator = container.querySelector(
				".MuiCircularProgress-root",
			);
			expect(loadingIndicator).toBeInTheDocument();
		});

		if (resolvePixel) {
			resolvePixel({
				errors: [],
				insightId: "test-insight",
				pixelReturn: [
					{
						isMeta: false,
						operationType: [],
						output: mockBase64PDF,
						pixelExpression: "",
						pixelId: "test-pixel",
						timeToRun: 0,
					},
				],
			});
		}
	});

	it("extracts filename from path correctly", async () => {
		const mockRunPixel = vi.mocked(sdk.runPixel);
		mockRunPixel.mockResolvedValueOnce({
			errors: [],
			insightId: "test-insight",
			pixelReturn: [
				{
					isMeta: false,
					operationType: [],
					output: mockBase64PDF,
					pixelExpression: "",
					pixelId: "test-pixel",
					timeToRun: 0,
				},
			],
		} as MockPixelResponse);

		const blockWithNestedPath = {
			...blocks,
			pdfViewerNested: {
				data: {
					style: {
						width: "100%",
						height: "82%",
						padding: "8px",
					},
					selectedPdf: "folder/subfolder/nested/document.pdf",
					engineId: "test-engine",
					show: "true",
				},
				id: "pdfViewerNested",
				widget: "pdfViewer",
				slots: {},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
			},
		};

		render(<PDFViewerBlock id={blockWithNestedPath.pdfViewerNested.id} />, {
			blocks: blockWithNestedPath,
		});

		await waitFor(() => {
			const header = screen.getByText("document.pdf");
			expect(header).toBeInTheDocument();
		});
	});

	it("applies custom styles", async () => {
		const customStyleBlocks = {
			...blocks,
			pdfViewerCustomStyle: {
				data: {
					style: {
						width: "50%",
						height: "400px",
						padding: "16px",
					},
					selectedPdf: null,
					engineId: "",
					show: "true",
				},
				id: "pdfViewerCustomStyle",
				widget: "pdfViewer",
				slots: {},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
			},
		};

		const { container } = render(
			<PDFViewerBlock id={customStyleBlocks.pdfViewerCustomStyle.id} />,
			{
				blocks: customStyleBlocks,
			},
		);

		const pdfViewer = container.querySelector(
			"[data-block='pdfViewerCustomStyle']",
		);
		expect(pdfViewer).toHaveStyle({
			width: "50%",
			height: "400px",
			padding: "16px",
		});
	});
});
