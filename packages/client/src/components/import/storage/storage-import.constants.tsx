import AMAZON_S3 from "@/assets/img/Amazon_S3.png";
import AZURE_BLOB from "@/assets/img/AZURE_BLOB.png";
import CEPH from "@/assets/img/CEPH.png";
import DREAMHOST from "@/assets/img/DREAMHOST.png";
import DROPBOX from "@/assets/img/dropbox.png";
import GOOGLE_CLOUD from "@/assets/img/GOOGLE_CLOUD_STORAGE.png";
import GOOGLE_DRIVE from "@/assets/img/Google_Drive.png";
import LOCAL_FILE_SYSTEM from "@/assets/img/Local_File_System.png";
import MINIO from "@/assets/img/MINIO.png";
import NETWORK_FILE_SYSTEM from "@/assets/img/NETWORK_FILE_SYSTEM.png";
import ONEDRIVE from "@/assets/img/ONEDRIVE.png";
import SFTP from "@/assets/img/SFTP.png";

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
	model_types: string[];
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

export const STORAGE_CONNECTIONS = {
	description: {
		General:
			"Basic information about the storage catalog such as name, description, tags, type of storage, and high-level metadata.",
		Settings:
			"Configure your storage provider, index structure, dimensionality, and similarity metric to optimize retrieval accuracy and performance.",
		Credentials:
			"Provide your storage API key or connection details to securely enable indexing and search operations.",
	},
	Storage: [
		{
			name: "Amazon S3",
			disable: false,
			icon: AMAZON_S3,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "AMAZON_S3",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "S3_REGION",
					label: "Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_BUCKET",
					label: "Bucket",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ACCESS_KEY",
					label: "Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: false,
				},
				{
					key: "S3_SECRET_KEY",
					label: "Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: false,
				},
			],
		},
		{
			name: "CEPH",
			disable: false,
			icon: CEPH,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "CEPH",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "CEPH_ACCESS_KEY",
					label: "Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "CEPH_SECRET_KEY",
					label: "Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
				},
				{
					key: "CEPH_ENDPOINT",
					label: "Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "CEPH_BUCKET",
					label: "Root Bucket Path",
					value: "",
					component: "text",
					disabled: false,
					required: false,
				},
			],
		},
		{
			name: "Dreamhost",
			disable: true,
			icon: DREAMHOST,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
			],
		},
		{
			name: "Dropbox",
			disable: false,
			icon: DROPBOX,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "DROPBOX",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
			],
		},
		{
			name: "Google Cloud",
			disable: false,
			icon: GOOGLE_CLOUD,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "GOOGLE_CLOUD_STORAGE",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "GCS_REGION",
					label: "Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "GCS_SERVICE_ACCOUNT_FILE",
					label: "Service Account File",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "GCS_BUCKET",
					label: "Bucket",
					value: "",
					component: "text",
					disabled: false,
					required: false,
				},
			],
		},
		{
			name: "Google Drive",
			disable: true,
			icon: GOOGLE_DRIVE,
			fields: [],
		},
		{
			name: "Local File System",
			disable: false,
			icon: LOCAL_FILE_SYSTEM,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "LOCAL_FILE_SYSTEM",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "PATH_PREFIX",
					label: "Local Path Prefix",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
			],
		},
		{
			name: "Microsoft Azure Blob Storage",
			disable: false,
			icon: AZURE_BLOB,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "MICROSOFT_AZURE_BLOB_STORAGE",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "AZ_ACCOUNT_NAME",
					label: "Account Name",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "AZ_PRIMARY_KEY",
					label: "Primary Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "AZ_CONN_STRING",
					label: "Connection String",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "AZ_GENERATE_DYNAMIC_SAS",
					label: "Generate Dynamic SAS",
					value: "false",
					component: "text",
					disabled: false,
					required: true,
				},
			],
		},
		{
			name: "Microsoft OneDrive",
			disable: true,
			icon: ONEDRIVE,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "",
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
			],
		},
		{
			name: "MinIO",
			disable: false,
			icon: MINIO,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "MINIO",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "MINIO_REGION",
					label: "Region",
					value: "us-east-1",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "MINIO_ACCESS_KEY",
					label: "Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "MINIO_SECRET_KEY",
					label: "Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
				},
				{
					key: "MINIO_ENDPOINT",
					label: "Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "MINIO_BUCKET",
					label: "Root Bucket Path",
					value: "",
					component: "text",
					disabled: false,
					required: false,
				},
			],
		},
		{
			name: "Network File System",
			disable: false,
			icon: NETWORK_FILE_SYSTEM,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "SMB_CIFS",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "NETWORK_DOMAIN",
					label: "Network Domain",
					value: "US",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					component: "password",
					disabled: false,
					required: true,
				},
				{
					key: "PATH_PREFIX",
					label: "Network Path Prefix",
					value: "",
					component: "text",
					disabled: false,
					required: false,
				},
			],
		},

		{
			name: "SFTP",
			disable: false,
			icon: SFTP,
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "SFTP",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
				},
				{
					key: "NAME",
					label: "Catalog Name",
					value: "",
					component: "text",
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
				},
				{
					key: "HOSTNAME",
					label: "Host",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "PORT",
					label: "Port",
					value: "22",
					component: "number",
					disabled: false,
					required: true,
					rules: { min: 0 },
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					component: "text",
					disabled: false,
					required: true,
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					component: "password",
					disabled: false,
					required: false,
				},
			],
		},
	],
};
