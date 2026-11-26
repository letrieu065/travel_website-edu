'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Award,
    Building2,
    Calendar,
    Compass,
    CreditCard,
    Download,
    Plane,
    RefreshCw,
    TrendingUp,
} from 'lucide-react';
import type {
    BookingItem,
    DashboardStats,
    PaymentRecordItem,
    RevenuePoint,
    SortConfig,
    TopBookedItem,
} from './types';
import { SortableTh, cycleSortConfig } from './TableControls';
import {
    exportToCsv,
    formatCompactCurrency,
    formatCurrency,
    formatShortDate,
    getBookingPrimaryStatus,
    getItemTypeLabel,
    sortItems,
} from './utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface RevenueSectionProps {
    stats: DashboardStats | null;
    bookings: BookingItem[];
    payments: PaymentRecordItem[];
}

type GroupByOption = 'day' | 'month' | 'year';
type PresetRange = '7d' | '30d' | '90d' | 'year' | 'custom';
type RevenueRowSortKey = 'date' | 'revenue' | 'count' | 'avg';
type TopItemSortKey = 'rank' | 'title' | 'type' | 'totalBooked';

// (Đã thêm)
const toIsoInputDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// (Đã thêm)
const getPresetDates = (preset: Exclude<PresetRange, 'custom'>): { from: string; to: string; groupBy: GroupByOption } => {
    const now = new Date();
    const to = toIsoInputDate(now);
    const fromDate = new Date(now);
    if (preset === '7d') {
        fromDate.setDate(now.getDate() - 7);
        return { from: toIsoInputDate(fromDate), to, groupBy: 'day' };
    }
    if (preset === '30d') {
        fromDate.setDate(now.getDate() - 30);
        return { from: toIsoInputDate(fromDate), to, groupBy: 'day' };
    }
    if (preset === '90d') {
        fromDate.setDate(now.getDate() - 90);
        return { from: toIsoInputDate(fromDate), to, groupBy: 'month' };
    }
    fromDate.setMonth(0, 1);
    return { from: toIsoInputDate(fromDate), to, groupBy: 'month' };
};

