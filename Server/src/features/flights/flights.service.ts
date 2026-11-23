import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface FlightFilterParams {
    page: number;
    limit: number;
    departure_airport?: string;
    arrival_airport?: string;
    departure_date?: string;
    airline?: string;
    passengers?: number;
    min_price?: number;
    max_price?: number;
    sort?: 'price_asc' | 'price_desc' | 'departure_asc';
}

// (Đã thêm)
const getPagination = (pageInput: number, limitInput: number) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/* ============================== AIRPORT RESOLVER HELPERS ============================== */

export const AIRPORT_FULL_NAMES: Record<string, string> = {
    'HAN': 'Hà Nội - Sân bay Nội Bài (HAN)',
    'SGN': 'TP. Hồ Chí Minh - Sân bay Tân Sơn Nhất (SGN)',
    'DAD': 'Đà Nẵng - Sân bay Đà Nẵng (DAD)',
    'CXR': 'Nha Trang - Sân bay Cam Ranh (CXR)',
    'PQC': 'Phú Quốc - Sân bay Phú Quốc (PQC)',
    'HPH': 'Hải Phòng - Sân bay Cát Bi (HPH)',
    'HUI': 'Huế - Sân bay Phú Bài (HUI)',
    'DLI': 'Đà Lạt - Sân bay Liên Khương (DLI)',
    'VCA': 'Cần Thơ - Sân bay Cần Thơ (VCA)',
    'UIH': 'Quy Nhơn - Sân bay Phù Cát (UIH)',
    'VII': 'Vinh - Sân bay Vinh (VII)',
    'BMV': 'Buôn Ma Thuột - Sân bay Buôn Ma Thuột (BMV)',
    'VCL': 'Chu Lai - Sân bay Chu Lai (VCL)',
    'PXU': 'Pleiku - Sân bay Pleiku (PXU)',
    'VCS': 'Côn Đảo - Sân bay Côn Đảo (VCS)',
    'VDH': 'Quảng Bình - Sân bay Đồng Hới (VDH)',
    'VDO': 'Vân Đồn - Sân bay Vân Đồn (VDO)',
};

const AIRPORT_RULES: Array<{ keywords?: string[]; codes?: string[]; matcher?: (norm: string) => string[] | null }> = [
    { keywords: ['vinh ha long', 'ha long', 'quang ninh', 'van don'], codes: ['HPH', 'VDO'] },
    { keywords: ['da nang', 'danang', 'hoi an'], codes: ['DAD'] },
    { keywords: ['phu quoc', 'dao ngoc'], codes: ['PQC'] },
    { keywords: ['nha trang', 'cam ranh', 'khanh hoa'], codes: ['CXR'] },
    { keywords: ['ha noi', 'hanoi', 'noi bai', 'thu do'], codes: ['HAN'] },
    { keywords: ['ho chi minh', 'tp hcm', 'tphcm', 'sai gon', 'saigon', 'tan son nhat'], codes: ['SGN'] },
    { keywords: ['hai phong', 'cat bi'], codes: ['HPH'] },
    { keywords: ['da lat', 'dalat', 'lien khuong', 'lam dong'], codes: ['DLI'] },
    { keywords: ['can tho', 'cai rang'], codes: ['VCA'] },
    { keywords: ['quy nhon', 'phu cat', 'binh dinh'], codes: ['UIH'] },
    { keywords: ['thanh pho vinh', 'san bay vinh', 'nghe an'], codes: ['VII'] },
    { keywords: ['buon ma thuot', 'bmt', 'dak lak', 'daklak'], codes: ['BMV'] },
    { keywords: ['pleiku', 'gia lai'], codes: ['PXU'] },
    { keywords: ['con dao'], codes: ['VCS'] },
    { keywords: ['chu lai', 'quang nam'], codes: ['VCL', 'DAD'] },
    { keywords: ['dong hoi', 'quang binh'], codes: ['VDH'] },
    { keywords: ['sa pa', 'sapa', 'fansipan', 'lao cai'], codes: ['HAN'] },
    { keywords: ['ninh binh', 'trang an', 'tam coc'], codes: ['HAN'] },
    { keywords: ['ha giang', 'dong van', 'ma pi leng'], codes: ['HAN'] },
    { keywords: ['tuy hoa', 'phu yen'], codes: ['TBB'] },
    { keywords: ['thanh hoa', 'tho xuan'], codes: ['THD'] },
    { keywords: ['dien bien'], codes: ['DIN'] },
    { keywords: ['hue', 'phu bai', 'song huong'], codes: ['HUI'] },
    {
        matcher: (norm: string) => {
            if (/(\bvinh\b)/.test(norm) && !/(vinh ha long|vinh lan ha|vinh cam ranh|vinh bien|vinh nha trang)/.test(norm)) {
                return ['VII'];
            }
            return null;
        }
    }
];

const normalizeVN = (str: string): string => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .trim();
};

