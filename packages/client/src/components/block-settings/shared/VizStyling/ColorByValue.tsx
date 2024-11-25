import { useState, useMemo } from 'react';
import { useBlocks } from '@/hooks';
import {
    styled,
    Container,
    Stack,
    Typography,
    Select,
    TextField,
    Autocomplete,
    Button,
} from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { Block, BlockDef } from '@/stores';
import { Paths } from '@/types';

const RowContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
}));
const NoPaddingContainer = styled(Container)(({ theme }) => ({
    padding: '0px!important',
}));

interface ColorStateProps {
    columnToColor: string;
    valueToColor: string;
    selectComparator: string;
    selectColor: string;
    selectedList: string[];
}
interface ColorByValueProps<D extends BlockDef = BlockDef> {
    id: string;
    path: Paths<Block<D>['data'], 4>;
    handleRules: (ColorStateProps) => void;
}
export const ColorByValue = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        handleRules,
    }: ColorByValueProps<D>) => {
        const [colorByVal, setColorByVal] = useState({
            columnToColor: '',
            valueToColor: '',
            selectComparator: '',
            selectColor: '#4c78a8',
        });
        const [selectedList, setSelectedList] = useState<string[]>([]);
        const [appliedRules, setAppliedRules] = useState([]);
        const { state } = useBlocks();
        // track the ref to debounce the input

        const columns = useMemo(() => {
            const a = JSON.stringify(
                state.parseVariable('{{Selected_Columns}}'),
            );
            return JSON.parse(a) ?? {};
        }, [Object.entries(state.variables).length]);

        const comparator = useMemo(() => {
            const a = JSON.stringify(state.parseVariable('{{Comparators}}'));
            setColorByVal({
                ...colorByVal,
                selectComparator: JSON.parse(a)[0].value,
                columnToColor: columns[0].value,
                valueToColor: columns[0].value,
            });
            return JSON.parse(a) ?? {};
        }, [Object.entries(state.variables).length]);

        const agelist = useMemo(() => {
            const a = JSON.stringify(state.parseVariable('{{Age-obj}}'));
            let values = JSON.parse(a)['data']['values'].flat(Infinity);
            return values ?? [];
        }, [Object.entries(state.variables).length]);

        const handleColumnToColor = (value: string) => {
            setColorByVal({
                ...colorByVal,
                columnToColor: value,
            });
        };
        const handleColorChange = (newColor: string) => {
            setColorByVal({
                ...colorByVal,
                selectColor: newColor,
            });
        };
        const handleValueToColor = (value: string) => {
            setColorByVal({
                ...colorByVal,
                valueToColor: value,
            });
        };
        const handleSelectComparator = (value: string) => {
            setColorByVal({
                ...colorByVal,
                selectComparator: value,
            });
        };
        const handleSelectedList = (value) => {
            setSelectedList(value);
            console.log(value);
        };
        const handleExcecute = () => {
            let obj = {
                columnToColor: colorByVal.columnToColor,
                valueToColor: colorByVal.valueToColor,
                selectComparator: colorByVal.selectComparator,
                selectColor: colorByVal.selectColor,
                selectedList: selectedList,
            };

            handleRules([...appliedRules, obj]);
            // setJsonRules(temp);
            setAppliedRules([...appliedRules, obj]);
            setColorByVal({
                columnToColor: columns[0].value,
                valueToColor: columns[0].value,
                selectComparator: comparator[0].value,
                selectColor: '#4c78a8',
            });
            setSelectedList([]);
        };

        return (
            <Stack>
                <NoPaddingContainer>
                    <Typography variant="body2">Applied Rules</Typography>
                    {appliedRules.map((item, index) => (
                        <Typography key={index} variant="body2">
                            {`${index + 1} >> ${item.columnToColor} ${
                                item.valueToColor
                            } ${item.selectComparator} ${
                                item.selectedList
                            } >> ${item.selectColor}`}
                        </Typography>
                    ))}
                </NoPaddingContainer>
                <NoPaddingContainer>
                    <Typography variant="body2">New Rules</Typography>
                    <RowContainer>
                        <Select
                            sx={{ padding: '8px' }}
                            value={colorByVal.columnToColor}
                            onChange={(e) =>
                                handleColumnToColor(e.target.value)
                            }
                            placeholder="Select column to color"
                            label="Column to Color"
                            fullWidth
                            size="small"
                        >
                            {columns.map((item) => (
                                <Select.Item
                                    key={item.label}
                                    value={item.value}
                                >
                                    {item.label}
                                </Select.Item>
                            ))}
                        </Select>
                        <TextField
                            sx={{ padding: '8px' }}
                            fullWidth
                            type="color"
                            value={colorByVal.selectColor}
                            onChange={(e) => {
                                handleColorChange(e.target.value);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                        />
                    </RowContainer>
                    <RowContainer>
                        <Select
                            sx={{ padding: '8px' }}
                            value={colorByVal.valueToColor}
                            onChange={(e) => handleValueToColor(e.target.value)}
                            placeholder="Select value to color"
                            label="Value to Color"
                            fullWidth
                            size="small"
                        >
                            {columns.map((item) => (
                                <Select.Item
                                    key={item.label}
                                    value={item.value}
                                >
                                    {item.label}
                                </Select.Item>
                            ))}
                        </Select>
                        <Select
                            sx={{ padding: '8px' }}
                            value={colorByVal.selectComparator}
                            onChange={(e) =>
                                handleSelectComparator(e.target.value)
                            }
                            placeholder="Select Comparator"
                            label="Comparator"
                            fullWidth
                            size="small"
                        >
                            {comparator.map((item) => (
                                <Select.Item
                                    key={item.label}
                                    value={item.value}
                                >
                                    {item.label}
                                </Select.Item>
                            ))}
                        </Select>
                    </RowContainer>
                    {colorByVal.selectComparator === '==' ? (
                        <Stack>
                            <Typography variant="body2">
                                Select values
                            </Typography>
                            <Autocomplete
                                options={agelist}
                                value={selectedList}
                                fullWidth
                                multiple
                                size="small"
                                onChange={(e, newVal) =>
                                    handleSelectedList(newVal)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select values"
                                    />
                                )}
                            />
                        </Stack>
                    ) : (
                        <TextField
                            fullWidth
                            type="number"
                            value={selectedList[0]}
                            onChange={(e) => {
                                setSelectedList([e.target.value]);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                        />
                    )}

                    <Button onClick={handleExcecute}>Excecute</Button>
                </NoPaddingContainer>
            </Stack>
        );
    },
);
