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
import ZIP from "@/assets/img/ZIP.png";

export const STORAGE_CONNECTION = {
	STORAGE: {
		Storage: [
			{
				name: "Amazon S3",
				disable: false,
				icon: AMAZON_S3,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "AMAZON_S3",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "S3_REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_BUCKET",
						label: "Bucket",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "CEPH",
				disable: false,
				icon: CEPH,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "CEPH",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "CEPH_ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CEPH_SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CEPH_ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "CEPH_BUCKET",
						label: "Root Bucket Path",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Dreamhost",
				disable: true,
				icon: DREAMHOST,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "S3_REGION",
						label: "S3 Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "S3 Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "S3 Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ENDPOINT",
						label: "S3 Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Dropbox",
				disable: false,
				icon: DROPBOX,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "DROPBOX",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "S3_REGION",
						label: "S3 Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "S3 Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "S3 Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ENDPOINT",
						label: "S3 Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Google Cloud",
				disable: false,
				icon: GOOGLE_CLOUD,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "GOOGLE_CLOUD_STORAGE",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "GCS_REGION",
						label: "Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "GCS_SERVICE_ACCOUNT_FILE",
						label: "Service Account File",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "GCS_BUCKET",
						label: "Bucket",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
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
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "LOCAL_FILE_SYSTEM",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "PATH_PREFIX",
						label: "Local Path Prefix",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Microsoft Azure Blob Storage",
				disable: false,
				icon: AZURE_BLOB,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "MICROSOFT_AZURE_BLOB_STORAGE",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "AZ_ACCOUNT_NAME",
						label: "Account Name",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AZ_PRIMARY_KEY",
						label: "Primary Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AZ_CONN_STRING",
						label: "Connection String",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "AZ_GENERATE_DYNAMIC_SAS",
						label: "Generate Dynamic SAS",
						defaultValue: "false",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "Microsoft OneDrive",
				disable: true,
				icon: ONEDRIVE,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "S3_REGION",
						label: "S3 Region",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ACCESS_KEY",
						label: "S3 Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_SECRET_KEY",
						label: "S3 Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "S3_ENDPOINT",
						label: "S3 Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
				],
			},
			{
				name: "MinIO",
				disable: false,
				icon: MINIO,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "MINIO",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "MINIO_REGION",
						label: "Region",
						defaultValue: "us-east-1",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_ACCESS_KEY",
						label: "Access Key",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_SECRET_KEY",
						label: "Secret Key",
						defaultValue: "",
						options: {
							component: "password",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_ENDPOINT",
						label: "Endpoint",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "MINIO_BUCKET",
						label: "Root Bucket Path",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},
			{
				name: "Network File System",
				disable: false,
				icon: NETWORK_FILE_SYSTEM,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "SMB_CIFS",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "NETWORK_DOMAIN",
						label: "Network Domain",
						defaultValue: "US",
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
						fieldName: "PATH_PREFIX",
						label: "Network Path Prefix",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: false },
					},
				],
			},

			{
				name: "SFTP",
				disable: false,
				icon: SFTP,
				fields: [
					{
						fieldName: "STORAGE_TYPE",
						label: "Storage Type",
						defaultValue: "SFTP",
						hidden: true,
						options: {
							component: "text-field",
						},
						disabled: true,
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
						fieldName: "HOSTNAME",
						label: "Host",
						defaultValue: "",
						options: {
							component: "text-field",
						},
						disabled: false,
						rules: { required: true },
					},
					{
						fieldName: "PORT",
						label: "Port",
						defaultValue: "22",
						options: {
							component: "number",
						},
						disabled: false,
						rules: { required: true, min: 0 },
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
						rules: { required: false },
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
	STORAGE: [
		{
			name: "AMAZON_S3",
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
			name: "MICROSOFT_ONEDRIVE",
			icon: ONEDRIVE,
		},
		{
			name: "NETWORK_FILE_SYSTEM",
			icon: NETWORK_FILE_SYSTEM,
		},
		{
			name: "MINIO",
			icon: MINIO,
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
