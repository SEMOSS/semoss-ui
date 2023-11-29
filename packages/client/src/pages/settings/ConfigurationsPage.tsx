import React, {
    useEffect,
    useState,
    useReducer,
    useRef,
    SyntheticEvent,
} from 'react';
import { useForm } from 'react-hook-form';

import { useAPI, useRootStore, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import {
    Divider,
    Accordion,
    Button,
    Search,
    styled,
    TextField,
    ToggleTabsGroup,
    Typography,
    useNotification,
    Box,
} from '@semoss/ui';
import Editor from '@monaco-editor/react';
import google from '../../assets/img/google.png';
import ms from '../../assets/img/ms.png';
import dropbox from '../../assets/img/dropbox.png';
import github from '../../assets/img/github.png';
import other from '../../assets/img/other.png';

import { useNavigate } from 'react-router-dom';
import { KeyboardArrowDown, SearchOutlined } from '@mui/icons-material';

const SOCIAL = {
    google: {
        name: 'Google',
        image: google,
    },
    ms: {
        name: 'Microsoft',
        image: ms,
    },
    dropbox: {
        name: 'Dropbox',
        image: dropbox,
    },
    github: {
        name: 'Github',
        image: github,
    },
    native: {
        name: 'Native',
        image: other,
    },
};

const StyledConfigurationsOptionsAccordion = styled('div')(({ theme }) => ({
    display: 'flex',
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
    width: '291px',
}));

const StyledBox = styled(Box)(({ theme }) => ({
    padding: '0px 12px 12px 12px',
}));

const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
    color: '#5c5c5c',
}));

const StyledAccordionContent = styled(Accordion.Content)(({ theme }) => ({
    fontSize: '14px',
    margin: 0,
    padding: '12px 16px 16px 16px',
}));

const StyledListButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    width: '100%',
    justifyContent: 'left',
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    marginBottom: '8px',
}));

const StyledImage = styled('img')({
    objectFit: 'cover',
    maxHeight: '28px',
    maxWidth: '28px',
    verticalAlign: 'middle',
    padding: '4px',
});

const StyledTitle = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledActionButtonsDiv = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'center',
    gap: '.5rem',
}));

const StyledButton = styled(Button)({
    textTransform: 'none',
    fontWeight: 'bold',
});

const StyledForm = styled('form')(({ theme }) => ({
    marginLeft: theme.spacing(8),
    width: '100%',
}));

const StyledKeyValue = styled('div')(({ theme }) => ({
    display: 'flex',
    marginBottom: theme.spacing(2),
}));

const StyledPropContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    marginBottom: theme.spacing(2),
    padding: '24px',
    borderRadius: '15px',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    marginBottom: '16px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    marginRight: '12px',
}));

