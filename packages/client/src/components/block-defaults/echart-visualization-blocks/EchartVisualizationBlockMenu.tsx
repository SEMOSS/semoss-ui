import { BlockComponent } from '@/stores';
import { Stack, styled, ToggleTabsGroup } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';
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

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    const [selectedTab, setSelectedTab] = useState('Tools');
    return (
        <Stack style={{ height: '500px' }}>
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
