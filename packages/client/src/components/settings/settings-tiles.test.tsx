import "@testing-library/jest-dom";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsTiles } from "./settings-tiles";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	adminMode: false,
	setProjectCustomLogin: vi.fn(),
	setProjectGlobal: vi.fn(),
	setProjectVisiblity: vi.fn(),
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	useSession: (select: (state: { canPerform: () => boolean }) => unknown) =>
		select({ canPerform: () => true }),
}));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/api/projects", () => ({
	setProjectCustomLogin: mocks.setProjectCustomLogin,
	setProjectGlobal: mocks.setProjectGlobal,
	setProjectTemplate: vi.fn(),
	setProjectVisiblity: mocks.setProjectVisiblity,
}));
vi.mock("@/api/engines", () => ({
	setEngineGlobal: vi.fn(),
	setEngineVisiblity: vi.fn(),
}));
vi.mock("@/hooks/useSettings", () => ({
	useSettings: () => ({ adminMode: mocks.adminMode }),
}));
vi.mock("@/features/resource-delete/use-delete-resource", () => ({
	useDeleteResource: () => ({ deleteResource: vi.fn(), isDeleting: false }),
}));

const PROJECT_ID = "p1";
const ENGINE_ID = "e1";
const SWITCH_NAME = "Login App has a custom login page";

/**
 * @param hasCustomLogin - whether the project's info says it has its own login page
 */
const projectInfo = (hasCustomLogin: boolean) => ({
	status: "SUCCESS",
	data: {
		project_global: false,
		project_discoverable: false,
		project_is_template: false,
		project_has_custom_login: hasCustomLogin,
	},
});

describe("SettingsTiles custom login page", () => {
	beforeEach(() => {
		mocks.adminMode = false;
		mocks.setProjectCustomLogin.mockResolvedValue({
			data: { success: true },
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("shows the project's setting and turns it on for its owner", async () => {
		mocks.usePixel.mockReturnValue(projectInfo(false));

		render(
			<SettingsTiles type="PROJECT" id={PROJECT_ID} name="Login App" />,
		);

		const toggle = screen.getByRole("switch", { name: SWITCH_NAME });
		expect(toggle).not.toBeChecked();
		expect(mocks.usePixel).toHaveBeenCalledWith(
			"ProjectInfo(project='p1')",
		);

		fireEvent.click(toggle);

		await waitFor(() =>
			expect(
				screen.getByRole("switch", { name: SWITCH_NAME }),
			).toBeChecked(),
		);
		expect(mocks.setProjectCustomLogin).toHaveBeenCalledWith(
			false,
			"p1",
			true,
		);
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			"Login App now shows its own login page to signed out visitors",
		);
	});

	it("turns it off as an admin in admin mode", async () => {
		mocks.adminMode = true;
		mocks.usePixel.mockReturnValue(projectInfo(true));

		render(
			<SettingsTiles type="PROJECT" id={PROJECT_ID} name="Login App" />,
		);

		expect(mocks.usePixel).toHaveBeenCalledWith(
			"AdminProjectInfo(project='p1')",
		);
		const toggle = screen.getByRole("switch", { name: SWITCH_NAME });
		expect(toggle).toBeChecked();

		fireEvent.click(toggle);

		await waitFor(() =>
			expect(
				screen.getByRole("switch", { name: SWITCH_NAME }),
			).not.toBeChecked(),
		);
		expect(mocks.setProjectCustomLogin).toHaveBeenCalledWith(
			true,
			"p1",
			false,
		);
	});

	it("keeps the setting when the backend refuses the change", async () => {
		mocks.usePixel.mockReturnValue(projectInfo(false));
		mocks.setProjectCustomLogin.mockRejectedValue(
			new Error("Only this project's owners can change it"),
		);

		render(
			<SettingsTiles type="PROJECT" id={PROJECT_ID} name="Login App" />,
		);

		fireEvent.click(screen.getByRole("switch", { name: SWITCH_NAME }));

		await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
		expect(
			await screen.findByRole("switch", { name: SWITCH_NAME }),
		).not.toBeChecked();
	});

	it("has no custom login page tile for an engine", () => {
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: { engine_global: false, engine_discoverable: false },
		});

		render(<SettingsTiles type="DATABASE" id={ENGINE_ID} name="Sales" />);

		expect(
			screen.queryByRole("switch", { name: /custom login page/i }),
		).not.toBeInTheDocument();
	});
});

describe("SettingsTiles titles", () => {
	beforeEach(() => {
		mocks.adminMode = false;
		mocks.usePixel.mockReturnValue(projectInfo(false));
		mocks.setProjectGlobal.mockResolvedValue({ data: { success: true } });
		mocks.setProjectVisiblity.mockResolvedValue({
			data: { success: true },
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("titles each tile in Title Case", () => {
		render(
			<SettingsTiles type="PROJECT" id={PROJECT_ID} name="Login App" />,
		);

		expect(screen.getByText("Private")).toBeInTheDocument();
		expect(screen.getByText("Non-Discoverable")).toBeInTheDocument();
		expect(screen.getByText("Use as Template")).toBeInTheDocument();
		expect(screen.getByText("Custom Login Page")).toBeInTheDocument();
	});

	it("names Private as Public once the app is made public", async () => {
		render(
			<SettingsTiles type="PROJECT" id={PROJECT_ID} name="Login App" />,
		);

		const toggle = screen.getByRole("switch", {
			name: "Login App is private",
		});
		expect(toggle).toBeChecked();
		fireEvent.click(toggle);

		expect(await screen.findByText("Public")).toBeInTheDocument();
		expect(screen.queryByText("Private")).not.toBeInTheDocument();
		expect(
			screen.getByRole("switch", { name: "Login App is private" }),
		).not.toBeChecked();
		expect(mocks.setProjectGlobal).toHaveBeenCalledWith(false, "p1", true);
	});

	it("names Non-Discoverable as Discoverable once the app is made discoverable", async () => {
		render(
			<SettingsTiles type="PROJECT" id={PROJECT_ID} name="Login App" />,
		);

		fireEvent.click(
			screen.getByRole("switch", {
				name: "Login App is non-discoverable",
			}),
		);

		expect(await screen.findByText("Discoverable")).toBeInTheDocument();
		expect(screen.queryByText("Non-Discoverable")).not.toBeInTheDocument();
		expect(
			screen.getByRole("switch", {
				name: "Login App is non-discoverable",
			}),
		).not.toBeChecked();
		expect(mocks.setProjectVisiblity).toHaveBeenCalledWith(
			false,
			"p1",
			true,
		);
	});
});