const initialState = {
    socialProps: {},
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

export const ConfigurationsPage = () => {
    const { adminMode } = useSettings();

    const navigate = useNavigate();

    if (!adminMode) {
        navigate('/settings');
    }

    const [state, dispatch] = useReducer(reducer, initialState);
    const { socialProps } = state;

    const [accordionValue, setAccordionValue] = useState<string>();

    const [authentication, setAuthentication] = useState(
        Object.keys(socialProps),
    );
    const [authExpanded, setAuthExpanded] = useState(true);

    const [tabValue, setTabValue] = useState(0);

    const [authSearch, setAuthSearch] = useState('');
    const authSearchBarRef = useRef(null);

    const loginProperties = useAPI(['getLoginProperties']);

    useEffect(() => {
        // pixel call to get pending members
        if (loginProperties.status !== 'SUCCESS' || !loginProperties.data) {
            return;
        }

        // Key is the label for each accordion, the value is an array of fields
        const formattedProperties = {};
        Object.entries(loginProperties.data).map((pr) => {
            if (pr[0] === 'cac') return; // angular js ui doesn't paint cac
            const fields = [];
            Object.entries(pr[1]).map((prop) => {
                const fieldMap = {
                    label: prop[0],
                    value: prop[1],
                };

                fields.push(fieldMap);
            });

            if (!formattedProperties[pr[0]]) {
                formattedProperties[pr[0]] = fields;
            }
        });

        dispatch({
            type: 'field',
            field: 'socialProps',
            value: formattedProperties,
        });

        setAccordionValue(Object.keys(formattedProperties)[0]);
        setAuthentication(Object.keys(formattedProperties));
        authSearchBarRef.current?.focus();
    }, [loginProperties.status, loginProperties.data]);

    useEffect(() => {
        // reset the options if there is no search value
        if (!authSearch) {
            setAuthentication(Object.keys(socialProps));
            return;
        }

        const cleanedSearch = authSearch.toLowerCase();

        const filtered = authentication.filter((c) => {
            return c.toLowerCase().includes(cleanedSearch);
        });

        setAuthentication(filtered);
    }, [authSearch]);

    // show a loading screen when loginProperties is pending
    if (loginProperties.status !== 'SUCCESS' || !Object.keys(socialProps)) {
        return (
            <LoadingScreen.Trigger description="Retrieving social properties" />
        );
    }

    const onTabChange = (event: SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const changeSocialProps = (fieldName, value) => {
        const socialPropsCopy = socialProps;
        socialPropsCopy[fieldName] = value;

        dispatch({
            type: 'field',
            field: 'socialProps',
            value: socialPropsCopy,
        });
        // setSocialProps(socialPropsCopy);
    };

    const settingsPage = () => {
        return Object.keys(socialProps) ? (
            <StyledConfigurationsOptionsAccordion>
                <div>
                    <StyledAccordion>
                        <Accordion.Trigger expandIcon={<KeyboardArrowDown />}>
                            <Typography variant="body1">
                                Authentication
                            </Typography>
                        </Accordion.Trigger>
                        <StyledBox>
                            <Search
                                InputProps={{
                                    startAdornment: <StyledSearchIcon />,
                                }}
                                size="small"
                                value={authSearch}
                                onChange={(e) => {
                                    setAuthSearch(e.target.value);
                                }}
                                placeholder="Search . . ."
                            />
                        </StyledBox>
                        {authentication.map((value, i) => {
                            return (
                                <StyledAccordionContent key={i}>
                                    <StyledListButton
                                        color="inherit"
                                        onClick={() => {
                                            setAccordionValue(value);
                                        }}
                                    >
                                        <StyledImage
                                            src={
                                                SOCIAL[value]?.image ||
                                                SOCIAL['native'].image
                                            }
                                        />
                                        {SOCIAL[value]?.name ||
                                            value[0].toUpperCase() +
                                                value.slice(1)}
                                    </StyledListButton>
                                </StyledAccordionContent>
                            );
                        })}
                    </StyledAccordion>
                </div>
                {accordionValue && (
                    <SocialProperty
                        key={authentication.indexOf(accordionValue)}
                        fieldName={accordionValue}
                        fields={socialProps[accordionValue]}
                        onChange={changeSocialProps}
                    ></SocialProperty>
                )}
            </StyledConfigurationsOptionsAccordion>
        ) : (
            <div> No socials props</div>
        );
    };

    const fileContentsPage = () => {
        const defaultTyping = ``;
        return (
            <StyledPropContainer>
                <StyledTitle>
                    <Typography variant="h5">social.properties</Typography>

                    <StyledActionButtonsDiv>
                        <StyledButton variant="outlined">Reset</StyledButton>
                        <StyledButton variant="contained">Save</StyledButton>
                    </StyledActionButtonsDiv>
                </StyledTitle>
                <StyledDivider />
                <Editor
                    height="60vh"
                    defaultLanguage="javascript"
                    defaultValue={defaultTyping}
                />
            </StyledPropContainer>
        );
    };

    const customTogglePanel = (
        children: React.ReactNode,
        index: number,
        value: number,
    ) => {
        return (
            <div hidden={value !== index}>
                {value === index && <div>{children}</div>}
            </div>
        );
    };

    return (
        <>
            <Box>
                <StyledToggleTabsGroup value={tabValue} onChange={onTabChange}>
                    <ToggleTabsGroup.Item label="Settings" />
                    <ToggleTabsGroup.Item disabled label="File Contents" />
                </StyledToggleTabsGroup>
                {customTogglePanel(settingsPage(), 0, tabValue)}
                {customTogglePanel(fileContentsPage(), 1, tabValue)}
            </Box>
        </>
    );
};

const mapDefaultValues = (vals) => {
    const value: unknown = {};

    vals.map((f: FieldProps) => {
        if (!value[f.label]) {
            value[f.label] = f.value;
        }
    });

    return value;
};
interface FieldProps {
    label: string;
    value: string;
}

// interface PropertyProps {
//     fieldName: string;
//     fields: FieldProps[];
//     onChange: (string, FieldProps) => void;
// }

const SocialProperty = (props) => {
    const { fieldName, fields, onChange } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // used for reset
    const [defaultValues, setDefaultValues] = useState<FieldProps[]>();

    const { handleSubmit, reset } = useForm({
        defaultValues: mapDefaultValues(fields),
    });

    /**
     * @name onSubmit
     * @desc changes properties based on updates to social props
     * @param data - form data
     */
    const onSubmit = handleSubmit((data) => {
        monolithStore.modifyLoginProperties(fieldName, data).then(() => {
            notification.add({
                color: 'success',
                message: `Succesfully modified ${fieldName} properties`,
            });

            const valueCopy = [];
            // structure values to pass to parent and defaultValues
            Object.entries(data).map((k) => {
                const objCopy = {
                    label: k[0],
                    value: k[1],
                };
                valueCopy.push(objCopy);
            });

            // pass to the parent that holds state of all properties
            onChange(fieldName, valueCopy);

            // set new default values for reset
            setDefaultValues(valueCopy);
        });
    });

    return (
        <StyledForm>
            <StyledTitle>
                <Typography variant="h5">
                    {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                </Typography>

                <StyledActionButtonsDiv>
                    <StyledButton
                        variant="outlined"
                        onClick={() => {
                            if (!defaultValues) {
                                reset();
                            } else {
                                reset(mapDefaultValues(defaultValues));
                            }
                        }}
                    >
                        Reset
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        onClick={() => onSubmit()}
                    >
                        Save
                    </StyledButton>
                </StyledActionButtonsDiv>
            </StyledTitle>

            {fields.map((f, i) => {
                return (
                    <StyledPropContainer key={i}>
                        <StyledKeyValue>
                            <StyledTextField
                                label="key"
                                defaultValue={f.label}
                                variant="outlined"
                                fullWidth
                            />
                            <TextField
                                label="value"
                                defaultValue={f.value}
                                fullWidth
                            />
                        </StyledKeyValue>
                        <TextField placeholder="Description"></TextField>
                    </StyledPropContainer>
                );
            })}
        </StyledForm>
    );
};

{
    /* <Table>
<Table.Head>
    <Table.Row>
        <Table.Cell colSpan={1}>Property</Table.Cell>
        <Table.Cell colSpan={1}>
            {fieldName.charAt(0).toUpperCase() +
                fieldName.slice(1)}{' '}
            Value
        </Table.Cell>
    </Table.Row>
</Table.Head>
<Table.Body>
    {fields.map((f, i) => {
        return (
            <Table.Row key={i}>
                <Table.Cell colSpan={1}>{f.label}</Table.Cell>
                <Table.Cell colSpan={1}>
                    <Field
                        name={f.label}
                        control={control}
                        rules={{ required: true }}
                        options={{
                            component: 'input',
                        }}
                        error="All properties must be provided with a value"
                        description=""
                    ></Field>
                </Table.Cell>
            </Table.Row>
        );
    })}
</Table.Body>
</Table> */
}
