import { useState, useEffect } from 'react';
import {
    styled,
    Typography,
    Box,
    TextField,
    Stack,
    Button,
    Checkbox,
    Icon,
    Autocomplete,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import {
    Save,
    AutoStoriesOutlined,
    CheckBox,
    CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StyledTitle = styled(Typography)(({ theme }) => ({
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    /* Typography/H6 */
    fontFamily: 'Inter',
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '160%' /* 32px */,
    letterSpacing: '0.15px',
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '150%' /* 32px */,
    letterSpacing: '0.15px',
    marginBottom: theme.spacing(1),
}));

const StyledOuterContainer = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    width: '50%',
    height: '100%',
}));

const StyledFormSection = styled(Box)(({ theme }) => ({
    width: '100%',
}));

const StyledKnowledgeBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    padding: theme.spacing(1),
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    alignSelf: 'stretch',
    border: '1px dashed var(--Secondary-Border, #C4C4C4)',
    marginTop: theme.spacing(1),
}));

const StyledEmptyKnowledgeMessage = styled(Typography)(({ theme }) => ({
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '150%' /* 32px */,
    letterSpacing: '0.15px',
    textAlign: 'center',
}));

export const CreateAgent = observer((props) => {
    const navigate = useNavigate();
    const [tools, setTools] = useState([]);
    function saveAgent() {
        //To Do
        navigate('/agents');
    }
    return (
        <StyledOuterContainer
            direction={'column'}
            spacing={3}
            justifyContent={'space-between'}
            alignItems={'flex-start'}
        >
            <StyledTitle variant={'h6'}>Create Agent</StyledTitle>

            <StyledFormSection>
                <StyledSectionTitle variant={'body1'}>Name</StyledSectionTitle>
                <TextField fullWidth placeholder={'Name'}></TextField>
            </StyledFormSection>
            <StyledFormSection>
                <StyledSectionTitle variant={'body1'}>
                    Description
                </StyledSectionTitle>
                <TextField
                    fullWidth
                    placeholder={'Description'}
                    multiline
                    minRows={4}
                ></TextField>
            </StyledFormSection>
            <StyledFormSection>
                <StyledSectionTitle variant={'body1'}>
                    Instructions
                </StyledSectionTitle>
                <TextField
                    placeholder={'Instructions'}
                    fullWidth
                    multiline
                    minRows={4}
                ></TextField>
            </StyledFormSection>
            {/* <StyledFormSection>
                    <StyledSectionTitle variant={'body1'}>
                        Conversation Starters
                    </StyledSectionTitle>
                </StyledFormSection> */}
            <StyledFormSection>
                <Stack
                    direction={'row'}
                    width={'100%'}
                    spacing={2}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                >
                    <StyledSectionTitle variant={'body1'}>
                        Knowledge Repository
                    </StyledSectionTitle>
                    <Button variant="outlined">Add file</Button>
                </Stack>
                <StyledKnowledgeBox>
                    <Icon>
                        <AutoStoriesOutlined />
                    </Icon>
                    <StyledEmptyKnowledgeMessage variant={'body1'}>
                        No knowledge yet. Add PDFs, documents, or other text to
                        the knowledge repository that the Playground will
                        reference in every conversation.
                    </StyledEmptyKnowledgeMessage>
                </StyledKnowledgeBox>
            </StyledFormSection>
            <StyledFormSection>
                <StyledSectionTitle variant={'body1'}>Tools</StyledSectionTitle>
                <Autocomplete
                    multiple
                    options={[]}
                    value={tools}
                    onChange={(e, value) => {
                        //To Do
                        //setTools(value);
                    }}
                    fullWidth={true}
                    disableCloseOnSelect={true}
                    getOptionKey={(o) => o.app_id}
                    getOptionLabel={(o) => o.app_name}
                    isOptionEqualToValue={(o, v) => o.app_id === v.app_id}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps}>
                                <Checkbox
                                    icon={
                                        <CheckBoxOutlineBlank fontSize="small" />
                                    }
                                    checkedIcon={<CheckBox fontSize="small" />}
                                    style={{ marginRight: 8 }}
                                    checked={selected}
                                />
                                {option.app_name}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Tools"
                            placeholder="Tools"
                        />
                    )}
                />
            </StyledFormSection>
            <Stack
                direction={'row'}
                spacing={1}
                justifyContent={'flex-start'}
                alignItems={'center'}
            >
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => {
                        saveAgent();
                    }}
                >
                    Save
                </Button>
                <Button
                    variant="text"
                    onClick={() => {
                        navigate('/agents');
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </StyledOuterContainer>
    );
});
