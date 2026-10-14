import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { UsagePayload } from "./usage-payload";

const originalClipboard = Object.getOwnPropertyDescriptor(
	navigator,
	"clipboard",
);
const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
	writeText.mockReset().mockResolvedValue(undefined);
	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: { writeText },
	});
	vi.spyOn(toast, "success").mockImplementation(() => "copied");
	vi.spyOn(toast, "error").mockImplementation(() => "failed");
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	if (originalClipboard)
		Object.defineProperty(navigator, "clipboard", originalClipboard);
	else Reflect.deleteProperty(navigator, "clipboard");
});

describe("retained usage payloads", () => {
	it("expands nested JSON, keeps markup inert, and copies all data including collapsed values", async () => {
		const data = {
			messages: [
				{
					content: '<img src="x">Zo\u00eb \u6771\u4eac',
					flags: { cached: false },
				},
			],
		};
		render(<UsagePayload label="Request" value={JSON.stringify(data)} />);
		expect(
			screen.queryByText(JSON.stringify(data.messages[0].content)),
		).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", {
				name: "Expand All Request JSON Nodes",
			}),
		);
		expect(
			screen.getByText(JSON.stringify(data.messages[0].content)),
		).toBeInTheDocument();
		expect(document.querySelector("img")).toBeNull();
		fireEvent.click(
			screen.getByRole("button", {
				name: "Collapse All Request JSON Nodes",
			}),
		);
		expect(
			screen.queryByText(JSON.stringify(data.messages[0].content)),
		).not.toBeInTheDocument();
		const branch = screen.getByRole("button", { name: "Expand messages" });
		expect(branch).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(branch);
		expect(branch).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(
			screen.getByRole("button", { name: "Copy Request JSON" }),
		);
		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith(JSON.stringify(data)),
		);
	});

	it.each(["0", "false", "null", '""', "[]", "{}"])(
		"preserves the valid JSON value %s",
		async (value) => {
			render(<UsagePayload label="Response" value={value} />);
			expect(
				screen.queryByText("Content Was Not Retained."),
			).not.toBeInTheDocument();
			fireEvent.click(
				screen.getByRole("button", { name: "Copy Response JSON" }),
			);
			await waitFor(() => expect(writeText).toHaveBeenCalledWith(value));
		},
	);

	it("copies the original JSON without changing whitespace or numeric precision", async () => {
		const content = '{\n  "id": 9007199254740993, "value": 1.00\n}';
		render(<UsagePayload label="Request" value={content} />);
		fireEvent.click(
			screen.getByRole("button", { name: "Copy Request JSON" }),
		);
		await waitFor(() => expect(writeText).toHaveBeenCalledWith(content));
	});

	it("preserves malformed JSON and plain text without interpreting markup", async () => {
		const content = '{"incomplete": true\n<img src="x">';
		render(<UsagePayload label="Input / Prompt" value={content} />);
		expect(
			screen.getByRole("region", { name: "Input / Prompt Content" })
				.textContent,
		).toBe(content);
		expect(document.querySelector("img")).toBeNull();
		expect(
			screen.queryByRole("button", { name: /Expand All/ }),
		).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", { name: "Copy Input / Prompt Text" }),
		);
		await waitFor(() => expect(writeText).toHaveBeenCalledWith(content));
	});

	it("distinguishes missing content from a recorded empty string", () => {
		const { rerender } = render(
			<UsagePayload label="Response" value={null} />,
		);
		expect(
			screen.getByText("Content Was Not Retained."),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Copy/ }),
		).not.toBeInTheDocument();
		rerender(<UsagePayload label="Response" value="" />);
		expect(
			screen.getByText("Empty Content Was Recorded."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Copy Response Text" }),
		).toBeEnabled();
	});

	it("reports clipboard failure and allows retry", async () => {
		writeText.mockRejectedValueOnce(new Error("Clipboard Unavailable"));
		render(<UsagePayload label="Response" value="Retained Text" />);
		const copy = screen.getByRole("button", { name: "Copy Response Text" });
		fireEvent.click(copy);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				"Unable To Copy Content. Check Clipboard Permissions.",
			),
		);
		expect(toast.success).not.toHaveBeenCalled();
		fireEvent.click(copy);
		await waitFor(() =>
			expect(toast.success).toHaveBeenCalledWith("Response Copied"),
		);
	});
});
