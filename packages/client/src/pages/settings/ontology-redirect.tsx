import { Navigate, useLocation } from "react-router";

/**
 * Sends the Ontology's old address, `settings/dependencies`, to
 * `settings/ontology`, keeping the query string: the Ontology keeps its view
 * (search, trace, user, filters) there, so a shared link still opens the
 * same view.
 */
export const OntologyRedirect = () => {
	const { search } = useLocation();
	return (
		<Navigate
			to={{ pathname: "../ontology", search }}
			relative="path"
			replace
		/>
	);
};
