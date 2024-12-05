import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    TextField,
    Container,
    Stack,
    Accordion,
    styled,
    Typography,
    Button,
} from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { ColorByValue } from '../../../shared';

const NoPaddingContainer = styled(Container)(({ theme }) => ({
    padding: '0px!important',
}));
const RowContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    gap: theme.spacing(2),
}));
const StyledAccordion = styled(Accordion)(({ theme }) => ({
    boxShadow: 'none',
    borderRadius: '0 !important',
    border: `1px solid ${theme.palette.divider}`,
    '&:before': {
        display: 'none',
    },
    '&.Mui-expanded': {
        margin: '0',
    },
}));

interface StyleSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    value: string;

    setValue: (value: string) => void;
}

export const Styling = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        value,
        setValue,
    }: StyleSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        //local states
        const [barColor, setBarColor] = useState<string>('#4c78a8');
        const [barWidth, setBarWidth] = useState<number>(10);
        const [barTitle, setBarTitle] = useState<string>('');
        const [fontSizeColor, setFontSizeColor] = useState({
            fontSize: 12,
            color: '#00000',
        });

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const reinitializeStates = (state) => {
            setBarColor(state['barColor'] ?? '#4c78a8');
            setBarWidth(state['barWidth'] ?? 10);
            setBarTitle(state['barTitle'] ?? '');
            setFontSizeColor(
                state['fontSizeColor'] ?? { fontSize: 12, color: '#00000' },
            );
        };

        useEffect(() => {
            if (value) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(value);
                let state = json['_state'];
                if (state && state.hasOwnProperty('styling')) {
                    reinitializeStates(state['styling']);
                }
            }
        }, [value]);

        const dispatchData = (newSpec: PathValue<D['data'], typeof path>) => {
            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, newSpec as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const handleExcecute = () => {
            // insert the new value
            let tempValue = JSON.parse(value);
            // update the bar color
            tempValue['layer'][0]['encoding']['color'] = {
                ...tempValue['layer'][0]['encoding']['color'],
                value: barColor,
            };

            // update the bar width
            if (typeof tempValue['layer'][0]['mark'] === 'string') {
                tempValue['layer'][0]['mark'] = {
                    type: tempValue['layer'][0]['mark'],
                };
            }
            tempValue['layer'][0]['mark'] = {
                ...tempValue['layer'][0]['mark'],
                size: barWidth,
            };

            // update the bar title, font size and color
            tempValue['title'] = {
                ...tempValue['title'],
                ...fontSizeColor,
                text: barTitle,
            };

            tempValue['_state']['styling'] = {
                ...tempValue['_state']['styling'],
                barColor: barColor,
                barWidth: barWidth,
                barTitle: barTitle,
                fontSizeColor: fontSizeColor,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleBarColorChange = (newColor: string) => {
            setBarColor(newColor);
        };

        const handleBarWidth = (newWidth: number) => {
            setBarWidth(newWidth);
        };

        const handleBarTitle = (newTitle: string) => {
            setBarTitle(newTitle);
        };

        const handleColorByValueChange = (rules) => {
            let condition = [];
            rules.forEach((rule) => {
                //vega rule schema formations
                let schema = '';
                if (rule.selectComparator === '==') {
                    schema = `indexof([${rule.selectedList}], datum.${rule.columnToColor}) >= 0`;
                } else {
                    schema = `datum.${rule.valueToColor} ${rule.selectComparator} ${rule.selectedList[0]}`;
                }
                condition.unshift({
                    test: schema,
                    value: rule.selectColor,
                });
            });

            // insert the new value into JSOn specification
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding']['color'] = {
                condition: condition,
                ...tempValue['layer'][0]['encoding']['color'],
            };
            tempValue['_state']['styling'] = {
                ...tempValue['_state']['styling'],
                colorByVal: rules,
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleFontSizeColorChange = (val: string, type: string) => {
            setFontSizeColor({ ...fontSizeColor, [type]: val });
        };

        return (
            <Stack>
                <Stack>
                    <Typography variant="h6">Bar Color</Typography>
                    <TextField
                        fullWidth
                        type="color"
                        value={barColor}
                        onChange={(e) => {
                            handleBarColorChange(e.target.value);
                        }}
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                    />
                </Stack>
                {/* <Stack>
                    <StyledAccordion>
                        <Accordion.Trigger>Color by value</Accordion.Trigger>
                        <Accordion.Content>
                            <ColorByValue
                                id={id}
                                path={path}
                                handleRules={handleColorByValueChange}
                            />
                        </Accordion.Content>
                    </StyledAccordion>
                </Stack> */}
                <Stack>
                    <Typography variant="h6">Bar Width</Typography>
                    <TextField
                        fullWidth
                        type="number"
                        value={barWidth}
                        onChange={(e) => {
                            handleBarWidth(Number(e.target.value));
                        }}
                        size="small"
                        variant="outlined"
                    />
                </Stack>
                <Stack>
                    <Typography variant="h6">Bar Title</Typography>
                    <TextField
                        fullWidth
                        type="text"
                        value={barTitle}
                        onChange={(e) => {
                            handleBarTitle(e.target.value);
                        }}
                        size="small"
                        variant="outlined"
                    />
                </Stack>
                <Stack>
                    <Typography variant="h6">Font Size & Color</Typography>
                    <RowContainer>
                        <TextField
                            fullWidth
                            type="number"
                            value={fontSizeColor.fontSize}
                            onChange={(e) => {
                                handleFontSizeColorChange(
                                    e.target.value,
                                    'fontSize',
                                );
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            label="Font Size"
                        />
                        <TextField
                            fullWidth
                            type="color"
                            value={fontSizeColor.color}
                            onChange={(e) => {
                                handleFontSizeColorChange(
                                    e.target.value,
                                    'color',
                                );
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            label="Font Size"
                        />
                    </RowContainer>
                    <Button onClick={handleExcecute}>Excecute</Button>
                </Stack>
            </Stack>
        );
    },
);
