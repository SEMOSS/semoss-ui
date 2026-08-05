/// <reference path="../vite-env.d.ts" />
// Shared engine/subtype image lookup used outside import pages.
// Keep in sync with import constants mappings where needed.
//
// Asset files are referenced by filename only; the bundler emits each one as
// its own chunk via `import.meta.glob`, so consumers only download icons they
// actually render.

const ENGINE_ICON_LOADERS = import.meta.glob(
	"../assets/img/*.{png,svg,jpg,jpeg,gif}",
	{ query: "?url", import: "default" },
) as Record<string, () => Promise<string>>;

const ENGINE_ICON_BASE_PATH = "../assets/img/";

export const ENGINE_ICON_FALLBACK_FILE = "BRAIN.png";

export const loadEngineIcon = async (
	filename: string,
): Promise<string | null> => {
	const loader = ENGINE_ICON_LOADERS[`${ENGINE_ICON_BASE_PATH}${filename}`];
	if (!loader) return null;

	try {
		return await loader();
	} catch {
		return null;
	}
};

interface EngineImageEntry {
	name: string;
	icon: string;
}

export const ENGINE_IMAGES: Record<string, EngineImageEntry[]> = {
	MODEL: [
		// Stable provider/brand keys (keep alphabetical)
		{ name: "AZURE_OPEN_AI", icon: "AZURE_OPEN_AI.svg" },
		{ name: "BEDROCK", icon: "BEDROCK.svg" },
		{ name: "BRAIN", icon: "BRAIN.png" },
		{ name: "CLAUDE", icon: "CLAUDE_AI.svg" },
		{ name: "GEMINI", icon: "GEMINI_COLOR.svg" },
		{ name: "HUGGINGFACE", icon: "HUGGINGFACE_COLOR.svg" },
		{ name: "META", icon: "META_COLOR.svg" },
		{ name: "NEMO", icon: "NEMO.png" },
		{ name: "OPEN_AI", icon: "OPEN_AI.svg" },
		{ name: "PERPLEXITY", icon: "PERPLEXITY.svg" },
		{ name: "TEXT_EMBEDDINGS", icon: "HUGGINGFACE_COLOR.svg" },
		{ name: "TEXT_GENERATION", icon: "HUGGINGFACE_COLOR.svg" },
		{ name: "VERTEX", icon: "GEMINI_COLOR.svg" },
		// Self-hosted / long-tail brand keys (keep alphabetical)
		{ name: "FALCON", icon: "FALCON_AI.png" },
		{ name: "FLAN_T5_LARGE", icon: "FLAN.jpg" },
		{ name: "MOSAIC_ML", icon: "MOSAIC.png" },
		{ name: "ORCA", icon: "ORCA.png" },
		{ name: "REPLIT_CODE_MODEL", icon: "REPLIT_CODE.png" },
		{ name: "STABLITY_AI", icon: "STABILITY_AI.png" },
	],
	FUNCTION: [
		{ name: "AWS_POLLY", icon: "AWS_POLLY.png" },
		{ name: "AWS_TEXTRACT", icon: "AWS_TEXTRACT.png" },
		{ name: "AWS_TEXTRACT_CUSTOM_EMBEDDINGS", icon: "AWS_TEXTRACT.png" },
		{ name: "AWS_TRANSCRIBE", icon: "AWS_TRANSCRIBE.png" },
		{
			name: "AWS_TRANSCRIBE_CUSTOM_EMBEDDINGS",
			icon: "AWS_TRANSCRIBE.png",
		},
		{ name: "AWS_Transcribe", icon: "AWS_TRANSCRIBE.png" },
		{
			name: "AZURE_DOCUMENT_INTELLIGENCE_CUSTOM_EMBEDDINGS",
			icon: "REST-API.svg",
		},
		{ name: "AZUREOCR", icon: "REST-API.svg" },
		{ name: "GOOGLE_OCR", icon: "GOOGLE_OCR.png" },
		{ name: "GOOGLE_OCR_CUSTOM_EMBEDDINGS", icon: "GOOGLE_OCR.png" },
		{ name: "GOOGLE_SPEECH_TO_TEXT", icon: "GOOGLE_SPEECH_TO_TEXT.png" },
		{ name: "IMAGE_DESCRIPTION", icon: "BRAIN.png" },
		{ name: "LOCAL_PYTHON", icon: "PYTHON.svg" },
		{ name: "LOCAL_PYTHON_CUSTOM_EMBEDDINGS", icon: "PYTHON.svg" },
		{ name: "OPENAI_TRANSCRIBE", icon: "OPEN_AI.svg" },
		{ name: "REST", icon: "REST-API.svg" },
		{ name: "ZIP", icon: "ZIP.svg" },
	],
	GUARDRAIL: [
		{ name: "DETOXIFY", icon: "PYTHON.svg" },
		{ name: "EMBEDDED_DETOXIFY", icon: "PYTHON.svg" },
		{ name: "EMBEDDED_GLINER", icon: "HUGGINGFACE_COLOR.svg" },
		{ name: "EMBEDDED_LAKERA_GUARD", icon: "BRAIN.png" },
		{
			name: "EMBEDDED_MICROSOFT_CONTENT_MODERATION",
			icon: "MICROSOFT.png",
		},
		{ name: "EMBEDDED_NVIDIA_NEMO", icon: "NEMO.png" },
		{ name: "EMBEDDED_OPENAI_MODERATION", icon: "OPEN_AI.svg" },
		{ name: "EMBEDDED_PERSPECTIVE_API", icon: "BRAIN.png" },
		{ name: "EMBEDDED_PROMPTGUARD_META", icon: "META_COLOR.svg" },
		{ name: "EMBEDDED_REBUFF", icon: "BRAIN.png" },
		{ name: "GLINER", icon: "HUGGINGFACE_COLOR.svg" },
		{ name: "LOCAL_PYTHON", icon: "PYTHON.svg" },
	],
	VECTOR: [
		{ name: "AWS_S3", icon: "AMAZON_S3.png" },
		{ name: "AZURE_AI_SEARCH", icon: "MICROSOFT.png" },
		{ name: "CHROMA", icon: "CHROMADB.png" },
		{ name: "ELASTIC_SEARCH", icon: "ELASTIC_SEARCH.svg" },
		{ name: "FAISS", icon: "META_COLOR.svg" },
		{ name: "MILVUS", icon: "MILVUS.png" },
		{ name: "OPEN_SEARCH", icon: "OPEN_SEARCH.png" },
		{ name: "PGVECTOR", icon: "POSTGRES.svg" },
		{ name: "PINECONE", icon: "PINECONE.png" },
		{ name: "PROXY", icon: "REST-API.svg" },
		{ name: "WEAVIATE", icon: "WEVIATE.png" },
		{ name: "ZIP", icon: "ZIP.svg" },
	],
	DATABASE: [
		{ name: "APACHE_JENA", icon: "APACHE_JENA.svg" },
		{ name: "ASTER_DB", icon: "ASTER.png" },
		{ name: "ATHENA", icon: "ATHENA.svg" },
		{ name: "BIG_QUERY", icon: "BIGQUERY.svg" },
		{ name: "CASSANDRA", icon: "CASSANDRA.svg" },
		{ name: "CLICKHOUSE", icon: "CLICKHOUSE.svg" },
		{ name: "CSV", icon: "CSV.svg" },
		{ name: "DATABRICKS", icon: "DATABRICKS.svg" },
		{ name: "DATASTAX", icon: "DATASTAX.png" },
		{ name: "DB2", icon: "DB2.png" },
		{ name: "DERBY", icon: "DERBY.png" },
		{ name: "ELASTIC_SEARCH", icon: "ELASTIC_SEARCH.svg" },
		{ name: "EXCEL", icon: "EXCEL.svg" },
		{ name: "H2", icon: "H2_DB.png" },
		{ name: "H2_DB", icon: "H2_DB.png" },
		{ name: "HIVE", icon: "HIVE.svg" },
		{ name: "IMPALA", icon: "IMPALA.svg" },
		{ name: "JENA", icon: "APACHE_JENA.svg" },
		{ name: "JENA_TDB", icon: "APACHE_JENA.svg" },
		{ name: "MARIA_DB", icon: "MARIA_DB.svg" },
		{ name: "MYSQL", icon: "MYSQL.svg" },
		{ name: "NEO4J", icon: "NEO4J.svg" },
		{ name: "OPEN_SEARCH", icon: "OPEN_SEARCH.png" },
		{ name: "ORACLE", icon: "ORACLE.svg" },
		{ name: "PHOENIX", icon: "PHOENIX.png" },
		{ name: "POSTGRES", icon: "POSTGRES.svg" },
		{ name: "RDF4J", icon: "RDF4J.svg" },
		{ name: "REDSHIFT", icon: "REDSHIFT.svg" },
		{ name: "SAP_HANA", icon: "SAP_HANA.svg" },
		{ name: "SEMOSS", icon: "SEMOSS_BLUE_LOGO.svg" },
		{ name: "SESAME", icon: "RDF4J.svg" },
		{ name: "SNOWFLAKE", icon: "SNOWFLAKE.svg" },
		{ name: "SQL_SERVER", icon: "SQL_SERVER.svg" },
		{ name: "SQLITE", icon: "SQLITE.svg" },
		{ name: "TERADATA", icon: "TERADATA.png" },
		{ name: "TIBCO", icon: "TIBCO.png" },
		{ name: "TINKER", icon: "TINKER.png" },
		{ name: "TRINO", icon: "TRINO.jpg" },
		{ name: "TSV", icon: "TSV.svg" },
		{ name: "ZIP", icon: "ZIP.svg" },
	],
	STORAGE: [
		{ name: "AMAZON_S3", icon: "AMAZON_S3.png" },
		{ name: "AMAZON_S3_NATIVE", icon: "AMAZON_S3.png" },
		{ name: "CEPH", icon: "CEPH.png" },
		{ name: "DREAMHOST", icon: "DREAMHOST.png" },
		{ name: "DROPBOX", icon: "DROPBOX.png" },
		{
			name: "GOOGLE_CLOUD_NATIVE_STORAGE",
			icon: "GOOGLE_CLOUD_STORAGE.svg",
		},
		{ name: "GOOGLE_CLOUD_STORAGE", icon: "GOOGLE_CLOUD_STORAGE.svg" },
		{ name: "GOOGLE_DRIVE_STORAGE", icon: "GOOGLE_DRIVE.png" },
		{ name: "LOCAL_FILE_SYSTEM", icon: "LOCAL_FILE_SYSTEM.png" },
		{ name: "MICROSOFT_AZURE_BLOB_STORAGE", icon: "AZURE_BLOB.svg" },
		{ name: "MICROSOFT_AZURE_NATIVE_BLOB_STORAGE", icon: "AZURE_BLOB.svg" },
		{ name: "MICROSOFT_ONEDRIVE", icon: "ONEDRIVE.png" },
		{ name: "MINIO", icon: "MINIO.png" },
		{ name: "NETWORK_FILE_SYSTEM", icon: "NETWORK_FILE_SYSTEM.png" },
		{ name: "SFTP", icon: "SFTP.png" },
		{ name: "ZIP", icon: "ZIP.svg" },
	],
};
