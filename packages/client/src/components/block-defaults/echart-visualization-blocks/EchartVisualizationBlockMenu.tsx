import { BlockComponent } from '@/stores';
import {
    Stack,
    styled,
    ToggleTabsGroup,
    Autocomplete,
    TextField,
    IconButton,
} from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
    BaseSettingSection,
} from '@/components/block-settings';
import { useBlockSettings, useBlocksPixel } from '@/hooks';
import { useState } from 'react';
import { UpgradedVisualizationTool } from './Variants/bar-chart/UpgradedVisualizationTool';

const StyledContainer = styled('div')(() => ({
    maxHeight: '50vh',
}));
const StyledSubSection = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'center',
}));
const StyledToolsSection = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
}));
const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    border: '1px',
    minHeight: '42px',
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
}));
const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 11px',
    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
}));
import { LineSettings } from './Variants';
import { EchartVisualizationBlockDef } from './EchartVisualizationBlock';

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [selectedTab, setSelectedTab] = useState('Tools');

    const SelectVariant = () => {
        switch (data.variation) {
            case 'echart-line-chart':
                return <LineSettings id={id} path={'option'} />;
            default:
                return <></>;
        }
    };

    return (
        <Stack padding={2} height="100%">
            {/* Variation selection */}
            {SelectVariant()}

            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            {/* <JsonSettings id={id} path="option" /> */}
            {/* <CodeEditorSettings id={id} path="specJson" /> */}
            <StyledToggleTabsGroup
                value={selectedTab}
                onChange={(e: React.SyntheticEvent, val: string) => {
                    setSelectedTab(val);
                }}
            >
                <StyledToggleTabsGroupItem label="Data" value={'Data'} />
                <StyledToggleTabsGroupItem label="Tools" value={'Tools'} />
                <StyledToggleTabsGroupItem label="JSON" value={'JSON'} />
            </StyledToggleTabsGroup>
            <StyledContainer>
                {selectedTab === 'Data' && (
                    <StyledSubSection>
                        <span>Data Tab Selected</span>
                    </StyledSubSection>
                )}
                {selectedTab === 'Tools' && (
                    <StyledToolsSection>
                        {/* <VisualizationTool id={id} showTool={true} /> */}
                        <UpgradedVisualizationTool id={id} />
                    </StyledToolsSection>
                )}
                {selectedTab === 'JSON' && (
                    <StyledSubSection>
                        <JsonSettings id={id} path="option" height="100vh" />
                    </StyledSubSection>
                )}
            </StyledContainer>
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="option"
                    appendPrompt={'An EChart graph'}
                    placeholder="Ex: Generate a E-Chart bar graph."
                    valueAsObject
                />
            )}
        </Stack>
    );
};
