'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Map, PlaneTakeoff, Building2, ArrowRight } from 'lucide-react';

export default function AboutUsPage() {
    const router = useRouter();

    return (
        <div className="page-wrapper bg-white">
            {/* 1. HERO SECTION */}
            <div className="mb-20 pt-8 animate-fade-up border-b-4 border-black pb-12">
                <h1 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-6">
                    Beyond <br /> Destinations.
                </h1>
                <p className="text-gray-600 max-w-3xl text-lg md:text-xl font-medium leading-relaxed">
                    Welcome to <strong className="text-black font-black uppercase">Natura Travel</strong>.
                    We don&apos;t just book trips; we design unforgettable journeys that connect you with the heartbeat of the world.
                </p>
            </div>

            {/* 2. MISSION & STORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24 animate-fade-up delay-100">
                <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">01 / The Mission</h3>
                    <h2 className="text-3xl font-black uppercase mb-4 text-black">Inspire & Empower</h2>
                    <p className="text-gray-600 leading-relaxed font-medium">
                        To inspire and empower modern travelers to explore the globe authentically and sustainably.
                        We strive to bridge the gap between you and the world&apos;s hidden wonders, ensuring every journey
                        is seamless, immersive, and deeply personal.
                    </p>
                </div>

                <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">02 / The Story</h3>
                    <h2 className="text-3xl font-black uppercase mb-4 text-black">A Boundless Curiosity</h2>
                    <p className="text-gray-600 leading-relaxed font-medium">
                        It started with a simple map and a boundless curiosity. Our founders realized the travel industry
                        had become too automated. We created NaturaTravel to bring the &quot;soul&quot; back into travel, combining
                        cutting-edge tech with human expertise.
                    </p>
                </div>
            </div>

            {/* 3. WHAT WE DO */}
            <div className="mb-24 animate-fade-up delay-[200ms]">
                <h2 className="text-5xl font-black text-black mb-12 uppercase tracking-tighter text-center">What We Do</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-gray-50 border border-gray-200 p-10 text-center hover:bg-black hover:text-white transition-colors group cursor-pointer">
                        <Map className="w-10 h-10 mx-auto mb-6 text-black group-hover:text-white transition-colors" />
                        <h4 className="text-xl font-black uppercase mb-3">Bespoke Tours</h4>
                        <p className="text-sm font-medium text-gray-500 group-hover:text-gray-300">Handpicked, meticulously crafted itineraries that take you off the beaten path.</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-10 text-center hover:bg-black hover:text-white transition-colors group cursor-pointer">
                        <PlaneTakeoff className="w-10 h-10 mx-auto mb-6 text-black group-hover:text-white transition-colors" />
                        <h4 className="text-xl font-black uppercase mb-3">Flight Booking</h4>
                        <p className="text-sm font-medium text-gray-500 group-hover:text-gray-300">A hassle-free reservation system to find you the best routes and comfort.</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-10 text-center hover:bg-black hover:text-white transition-colors group cursor-pointer">
                        <Building2 className="w-10 h-10 mx-auto mb-6 text-black group-hover:text-white transition-colors" />
                        <h4 className="text-xl font-black uppercase mb-3">Luxury Stays</h4>
                        <p className="text-sm font-medium text-gray-500 group-hover:text-gray-300">From five-star resorts to hidden eco-lodges, we partner with the finest.</p>
                    </div>
                </div>
            </div>

            {/* 4. CALL TO ACTION */}
            <div className="relative bg-[#FACC15] p-12 md:p-24 text-center animate-fade-up delay-[300ms]">
                <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter mb-6">Ready to write <br /> your next chapter?</h2>
                <p className="text-gray-900 font-medium mb-10 max-w-lg mx-auto">The world is vast, and your next great adventure awaits. Let us be your compass.</p>
                <button
                    onClick={() => router.push('/tours')}
                    className="mx-auto px-10 py-4 bg-black hover:bg-gray-800 text-white font-black uppercase tracking-[0.2em] text-xs transition-colors flex items-center gap-3 cursor-pointer"
                >
                    Start Planning <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}