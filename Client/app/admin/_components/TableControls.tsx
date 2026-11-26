'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Copy,
    Download,
    Flame,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import type { SortConfig } from './types';
import { getPaymentStatusMeta } from './utils';

export interface QuickChipOption {
    id: string;
    label: string;
    count?: number;
    tone?: 'default' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
}

export interface SortableOption<K extends string = string> {
    key: K;
    label: string;
}

// (Đã thêm)
export function cycleSortConfig<K extends string>(
    current: SortConfig<K> | null,
    key: K
): SortConfig<K> | null {
    if (!current || current.key !== key) {
        return { key, direction: 'asc' };
    }
    if (current.direction === 'asc') {
        return { key, direction: 'desc' };
    }
    return null;
}

interface SortableThProps<K extends string> {
    label: string;
    sortKey: K;
    sortConfig: SortConfig<K> | null;
    onSort: (key: K) => void;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

// (Đã thêm)
export function SortableTh<K extends string>({
    label,
    sortKey,
    sortConfig,
    onSort,
    align = 'left',
    className = '',
}: SortableThProps<K>) {
    const isActive = sortConfig?.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    const justifyClass =
        align === 'right' ? 'justify-end text-right' : align === 'center' ? 'justify-center text-center' : 'justify-start text-left';

    const titleText = !isActive
        ? `Sắp xếp theo "${label}" (Tăng dần)`
        : direction === 'asc'
        ? `Đang sắp xếp tăng dần · Bấm để sắp xếp giảm dần`
        : `Đang sắp xếp giảm dần · Bấm để bỏ sắp xếp`;

    return (
        <th
            scope="col"
            className={`px-3.5 py-3 select-none whitespace-nowrap transition-colors ${
                isActive ? 'bg-amber-50/90 text-gray-900' : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'
            } ${className}`}
        >
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                title={titleText}
                className={`w-full inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer group ${justifyClass}`}
            >
                <span>{label}</span>
                <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded transition-colors ${
                        isActive
                            ? 'bg-amber-400 text-black'
                            : 'text-gray-300 group-hover:text-gray-600 group-hover:bg-gray-200/70'
                    }`}
                >
                    {direction === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                    ) : direction === 'desc' ? (
                        <ArrowDown className="w-3 h-3" />
                    ) : (
                        <ArrowUpDown className="w-3 h-3" />
                    )}
                </span>
            </button>
        </th>
    );
}

interface SearchFilterToolbarProps<K extends string> {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    placeholder: string;
    totalCount: number;
    filteredCount: number;
    quickChips?: QuickChipOption[];
    activeChip?: string;
    onChipChange?: (chipId: string) => void;
    sortConfig?: SortConfig<K> | null;
    sortOptions?: Array<SortableOption<K>>;
    onClearSort?: () => void;
    onSelectSort?: (config: SortConfig<K> | null) => void;
    extraFilters?: React.ReactNode;
    hasActiveExtraFilters?: boolean;
    onResetAll?: () => void;
    onExportCsv?: () => void;
    primaryAction?: {
        label: string;
        onClick: () => void;
    };
}

// (Đã thêm)
export function SearchFilterToolbar<K extends string>({
    searchQuery,
    onSearchChange,
    placeholder,
    totalCount,
    filteredCount,
    quickChips,
    activeChip,
    onChipChange,
    sortConfig,
    sortOptions,
    onClearSort,
    onSelectSort,
    extraFilters,
    hasActiveExtraFilters = false,
    onResetAll,
    onExportCsv,
    primaryAction,
}: SearchFilterToolbarProps<K>) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
                return;
            }
            event.preventDefault();
            inputRef.current?.focus();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const activeSortLabel = sortConfig
        ? sortOptions?.find((opt) => opt.key === sortConfig.key)?.label || sortConfig.key
        : null;

    const hasAnyFilter =
        searchQuery.trim().length > 0 ||
        (activeChip && activeChip !== 'all') ||
        Boolean(sortConfig) ||
        hasActiveExtraFilters;

    const chipToneClasses = (tone: QuickChipOption['tone'], isActive: boolean) => {
        if (isActive) {
            switch (tone) {
                case 'emerald':
                    return 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
                case 'amber':
                    return 'bg-amber-500 text-black border-amber-500 shadow-xs';
                case 'rose':
                    return 'bg-rose-600 text-white border-rose-600 shadow-xs';
                case 'violet':
                    return 'bg-violet-600 text-white border-violet-600 shadow-xs';
                case 'sky':
                    return 'bg-sky-600 text-white border-sky-600 shadow-xs';
                default:
                    return 'bg-gray-900 text-[#FACC15] border-gray-900 shadow-xs';
            }
        }
        return 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900';
    };

    return (
        <div className="space-y-3.5 pb-4 border-b border-gray-100">
            {/* Row 1: Search bar + Extra filters + Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                {/* Smart Search Input */}
                <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && searchQuery) {
                                e.stopPropagation();
                                onSearchChange('');
                            }
                        }}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-20 py-2.5 bg-stone-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-amber-400/30 transition-all"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="p-1 rounded-lg bg-gray-200/80 hover:bg-gray-300 text-gray-700 transition-colors cursor-pointer"
                                title="Xóa từ khóa (Esc)"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <kbd
                                className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-white border border-gray-200 rounded"
                                title="Nhấn / để tìm nhanh"
                            >
                                /
                            </kbd>
                        )}
                    </div>
                </div>

                {/* Extra filters + Sort dropdown + Action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {extraFilters}

                    {sortOptions && sortOptions.length > 0 && onSelectSort && (
                        <div className="inline-flex items-center gap-1.5 bg-stone-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <select
                                aria-label="Sắp xếp nhanh"
                                value={sortConfig ? `${sortConfig.key}:${sortConfig.direction}` : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                        onSelectSort(null);
                                        return;
                                    }
                                    const [k, dir] = val.split(':');
                                    onSelectSort({
                                        key: k as K,
                                        direction: dir === 'desc' ? 'desc' : 'asc',
                                    });
                                }}
                                className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer pr-1"
                            >
                                <option value="">Sắp xếp mặc định</option>
                                {sortOptions.map((opt) => (
                                    <React.Fragment key={opt.key}>
                                        <option value={`${opt.key}:asc`}>{opt.label} (↑ Tăng dần)</option>
                                        <option value={`${opt.key}:desc`}>{opt.label} (↓ Giảm dần)</option>
                                    </React.Fragment>
                                ))}
                            </select>
                        </div>
                    )}

                    {onExportCsv && (
                        <button
                            type="button"
                            onClick={onExportCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-stone-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                            title="Xuất dữ liệu đang lọc ra file CSV (Excel)"
                        >
                            <Download className="w-3.5 h-3.5 text-gray-500" />
                            <span>Xuất CSV</span>
                        </button>
                    )}

                    {primaryAction && (
                        <button
                            type="button"
                            onClick={primaryAction.onClick}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-[#FACC15] text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{primaryAction.label}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Quick Filter Chips + Active Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {quickChips && quickChips.length > 0 && onChipChange ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {quickChips.map((chip) => {
                            const isActive = activeChip === chip.id;
                            return (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={() => onChipChange(chip.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${chipToneClasses(
                                        chip.tone,
                                        isActive
                                    )}`}
                                >
                                    <span>{chip.label}</span>
                                    {chip.count !== undefined && (
                                        <span
                                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                                                isActive ? 'bg-black/15 text-current' : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {chip.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div />
                )}

                {/* Result counter & active sort / reset tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 shrink-0">
                    <span>
                        Hiển thị <strong className="text-gray-900 tabular-nums">{filteredCount}</strong> /{' '}
                        <span className="tabular-nums">{totalCount}</span> mục
                    </span>

                    {activeSortLabel && sortConfig && onClearSort && (
                        <button
                            type="button"
                            onClick={onClearSort}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200 text-[11px] font-bold hover:bg-amber-200/80 transition-colors cursor-pointer"
                            title="Bấm để bỏ sắp xếp cột này"
                        >
                            <span>
                                Sort: {activeSortLabel} {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                            <X className="w-3 h-3" />
                        </button>
                    )}

                    {hasAnyFilter && onResetAll && (
                        <button
                            type="button"
                            onClick={onResetAll}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Đặt lại</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface PaginationBarProps {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

// (Đã thêm)
export function PaginationBar({
    currentPage,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
}: PaginationBarProps) {
    const effectiveSize = pageSize <= 0 ? Math.max(1, totalItems) : pageSize;
    const totalPages = Math.max(1, Math.ceil(totalItems / effectiveSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const startIdx = totalItems === 0 ? 0 : (safePage - 1) * effectiveSize + 1;
    const endIdx = Math.min(totalItems, safePage * effectiveSize);

    const getVisiblePages = (): Array<number | '...'> => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: Array<number | '...'> = [1];
        if (safePage > 3) pages.push('...');
        const start = Math.max(2, safePage - 1);
        const end = Math.min(totalPages - 1, safePage + 1);
        for (let p = start; p <= end; p++) pages.push(p);
        if (safePage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-3">
                <span>
                    Dòng <strong className="text-gray-900 tabular-nums">{startIdx}</strong>–
                    <strong className="text-gray-900 tabular-nums">{endIdx}</strong> trong{' '}
                    <strong className="text-gray-900 tabular-nums">{totalItems}</strong>
                </span>
                <label className="inline-flex items-center gap-1.5">
                    <span className="text-gray-400">Hiển thị:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            onPageSizeChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
                    >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                        <option value={0}>Tất cả</option>
                    </select>
                </label>
            </div>

            {pageSize > 0 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onPageChange(1)}
                        disabled={safePage <= 1}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        title="Trang đầu"
                    >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onPageChange(safePage - 1)}
                        disabled={safePage <= 1}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        title="Trang trước"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {getVisiblePages().map((p, idx) =>
                        p === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                                    p === safePage
                                        ? 'bg-gray-900 text-[#FACC15]'
                                        : 'border border-gray-200 hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        onClick={() => onPageChange(safePage + 1)}
                        disabled={safePage >= totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        title="Trang sau"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onPageChange(totalPages)}
                        disabled={safePage >= totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                        title="Trang cuối"
                    >
                        <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

// (Đã thêm)
export function PaymentStatusBadge({
    status,
    compact = false,
}: {
    status?: string | null;
    compact?: boolean;
}) {
    const meta = getPaymentStatusMeta(status);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${meta.badgeClass}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
            <span>{compact ? meta.shortLabel : meta.label}</span>
        </span>
    );
}

// (Đã thêm)
export function TrendingToggleButton({
    isTrending,
    onClick,
    disabled = false,
}: {
    isTrending?: boolean | null;
    onClick: () => void;
    disabled?: boolean;
}) {
    const active = Boolean(isTrending);
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                active
                    ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-black shadow-xs hover:brightness-95'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
            }`}
        >
            <Flame className={`w-3.5 h-3.5 ${active ? 'fill-amber-600 text-amber-800' : ''}`} />
            <span>{active ? 'Thịnh hành' : 'Thường'}</span>
        </button>
    );
}

// (Đã thêm)
export function AvatarBadge({
    name,
    avatarUrl,
    size = 'md',
}: {
    name?: string | null;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
}) {
    const [imgFailed, setImgFailed] = useState(false);
    const sizeCls =
        size === 'lg' ? 'w-12 h-12 text-sm' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
    const initials = (name || 'U')
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('');

    if (avatarUrl && !imgFailed) {
        return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={avatarUrl}
                alt={name || 'Avatar'}
                onError={() => setImgFailed(true)}
                className={`${sizeCls} rounded-full object-cover border border-gray-200 shrink-0`}
            />
        );
    }

    return (
        <div
            className={`${sizeCls} rounded-full bg-gradient-to-br from-gray-800 to-gray-950 text-[#FACC15] font-black flex items-center justify-center shrink-0 border border-gray-700/40`}
        >
            {initials || 'U'}
        </div>
    );
}

// (Đã thêm)
export function CopyIdButton({ value, displayLength = 8 }: { value: string; displayLength?: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        } catch {
            // Clipboard fallback ignored
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={`Bấm để sao chép ID: ${value}`}
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-gray-700 hover:text-black bg-stone-100 hover:bg-amber-100/70 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
        >
            <span>{value.slice(0, displayLength)}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
        </button>
    );
}

// (Đã thêm)
export function EmptyTableRow({
    colSpan,
    message,
    onReset,
}: {
    colSpan: number;
    message: string;
    onReset?: () => void;
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-6 py-14 text-center">
                <div className="max-w-sm mx-auto space-y-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-stone-100 text-gray-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">{message}</p>
                    {onReset && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-[#FACC15] text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Xóa bộ lọc để xem tất cả
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
