'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    Building2,
    Calendar,
    CalendarCheck,
    Compass,
    CreditCard,
    ExternalLink,
    Eye,
    EyeOff,
    Flame,
    ImagePlus,
    KeyRound,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plane,
    Plus,
    Search,
    Shield,
    Sparkles,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { AirlineLogoBadge } from '@/components/common/AirlineBranding';
import type {
    AdminTab,
    BookingItem,
    FlightItem,
    HotelItem,
    PlaneItem,
    ResolvedItemMeta,
    TourDepartureItem,
    TourItem,
    UserDetail,
    UserItem,
} from './types';
import { AvatarBadge, CopyIdButton, PaymentStatusBadge } from './TableControls';
import {
    formatCurrency,
    formatDate,
    formatShortDate,
    getBookingPrimaryStatus,
    getErrorMessage,
    getItemTypeLabel,
    matchesSearch,
    parseDestinationList,
} from './utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

// (Đã thêm)
const toDateTimeLocalValue = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};

/* ============================================================================
 * 1. CONFIRM ACTION MODAL
 * ============================================================================ */

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: 'danger' | 'warning';
    isSubmitting?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

// (Đã thêm)
export function ConfirmActionModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Xác nhận',
    tone = 'danger',
    isSubmitting = false,
    onCancel,
    onConfirm,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-start gap-3">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-black text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${
                            tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-900 hover:bg-black text-[#FACC15]'
                        }`}
                    >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{confirmLabel}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
 * 2. GLOBAL OMNISEARCH MODAL (Ctrl+K)
 * ============================================================================ */

export type GlobalDetailTarget =
    | { type: 'booking'; item: BookingItem }
    | { type: 'tour'; item: TourItem }
    | { type: 'hotel'; item: HotelItem }
    | { type: 'user'; item: UserItem };

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookings: BookingItem[];
    tours: TourItem[];
    hotels: HotelItem[];
    flights: FlightItem[];
    users: UserItem[];
    onSelectResult: (tab: AdminTab, searchValue: string, detailItem?: GlobalDetailTarget) => void;
}

// (Đã thêm)
function GlobalSearchInner({
    onClose,
    bookings,
    tours,
    hotels,
    flights,
    users,
    onSelectResult,
}: Omit<GlobalSearchModalProps, 'isOpen'>) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => inputRef.current?.focus(), 30);
        return () => clearTimeout(timer);
    }, []);

    const results = useMemo(() => {
        const q = query.trim();
        const limitPerGroup = q ? 5 : 2;

        return {
            bookings: bookings
                .filter((b) => matchesSearch(q, [b.id, b.users?.full_name, b.users?.email, b.users?.phone_number]))
                .slice(0, limitPerGroup),
            tours: tours
                .filter((t) => matchesSearch(q, [t.id, t.title, t.destination, t.departure_location, t.tour_type]))
                .slice(0, limitPerGroup),
            hotels: hotels
                .filter((h) => matchesSearch(q, [h.id, h.name, h.city, h.address]))
                .slice(0, limitPerGroup),
            flights: flights
                .filter((f) =>
                    matchesSearch(q, [f.id, f.departure_airport, f.arrival_airport, f.planes?.airline, f.planes?.plane_number])
                )
                .slice(0, limitPerGroup),
            users: users
                .filter((u) => matchesSearch(q, [u.id, u.full_name, u.email, u.phone_number, u.role]))
                .slice(0, limitPerGroup),
        };
    }, [query, bookings, tours, hotels, flights, users]);

    const totalMatches =
        results.bookings.length +
        results.tours.length +
        results.hotels.length +
        results.flights.length +
        results.users.length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs pt-16 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onClose();
                        }}
                        placeholder="Tìm nhanh toàn hệ thống (hỗ trợ không dấu): tên khách, mã đơn, tour, khách sạn, sân bay..."
                        className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-2 py-0.5 rounded border border-gray-200 text-[10px] font-mono font-bold text-gray-500 cursor-pointer"
                    >
                        ESC
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
                    {totalMatches === 0 && (
                        <div className="py-10 text-center text-xs text-gray-400">
                            Không tìm thấy dữ liệu nào khớp với &ldquo;{query}&rdquo;.
                        </div>
                    )}

                    {results.bookings.length > 0 && (
                        <div>
                            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Đơn đặt chỗ
                            </p>
                            {results.bookings.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectResult('bookings', query, { type: 'booking', item: b });
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-amber-50/70 text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">
                                                {b.users?.full_name || 'Khách'} · #{b.id.slice(0, 8)}
                                            </p>
                                            <p className="text-[11px] text-gray-500 truncate">{b.users?.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-gray-900 tabular-nums">
                                        {formatCurrency(b.total_price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.tours.length > 0 && (
                        <div>
                            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Tour du lịch
                            </p>
                            {results.tours.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectResult('tours', query, { type: 'tour', item: t });
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-amber-50/70 text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{t.title}</p>
                                            <p className="text-[11px] text-gray-500 truncate">
                                                {t.destination || t.tour_type} · {t.duration || '--'}
                                            </p>
                                        </div>
                                    </div>
                                    {t.is_trending && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                            Hot
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {results.hotels.length > 0 && (
                        <div>
                            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Khách sạn & Resort
                            </p>
                            {results.hotels.map((h) => (
                                <button
                                    key={h.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectResult('hotels', query, { type: 'hotel', item: h });
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-amber-50/70 text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{h.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">
                                                {h.city} · {h.star_rating ?? 0}★
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 tabular-nums">
                                        {formatCurrency(h.discount_price ?? h.price_per_night)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.flights.length > 0 && (
                        <div>
                            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Chuyến bay
                            </p>
                            {results.flights.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectResult('flights', f.departure_airport);
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-amber-50/70 text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Plane className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">
                                                {f.departure_airport} → {f.arrival_airport}
                                            </p>
                                            <p className="text-[11px] text-gray-500 truncate">
                                                {f.planes?.airline} ({f.planes?.plane_number}) · {formatDate(f.departure_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 tabular-nums">
                                        {formatCurrency(f.ticket_price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.users.length > 0 && (
                        <div>
                            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Thành viên
                            </p>
                            {results.users.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectResult('users', query, { type: 'user', item: u });
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-amber-50/70 text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Users className="w-4 h-4 text-rose-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{u.full_name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[10px] font-bold uppercase text-gray-700">
                                        {u.role || 'user'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export function GlobalSearchModal(props: GlobalSearchModalProps) {
    if (!props.isOpen) return null;
    return <GlobalSearchInner {...props} />;
}

/* ============================================================================
 * 3. BOOKING DETAIL DRAWER
 * ============================================================================ */

interface BookingDetailDrawerProps {
    booking: BookingItem | null;
    itemLookup: Map<string, ResolvedItemMeta>;
    onClose: () => void;
    onUpdatePaymentStatus: (paymentId: string, status: 'pending' | 'paid' | 'failed' | 'refunded') => Promise<void>;
    onDeleteBooking: (booking: BookingItem) => void;
}

// (Đã thêm)
function BookingDetailInner({
    booking,
    itemLookup,
    onClose,
    onUpdatePaymentStatus,
    onDeleteBooking,
}: Omit<BookingDetailDrawerProps, 'booking'> & { booking: BookingItem }) {
    const [detail, setDetail] = useState<BookingItem>(booking);
    const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        // (Đã thêm)
        const fetchFull = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/v1/admin/bookings/${booking.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok && !cancelled) {
                    const json = await res.json();
                    if (json.data) setDetail(json.data);
                }
            } catch {
                // Keep initial data
            }
        };
        fetchFull();
        return () => {
            cancelled = true;
        };
    }, [booking.id]);

    const primaryStatus = getBookingPrimaryStatus(detail);

    // (Đã thêm)
    const handleStatusChange = async (paymentId: string, nextStatus: 'pending' | 'paid' | 'failed' | 'refunded') => {
        setUpdatingPaymentId(paymentId);
        try {
            await onUpdatePaymentStatus(paymentId, nextStatus);
            setDetail((prev) => ({
                ...prev,
                payments: (prev.payments || []).map((p) =>
                    p.id === paymentId ? { ...p, payment_status: nextStatus } : p
                ),
            }));
        } finally {
            setUpdatingPaymentId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-stone-50">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                            Chi Tiết Đơn Đặt Chỗ
                        </span>
                        <div className="flex items-center gap-2.5 mt-0.5">
                            <CopyIdButton value={detail.id} displayLength={12} />
                            <PaymentStatusBadge status={primaryStatus} />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-200/70 text-gray-500 hover:text-black cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-gray-200 bg-stone-50/50 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                Thông tin khách hàng
                            </span>
                            <p className="text-sm font-black text-gray-900">
                                {detail.users?.full_name || 'Khách vãng lai'}
                            </p>
                            {detail.users?.email && (
                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    {detail.users.email}
                                </p>
                            )}
                            {detail.users?.phone_number && (
                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    {detail.users.phone_number}
                                </p>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl border border-gray-200 bg-gray-900 text-white flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Tổng giá trị đơn hàng
                            </span>
                            <p className="text-2xl font-black text-[#FACC15] tabular-nums my-1">
                                {formatCurrency(detail.total_price)}
                            </p>
                            <p className="text-[11px] text-gray-300">Tạo lúc: {formatDate(detail.created_at)}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Danh sách dịch vụ đã đặt ({detail.booking_items?.length || 0})
                        </h4>
                        <div className="space-y-2.5">
                            {(detail.booking_items || []).map((item, idx) => {
                                const meta = itemLookup.get(`${item.item_type}:${item.item_id}`);
                                const lineTotal = Number(item.unit_price || 0) * Number(item.quantity || 1);
                                return (
                                    <div
                                        key={`${item.item_type}-${item.item_id}-${idx}`}
                                        className="p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                                                    {getItemTypeLabel(item.item_type)}
                                                </span>
                                                <CopyIdButton value={item.item_id} displayLength={8} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {meta?.title || `Mã dịch vụ #${item.item_id.slice(0, 8)}`}
                                            </p>
                                            {meta?.subtitle && <p className="text-xs text-gray-500">{meta.subtitle}</p>}
                                            {(item.check_in || item.check_out) && (
                                                <p className="text-[11px] text-gray-500">
                                                    Check-in: {formatDate(item.check_in)}
                                                    {item.check_out ? ` → Check-out: ${formatDate(item.check_out)}` : ''}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-left sm:text-right shrink-0">
                                            <p className="text-xs text-gray-500 tabular-nums">
                                                {item.quantity} × {formatCurrency(item.unit_price)}
                                            </p>
                                            <p className="text-sm font-black text-gray-900 tabular-nums">
                                                {formatCurrency(lineTotal)}
                                            </p>
                                            {meta?.href && (
                                                <Link
                                                    href={meta.href}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline mt-1"
                                                >
                                                    <span>Xem dịch vụ</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Lịch sử & Điều chỉnh Thanh toán ({detail.payments?.length || 0})
                        </h4>
                        {detail.payments && detail.payments.length > 0 ? (
                            <div className="space-y-3">
                                {detail.payments.map((p) => (
                                    <div key={p.id} className="p-4 rounded-xl border border-gray-200 bg-stone-50/40 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs font-black uppercase text-gray-900">
                                                    {p.payment_method}
                                                </span>
                                                {p.transaction_id && <CopyIdButton value={p.transaction_id} displayLength={14} />}
                                            </div>
                                            <PaymentStatusBadge status={p.payment_status} />
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                                            <span>
                                                Số tiền:{' '}
                                                <strong className="text-gray-900 tabular-nums">
                                                    {formatCurrency(p.amount)}
                                                </strong>
                                            </span>
                                            <span>Ngày TT: {formatDate(p.payment_date)}</span>
                                        </div>

                                        <div className="pt-2 border-t border-gray-200/70 flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-semibold text-gray-500 mr-1">
                                                Cập nhật trạng thái:
                                            </span>
                                            {(
                                                [
                                                    { val: 'paid', label: 'Đã trả (Paid)' },
                                                    { val: 'pending', label: 'Chờ TT (Pending)' },
                                                    { val: 'refunded', label: 'Hoàn tiền (Refunded)' },
                                                    { val: 'failed', label: 'Thất bại (Failed)' },
                                                ] as const
                                            ).map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    type="button"
                                                    disabled={updatingPaymentId === p.id || p.payment_status === opt.val}
                                                    onClick={() => handleStatusChange(p.id, opt.val)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-45 ${
                                                        p.payment_status === opt.val
                                                            ? 'bg-gray-900 text-[#FACC15] border-gray-900'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Đơn hàng chưa có bản ghi thanh toán nào.</p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-stone-50 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => onDeleteBooking(detail)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa đơn này</span>
                    </button>

                    <Link
                        href={`/bookings/${detail.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-[#FACC15] text-xs font-bold hover:bg-black"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở E-Voucher</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export function BookingDetailDrawer(props: BookingDetailDrawerProps) {
    if (!props.booking) return null;
    return <BookingDetailInner key={props.booking.id} {...props} booking={props.booking} />;
}

/* ============================================================================
 * 4. TOUR DETAIL & DEPARTURES / IMAGES DRAWER
 * ============================================================================ */

interface TourDetailDrawerProps {
    tour: TourItem | null;
    onClose: () => void;
    onEditTour: (tour: TourItem) => void;
    onRefreshAll: () => Promise<void>;
    onNotify: (type: 'success' | 'error', msg: string) => void;
}

// (Đã thêm)
function TourDetailInner({
    tour,
    onClose,
    onEditTour,
    onRefreshAll,
    onNotify,
}: Omit<TourDetailDrawerProps, 'tour'> & { tour: TourItem }) {
    const [detail, setDetail] = useState<TourItem>(tour);
    const [newDepDate, setNewDepDate] = useState('');
    const [newDepPrice, setNewDepPrice] = useState('');
    const [newDepDiscount, setNewDepDiscount] = useState('');
    const [newDepSeats, setNewDepSeats] = useState('20');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        // (Đã thêm)
        const loadDetail = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/v1/admin/tours/${tour.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok && !cancelled) {
                    const json = await res.json();
                    if (json.data) setDetail(json.data);
                }
            } catch {
                // Keep initial data
            }
        };
        loadDetail();
        return () => {
            cancelled = true;
        };
    }, [tour.id]);

    // (Đã thêm)
    const handleAddDeparture = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !newDepDate || !newDepPrice) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tours/${detail.id}/departures`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    start_date: newDepDate,
                    price: Number(newDepPrice),
                    discount_price: newDepDiscount ? Number(newDepDiscount) : undefined,
                    available_seats: Number(newDepSeats || 0),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Không thể thêm lịch khởi hành');

            const created: TourDepartureItem = json.data;
            setDetail((prev) => ({ ...prev, tour_departures: [...(prev.tour_departures || []), created] }));
            setNewDepDate('');
            setNewDepPrice('');
            setNewDepDiscount('');
            onNotify('success', 'Đã thêm đợt khởi hành mới!');
            await onRefreshAll();
        } catch (err: unknown) {
            onNotify('error', getErrorMessage(err, 'Lỗi khi thêm đợt khởi hành'));
        } finally {
            setIsSaving(false);
        }
    };

    // (Đã thêm)
    const handleDeleteDeparture = async (depId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tour-departures/${depId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Không thể xóa lịch khởi hành');
            setDetail((prev) => ({
                ...prev,
                tour_departures: (prev.tour_departures || []).filter((d) => d.id !== depId),
            }));
            onNotify('success', 'Đã xóa đợt khởi hành.');
            await onRefreshAll();
        } catch (err: unknown) {
            onNotify('error', getErrorMessage(err, 'Lỗi khi xóa lịch khởi hành'));
        }
    };

    // (Đã thêm)
    const handleAddImage = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !newImageUrl.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tours/${detail.id}/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    images: [{ url: newImageUrl.trim(), sort_order: (detail.tour_images?.length || 0) + 1 }],
                }),
            });
            if (!res.ok) throw new Error('Không thể thêm ảnh');
            setNewImageUrl('');
            const refreshed = await fetch(`${API_URL}/api/v1/admin/tours/${detail.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (refreshed.ok) {
                const json = await refreshed.json();
                if (json.data) setDetail(json.data);
            }
            onNotify('success', 'Đã thêm ảnh cho tour!');
            await onRefreshAll();
        } catch (err: unknown) {
            onNotify('error', getErrorMessage(err, 'Lỗi thêm ảnh'));
        } finally {
            setIsSaving(false);
        }
    };

    // (Đã thêm)
    const handleDeleteImage = async (imgId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tour-images/${imgId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Không thể xóa ảnh');
            setDetail((prev) => ({
                ...prev,
                tour_images: (prev.tour_images || []).filter((img) => img.id !== imgId),
            }));
            onNotify('success', 'Đã xóa ảnh tour.');
            await onRefreshAll();
        } catch (err: unknown) {
            onNotify('error', getErrorMessage(err, 'Lỗi xóa ảnh'));
        }
    };

    const destTags = parseDestinationList(detail.destinations);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-stone-50">
                    <div className="min-w-0 pr-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                            Hồ Sơ Chi Tiết Tour · {detail.tour_type}
                        </span>
                        <h3 className="text-base font-black text-gray-900 truncate">{detail.title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-200/70 text-gray-500 cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Khởi hành từ</span>
                            <strong className="text-gray-900">{detail.departure_location || 'Chưa rõ'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Điểm đến chính</span>
                            <strong className="text-gray-900">{detail.destination || 'Chưa rõ'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Thời lượng</span>
                            <strong className="text-gray-900">{detail.duration || '--'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Phương tiện</span>
                            <strong className="text-gray-900">{detail.vehicle || '--'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Thời điểm lý tưởng</span>
                            <strong className="text-gray-900">{detail.ideal_time || '--'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Ẩm thực đi kèm</span>
                            <strong className="text-gray-900">{detail.food_include || '--'}</strong>
                        </div>
                    </div>

                    {destTags.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Điểm tham quan chi tiết
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {destTags.map((tag, i) => (
                                    <span
                                        key={`${tag}-${i}`}
                                        className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-xs font-semibold"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {detail.description && (
                        <div className="p-4 rounded-xl bg-stone-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
                            {detail.description}
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Lịch Khởi Hành ({detail.tour_departures?.length || 0})
                        </h4>

                        <div className="space-y-2">
                            {(detail.tour_departures || []).map((dep) => (
                                <div
                                    key={dep.id}
                                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 text-xs"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <div>
                                            <p className="font-bold text-gray-900">{formatShortDate(dep.start_date)}</p>
                                            <p className="text-[11px] text-gray-500">Còn {dep.available_seats} chỗ</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right tabular-nums">
                                            <p className="font-black text-gray-900">
                                                {formatCurrency(dep.discount_price ?? dep.price)}
                                            </p>
                                            {dep.discount_price && (
                                                <p className="text-[10px] text-gray-400 line-through">
                                                    {formatCurrency(dep.price)}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDeparture(dep.id)}
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                            title="Xóa đợt khởi hành"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form
                            onSubmit={handleAddDeparture}
                            className="p-3.5 rounded-xl bg-stone-50 border border-dashed border-gray-300 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
                        >
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">Ngày đi *</label>
                                <input
                                    type="date"
                                    required
                                    value={newDepDate}
                                    onChange={(e) => setNewDepDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">Giá gốc *</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    placeholder="4500000"
                                    value={newDepPrice}
                                    onChange={(e) => setNewDepPrice(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">Giá KM</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="3990000"
                                    value={newDepDiscount}
                                    onChange={(e) => setNewDepDiscount(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">Số chỗ *</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    value={newDepSeats}
                                    onChange={(e) => setNewDepSeats(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-3 py-1.5 rounded-lg bg-gray-900 text-[#FACC15] text-xs font-bold hover:bg-black cursor-pointer inline-flex items-center justify-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm lịch</span>
                            </button>
                        </form>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Thư viện ảnh ({detail.tour_images?.length || 0})
                        </h4>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(detail.tour_images || []).map((img) => (
                                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 h-24">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img.url} alt={detail.title} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteImage(img.id)}
                                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Xóa ảnh"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddImage} className="flex gap-2">
                            <input
                                type="url"
                                placeholder="Dán URL hình ảnh mới (https://...)"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                            />
                            <button
                                type="submit"
                                disabled={isSaving || !newImageUrl.trim()}
                                className="px-3.5 py-2 rounded-xl border border-gray-200 hover:border-gray-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>Thêm ảnh</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-stone-50 flex items-center justify-between">
                    <Link
                        href={`/tours/${detail.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem trên trang khách</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEditTour(detail);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-[#FACC15] text-xs font-bold hover:bg-black cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa Tour</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export function TourDetailDrawer(props: TourDetailDrawerProps) {
    if (!props.tour) return null;
    return <TourDetailInner key={props.tour.id} {...props} tour={props.tour} />;
}

/* ============================================================================
 * 5. HOTEL DETAIL DRAWER
 * ============================================================================ */

interface HotelDetailDrawerProps {
    hotel: HotelItem | null;
    onClose: () => void;
    onEditHotel: (hotel: HotelItem) => void;
    onRefreshAll: () => Promise<void>;
    onNotify: (type: 'success' | 'error', msg: string) => void;
}

// (Đã thêm)
function HotelDetailInner({
    hotel,
    onClose,
    onEditHotel,
    onRefreshAll,
    onNotify,
}: Omit<HotelDetailDrawerProps, 'hotel'> & { hotel: HotelItem }) {
    const [detail, setDetail] = useState<HotelItem>(hotel);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        // (Đã thêm)
        const load = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/v1/admin/hotels/${hotel.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok && !cancelled) {
                    const json = await res.json();
                    if (json.data) setDetail(json.data);
                }
            } catch {
                // Keep initial data
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [hotel.id]);

    // (Đã thêm)
    const handleAddImage = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !newImageUrl.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/hotels/${detail.id}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    images: [{ url: newImageUrl.trim(), sort_order: (detail.hotel_images?.length || 0) + 1 }],
                }),
            });
            if (!res.ok) throw new Error('Không thể thêm ảnh khách sạn');
            setNewImageUrl('');
            const refreshed = await fetch(`${API_URL}/api/v1/admin/hotels/${detail.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (refreshed.ok) {
                const json = await refreshed.json();
                if (json.data) setDetail(json.data);
            }
            onNotify('success', 'Đã thêm ảnh cho khách sạn!');
            await onRefreshAll();
        } catch (err: unknown) {
            onNotify('error', getErrorMessage(err, 'Lỗi thêm ảnh'));
        } finally {
            setIsSaving(false);
        }
    };

    // (Đã thêm)
    const handleDeleteImage = async (imgId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/hotel-images/${imgId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Không thể xóa ảnh');
            setDetail((prev) => ({
                ...prev,
                hotel_images: (prev.hotel_images || []).filter((img) => img.id !== imgId),
            }));
            onNotify('success', 'Đã xóa ảnh khách sạn.');
            await onRefreshAll();
        } catch (err: unknown) {
            onNotify('error', getErrorMessage(err, 'Lỗi xóa ảnh'));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-stone-50">
                    <div className="min-w-0 pr-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
                            Chi Tiết Khách Sạn & Resort · {detail.city}
                        </span>
                        <h3 className="text-base font-black text-gray-900 truncate">{detail.name}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-200/70 text-gray-500 cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Hạng sao</span>
                            <strong className="text-amber-600">{detail.star_rating ?? 0} ★</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Giá niêm yết</span>
                            <strong className="text-gray-900 tabular-nums">{formatCurrency(detail.price_per_night)}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Giá ưu đãi</span>
                            <strong className="text-emerald-700 tabular-nums">
                                {detail.discount_price ? formatCurrency(detail.discount_price) : '--'}
                            </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Phòng trống</span>
                            <strong className="text-gray-900">{detail.available_rooms} phòng</strong>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-gray-100 text-xs space-y-1.5">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            <span>{detail.address}</span>
                        </p>
                        {detail.description && <p className="text-gray-600 leading-relaxed">{detail.description}</p>}
                    </div>

                    {detail.amenities && detail.amenities.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Tiện ích nổi bật ({detail.amenities.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {detail.amenities.map((a, idx) => (
                                    <span
                                        key={`${a}-${idx}`}
                                        className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100 text-xs font-semibold"
                                    >
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Thư viện ảnh ({detail.hotel_images?.length || 0})
                        </h4>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(detail.hotel_images || []).map((img) => (
                                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 h-24">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img.url} alt={detail.name} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteImage(img.id)}
                                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddImage} className="flex gap-2">
                            <input
                                type="url"
                                placeholder="Dán URL hình ảnh khách sạn mới..."
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                            />
                            <button
                                type="submit"
                                disabled={isSaving || !newImageUrl.trim()}
                                className="px-3.5 py-2 rounded-xl border border-gray-200 hover:border-gray-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>Thêm ảnh</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-stone-50 flex items-center justify-between">
                    <Link
                        href={`/hotels/${detail.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem trên trang khách</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEditHotel(detail);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-[#FACC15] text-xs font-bold hover:bg-black cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa Khách sạn</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export function HotelDetailDrawer(props: HotelDetailDrawerProps) {
    if (!props.hotel) return null;
    return <HotelDetailInner key={props.hotel.id} {...props} hotel={props.hotel} />;
}

/* ============================================================================
 * 6. USER DETAIL DRAWER
 * ============================================================================ */

interface UserDetailDrawerProps {
    user: UserItem | null;
    itemLookup: Map<string, ResolvedItemMeta>;
    onClose: () => void;
    onEditUser: (user: UserItem) => void;
    onToggleRole: (user: UserItem) => void;
    onResetPassword?: (user: UserItem) => void;
}

// (Đã thêm)
function UserDetailInner({
    user,
    itemLookup,
    onClose,
    onEditUser,
    onToggleRole,
    onResetPassword,
}: Omit<UserDetailDrawerProps, 'user'> & { user: UserItem }) {
    const [detail, setDetail] = useState<UserDetail>(user);

    useEffect(() => {
        let cancelled = false;
        // (Đã thêm)
        const load = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/v1/admin/users/${user.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok && !cancelled) {
                    const json = await res.json();
                    if (json.data) setDetail(json.data);
                }
            } catch {
                // Keep initial user
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [user.id]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-3">
                        <AvatarBadge name={detail.full_name} avatarUrl={detail.avatar_url} size="md" />
                        <div>
                            <h3 className="text-base font-black text-gray-900">{detail.full_name}</h3>
                            <p className="text-xs text-gray-500">{detail.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-200/70 text-gray-500 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Vai trò</span>
                            <strong className="uppercase text-gray-900">{detail.role || 'user'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Nguồn ĐN</span>
                            <strong className="uppercase text-gray-900">{detail.auth_provider || 'local'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Số điện thoại</span>
                            <strong className="text-gray-900">{detail.phone_number || '--'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">Tham gia</span>
                            <strong className="text-gray-900">{formatShortDate(detail.created_at)}</strong>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Lịch sử đặt chỗ gần đây ({detail.bookings?.length || 0})
                        </h4>
                        {detail.bookings && detail.bookings.length > 0 ? (
                            <div className="space-y-2">
                                {detail.bookings.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CopyIdButton value={b.id} displayLength={8} />
                                                <PaymentStatusBadge status={getBookingPrimaryStatus(b)} compact />
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                {formatDate(b.created_at)} · {b.booking_items?.length || 0} dịch vụ
                                            </p>
                                        </div>
                                        <span className="font-black text-gray-900 tabular-nums">
                                            {formatCurrency(b.total_price)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Thành viên này chưa có đơn đặt chỗ nào.</p>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Đánh giá đã gửi ({detail.reviews?.length || 0})
                        </h4>
                        {detail.reviews && detail.reviews.length > 0 ? (
                            <div className="space-y-2">
                                {detail.reviews.map((r, i) => {
                                    const meta = itemLookup.get(`${r.item_type}:${r.item_id}`);
                                    return (
                                        <div key={`${r.item_id}-${i}`} className="p-3 rounded-xl border border-gray-200 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-900">
                                                    {meta?.title || `${getItemTypeLabel(r.item_type)} #${r.item_id.slice(0, 6)}`}
                                                </span>
                                                <span className="text-amber-500 font-black">{r.rating} ★</span>
                                            </div>
                                            {r.comment && <p className="text-gray-600">{r.comment}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Chưa có đánh giá nào.</p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-stone-50 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onToggleRole(detail)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:border-gray-900 text-xs font-bold text-gray-800 cursor-pointer"
                        >
                            <Shield className="w-3.5 h-3.5 text-amber-600" />
                            <span>{detail.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}</span>
                        </button>
                        {onResetPassword && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onResetPassword(detail);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-xs font-bold text-sky-900 cursor-pointer"
                            >
                                <KeyRound className="w-3.5 h-3.5 text-sky-700" />
                                <span>Reset mật khẩu &amp; gửi mail</span>
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEditUser(detail);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-[#FACC15] text-xs font-bold hover:bg-black cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa hồ sơ</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export function UserDetailDrawer(props: UserDetailDrawerProps) {
    if (!props.user) return null;
    return <UserDetailInner key={props.user.id} {...props} user={props.user} />;
}

/* ============================================================================
 * 7. CRUD MODALS: TOUR, HOTEL, FLIGHT, PLANE, USER
 * ============================================================================ */

interface TourFormModalProps {
    isOpen: boolean;
    editingTour: TourItem | null;
    onClose: () => void;
    onSuccess: (msg: string) => Promise<void>;
    onError: (msg: string) => void;
}

// (Đã thêm)
function TourFormInner({
    editingTour,
    onClose,
    onSuccess,
    onError,
}: Omit<TourFormModalProps, 'isOpen'>) {
    const [title, setTitle] = useState(editingTour?.title || '');
    const [tourType, setTourType] = useState(editingTour?.tour_type || 'Khám phá');
    const [duration, setDuration] = useState(editingTour?.duration || '');
    const [departureLocation, setDepartureLocation] = useState(editingTour?.departure_location || '');
    const [destination, setDestination] = useState(editingTour?.destination || '');
    const [destinations, setDestinations] = useState(editingTour?.destinations || '');
    const [vehicle, setVehicle] = useState(editingTour?.vehicle || '');
    const [idealTime, setIdealTime] = useState(editingTour?.ideal_time || '');
    const [foodInclude, setFoodInclude] = useState(editingTour?.food_include || '');
    const [description, setDescription] = useState(editingTour?.description || '');
    const [isTrending, setIsTrending] = useState(Boolean(editingTour?.is_trending));
    const [isSaving, setIsSaving] = useState(false);

    // (Đã thêm)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
        setIsSaving(true);
        try {
            const payload = {
                title: title.trim(),
                tour_type: tourType.trim(),
                duration: duration.trim() || undefined,
                departure_location: departureLocation.trim() || undefined,
                destination: destination.trim() || undefined,
                destinations: destinations.trim() || undefined,
                vehicle: vehicle.trim() || undefined,
                ideal_time: idealTime.trim() || undefined,
                food_include: foodInclude.trim() || undefined,
                description: description.trim() || undefined,
                is_trending: isTrending,
            };
            const url = editingTour
                ? `${API_URL}/api/v1/admin/tours/${editingTour.id}`
                : `${API_URL}/api/v1/admin/tours`;
            const res = await fetch(url, {
                method: editingTour ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi lưu thông tin tour');
            onClose();
            await onSuccess(editingTour ? 'Cập nhật tour thành công!' : 'Đã tạo tour mới thành công!');
        } catch (err: unknown) {
            onError(getErrorMessage(err, 'Không thể lưu tour'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <h3 className="text-base font-black text-gray-900">
                        {editingTour ? 'Chỉnh Sửa Tour Du Lịch' : 'Thêm Tour Du Lịch Mới'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Tiêu đề Tour *</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Loại hình Tour *</label>
                            <input
                                type="text"
                                required
                                value={tourType}
                                onChange={(e) => setTourType(e.target.value)}
                                placeholder="VD: Khám phá, Biển đảo, Nghỉ dưỡng..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Thời lượng</label>
                            <input
                                type="text"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="VD: 3 ngày 2 đêm"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Điểm khởi hành</label>
                            <input
                                type="text"
                                value={departureLocation}
                                onChange={(e) => setDepartureLocation(e.target.value)}
                                placeholder="VD: Hà Nội / TP.HCM"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Điểm đến chính</label>
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="VD: Đà Nẵng"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Phương tiện</label>
                            <input
                                type="text"
                                value={vehicle}
                                onChange={(e) => setVehicle(e.target.value)}
                                placeholder="VD: Máy bay & Xe du lịch"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Thời điểm lý tưởng</label>
                            <input
                                type="text"
                                value={idealTime}
                                onChange={(e) => setIdealTime(e.target.value)}
                                placeholder="VD: Tháng 3 - Tháng 9"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Ẩm thực bao gồm</label>
                            <input
                                type="text"
                                value={foodInclude}
                                onChange={(e) => setFoodInclude(e.target.value)}
                                placeholder="VD: Buffet sáng, 3 bữa chính đặc sản"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Các điểm tham quan (ngăn cách dấu phẩy)</label>
                            <input
                                type="text"
                                value={destinations}
                                onChange={(e) => setDestinations(e.target.value)}
                                placeholder="Bà Nà Hills, Phố cổ Hội An, Cầu Rồng"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Mô tả chi tiết</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <label className="sm:col-span-2 inline-flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isTrending}
                                onChange={(e) => setIsTrending(e.target.checked)}
                                className="rounded"
                            />
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span>Đánh dấu là Tour Thịnh Hành (Trending)</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-gray-900 text-[#FACC15] font-bold hover:bg-black cursor-pointer inline-flex items-center gap-1.5"
                        >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{editingTour ? 'Lưu thay đổi' : 'Tạo Tour mới'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// (Đã thêm)
export function TourFormModal(props: TourFormModalProps) {
    if (!props.isOpen) return null;
    return <TourFormInner key={props.editingTour?.id || 'new-tour'} {...props} />;
}

interface HotelFormModalProps {
    isOpen: boolean;
    editingHotel: HotelItem | null;
    onClose: () => void;
    onSuccess: (msg: string) => Promise<void>;
    onError: (msg: string) => void;
}

// (Đã thêm)
function HotelFormInner({
    editingHotel,
    onClose,
    onSuccess,
    onError,
}: Omit<HotelFormModalProps, 'isOpen'>) {
    const [name, setName] = useState(editingHotel?.name || '');
    const [city, setCity] = useState(editingHotel?.city || '');
    const [address, setAddress] = useState(editingHotel?.address || '');
    const [starRating, setStarRating] = useState(String(editingHotel?.star_rating ?? 5));
    const [pricePerNight, setPricePerNight] = useState(
        editingHotel?.price_per_night ? String(editingHotel.price_per_night) : ''
    );
    const [discountPrice, setDiscountPrice] = useState(
        editingHotel?.discount_price ? String(editingHotel.discount_price) : ''
    );
    const [availableRooms, setAvailableRooms] = useState(String(editingHotel?.available_rooms ?? 10));
    const [amenitiesText, setAmenitiesText] = useState((editingHotel?.amenities || []).join(', '));
    const [description, setDescription] = useState(editingHotel?.description || '');
    const [isTrending, setIsTrending] = useState(Boolean(editingHotel?.is_trending));
    const [isSaving, setIsSaving] = useState(false);

    // (Đã thêm)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
        setIsSaving(true);
        try {
            const payload = {
                name: name.trim(),
                city: city.trim(),
                address: address.trim(),
                star_rating: Number(starRating || 5),
                price_per_night: Number(pricePerNight),
                discount_price: discountPrice ? Number(discountPrice) : undefined,
                available_rooms: Number(availableRooms || 0),
                amenities: amenitiesText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                description: description.trim() || undefined,
                is_trending: isTrending,
            };
            const url = editingHotel
                ? `${API_URL}/api/v1/admin/hotels/${editingHotel.id}`
                : `${API_URL}/api/v1/admin/hotels`;
            const res = await fetch(url, {
                method: editingHotel ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi lưu thông tin khách sạn');
            onClose();
            await onSuccess(editingHotel ? 'Đã cập nhật khách sạn!' : 'Đã thêm khách sạn mới!');
        } catch (err: unknown) {
            onError(getErrorMessage(err, 'Không thể lưu khách sạn'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <h3 className="text-base font-black text-gray-900">
                        {editingHotel ? 'Chỉnh Sửa Khách Sạn' : 'Thêm Khách Sạn Mới'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Tên Khách sạn / Resort *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Thành phố *</label>
                            <input
                                type="text"
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Hạng sao</label>
                            <select
                                value={starRating}
                                onChange={(e) => setStarRating(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-gray-900"
                            >
                                {[5, 4, 3, 2, 1].map((s) => (
                                    <option key={s} value={s}>
                                        {s} Sao
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Địa chỉ chi tiết *</label>
                            <input
                                type="text"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Giá mỗi đêm (VND) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={pricePerNight}
                                onChange={(e) => setPricePerNight(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Giá khuyến mãi (VND)</label>
                            <input
                                type="number"
                                min={0}
                                value={discountPrice}
                                onChange={(e) => setDiscountPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Số phòng trống *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={availableRooms}
                                onChange={(e) => setAvailableRooms(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Tiện ích (phân cách dấu phẩy)</label>
                            <input
                                type="text"
                                value={amenitiesText}
                                onChange={(e) => setAmenitiesText(e.target.value)}
                                placeholder="Wifi, Hồ bơi, Spa, Bữa sáng"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Mô tả</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <label className="sm:col-span-2 inline-flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isTrending}
                                onChange={(e) => setIsTrending(e.target.checked)}
                            />
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span>Đánh dấu Thịnh Hành (Trending)</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-gray-900 text-[#FACC15] font-bold hover:bg-black cursor-pointer inline-flex items-center gap-1.5"
                        >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{editingHotel ? 'Lưu thay đổi' : 'Thêm Khách sạn'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// (Đã thêm)
export function HotelFormModal(props: HotelFormModalProps) {
    if (!props.isOpen) return null;
    return <HotelFormInner key={props.editingHotel?.id || 'new-hotel'} {...props} />;
}

interface FlightFormModalProps {
    isOpen: boolean;
    editingFlight: FlightItem | null;
    planes: PlaneItem[];
    onClose: () => void;
    onSuccess: (msg: string) => Promise<void>;
    onError: (msg: string) => void;
}

// (Đã thêm)
function FlightFormInner({
    editingFlight,
    planes,
    onClose,
    onSuccess,
    onError,
}: Omit<FlightFormModalProps, 'isOpen'>) {
    const [planeId, setPlaneId] = useState(editingFlight?.plane_id || planes[0]?.id || '');
    const [departureAirport, setDepartureAirport] = useState(editingFlight?.departure_airport || '');
    const [arrivalAirport, setArrivalAirport] = useState(editingFlight?.arrival_airport || '');
    const [departureTime, setDepartureTime] = useState(toDateTimeLocalValue(editingFlight?.departure_time));
    const [arrivalTime, setArrivalTime] = useState(toDateTimeLocalValue(editingFlight?.arrival_time));
    const [ticketPrice, setTicketPrice] = useState(
        editingFlight?.ticket_price ? String(editingFlight.ticket_price) : ''
    );
    const [availableSeats, setAvailableSeats] = useState(
        String(editingFlight?.available_seats ?? planes[0]?.total_seats ?? 120)
    );
    const [isSaving, setIsSaving] = useState(false);

    // (Đã thêm)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
        setIsSaving(true);
        try {
            const payload = {
                plane_id: planeId,
                departure_airport: departureAirport.trim(),
                arrival_airport: arrivalAirport.trim(),
                departure_time: new Date(departureTime).toISOString(),
                arrival_time: new Date(arrivalTime).toISOString(),
                ticket_price: Number(ticketPrice),
                available_seats: Number(availableSeats),
            };
            const url = editingFlight
                ? `${API_URL}/api/v1/admin/flights/${editingFlight.id}`
                : `${API_URL}/api/v1/admin/flights`;
            const res = await fetch(url, {
                method: editingFlight ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi lưu chuyến bay');
            onClose();
            await onSuccess(editingFlight ? 'Đã cập nhật chuyến bay!' : 'Đã thêm chuyến bay mới!');
        } catch (err: unknown) {
            onError(getErrorMessage(err, 'Không thể lưu chuyến bay'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <h3 className="text-base font-black text-gray-900">
                        {editingFlight ? 'Chỉnh Sửa Chuyến Bay' : 'Tạo Lịch Chuyến Bay Mới'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">Máy bay khai thác *</label>
                        <select
                            required
                            value={planeId}
                            onChange={(e) => setPlaneId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-gray-900"
                        >
                            {planes.length === 0 && <option value="">Chưa có dữ liệu máy bay</option>}
                            {planes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.airline} · {p.plane_number} ({p.total_seats} ghế)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Sân bay đi *</label>
                            <input
                                type="text"
                                required
                                value={departureAirport}
                                onChange={(e) => setDepartureAirport(e.target.value)}
                                placeholder="Hà Nội (HAN)"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Sân bay đến *</label>
                            <input
                                type="text"
                                required
                                value={arrivalAirport}
                                onChange={(e) => setArrivalAirport(e.target.value)}
                                placeholder="TP. Hồ Chí Minh (SGN)"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Giờ cất cánh *</label>
                            <input
                                type="datetime-local"
                                required
                                value={departureTime}
                                onChange={(e) => setDepartureTime(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Giờ hạ cánh *</label>
                            <input
                                type="datetime-local"
                                required
                                value={arrivalTime}
                                onChange={(e) => setArrivalTime(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Giá vé (VND) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={ticketPrice}
                                onChange={(e) => setTicketPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Số ghế trống *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={availableSeats}
                                onChange={(e) => setAvailableSeats(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !planeId}
                            className="px-5 py-2 rounded-xl bg-gray-900 text-[#FACC15] font-bold hover:bg-black cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{editingFlight ? 'Lưu thay đổi' : 'Tạo Chuyến bay'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// (Đã thêm)
export function FlightFormModal(props: FlightFormModalProps) {
    if (!props.isOpen) return null;
    return <FlightFormInner key={props.editingFlight?.id || 'new-flight'} {...props} />;
}

interface PlaneFormModalProps {
    isOpen: boolean;
    editingPlane: PlaneItem | null;
    onClose: () => void;
    onSuccess: (msg: string) => Promise<void>;
    onError: (msg: string) => void;
}

// (Đã thêm)
function PlaneFormInner({
    editingPlane,
    onClose,
    onSuccess,
    onError,
}: Omit<PlaneFormModalProps, 'isOpen'>) {
    const [airline, setAirline] = useState(editingPlane?.airline || 'Vietnam Airlines');
    const [planeNumber, setPlaneNumber] = useState(editingPlane?.plane_number || '');
    const [totalSeats, setTotalSeats] = useState(String(editingPlane?.total_seats ?? 180));
    const [isSaving, setIsSaving] = useState(false);

    // (Đã thêm)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
        setIsSaving(true);
        try {
            const payload = {
                airline: airline.trim(),
                plane_number: planeNumber.trim().toUpperCase(),
                total_seats: Number(totalSeats),
            };
            const url = editingPlane
                ? `${API_URL}/api/v1/admin/planes/${editingPlane.id}`
                : `${API_URL}/api/v1/admin/planes`;
            const res = await fetch(url, {
                method: editingPlane ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi lưu thông tin máy bay');
            onClose();
            await onSuccess(editingPlane ? 'Đã cập nhật máy bay!' : 'Đã thêm máy bay vào đội bay!');
        } catch (err: unknown) {
            onError(getErrorMessage(err, 'Không thể lưu máy bay'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <h3 className="text-base font-black text-gray-900">
                        {editingPlane ? 'Chỉnh Sửa Máy Bay' : 'Thêm Máy Bay Mới'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div className="flex items-center gap-3">
                        <AirlineLogoBadge airlineName={airline} size="sm" />
                        <div className="flex-1">
                            <label className="font-bold text-gray-700 block mb-1">Hãng hàng không *</label>
                            <input
                                type="text"
                                required
                                value={airline}
                                onChange={(e) => setAirline(e.target.value)}
                                placeholder="Vietnam Airlines, Vietjet Air, Bamboo Airways..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">Số hiệu tàu bay *</label>
                        <input
                            type="text"
                            required
                            value={planeNumber}
                            onChange={(e) => setPlaneNumber(e.target.value)}
                            placeholder="VD: VN-A868"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono uppercase focus:outline-none focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">Tổng sức chứa (ghế) *</label>
                        <input
                            type="number"
                            required
                            min={1}
                            value={totalSeats}
                            onChange={(e) => setTotalSeats(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-gray-900 text-[#FACC15] font-bold hover:bg-black cursor-pointer inline-flex items-center gap-1.5"
                        >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{editingPlane ? 'Lưu thay đổi' : 'Thêm Máy bay'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// (Đã thêm)
export function PlaneFormModal(props: PlaneFormModalProps) {
    if (!props.isOpen) return null;
    return <PlaneFormInner key={props.editingPlane?.id || 'new-plane'} {...props} />;
}

interface UserFormModalProps {
    isOpen: boolean;
    editingUser: UserItem | null;
    onClose: () => void;
    onSuccess: (msg: string) => Promise<void>;
    onError: (msg: string) => void;
}

// (Đã thêm)
function UserFormInner({
    editingUser,
    onClose,
    onSuccess,
    onError,
}: Omit<UserFormModalProps, 'isOpen'>) {
    const [fullName, setFullName] = useState(editingUser?.full_name || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(editingUser?.phone_number || '');
    const [role, setRole] = useState<'user' | 'admin'>(editingUser?.role === 'admin' ? 'admin' : 'user');
    const [password, setPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(editingUser?.avatar_url || '');
    const [isSaving, setIsSaving] = useState(false);

    // (Đã thêm)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
        setIsSaving(true);
        try {
            const payload: Record<string, string | undefined> = {
                full_name: fullName.trim(),
                email: email.trim(),
                phone_number: phoneNumber.trim() || undefined,
                role,
                avatar_url: avatarUrl.trim() || undefined,
            };
            if (password.trim()) {
                payload.password = password.trim();
            }
            const url = editingUser
                ? `${API_URL}/api/v1/admin/users/${editingUser.id}`
                : `${API_URL}/api/v1/admin/users`;
            const res = await fetch(url, {
                method: editingUser ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi lưu tài khoản người dùng');
            onClose();
            await onSuccess(editingUser ? 'Đã cập nhật thông tin thành viên!' : 'Đã tạo tài khoản thành viên mới!');
        } catch (err: unknown) {
            onError(getErrorMessage(err, 'Không thể lưu người dùng'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <h3 className="text-base font-black text-gray-900">
                        {editingUser ? 'Chỉnh Sửa Thành Viên' : 'Tạo Tài Khoản Mới'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">Họ & Tên *</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Vai trò</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value === 'admin' ? 'admin' : 'user')}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-gray-900"
                            >
                                <option value="user">User (Khách hàng)</option>
                                <option value="admin">Admin (Quản trị)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">
                            {editingUser ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu *'}
                        </label>
                        <input
                            type="password"
                            required={!editingUser}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tối thiểu 8 ký tự: chữ hoa, thường, số, ký tự đặc biệt"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 block mb-1">URL Ảnh đại diện</label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-gray-900 text-[#FACC15] font-bold hover:bg-black cursor-pointer inline-flex items-center gap-1.5"
                        >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// (Đã thêm)
export function UserFormModal(props: UserFormModalProps) {
    if (!props.isOpen) return null;
    return <UserFormInner key={props.editingUser?.id || 'new-user'} {...props} />;
}

/* ============================================================================
 * 8. RESET USER PASSWORD & SEND EMAIL MODAL
 * ============================================================================ */

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

// (Đã thêm)
const generateStrongPasswordSuggestion = (length = 12): string => {
    const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijkmnpqrstuvwxyz';
    const digitChars = '23456789';
    const specialChars = '@#$%&*!?';
    const allChars = upperChars + lowerChars + digitChars + specialChars;

    const getSecureIndex = (max: number): number => {
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
            const arr = new Uint32Array(1);
            const limit = Math.floor(0x100000000 / max) * max;
            let rand = 0;
            do {
                window.crypto.getRandomValues(arr);
                rand = arr[0];
            } while (rand >= limit);
            return rand % max;
        }
        return Math.floor(Math.random() * max);
    };

    const chars = [
        upperChars[getSecureIndex(upperChars.length)],
        lowerChars[getSecureIndex(lowerChars.length)],
        digitChars[getSecureIndex(digitChars.length)],
        specialChars[getSecureIndex(specialChars.length)],
    ];

    for (let i = chars.length; i < Math.max(8, length); i++) {
        chars.push(allChars[getSecureIndex(allChars.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
        const j = getSecureIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
};

interface ResetUserPasswordModalProps {
    user: UserItem | null;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

// (Đã thêm)
export function ResetUserPasswordModal({
    user,
    onClose,
    onSuccess,
    onError,
}: ResetUserPasswordModalProps) {
    const [mode, setMode] = useState<'auto' | 'custom'>('auto');
    const [customPassword, setCustomPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [user, isSubmitting, onClose]);

    if (!user) return null;

    // (Đã thêm)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (mode === 'custom') {
            if (!customPassword) {
                setModalError('Vui lòng nhập mật khẩu mới hoặc chọn chế độ tạo ngẫu nhiên.');
                return;
            }
            if (/\s/.test(customPassword) || !STRONG_PASSWORD_REGEX.test(customPassword)) {
                setModalError(
                    'Mật khẩu phải có tối thiểu 8 ký tự, không chứa khoảng trắng, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.'
                );
                return;
            }
        }

        const token = localStorage.getItem('token');
        if (!token) {
            const msg = 'Phiên đăng nhập quản trị đã hết hạn. Vui lòng đăng nhập lại.';
            setModalError(msg);
            onError(msg);
            return;
        }

        setIsSubmitting(true);
        setModalError(null);

        try {
            const payload = mode === 'custom' ? { newPassword: customPassword } : {};
            const res = await fetch(`${API_URL}/api/v1/admin/users/${user.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const json = (await res.json().catch(() => ({}))) as {
                message?: string;
                data?: { email?: string };
            };

            if (!res.ok) {
                const errMsg = json.message || 'Không thể đặt lại mật khẩu và gửi email cho người dùng.';
                setModalError(errMsg);
                onError(errMsg);
                return;
            }

            const targetEmail = json.data?.email || user.email;
            onClose();
            onSuccess(
                json.message || `Đã đặt lại mật khẩu cho "${user.full_name}" và gửi email tới ${targetEmail}!`
            );
        } catch {
            const msg = 'Không thể kết nối đến máy chủ khi thực hiện đặt lại mật khẩu.';
            setModalError(msg);
            onError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-modal-title"
            onClick={() => {
                if (!isSubmitting) onClose();
            }}
        >
            <div
                className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-900 text-[#FACC15] flex items-center justify-center shrink-0">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                                Bảo mật tài khoản
                            </span>
                            <h3 id="reset-password-modal-title" className="text-base font-black text-gray-900">
                                Đặt Lại Mật Khẩu &amp; Gửi Email
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer disabled:opacity-40"
                        aria-label="Đóng modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    {/* Thông tin tài khoản */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-gray-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <AvatarBadge name={user.full_name} avatarUrl={user.avatar_url} size="sm" />
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{user.full_name}</p>
                                <p className="text-[11px] font-mono text-gray-600 truncate flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-amber-700 shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-800 shrink-0">
                            {(user.role || 'user').toUpperCase()}
                        </span>
                    </div>

                    {/* Cảnh báo OAuth nếu cần */}
                    {user.auth_provider && user.auth_provider !== 'local' && (
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] leading-relaxed flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                            <span>
                                Tài khoản này đang đăng nhập qua <strong>{user.auth_provider.toUpperCase()}</strong>. Đặt lại mật khẩu sẽ thiết lập thêm mật khẩu cục bộ để người dùng có thể đăng nhập bằng email và mật khẩu mới.
                            </span>
                        </div>
                    )}

                    {/* Chế độ đặt lại mật khẩu */}
                    <div className="space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                            Phương thức tạo mật khẩu mới
                        </span>

                        <label
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                mode === 'auto'
                                    ? 'border-gray-900 bg-amber-50/50'
                                    : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="radio"
                                name="resetPasswordMode"
                                checked={mode === 'auto'}
                                onChange={() => {
                                    setMode('auto');
                                    setModalError(null);
                                }}
                                disabled={isSubmitting}
                                className="mt-0.5 accent-gray-900"
                            />
                            <div>
                                <p className="font-bold text-gray-900">
                                    Tự động tạo mật khẩu ngẫu nhiên (Khuyên dùng)
                                </p>
                                <p className="text-[11px] text-gray-600 mt-0.5">
                                    Hệ thống tự sinh mật khẩu mạnh 12 ký tự, cập nhật và gửi trực tiếp đến email của người dùng.
                                </p>
                            </div>
                        </label>

                        <label
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                mode === 'custom'
                                    ? 'border-gray-900 bg-amber-50/50'
                                    : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="radio"
                                name="resetPasswordMode"
                                checked={mode === 'custom'}
                                onChange={() => {
                                    setMode('custom');
                                    setModalError(null);
                                }}
                                disabled={isSubmitting}
                                className="mt-0.5 accent-gray-900"
                            />
                            <div>
                                <p className="font-bold text-gray-900">
                                    Nhập mật khẩu mới thủ công
                                </p>
                                <p className="text-[11px] text-gray-600 mt-0.5">
                                    Admin tự chỉ định mật khẩu mới; hệ thống sẽ lưu và gửi mật khẩu này qua email người dùng.
                                </p>
                            </div>
                        </label>
                    </div>

                    {mode === 'custom' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="admin-custom-reset-password"
                                    className="font-bold text-gray-700"
                                >
                                    Mật khẩu mới *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomPassword(generateStrongPasswordSuggestion(12));
                                        setShowPassword(true);
                                        setModalError(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-gray-900 cursor-pointer"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Tạo gợi ý mạnh</span>
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    id="admin-custom-reset-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={customPassword}
                                    onChange={(e) => {
                                        setCustomPassword(e.target.value);
                                        if (modalError) setModalError(null);
                                    }}
                                    placeholder="VD: Natura@2026"
                                    disabled={isSubmitting}
                                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-gray-200 font-mono focus:outline-none focus:border-gray-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-900 cursor-pointer"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Tối thiểu 8 ký tự, không khoảng trắng, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                            </p>
                        </div>
                    )}

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                        Mật khẩu hiện tại của tài khoản sẽ được thay thế ngay lập tức và mật khẩu mới sẽ được gửi tới{' '}
                        <strong className="font-mono">{user.email}</strong>. Nếu gửi email thất bại, mật khẩu cũ sẽ được giữ nguyên.
                    </div>

                    {modalError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{modalError}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-xl bg-gray-900 text-[#FACC15] font-bold hover:bg-black cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang gửi email...</span>
                                </>
                            ) : (
                                <>
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Xác nhận &amp; Gửi Mail</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
