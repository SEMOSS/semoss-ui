import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock, usePixel } from '@/hooks';
import { BaseSettingSection } from '../BaseSettingSection';
import { useParams } from 'react-router-dom';
import { Autocomplete } from '@mui/material';
import { TextField } from '@semoss/ui';
import { Block, BlockDef } from '@/stores';
import { Paths, PathValue } from '@/types';
import { PDFViewerBlockDef } from '../../block-defaults/pdfViewer-block/PDFViewerBlock';

interface AssetFile {
    path: string;
    name: string;
    lastModified: string;
    type: string;
}

interface PDFViewerSettings<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const PDFViewerSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: PDFViewerSettings<D>) => {
        const { data, setData } = useBlock<PDFViewerBlockDef>(id);
        const { appId } = useParams();
        const getAssets = usePixel<AssetFile[]>(
            `BrowseAsset(filePath=["version/assets/"], space=["${appId}"]);`,
        );
        const [selectedPdfPath, setSelectedPdfPath] = useState(
            data?.selectedPdf || '', // Initialize with existing value
        );
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const pdfFiles = React.useMemo(() => {
            if (!getAssets.data) return [];
            return getAssets?.data?.filter((file) => file?.type === 'pdf');
        }, [getAssets.data]);

        // Handle selection change
        const setBlockData = (newValue, optPath) => {
            if (!newValue) {
                setSelectedPdfPath('');
                return;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        optPath,
                        newValue as PathValue<D['data'], typeof path>,
                        true,
                    );
                    setSelectedPdfPath(newValue);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label="Files">
                <Autocomplete
                    options={pdfFiles}
                    value={
                        selectedPdfPath
                            ? pdfFiles.find(
                                  (file) => file.path === selectedPdfPath,
                              )
                            : null
                    }
                    onChange={(_, newValue) => {
                        setBlockData(
                            newValue ? newValue.path : '',
                            'selectedPdf' as Paths<
                                PDFViewerBlockDef['data'],
                                4
                            >,
                        );
                    }}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                        option.path === value.path
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            variant="outlined"
                        />
                    )}
                    fullWidth
                />
            </BaseSettingSection>
        );
    },
);
