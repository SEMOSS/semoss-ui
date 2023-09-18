import { useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Card,
    Chip,
    Typography,
    styled,
    Stack,
    Avatar,
    IconButton,
    Link,
} from '@semoss/ui';

import { App } from './app.types';
import { BookmarkBorderOutlined, OpenInNewOutlined } from '@mui/icons-material';

const StyledCard = styled(Card)(() => ({
    borderRadius: '12px',
}));

const StyledContent = styled(Card.Content)(({ theme }) => ({
    // ...theme.typography.body1,
    // color: theme.palette.text.primary,
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    paddingLeft: theme.spacing(1.5),
}));

const StyledActions = styled(Card.Actions)(({ theme }) => ({
    alignItems: 'end',
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(1.5),
    paddingLeft: theme.spacing(1.5),
}));

const StyledBackdrop = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: '12px',
}));

const StyledChip = styled(Chip)(({ theme }) => ({
    background: theme.palette.background.paper,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    background: theme.palette.background.paper,
    height: '32px',
    width: '32px',
    color: theme.palette.text.secondary,
}));

const StyledName = styled(Typography)(() => ({
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledDescription = styled(Typography)(() => ({
    height: '40px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
}));

const StyledActionButton = styled(IconButton)(({ theme }) => ({
    background: theme.palette.text.primary,
    color: theme.palette.primary.contrastText,
    '&:hover': {
        background: theme.palette.text.secondary,
    },
}));

interface AppTileCardProps {
    /**
     * App
     */
    app: App;

    /**
     * Background
     */
    background?: string;

    /**
     * Action that is triggered when clicked
     * aop - current selected app
     */
    onAction?: (app: App) => void;

    /**
     * Link to navigate to
     */
    href: string;
}

export const AppTileCard = (props: AppTileCardProps) => {
    const { app, background = '#DAC9F5', onAction = () => null, href } = props;

    // pretty format the data
    const createdDate = useMemo(() => {
        const d = dayjs(app.project_date_created);
        if (!d.isValid()) {
            return '';
        }

        return d.format('MMMM D, YYYY');
    }, [app.project_date_created]);

    return (
        <StyledCard>
            <Link
                href={href}
                rel="noopener noreferrer"
                color="inherit"
                underline="none"
            >
                <Card.ActionsArea>
                    <StyledContent>
                        <StyledBackdrop sx={{ backgroundColor: background }}>
                            <Stack
                                direction={'row'}
                                alignItems={'center'}
                                justifyContent={'space-between'}
                                spacing={1}
                            >
                                {/* <StyledChip size={'small'} label={'LLaMa'}></StyledChip> */}
                                <StyledName variant={'h6'}>
                                    {app.project_name}
                                </StyledName>
                                <StyledAvatar variant={'circular'}>
                                    <BookmarkBorderOutlined />
                                </StyledAvatar>
                            </Stack>

                            <StyledDescription variant={'body2'}>
                                {app.description || ''}
                            </StyledDescription>
                            <Stack
                                direction={'row'}
                                spacing={1.25}
                                flexWrap={'nowrap'}
                                overflow={'auto'}
                                height={'32px'}
                            >
                                {app.tag ? (
                                    typeof app.tag === 'string' ? (
                                        <Chip
                                            variant={'outlined'}
                                            label={app.tag}
                                        />
                                    ) : (
                                        app.tag.map((t, idx) => {
                                            return (
                                                <Chip
                                                    key={idx}
                                                    variant={'outlined'}
                                                    label={t}
                                                />
                                            );
                                        })
                                    )
                                ) : (
                                    <>&nbsp;</>
                                )}
                            </Stack>
                        </StyledBackdrop>
                    </StyledContent>
                </Card.ActionsArea>
            </Link>
            <StyledActions>
                <Stack flexDirection={'column'} flex={1} spacing={0.5}>
                    <Typography variant={'caption'} fontWeight="bold">
                        {app.project_created_by || <>N/A</>}
                    </Typography>
                    <Typography variant={'caption'}>{createdDate}</Typography>
                </Stack>
                <Link
                    href={href}
                    rel="noopener noreferrer"
                    target="_blank"
                    color="inherit"
                    underline="none"
                >
                    <StyledActionButton
                        size={'small'}
                        onClick={() => onAction(app)}
                    >
                        <OpenInNewOutlined />
                    </StyledActionButton>
                </Link>
            </StyledActions>
        </StyledCard>
    );
};
