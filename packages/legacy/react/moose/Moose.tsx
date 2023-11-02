import React, { useState, useEffect, useRef } from 'react';
import { MooseContent } from './MooseContent';
import { Popover, ThemeProvider, styled } from '@semoss/ui';

const StyledButton = styled("button")(({ theme }) => ({
    transition: 'all .2s ease-in-out',
    backgroundColor: 'transparent',
    border: 'none',
    '&:hover': {
        transform: 'scale(1.1)',
        cursor: 'pointer',
    },
  }));

export const Moose = (props): JSX.Element => {
    const { options, value, insightID, semossCoreService } = props;
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    // TO-DO: Switch to Context Provider
    const [messages, setMessages] = useState([]); // Parent needs to hold messages state, for popover close
    const [updated, setUpdated] = useState(0); // Used to see updated accordion state
    const [selectedModel, setSelectedModel] = useState<
        'docqa' | 'text2sql' | 'fillform' | null
    >(null);

    const buttonRefs = useRef([]); // Keeps track of buttons that keep open preview pane

    useEffect(() => {
        console.warn(
            "When value switches on ref add message that says we've switched ",
        );
        if (value) {
            setSelectedModel(value);
        }
    }, [value]);

    const addButtonRef = (button) => {
        buttonRefs.current.push(button);
    };

    return (
        <>
            <ThemeProvider>
                <StyledButton
                    onClick={(event) => {
                        setAnchorEl(event.currentTarget);
                    }}
                >
                    <svg
                        width="45"
                        height="45"
                        viewBox="0 0 45 45"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g clipPath="url(#clip0_6321_57920)">
                            <mask
                                id="mask0_6321_57920"
                                style={{ maskType: 'alpha' }}
                                maskUnits="userSpaceOnUse"
                                x="0"
                                y="0"
                                width="45"
                                height="45"
                            >
                                <circle
                                    cx="22.5"
                                    cy="22.5"
                                    r="22.5"
                                    fill="url(#paint0_linear_6321_57920)"
                                />
                            </mask>
                            <g mask="url(#mask0_6321_57920)">
                                <circle
                                    cx="22.5"
                                    cy="22.5"
                                    r="22.5"
                                    fill="url(#paint1_linear_6321_57920)"
                                />
                                <ellipse
                                    cx="13.2361"
                                    cy="37.6084"
                                    rx="4.32723"
                                    ry="2.97497"
                                    transform="rotate(12.2285 13.2361 37.6084)"
                                    fill="white"
                                />
                                <ellipse
                                    cx="27.8131"
                                    cy="41.7239"
                                    rx="4.32723"
                                    ry="2.70452"
                                    transform="rotate(12.2285 27.8131 41.7239)"
                                    fill="white"
                                />
                                <path
                                    d="M16.0001 21.8803C11.4307 22.4792 5.03138 26.6367 12.2322 30.5988C19.433 34.5609 17.1052 25.7102 16.0001 21.8803Z"
                                    fill="white"
                                />
                                <path
                                    d="M30.4478 25.0115C34.3592 27.4484 38.4631 33.8824 30.268 34.5077C22.073 35.133 27.8562 28.0403 30.4478 25.0115Z"
                                    fill="white"
                                />
                                <path
                                    d="M33.2061 39.9528C32.0426 45.3213 27.7166 41.2705 20.1831 39.6377C12.6495 38.005 7.34965 39.2321 8.51315 33.8636C9.67665 28.4952 16.2523 21.3815 23.7858 23.0143C31.3194 24.647 34.3696 34.5843 33.2061 39.9528Z"
                                    fill="white"
                                />
                                <path
                                    d="M21.9216 30.9289C13.0754 24.2888 15.3099 21.6245 17.533 21.1224C21.4305 26.551 27.3434 25.1586 29.8127 23.7837C32.9883 25.5832 25.8751 29.297 21.9216 30.9289Z"
                                    fill="url(#paint2_linear_6321_57920)"
                                />
                                <ellipse
                                    cx="24.746"
                                    cy="15.5913"
                                    rx="8.85372"
                                    ry="7.61255"
                                    transform="rotate(12.2285 24.746 15.5913)"
                                    fill="white"
                                />
                                <ellipse
                                    cx="23.4773"
                                    cy="21.8356"
                                    rx="7.28157"
                                    ry="4.88196"
                                    transform="rotate(12.2285 23.4773 21.8356)"
                                    fill="white"
                                />
                                <path
                                    d="M24.4324 2.68987C21.8544 2.94291 17.5126 4.46968 20.769 8.55247C22.2027 8.51091 24.9424 7.2802 24.4324 2.68987Z"
                                    fill="white"
                                    stroke="white"
                                    strokeWidth="1.61512"
                                />
                                <path
                                    d="M31.7984 5.26331C33.521 7.19787 35.6756 11.2648 30.5135 12.0559C29.4883 11.0529 28.31 8.29021 31.7984 5.26331Z"
                                    fill="white"
                                    stroke="white"
                                    strokeWidth="1.61512"
                                />
                                <path
                                    d="M36.4246 11.0544C34.31 10.5961 31.8518 11.7238 30.887 12.3449C30.7855 15.3669 37.0718 17.006 40.3582 17.1648C43.6445 17.3236 45.2746 14.9096 46.6183 13.8172C47.962 12.7247 47.764 8.53084 47.6143 7.94493C47.4945 7.47619 45.626 7.32953 44.7068 7.3148C40.3059 7.19119 40.1823 11.5921 40.0104 12.385C39.8386 13.178 37.9311 13.0413 37.8386 12.1911C37.7646 11.5109 36.8651 11.1499 36.4246 11.0544Z"
                                    fill="white"
                                />
                                <path
                                    d="M16.7971 6.80061C18.9116 7.25889 20.6824 9.30306 21.3035 10.2679C20.1448 13.0608 13.7439 11.9502 10.6867 10.7342C7.62947 9.51815 7.14506 6.64586 6.37422 5.09515C5.60337 3.54443 7.51991 -0.191166 7.89879 -0.662513C8.2019 -1.03959 9.9634 -0.399541 10.8063 -0.032382C14.8635 1.67712 13.154 5.73431 12.9821 6.52726C12.8102 7.32021 14.6032 7.98552 15.0393 7.24985C15.3883 6.66132 16.3566 6.70514 16.7971 6.80061Z"
                                    fill="white"
                                />
                                <ellipse
                                    cx="21.616"
                                    cy="23.6035"
                                    rx="0.992941"
                                    ry="0.684035"
                                    transform="rotate(50.5186 21.616 23.6035)"
                                    fill="url(#paint3_linear_6321_57920)"
                                />
                                <ellipse
                                    rx="0.992941"
                                    ry="0.655396"
                                    transform="matrix(-0.898321 0.439339 0.439338 0.898322 24.6783 24.4596)"
                                    fill="url(#paint4_linear_6321_57920)"
                                />
                                <path
                                    d="M29.6104 17.4827C29.7337 18.7026 29.0481 19.8776 28.1865 20.1839C27.3249 20.4902 26.4575 19.8672 26.3342 18.6474C26.2108 17.4275 26.8964 16.2525 27.758 15.9462C28.6196 15.6399 29.487 16.2629 29.6104 17.4827Z"
                                    fill="white"
                                    stroke="url(#paint5_linear_6321_57920)"
                                    strokeWidth="0.57883"
                                />
                                <path
                                    d="M22.9157 15.9209C23.1967 17.0641 22.6477 18.243 21.7838 18.6063C20.9198 18.9696 19.9485 18.43 19.6675 17.2868C19.3865 16.1437 19.9355 14.9647 20.7995 14.6014C21.6634 14.2381 22.6348 14.7777 22.9157 15.9209Z"
                                    fill="white"
                                    stroke="url(#paint6_linear_6321_57920)"
                                    strokeWidth="0.57883"
                                />
                                <ellipse
                                    cx="27.6797"
                                    cy="18.8761"
                                    rx="1.35026"
                                    ry="1.35026"
                                    transform="rotate(10.3501 27.6797 18.8761)"
                                    fill="url(#paint7_linear_6321_57920)"
                                />
                                <ellipse
                                    cx="20.9921"
                                    cy="17.4223"
                                    rx="1.35026"
                                    ry="1.35026"
                                    transform="rotate(10.3501 20.9921 17.4223)"
                                    fill="url(#paint8_linear_6321_57920)"
                                />
                                <path
                                    d="M20.5522 19.1728C22.4956 18.5159 24.7912 18.1252 26.2779 19.8468C26.6119 20.2335 26.9614 20.7438 27.3471 21.0188"
                                    stroke="url(#paint9_linear_6321_57920)"
                                    strokeWidth="0.538374"
                                    strokeLinecap="round"
                                />
                            </g>
                        </g>
                        <defs>
                            <linearGradient
                                id="paint0_linear_6321_57920"
                                x1="38.6563"
                                y1="41.0025"
                                x2="1.95872"
                                y2="0.290726"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint1_linear_6321_57920"
                                x1="38.6563"
                                y1="41.0025"
                                x2="1.95872"
                                y2="0.290726"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint2_linear_6321_57920"
                                x1="27.065"
                                y1="31.257"
                                x2="23.7946"
                                y2="19.0719"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint3_linear_6321_57920"
                                x1="22.3289"
                                y1="24.166"
                                x2="21.3236"
                                y2="22.547"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint4_linear_6321_57920"
                                x1="1.70593"
                                y1="1.19435"
                                x2="0.761423"
                                y2="-0.393128"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint5_linear_6321_57920"
                                x1="29.5445"
                                y1="19.5565"
                                x2="25.4893"
                                y2="17.1487"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint6_linear_6321_57920"
                                x1="23.1109"
                                y1="17.9107"
                                x2="18.6794"
                                y2="15.7598"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint7_linear_6321_57920"
                                x1="28.6493"
                                y1="19.9865"
                                x2="26.447"
                                y2="17.5433"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint8_linear_6321_57920"
                                x1="21.9616"
                                y1="18.5327"
                                x2="19.7594"
                                y2="16.0895"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <linearGradient
                                id="paint9_linear_6321_57920"
                                x1="26.4088"
                                y1="20.668"
                                x2="26.4306"
                                y2="18.0629"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#975FE4" />
                                <stop offset="1" stopColor="#4394E4" />
                            </linearGradient>
                            <clipPath id="clip0_6321_57920">
                                <rect
                                    width="45"
                                    height="45"
                                    fill="white"
                                />
                            </clipPath>
                        </defs>
                    </svg>
                </StyledButton>
                <Popover
                    id={'moose-popover'}
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={() => {
                      setAnchorEl(null)
                    }}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                >
                    <MooseContent
                        options={options}
                        messages={messages}
                        setMessages={setMessages}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        setUpdated={setUpdated}
                        insightID={insightID}
                        semossCoreService={semossCoreService}
                        buttonRefs={buttonRefs}
                        addButtonRef={addButtonRef}
                    ></MooseContent>
                </Popover>
            </ThemeProvider>
        </>
    );
};
