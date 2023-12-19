import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Checkbox, Stack, styled } from '@semoss/ui';
import { useBlockSettings } from '@/hooks';
import { BlockDef } from '@/stores';
import { Paths, PathValue } from '@/types';
import { BaseSettingSection } from '../BaseSettingSection';

interface FileExtensionSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    label?: string;
    path: Paths<Block<D>['data'], 4>;
    extensions: string[];
}

const StyledFileExtension = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

export const FileExtensionSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        path,
        extensions,
    }: FileExtensionSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        //* Initialize all checkboxes as checked
        const initialCheckedState = new Set(extensions);
        const [checkedExtensions, setCheckedExtensions] =
            useState(initialCheckedState);

        useEffect(() => {
            setData(
                path,
                Array.from(checkedExtensions) as PathValue<
                    D['data'],
                    typeof path
                >,
            );
        }, [checkedExtensions, setData, path]);

        const handleCheckboxChange = (extension: string) => {
            setCheckedExtensions((prevCheckedExtensions) => {
                const newCheckedExtensions = new Set(prevCheckedExtensions);
                if (newCheckedExtensions.has(extension)) {
                    newCheckedExtensions.delete(extension);
                } else {
                    newCheckedExtensions.add(extension);
                }
                return newCheckedExtensions;
            });
        };

        return (
            <BaseSettingSection label={label}>
                <StyledFileExtension>
                    {extensions.map((extension) => (
                        <Checkbox
                            key={extension}
                            label={extension}
                            checked={checkedExtensions.has(extension)}
                            onChange={() => handleCheckboxChange(extension)}
                        />
                    ))}
                </StyledFileExtension>
            </BaseSettingSection>
        );
    },
);
