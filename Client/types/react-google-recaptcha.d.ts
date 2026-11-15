declare module 'react-google-recaptcha' {
  import * as React from 'react';

  export interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onErrored?: () => void;
    theme?: 'light' | 'dark';
    type?: 'image' | 'audio';
    size?: 'compact' | 'normal' | 'invisible';
    tabindex?: number;
    stoken?: string;
    hl?: string;
    badge?: 'bottomright' | 'bottomleft' | 'inline';
    isolated?: boolean;
    grecaptcha?: Record<string, unknown>;
    className?: string;
    id?: string;
  }

  export default class ReCAPTCHA extends React.Component<ReCAPTCHAProps> {
    reset(): void;
    forceReset(): void;
    execute(): void;
    executeAsync(): Promise<string | null>;
    getValue(): string | null;
    getWidgetId(): number | null;
  }
}

