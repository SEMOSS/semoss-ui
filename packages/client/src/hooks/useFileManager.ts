import { useState, useEffect, useMemo } from 'react';
import { usePixel } from './usePixel';

export interface FileItem {
    fileName: string;
    fileSize: number;
    lastModified: string;
    key?: string;
    path: string;
    isDirectory: boolean;
}

export interface TreeNode {
    name: string;
    path: string;
    isLeaf: boolean;
    children: TreeNode[];
    fileSize?: number;
    lastModified?: string;
}

interface UseFileManagerProps {
    engineId: string;
    mode: 'vector' | 'storage';
    storagePath?: string;
}

export const useFileManager = ({ engineId, mode, storagePath = '/' }: UseFileManagerProps) => {
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

    const query = useMemo(() => {
        return mode === 'vector'
            ? `ListDocumentsInVectorDatabase(engine="${engineId}")`
            : `Storage(storage = '${engineId}') | ListStoragePathDetails(storagePath="${storagePath}")`;
    }, [engineId, mode, storagePath]);

    const { data: rawData, status, error } = usePixel<any[]>(query);

    const files = useMemo(() => {
        if (!rawData || status !== 'SUCCESS') return [];

        if (mode === 'storage') {
            return rawData.map((item: any) => ({
                fileName: item.key,
                fileSize: item.size,
                lastModified: new Date(item.lastModified.seconds * 1000).toLocaleString(),
                key: item.key,
                path: item.key,
                isDirectory: item.key.endsWith('/'),
            }));
        } else {
            return rawData.map((item: any) => ({
                fileName: item.fileName || item.name,
                fileSize: item.fileSize || item.size || 0,
                lastModified: item.lastModified,
                path: item.path || item.fileName,
                isDirectory: false,
            }));
        }
    }, [rawData, status, mode]);

    const filteredFiles = useMemo(() => {
        if (!searchFilter) return files;
        return files.filter(file =>
            file.fileName.toLowerCase().includes(searchFilter.toLowerCase())
        );
    }, [files, searchFilter]);

    const treeData = useMemo(() => {
        if (mode !== 'storage') return [];

        const root: TreeNode = { name: '', path: '', isLeaf: false, children: [] };

        files.forEach((file) => {
            const parts = file.path.split('/').filter(Boolean);
            let current = root;

            parts.forEach((part, i) => {
                const isLeaf = i === parts.length - 1 && !file.isDirectory;
                const existing = current.children.find((c) => c.name === part);

                if (existing) {
                    current = existing;
                } else {
                    const newPath = `${current.path}${current.path ? '/' : ''}${part}`;
                    const node: TreeNode = {
                        name: part,
                        path: newPath,
                        isLeaf,
                        children: [],
                        ...(isLeaf && {
                            fileSize: file.fileSize,
                            lastModified: file.lastModified,
                        }),
                    };
                    current.children.push(node);
                    current = node;
                }
            });
        });

        return root.children;
    }, [files, mode]);

    return {
        files: filteredFiles,
        treeData,
        searchFilter,
        setSearchFilter,
        selectedFiles,
        setSelectedFiles,
        isLoading: status === 'LOADING' || status === 'INITIAL',
        error: status === 'ERROR' ? error : null,
        status,
    };
};
