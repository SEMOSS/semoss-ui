import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { Paths, PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import {
    Slider,
    styled,
    Switch,
    TextField,
    Typography,
    Select,
    Button,
} from '@semoss/ui';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    path: Paths<Block<D>['data'], 4>;
}
const StyledAxisDiv = styled('div')<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: 'row',
    padding: '0.5rem',
}));
const StyledButton = styled(Button)({
    left: '80%',
});
const StyledAxisColDiv = styled('div')<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: 'column',
    padding: '0.5rem',
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));
const StyledTypography = styled(Typography)({
    paddingLeft: '10px',
});
const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));
export const PieTitle = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState('');
        const [showTitle, setShowTitle] = useState(true);
        const [title, setTitle] = useState({
            name: '',
            alignment: 'center',
            size: 8,
            weight: 'normal',
            family: '',
        });
        const Alignment = ['left', 'right', 'center'];
        const fontWeights = [
            'bold',
            'normal',
            '100',
            '200',
            '300',
            '400',
            '500',
            '600',
            '700',
            '800',
            '900',
        ];
        const fontFamily = [
            'Arail',
            'Arail Black',
            'Arail Narrow',
            'Calibri',
            'Century Gothic',
            'Comic Sans MS',
            'Courier New',
            'Garamond',
            'Georgia',
            'Helvetica',
            'Inter',
            'Open Sans',
            'Sans-Serif',
            'Segoe UI',
            'Times New Roman',
            'Verdana',
        ];
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue, data]);

        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                reinitializeFeatures(data.option);
            }
        }, [id]);
        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                retainLocalState(data.option);
            }
        }, [showTitle]);
        const retainLocalState = (options) => {
            setTitle((prev) => ({
                ...prev,
                name: options['title']['text'],
                alignment: options['title']['left'],
                size: options['title']['textStyle']['fontSize'],
                weight: options['title']['textStyle']['fontWeight'],
                family: options['title']['textStyle']['fontFamily'],
            }));
        };
        const reinitializeFeatures = (options) => {
            setShowTitle(options['title'].show ?? true);
        };
        function handleInputChange(e, title, inputValue) {
            let option = JSON.parse(value);
            if (title === 'showTitle') {
                option['title'].show = inputValue;
                setShowTitle(inputValue);
            } else if (title === 'titleName') {
                option['title']['text'] = inputValue;
                setTitle((prev) => ({
                    ...prev,
                    name: inputValue,
                }));
            } else if (title === 'titleAlignment') {
                option['title']['left'] = inputValue;
                setTitle((prev) => ({
                    ...prev,
                    alignment: inputValue,
                }));
            } else if (title === 'titleSize') {
                option['title']['textStyle']['fontSize'] = inputValue;
                setTitle((prev) => ({
                    ...prev,
                    size: inputValue,
                }));
            } else if (title === 'titleWeight') {
                option['title']['textStyle']['fontWeight'] = inputValue;
                setTitle((prev) => ({
                    ...prev,
                    weight: inputValue,
                }));
            } else if (title === 'titleFamily') {
                option['title']['textStyle']['fontFamily'] = inputValue;
                setTitle((prev) => ({
                    ...prev,
                    family: inputValue,
                }));
            }
            setData(path, option as PathValue<D['data'], typeof path>);
        }
        function handleReset() {
            let option = JSON.parse(value);
            option['title'].show = option['reset']['title']['show'];
            option['title']['text'] = option['reset']['title']['text'];
            option['title']['left'] = option['reset']['title']['left'];
            option['title']['textStyle']['fontSize'] =
                option['reset']['title']['textStyle']['fontSize'];
            option['title']['textStyle']['fontWeight'] =
                option['reset']['title']['textStyle']['fontWeight'];
            option['title']['textStyle']['fontFamily'] =
                option['reset']['title']['textStyle']['fontFamily'];
            setData(path, option as PathValue<D['data'], typeof path>);
            retainLocalState(option);
        }
        return (
            <StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="space-around">
                    <Switch
                        checked={showTitle}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e, 'showTitle', e.target.checked)
                        }
                        title="Show Title"
                    />
                    <label>Show Title</label>
                </StyledAxisDiv>
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-name">Title Name</label>
                        <StyledTextField
                            id="name"
                            name="name"
                            value={title?.name}
                            onChange={(e) =>
                                handleInputChange(
                                    e,
                                    'titleName',
                                    e.target.value,
                                )
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-alignment">
                            Select Alignment
                        </label>
                        <StyledSelect
                            id="alignment"
                            name="alignment"
                            value={title?.alignment}
                            onChange={(e) =>
                                handleInputChange(
                                    e,
                                    'titleAlignment',
                                    e.target.value,
                                )
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {Alignment.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-size">Text Size</label>
                        <StyledTextField
                            id="size"
                            name="size"
                            value={title?.size}
                            onChange={(e) =>
                                handleInputChange(
                                    e,
                                    'titleSize',
                                    e.target.value,
                                )
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-font-weight">
                            Select Font Weight
                        </label>
                        <StyledSelect
                            id="font-weight"
                            name="fontWeight"
                            value={title?.weight}
                            onChange={(e) =>
                                handleInputChange(
                                    e,
                                    'titleWeight',
                                    e.target.value,
                                )
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {fontWeights.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-font-family">
                            Select Font Family
                        </label>
                        <StyledSelect
                            id="font-family"
                            name="fontFamily"
                            value={title?.family}
                            onChange={(e) =>
                                handleInputChange(
                                    e,
                                    'titleFamily',
                                    e.target.value,
                                )
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {fontFamily.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledButton
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleReset}
                    >
                        Reset
                    </StyledButton>
                )}
            </StyledAxisDiv>
        );
    },
);
