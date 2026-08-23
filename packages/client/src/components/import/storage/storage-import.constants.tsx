import AMAZON_S3 from "@/assets/img/AMAZON_S3.png";
import AZURE_BLOB from "@/assets/img/AZURE_BLOB.svg";
import CEPH from "@/assets/img/CEPH.png";
import DREAMHOST from "@/assets/img/DREAMHOST.png";
import DROPBOX from "@/assets/img/DROPBOX.png";
import GOOGLE_CLOUD from "@/assets/img/GOOGLE_CLOUD_STORAGE.svg";
import GOOGLE_DRIVE from "@/assets/img/GOOGLE_DRIVE.png";
import LOCAL_FILE_SYSTEM from "@/assets/img/LOCAL_FILE_SYSTEM.png";
import MINIO from "@/assets/img/MINIO.png";
import NETWORK_FILE_SYSTEM from "@/assets/img/NETWORK_FILE_SYSTEM.png";
import ONEDRIVE from "@/assets/img/ONEDRIVE.png";
import SFTP from "@/assets/img/SFTP.png";

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
					value: "S3",
					hidden: true,
					type: "text",
					disabled: true,
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
					// leaving both keys empty falls back to the environment's
					// credentials, which is how an instance profile or IRSA is
					// picked up. One without the other is rejected
					key: "S3_ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave the access key and secret key empty to use the credentials of the environment the server runs in.",
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "S3_REGION",
					label: "Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_BUCKET",
					label: "Bucket",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_KMS_ID",
					label: "KMS Key ID",
					value: "",
					type: "text",
					disabled: false,
					required: false,
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
					type: "text",
					disabled: true,
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
					key: "S3_ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_ENDPOINT",
					label: "Endpoint",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					// a custom endpoint cannot resolve bucket-as-subdomain, so the bucket
					// has to go in the url path
					key: "S3_PATH_STYLE_ACCESS",
					label: "Path Style Access",
					value: "true",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_REGION",
					label: "Region",
					value: "us-east-1",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_BUCKET",
					label: "Root Bucket Path",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
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
					type: "text",
					disabled: true,
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
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
			],
		},
		{
			name: "Dropbox",
			disable: true,
			icon: DROPBOX,
			description:
				"Dropbox is a cloud storage service that allows you to save files online and sync them to your devices, making file sharing and collaboration easy.",
			fields: [
				{
					key: "STORAGE_TYPE",
					label: "Storage Type",
					value: "DROPBOX",
					hidden: true,
					type: "text",
					disabled: true,
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
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					type: "text",
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
					type: "text",
					disabled: true,
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
					// base64 encoded on submit, since the json does not survive being
					// stored in an smss as is. The engine decodes it on open
					key: "GCS_SERVICE_ACCOUNT_JSON",
					label: "Service Account JSON",
					value: "",
					type: "password",
					encode: "base64",
					disabled: false,
					required: false,
					helperText:
						"Paste the contents of the service account key file. Leave empty to point at a file on the server instead.",
					category: "Credentials",
				},
				{
					key: "GCS_SERVICE_ACCOUNT_FILE",
					label: "Service Account File",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Path to the service account key file on the server. Only used when the JSON above is empty.",
					category: "Credentials",
				},
				{
					// the service account file carries a project_id, which the engine
					// falls back to when this is left empty
					key: "GCS_PROJECT_ID",
					label: "Project ID",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Leave empty to use the project the service account file belongs to.",
					category: "Settings",
				},
				{
					key: "GCS_BUCKET",
					label: "Bucket",
					value: "",
					type: "text",
					disabled: false,
					required: true,
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
					type: "text",
					disabled: true,
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
					key: "PATH_PREFIX",
					label: "Local Path Prefix",
					value: "",
					type: "text",
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
					type: "text",
					disabled: true,
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
					// the engine takes whichever one of these is filled in, in this
					// order: connection string, then SAS url, then managed identity
					key: "AZ_CONN_STRING",
					label: "Connection String",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					helperText:
						"Set one of connection string, SAS URL, or managed identity with an account name.",
					category: "Credentials",
				},
				{
					// a SAS url that names a container scopes the engine to that
					// container, and it becomes the root. An account level SAS has no
					// container in its path, so the root stays the account
					key: "SAS_URL",
					label: "SAS URL",
					value: "",
					type: "password",
					disabled: false,
					required: false,
					helperText:
						"Include the whole url with its query string. A url that names a container limits this engine to that container.",
					category: "Credentials",
				},
				{
					key: "AZ_USE_MSI",
					label: "Use Managed Identity",
					value: "false",
					type: "options",
					options: [
						{ display: "No", value: "false" },
						{ display: "Yes", value: "true" },
					],
					disabled: false,
					required: false,
					category: "Credentials",
				},
				{
					key: "AZ_ACCOUNT_NAME",
					label: "Account Name",
					value: "",
					type: "text",
					disabled: false,
					required: false,
					helperText:
						"Required with managed identity, which carries no address of its own. Ignored otherwise.",
					category: "Credentials",
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
					type: "text",
					disabled: true,
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
					key: "S3_ACCESS_KEY",
					label: "S3 Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "S3 Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_REGION",
					label: "S3 Region",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_ENDPOINT",
					label: "S3 Endpoint",
					value: "",
					type: "text",
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
					type: "text",
					disabled: true,
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
					key: "S3_ACCESS_KEY",
					label: "Access Key",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_SECRET_KEY",
					label: "Secret Key",
					value: "",
					type: "password",
					disabled: false,
					required: true,
					category: "Credentials",
				},
				{
					key: "S3_ENDPOINT",
					label: "Endpoint",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					// MinIO does not resolve bucket-as-subdomain, so the bucket has to go
					// in the url path. Without this the connection fails looking like DNS
					key: "S3_PATH_STYLE_ACCESS",
					label: "Path Style Access",
					value: "true",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_REGION",
					label: "Region",
					value: "us-east-1",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "S3_BUCKET",
					label: "Root Bucket Path",
					value: "",
					type: "text",
					disabled: false,
					required: true,
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
					type: "text",
					disabled: true,
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
					key: "NETWORK_DOMAIN",
					label: "Network Domain",
					value: "US",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "PATH_PREFIX",
					label: "Network Path Prefix",
					value: "",
					type: "text",
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
					type: "text",
					disabled: true,
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
					required: false,
					category: "Credentials",
				},
				{
					key: "HOSTNAME",
					label: "Host",
					value: "",
					type: "text",
					disabled: false,
					required: true,
					category: "Settings",
				},
				{
					key: "PORT",
					label: "Port",
					value: "22",
					type: "number",
					disabled: false,
					required: true,
					rules: { min: 0 },
					category: "Settings",
				},
			],
		},
	],
};
