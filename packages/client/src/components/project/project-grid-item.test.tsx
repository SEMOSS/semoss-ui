import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import {
	ProjectGridItem,
	type ProjectGridItemProps,
} from "./project-grid-item";

const project: Project = {
	project_id: "agent-with-photo",
	project_name: "platform",
	project_display_name: "Image Test Agent",
	project_type: "WORKSPACE",
};

/** Render the same catalog item used by both agent catalog layouts. */
function renderItem(variant: ProjectGridItemProps["variant"], value = project) {
	return render(
		<MemoryRouter>
			<ProjectGridItem
				variant={variant}
				project={value}
				path={`/agent/${value.project_id}/edit`}
				isFavorited={false}
				showFavorite={false}
				showGlobal={false}
				showClone={false}
				showDelete={false}
				showInfo={false}
				onFavorite={vi.fn()}
				onGlobal={vi.fn()}
				onClone={vi.fn()}
				onDelete={vi.fn()}
				onInfo={vi.fn()}
			/>
		</MemoryRouter>,
	);
}

describe("ProjectGridItem images", () => {
	const originalModule = Env.MODULE;
	let requestedImages: HTMLImageElement[];

	beforeEach(() => {
		Env.update({ MODULE: "/Monolith" });
		requestedImages = [];
		// jsdom does not load image bytes. Keep real image elements and control
		// their network events, so the real Avatar primitive handles fallbacks.
		vi.stubGlobal(
			"Image",
			new Proxy(window.Image, {
				construct() {
					const image = document.createElement("img");
					requestedImages.push(image);
					return image;
				},
			}),
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		Env.update({ MODULE: originalModule });
	});

	it.each(["LIST", "CARD"] as const)(
		"replaces initials with the saved project image in the %s catalog",
		async (variant) => {
			const { container } = renderItem(variant);
			expect(screen.getByText("ITA")).toBeInTheDocument();
			await waitFor(() => expect(requestedImages).toHaveLength(1));
			const image = requestedImages[0];
			expect(image.getAttribute("src")).toBe(
				"/Monolith/api/project-agent-with-photo/projectImage/download",
			);
			fireEvent.load(image);
			await waitFor(() => {
				expect(container.querySelector("img")).toHaveAttribute(
					"src",
					image.getAttribute("src"),
				);
			});
			expect(screen.queryByText("ITA")).not.toBeInTheDocument();
			expect(container.querySelector("img")).toHaveAttribute("alt", "");
			expect(screen.getByRole("link")).toHaveAttribute(
				"href",
				"/agent/agent-with-photo/edit",
			);
		},
	);

	it.each(["LIST", "CARD"] as const)(
		"keeps initials when the image cannot load in the %s catalog",
		async (variant) => {
			const { container } = renderItem(variant);
			await waitFor(() => expect(requestedImages).toHaveLength(1));
			fireEvent.error(requestedImages[0]);
			expect(screen.getByText("ITA")).toBeInTheDocument();
			expect(container.querySelector("img")).not.toBeInTheDocument();
		},
	);

	it("uses the configured backend path and encodes the project ID", async () => {
		Env.update({ MODULE: "https://semoss.example/Monolith" });
		renderItem("LIST", { ...project, project_id: "agent #1" });
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		expect(requestedImages[0].src).toBe(
			"https://semoss.example/Monolith/api/project-agent%20%231/projectImage/download",
		);
	});
});
