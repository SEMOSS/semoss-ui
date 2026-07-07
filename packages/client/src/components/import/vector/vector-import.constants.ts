import CHROMADB from "@/assets/img/CHROMADB.png";
import ELASTIC_SEARCH from "@/assets/img/ELASTIC_SEARCH.svg";
import META from "@/assets/img/META_COLOR.svg";
import MICROSOFT from "@/assets/img/MICROSOFT.png";
import MILVUS from "@/assets/img/MILVUS.png";
import OPEN_SEARCH from "@/assets/img/OPEN_SEARCH.png";
import PINECONE from "@/assets/img/PINECONE.png";
import POSTGRES from "@/assets/img/POSTGRES.svg";
import QDRANT from "@/assets/img/QDRANT.svg";
import WEVIATE from "@/assets/img/WEVIATE.png";

export type FieldType =
	| "text"
	| "hidden"
	| "password"
	| "url"
	| "select"
	| "number"
	| "boolean"
	| "textarea"
	| "file-upload"
	| "checkbox";

export interface FieldDefinition {
	key: string;
	label: string;
	type: FieldType;
	required: boolean;
	// optional extras seen in the constants
	value?: string;
	options?: string[];
	default?: string | number | boolean;
}

export interface ModelTypeDefinition {
	model_types: string[]; // e.g. ["llm"] | ["embedding"]
	fields: FieldDefinition[];
	advanced: FieldDefinition[];
}

export interface ProviderDefinition {
	name: string;
	types: ModelTypeDefinition[];
}

export interface ImportableModels {
	providers: ProviderDefinition[];
}

