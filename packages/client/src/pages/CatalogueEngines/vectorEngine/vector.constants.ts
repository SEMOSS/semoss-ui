import CHROMADB from "@/assets/img/CHROMADB.png";
import ELASTIC_SEARCH from "@/assets/img/ELASTIC_SEARCH.svg";
import META from "@/assets/img/META.png";
import MILVUS from "@/assets/img/MILVUS.png";
import OPEN_SEARCH from "@/assets/img/OPEN_SEARCH.png";
import PINECONE from "@/assets/img/PINECONE.png";
import POSTGRES from "@/assets/img/POSTGRES.png";
import WEVIATE from "@/assets/img/WEVIATE.png";
import ZIP from "@/assets/img/ZIP.png";
import MICROSOFT from "@/assets/loginProviders/microsoft.png";


export const 
VECTOR_CONNECTION = {
  VECTOR: {
    Connections: [
      {
        name: "Azure AI Search",
        disable: false,
        icon: MICROSOFT,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "AZURE_AI_SEARCH",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },          
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "API_KEY",
            label: "API Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "API_VERSION",
            label: "API Version",
            defaultValue: "2024-07-01",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },

          {
            fieldName: "INDEX_NAME",
            label: "Index Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/,
                message:
                  "Index name must only contain lowercase letters, digits or dashes, cannot start or end with dashes and is limited to 128 characters",
              },
            },
          },

          {
            fieldName: "DIMENSION_SIZE",
            label: "Embedding Dimension Size",
            defaultValue: "1024",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
          },
          {
            fieldName: "METHOD_NAME",
            label: "Method Name",
            defaultValue: "hnsw",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "SPACE_TYPE",
            label: "Space Type",
            defaultValue: "l2",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "INDEX_ENGINE",
            label: "Index Engine",
            defaultValue: "lucene",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "EF_CONSTRUCTION",
            label: "EF Construction",
            defaultValue: "128",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
          {
            fieldName: "M_VALUE",
            label: "M Value",
            defaultValue: "10",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^(4|5|6|7|8|9|10)$/,
                message: "Permitted values are between 4 and 10",
              },
            },
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "false",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "euclidean",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
          {
            fieldName: "RETAIN_EXTRACTED_TEXT",
            label: "Retain Extracted Text",
            defaultValue: "false",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
          },
        ],
      },
      {
        name: "Chroma",
        disable: false,
        icon: CHROMADB,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "CHROMA",
            options: {
              component: "text-field",
            },
            hidden: true,
            disabled: true,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            hidden: true,
            disabled: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "API_KEY",
            label: "API Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CHROMA_COLLECTION_NAME",
            label: "Collection Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "cosine",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
        ],
      },
      {
        name: "Elastic Search",
        disable: false,
        icon: ELASTIC_SEARCH,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "ELASTIC_SEARCH",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "API_KEY",
            label: "API Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "API_KEY_ID",
            label: "API Key ID",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "INDEX_NAME",
            label: "Index Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DIMENSION_SIZE",
            label: "Embedding Dimension Size",
            defaultValue: "-1",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: -1 },
            advanced: true,
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "cosine",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
          {
            fieldName: "METHOD_NAME",
            label: "Method Name",
            defaultValue: "hnsw",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "SPACE_TYPE",
            label: "Space Type",
            defaultValue: "l2",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "INDEX_ENGINE",
            label: "Index Engine",
            defaultValue: "lucene",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "EF_CONSTRUCTION",
            label: "EF Construction",
            defaultValue: "128",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
          {
            fieldName: "M_VALUE",
            label: "M Value",
            defaultValue: "24",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
        ],
      },
      {
        name: "FAISS",
        disable: false,
        icon: META,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            section: "general",
            sectiondescription:
              "Please provide the name, type, and model to uniquely identify, categorize, and configure your setup for optimal performance.",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            section: "general",
            sectiondescription:
              "Please provide the name, type, and model to uniquely identify, categorize, and configure your setup for optimal performance.",
            defaultValue: "FAISS",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            section: "general",
            sectiondescription:
              "Please provide the name, type, and model to uniquely identify, categorize, and configure your setup for optimal performance.",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            section: "credentials",
            sectiondescription:
              "Enter the AWS region, variable name, access key, and secret key to securely configure and authenticate your AWS environment.",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            section: "credentials",
            sectiondescription:
              "Enter the AWS region, variable name, access key, and secret key to securely configure and authenticate your AWS environment.",
            defaultValue: "",
            options: {
              component: "select",
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            section: "credentials",
            sectiondescription:
              "Enter the AWS region, variable name, access key, and secret key to securely configure and authenticate your AWS environment.",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            section: "credentials",
            sectiondescription:
              "Enter the AWS region, variable name, access key, and secret key to securely configure and authenticate your AWS environment.",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            section: "settings",
            sectiondescription:
              "Configure the chat type, initialization script, token limits, input key, and preferences for conversation history and recording questions and responses to tailor the system's behavior to your needs.",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            section: "settings",
            sectiondescription:
              "Configure the chat type, initialization script, token limits, input key, and preferences for conversation history and recording questions and responses to tailor the system's behavior to your needs.",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            section: "settings",
            sectiondescription:
              "Configure the chat type, initialization script, token limits, input key, and preferences for conversation history and recording questions and responses to tailor the system's behavior to your needs.",

            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            secondary: true,
            rules: {
              required: {
                value: true,
                message: "Please upload file / files.",
              },
            },
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "Squared Euclidean (L2) distance",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
        ],
      },
      {
        name: "Milvus",
        disable: false,
        icon: MILVUS,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "MILVUS",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DATABASE_NAME",
            label: "Database",
            defaultValue: "default_database",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "Only update this value if you have a dedicated cluster",
          },
          {
            fieldName: "COLLECTION_NAME",
            label: "Collection",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "API_KEY",
            label: "API Key",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DIMENSION_SIZE",
            label: "Embedding Dimension Size",
            defaultValue: "0",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 1 },
            advanced: false,
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "COSINE",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
          {
            fieldName: "INDEX_TYPE",
            label: "Index Type",
            defaultValue: "HNSW",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "EF_CONSTRUCTION",
            label: "EF Construction",
            defaultValue: "128",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
          {
            fieldName: "M_VALUE",
            label: "M Value",
            defaultValue: "24",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
        ],
      },
      {
        name: "Open Search",
        disable: false,
        icon: OPEN_SEARCH,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "OPEN_SEARCH",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "INDEX_NAME",
            label: "Index Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DIMENSION_SIZE",
            label: "Embedding Dimension Size",
            defaultValue: "0",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 1 },
            advanced: false,
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "cosinesimil",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
          {
            fieldName: "METHOD_NAME",
            label: "Method Name",
            defaultValue: "hnsw",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "INDEX_ENGINE",
            label: "Index Engine",
            defaultValue: "lucene",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
            advanced: true,
          },
          {
            fieldName: "EF_CONSTRUCTION",
            label: "EF Construction",
            defaultValue: "128",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
          {
            fieldName: "M_VALUE",
            label: "M Value",
            defaultValue: "24",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            advanced: true,
          },
        ],
      },
      {
        name: "PGVector",
        disable: false,
        icon: POSTGRES,
        fields: [
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "PGVECTOR",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "POSTGRES",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "5432",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "postgres",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "public",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "PGVECTOR_TABLE_NAME",
            label: "PGVector Table Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "Squared Euclidean (L2) distance",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Pinecone",
        disable: false,
        icon: PINECONE,
        fields: [
          {
            fieldName: "NAME",
            label: "Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "PINECONE",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "API_KEY",
            label: "API Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "NAMESPACE",
            label: "Namespace",
            defaultValue: null,
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          // right now, below is not used
          // BE does not create the index if it doesn't exist
          // {
          //     fieldName: 'DISTANCE_METHOD',
          //     label: 'Distance Method',
          //     defaultValue: 'cosine',
          //     options: {
          //         component: 'select',
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
          //     rules: { required: false },
          //     advanced: true,
          //     helperText: '',
          // },
        ],
      },
      {
        name: "Weaviate",
        disable: false,
        icon: WEVIATE,
        fields: [
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
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
          },
          {
            fieldName: "VECTOR_TYPE",
            label: "Type",
            defaultValue: "WEAVIATE",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "DESCRIPTION",
            label: "Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "EMBEDDER_ENGINE_ID",
            label: "Embedder",
            defaultValue: "",
            options: {
              component: "select",
              options: [],
              pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
              optionDisplay: "database_name",
              optionValue: "database_id",
            },
            disabled: false,
            rules: { required: true },
            helperText:
              "The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.",
          },
          {
            fieldName: "INDEX_CLASSES",
            label: "Index Classes",
            defaultValue: "default",
            options: {
              component: "text-field",
            },
            disabled: true,
            hidden: true,
            rules: { required: true },
          },
          {
            fieldName: "CHUNKING_STRATEGY",
            label: "Chunking Strategy",
            defaultValue: "ALL",
            options: {
              component: "select",
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
            },
            disabled: false,
            hidden: false,
            rules: { required: true },
            displayRules: {
              hideOtherFields: [
                {
                  fieldName: "CONTENT_LENGTH",
                  value: ["PAGE_BY_PAGE", "MARKDOWN"],
                },
              ],
            },
          },
          {
            fieldName: "CONTENT_LENGTH",
            label: "Content Length",
            defaultValue: "512",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
          },
          {
            fieldName: "CONTENT_OVERLAP",
            label: "Content Overlap",
            defaultValue: "20",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
            helperText:
              "The number of tokens from prior chunks that are carried over into the current chunk when processing content.",
          },
          {
            fieldName: "HOSTNAME",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "API_KEY",
            label: "API Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "WEAVIATE_CLASSNAME",
            label: "Weaviate Classname",
            defaultValue: "Vector_Table",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "AUTOCUT_DEFAULT",
            label: "Autocut default",
            defaultValue: "1",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "KEEP_INPUT_OUTPUT",
            label: "Record Questions and Responses",
            defaultValue: "true",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "EMBEDDINGS",
            label: "Embeddings",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: true,
            secondary: true,
            rules: {},
          },
          {
            fieldName: "DISTANCE_METHOD",
            label: "Distance Method",
            defaultValue: "Squared Euclidean (L2) distance",
            options: {
              component: "select",
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
            },
            disabled: false,
            rules: { required: false },
            advanced: true,
            helperText: "",
          },
        ],
      },
    ],
    "File Uploads": [
      {
        name: "ZIP",
        disable: false,
        icon: ZIP,
        fields: [
          {
            fieldName: "ZIP",
            label: "Zip File",
            defaultValue: null,
            options: {
              component: "zip-upload",
            },
            disabled: false,
            rules: { required: true },
          },
        ],
      },
    ],
  },
};

export const ENGINE_IMAGES = {
  VECTOR: [
    {
      name: "FAISS",
      icon: META,
    },
    {
      name: "WEAVIATE",
      icon: WEVIATE,
    },
    {
      name: "PINECONE",
      icon: PINECONE,
    },
    {
      name: "PGVECTOR",
      icon: POSTGRES,
    },
    {
      name: "OPEN_SEARCH",
      icon: OPEN_SEARCH,
    },
    {
      name: "ZIP",
      icon: ZIP,
    },
  ],
};
