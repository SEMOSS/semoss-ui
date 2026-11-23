import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { OntologyRedirect } from "./ontology-redirect";

afterEach(cleanup);

/** Shows where the redirect landed. */
const Landed = () => {
	const { pathname, search } = useLocation();
	return <p>{`${pathname}${search}`}</p>;
};

describe("OntologyRedirect", () => {
	it("sends the old address to the Ontology, keeping its view", () => {
		render(
			<MemoryRouter
				initialEntries={[
					"/settings/dependencies?focus=agent&lens=trace",
				]}
			>
				<Routes>
					<Route
						path="/settings/dependencies"
						element={<OntologyRedirect />}
					/>
					<Route path="/settings/ontology" element={<Landed />} />
				</Routes>
			</MemoryRouter>,
		);
		expect(
			screen.getByText("/settings/ontology?focus=agent&lens=trace"),
		).toBeInTheDocument();
	});
});
