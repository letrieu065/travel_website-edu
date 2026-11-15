'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plane,
    ArrowRight,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Clock,
    Armchair,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface PlaneInfo {
    id: string;
    model: string;
    airline: string;
    seat_capacity: number;
}

interface FlightItem {
    id: string;
    flight_number: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    ticket_price: number;
    available_seats: number;
    planes?: PlaneInfo | null;
}

interface FlightFilterState {
    departureAirport: string;
    arrivalAirport: string;
    departureDate: string;
    passengers: string;
    airline: string;
    maxPrice: string;
    sort: string;
}

const initialFlightFilters: FlightFilterState = {
    departureAirport: '',
    arrivalAirport: '',
    departureDate: '',
    passengers: '1',
    airline: '',
    maxPrice: '',
    sort: 'departure_asc',
};

// (Đã thêm)
const formatCurrency = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(val));
};

// (Đã thêm)
const formatTime = (isoString?: string | null): string => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return isNaN(date.getTime())
        ? '--:--'
        : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// (Đã thêm)
const formatDate = (isoString?: string | null): string => {
    if (!isoString) return 'Chưa cập nhật';
    const date = new Date(isoString);
    return isNaN(date.getTime())
        ? 'Chưa cập nhật'
        : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// (Đã thêm)
const calculateDuration = (startIso: string, endIso: string): string => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return '2h 00m';

    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
};

