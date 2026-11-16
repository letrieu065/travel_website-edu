'use client';

/**
 * ============================================================================
 * MODULE REGISTER - NATURA TRAVEL (Trang Đăng Ký Tài Khoản Kèm Xác Thực OTP Gmail)
 * ============================================================================
 * Quy trình đăng ký 2 bước bảo mật:
 * - Bước 1: Người dùng nhập Họ tên, Email, Mật khẩu -> Hệ thống gửi mã OTP 6 số đến Gmail.
 * - Bước 2: Người dùng nhập mã OTP được gửi qua Gmail -> Hệ thống xác thực và kích hoạt tài khoản.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, Mail, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

// (Đã thêm)
export default function RegisterPage() {
    const router = useRouter();

    // Form inputs state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Registration flow state: 'form' (bước 1) hoặc 'otp' (bước 2)
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [otp, setOtp] = useState('');
    const [tempToken, setTempToken] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Đếm ngược thời gian chờ gửi lại mã OTP (60s)
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // (Đã thêm)
    // Bước 1: Gửi thông tin và yêu cầu mã OTP qua Gmail
    const handleSendRegisterOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (password.length < 6) {
            setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự!');
            return;
        }

        setIsLoading(true);

        try {
            const fullName = `${firstName} ${lastName}`.trim();

            const response = await fetch(`${API_URL}/api/v1/auth/send-register-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: fullName,
                    email: email.trim().toLowerCase(),
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.tempToken) {
                setTempToken(data.tempToken);
                setStep('otp');
                setResendCooldown(60);
                setSuccessMessage('Mã xác thực đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.');
            } else {
                setErrorMessage(data.message || 'Không thể gửi mã xác thực. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API Đăng ký:', error);
            setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng!');
        } finally {
            setIsLoading(false);
        }
    };

    // (Đã thêm)
    // Bước 2: Xác thực mã OTP và hoàn tất đăng ký tài khoản
    const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!otp.trim() || otp.trim().length !== 6) {
            setErrorMessage('Vui lòng nhập đầy đủ mã xác thực 6 chữ số!');
            return;
        }

        if (!tempToken) {
            setErrorMessage('Phiên đăng ký đã hết hạn. Vui lòng quay lại nhập thông tin từ đầu.');
            setStep('form');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/verify-register-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                    tempToken: tempToken,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Chúc mừng bạn đã đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu hành trình cùng Natura Travel.');
                router.push('/login');
            } else {
                setErrorMessage(data.message || 'Mã xác thực không chính xác hoặc đã hết hạn!');
            }
        } catch (error) {
            console.error('Lỗi khi xác thực OTP:', error);
            setErrorMessage('Lỗi kết nối khi xác thực mã OTP. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    // (Đã thêm)
    // Gửi lại mã OTP tới Gmail
    const handleResendOtp = async () => {
        if (resendCooldown > 0 || isLoading) return;

        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const fullName = `${firstName} ${lastName}`.trim();

            const response = await fetch(`${API_URL}/api/v1/auth/send-register-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: fullName,
                    email: email.trim().toLowerCase(),
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.tempToken) {
                setTempToken(data.tempToken);
                setResendCooldown(60);
                setSuccessMessage('Mã xác thực mới đã được gửi lại vào email của bạn!');
            } else {
                setErrorMessage(data.message || 'Không thể gửi lại mã xác thực.');
            }
        } catch {
            setErrorMessage('Không thể kết nối đến máy chủ để gửi lại mã.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container min-h-screen flex flex-col md:flex-row bg-[#FDFBF7]">
            {/* Cột trái: Ảnh phong cách Lonely Planet */}
            <div className="auth-img-side hidden md:block md:w-1/2 relative min-h-screen bg-black">
                <Image
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop"
                    alt="Natura Scenery"
                    fill
                    sizes="50vw"
                    className="auth-img object-cover opacity-85"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute bottom-16 left-12 right-12 text-white">
                    <span className="text-xs font-black uppercase tracking-[0.3em] mb-3 block text-[#FACC15]">
                        Cảm hứng lữ hành · Get Inspired
                    </span>
                    <h3 className="text-4xl md:text-5xl font-black uppercase leading-tight italic font-serif text-white">
                        Hành trình vĩ đại <br />
                        bắt đầu từ đây.
                    </h3>
                    <p className="text-xs text-gray-300 mt-3 font-light max-w-md">
                        Đăng ký thành viên Natura Travel để mở khóa đặc quyền đặt tour sinh thái, combo tiết kiệm 15% và trợ lý du lịch AI thông minh.
                    </p>
                </div>
            </div>

            {/* Cột phải: Form Đăng Ký & Nhập Mã OTP */}
            <div className="auth-form-side w-full md:w-1/2 flex flex-col justify-center relative p-8 md:p-14 bg-white">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Về Trang Chủ
                </button>

                <div className="max-w-md w-full mx-auto mt-12 md:mt-0">
                    <div className="flex gap-8 mb-8 border-b border-gray-100 pb-2">
                        <Link
                            href="/login"
                            className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors pb-2"
                        >
                            Đăng Nhập
                        </Link>
                        <span className="text-xs font-black uppercase tracking-widest text-black border-b-2 border-black pb-2 cursor-pointer">
                            Đăng Ký
                        </span>
                    </div>

                    {/* Thông báo Lỗi / Thành công */}
                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* BƯỚC 1: Form điền thông tin tài khoản */}
                    {step === 'form' ? (
                        <>
                            <div className="mb-8">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                    Bước 1 / 2 · Thông Tin Thành Viên
                                </span>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900 font-serif">
                                    Tạo Tài Khoản Mới
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Nhập thông tin bên dưới. Hệ thống sẽ gửi mã xác thực tới Gmail của bạn.
                                </p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSendRegisterOtp}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                            Họ & Tên Đệm *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn"
                                            className="w-full px-3 py-2.5 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black transition-colors"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                            Tên *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Văn A"
                                            className="w-full px-3 py-2.5 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black transition-colors"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Địa Chỉ Gmail *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="name@gmail.com"
                                            className="w-full px-3 py-2.5 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black transition-colors"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
                                        Mã xác thực OTP sẽ được gửi về địa chỉ Gmail này.
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Mật Khẩu *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Tối thiểu 6 ký tự"
                                            minLength={6}
                                            className="w-full px-3 py-2.5 pr-10 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black transition-colors"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-black transition-colors"
                                            aria-label="Ẩn hiện mật khẩu"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-black text-[#FACC15] hover:bg-gray-800 font-black uppercase tracking-widest text-xs py-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
                                            Đang Gửi Mã Xác Thực...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" /> Tiếp Tục & Nhận Mã OTP
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* BƯỚC 2: Form nhập mã OTP từ Gmail */
                        <>
                            <div className="mb-8">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                    Bước 2 / 2 · Xác Thực Hộp Thư
                                </span>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900 font-serif">
                                    Nhập Mã Xác Thực
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Chúng tôi đã gửi mã xác thực 6 chữ số đến địa chỉ:{' '}
                                    <strong className="text-gray-900">{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam).
                                </p>
                            </div>

                            <form className="space-y-6" onSubmit={handleVerifyRegisterOtp}>
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-2">
                                        Mã Xác Thực OTP (6 Chữ Số) *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="000000"
                                        required
                                        autoFocus
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-3xl font-mono font-black tracking-[0.5em] py-3.5 border-2 border-black bg-yellow-50/20 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1.5 block text-center">
                                        Mã có hiệu lực trong vòng 10 phút
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="w-full bg-black text-[#FACC15] hover:bg-gray-800 font-black uppercase tracking-widest text-xs py-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
                                            Đang Xác Thực...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" /> Kích Hoạt & Hoàn Tất Đăng Ký
                                        </>
                                    )}
                                </button>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('form');
                                            setErrorMessage('');
                                            setSuccessMessage('');
                                        }}
                                        className="text-gray-500 hover:text-black font-bold uppercase tracking-wider text-[11px]"
                                    >
                                        ← Đổi lại Email / Mật khẩu
                                    </button>

                                    <button
                                        type="button"
                                        disabled={resendCooldown > 0 || isLoading}
                                        onClick={handleResendOtp}
                                        className="text-black hover:underline font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 disabled:text-gray-400 disabled:no-underline"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                        {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
                        Bằng việc đăng ký tài khoản, bạn đồng ý với{' '}
                        <Link href="/about-us" className="text-black font-bold underline">
                            Điều khoản dịch vụ
                        </Link>{' '}
                        của Natura Travel.
                    </div>
                </div>
            </div>
        </div>
    );
}