export const VECTOR_CONNECTIONS = {
	description: {
		General:
			"Store and retrieve high-dimensional embeddings for semantic search, personalization, and intelligent content matching.",
		Settings:
			"Configure your vector store provider, index structure, dimensionality, and similarity metric to optimize retrieval accuracy and performance.",
		Credentials:
			"Provide your vector database API key or connection details to securely enable indexing and search operations.",
	},
	Connections: [
		{
			name: "Azure AI Search",
			disable: false,
			icon: MICROSOFT,
			description:
				"A cloud-based search service that provides full-text search, vector search, and AI-powered ranking.",
			link: "https://learn.microsoft.com/en-us/azure/search/",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "AZURE_AI_SEARCH",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_VERSION",
					label: "API Version",
					value: "2024-07-01",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "INDEX_NAME",
					label: "Index Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/,
							message:
								"Index name must only contain lowercase letters, digits or dashes, cannot start or end with dashes and is limited to 128 characters",
						},
					},
					category: "Settings",
				},
				{
					key: "DIMENSION_SIZE",
					label: "Embedding Dimension Size",
					value: "1024",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					category: "Settings",
					rules: {},
				},
			],
			advanced: [
				{
					key: "METHOD_NAME",
					label: "Method Name",
					value: "hnsw",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "SPACE_TYPE",
					label: "Space Type",
					value: "l2",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "INDEX_ENGINE",
					label: "Index Engine",
					value: "lucene",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "EF_CONSTRUCTION",
					label: "EF Construction",
					value: "128",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
				{
					key: "M_VALUE",
					label: "M Value",
					value: "10",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^(4|5|6|7|8|9|10)$/,
							message: "Permitted values are between 4 and 10",
						},
					},
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "false",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					type: "select",
					disabled: false,
					required: true,
				},
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "euclidean",
					options: [
						{
							display: "Cosine similarity",
							value: "cosine",
						},
						{
							display: "Squared Euclidean (L2) distance",
							value: "euclidean",
						},
					],
					type: "select",
					disabled: false,
					required: false,
					helperText: "",
				},
				{
					key: "RETAIN_EXTRACTED_TEXT",
					label: "Retain Extracted Text",
					value: "false",
					type: "select",
					options: [
						{
							display: "False",
							value: "false",
						},
						{
							display: "True",
							value: "true",
						},
					],
					disabled: false,
					required: false,
				},
			],
		},
		{
			name: "Chroma",
			disable: false,
			icon: CHROMADB,
			link: "https://docs.trychroma.com/docs/overview/introduction",
			description:
				"An open-source vector database designed for building and querying AI/LLM embeddings.",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "CHROMA",
					type: "text",
					hidden: true,
					disabled: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "CHROMA_COLLECTION_NAME",
					label: "Collection Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					hidden: true,
					disabled: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					required: true,
					disabled: false,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "cosine",
					type: "select",
					options: [
						{
							display: "Cosine Similarity",
							value: "cosine",
						},
						{
							display: "Euclidean Distance",
							value: "l2",
						},
						{
							display: "Inner Product",
							value: "ip",
						},
					],
					disabled: false,
					required: false,

					helperText: "",
				},
			],
		},
		{
			name: "Elastic Search",
			disable: false,
			icon: ELASTIC_SEARCH,
			description:
				"A distributed search and analytics engine for full-text search, logging, and real-time data analysis.",
			link: "https://www.elastic.co/docs/solutions/search",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "ELASTIC_SEARCH",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "API_KEY_ID",
					label: "API Key ID",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "INDEX_NAME",
					label: "Index Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DIMENSION_SIZE",
					label: "Embedding Dimension Size",
					value: "-1",
					type: "number",
					disabled: false,
					required: true,
					min: -1,
				},
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "cosine",
					type: "select",
					options: [
						{
							display: "Cosine Similarity",
							value: "cosine",
						},
						{
							display: "Euclidean Distance",
							value: "l2_norm",
						},
						{
							display: "Dot Product",
							value: "dot_product",
						},
						{
							display: "Max Inner  Product",
							value: "max_inner_product",
						},
					],
					disabled: false,
					required: false,
					helperText: "",
				},
				{
					key: "METHOD_NAME",
					label: "Method Name",
					value: "hnsw",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "SPACE_TYPE",
					label: "Space Type",
					value: "l2",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "INDEX_ENGINE",
					label: "Index Engine",
					value: "lucene",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "EF_CONSTRUCTION",
					label: "EF Construction",
					value: "128",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
				{
					key: "M_VALUE",
					label: "M Value",
					value: "24",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
			],
		},
		{
			name: "FAISS",
			disable: false,
			icon: META,
			description:
				"A high-performance library by Meta for fast similarity search and clustering of dense vectors.",
			link: "https://faiss.ai/",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "FAISS",
					type: "text",
					hidden: true,
					disabled: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					options: [],
					type: "select",
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					hidden: true,
					disabled: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					type: "select",
					value: "ALL",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "Squared Euclidean (L2) distance",
					type: "select",
					options: [
						{
							display: "Squared Euclidean (L2) distance",
							value: "Squared Euclidean (L2) distance",
						},
						{
							display: "cosine similarity",
							value: "cosine similarity",
						},
					],
					disabled: false,
					required: false,

					helperText: "",
				},
			],
		},
		{
			name: "Milvus",
			disable: false,
			icon: MILVUS,
			description:
				"A cloud-native vector database optimized for large-scale vector search with high performance.",
			link: "https://milvus.io/docs",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "MILVUS",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "DATABASE_NAME",
					label: "Database",
					value: "default_database",
					type: "text",
					disabled: false,
					required: true,
					helperText:
						"Only update this value if you have a dedicated cluster",
					category: "Credentials",
				},
				{
					key: "COLLECTION_NAME",
					label: "Collection",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
				{
					key: "DIMENSION_SIZE",
					label: "Embedding Dimension Size",
					value: "0",
					type: "number",
					disabled: false,
					required: true,
					min: 1,
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
				},
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "COSINE",
					type: "select",
					options: [
						{
							display: "Cosine Similarity",
							value: "COSINE",
						},
						{
							display: "Euclidean Distance",
							value: "L2",
						},
						{
							display: "Inner Product",
							value: "ip ",
						},
					],
					disabled: false,
					required: false,

					helperText: "",
				},
				{
					key: "INDEX_TYPE",
					label: "Index Type",
					value: "HNSW",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "EF_CONSTRUCTION",
					label: "EF Construction",
					value: "128",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
				{
					key: "M_VALUE",
					label: "M Value",
					value: "24",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
			],
		},
		{
			name: "Open Search",
			disable: false,
			icon: OPEN_SEARCH,
			description:
				"An open-source search and analytics suite derived from Elasticsearch, supporting text and vector search.",
			link: "https://docs.opensearch.org/latest/about/",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "OPEN_SEARCH",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "INDEX_NAME",
					label: "Index Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					category: "Settings",
					rules: {},
				},
				{
					key: "DIMENSION_SIZE",
					label: "Embedding Dimension Size",
					value: "0",
					type: "number",
					disabled: false,
					required: true,
					min: 1,
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "cosinesimil",
					type: "select",
					options: [
						{
							display: "Cosine Similarity",
							value: "cosinesimil",
						},
						{
							display: "Euclidean Distance",
							value: "l2",
						},
						{
							display: "Inner Product",
							value: "innerproduct ",
						},
					],
					disabled: false,
					required: false,

					helperText: "",
				},
				{
					key: "METHOD_NAME",
					label: "Method Name",
					value: "hnsw",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "INDEX_ENGINE",
					label: "Index Engine",
					value: "lucene",
					type: "text",
					disabled: false,
					required: true,
				},
				{
					key: "EF_CONSTRUCTION",
					label: "EF Construction",
					value: "128",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
				{
					key: "M_VALUE",
					label: "M Value",
					value: "24",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
				},
			],
		},
		{
			name: "PGVector",
			disable: false,
			icon: POSTGRES,
			description:
				"A PostgreSQL extension that adds native vector storage and similarity search to Postgres databases.",
			link: "https://www.postgresql.org/docs",
			fields: [
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "PGVECTOR",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "RDBMS_TYPE",
					label: "Driver Name",
					value: "POSTGRES",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "DATABASE_TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "hostname",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "port",
					label: "Port",
					value: "5432",
					type: "number",
					disabled: false,
					required: false,
					min: 0,
					category: "Credentials",
				},
				{
					key: "database",
					label: "Database",
					value: "postgres",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "schema",
					label: "Schema",
					value: "public",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "CONNECTION_URL",
					label: "JDBC Url",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "PGVECTOR_TABLE_NAME",
					label: "PGVector Table Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
				{
					key: "additional",
					label: "Additional Parameters",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "Squared Euclidean (L2) distance",
					type: "select",
					options: [
						{
							display: "Squared Euclidean (L2) distance",
							value: "Squared Euclidean (L2) distance",
						},
						{
							display: "cosine similarity",
							value: "cosine similarity",
						},
					],
					disabled: false,
					required: false,

					helperText: "",
				},
				{
					key: "FETCH_SIZE",
					label: "Fetch Size",
					value: "",
					required: false,
					min: 0,
					type: "number",
					disabled: false,
				},
				{
					key: "CONNECTION_TIMEOUT",
					label: "Connection Timeout",
					value: "",
					required: false,
					min: 0,
					type: "number",
					disabled: false,
				},
				{
					key: "USE_CONNECTION_POOLING",
					label: "Use Connection Pooling",
					value: false,
					required: false,
					type: "checkbox",
					disabled: false,
				},
				{
					key: "POOL_MIN_SIZE",
					label: "Pool Min Size",
					value: "",
					required: false,
					min: 0,
					type: "number",
					disabled: false,
				},
				{
					key: "POOL_MAX_SIZE",
					label: "Pool Max Size",
					value: "",
					required: false,
					min: 0,
					type: "number",
					disabled: false,
				},
			],
		},
		{
			name: "Pinecone",
			disable: false,
			icon: PINECONE,
			description:
				"A fully managed vector database for scalable and low-latency semantic and embedding search.",
			link: "https://docs.pinecone.io/guides/get-started/overview",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "PINECONE",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "NAMESPACE",
					label: "Namespace",
					value: null,
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					type: "select",
					value: "",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
				// right now, below is not used
				// BE does not create the index if it doesn't exist
				// {
				//     key: 'DISTANCE_METHOD',
				//     label: 'Distance Method',
				//     value: 'cosine',
				//     options: {
				//         type: 'select',
				//         options: [
				//             {
				//                 display: 'Euclidean Distance',
				//                 value: 'euclidean',
				//             },
				//             {
				//                 display: 'Cosine Similarity',
				//                 value: 'cosine',
				//             },
				//             {
				//                 display: 'Dot Product',
				//                 value: 'dotproduct',
				//             },
				//         ],
				//     },
				//     disabled: false,
				//     required: false,
				//
				//     helperText: '',
				// },
			],
			advanced: [],
		},
		{
			name: "Qdrant",
			disable: false,
			icon: QDRANT,
			description:
				"An embedded Qdrant vector store. Runs entirely inside SEMOSS with server-side filtering, sparse+dense hybrid search, quantization, and a native recommendation API — no external server required. Collections persist to the engine's own folder between restarts.",
			link: "https://qdrant.tech/documentation/",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "QDRANT",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{ display: "Token", value: "ALL" },
						{ display: "Page by page", value: "PAGE_BY_PAGE" },
						{ display: "Markdown", value: "MARKDOWN" },
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{ display: "true", value: "true" },
						{ display: "false", value: "false" },
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "Cosine Similarity",
					type: "select",
					options: [
						{
							display: "Cosine Similarity",
							value: "Cosine Similarity",
						},
						{
							display: "Squared Euclidean (L2) distance",
							value: "Squared Euclidean (L2) distance",
						},
						{ display: "Dot product", value: "Dot" },
						{ display: "Manhattan (L1)", value: "Manhattan" },
					],
					disabled: false,
					required: false,
					helperText:
						"Similarity metric used for dense-vector search.",
				},
				{
					key: "QDRANT_ENABLE_HYBRID_SEARCH",
					label: "Enable Hybrid Search",
					value: "false",
					type: "select",
					options: [
						{ display: "false", value: "false" },
						{ display: "true", value: "true" },
					],
					disabled: false,
					required: false,
					helperText:
						"Combine BM25 sparse + dense vectors with Prefetch/RRF or DBSF fusion. Runs in-process; BM25 IDF is approximated by the embedded engine.",
				},
				{
					key: "QDRANT_FUSION",
					label: "Hybrid Fusion Method",
					value: "rrf",
					type: "select",
					options: [
						{
							display: "Reciprocal Rank Fusion (RRF)",
							value: "rrf",
						},
						{
							display: "Distribution-Based Score Fusion (DBSF)",
							value: "dbsf",
						},
					],
					disabled: false,
					required: false,
					helperText:
						"Only applied when hybrid search is enabled. DBSF often beats RRF for BM25+dense.",
				},
				{
					key: "QDRANT_SPARSE_MODEL",
					label: "Sparse Model",
					value: "Qdrant/bm25",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"fastembed-compatible BM25 sparse model. Default is the Qdrant-official BM25 pack.",
				},
				{
					key: "QDRANT_QUANTIZATION",
					label: "Quantization",
					value: "none",
					type: "select",
					options: [
						{ display: "None", value: "none" },
						{ display: "Scalar (INT8)", value: "scalar" },
						{ display: "Binary", value: "binary" },
					],
					disabled: false,
					required: false,
					helperText:
						"Vector quantization for memory savings. Scalar is a strong default for most workloads.",
				},
				{
					key: "QDRANT_HNSW_M",
					label: "HNSW M",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					min: 0,
					helperText:
						"HNSW graph connectivity. Leave empty for library default (16). Higher = better recall / more memory.",
				},
				{
					key: "QDRANT_HNSW_EF_CONSTRUCT",
					label: "HNSW ef_construct",
					value: "",
					type: "number",
					disabled: false,
					required: false,
					min: 0,
					helperText:
						"HNSW build-time search width. Leave empty for library default (100). Higher = slower build, better recall.",
				},
				{
					key: "QDRANT_ON_DISK_PAYLOAD",
					label: "On-Disk Payload",
					value: "false",
					type: "select",
					options: [
						{ display: "false", value: "false" },
						{ display: "true", value: "true" },
					],
					disabled: false,
					required: false,
					helperText:
						"Store payloads on disk instead of RAM. Recommended for large collections when RAM is scarce.",
				},
				{
					key: "QDRANT_INDEXED_FIELDS",
					label: "Indexed Payload Fields (JSON)",
					value: "",
					type: "textarea",
					disabled: false,
					required: false,
					helperText:
						'Optional JSON array of {field, schema} entries, e.g. [{"field":"Source","schema":"keyword"}]. Defaults to indexing \'Source\' as keyword.',
				},
			],
		},
		{
			name: "Weaviate",
			disable: false,
			icon: WEVIATE,
			description:
				"An open-source, modular vector database with hybrid (text + vector) search and built-in ML capabilities.",
			link: "https://docs.weaviate.io/weaviate",
			fields: [
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					rules: {
						pattern: {
							value: /^[\w\-\s]+$/,
							message:
								"Catalog names can only contain alphanumeric characters and dashes.",
						},
						custom: {
							value: 'CheckEngineName ( "[VALUE]") ;',
							message:
								"This Catalog name has already been used, please try another.",
						},
					},
					category: "General",
				},
				{
					key: "VECTOR_TYPE",
					label: "Type",
					value: "WEAVIATE",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "General",
				},
				{
					key: "DESCRIPTION",
					label: "Description",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "TAGS",
					label: "Tags",
					value: "",
					type: "tags",
					disabled: false,
					required: false,
					category: "General",
				},
				{
					key: "HOSTNAME",
					label: "Host Name",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "API_KEY",
					label: "API Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "WEAVIATE_CLASSNAME",
					label: "Weaviate Classname",
					value: "Vector_Table",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "AUTOCUT_DEFAULT",
					label: "Autocut default",
					value: "1",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "EMBEDDER_ENGINE_ID",
					label: "Embedder",
					value: "",
					type: "select",
					options: [],
					optionRule: {
						pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
						optionDisplay: "engine_name",
						optionValue: "engine_id",
					},
					disabled: false,
					required: true,
					helperText:
						"The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
					category: "Settings",
				},
				{
					key: "INDEX_CLASSES",
					label: "Index Classes",
					value: "default",
					type: "text",
					disabled: true,
					hidden: true,
					required: true,
					category: "Settings",
				},
				{
					key: "CHUNKING_STRATEGY",
					label: "Chunking Strategy",
					value: "ALL",
					type: "select",
					options: [
						{
							display: "Token",
							value: "ALL",
						},
						{
							display: "Page by page",
							value: "PAGE_BY_PAGE",
						},
						{
							display: "Markdown",
							value: "MARKDOWN",
						},
					],
					disabled: false,
					hidden: false,
					required: true,
					displayRules: {
						hideOtherFields: [
							{
								key: "CONTENT_LENGTH",
								value: ["PAGE_BY_PAGE", "MARKDOWN"],
							},
						],
					},
					category: "Settings",
				},
				{
					key: "CONTENT_LENGTH",
					label: "Content Length",
					value: "512",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
					category: "Settings",
				},
				{
					key: "CONTENT_OVERLAP",
					label: "Content Overlap",
					value: "20",
					type: "number",
					disabled: false,
					required: true,
					min: 0,
					helperText:
						"The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
					category: "Settings",
				},
				{
					key: "KEEP_INPUT_OUTPUT",
					label: "Record Questions and Responses",
					value: "true",
					type: "select",
					options: [
						{
							display: "true",
							value: "true",
						},
						{
							display: "false",
							value: "false",
						},
					],
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "EMBEDDINGS",
					label: "Embeddings",
					value: null,
					type: "file-upload",
					disabled: false,
					secondary: true,
					rules: {},
					category: "Settings",
				},
			],
			advanced: [
				{
					key: "DISTANCE_METHOD",
					label: "Distance Method",
					value: "Squared Euclidean (L2) distance",
					type: "select",
					options: [
						{
							display: "Squared Euclidean (L2) distance",
							value: "Squared Euclidean (L2) distance",
						},
						{
							display: "cosine similarity",
							value: "cosine similarity",
						},
					],
					disabled: false,
					required: false,

					helperText: "",
				},
			],
		},
	],
};
