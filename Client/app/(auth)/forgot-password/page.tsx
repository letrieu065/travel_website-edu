'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/forget`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.tempToken) {
                    localStorage.setItem('tempToken', data.tempToken);
                }

                alert('Mã OTP đã được gửi về email của bạn! Vui lòng kiểm tra hộp thư.');
                sessionStorage.setItem('resetEmail', email);
                router.push('/verify-otp');
            } else {
                alert(data.message || 'Không thể gửi yêu cầu!');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            alert('Không thể kết nối đến Server. Vui lòng thử lại sau!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container justify-center items-center">
            <div className="auth-form-side w-full md:max-w-2xl items-center border border-gray-100 rounded-xl shadow-sm">
                <button type="button" onClick={() => router.push('/login')} className="auth-back-btn">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>

                <div className="max-w-sm w-full mt-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">
                        Security
                    </span>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Reset Password</h2>
                    <p className="text-gray-500 text-sm mb-10">
                        Enter your email and we&apos;ll send you a verification code.
                    </p>

                    <form className="space-y-8" onSubmit={handleForgotPassword}>
                        <div className="auth-input-group">
                            <label className="auth-input-label">Your Email</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="auth-input-field"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="auth-primary-btn">
                            {isLoading ? 'Sending...' : 'Send OTP Code'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
