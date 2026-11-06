import { useParams } from "react-router";
import { KnowledgeDetailView } from "@semoss/chat";

/**
 * The knowledge source the address names.
 *
 * @component
 */
export const KnowledgeDetailPage = () => {
	const { knowledgeId = "" } = useParams<{ knowledgeId: string }>();
	return <KnowledgeDetailView knowledgeId={knowledgeId} />;
};
