import { Navigate, useParams } from "react-router";
import { KnowledgeDetail } from "@/features/knowledge/knowledge-detail";

/** The knowledge base the route names, or the library when it names none. */
export const KnowledgeDetailPage = () => {
	const { knowledgeId } = useParams<{ knowledgeId: string }>();
	if (!knowledgeId) {
		return <Navigate to="/knowledge" replace />;
	}
	return <KnowledgeDetail knowledgeId={knowledgeId} />;
};
