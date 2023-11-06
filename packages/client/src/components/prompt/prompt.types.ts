export interface ConstraintSettings {
    restrictInput: boolean;
    filterHateSpeech: boolean;
    limitResponseWords: boolean;
    limitResponseCharacters: boolean;
    setTone: boolean;
    bulletpoints: boolean;
}
export interface Token {
    index: number; // easy access to the order of the token
    key: string; // token without punctuation
    display: string; // preserves context punctuation for display
    type: string; // can be text or input
    isHiddenPhraseInputToken: boolean; // additional words in phrase input, keep record but don't display
}
export interface BuilderStepItem {
    step: number;
    value: string | Token[] | ConstraintSettings | object | undefined;
    required: boolean;
    display: string;
}
export interface Builder {
    context: BuilderStepItem;
    inputs: BuilderStepItem;
    inputTypes: BuilderStepItem;
    constraints: BuilderStepItem;
}