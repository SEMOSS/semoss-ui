import { Env } from '@/env';
import axios from 'axios';

/**
 * Upload file(s) to the backend
 * @param files
 * @param insightId
 * @param projectId
 * @param path
 * @returns
 */
export const upload = async (
    files: File | File[],
    insightId: string | null,
    projectId: string | null,
    path: string,
): Promise<
    {
        fileName: string;
        fileLocation: string;
    }[]
> => {
    let param = '';

    path = path || '';
    if (insightId || projectId || path) {
        if (insightId) {
            if (param.length > 0) {
                param += '&';
            }
            param += `insightId=${insightId}`;
        }

        if (projectId) {
            if (param.length > 0) {
                param += '&';
            }
            param += `projectId=${projectId}`;
        }

        if (path) {
            if (param.length > 0) {
                param += '&';
            }
            param += `path=${path}`;
        }

        param = `?${param}`;
    }

    const fd: FormData = new FormData();
    if (Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
            fd.append('file', files[i]);
        }
    } else {
        // pasted data
        fd.append('file', files);
    }

    const response = await axios
        .post<
            {
                fileName: string;
                fileLocation: string;
            }[]
        >(`${Env.MODULE}/api/uploadFile/baseUpload${param}`, fd, {})
        .catch((error) => {
            // throw the message
            throw Error(error.response.data.errorMessage);
        });

    return response.data;
};

/**
 * Download a file by using a unique key
 *
 * @param insightId - insightId to download the file
 * @param fileKey - id for the file to download
 */
export const download = async (insightId: string, fileKey: string) => {
    return new Promise<void>((resolve) => {
        if (!insightId) {
            throw Error('No Insight ID provided for download.');
        }
        // create the download url
        const url = `${
            Env.MODULE
        }/api/engine/downloadFile?insightId=${insightId}&fileKey=${encodeURIComponent(
            fileKey,
        )}`;

        // fake clicking a link
        const link: HTMLAnchorElement = document.createElement('a');

        link.href = url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);

        // resolve the promise
        resolve();
    });
};
