import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { trashEmail } from "../api/microsoft";
import { DeleteEmailDialog } from "./delete-email-dialog";

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => ({ actions: {} }) }));
vi.mock("../api/microsoft", () => ({ trashEmail: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("waits for explicit confirmation and moves only the selected message", async () => {
	const user = userEvent.setup();
	const onClose = vi.fn();
	const onDeleted = vi.fn();
	vi.mocked(trashEmail).mockResolvedValue(undefined);
	render(
		<DeleteEmailDialog
			sourceId="selected-email"
			subject="Review"
			onClose={onClose}
			onDeleted={onDeleted}
		/>,
	);
	expect(trashEmail).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Move to Trash" }));
	await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
	expect(trashEmail).toHaveBeenCalledWith({}, "selected-email");
	expect(onClose).toHaveBeenCalledOnce();
});
it("keeps failures visible without removing the email", async () => {
	const user = userEvent.setup();
	const onDeleted = vi.fn();
	const onClose = vi.fn();
	vi.mocked(trashEmail).mockRejectedValue(new Error("Connection lost"));
	render(
		<DeleteEmailDialog
			sourceId="selected-email"
			subject="Review"
			onClose={onClose}
			onDeleted={onDeleted}
		/>,
	);
	await user.click(screen.getByRole("button", { name: "Move to Trash" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Connection lost",
	);
	expect(onDeleted).not.toHaveBeenCalled();
	expect(onClose).not.toHaveBeenCalled();
});
