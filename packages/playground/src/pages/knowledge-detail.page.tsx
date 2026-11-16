import { useParams } from "react-router";
import { KnowledgeDetail } from "@/features/knowledge/knowledge-detail";

/** The knowledge base the route names. */
export const KnowledgeDetailPage = () => {
	const { knowledgeId } = useParams<{ knowledgeId: string }>();
	return <KnowledgeDetail knowledgeId={knowledgeId} />;
};
