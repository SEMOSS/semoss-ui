import { render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { RoomLoading } from "./room-loading";

const sceneTime = (container: HTMLElement) =>
	(container.firstElementChild as HTMLElement).style.getPropertyValue(
		"--room-loading-t",
	);

it("opens a saved room without import steps", () => {
	const { container } = render(<RoomLoading />);
	expect(screen.getByText("Opening room")).toBeVisible();
	expect(screen.queryByRole("list")).not.toBeInTheDocument();
	expect(container.querySelector("[data-docked]")).toBeNull();
});

it("lands each finished step's mark and announces the step underway", () => {
	const { container } = render(
		<RoomLoading step={1} subject="Q3 budget review" channel="email" />,
	);
	const [load, open, save] = screen.getAllByRole("listitem");
	expect(within(open).getByRole("status", { name: "Loading" })).toBeVisible();
	expect(within(load).queryByRole("status")).toBeNull();
	expect(within(save).queryByRole("status")).toBeNull();
	expect(container.querySelectorAll("[data-docked]")).toHaveLength(1);
	expect(screen.getByText("Step 2 of 3: Open a room")).toBeInTheDocument();
	expect(screen.getByText("Q3 budget review · from Outlook")).toBeVisible();
});

it("carries the scene on when a loader replaces another, and restarts it later", () => {
	const now = vi.spyOn(performance, "now").mockReturnValue(10_000);
	const view = render(<RoomLoading key="thread" step={0} />, {
		wrapper: StrictMode,
	});
	now.mockReturnValue(11_200);
	// one commit swaps them, as a thread's route does when it hands over to its room
	view.rerender(<RoomLoading key="room" />);
	expect(sceneTime(view.container)).toBe("-1200ms");
	view.unmount();
	now.mockReturnValue(13_000);
	expect(sceneTime(render(<RoomLoading />).container)).toBe("0ms");
	now.mockRestore();
});
