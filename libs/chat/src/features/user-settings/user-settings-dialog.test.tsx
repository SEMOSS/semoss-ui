import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlocksIcon, ServerIcon } from "lucide-react";
import { expect, test, vi } from "vitest";
import { UserSettingsDialog } from "./user-settings-dialog";
import type { UserSettingsSection } from "./user-settings-section";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

const PAGES: UserSettingsSection[] = [
	{
		id: "connectors",
		label: "Connectors",
		icon: BlocksIcon,
		content: <p>Connector settings</p>,
	},
	{
		id: "server",
		label: "Server",
		icon: ServerIcon,
		content: <p>Server settings</p>,
		footer: <p>Version</p>,
	},
];

/** The dialog on a page, with the host's pages. */
const renderDialog = (section: string | undefined) => {
	const onSectionChange = vi.fn();
	render(
		<UserSettingsDialog
			open
			onOpenChange={vi.fn()}
			section={section}
			onSectionChange={onSectionChange}
			pages={PAGES}
		/>,
	);
	return { onSectionChange };
};

test("lists the pages it is given and shows the one named", () => {
	renderDialog("server");

	expect(
		screen
			.getAllByRole("button", { name: /Connectors|Server/ })
			.map((button) => button.textContent),
	).toEqual(["Connectors", "Server"]);
	expect(screen.getByRole("heading", { name: "Server" })).toBeVisible();
	expect(screen.getByText("Server settings")).toBeVisible();
	expect(screen.getByText("Version")).toBeVisible();
	expect(screen.queryByText("Connector settings")).toBeNull();
});

test("an unknown page shows the first, and a page button asks for its page", async () => {
	const user = userEvent.setup();
	const { onSectionChange } = renderDialog("missing");

	expect(screen.getByText("Connector settings")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Server" }));
	expect(onSectionChange).toHaveBeenCalledWith("server");
});
