import AMAZON_S3 from "@/assets/img/Amazon_S3.png";
import AZURE_BLOB from "@/assets/img/AZURE_BLOB.png";
import CEPH from "@/assets/img/CEPH.png";
import DREAMHOST from "@/assets/img/DREAMHOST.png";
import DROPBOX from "@/assets/img/dropbox.png";
import GOOGLE_CLOUD from "@/assets/img/GOOGLE_CLOUD_STORAGE.png";
import GOOGLE_DRIVE from "@/assets/img/GOOGLE_DRIVE.png";
import LOCAL_FILE_SYSTEM from "@/assets/img/LOCAL_FILE_SYSTEM.png";
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

export interface Storage {
	fields: [];
	advanced: [];
	id: number;
	name: string;
	icon: string;
	disable: boolean;
	description?: string;
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
			description:
				"Amazon S3 (Simple Storage Service) is a scalable object storage service that provides secure, durable, and highly available storage for a wide range of data types and applications.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "AMAZON_S3",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "S3_ACCESS_KEY",
					label: "Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "S3_REGION",
					label: "Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_BUCKET",
					label: "Bucket",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "CEPH",
			disable: false,
			icon: CEPH,
			description:
				"Ceph is an open-source distributed storage system that provides object, block, and file storage in a unified platform, designed for scalability, reliability, and performance.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "CEPH",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "CEPH_ENDPOINT",
					label: "Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "CEPH_BUCKET",
					label: "Root Bucket Path",
					value: "",
					component: "text",
					disabled: false,
					required: false,
					category: "Settings",
				},
				{
					key: "CEPH_ACCESS_KEY",
					label: "Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "CEPH_SECRET_KEY",
					label: "Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
			],
		},
		{
			name: "Dreamhost",
			disable: true,
			icon: DREAMHOST,
			description:
				"DreamHost is a web hosting service that also offers cloud storage solutions for developers and businesses.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Dropbox",
			disable: false,
			icon: DROPBOX,
			description:
				"Dropbox is a cloud storage service that allows you to save files online and sync them to your devices, making file sharing and collaboration easy.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "DROPBOX",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Google Cloud",
			disable: false,
			icon: GOOGLE_CLOUD,
			description:
				"Google Cloud Storage is a scalable and secure object storage service for unstructured data, ideal for building data lakes, websites, and applications.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "GOOGLE_CLOUD_STORAGE",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "GCS_SERVICE_ACCOUNT_FILE",
					label: "Service Account File",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "GCS_REGION",
					label: "Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "GCS_BUCKET",
					label: "Bucket",
					value: "",
					component: "text",
					disabled: false,
					required: false,
					category: "Settings",
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
			description:
				"Use this option if you want to import data from a local file system.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "LOCAL_FILE_SYSTEM",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "PATH_PREFIX",
					label: "Local Path Prefix",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Microsoft Azure Blob Storage",
			disable: false,
			icon: AZURE_BLOB,
			description:
				"Microsoft Azure Blob Storage is a scalable object storage solution for unstructured data, ideal for building cloud-native applications and data lakes.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "MICROSOFT_AZURE_BLOB_STORAGE",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "AZ_PRIMARY_KEY",
					label: "Primary Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "AZ_CONN_STRING",
					label: "Connection String",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "AZ_GENERATE_DYNAMIC_SAS",
					label: "Generate Dynamic SAS",
					value: "false",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "AZ_ACCOUNT_NAME",
					label: "Account Name",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Microsoft OneDrive",
			disable: true,
			icon: ONEDRIVE,
			description:
				"Cloud file storage and synchronization service from Microsoft.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "",
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "MinIO",
			disable: false,
			icon: MINIO,
			description:
				"MinIO is a high-performance, distributed object storage system compatible with Amazon S3 APIs, designed for large-scale data infrastructure and cloud-native applications.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "MINIO",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "MINIO_ACCESS_KEY",
					label: "Access Key",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "MINIO_SECRET_KEY",
					label: "Secret Key",
					value: "",
					component: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "MINIO_ENDPOINT",
					label: "Endpoint",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "MINIO_REGION",
					label: "Region",
					value: "us-east-1",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "MINIO_BUCKET",
					label: "Root Bucket Path",
					value: "",
					component: "text",
					disabled: false,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "Network File System",
			disable: false,
			icon: NETWORK_FILE_SYSTEM,
			description:
				"Network File System (NFS) is a distributed file system protocol that allows users to access files over a network as if they were on their local storage.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "SMB_CIFS",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					component: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "NETWORK_DOMAIN",
					label: "Network Domain",
					value: "US",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "PATH_PREFIX",
					label: "Network Path Prefix",
					value: "",
					component: "text",
					disabled: false,
					required: false,
					category: "Settings",
				},
			],
		},
		{
			name: "SFTP",
			disable: false,
			icon: SFTP,
			description:
				"SFTP (SSH File Transfer Protocol) is a secure file transfer protocol that operates over SSH to provide encrypted file access, transfer, and management.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "SFTP",
					hidden: true,
					component: "text",
					disabled: true,
					required: true,
					category: "General",
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
					category: "General",
				},
				{
					key: "USERNAME",
					label: "Username",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "PASSWORD",
					label: "Password",
					value: "",
					component: "password",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "HOSTNAME",
					label: "Host",
					value: "",
					component: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "PORT",
					label: "Port",
					value: "22",
					component: "number",
					disabled: false,
					required: true,
					rules: { min: 0 },
					category: "Settings",
				},
			],
		},
	],
};
