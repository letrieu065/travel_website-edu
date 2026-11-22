/**
 * ============================================================================
 * MODULE AUTH - SERVICE (Nghiệp vụ Xác thực, OAuth & Gửi Email OTP)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Xác thực OAuth 2.0 với Google và Facebook.
 * - Cấu hình Nodemailer gửi email OTP khôi phục mật khẩu và xác thực đăng ký tài khoản.
 * ============================================================================
 */
declare const loginWithGoogle: (accessToken: string, confirmPassword?: string) => Promise<{
    user: {
        id: string;
        email: string;
        password_hash: string | null;
        full_name: string;
        phone_number: string | null;
        avatar_url: string | null;
        auth_provider: string | null;
        role: string | null;
        created_at: Date | null;
        google_id: string | null;
        facebook_id: string | null;
    };
    token: string;
}>;
declare const loginWithFacebook: (fbAccessToken: string, confirmPassword?: string) => Promise<{
    user: {
        id: string;
        email: string;
        password_hash: string | null;
        full_name: string;
        phone_number: string | null;
        avatar_url: string | null;
        auth_provider: string | null;
        role: string | null;
        created_at: Date | null;
        google_id: string | null;
        facebook_id: string | null;
    };
    token: string;
}>;
declare const sendOtpEmail: (toEmail: string, otpCode: string) => Promise<void>;
declare const sendRegisterOtpEmail: (toEmail: string, otpCode: string) => Promise<void>;
declare const _default: {
    loginWithGoogle: typeof loginWithGoogle;
    loginWithFacebook: typeof loginWithFacebook;
    sendOtpEmail: typeof sendOtpEmail;
    sendRegisterOtpEmail: typeof sendRegisterOtpEmail;
};
export default _default;
