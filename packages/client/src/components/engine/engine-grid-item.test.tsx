import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Engine, loadEngineIcon } from "@semoss/shared";
import { EngineGridItem } from "./engine-grid-item";

const providers = [
	["DATABASE", "POSTGRES", "POSTGRES.svg"],
	["DATABASE", "MYSQL", "MYSQL.svg"],
	["MODEL", "OPEN_AI", "OPEN_AI.svg"],
	["MODEL", "CLAUDE", "CLAUDE_AI.svg"],
	["MODEL", "UNKNOWN_PROVIDER", "BRAIN.png"],
] satisfies [Engine["engine_type"], string, string][];

afterEach(cleanup);

describe.each(["LIST", "CARD"] as const)(
	"%s engine catalog icons",
	(variant) => {
		it.each(providers)(
			"uses the %s / %s provider asset (%s)",
			async (type, subtype, filename) => {
				const expectedIcon = await loadEngineIcon(filename);
				expect(expectedIcon).not.toBeNull();
				const engine: Engine = {
					engine_id: "provider-engine",
					engine_name: "Provider Engine",
					engine_type: type,
					engine_subtype: subtype,
				};
				const { container } = render(
					<MemoryRouter>
						<EngineGridItem
							variant={variant}
							path="/engine/provider-engine"
							engine={engine}
							isFavorited={false}
							showFavorite={false}
							showGlobal={false}
							showDelete={false}
							onFavorite={vi.fn()}
							onGlobalToggle={vi.fn()}
							onDelete={vi.fn()}
						/>
					</MemoryRouter>,
				);
				await waitFor(() =>
					expect(container.querySelector("img")).toHaveAttribute(
						"src",
						expectedIcon,
					),
				);
				expect(container.querySelector("img")).toHaveAttribute(
					"alt",
					"",
				);
				expect(container.querySelector("img")?.src).not.toContain(
					"/image/download",
				);
				expect(screen.getByRole("link")).toHaveAttribute(
					"href",
					"/engine/provider-engine",
				);
			},
		);
	},
);
