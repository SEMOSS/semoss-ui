import { ChangeEvent, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

import {
    AutocompleteTwo,
    CheckboxTwo,
    Button,
    styled,
    Switch,
    TextField,
    Typography,
} from '@semoss/ui';

import {
    useBlockSettings,
    GridBlockColumn,
    Paths,
    PathValue,
    Block,
    BlockDef,
    GridBlockDef,
    WrapTextSettings,
} from '@semoss/renderer';

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
    id: string;
    path: Paths<Block<D>['data'], 4>;
}

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledFieldWrapper = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8px',
}));

const StyledAxisDiv = styled('div')<{
    display?: string;
    justifyContent?: string;
    gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: 'row',
    padding: '8px 0',
    alignItems: 'center',
    gap: gap ?? undefined,
}));

export const ColumnTextWrap = observer(
    <D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
        const { data, setData } = useBlockSettings<GridBlockDef>(id);
        const [wrapTextSettings, setWrapTextSettings] =
            useState<WrapTextSettings>({
                selectedColumn: [] as string[],
                textWrap: false,
            });

        useEffect(() => {
            if (data.option?.wrapTextSettings) {
                setWrapTextSettings(data.option.wrapTextSettings);
            }
        }, [data.option]);

        const handleColumnChange = (_, selected: GridBlockColumn[]) => {
            const newSelected = selected.map((col) => col.name);
            const newOption = {
                ...data.option,
                wrapTextSettings: {
                    ...wrapTextSettings,
                    selectedColumn: newSelected,
                },
            };
            setWrapTextSettings((prev) => ({
                ...prev,
                selectedColumns: newSelected,
            }));
            setData(
                'option',
                newOption as PathValue<GridBlockDef['data'], 'option'>,
            );
        };

        const handleInputChange = (checked: boolean) => {
            const newOption = {
                ...data.option,
                wrapTextSettings: {
                    ...wrapTextSettings,
                    textWrap: checked,
                },
            };
            setWrapTextSettings((prev) => ({
                ...prev,
                textWrap: checked,
            }));
            setData(
                'option',
                newOption as PathValue<GridBlockDef['data'], 'option'>,
            );
        };

        const resetToInitialState = () => {
            const defaultState = {
                selectedColumn: [] as string[],
                textWrap: false,
            };
            setWrapTextSettings(defaultState);
            const newOption = {
                ...data.option,
                wrapTextSettings: defaultState,
            };
            setData(
                'option',
                newOption as PathValue<GridBlockDef['data'], 'option'>,
            );
        };

        const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
        const checkedIcon = <CheckBoxIcon fontSize="small" />;
        const renderOption = (
            props: any,
            option: GridBlockColumn,
            { selected }: any,
        ) => {
            return (
                <li {...props}>
                    <CheckboxTwo
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={selected}
                    />
                    {option.name}
                </li>
            );
        };

        return (
            <StyledContainer>
                <StyledFieldWrapper>
                    <label>
                        <Typography variant="body2" color="secondary">
                            Select Column
                        </Typography>{' '}
                    </label>
                    <AutocompleteTwo
                        fullWidth
                        multiple
                        disableCloseOnSelect
                        size="small"
                        value={data.columns?.filter((c) =>
                            wrapTextSettings.selectedColumn.includes(c.name),
                        )}
                        onChange={handleColumnChange}
                        options={data.columns || []}
                        getOptionLabel={(option) => option.name}
                        renderOption={renderOption}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                placeholder="Select column"
                            />
                        )}
                    />
                </StyledFieldWrapper>
                <StyledAxisDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: '8px' }}
                >
                    <Switch
                        size="small"
                        checked={wrapTextSettings.textWrap}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e.target.checked)
                        }
                        title="Wrap Text"
                    />
                    <Typography variant="body2" color="secondary">
                        Wrap Text
                    </Typography>
                </StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="end">
                    <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                </StyledAxisDiv>
            </StyledContainer>
        );
    },
);
