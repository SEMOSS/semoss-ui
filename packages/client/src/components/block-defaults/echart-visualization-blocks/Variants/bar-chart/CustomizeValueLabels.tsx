import {
    Accordion,
    Button,
    MenuItem,
    Select,
    styled,
    Switch,
    TextField,
} from '@semoss/ui';
import CustomAccordianBlock from './CustomAccordianBlock';
import {
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    debounce,
    Input,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useBlockSettings } from '@/hooks';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { BAR_CHART_DATA } from '../../Visualization.constants';
import { PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import { computed } from 'mobx';
import { ColorSettings } from '@/components/block-settings';
import { observer } from 'mobx-react-lite';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

const StyledMainSection = styled('div')(() => ({
    display: 'block',
    // border: '1px solid gray',
    padding: '0.5rem',
    width: '100%',
}));

const StyledSubSection = styled('div', {
    shouldForwardProp: (prop) => prop != 'display' && prop != 'justifyContent',
})<{ display?: string; justifyContent?: string }>(
    ({ theme, display, justifyContent }) => ({
        width: '100%',
        paddingTop: '0.5rem',
        display: display ?? undefined,
        justifyContent: justifyContent ?? undefined,
    }),
);

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));

const INITIAL_VALUE_LABELS = {
    show: false,
    position: 'top',
    rotate: '0',
    alignment: 'center',
    font: 'sans-serif',
    fontsize: '12',
    fontweight: 'normal',
    fontcolour: '#000000',
};

interface CustomizeValueLabelsProps {
    updateChart: any;
    option: any;
    chartType: string;
    id: string;
}

