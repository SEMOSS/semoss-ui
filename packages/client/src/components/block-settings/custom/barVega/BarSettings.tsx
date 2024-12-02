import { useState, useEffect, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Container, Stack, Accordion, styled } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { Block, BlockDef } from '@/stores';
import { Axis, Events, Fields, Styling } from './features';
import { getValueByPath } from '@/utility';
import { computed } from 'mobx';
import { useBlockSettings } from '@/hooks';

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

interface BarSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const BarSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: BarSettingsProps<D>) => {
        const { data } = useBlockSettings<D>(id);
        // track the value
        const [value, setValue] = useState('');

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

        // update the value whenever the computed one changes
        useEffect(() => {
            const json: PathValue<D['data'], typeof path> =
                JSON.parse(computedValue);
            let state = json['_state'];
            if (!json.hasOwnProperty('_state')) {
                json['_state'] = { axis: {}, styling: {} };
            }

            setValue(JSON.stringify(json));
        }, [computedValue]);
        return (
            <NoPaddingContainer>
                <Stack>
                    {/* fields */}
                    <StyledAccordion>
                        <Accordion.Trigger>Fields</Accordion.Trigger>
                        <Accordion.Content>
                            <Fields id={id} path={path} />
                        </Accordion.Content>
                    </StyledAccordion>
                    {/* axis */}
                    <StyledAccordion>
                        <Accordion.Trigger>Axis</Accordion.Trigger>
                        <Accordion.Content>
                            <Axis
                                id={id}
                                path={path}
                                value={value}
                                setValue={setValue}
                            />
                        </Accordion.Content>
                    </StyledAccordion>
                    {/* styling */}
                    <StyledAccordion>
                        <Accordion.Trigger>Styling</Accordion.Trigger>
                        <Accordion.Content>
                            <Styling
                                id={id}
                                path={path}
                                value={value}
                                setValue={setValue}
                            />
                        </Accordion.Content>
                    </StyledAccordion>
                    {/* Events */}
                    <StyledAccordion>
                        <Accordion.Trigger>Events</Accordion.Trigger>
                        <Accordion.Content>
                            <Events id={id} path={path} />
                        </Accordion.Content>
                    </StyledAccordion>
                </Stack>
            </NoPaddingContainer>
        );
    },
);
