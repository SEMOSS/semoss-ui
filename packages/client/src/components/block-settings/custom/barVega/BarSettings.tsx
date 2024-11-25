import { observer } from 'mobx-react-lite';
import { Container, Stack, Accordion, styled } from '@semoss/ui';
import { Paths } from '@/types';
import { Block, BlockDef } from '@/stores';
import { Axis, Events, Fields } from './features';

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
        return (
            <NoPaddingContainer>
                <Stack>
                    {/* fields */}
                    <StyledAccordion>
                        <Accordion.Trigger>Fields</Accordion.Trigger>
                        <Accordion.Content>
                            <Fields id={id} />
                        </Accordion.Content>
                    </StyledAccordion>
                    {/* axis */}
                    <StyledAccordion>
                        <Accordion.Trigger>Axis</Accordion.Trigger>
                        <Accordion.Content>
                            <Axis id={id} path={path} />
                        </Accordion.Content>
                    </StyledAccordion>
                    {/* styling */}
                    {/* <StyledAccordion>
                        <Accordion.Trigger>Styling</Accordion.Trigger>
                        <Accordion.Content>
                            <Styling id={id} path={path} />
                        </Accordion.Content>
                    </StyledAccordion> */}
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
