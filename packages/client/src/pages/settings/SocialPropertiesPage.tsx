import React, {
    useEffect,
    useState,
    useReducer,
    useRef,
    SyntheticEvent,
} from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import { useAPI, useRootStore, useSettings } from '@/hooks';
import { EditRounded, GridOff } from '@mui/icons-material';
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
    Grid,
    Card,
    useNotification,
} from '@semoss/ui';
import Editor from '@monaco-editor/react';
import google from '../../assets/img/google.png';
import ms from '../../assets/img/ms.png';
import dropbox from '../../assets/img/dropbox.png';
import github from '../../assets/img/github.png';
import other from '../../assets/img/other.png';

import { useNavigate } from 'react-router-dom';

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
    const { fieldName, fields: defaultFields, onChange } = props;
    const [editMode, setEditMode] = useState<boolean>(false);
    const [newKey, setNewKey] = useState<[]>([]);
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // used for reset
    const [defaultValues, setDefaultValues] = useState<FieldProps[]>();

    const { handleSubmit, reset, control, register, getValues } = useForm({
        defaultValues: {
            properties: defaultFields,
        },
    });

    const { fields, append, prepend, remove, swap, move, insert } =
        useFieldArray({
            name: 'properties',
            control,
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
                    message: `Succesfully modified ${fieldName} properties`,
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
                    {editMode ? (
                        <>
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
                                onClick={() => {
                                    setEditMode(false);
                                    onSubmit();
                                }}
                            >
                                Save
                            </StyledButton>
                        </>
                    ) : (
                        <>
                            <StyledButton
                                variant="outlined"
                                onClick={() => setEditMode(true)}
                                color="inherit"
                                endIcon={<EditRounded />}
                                sx={{ borderColor: 'rgba(217, 217, 217, 0.5)' }}
                            >
                                Key Value Edit
                            </StyledButton>
                        </>
                    )}
                </StyledActionButtonsDiv>
            </StyledTitle>

            {!editMode ? (
                <Grid container spacing={1}>
                    {console.log('this is fields', fields)}
                    {fields.map((f, i) => {
                        return (
                            <Grid item xs={12} key={i}>
                                <Card>
                                    <StyledKeyValue>
                                        <Card.Header title={f.label} />
                                        <Card.Content
                                            sx={{
                                                padding: '0px',
                                                marginTop: '20px',
                                                marginBottom: '0px',
                                            }}
                                        >
                                            {f.value}
                                        </Card.Content>
                                    </StyledKeyValue>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Grid container spacing={1}>
                    {fields.map((f, i) => {
                        return (
                            <Grid item xs={12} key={i}>
                                <Card>
                                    <Card.Content sx={{ paddingTop: '16px' }}>
                                        <StyledKeyValue>
                                            <input
                                                placeholder="label"
                                                {...register(
                                                    `properties[${i}].label`,
                                                    { required: true },
                                                )}
                                            />
                                            <input type="text" />
                                        </StyledKeyValue>
                                    </Card.Content>
                                </Card>
                            </Grid>
                        );
                    })}
                    <Grid item xs={12}>
                        <Card>
                            <Card.Content sx={{ paddingTop: '16px' }}>
                                <TextField
                                    label="key"
                                    value={''}
                                    onChange={(e) =>
                                        field.onChange(e.target.value)
                                    }
                                    variant="outlined"
                                    sx={{ marginRight: '12px' }}
                                    fullWidth
                                />
                                <StyledKeyValue>
                                    <Controller
                                        name=""
                                        control={control}
                                        rules={{}}
                                        render={({ field }) => {
                                            return (
                                                <>
                                                    <TextField
                                                        label="value"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) => {
                                                            field.onChange(
                                                                e.target.value,
                                                            );
                                                        }}
                                                        fullWidth
                                                    />
                                                </>
                                            );
                                        }}
                                    />
                                </StyledKeyValue>
                            </Card.Content>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </StyledForm>
    );
};
