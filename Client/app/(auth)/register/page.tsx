'use client';

import React, { useState } from 'react';
// 1. Đổi thư viện import
import Link from 'next/link'; 
import { useRouter } from 'next/navigation'; 
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 2. Bắt buộc dùng export default cho file page.tsx
export default function RegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 3. Sử dụng useRouter của Next.js
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const fullName = `${firstName} ${lastName}`.trim();

            // 4. Sửa dấu nháy đơn thành Backtick ` `
            const response = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: fullName,
                    email: email,
                    password: password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Tạo tài khoản thành công! Vui lòng đăng nhập để bắt đầu.');
                // 5. Hàm điều hướng của Next.js là push, không phải chuyển thẳng string như useNavigate
                router.push('/login'); 
            } else {
                alert(data.message || 'Đăng ký thất bại!');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API Đăng ký:', error);
            alert('Không thể kết nối đến Server. Vui lòng thử lại sau!');
        }
    };

    return (
        <div className="auth-container">
            {/* Ảnh bên trái */}
            <div className="auth-img-side">
                <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop" alt="Scenery" className="auth-img" />
                <div className="absolute bottom-12 left-12 text-white">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] mb-4 block drop-shadow-md">Inspiration</span>
                    <h3 className="text-5xl font-black uppercase leading-none mb-4 italic font-serif drop-shadow-lg">Lets begin your <br />dream.</h3>
                </div>
            </div>

            <div className="auth-form-side">
                <button onClick={() => router.push('/')} className="auth-back-btn">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>

                <div className="max-w-sm w-full mx-auto">
                    <div className="auth-toggle-nav">
                        {/* 6. Đổi 'to' thành 'href' */}
                        <Link href="/login" className="toggle-link">Sign In</Link>
                        <button className="toggle-link toggle-link-active">Register</button>
                    </div>

                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-10">Create Account</h2>

                    <form className="space-y-6" onSubmit={handleRegister}>
                        {/* ... Giữ nguyên toàn bộ form UI bên trong của em ... */}
                        <div className="flex gap-4">
                            <div className="auth-input-group flex-1">
                                <label className="auth-input-label">First Name</label>
                                <input
                                    type="text"
                                    placeholder="John"
                                    className="auth-input-field"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="auth-input-group flex-1">
                                <label className="auth-input-label">Last Name</label>
                                <input
                                    type="text"
                                    placeholder="Doe"
                                    className="auth-input-field"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="auth-input-field"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    className="auth-input-field pr-10"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-3 text-gray-400">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-primary-btn mt-6">Join Natura Travel</button>
                    </form>
                </div>
            </div>
        </div>
    );
}