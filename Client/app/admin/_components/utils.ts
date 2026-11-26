import type {
    BookingItem,
    FlightItem,
    HotelItem,
    PaymentStatusType,
    ResolvedItemMeta,
    SortConfig,
    TourItem,
} from './types';

// (Đã thêm)
export const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'string' && err) return err;
    return fallback;
};

// (Đã thêm)
export const formatCurrency = (amount: number | string | undefined | null): string => {
    const numeric = Number(amount || 0);
    if (!Number.isFinite(numeric)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(numeric);
};

// (Đã thêm)
export const formatCompactCurrency = (amount: number | string | undefined | null): string => {
    const num = Number(amount || 0);
    if (!Number.isFinite(num)) return '0 ₫';
    if (Math.abs(num) >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} Tỷ`;
    }
    if (Math.abs(num) >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')} Tr`;
    }
    if (Math.abs(num) >= 1_000) {
        return `${Math.round(num / 1_000)}K`;
    }
    return `${num} ₫`;
};

// (Đã thêm)
export const formatDate = (isoString: string | undefined | null): string => {
    if (!isoString) return '--/--/----';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// (Đã thêm)
export const formatShortDate = (isoString: string | undefined | null): string => {
    if (!isoString) return '--/--/----';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// (Đã thêm)
export const formatDurationBetween = (startIso?: string | null, endIso?: string | null): string => {
    if (!startIso || !endIso) return '--';
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '--';
    const totalMinutes = Math.round((end - start) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}g ${mins}p` : `${mins}p`;
};

// (Đã thêm)
export const getDurationMinutes = (startIso?: string | null, endIso?: string | null): number => {
    if (!startIso || !endIso) return 0;
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    return Math.round((end - start) / 60000);
};

// (Đã thêm)
export const normalizeSearchText = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .toLowerCase()
        .trim();
};

// (Đã thêm)
export const matchesSearch = (query: string, fields: Array<unknown>): boolean => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;

    const haystack = fields
        .map((field) => {
            if (Array.isArray(field)) return field.map(normalizeSearchText).join(' ');
            return normalizeSearchText(field);
        })
        .filter(Boolean)
        .join(' ');

    if (!haystack) return false;
    if (haystack.includes(normalizedQuery)) return true;

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return tokens.every((token) => haystack.includes(token));
};

// (Đã thêm)
export const toTimestamp = (isoString: string | undefined | null): number | null => {
    if (!isoString) return null;
    const t = Date.parse(isoString);
    return Number.isNaN(t) ? null : t;
};

// (Đã thêm)
export const sortItems = <T, K extends string>(
    items: T[],
    sortConfig: SortConfig<K> | null,
    accessors: Record<K, (item: T) => string | number | boolean | null | undefined>
): T[] => {
    if (!sortConfig) return items;
    const getter = accessors[sortConfig.key];
    if (!getter) return items;

    const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
        const valA = getter(a);
        const valB = getter(b);

        const emptyA = valA === null || valA === undefined || valA === '';
        const emptyB = valB === null || valB === undefined || valB === '';
        if (emptyA && emptyB) return 0;
        if (emptyA) return 1;
        if (emptyB) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * multiplier;
        }

        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            return (Number(valA) - Number(valB)) * multiplier;
        }

        const strA = String(valA);
        const strB = String(valB);
        return strA.localeCompare(strB, 'vi', { numeric: true, sensitivity: 'base' }) * multiplier;
    });
};

// (Đã thêm)
export const getPaymentStatusMeta = (
    status?: PaymentStatusType | string | null
): {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
    normalized: string;
} => {
    const normalized = (status || 'pending').toLowerCase();
    switch (normalized) {
        case 'paid':
            return {
                label: 'Đã thanh toán',
                shortLabel: 'Đã trả',
                badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                dotClass: 'bg-emerald-500',
                normalized,
            };
        case 'refund_requested':
            return {
                label: 'Yêu cầu hoàn tiền',
                shortLabel: 'Chờ hoàn',
                badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
                dotClass: 'bg-violet-500',
                normalized,
            };
        case 'refunded':
            return {
                label: 'Đã hoàn tiền',
                shortLabel: 'Đã hoàn',
                badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
                dotClass: 'bg-sky-500',
                normalized,
            };
        case 'failed':
        case 'cancelled':
            return {
                label: 'Đã hủy / Thất bại',
                shortLabel: 'Thất bại',
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                dotClass: 'bg-rose-500',
                normalized,
            };
        default:
            return {
                label: 'Chờ thanh toán',
                shortLabel: 'Chờ TT',
                badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
                dotClass: 'bg-amber-500',
                normalized: 'pending',
            };
    }
};

// (Đã thêm)
export const getItemTypeLabel = (itemType: string): string => {
    switch (itemType) {
        case 'tour':
            return 'Tour du lịch';
        case 'hotel':
            return 'Khách sạn';
        case 'flight':
            return 'Chuyến bay';
        default:
            return itemType || 'Dịch vụ';
    }
};

// (Đã thêm)
export const getTourMinPrice = (tour: TourItem): number => {
    const deps = tour.tour_departures || [];
    if (deps.length === 0) return 0;
    return Math.min(...deps.map((d) => Number(d.discount_price ?? d.price ?? 0)));
};

// (Đã thêm)
export const getTourTotalSeats = (tour: TourItem): number => {
    const deps = tour.tour_departures || [];
    return deps.reduce((sum, d) => sum + Number(d.available_seats || 0), 0);
};

// (Đã thêm)
export const getNextDepartureDate = (tour: TourItem): string | null => {
    const deps = tour.tour_departures || [];
    if (deps.length === 0) return null;
    const now = Date.now();
    const upcoming = deps
        .map((d) => d.start_date)
        .filter((s) => {
            const t = Date.parse(s);
            return !Number.isNaN(t) && t >= now - 86_400_000;
        })
        .sort((a, b) => Date.parse(a) - Date.parse(b));
    return upcoming[0] || deps[0]?.start_date || null;
};

// (Đã thêm)
export const getBookingPrimaryStatus = (booking: BookingItem): string => {
    const payments = booking.payments || [];
    if (payments.length === 0) return 'pending';
    if (payments.some((p) => p.payment_status === 'paid')) return 'paid';
    if (payments.some((p) => p.payment_status === 'refund_requested')) return 'refund_requested';
    if (payments.some((p) => p.payment_status === 'refunded')) return 'refunded';
    return payments[0]?.payment_status || 'pending';
};

// (Đã thêm)
export const buildItemLookupMap = (
    tours: TourItem[],
    hotels: HotelItem[],
    flights: FlightItem[]
): Map<string, ResolvedItemMeta> => {
    const map = new Map<string, ResolvedItemMeta>();

    for (const t of tours) {
        const meta: ResolvedItemMeta = {
            title: t.title,
            subtitle: t.destination ? `Tour · ${t.destination}` : 'Tour du lịch',
            href: `/tours/${t.id}`,
        };
        map.set(`tour:${t.id}`, meta);
        for (const dep of t.tour_departures || []) {
            map.set(`tour:${dep.id}`, {
                title: t.title,
                subtitle: `Khởi hành ${formatShortDate(dep.start_date)} · ${t.destination || t.tour_type}`,
                href: `/tours/${t.id}`,
            });
        }
    }

    for (const h of hotels) {
        map.set(`hotel:${h.id}`, {
            title: h.name,
            subtitle: `${h.city} · ${h.star_rating ?? 0}★`,
            href: `/hotels/${h.id}`,
        });
    }

    for (const f of flights) {
        map.set(`flight:${f.id}`, {
            title: `${f.departure_airport} → ${f.arrival_airport}`,
            subtitle: `${f.planes?.airline || 'Hãng bay'} (${f.planes?.plane_number || '---'})`,
            href: `/flights/${f.id}`,
        });
    }

    return map;
};

// (Đã thêm)
export const parseDestinationList = (dest: string | null | undefined): string[] => {
    if (!dest) return [];
    const trimmed = dest.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
        } catch {
            // Fallback to delimiter split
        }
    }
    return trimmed
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
};

// (Đã thêm)
export const exportToCsv = (filename: string, headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) => {
    const escapeCell = (val: unknown) => {
        const str = val === null || val === undefined ? '' : String(val);
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
    };
    const csvContent = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
