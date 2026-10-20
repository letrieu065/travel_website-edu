import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginModule from 'react-facebook-login/dist/facebook-login-render-props';

const FacebookLogin = (FacebookLoginModule as any).default || FacebookLoginModule;
import './AuthForm.css';

export const LoginPage: React.FC = () => {
    // 1. Tạo state cho các trường nhập liệu
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const nextPath = new URLSearchParams(window.location.search).get('next');
    const postLoginPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';

    // 2. Tạo method xử lý submit form
    const loginCustomGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const accessToken = tokenResponse.access_token;

                const response = await fetch('http://localhost:3600/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: accessToken }),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Đăng nhập Google thành công:', data);
                    localStorage.setItem('token', data.accessToken);
                    navigate(postLoginPath);
                } else {
                    alert(data.message || 'Xác thực Google tại Server thất bại!');
                }
            } catch (error) {
                console.error('Lỗi khi gọi API Google:', error);
                alert('Không thể kết nối đến Server.');
            }
        },
        onError: () => {
            console.log('Đăng nhập Google thất bại (từ phía Client)');
        },
    });

    const handleFacebookResponse = async (fbResponse: any) => {
        if (!fbResponse.accessToken) return;

        try {
            const response = await fetch('http://localhost:3600/api/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: fbResponse.accessToken }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.accessToken);
                navigate(postLoginPath);
            } else alert(data.message || 'Xác thực Facebook thất bại!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3600/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Đăng nhập thành công:', data);

                localStorage.setItem('token', data.accessToken);

                navigate(postLoginPath);
            } else {
                alert(data.message || 'Đăng nhập thất bại!');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            alert('Không thể kết nối đến Server. Vui lòng thử lại sau!');
        }
    };

    return (
        /* Thêm Wrapper Container sử dụng flexbox của Tailwind để chia đôi màn hình */
        <div className="flex flex-col md:flex-row min-h-screen w-full">

            {/* Cột trái: Form (Chiếm 50% chiều rộng trên màn hình lớn) */}
            <div className="auth-form-side w-full md:w-1/2 flex flex-col justify-center relative anim-left bg-white p-8">
                <button onClick={() => navigate('/')} className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>

                <div className="max-w-sm w-full mx-auto text-center mt-12 md:mt-0">

                    {/* BỔ SUNG: Tab Sign In / Register giống hình 2 */}
                    <div className="flex justify-center gap-8 mb-10 border-b border-gray-100 pb-2">
                        <span className="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-2 text-black cursor-pointer">
                            Sign In
                        </span>
                        <Link to="/register" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors pb-2">
                            Register
                        </Link>
                    </div>

                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Welcome</h2>
                    <p className="text-gray-500 text-sm mb-10">Sign in to continue your journey.</p>

                    <form onSubmit={handleLogin} className="text-left">
                        <div className="mb-6">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="mb-6 relative">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent pr-10"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-3 text-gray-400 hover:text-black">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-8 block text-right">
                            Forgot Password?
                        </Link>

                        <button type="submit" className="w-full bg-[#0f141e] text-white font-bold uppercase tracking-widest text-xs py-4 rounded hover:bg-black transition-colors mb-6">
                            Sign In
                        </button>
                    </form>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => loginCustomGoogle()}
                            className="flex-1 border border-gray-200 py-3 text-xs font-bold hover:border-black transition-colors rounded"
                        >
                            Google
                        </button>

                        <FacebookLogin
                            appId="1765005624538226"
                            autoLoad={false}
                            fields="name,email"
                            callback={handleFacebookResponse}
                            render={(renderProps: any) => (
                                <button
                                    type="button"
                                    onClick={renderProps.onClick}
                                    className="flex-1 border border-gray-200 py-3 text-xs font-bold hover:border-black transition-colors rounded"
                                >
                                    Facebook
                                </button>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Cột phải: Hình ảnh (Ẩn trên mobile, chiếm 50% trên màn hình lớn) */}
            <div className="auth-img-side hidden md:block w-1/2 relative h-screen">
                <img
                    src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1000&auto=format&fit=crop"
                    alt="Nature"
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-12 left-12 right-12 text-white">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] mb-4 block drop-shadow-md">Inspiration</span>
                    <h3 className="text-5xl font-black uppercase leading-none mb-4 italic font-serif drop-shadow-lg">The world is <br />waiting.</h3>
                </div>
            </div>

        </div>
    );
};
