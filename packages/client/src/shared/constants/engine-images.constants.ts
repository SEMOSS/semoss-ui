// Shared engine/subtype image lookup used outside import pages.
// Keep in sync with import constants mappings where needed.

import AMAZON_S3 from "@/assets/img/AMAZON_S3.png";
import APACHE_JENA from "@/assets/img/APACHE_JENA.svg";
import ASTER from "@/assets/img/ASTER.png";
import ATHENA from "@/assets/img/ATHENA.png";
import AWS_POLLY from "@/assets/img/AWS_POLLY.png";
import AWS_TEXTRACT from "@/assets/img/AWS_TEXTRACT.png";
import AWS_TRANSCRIBE from "@/assets/img/AWS_TRANSCRIBE.png";
import AZURE_BLOB from "@/assets/img/AZURE_BLOB.svg";
import AZURE_OPEN_AI from "@/assets/img/AZURE_OPEN_AI.svg";
import BEDROCK from "@/assets/img/BEDROCK.svg";
import BIGQUERY from "@/assets/img/BIGQUERY.png";
import BRAIN from "@/assets/img/BRAIN.png";
import CASSANDRA from "@/assets/img/CASSANDRA.svg";
import CEPH from "@/assets/img/CEPH.png";
import CHROMADB from "@/assets/img/CHROMADB.png";
import CLAUDE from "@/assets/img/CLAUDE_AI.svg";
import CLICKHOUSE from "@/assets/img/CLICKHOUSE.png";
import CSV from "@/assets/img/CSV.svg";
import DATABRICKS from "@/assets/img/DATABRICKS.png";
import DATASTAX from "@/assets/img/DATASTAX.png";
import DB2 from "@/assets/img/DB2.png";
import DERBY from "@/assets/img/DERBY.png";
import DETOXIFY from "@/assets/img/DETOXIFY.png";
import DREAMHOST from "@/assets/img/DREAMHOST.png";
import DROPBOX from "@/assets/img/DROPBOX.png";
import ELASTIC_SEARCH from "@/assets/img/ELASTIC_SEARCH.svg";
import EXCEL from "@/assets/img/EXCEL.png";
import FALCON from "@/assets/img/FALCON_AI.png";
import FLAN from "@/assets/img/FLAN.jpg";
import GEMINI from "@/assets/img/GEMINI_COLOR.svg";
import GLINER from "@/assets/img/GLINER.png";
import GOOGLE_CLOUD from "@/assets/img/GOOGLE_CLOUD_STORAGE.svg";
import GOOGLE_DRIVE from "@/assets/img/GOOGLE_DRIVE.png";
import GOOGLE_OCR from "@/assets/img/GOOGLE_OCR.png";
import GOOGLE_SPEECH_TO_TEXT from "@/assets/img/GOOGLE_SPEECH_TO_TEXT.png";
import H2_DB from "@/assets/img/H2_DB.png";
import HIVE from "@/assets/img/HIVE.jpg";
import HUGGINGFACE from "@/assets/img/HUGGINGFACE_COLOR.svg";
import IMPALA from "@/assets/img/IMPALA.png";
import LOCAL_FILE_SYSTEM from "@/assets/img/LOCAL_FILE_SYSTEM.png";
import MARIA_DB from "@/assets/img/MARIA_DB.png";
import META from "@/assets/img/META_COLOR.svg";
import MILVUS from "@/assets/img/MILVUS.png";
import MINIO from "@/assets/img/MINIO.png";
import MOSAIC from "@/assets/img/MOSAIC.png";
import MYSQL from "@/assets/img/MYSQL.svg";
import NEMO from "@/assets/img/NEMO.png";
import NEO4J from "@/assets/img/NEO4J.png";
import NETWORK_FILE_SYSTEM from "@/assets/img/NETWORK_FILE_SYSTEM.png";
import ONEDRIVE from "@/assets/img/ONEDRIVE.png";
import OPEN_AI from "@/assets/img/OPEN_AI.svg";
import OPEN_SEARCH from "@/assets/img/OPEN_SEARCH.png";
import ORACLE from "@/assets/img/ORACLE.svg";
import ORCA from "@/assets/img/ORCA.png";
import PERPLEXITY from "@/assets/img/PERPLEXITY.svg";
import PHOENIX from "@/assets/img/PHOENIX.png";
import PINECONE from "@/assets/img/PINECONE.png";
import POSTGRES from "@/assets/img/POSTGRES.svg";
import PYTHON from "@/assets/img/PYTHON.svg";
import RDF4J from "@/assets/img/RDF4J.svg";
import REDSHIFT from "@/assets/img/REDSHIFT.png";
import REPLIT from "@/assets/img/REPLIT_CODE.png";
import REST_API from "@/assets/img/REST-API.svg";
import SAP_HANA from "@/assets/img/SAP_HANA.png";
import SEMOSS from "@/assets/img/SEMOSS_BLUE_LOGO.svg";
import SFTP from "@/assets/img/SFTP.png";
import SNOWFLAKE from "@/assets/img/SNOWFLAKE.png";
import SQL_SERVER from "@/assets/img/SQL_SERVER.png";
import SQLITE from "@/assets/img/SQLITE.svg";
import STABILITY_AI from "@/assets/img/STABILITY_AI.png";
import TERADATA from "@/assets/img/TERADATA.png";
import TIBCO from "@/assets/img/TIBCO.png";
import TINKER from "@/assets/img/TINKER.png";
import TRINO from "@/assets/img/TRINO.jpg";
import TSV from "@/assets/img/TSV.svg";
import WEVIATE from "@/assets/img/WEVIATE.png";
import ZIP from "@/assets/img/ZIP.png";
import MICROSOFT from "@/assets/loginProviders/MICROSOFT.png";

