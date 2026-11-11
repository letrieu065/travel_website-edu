'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

// (Đã thêm)
const emptySubscribe = () => () => {};

const ResetPassword: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const email = useSyncExternalStore(
        emptySubscribe,
        () => sessionStorage.getItem('resetEmail') || '',
        () => ''
    );
    const tempToken = useSyncExternalStore(
        emptySubscribe,
        () => localStorage.getItem('tempToken') || '',
        () => ''
    );

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('resetEmail');
        const storedToken = localStorage.getItem('tempToken');
        if (!storedToken || !storedEmail) {
            router.push('/login');
        }
    }, [router]);

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

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
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
                    onClick={() => router.push('/login')}
                    className="flex items-center text-sm font-bold text-gray-900 tracking-wider mb-12 hover:text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    BACK TO LOGIN
                </button>

                <div className="pl-2">
                    <div className="mb-8">
                        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] mb-2 uppercase">
                            Security
                        </p>
                        <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight mb-4">
                            NEW PASSWORD
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Please create a new password for your account.
                        </p>
                    </div>

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
                            className="w-full bg-[#111827] text-white font-bold tracking-widest text-sm py-4 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 uppercase mt-4"
                        >
                            {isLoading ? 'Updating...' : 'Save Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
