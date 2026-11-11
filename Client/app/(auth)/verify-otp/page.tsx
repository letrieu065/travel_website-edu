'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

// (Đã thêm)
const emptySubscribe = () => () => {};

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'otp' | 'reset'>('otp');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const email = useSyncExternalStore(
        emptySubscribe,
        () => sessionStorage.getItem('resetEmail') || '',
        () => ''
    );

    useEffect(() => {
        const savedEmail = sessionStorage.getItem('resetEmail');
        const tempToken = localStorage.getItem('tempToken');
        if (!savedEmail || !tempToken) {
            router.push('/forgot-password');
        }
    }, [router]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        const tempToken = localStorage.getItem('tempToken');
        const currentEmail = email || sessionStorage.getItem('resetEmail') || '';

        if (!tempToken || !currentEmail) {
            alert('Phiên làm việc không hợp lệ hoặc thiếu email. Vui lòng thực hiện lại từ đầu.');
            router.push('/forgot-password');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: currentEmail,
                    otp,
                    tempToken,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Xác thực OTP thành công! Vui lòng nhập mật khẩu mới.');
                setStep('reset');
            } else {
                alert(data.message || 'Xác thực thất bại!');
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Không thể kết nối đến Server. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    // (Đã thêm)
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (newPassword.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        const tempToken = localStorage.getItem('tempToken');
        const currentEmail = email || sessionStorage.getItem('resetEmail') || '';
        if (!tempToken || !currentEmail) {
            alert('Phiên làm việc đã hết hạn. Vui lòng thực hiện lại từ đầu.');
            router.push('/forgot-password');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentEmail,
                    tempToken,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
                localStorage.removeItem('tempToken');
                sessionStorage.removeItem('resetEmail');
                router.push('/login');
            } else {
                alert(data.message || 'Không thể đặt lại mật khẩu!');
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
                <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="flex items-center text-sm font-bold text-gray-900 tracking-wider mb-8 hover:text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    BACK
                </button>

                <div className="pl-2">
                    <div className="mb-8">
                        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] mb-2 uppercase">
                            Security
                        </p>
                        <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight mb-4">
                            {step === 'otp' ? 'VERIFY OTP' : 'NEW PASSWORD'}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {step === 'otp' ? (
                                <>
                                    Enter the verification code we just sent to <br />
                                    <span className="font-medium text-gray-700">{email || 'your email'}</span>.
                                </>
                            ) : (
                                'Please create a new password for your account.'
                            )}
                        </p>
                    </div>

                    {step === 'otp' ? (
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
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 tracking-[0.15em] mb-4 uppercase">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    minLength={6}
                                    required
                                    className="w-full pb-3 border-b-2 border-gray-100 text-gray-900 text-lg placeholder-gray-300 focus:outline-none focus:border-[#111827] transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 tracking-[0.15em] mb-4 uppercase">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    minLength={6}
                                    required
                                    className="w-full pb-3 border-b-2 border-gray-100 text-gray-900 text-lg placeholder-gray-300 focus:outline-none focus:border-[#111827] transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#111827] text-white font-bold tracking-widest text-sm py-4 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 uppercase"
                            >
                                {isLoading ? 'Updating...' : 'Save Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerifyOtp;