export const ENGINE_IMAGES = {
	MODEL: [
		// Stable provider/brand keys (keep alphabetical)
		{
			name: "AZURE_OPEN_AI",
			icon: AZURE_OPEN_AI,
		},
		{
			name: "BEDROCK",
			icon: BEDROCK,
		},
		{
			name: "BRAIN",
			icon: BRAIN,
		},
		{
			name: "CLAUDE",
			icon: CLAUDE,
		},
		{
			name: "GEMINI",
			icon: GEMINI,
		},
		{
			name: "HUGGINGFACE",
			icon: HUGGINGFACE,
		},
		{
			name: "META",
			icon: META,
		},
		{
			name: "NEMO",
			icon: NEMO,
		},
		{
			name: "OPEN_AI",
			icon: OPEN_AI,
		},
		{
			name: "PERPLEXITY",
			icon: PERPLEXITY,
		},
		{
			name: "TEXT_EMBEDDINGS",
			icon: HUGGINGFACE,
		},
		{
			name: "TEXT_GENERATION",
			icon: HUGGINGFACE,
		},
		{
			name: "VERTEX",
			icon: GEMINI,
		},
		// Self-hosted / long-tail brand keys (keep alphabetical)
		{
			name: "FALCON",
			icon: FALCON,
		},
		{
			name: "FLAN_T5_LARGE",
			icon: FLAN,
		},
		{
			name: "MOSAIC_ML",
			icon: MOSAIC,
		},
		{
			name: "ORCA",
			icon: ORCA,
		},
		{
			name: "REPLIT_CODE_MODEL",
			icon: REPLIT,
		},
		{
			name: "STABLITY_AI",
			icon: STABILITY_AI,
		},
	],
	FUNCTION: [
		{
			name: "AWS_POLLY",
			icon: AWS_POLLY,
		},
		{
			name: "AWS_TEXTRACT",
			icon: AWS_TEXTRACT,
		},
		{
			name: "AWS_TEXTRACT_CUSTOM_EMBEDDINGS",
			icon: AWS_TEXTRACT,
		},
		{
			name: "AWS_TRANSCRIBE",
			icon: AWS_TRANSCRIBE,
		},
		{
			name: "AWS_TRANSCRIBE_CUSTOM_EMBEDDINGS",
			icon: AWS_TRANSCRIBE,
		},
		{
			name: "AWS_Transcribe",
			icon: AWS_TRANSCRIBE,
		},
		{
			name: "AZURE_DOCUMENT_INTELLIGENCE_CUSTOM_EMBEDDINGS",
			icon: REST_API,
		},
		{
			name: "AZUREOCR",
			icon: REST_API,
		},
		{
			name: "GOOGLE_OCR",
			icon: GOOGLE_OCR,
		},
		{
			name: "GOOGLE_OCR_CUSTOM_EMBEDDINGS",
			icon: GOOGLE_OCR,
		},
		{
			name: "GOOGLE_SPEECH_TO_TEXT",
			icon: GOOGLE_SPEECH_TO_TEXT,
		},
		{
			name: "IMAGE_DESCRIPTION",
			icon: BRAIN,
		},
		{
			name: "LOCAL_PYTHON",
			icon: PYTHON,
		},
		{
			name: "LOCAL_PYTHON_CUSTOM_EMBEDDINGS",
			icon: PYTHON,
		},
		{
			name: "OPENAI_TRANSCRIBE",
			icon: OPEN_AI,
		},
		{
			name: "REST",
			icon: REST_API,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
	GUARDRAIL: [
		{
			name: "DETOXIFY",
			icon: DETOXIFY,
		},
		{
			name: "DETOXIFY",
			icon: DETOXIFY,
		},
		{
			name: "EMBEDDED_DETOXIFY",
			icon: DETOXIFY,
		},
		{
			name: "EMBEDDED_GLINER",
			icon: GLINER,
		},
		{
			name: "EMBEDDED_LAKERA_GUARD",
			icon: BRAIN,
		},
		{
			name: "EMBEDDED_MICROSOFT_CONTENT_MODERATION",
			icon: MICROSOFT,
		},
		{
			name: "EMBEDDED_NVIDIA_NEMO",
			icon: NEMO,
		},
		{
			name: "EMBEDDED_OPENAI_MODERATION",
			icon: OPEN_AI,
		},
		{
			name: "EMBEDDED_PERSPECTIVE_API",
			icon: BRAIN,
		},
		{
			name: "EMBEDDED_PROMPTGUARD_META",
			icon: META,
		},
		{
			name: "EMBEDDED_REBUFF",
			icon: BRAIN,
		},
		{
			name: "GLINER",
			icon: GLINER,
		},
		{
			name: "GLINER",
			icon: GLINER,
		},
	],
	VECTOR: [
		{
			name: "AWS_S3",
			icon: AMAZON_S3,
		},
		{
			name: "AZURE_AI_SEARCH",
			icon: MICROSOFT,
		},
		{
			name: "CHROMA",
			icon: CHROMADB,
		},
		{
			name: "ELASTIC_SEARCH",
			icon: ELASTIC_SEARCH,
		},
		{
			name: "FAISS",
			icon: META,
		},
		{
			name: "MILVUS",
			icon: MILVUS,
		},
		{
			name: "OPEN_SEARCH",
			icon: OPEN_SEARCH,
		},
		{
			name: "PGVECTOR",
			icon: POSTGRES,
		},
		{
			name: "PINECONE",
			icon: PINECONE,
		},
		{
			name: "PROXY",
			icon: REST_API,
		},
		{
			name: "WEAVIATE",
			icon: WEVIATE,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
	DATABASE: [
		{
			name: "APACHE_JENA",
			icon: APACHE_JENA,
		},
		{
			name: "ASTER_DB",
			icon: ASTER,
		},
		{
			name: "ATHENA",
			icon: ATHENA,
		},
		{
			name: "BIG_QUERY",
			icon: BIGQUERY,
		},
		{
			name: "CASSANDRA",
			icon: CASSANDRA,
		},
		{
			name: "CLICKHOUSE",
			icon: CLICKHOUSE,
		},
		{
			name: "CSV",
			icon: CSV,
		},
		{
			name: "DATABRICKS",
			icon: DATABRICKS,
		},
		{
			name: "DATASTAX",
			icon: DATASTAX,
		},
		{
			name: "DB2",
			icon: DB2,
		},
		{
			name: "DERBY",
			icon: DERBY,
		},
		{
			name: "ELASTIC_SEARCH",
			icon: ELASTIC_SEARCH,
		},
		{
			name: "EXCEL",
			icon: EXCEL,
		},
		{
			name: "H2",
			icon: H2_DB,
		},
		{
			name: "H2_DB",
			icon: H2_DB,
		},
		{
			name: "HIVE",
			icon: HIVE,
		},
		{
			name: "IMPALA",
			icon: IMPALA,
		},
		{
			name: "JENA",
			icon: APACHE_JENA,
		},
		{
			name: "JENA_TDB",
			icon: APACHE_JENA,
		},
		{
			name: "MARIA_DB",
			icon: MARIA_DB,
		},
		{
			name: "MYSQL",
			icon: MYSQL,
		},
		{
			name: "NEO4J",
			icon: NEO4J,
		},
		{
			name: "OPEN_SEARCH",
			icon: OPEN_SEARCH,
		},
		{
			name: "ORACLE",
			icon: ORACLE,
		},
		{
			name: "PHOENIX",
			icon: PHOENIX,
		},
		{
			name: "POSTGRES",
			icon: POSTGRES,
		},
		{
			name: "RDF4J",
			icon: RDF4J,
		},
		{
			name: "REDSHIFT",
			icon: REDSHIFT,
		},
		{
			name: "SAP_HANA",
			icon: SAP_HANA,
		},
		{
			name: "SEMOSS",
			icon: SEMOSS,
		},
		{
			name: "SESAME",
			icon: RDF4J,
		},
		{
			name: "SNOWFLAKE",
			icon: SNOWFLAKE,
		},
		{
			name: "SQL_SERVER",
			icon: SQL_SERVER,
		},
		{
			name: "SQLITE",
			icon: SQLITE,
		},
		{
			name: "SQLITE",
			icon: SQLITE,
		},
		{
			name: "TERADATA",
			icon: TERADATA,
		},
		{
			name: "TIBCO",
			icon: TIBCO,
		},
		{
			name: "TINKER",
			icon: TINKER,
		},
		{
			name: "TRINO",
			icon: TRINO,
		},
		{
			name: "TSV",
			icon: TSV,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
	STORAGE: [
		{
			name: "AMAZON_S3",
			icon: AMAZON_S3,
		},
		{
			name: "AMAZON_S3_NATIVE",
			icon: AMAZON_S3,
		},
		{
			name: "CEPH",
			icon: CEPH,
		},
		{
			name: "DREAMHOST",
			icon: DREAMHOST,
		},
		{
			name: "DROPBOX",
			icon: DROPBOX,
		},
		{
			name: "GOOGLE_CLOUD_NATIVE_STORAGE",
			icon: GOOGLE_CLOUD,
		},
		{
			name: "GOOGLE_CLOUD_STORAGE",
			icon: GOOGLE_CLOUD,
		},
		{
			name: "GOOGLE_DRIVE_STORAGE",
			icon: GOOGLE_DRIVE,
		},
		{
			name: "LOCAL_FILE_SYSTEM",
			icon: LOCAL_FILE_SYSTEM,
		},
		{
			name: "MICROSOFT_AZURE_BLOB_STORAGE",
			icon: AZURE_BLOB,
		},
		{
			name: "MICROSOFT_AZURE_NATIVE_BLOB_STORAGE",
			icon: AZURE_BLOB,
		},
		{
			name: "MICROSOFT_ONEDRIVE",
			icon: ONEDRIVE,
		},
		{
			name: "MINIO",
			icon: MINIO,
		},
		{
			name: "NETWORK_FILE_SYSTEM",
			icon: NETWORK_FILE_SYSTEM,
		},
		{
			name: "SFTP",
			icon: SFTP,
		},
		{
			name: "ZIP",
			icon: ZIP,
		},
	],
};