export const resolveAirportCodes = (query?: string): string[] => {
    if (!query || typeof query !== 'string') return [];
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Check mã trong ngoặc đơn: "Đà Nẵng - Sân bay Đà Nẵng (DAD)" -> DAD
    const matchParen = trimmed.match(/\(([A-Za-z]{3})\)/);
    if (matchParen) return [matchParen[1].toUpperCase()];

    // 2. Nhập trực tiếp mã 3 ký tự IATA: "HAN", "DAD", "sgn"
    if (/^[A-Za-z]{3}$/.test(trimmed)) {
        return [trimmed.toUpperCase()];
    }

    // 3. Tra cứu theo quy tắc tên thành phố / sân bay
    const norm = normalizeVN(trimmed);
    const codes = new Set<string>();
    for (const rule of AIRPORT_RULES) {
        if (rule.keywords && rule.codes) {
            for (const kw of rule.keywords) {
                if (norm.includes(kw)) {
                    rule.codes.forEach((c) => codes.add(c));
                    break;
                }
            }
        } else if (rule.matcher) {
            const res = rule.matcher(norm);
            if (res) {
                res.forEach((c) => codes.add(c));
            }
        }
    }
    return Array.from(codes);
};

/* ============================== SERVICE METHODS ============================== */

const getFlights = async (params: FlightFilterParams) => {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where: any = {};
    const andConditions: any[] = [];

    // Tìm kiếm thông minh điểm khởi hành (Chấp nhận cả mã IATA HAN, DAD và tên thành phố Hà Nội, Đà Nẵng...)
    if (params.departure_airport) {
        const depCodes = resolveAirportCodes(params.departure_airport);
        if (depCodes.length > 0) {
            andConditions.push({
                OR: [
                    { departure_airport: { in: depCodes } },
                    { departure_airport: { contains: params.departure_airport.trim(), mode: 'insensitive' } },
                ],
            });
        } else {
            andConditions.push({
                departure_airport: { contains: params.departure_airport.trim(), mode: 'insensitive' },
            });
        }
    }

    // Tìm kiếm thông minh điểm đến (Chấp nhận cả mã IATA và tên thành phố/điểm đến)
    if (params.arrival_airport) {
        const arrCodes = resolveAirportCodes(params.arrival_airport);
        if (arrCodes.length > 0) {
            andConditions.push({
                OR: [
                    { arrival_airport: { in: arrCodes } },
                    { arrival_airport: { contains: params.arrival_airport.trim(), mode: 'insensitive' } },
                ],
            });
        } else {
            andConditions.push({
                arrival_airport: { contains: params.arrival_airport.trim(), mode: 'insensitive' },
            });
        }
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }
    if (params.passengers !== undefined) {
        where.available_seats = { gte: Number(params.passengers) };
    } else {
        where.available_seats = { gt: 0 };
    }

    if (params.departure_date) {
        // Chuyển đổi ngày tìm kiếm sang trọn vẹn 24h theo múi giờ Việt Nam (UTC+7):
        // 00:00:00 VN (UTC+7) tương đương 17:00:00Z ngày hôm trước
        // 23:59:59.999 VN (UTC+7) tương đương 16:59:59.999Z ngày hiện tại
        const dateStr = params.departure_date.split('T')[0];
        const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);
        where.departure_time = { gte: startOfDay, lte: endOfDay };
    }

    if (params.min_price !== undefined || params.max_price !== undefined) {
        where.ticket_price = {
            ...(params.min_price !== undefined ? { gte: params.min_price } : {}),
            ...(params.max_price !== undefined ? { lte: params.max_price } : {}),
        };
    }

    if (params.airline) {
        where.planes = {
            airline: { contains: params.airline, mode: 'insensitive' },
        };
    }

    let orderBy: any = { departure_time: 'asc' };
    if (params.sort === 'price_asc') {
        orderBy = { ticket_price: 'asc' };
    } else if (params.sort === 'price_desc') {
        orderBy = { ticket_price: 'desc' };
    }

    const [total, items] = await Promise.all([
        prisma.flights.count({ where }),
        prisma.flights.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: { planes: true },
        }),
    ]);

    const flights = items.map((f) => ({
        ...f,
        flight_number: f.planes?.plane_number || '',
        ticket_price: Number(f.ticket_price),
    }));

    return { flights, total, page, limit };
};

const getFlightById = async (id: string) => {
    const flight = await prisma.flights.findUnique({
        where: { id },
        include: { planes: true },
    });
    if (!flight) return null;

    return {
        ...flight,
        flight_number: flight.planes?.plane_number || '',
        ticket_price: Number(flight.ticket_price),
    };
};

const getAirlines = async () => {
    const planes = await prisma.planes.findMany({
        distinct: ['airline'],
        select: { airline: true },
        orderBy: { airline: 'asc' },
    });
    return planes.map((p) => p.airline);
};

const getAirports = async () => {
    const departures = await prisma.flights.findMany({
        distinct: ['departure_airport'],
        select: { departure_airport: true },
    });
    const arrivals = await prisma.flights.findMany({
        distinct: ['arrival_airport'],
        select: { arrival_airport: true },
    });
    const airportSet = new Set<string>();
    departures.forEach((f) => {
        if (f.departure_airport) airportSet.add(f.departure_airport);
    });
    arrivals.forEach((f) => {
        if (f.arrival_airport) airportSet.add(f.arrival_airport);
    });
    const mapped = Array.from(airportSet).map((code) => AIRPORT_FULL_NAMES[code] || code);
    return mapped.sort((a, b) => a.localeCompare(b, 'vi'));
};

export default {
    getFlights,
    getFlightById,
    getAirlines,
    getAirports,
};