// (Đã thêm)
export default function RevenueSection({ stats, bookings, payments }: RevenueSectionProps) {
    const initialDates = useMemo(() => getPresetDates('30d'), []);
    const [preset, setPreset] = useState<PresetRange>('30d');
    const [fromDate, setFromDate] = useState<string>(initialDates.from);
    const [toDate, setToDate] = useState<string>(initialDates.to);
    const [groupBy, setGroupBy] = useState<GroupByOption>(initialDates.groupBy);

    const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
    const [topTours, setTopTours] = useState<TopBookedItem[]>([]);
    const [topHotels, setTopHotels] = useState<TopBookedItem[]>([]);
    const [topFlights, setTopFlights] = useState<TopBookedItem[]>([]);
    const [topFilterType, setTopFilterType] = useState<'all' | 'tour' | 'hotel' | 'flight'>('all');
    const [isFetching, setIsFetching] = useState(false);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [seriesSort, setSeriesSort] = useState<SortConfig<RevenueRowSortKey> | null>(null);
    const [topSort, setTopSort] = useState<SortConfig<TopItemSortKey> | null>(null);

    // (Đã thêm)
    const runAnalyticsQuery = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token || !fromDate || !toDate) return { ok: false as const };

        const toEndIso = `${toDate}T23:59:59.999Z`;
        const fromStartIso = `${fromDate}T00:00:00.000Z`;
        const headers = { Authorization: `Bearer ${token}` };

        const [revRes, tourRes, hotelRes, flightRes] = await Promise.all([
            fetch(
                `${API_URL}/api/v1/admin/dashboard/revenue?from_date=${encodeURIComponent(
                    fromStartIso
                )}&to_date=${encodeURIComponent(toEndIso)}&group_by=${groupBy}`,
                { headers }
            ),
            fetch(`${API_URL}/api/v1/admin/dashboard/top-items?item_type=tour&limit=5`, { headers }),
            fetch(`${API_URL}/api/v1/admin/dashboard/top-items?item_type=hotel&limit=5`, { headers }),
            fetch(`${API_URL}/api/v1/admin/dashboard/top-items?item_type=flight&limit=5`, { headers }),
        ]);

        const [revJson, tourJson, hotelJson, flightJson] = await Promise.all([
            revRes.ok ? revRes.json() : null,
            tourRes.ok ? tourRes.json() : null,
            hotelRes.ok ? hotelRes.json() : null,
            flightRes.ok ? flightRes.json() : null,
        ]);

        return {
            ok: true as const,
            rev: Array.isArray(revJson?.data) ? revJson.data : null,
            tours: Array.isArray(tourJson?.data) ? tourJson.data : null,
            hotels: Array.isArray(hotelJson?.data) ? hotelJson.data : null,
            flights: Array.isArray(flightJson?.data) ? flightJson.data : null,
        };
    }, [fromDate, toDate, groupBy]);

    // (Đã thêm)
    const handleRefreshAnalytics = async () => {
        setIsFetching(true);
        try {
            const res = await runAnalyticsQuery();
            if (res.ok) {
                if (res.rev) setRevenueSeries(res.rev);
                if (res.tours) setTopTours(res.tours);
                if (res.hotels) setTopHotels(res.hotels);
                if (res.flights) setTopFlights(res.flights);
            }
        } catch (err) {
            console.error('Lỗi tải dữ liệu phân tích doanh thu:', err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        // (Đã thêm)
        const load = async () => {
            try {
                const res = await runAnalyticsQuery();
                if (!cancelled && res.ok) {
                    if (res.rev) setRevenueSeries(res.rev);
                    if (res.tours) setTopTours(res.tours);
                    if (res.hotels) setTopHotels(res.hotels);
                    if (res.flights) setTopFlights(res.flights);
                }
            } catch (err) {
                console.error('Lỗi tải dữ liệu phân tích doanh thu:', err);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [runAnalyticsQuery]);

    // (Đã thêm)
    const handleApplyPreset = (nextPreset: Exclude<PresetRange, 'custom'>) => {
        const cfg = getPresetDates(nextPreset);
        setPreset(nextPreset);
        setFromDate(cfg.from);
        setToDate(cfg.to);
        setGroupBy(cfg.groupBy);
    };

    // Real breakdown computed from actual bookings & payments
    const realBreakdown = useMemo(() => {
        const categoryTotals: Record<'tour' | 'hotel' | 'flight', { revenue: number; quantity: number; orders: number }> = {
            tour: { revenue: 0, quantity: 0, orders: 0 },
            hotel: { revenue: 0, quantity: 0, orders: 0 },
            flight: { revenue: 0, quantity: 0, orders: 0 },
        };

        const paidBookings = bookings.filter((b) => getBookingPrimaryStatus(b) === 'paid');
        const sourceBookings = paidBookings.length > 0 ? paidBookings : bookings;

        for (const booking of sourceBookings) {
            const seenTypes = new Set<string>();
            for (const item of booking.booking_items || []) {
                const key = item.item_type === 'tour' || item.item_type === 'hotel' || item.item_type === 'flight' ? item.item_type : null;
                if (!key) continue;
                const lineAmount = Number(item.unit_price || 0) * Number(item.quantity || 1);
                categoryTotals[key].revenue += lineAmount;
                categoryTotals[key].quantity += Number(item.quantity || 0);
                if (!seenTypes.has(key)) {
                    categoryTotals[key].orders += 1;
                    seenTypes.add(key);
                }
            }
        }

        const totalCategoryRev =
            categoryTotals.tour.revenue + categoryTotals.hotel.revenue + categoryTotals.flight.revenue;

        const methodMap = new Map<string, { method: string; amount: number; count: number; paidCount: number }>();
        for (const p of payments) {
            const method = (p.payment_method || 'unknown').toLowerCase();
            const existing = methodMap.get(method) || { method, amount: 0, count: 0, paidCount: 0 };
            existing.count += 1;
            if (p.payment_status === 'paid') {
                existing.amount += Number(p.amount || 0);
                existing.paidCount += 1;
            }
            methodMap.set(method, existing);
        }

        const paidAmountTotal = payments
            .filter((p) => p.payment_status === 'paid')
            .reduce((s, p) => s + Number(p.amount || 0), 0);
        const pendingAmountTotal = payments
            .filter((p) => p.payment_status === 'pending')
            .reduce((s, p) => s + Number(p.amount || 0), 0);
        const refundedAmountTotal = payments
            .filter((p) => p.payment_status === 'refunded' || p.payment_status === 'refund_requested')
            .reduce((s, p) => s + Number(p.amount || 0), 0);

        return {
            isPaidOnly: paidBookings.length > 0,
            categoryTotals,
            totalCategoryRev,
            methods: Array.from(methodMap.values()).sort((a, b) => b.amount - a.amount),
            paidAmountTotal,
            pendingAmountTotal,
            refundedAmountTotal,
        };
    }, [bookings, payments]);

    const chartStats = useMemo(() => {
        const periodTotal = revenueSeries.reduce((s, r) => s + Number(r.revenue || 0), 0);
        const periodOrders = revenueSeries.reduce((s, r) => s + Number(r.count || 0), 0);
        const maxRev = Math.max(1, ...revenueSeries.map((r) => Number(r.revenue || 0)));
        const avgOrder = periodOrders > 0 ? periodTotal / periodOrders : 0;
        return { periodTotal, periodOrders, maxRev, avgOrder };
    }, [revenueSeries]);

    const sortedRevenueRows = useMemo(() => {
        return sortItems(revenueSeries, seriesSort, {
            date: (r) => r.date,
            revenue: (r) => Number(r.revenue || 0),
            count: (r) => Number(r.count || 0),
            avg: (r) => (r.count > 0 ? Number(r.revenue || 0) / r.count : 0),
        });
    }, [revenueSeries, seriesSort]);

    const normalizedTopRows = useMemo(() => {
        const rows: Array<{ id: string; rank: number; type: 'tour' | 'hotel' | 'flight'; title: string; subtitle: string; totalBooked: number }> = [];

        const pushGroup = (list: TopBookedItem[], type: 'tour' | 'hotel' | 'flight') => {
            list.forEach((entry, idx) => {
                const it = entry.item;
                if (!it) return;
                let title = 'Dịch vụ';
                let subtitle = '';
                if (type === 'tour') {
                    title = it.title || `Tour #${String(it.id || '').slice(0, 6)}`;
                    subtitle = it.destination || (it.departure?.start_date ? `Khởi hành ${formatShortDate(it.departure.start_date)}` : 'Tour du lịch');
                } else if (type === 'hotel') {
                    title = it.name || `Khách sạn #${String(it.id || '').slice(0, 6)}`;
                    subtitle = `${it.city || ''} · ${it.star_rating ?? 0}★`;
                } else {
                    title = `${it.departure_airport || '?'} → ${it.arrival_airport || '?'}`;
                    subtitle = `${it.planes?.airline || 'Hãng bay'} (${it.planes?.plane_number || '---'})`;
                }
                rows.push({
                    id: `${type}-${it.id || idx}`,
                    rank: idx + 1,
                    type,
                    title,
                    subtitle,
                    totalBooked: Number(entry.totalBooked || 0),
                });
            });
        };

        if (topFilterType === 'all' || topFilterType === 'tour') pushGroup(topTours, 'tour');
        if (topFilterType === 'all' || topFilterType === 'hotel') pushGroup(topHotels, 'hotel');
        if (topFilterType === 'all' || topFilterType === 'flight') pushGroup(topFlights, 'flight');

        return sortItems(rows, topSort, {
            rank: (r) => r.rank,
            title: (r) => r.title,
            type: (r) => getItemTypeLabel(r.type),
            totalBooked: (r) => r.totalBooked,
        });
    }, [topTours, topHotels, topFlights, topFilterType, topSort]);

    return (
        <div className="space-y-6">
            {/* Top Summary & Filter Bar */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                            Tài Chính & Đối Soát Thực Tế
                        </span>
                        <h3 className="text-xl font-black text-gray-900">
                            Báo Cáo Doanh Thu & Hiệu Suất Dịch Vụ
                        </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {(
                            [
                                { id: '7d', label: '7 ngày' },
                                { id: '30d', label: '30 ngày' },
                                { id: '90d', label: '90 ngày' },
                                { id: 'year', label: 'Năm nay' },
                            ] as const
                        ).map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleApplyPreset(p.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                                    preset === p.id
                                        ? 'bg-gray-900 text-[#FACC15] border-gray-900'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={handleRefreshAnalytics}
                            disabled={isFetching}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                            <span>Cập nhật</span>
                        </button>
                    </div>
                </div>

                {/* Custom Date & Group By Controls */}
                <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                            Từ ngày
                        </label>
                        <div className="relative">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setPreset('custom');
                                    setFromDate(e.target.value);
                                }}
                                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                            Đến ngày
                        </label>
                        <div className="relative">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setPreset('custom');
                                    setToDate(e.target.value);
                                }}
                                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                            Nhóm dữ liệu theo
                        </label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                        >
                            <option value="day">Theo ngày</option>
                            <option value="month">Theo tháng</option>
                            <option value="year">Theo năm</option>
                        </select>
                    </div>

                    <div className="ml-auto flex flex-wrap gap-3">
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                                Doanh thu kỳ chọn
                            </span>
                            <strong className="text-base font-black text-emerald-900 tabular-nums">
                                {formatCurrency(chartStats.periodTotal)}
                            </strong>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-stone-50 border border-gray-200">
                            <span className="text-[10px] font-bold uppercase text-gray-500 block">
                                TB mỗi giao dịch
                            </span>
                            <strong className="text-base font-black text-gray-900 tabular-nums">
                                {formatCurrency(chartStats.avgOrder)}
                            </strong>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-gray-900 text-white">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">
                                Tổng doanh thu toàn hệ thống
                            </span>
                            <strong className="text-base font-black text-[#FACC15] tabular-nums">
                                {formatCurrency(stats?.totalRevenue ?? realBreakdown.paidAmountTotal)}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Interactive Bar Chart */}
                <div className="pt-4">
                    {revenueSeries.length > 0 ? (
                        <div className="relative bg-stone-50/60 border border-gray-100 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-bold text-gray-800">
                                        Biểu đồ doanh thu đã quyết toán ({revenueSeries.length} mốc)
                                    </span>
                                </div>
                                {hoveredIndex !== null && revenueSeries[hoveredIndex] && (
                                    <div className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold tabular-nums">
                                        {revenueSeries[hoveredIndex].date}:{' '}
                                        <span className="text-[#FACC15]">
                                            {formatCurrency(revenueSeries[hoveredIndex].revenue)}
                                        </span>{' '}
                                        ({revenueSeries[hoveredIndex].count} GD)
                                    </div>
                                )}
                            </div>

                            <div className="h-56 flex items-end gap-2 overflow-x-auto pb-2">
                                {revenueSeries.map((pt, idx) => {
                                    const heightPct = Math.max(8, Math.round((Number(pt.revenue || 0) / chartStats.maxRev) * 100));
                                    const isHovered = hoveredIndex === idx;
                                    return (
                                        <div
                                            key={pt.date}
                                            onMouseEnter={() => setHoveredIndex(idx)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                            className="flex-1 min-w-[44px] h-full flex flex-col justify-end items-center gap-1.5 group cursor-pointer"
                                        >
                                            <span className="text-[10px] font-bold text-gray-600 tabular-nums opacity-80 group-hover:opacity-100">
                                                {formatCompactCurrency(pt.revenue)}
                                            </span>
                                            <div className="w-full max-w-[44px] flex-1 flex items-end">
                                                <div
                                                    style={{ height: `${heightPct}%` }}
                                                    className={`w-full rounded-t-lg transition-all duration-200 ${
                                                        isHovered
                                                            ? 'bg-gray-900 ring-2 ring-[#FACC15]'
                                                            : 'bg-gradient-to-t from-amber-500 to-yellow-300 group-hover:from-gray-900 group-hover:to-gray-700'
                                                    }`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                                                {pt.date}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                            Không có giao dịch thanh toán thành công (<strong>paid</strong>) có ngày thanh toán trong khoảng{' '}
                            <strong>{fromDate}</strong> → <strong>{toDate}</strong>. Hãy mở rộng khoảng ngày hoặc chọn{' '}
                            <strong>Năm nay</strong>.
                        </div>
                    )}
                </div>
            </div>

            {/* Real Category & Payment Method Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Revenue */}
                <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                Tỷ Trọng Doanh Thu Theo Dịch Vụ (Dữ Liệu Thực)
                            </h4>
                            <p className="text-[11px] text-gray-500">
                                Tính từ {realBreakdown.isPaidOnly ? 'các đơn đã thanh toán' : 'tổng đơn đặt chỗ hiện có'} trên hệ thống
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(
                            [
                                {
                                    key: 'tour',
                                    label: 'Tour Du Lịch',
                                    icon: Compass,
                                    color: 'bg-blue-600',
                                    soft: 'bg-blue-50 text-blue-700',
                                },
                                {
                                    key: 'hotel',
                                    label: 'Khách Sạn & Resort',
                                    icon: Building2,
                                    color: 'bg-teal-600',
                                    soft: 'bg-teal-50 text-teal-700',
                                },
                                {
                                    key: 'flight',
                                    label: 'Vé Máy Bay',
                                    icon: Plane,
                                    color: 'bg-indigo-600',
                                    soft: 'bg-indigo-50 text-indigo-700',
                                },
                            ] as const
                        ).map((cat) => {
                            const data = realBreakdown.categoryTotals[cat.key];
                            const pct =
                                realBreakdown.totalCategoryRev > 0
                                    ? Math.round((data.revenue / realBreakdown.totalCategoryRev) * 100)
                                    : 0;
                            const Icon = cat.icon;
                            return (
                                <div key={cat.key} className="p-4 rounded-xl border border-gray-200 bg-stone-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.soft}`}>
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <span className="text-lg font-black text-gray-900 tabular-nums">{pct}%</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{cat.label}</p>
                                        <p className="text-sm font-black text-gray-900 mt-0.5 tabular-nums">
                                            {formatCurrency(data.revenue)}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {data.orders} đơn · {data.quantity} lượt đặt
                                        </p>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                            Cổng Thanh Toán
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {realBreakdown.methods.length > 0 ? (
                            realBreakdown.methods.map((m) => (
                                <div
                                    key={m.method}
                                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-gray-100"
                                >
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-900">{m.method}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {m.paidCount}/{m.count} giao dịch đã trả
                                        </p>
                                    </div>
                                    <span className="text-xs font-black text-emerald-700 tabular-nums">
                                        {formatCurrency(m.amount)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic py-6 text-center">Chưa có dữ liệu thanh toán</p>
                        )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Đã thu thực tế:</span>
                            <strong className="text-emerald-700 tabular-nums">
                                {formatCurrency(realBreakdown.paidAmountTotal)}
                            </strong>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Đang chờ thanh toán:</span>
                            <strong className="text-amber-700 tabular-nums">
                                {formatCurrency(realBreakdown.pendingAmountTotal)}
                            </strong>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Hoàn / Yêu cầu hoàn:</span>
                            <strong className="text-violet-700 tabular-nums">
                                {formatCurrency(realBreakdown.refundedAmountTotal)}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Period Table & Top Booked Services Table (Both with column sorting!) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Period Breakdown Table */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                Bảng Số Liệu Theo Kỳ
                            </h4>
                            <p className="text-[11px] text-gray-500">Sắp xếp theo thời gian, doanh thu hoặc số giao dịch</p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                exportToCsv(
                                    `doanh-thu-${fromDate}-to-${toDate}.csv`,
                                    ['Kỳ', 'Doanh thu (VND)', 'Số giao dịch', 'Trung bình/GD'],
                                    sortedRevenueRows.map((r) => [
                                        r.date,
                                        r.revenue,
                                        r.count,
                                        r.count > 0 ? Math.round(r.revenue / r.count) : 0,
                                    ])
                                )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-stone-50 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Xuất CSV</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50/80 border-b border-gray-200">
                                <tr>
                                    <SortableTh
                                        label="Thời gian"
                                        sortKey="date"
                                        sortConfig={seriesSort}
                                        onSort={(k) => setSeriesSort((p) => cycleSortConfig(p, k))}
                                    />
                                    <SortableTh
                                        label="Doanh thu"
                                        sortKey="revenue"
                                        sortConfig={seriesSort}
                                        onSort={(k) => setSeriesSort((p) => cycleSortConfig(p, k))}
                                        align="right"
                                    />
                                    <SortableTh
                                        label="Số GD"
                                        sortKey="count"
                                        sortConfig={seriesSort}
                                        onSort={(k) => setSeriesSort((p) => cycleSortConfig(p, k))}
                                        align="center"
                                    />
                                    <SortableTh
                                        label="TB / Giao dịch"
                                        sortKey="avg"
                                        sortConfig={seriesSort}
                                        onSort={(k) => setSeriesSort((p) => cycleSortConfig(p, k))}
                                        align="right"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedRevenueRows.length > 0 ? (
                                    sortedRevenueRows.map((r) => (
                                        <tr key={r.date} className="hover:bg-stone-50">
                                            <td className="px-3.5 py-2.5 font-mono font-bold text-gray-900">{r.date}</td>
                                            <td className="px-3.5 py-2.5 text-right font-black text-emerald-700 tabular-nums">
                                                {formatCurrency(r.revenue)}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-center font-bold text-gray-700 tabular-nums">
                                                {r.count}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right text-gray-600 tabular-nums">
                                                {formatCurrency(r.count > 0 ? r.revenue / r.count : 0)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                                            Chưa có số liệu trong khoảng thời gian đã chọn
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Booked Items */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-600" />
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                    Top Dịch Vụ Được Đặt Nhiều Nhất
                                </h4>
                                <p className="text-[11px] text-gray-500">Thống kê từ bảng booking_items thực tế</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {(
                                [
                                    { id: 'all', label: 'Tất cả' },
                                    { id: 'tour', label: 'Tour' },
                                    { id: 'hotel', label: 'KS' },
                                    { id: 'flight', label: 'Bay' },
                                ] as const
                            ).map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTopFilterType(t.id)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                                        topFilterType === t.id
                                            ? 'bg-gray-900 text-[#FACC15]'
                                            : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50/80 border-b border-gray-200">
                                <tr>
                                    <SortableTh
                                        label="Top"
                                        sortKey="rank"
                                        sortConfig={topSort}
                                        onSort={(k) => setTopSort((p) => cycleSortConfig(p, k))}
                                        align="center"
                                    />
                                    <SortableTh
                                        label="Dịch vụ"
                                        sortKey="title"
                                        sortConfig={topSort}
                                        onSort={(k) => setTopSort((p) => cycleSortConfig(p, k))}
                                    />
                                    <SortableTh
                                        label="Loại"
                                        sortKey="type"
                                        sortConfig={topSort}
                                        onSort={(k) => setTopSort((p) => cycleSortConfig(p, k))}
                                    />
                                    <SortableTh
                                        label="Lượt đặt"
                                        sortKey="totalBooked"
                                        sortConfig={topSort}
                                        onSort={(k) => setTopSort((p) => cycleSortConfig(p, k))}
                                        align="right"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {normalizedTopRows.length > 0 ? (
                                    normalizedTopRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-stone-50">
                                            <td className="px-3.5 py-2.5 text-center font-black text-amber-600 tabular-nums">
                                                #{row.rank}
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <p className="font-bold text-gray-900 truncate max-w-[230px]">{row.title}</p>
                                                <p className="text-[11px] text-gray-500 truncate max-w-[230px]">{row.subtitle}</p>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-gray-700 text-[10px] font-bold">
                                                    {getItemTypeLabel(row.type)}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right font-black text-gray-900 tabular-nums">
                                                {row.totalBooked}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                                            Chưa có dữ liệu dịch vụ được đặt
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
