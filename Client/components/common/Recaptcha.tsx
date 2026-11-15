'use client';

import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const RecaptchaV2: React.FC = () => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const handleCaptchaChange = (token: string | null) => {
    setIsCaptchaVerified(!!token);
  };

  const handleSubmit = () => {
    if (isCaptchaVerified) {
      alert('CAPTCHA verified, form submitted!');
    } else {
      alert('Please verify the CAPTCHA before submitting.');
    }
  };

  return (
    <div>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY ?? ''}
        onChange={handleCaptchaChange}
      />
      <button type="button" onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default RecaptchaV2;