//having custom fields to customize charts text parts like: position, alignment, rotate, etc
export const CustomizeValueLabels = observer<CustomizeValueLabelsProps>(
    ({ updateChart, option, chartType, id }) => {
        const [fieldData, setFieldData] = useState(INITIAL_VALUE_LABELS);
        const path = 'option';
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [value, setValue] = useState(data.option);
        const [valueLabelsUpdated, setValueLabelsUpdated] = useState<
            'initial' | 'updated'
        >('initial');
        let accordianDetails = '';
        const accordianExpanded = false;
        const labelPositionValues = [
            'top',
            'left',
            'right',
            'bottom',
            'inside',
            'insideLeft',
            'insideRight',
            'insideTop',
            'insideBottom',
            'insideTopLeft',
            'insideBottomLeft',
            'insideTopRight',
            'insideBottomRight',
        ];
        const alignment = ['left', 'center', 'right'];
        const fontFamily = ['sans-serif', 'serif', 'monospace'];
        const fontWeight = [
            'normal',
            'bold',
            'bolder',
            'lighter',
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
        //for retaining the previously selected values, this useeffect will help
        useEffect(() => {
            if (option['series']) {
                const seriesChartData = option['series'].findIndex(
                    (opt) => opt.type === chartType,
                );
                if (option['series'][seriesChartData]['label']) {
                    let customizeLabelsOptions = {
                        show:
                            option['series'][seriesChartData]['label'].show ??
                            false,
                        position:
                            option['series'][seriesChartData]['label']
                                .position ?? undefined,
                        rotate:
                            option['series'][seriesChartData]['label'].rotate ??
                            '',
                        alignment:
                            option['series'][seriesChartData]['label'].align ??
                            '',
                        font:
                            option['series'][seriesChartData]['label']
                                .fontFamily ?? '',
                        fontsize:
                            option['series'][seriesChartData]['label']
                                .fontSize ?? '',
                        fontweight:
                            option['series'][seriesChartData]['label']
                                .fontWeight ?? '',
                        fontcolour:
                            option['series'][seriesChartData]['label'].color ??
                            '',
                    };
                    setFieldData(customizeLabelsOptions);
                }
            }
        }, []);
        // get the value of the input (wrapped in usememo because of path prop)
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
        }, [computedValue]);
        useEffect(() => {
            if (valueLabelsUpdated === 'updated') {
                updateChartData(fieldData);
            }
        }, [fieldData]);
        //handles different input fields by setting values to state, whenever a change happens
        function updateFields(fieldName, fieldValue, fieldType) {
            if (valueLabelsUpdated === 'initial')
                setValueLabelsUpdated('updated');
            setFieldData((prevData) => {
                return {
                    ...prevData,
                    [fieldName]:
                        fieldType === 'switch'
                            ? fieldValue.target.checked
                            : fieldValue.target.value,
                };
            });
        }

        function updateChartData(values: any) {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            let customizeLabelOptionsData = {};

            Object.keys(values).forEach((val) => {
                customizeLabelOptionsData = {
                    ...customizeLabelOptionsData,
                    [val]: values[val],
                };
            });
            const customizeLabelOptionsValue = customizeLabelOptionsData;
            const filteredSeries = getFilteredSeriesIndex();
            filteredSeries.forEach((item) => {
                const displayPositionIndex = item;
                let showValueLabel =
                    customizeLabelOptionsValue['show'] ?? false;
                if (customizeLabelOptionsValue['show']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['position']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['position']:
                                    customizeLabelOptionsValue['position'],
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['rotate']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['rotate']:
                                    customizeLabelOptionsValue['rotate'],
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['alignment']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['align']:
                                    customizeLabelOptionsValue['alignment'],
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['font']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['fontFamily']:
                                    customizeLabelOptionsValue['font'],
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['fontsize']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['fontSize']:
                                    Number(
                                        customizeLabelOptionsValue['fontsize'],
                                    ) || undefined,
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['fontweight']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['fontWeight']:
                                    customizeLabelOptionsValue['fontweight'],
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue['fontcolour']) {
                    if (option['series'][displayPositionIndex]) {
                        option['series'][displayPositionIndex] = {
                            ...option['series'][displayPositionIndex],
                            ['label']: {
                                ...option['series'][displayPositionIndex][
                                    'label'
                                ],
                                ['show']: showValueLabel,
                                ['color']:
                                    customizeLabelOptionsValue['fontcolour'],
                            },
                        };
                    }
                }
            });
            optionUpdated = option;
            runStateUpdateCustom(optionUpdated);
        }
        function getFilteredSeriesIndex() {
            let index = [];
            let seriesAvailable: any[] = data.option['series'].filter((item) =>
                BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }
        function runStateUpdateCustom(optionUpdated) {
            setTimeout(() => {
                try {
                    setData(
                        'option',
                        optionUpdated as PathValue<any, typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }

        const getAccordianDetails = (
            <StyledMainSection>
                <StyledSubSection display="flex" justifyContent="space-between">
                    <Switch
                        checked={fieldData.show ?? undefined}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields('show', e, 'switch')
                        }
                        title="Show Value Labels"
                    />
                    <label htmlFor="show-value-labels">Show Value Labels</label>
                </StyledSubSection>
                {fieldData.show && (
                    <>
                        <StyledSubSection>
                            <label htmlFor="label-position">Position</label>
                            <StyledSelect
                                id="label-position"
                                label="Select Position"
                                value={fieldData.position ?? ''}
                                onChange={(e) =>
                                    updateFields('position', e, 'select')
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select
                                </Select.Item>
                                {labelPositionValues.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="rotate-label">
                                Rotate Label(In Degrees)
                            </label>
                            <StyledTextField
                                variant={'outlined'}
                                label="Rotate"
                                type="number"
                                id="rotate-label"
                                // defaultValue={fieldData.rotate ?? ''}
                                value={fieldData.rotate ?? ''}
                                onChange={(e) =>
                                    updateFields('rotate', e, 'text')
                                }
                            ></StyledTextField>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="alignment-label">
                                Select Alignment
                            </label>
                            <StyledSelect
                                id="alignment-label"
                                label="Select Alignment"
                                // defaultValue={fieldData.alignment ?? ''}
                                value={fieldData.alignment ?? ''}
                                onChange={(e) =>
                                    updateFields('alignment', e, 'select')
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select Alignment
                                </Select.Item>
                                {alignment.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font">Select Font</label>
                            <StyledSelect
                                id="font"
                                label="Select Font"
                                // defaultValue={fieldData.font}
                                value={fieldData.font ?? ''}
                                onChange={(e) =>
                                    updateFields('font', e, 'select')
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select Font
                                </Select.Item>
                                {fontFamily.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font-size">
                                Select Font Size (Default: 12)
                            </label>
                            <StyledTextField
                                variant={'outlined'}
                                label="Select Font Size"
                                type="number"
                                id="font-size"
                                // defaultValue={fieldData.fontsize}
                                value={fieldData.fontsize}
                                onChange={(e) =>
                                    updateFields('fontsize', e, 'text')
                                }
                            ></StyledTextField>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font-weight">
                                Select Font Weight
                            </label>
                            <StyledSelect
                                id="font-weight"
                                label="Select Font"
                                // defaultValue={fieldData.fontweight}
                                value={fieldData.fontweight}
                                onChange={(e) =>
                                    updateFields('fontweight', e, 'select')
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select Font Weight
                                </Select.Item>
                                {fontWeight.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font-weight">
                                Select Font Colour
                            </label>
                            <StyledTextField
                                variant={'outlined'}
                                id="font-weight"
                                label="Select Font Colour"
                                type="color"
                                // defaultValue={fieldData.fontcolour}
                                value={fieldData.fontcolour}
                                onChange={(e) =>
                                    updateFields('fontcolour', e, 'text')
                                }
                            ></StyledTextField>
                            {/* <ColorSettings id={id} label={'Select Font Colour'} path={''} /> */}
                        </StyledSubSection>
                    </>
                )}
                <br />
            </StyledMainSection>
        );

        return (
            // <CustomAccordianBlock
            //     accordianExpanded={accordianExpanded}
            //     accordianSummaryProps={<ExpandMoreIcon />}
            //     accordianSummary="Customize Label Values"
            //     accordianDetails={getAccordianDetails}
            // />
            <>{getAccordianDetails}</>
        );
    },
);
