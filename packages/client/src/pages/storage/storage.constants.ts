type FormFields = {
    /** Form Element */
    type: string;
    /** Label */
    label: string;
};
/** Fields that are constant for each storage type */
const STORAGE_FORM: FormFields[] = [
    { type: 'input', label: 'S3_REGION' },
    { type: 'input', label: 'S3_ENDPOINT' },
    { type: 'input', label: 'S3_ACCESS_KEY' },
    { type: 'input', label: 'S3_SECRET_KEY' },
];

/** Different Storage Types with their respective fields */
export const STORAGE_TYPES: { type: string; fields: FormFields[] }[] = [
    {
        type: 'AMAZON_S3',
        fields: [...STORAGE_FORM],
    },
    {
        type: 'GOOGLE_CLOUD_STORAGE',
        fields: [...STORAGE_FORM],
    },
    {
        type: 'GOOGLE_DRIVE',
        fields: [...STORAGE_FORM],
    },
    {
        type: 'MICROSOFT_AZURE_BLOB_STORAGE',
        fields: [...STORAGE_FORM],
    },
    {
        type: 'MINIO',
        fields: [...STORAGE_FORM],
    },
    {
        type: 'SFTP',
        fields: [...STORAGE_FORM],
    },
];
