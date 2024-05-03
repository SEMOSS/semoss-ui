import { Card, Chip, Stack, Typography, styled } from '@semoss/ui';

import { MoreVert } from '@mui/icons-material';

import { Env } from '@/env';
import { useMemo } from 'react';

const colors = [
    'rgba(111, 212, 203, 1)',
    'rgba(195, 165, 240, 1)',
    'rgba(255, 192, 217, 1)',
    'rgba(186, 222, 255, 1)',
    'rgba(79, 36, 155, 1)',
    'rgba(161, 211, 150, 1)',
    'rgba(255, 204, 128, 1)',
    'rgba(128, 222, 234, 1)',
    'rgba(255, 229, 127, 1)',
    'rgba(207, 216, 220, 1)',
];

const StyledTileCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'color',
})<{ bordercolor?: string }>(({ bordercolor = 'rgba(0, 0, 0, 0.6)' }) => ({
    '&:hover': {
        cursor: 'pointer',
    },
    padding: '8px',
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px',
    borderLeft: `solid 10px ${bordercolor}`,
    minWidth: '298px',
    maxWidth: '298px',
    maxHeight: '200px',
}));

const StyledCardDescription = styled(Typography)({
    display: 'block',
    minHeight: '40px',
    maxHeight: '40px',
    maxWidth: '256px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: '20.02px',
    letter: '0.17px',
});

const StyledTitle = styled(Typography)({
    display: 'block',
    minHeight: '24px',
    maxHeight: '24px',
    maxWidth: '350px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '16px',
    lineHeight: '24px',
    letter: '0.15px',
});

const StyledActionContainer = styled(Card.Actions)({
    display: 'flex',
    justifyContent: 'flex-end',
    paddingBottom: '2px',
});

const StyledTagChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ maxWidth = '200px' }) => ({
    maxWidth: maxWidth,
    textOverflow: 'ellipsis',
    backgroundColor: '#fff',
}));

const StyledChipContainer = styled('div')({
    paddingTop: '8px',
});

/**
 * @name formatDBName
 * @param str
 * @returns formatted db name
 */
const formatDBName = (str: string) => {
    let i;
    const frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
};

interface TeamCardProps {
    /** ID of team */
    id: string;

    /** Description of the team */
    description: string;

    /** Type of the team */
    type: string;

    /** Tag of the team */
    tag?: string[] | string;

    onClick?: (value: string) => void;
}

export const TeamTileCard = (props: TeamCardProps) => {
    const { id, description, tag, onClick } = props;

    const randomColor = useMemo(() => {
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    return (
        <StyledTileCard onClick={() => onClick(id)} bordercolor={randomColor}>
            {/* Use Card.Media instead, uses img tag */}
            <Card.Header
                title={
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '8px',
                        }}
                    >
                        <StyledTitle variant={'body1'}>{id}</StyledTitle>
                    </div>
                }
                action={''}
            />
            <Card.Content>
                <StyledCardDescription variant={'body2'}>
                    {description
                        ? description.replace(/['"]+/g, '')
                        : 'No description available'}
                </StyledCardDescription>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    minHeight="32px"
                >
                    <StyledChipContainer>
                        {tag !== undefined &&
                            (Array.isArray(tag) ? (
                                <>
                                    {tag.map((t, i) => {
                                        if (i <= 3) {
                                            return (
                                                <StyledTagChip
                                                    maxWidth={
                                                        tag.length === 2
                                                            ? '100px'
                                                            : tag.length === 1
                                                            ? '200px'
                                                            : '75px'
                                                    }
                                                    key={`${id}${i}`}
                                                    label={t}
                                                    variant="outlined"
                                                />
                                            );
                                        }
                                    })}
                                </>
                            ) : (
                                <StyledTagChip
                                    key={`${id}0`}
                                    label={tag}
                                    variant="outlined"
                                />
                            ))}
                    </StyledChipContainer>
                </Stack>
            </Card.Content>
            <StyledActionContainer>
                <MoreVert />
            </StyledActionContainer>
        </StyledTileCard>
    );
};
