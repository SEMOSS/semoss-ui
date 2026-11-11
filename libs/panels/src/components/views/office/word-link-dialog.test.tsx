import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WordLinkDialog } from "./word-link-dialog";

afterEach(cleanup);

describe("Word host hyperlink dialog", () => {
	it.each([
		["example.com/report", "https://example.com/report"],
		["http://example.com", "http://example.com"],
		["mailto:reader@example.com", "mailto:reader@example.com"],
		["#section-2", "#section-2"],
	])(
		"normalizes %s without rewriting existing schemes or bookmarks",
		async (address, expected) => {
			const apply = vi.fn(() => true);
			const close = vi.fn();
			render(
				<WordLinkDialog
					request={{
						href: null,
						text: "Report",
						apply,
						remove: () => false,
					}}
					readOnly={false}
					onClose={close}
				/>,
			);
			fireEvent.change(screen.getByLabelText("Link address"), {
				target: { value: address },
			});
			fireEvent.click(screen.getByRole("button", { name: "Apply link" }));
			await waitFor(() =>
				expect(apply).toHaveBeenCalledWith(expected, "Report"),
			);
			expect(close).toHaveBeenCalledOnce();
		},
	);

	it("keeps a refused operation visible and blocks unsafe schemes", async () => {
		const apply = vi.fn(() => false);
		const close = vi.fn();
		render(
			<WordLinkDialog
				request={{ href: null, text: "", apply, remove: () => false }}
				readOnly={false}
				onClose={close}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Link address"), {
			target: { value: "javascript:alert(1)" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Apply link" }));
		await screen.findByRole("alert");
		expect(apply).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText("Link address"), {
			target: { value: "example.com" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Apply link" }));
		await waitFor(() => expect(apply).toHaveBeenCalledOnce());
		expect(close).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"could not be applied",
		);
	});

	it("disables mutation when permission is revoked while the dialog is open", () => {
		const request = {
			href: "https://example.com",
			text: "Report",
			apply: vi.fn(() => true),
			remove: vi.fn(() => true),
		};
		const { rerender } = render(
			<WordLinkDialog
				request={request}
				readOnly={false}
				onClose={vi.fn()}
			/>,
		);
		rerender(
			<WordLinkDialog request={request} readOnly onClose={vi.fn()} />,
		);
		expect(
			screen.getByRole("button", { name: "Apply link" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Remove link" }),
		).toBeDisabled();
		expect(request.apply).not.toHaveBeenCalled();
	});
});
