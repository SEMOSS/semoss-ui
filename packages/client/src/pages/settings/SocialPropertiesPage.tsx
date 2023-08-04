import React, {
    useEffect,
    useState,
    useReducer,
    useRef,
    SyntheticEvent,
} from 'react';
import { useForm } from 'react-hook-form';
import {
    Table,
    Form,
    useNotification,
    styled as styledOld,
    theme,
} from '@semoss/components';

import { useAPI, useRootStore } from '@/hooks';
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
} from '@semoss/ui';
import Editor from '@monaco-editor/react';
import google from '../../assets/img/google.png';
import ms from '../../assets/img/ms.png';
import dropbox from '../../assets/img/dropbox.png';
import github from '../../assets/img/github.png';
import other from '../../assets/img/other.png';

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

const StyledImage = styled('img')({
    objectFit: 'cover',
    maxHeight: '28px',
    maxWidth: '28px',
    verticalAlign: 'middle',
    padding: '4px',
});

const StyledContainer = styled('div')(({ theme }) => ({
    margin: '0 auto',
    paddingBottom: theme.spacing(8),
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
}));

const StyledAccordionContent = styled(Accordion.Content)(({ theme }) => ({
    height: 'auto',
    margin: theme.spacing(2),
}));

const StyledTitle = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledActionButtonsDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    gap: '.5rem',
}));

const StyledButton = styled(Button)({
    textTransform: 'none',
    fontWeight: 'bold',
});

const StyledForm = styled(Form)(({ theme }) => ({
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
    boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.03)',
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

export const SocialPropertiesPage = () => {
    // useStateChange doesn't play well with Accordion
    // const [socialProps, setSocialProps] = useState({});

    const [state, dispatch] = useReducer(reducer, initialState);
    const { socialProps } = state;

    const [accordionValue, setAccordionValue] = useState<string>();

    const [authentication, setAuthentication] = useState(
        Object.keys(socialProps),
    );
    const [authExpanded, setAuthExpanded] = useState(true);
    const [emailExpanded, setEmailExpanded] = useState(false);

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
            <div style={{ display: 'flex' }}>
                <div>
                    <Accordion
                        expanded={authExpanded}
                        onChange={() => setAuthExpanded(!authExpanded)}
                    >
                        <Accordion.Trigger
                            sx={{ padding: '8px', fontSize: '16px' }}
                        >
                            <strong>Authentication</strong>
                        </Accordion.Trigger>
                        <Search
                            value={authSearch}
                            onChange={(e) => {
                                setAuthSearch(e.target.value);
                            }}
                            placeholder="Search . . ."
                        />
                        {authentication.map((value, i) => {
                            return (
                                <Accordion.Content
                                    key={i}
                                    sx={{ fontSize: '14px' }}
                                >
                                    <Button
                                        sx={{ textTransform: 'none' }}
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
                                    </Button>
                                </Accordion.Content>
                            );
                        })}
                    </Accordion>
                    {/* <Accordion
                        expanded={emailExpanded}
                        onChange={() => setEmailExpanded(!emailExpanded)}
                    >
                        <Accordion.Trigger
                            sx={{ padding: '8px', fontSize: '16px' }}
                        >
                            <strong>Email</strong>
                        </Accordion.Trigger>

                        {authentication.map((value) => {
                            return (
                                <Accordion.Content sx={{ fontSize: '14px' }}>
                                    <StyledImage
                                        src={
                                            SOCIAL[value]?.image ||
                                            SOCIAL['native'].image
                                        }
                                    />
                                    {SOCIAL[value]?.name ||
                                        value[0].toUpperCase() + value.slice(1)}
                                </Accordion.Content>
                            );
                        })}
                    </Accordion> */}
                </div>
                {accordionValue && (
                    <SocialProperty
                        key={authentication.indexOf(accordionValue)}
                        fieldName={accordionValue}
                        fields={socialProps[accordionValue]}
                        onChange={changeSocialProps}
                    ></SocialProperty>
                )}
            </div>
        ) : (
            <div> No social props</div>
        );
    };

    const fileContentsPage = () => {
        const defaultTyping = `this is a line of code
        that will result
        in something happening
        once saved
        you can also use
        the reset button to clear this space
        and start over
        if you desire
        `;
        return (
            <StyledPropContainer>
                <StyledTitle>
                    <Typography variant="h5">social.properties</Typography>

                    <StyledActionButtonsDiv>
                        <StyledButton variant="outlined">Reset</StyledButton>
                        <StyledButton variant="contained">Save</StyledButton>
                    </StyledActionButtonsDiv>
                </StyledTitle>
                <Divider sx={{ marginBottom: '8px' }} />
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
            <StyledContainer>
                <Divider sx={{ marginBottom: '16px' }} />

                <ToggleTabsGroup
                    sx={{ marginBottom: '16px' }}
                    value={tabValue}
                    onChange={onTabChange}
                >
                    <ToggleTabsGroup.Item label="Settings" />
                    <ToggleTabsGroup.Item label="File Contents" />
                </ToggleTabsGroup>
                {customTogglePanel(settingsPage(), 0, tabValue)}
                {customTogglePanel(fileContentsPage(), 1, tabValue)}
            </StyledContainer>
        </>
    );
};

const mapDefaultValues = (vals) => {
    const value: any = {};

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

interface PropertyProps {
    fieldName: string;
    fields: FieldProps[];
    onChange: (string, FieldProps) => void;
}

const SocialProperty = (props) => {
    const { fieldName, fields, onChange } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // used for reset
    const [defaultValues, setDefaultValues] = useState<FieldProps[]>();

    const { control, handleSubmit, reset } = useForm({
        defaultValues: mapDefaultValues(fields),
    });

    /**
     * @name onSubmit
     * @desc changes properties based on updates to social props
     * @param data - form data
     */
    const onSubmit = handleSubmit((data) => {
        monolithStore
            .modifyLoginProperties(fieldName, data)
            .then((response) => {
                notification.add({
                    color: 'success',
                    content: `Succesfully modified ${fieldName} properties`,
                });

                const valueCopy = [];
                // structure values to pass to parent and defaultValues
                Object.entries(data).map((k, v) => {
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
                            <TextField
                                label="key"
                                defaultValue={f.label}
                                variant="outlined"
                                sx={{ marginRight: '12px' }}
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