export default function FlightsPage() {
    const [flights, setFlights] = useState<FlightItem[]>([]);
    const [airports, setAirports] = useState<string[]>([]);
    const [airlines, setAirlines] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 8;
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [formFilters, setFormFilters] = useState<FlightFilterState>(initialFlightFilters);
    const [appliedFilters, setAppliedFilters] = useState<FlightFilterState>(initialFlightFilters);

    // Tải danh sách sân bay và hãng hàng không
    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchOptions = async () => {
            try {
                const [airportsRes, airlinesRes] = await Promise.all([
                    fetch(`${API_URL}/api/v1/flights/airports`),
                    fetch(`${API_URL}/api/v1/flights/airlines`),
                ]);

                if (!isCancelled) {
                    if (airportsRes.ok) {
                        const data = await airportsRes.json();
                        if (data.status === 'success' && Array.isArray(data.airports)) {
                            setAirports(data.airports);
                        }
                    }

                    if (airlinesRes.ok) {
                        const data = await airlinesRes.json();
                        if (data.status === 'success' && Array.isArray(data.airlines)) {
                            setAirlines(data.airlines);
                        }
                    }
                }
            } catch (err) {
                console.error('Lỗi khi tải danh sách sân bay/hãng bay:', err);
            }
        };

        executeFetchOptions();

        return () => {
            isCancelled = true;
        };
    }, []);

    // Tải danh sách chuyến bay
    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchFlights = async () => {
            try {
                const queryParams = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (appliedFilters.departureAirport) queryParams.set('departure_airport', appliedFilters.departureAirport);
                if (appliedFilters.arrivalAirport) queryParams.set('arrival_airport', appliedFilters.arrivalAirport);
                if (appliedFilters.departureDate) queryParams.set('departure_date', appliedFilters.departureDate);
                if (appliedFilters.passengers) queryParams.set('passengers', appliedFilters.passengers);
                if (appliedFilters.airline) queryParams.set('airline', appliedFilters.airline);
                if (appliedFilters.maxPrice) queryParams.set('max_price', appliedFilters.maxPrice);
                if (appliedFilters.sort) queryParams.set('sort', appliedFilters.sort);

                const res = await fetch(`${API_URL}/api/v1/flights?${queryParams.toString()}`);
                if (!res.ok) {
                    throw new Error(`Lỗi tải dữ liệu (${res.status})`);
                }
                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success') {
                        setFlights(data.flights || []);
                        setTotal(data.total || 0);
                        setErrorMessage('');
                    } else {
                        throw new Error(data.message || 'Không thể lấy danh sách chuyến bay');
                    }
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    setErrorMessage(msg);
                    setFlights([]);
                    setTotal(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        executeFetchFlights();

        return () => {
            isCancelled = true;
        };
    }, [page, appliedFilters, limit]);

    // (Đã thêm)
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setPage(1);
        setAppliedFilters({ ...formFilters });
    };

    // (Đã thêm)
    const handleResetFilters = () => {
        setFormFilters(initialFlightFilters);
        setIsLoading(true);
        setPage(1);
        setAppliedFilters(initialFlightFilters);
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-20">
            {/* Hero Header */}
            <section className="bg-black text-white py-14 px-6 border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <span className="text-xs font-black tracking-widest text-[#FACC15] uppercase">
                        Sẵn sàng cất cánh
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-2">
                        Tìm Kiếm Chuyến Bay
                    </h1>
                    <p className="mt-3 text-gray-400 text-sm md:text-base max-w-2xl">
                        So sánh giá vé các hãng hàng không hàng đầu, lịch bay linh hoạt và quy trình đặt chỗ nhanh chóng.
                    </p>
                </div>
            </section>

            {/* Flight Search Widget */}
            <div className="max-w-7xl mx-auto px-6 -mt-6">
                <form
                    onSubmit={handleFilterSubmit}
                    className="bg-white p-6 border border-gray-200 shadow-xl rounded-none flex flex-col gap-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Sân bay đi */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Điểm khởi hành (Sân bay đi)
                            </label>
                            <select
                                value={formFilters.departureAirport}
                                onChange={(e) => setFormFilters({ ...formFilters, departureAirport: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="">Tất cả sân bay đi</option>
                                {airports.map((ap) => (
                                    <option key={ap} value={ap}>
                                        {ap}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sân bay đến */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Điểm đến (Sân bay đến)
                            </label>
                            <select
                                value={formFilters.arrivalAirport}
                                onChange={(e) => setFormFilters({ ...formFilters, arrivalAirport: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="">Tất cả sân bay đến</option>
                                {airports.map((ap) => (
                                    <option key={ap} value={ap}>
                                        {ap}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Ngày bay */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Ngày cất cánh
                            </label>
                            <input
                                type="date"
                                value={formFilters.departureDate}
                                onChange={(e) => setFormFilters({ ...formFilters, departureDate: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            />
                        </div>

                        {/* Số hành khách */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Hành khách
                            </label>
                            <select
                                value={formFilters.passengers}
                                onChange={(e) => setFormFilters({ ...formFilters, passengers: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="1">1 Người lớn</option>
                                <option value="2">2 Hành khách</option>
                                <option value="3">3 Hành khách</option>
                                <option value="4">4 Hành khách</option>
                                <option value="5">5+ Hành khách</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                        {/* Hãng hàng không */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Hãng hàng không
                            </label>
                            <select
                                value={formFilters.airline}
                                onChange={(e) => setFormFilters({ ...formFilters, airline: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="">Tất cả các hãng</option>
                                {airlines.map((al) => (
                                    <option key={al} value={al}>
                                        {al}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sắp xếp */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Sắp xếp
                            </label>
                            <select
                                value={formFilters.sort}
                                onChange={(e) => setFormFilters({ ...formFilters, sort: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="departure_asc">Giờ cất cánh sớm nhất</option>
                                <option value="price_asc">Giá vé: Thấp đến cao</option>
                                <option value="price_desc">Giá vé: Cao đến thấp</option>
                            </select>
                        </div>

                        {/* Giá tối đa */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Giá vé tối đa (VNĐ)
                            </label>
                            <input
                                type="number"
                                placeholder="10.000.000"
                                value={formFilters.maxPrice}
                                onChange={(e) => setFormFilters({ ...formFilters, maxPrice: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-black text-white hover:bg-gray-800 py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Filter className="w-4 h-4" />
                                Tìm Vé Bay
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                title="Đặt lại bộ lọc"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-3 text-xs font-black uppercase transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            <main className="max-w-7xl mx-auto px-6 mt-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <p className="text-sm font-bold uppercase tracking-wider text-gray-700">
                        Tìm thấy <span className="text-black font-black">{total}</span> chuyến bay khả dụng
                    </p>
                    <span className="text-xs text-gray-500">Trang {page} / {totalPages}</span>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-8 text-sm">
                        {errorMessage}
                    </div>
                )}

                {/* Loading Skeleton */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((idx) => (
                            <div key={idx} className="bg-white border border-gray-200 p-6 animate-pulse">
                                <div className="flex justify-between items-center">
                                    <div className="h-6 bg-gray-200 w-1/4" />
                                    <div className="h-8 bg-gray-200 w-1/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : flights.length > 0 ? (
                    /* Flights List (Ticket Cards) */
                    <div className="space-y-4">
                        {flights.map((flight) => {
                            const airlineName = flight.planes?.airline || 'Hãng hàng không';
                            const planeModel = flight.planes?.model || 'Airbus / Boeing';
                            const durationText = calculateDuration(flight.departure_time, flight.arrival_time);

                            return (
                                <article
                                    key={flight.id}
                                    className="bg-white border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        {/* Airline & Plane Info */}
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0">
                                                <Plane className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black uppercase text-gray-900">
                                                    {airlineName}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-bold">
                                                    {flight.flight_number} · {planeModel}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Flight Timeline */}
                                        <div className="flex-1 flex items-center justify-between sm:justify-center sm:gap-12 text-center">
                                            {/* Departure */}
                                            <div className="text-left sm:text-right">
                                                <span className="text-2xl font-black text-gray-900 block">
                                                    {formatTime(flight.departure_time)}
                                                </span>
                                                <span className="text-xs font-bold text-gray-700 block uppercase">
                                                    {flight.departure_airport}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block">
                                                    {formatDate(flight.departure_time)}
                                                </span>
                                            </div>

                                            {/* Duration & Connector */}
                                            <div className="px-4 flex flex-col items-center">
                                                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mb-1">
                                                    <Clock className="w-3 h-3" /> {durationText}
                                                </span>
                                                <div className="relative w-28 sm:w-36 flex items-center justify-center">
                                                    <div className="h-[2px] bg-gray-300 w-full" />
                                                    <Plane className="w-4 h-4 text-black absolute" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase text-green-700 mt-1">
                                                    Bay thẳng
                                                </span>
                                            </div>

                                            {/* Arrival */}
                                            <div className="text-right sm:text-left">
                                                <span className="text-2xl font-black text-gray-900 block">
                                                    {formatTime(flight.arrival_time)}
                                                </span>
                                                <span className="text-xs font-bold text-gray-700 block uppercase">
                                                    {flight.arrival_airport}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block">
                                                    {formatDate(flight.arrival_time)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0 min-w-[180px]">
                                            <div className="text-left lg:text-right">
                                                <span className="text-xs text-gray-400 font-bold block">Giá vé / khách</span>
                                                <span className="text-2xl font-black text-black">
                                                    {formatCurrency(flight.ticket_price)}
                                                </span>
                                                <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <Armchair className="w-3.5 h-3.5" />
                                                    Còn {flight.available_seats} ghế
                                                </span>
                                            </div>

                                            <Link
                                                href={`/flights/${flight.id}`}
                                                className="mt-2 bg-black text-white hover:bg-gray-800 px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                            >
                                                Chọn Vé <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20 bg-white border border-gray-200 px-4">
                        <Plane className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-black uppercase tracking-wider text-gray-800">
                            Không tìm thấy chuyến bay phù hợp
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                            Hiện không có chuyến bay nào khớp với hành trình hoặc tiêu chí lọc của bạn.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-6 inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => {
                                setIsLoading(true);
                                setPage((prev) => Math.max(1, prev - 1));
                            }}
                            className="px-4 py-2 border border-gray-300 bg-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Trước
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => {
                                    setIsLoading(true);
                                    setPage(p);
                                }}
                                className={`w-10 h-10 border text-xs font-black transition-colors ${
                                    page === p
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => {
                                setIsLoading(true);
                                setPage((prev) => Math.min(totalPages, prev + 1));
                            }}
                            className="px-4 py-2 border border-gray-300 bg-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
                        >
                            Sau <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
