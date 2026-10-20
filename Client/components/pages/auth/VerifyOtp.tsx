import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VerifyOtp: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy email từ state truyền sang từ trang Quên mật khẩu
    const email = location.state?.email;

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Lấy tempToken đã lưu từ localStorage
        const tempToken = localStorage.getItem('tempToken');

        // 2. Kiểm tra xem có đủ dữ liệu không
        if (!tempToken || !email) {
            alert('Phiên làm việc không hợp lệ hoặc thiếu email. Vui lòng thực hiện lại từ đầu.');
            navigate('/forgot-password');
            return;
        }

        setIsLoading(true);

        try {
            // 3. Gọi API với email, otp và tempToken trong body
            const response = await fetch('http://localhost:3600/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp,
                    tempToken
                }),
            });

            const data = await response.json();

            // 4. Xử lý kết quả trả về
            if (response.ok) {
                alert('Xác thực OTP thành công!');

                // Tùy chọn: Xóa tempToken nếu bước tiếp theo (Đổi mật khẩu) không cần dùng đến nữa, 
                // hoặc giữ lại và truyền sang trang đặt lại mật khẩu để API đổi mật khẩu biết bạn đã xác thực.
                // localStorage.removeItem('tempToken'); 

                // Chuyển hướng sang trang đặt lại mật khẩu mới, truyền theo email và token (nếu cần)
                navigate('/reset-password-final', { state: { email, tempToken } });
            } else {
                // Hiển thị thông báo lỗi từ backend (ví dụ: "Mã OTP đã hết hạn", "Mã OTP không chính xác")
                alert(data.message || 'Xác thực thất bại!');
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Không thể kết nối đến Server. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4 font-sans">
            <div className="bg-white w-full max-w-lg p-10 rounded-xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm font-bold text-gray-900 tracking-wider mb-12 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    BACK TO PREVIOUS
                </button>

                <div className="pl-2">
                    {/* Headers */}
                    <div className="mb-8">
                        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] mb-2 uppercase">
                            Security
                        </p>
                        <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight mb-4">
                            VERIFY OTP
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Enter the verification code we just sent to <br />
                            <span className="font-medium text-gray-700">{email || 'your email'}</span>.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleVerifyOtp} className="space-y-10">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 tracking-[0.15em] mb-4 uppercase">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                required
                                className="w-full pb-3 border-b-2 border-gray-100 text-gray-900 text-lg placeholder-gray-300 focus:outline-none focus:border-[#111827] transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#111827] text-white font-bold tracking-widest text-sm py-4 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 uppercase"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;