"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock
} from "lucide-react";

export interface DailyCashflowPoint {
  date: string;
  label: string;
  incoming: number;
  expenses: number;
  net: number;
  incomingCount: number;
  expenseCount: number;
}

interface CashflowResponse {
  period: {
    startDate: string;
    endDate: string;
    month: string | null;
    mode: string;
    daysCount: number;
  };
  totals: {
    totalIncoming: number;
    totalExpenses: number;
    netBalance: number;
    incomingCount: number;
    expenseCount: number;
  };
  dailyData: DailyCashflowPoint[];
}

interface IncomeExpenseChartProps {
  showReportLink?: boolean;
  className?: string;
}

type FilterPreset =
  | "rolling30"
  | "thisMonth"
  | "prevMonth"
  | "twoMonthsAgo"
  | "customMonth"
  | "customRange";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function IncomeExpenseChart({
  showReportLink = false,
  className = ""
}: IncomeExpenseChartProps) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009";

  const now = useMemo(() => new Date(), []);
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const prevDate = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 1, 1), [now]);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const twoMonthsAgoDate = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 2, 1), [now]);
  const twoMonthsAgoStr = `${twoMonthsAgoDate.getFullYear()}-${String(
    twoMonthsAgoDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const toLocalDateKey = useCallback((d: Date | string) => {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const formatShortLabel = useCallback((d: Date) => {
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  }, []);

  // Filter states
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("rolling30");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [customEndDate, setCustomEndDate] = useState<string>(() => toLocalDateKey(new Date()));
  const [visibleSeries, setVisibleSeries] = useState<"both" | "incoming" | "expenses">("both");

  // Dropdown & Calendar Popover UI states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTab, setCalendarTab] = useState<"days" | "months">("days");
  const [viewYear, setViewYear] = useState<number>(now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(now.getMonth()); // 0-indexed

  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [cashflow, setCashflow] = useState<CashflowResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute start & end dates for custom 30-day range ending on customEndDate
  const customStartEnd = useMemo(() => {
    const endDt = new Date(customEndDate + "T23:59:59");
    const startDt = new Date(endDt.getTime() - 29 * 24 * 60 * 60 * 1000);
    startDt.setHours(0, 0, 0, 0);
    return {
      startDate: toLocalDateKey(startDt),
      endDate: toLocalDateKey(endDt)
    };
  }, [customEndDate, toLocalDateKey]);

  // Client-side aggregation fallback if backend hasn't restarted yet
  const computeClientSideCashflow = useCallback(
    async (
      monthParam: string | null,
      startDateParam?: string | null,
      endDateParam?: string | null
    ): Promise<CashflowResponse | null> => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        let start: Date;
        let end: Date;

        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
          const [yStr, mStr] = monthParam.split("-");
          const y = Number(yStr);
          const mIdx = Number(mStr) - 1;
          start = new Date(y, mIdx, 1, 0, 0, 0, 0);
          end = new Date(y, mIdx + 1, 0, 23, 59, 59, 999);
        } else if (startDateParam && endDateParam) {
          start = new Date(startDateParam + "T00:00:00");
          end = new Date(endDateParam + "T23:59:59");
        } else {
          end = new Date();
          end.setHours(23, 59, 59, 999);
          start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
          start.setHours(0, 0, 0, 0);
        }

        const dailyMap = new Map<string, DailyCashflowPoint>();
        const cursor = new Date(start);
        while (cursor <= end) {
          const key = toLocalDateKey(cursor);
          dailyMap.set(key, {
            date: key,
            label: formatShortLabel(cursor),
            incoming: 0,
            expenses: 0,
            net: 0,
            incomingCount: 0,
            expenseCount: 0
          });
          cursor.setDate(cursor.getDate() + 1);
        }

        const [billsRes, invRes, logsRes, ordersRes] = await Promise.all([
          fetch(`${apiBase}/api/admin/billing`, { headers }),
          fetch(`${apiBase}/api/inventory`, { headers }),
          fetch(`${apiBase}/api/inventory/logs`, { headers }),
          fetch(`${apiBase}/api/inventory/supplier-orders`, { headers })
        ]);

        const bills = billsRes.ok ? await billsRes.json() : [];
        const inventoryItems = invRes.ok ? await invRes.json() : [];
        const logs = logsRes.ok ? await logsRes.json() : [];
        const orders = ordersRes.ok ? await ordersRes.json() : [];

        const itemPriceById = new Map<string, number>();
        const itemPriceByName = new Map<string, number>();
        if (Array.isArray(inventoryItems)) {
          inventoryItems.forEach((item: any) => {
            itemPriceById.set(String(item._id), Number(item.price || 0));
            if (item.name) {
              itemPriceByName.set(item.name.trim().toLowerCase(), Number(item.price || 0));
            }
          });
        }

        if (Array.isArray(bills)) {
          bills.forEach((bill: any) => {
            const rawDate = bill.date || bill.createdAt;
            if (!rawDate) return;
            const dt = new Date(rawDate);
            if (dt < start || dt > end) return;
            const key = toLocalDateKey(dt);
            const bucket = dailyMap.get(key);
            if (!bucket) return;

            const paidAmount =
              bill.amountPaid !== undefined && bill.amountPaid > 0
                ? Number(bill.amountPaid)
                : bill.status === "Paid"
                ? Number(bill.amount || 0)
                : 0;

            if (paidAmount > 0) {
              bucket.incoming += paidAmount;
              bucket.incomingCount += 1;
            }
          });
        }

        if (Array.isArray(logs)) {
          logs.forEach((log: any) => {
            if (log.type !== "restock" || !log.createdAt) return;
            const dt = new Date(log.createdAt);
            if (dt < start || dt > end) return;
            const key = toLocalDateKey(dt);
            const bucket = dailyMap.get(key);
            if (!bucket) return;

            const itemId = typeof log.item === "object" ? log.item?._id : log.item;
            const itemName = typeof log.item === "object" ? log.item?.name : "";
            const unitPrice =
              (typeof log.item === "object" && log.item?.price !== undefined
                ? Number(log.item.price)
                : undefined) ??
              (itemId ? itemPriceById.get(String(itemId)) : undefined) ??
              (itemName ? itemPriceByName.get(String(itemName).trim().toLowerCase()) : undefined) ??
              0;

            const cost = Number(log.quantity || 0) * unitPrice;
            if (cost > 0) {
              bucket.expenses += cost;
              bucket.expenseCount += 1;
            }
          });
        }

        if (Array.isArray(orders)) {
          orders.forEach((order: any) => {
            if (order.status !== "Requested" && order.status !== "Confirmed") return;
            const rawDate = order.orderDate || order.createdAt;
            if (!rawDate) return;
            const dt = new Date(rawDate);
            if (dt < start || dt > end) return;
            const key = toLocalDateKey(dt);
            const bucket = dailyMap.get(key);
            if (!bucket) return;

            const itemId =
              typeof order.inventoryItem === "object"
                ? order.inventoryItem?._id
                : order.inventoryItem;
            const unitPrice =
              (itemId ? itemPriceById.get(String(itemId)) : undefined) ??
              (order.itemName
                ? itemPriceByName.get(String(order.itemName).trim().toLowerCase())
                : undefined) ??
              0;

            const cost = Number(order.quantity || 0) * unitPrice;
            if (cost > 0) {
              bucket.expenses += cost;
              bucket.expenseCount += 1;
            }
          });
        }

        const dailyData = Array.from(dailyMap.values()).map((d) => ({
          ...d,
          net: d.incoming - d.expenses
        }));

        const totalIncoming = dailyData.reduce((s, d) => s + d.incoming, 0);
        const totalExpenses = dailyData.reduce((s, d) => s + d.expenses, 0);
        const incomingCount = dailyData.reduce((s, d) => s + d.incomingCount, 0);
        const expenseCount = dailyData.reduce((s, d) => s + d.expenseCount, 0);

        return {
          period: {
            startDate: toLocalDateKey(start),
            endDate: toLocalDateKey(end),
            month: monthParam,
            mode: monthParam ? "month" : "rolling30",
            daysCount: dailyData.length
          },
          totals: {
            totalIncoming,
            totalExpenses,
            netBalance: totalIncoming - totalExpenses,
            incomingCount,
            expenseCount
          },
          dailyData
        };
      } catch (err) {
        console.error("Error computing fallback cashflow:", err);
        return null;
      }
    },
    [apiBase, formatShortLabel, toLocalDateKey]
  );

  const fetchCashflowData = useCallback(async () => {
    setLoading(true);
    let monthQuery: string | null = null;
    let startDateParam: string | null = null;
    let endDateParam: string | null = null;

    if (filterPreset === "thisMonth") {
      monthQuery = currentMonthStr;
    } else if (filterPreset === "prevMonth") {
      monthQuery = prevMonthStr;
    } else if (filterPreset === "twoMonthsAgo") {
      monthQuery = twoMonthsAgoStr;
    } else if (filterPreset === "customMonth") {
      monthQuery = selectedMonth;
    } else if (filterPreset === "customRange") {
      startDateParam = customStartEnd.startDate;
      endDateParam = customStartEnd.endDate;
    }

    try {
      const token = localStorage.getItem("token");
      let queryString = `?mode=rolling30`;

      if (monthQuery) {
        queryString = `?month=${encodeURIComponent(monthQuery)}&mode=month`;
      } else if (startDateParam && endDateParam) {
        queryString = `?startDate=${encodeURIComponent(startDateParam)}&endDate=${encodeURIComponent(
          endDateParam
        )}&mode=customRange`;
      }

      const res = await fetch(`${apiBase}/api/admin/billing/cashflow${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data: CashflowResponse = await res.json();
        setCashflow(data);
      } else {
        const fallback = await computeClientSideCashflow(monthQuery, startDateParam, endDateParam);
        if (fallback) setCashflow(fallback);
      }
    } catch {
      const fallback = await computeClientSideCashflow(monthQuery, startDateParam, endDateParam);
      if (fallback) setCashflow(fallback);
    } finally {
      setLoading(false);
    }
  }, [
    apiBase,
    filterPreset,
    selectedMonth,
    currentMonthStr,
    prevMonthStr,
    twoMonthsAgoStr,
    customStartEnd,
    computeClientSideCashflow
  ]);

  useEffect(() => {
    fetchCashflowData();
  }, [fetchCashflowData]);

  // Dropdown options list
  const dropdownOptions = useMemo(() => {
    const formatMonthDisplay = (ym: string) => {
      const [y, m] = ym.split("-");
      return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
    };

    return [
      {
        id: "rolling30" as FilterPreset,
        label: "Last 30 Days (1 Month)",
        sub: "Rolling 30-day window",
        monthVal: null
      },
      {
        id: "thisMonth" as FilterPreset,
        label: `This Month (${formatMonthDisplay(currentMonthStr)})`,
        sub: "Current calendar month",
        monthVal: currentMonthStr
      },
      {
        id: "prevMonth" as FilterPreset,
        label: `Last Month (${formatMonthDisplay(prevMonthStr)})`,
        sub: "Previous calendar month",
        monthVal: prevMonthStr
      },
      {
        id: "twoMonthsAgo" as FilterPreset,
        label: formatMonthDisplay(twoMonthsAgoStr),
        sub: "Full month",
        monthVal: twoMonthsAgoStr
      }
    ];
  }, [currentMonthStr, prevMonthStr, twoMonthsAgoStr]);

  const activeDropdownTitle = useMemo(() => {
    if (filterPreset === "rolling30") return "Last 30 Days (1 Month)";
    if (filterPreset === "thisMonth") return "This Month";
    if (filterPreset === "prevMonth") return "Last Month";
    if (filterPreset === "twoMonthsAgo") {
      const [y, m] = twoMonthsAgoStr.split("-");
      return `${SHORT_MONTH_NAMES[Number(m) - 1]} ${y}`;
    }
    if (filterPreset === "customMonth") {
      const [y, m] = selectedMonth.split("-");
      return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
    }
    return "Custom 1-Month Range";
  }, [filterPreset, selectedMonth, twoMonthsAgoStr]);

  // Build calendar grid days for (viewYear, viewMonth)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
      cells.push({
        dateStr: toLocalDateKey(d),
        dayNum: d.getDate(),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const d = new Date(viewYear, viewMonth, dNum);
      cells.push({
        dateStr: toLocalDateKey(d),
        dayNum: dNum,
        isCurrentMonth: true
      });
    }

    // Trailing days to complete 6 rows (42 cells)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      cells.push({
        dateStr: toLocalDateKey(d),
        dayNum: d.getDate(),
        isCurrentMonth: false
      });
    }

    return cells;
  }, [viewYear, viewMonth, toLocalDateKey]);

  const activeStartStr = cashflow?.period?.startDate || customStartEnd.startDate;
  const activeEndStr = cashflow?.period?.endDate || customStartEnd.endDate;

  const dailyData = cashflow?.dailyData || [];
  const totals = cashflow?.totals || {
    totalIncoming: 0,
    totalExpenses: 0,
    netBalance: 0,
    incomingCount: 0,
    expenseCount: 0
  };

  // SVG chart dimensions & coordinate helpers
  const chartWidth = 920;
  const chartHeight = 290;
  const padLeft = 68;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 42;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const maxVal = useMemo(() => {
    if (dailyData.length === 0) return 10000;
    let peak = 0;
    dailyData.forEach((d) => {
      if (visibleSeries !== "expenses" && d.incoming > peak) peak = d.incoming;
      if (visibleSeries !== "incoming" && d.expenses > peak) peak = d.expenses;
    });
    if (peak <= 0) return 10000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(peak)));
    return Math.ceil((peak * 1.15) / magnitude) * magnitude;
  }, [dailyData, visibleSeries]);

  const yTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxVal / steps) * i));
  }, [maxVal]);

  const getX = useCallback(
    (index: number) => {
      if (dailyData.length <= 1) return padLeft + plotWidth / 2;
      return padLeft + (index / (dailyData.length - 1)) * plotWidth;
    },
    [dailyData.length, padLeft, plotWidth]
  );

  const getY = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(val, maxVal));
      return padTop + plotHeight - (clamped / maxVal) * plotHeight;
    },
    [maxVal, padTop, plotHeight]
  );

  const buildSmoothPath = useCallback(
    (values: number[]) => {
      if (values.length === 0) return "";
      const pts = values.map((v, idx) => ({ x: getX(idx), y: getY(v) }));
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpx1 = p0.x + (p1.x - p0.x) * 0.45;
        const cpy1 = p0.y;
        const cpx2 = p0.x + (p1.x - p0.x) * 0.55;
        const cpy2 = p1.y;
        d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      return d;
    },
    [getX, getY]
  );

  const buildAreaPath = useCallback(
    (values: number[]) => {
      if (values.length === 0) return "";
      const linePath = buildSmoothPath(values);
      const firstX = getX(0).toFixed(1);
      const lastX = getX(values.length - 1).toFixed(1);
      const baseLineY = (padTop + plotHeight).toFixed(1);
      return `${linePath} L ${lastX} ${baseLineY} L ${firstX} ${baseLineY} Z`;
    },
    [buildSmoothPath, getX, padTop, plotHeight]
  );

  const incomingValues = useMemo(() => dailyData.map((d) => d.incoming), [dailyData]);
  const expenseValues = useMemo(() => dailyData.map((d) => d.expenses), [dailyData]);

  const incomingLinePath = useMemo(() => buildSmoothPath(incomingValues), [buildSmoothPath, incomingValues]);
  const incomingAreaPath = useMemo(() => buildAreaPath(incomingValues), [buildAreaPath, incomingValues]);
  const expenseLinePath = useMemo(() => buildSmoothPath(expenseValues), [buildSmoothPath, expenseValues]);
  const expenseAreaPath = useMemo(() => buildAreaPath(expenseValues), [buildAreaPath, expenseValues]);

  const formatCompactCurrency = (val: number) => {
    if (val >= 1_000_000) return `Rs. ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `Rs. ${(val / 1_000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return `Rs. ${val}`;
  };

  const activePoint = hoverIndex !== null && dailyData[hoverIndex] ? dailyData[hoverIndex] : null;

  const periodLabel = useMemo(() => {
    if (!cashflow?.period) return "Last 30 Days (1 Month)";
    const s = new Date(cashflow.period.startDate + "T00:00:00");
    const e = new Date(cashflow.period.endDate + "T00:00:00");
    return `${s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })} – ${e.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })}`;
  }, [cashflow]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}>
      {/* Header & Custom UI/UX Dropdown + Calendar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Monthly Incoming vs. Expenses
              </h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <CalendarIcon size={13} className="text-blue-500" />
                <span>Filtered 1-Month Period:</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {periodLabel}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Custom Dropdown & Interactive Calendar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Custom Styled Period Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen((prev) => !prev);
                setIsCalendarOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs min-w-[190px] ${
                isDropdownOpen
                  ? "border-blue-500 bg-blue-50/40 text-blue-700 ring-2 ring-blue-500/15"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/70"
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-blue-600" />
                <span>{activeDropdownTitle}</span>
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Select 1-Month Period
                </div>
                <div className="space-y-1">
                  {dropdownOptions.map((opt) => {
                    const isSelected = filterPreset === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setFilterPreset(opt.id);
                          if (opt.monthVal) {
                            setSelectedMonth(opt.monthVal);
                            const [y, m] = opt.monthVal.split("-");
                            setViewYear(Number(y));
                            setViewMonth(Number(m) - 1);
                          }
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <div>
                          <div className="text-xs">{opt.label}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{opt.sub}</div>
                        </div>
                        {isSelected && <Check size={15} className="text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsCalendarOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon size={14} />
                      Pick Custom Month / Date...
                    </span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Custom Interactive Calendar & Month Picker Popover */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => {
                setIsCalendarOpen((prev) => !prev);
                setIsDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
                isCalendarOpen || filterPreset === "customMonth" || filterPreset === "customRange"
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-100"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
              }`}
            >
              <CalendarIcon size={14} />
              <span>Calendar</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isCalendarOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCalendarOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Mode Switcher inside Calendar Popover */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setCalendarTab("days")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      calendarTab === "days"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    30-Day Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarTab("months")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      calendarTab === "months"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Month Picker
                  </button>
                </div>

                {calendarTab === "days" ? (
                  <div>
                    {/* Month & Year Navigation */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (viewMonth === 0) {
                            setViewMonth(11);
                            setViewYear((y) => y - 1);
                          } else {
                            setViewMonth((m) => m - 1);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarTab("months")}
                        className="text-sm font-black text-slate-800 hover:text-blue-600 transition cursor-pointer"
                      >
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (viewMonth === 11) {
                            setViewMonth(0);
                            setViewYear((y) => y + 1);
                          } else {
                            setViewMonth((m) => m + 1);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {WEEKDAYS.map((wd) => (
                        <span
                          key={wd}
                          className="text-[10px] font-extrabold uppercase text-slate-400 py-1"
                        >
                          {wd}
                        </span>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((cell) => {
                        const isStart = cell.dateStr === activeStartStr;
                        const isEnd = cell.dateStr === activeEndStr;
                        const isInRange =
                          cell.dateStr >= activeStartStr && cell.dateStr <= activeEndStr;

                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => {
                              setCustomEndDate(cell.dateStr);
                              setFilterPreset("customRange");
                              setIsCalendarOpen(false);
                            }}
                            className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isStart || isEnd
                                ? "bg-blue-600 text-white shadow-xs font-black"
                                : isInRange
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : cell.isCurrentMonth
                                ? "text-slate-700 hover:bg-slate-100"
                                : "text-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {cell.dayNum}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium mt-3 text-center">
                      Select any end date to filter a 30-day (1-month) period.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Year Switcher */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <button
                        type="button"
                        onClick={() => setViewYear((y) => y - 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-black text-slate-800">{viewYear}</span>
                      <button
                        type="button"
                        onClick={() => setViewYear((y) => y + 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* 12-Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {SHORT_MONTH_NAMES.map((mName, idx) => {
                        const ym = `${viewYear}-${String(idx + 1).padStart(2, "0")}`;
                        const isSelected =
                          (filterPreset === "customMonth" && selectedMonth === ym) ||
                          (filterPreset === "thisMonth" && ym === currentMonthStr) ||
                          (filterPreset === "prevMonth" && ym === prevMonthStr);

                        return (
                          <button
                            key={mName}
                            type="button"
                            onClick={() => {
                              setViewMonth(idx);
                              setSelectedMonth(ym);
                              setFilterPreset("customMonth");
                              setIsCalendarOpen(false);
                            }}
                            className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                                : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                          >
                            {mName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Calendar Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const todayNow = new Date();
                      setViewYear(todayNow.getFullYear());
                      setViewMonth(todayNow.getMonth());
                      setFilterPreset("rolling30");
                      setIsCalendarOpen(false);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Reset to Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={fetchCashflowData}
            title="Refresh 1-month data"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>

          {showReportLink && (
            <button
              type="button"
              onClick={() => router.push("/admin/reports")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Full Report →
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        {/* Incoming Card */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <ArrowUpRight size={14} /> Incoming (1 Month)
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Rs. {totals.totalIncoming.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {totals.incomingCount} paid invoice transaction{totals.incomingCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <ArrowDownRight size={14} /> Expenses (1 Month)
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Rs. {totals.totalExpenses.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {totals.expenseCount} procurement & restock event{totals.expenseCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Net Cashflow Card */}
        <div
          className={`rounded-xl border p-4 flex items-center justify-between ${
            totals.netBalance >= 0
              ? "border-blue-100 bg-blue-50/50"
              : "border-amber-100 bg-amber-50/50"
          }`}
        >
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                totals.netBalance >= 0 ? "text-blue-700" : "text-amber-700"
              }`}
            >
              <Wallet size={14} /> Net Cashflow (1 Month)
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                totals.netBalance >= 0 ? "text-slate-900" : "text-rose-600"
              }`}
            >
              {totals.netBalance < 0 ? "-" : ""}Rs. {Math.abs(totals.netBalance).toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {totals.netBalance >= 0 ? "Positive monthly net margin" : "Expenses exceed collected revenue"}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              totals.netBalance >= 0
                ? "bg-blue-500/10 text-blue-600"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* Legend & Series Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-5 text-xs font-bold">
          <button
            type="button"
            onClick={() =>
              setVisibleSeries(visibleSeries === "incoming" ? "both" : "incoming")
            }
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition cursor-pointer ${
              visibleSeries !== "expenses"
                ? "text-slate-800 bg-emerald-50/80"
                : "text-slate-400 opacity-60"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span>Incoming (Revenue)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setVisibleSeries(visibleSeries === "expenses" ? "both" : "expenses")
            }
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition cursor-pointer ${
              visibleSeries !== "incoming"
                ? "text-slate-800 bg-rose-50/80"
                : "text-slate-400 opacity-60"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs"></span>
            <span>Expenses (Supplies & Restocks)</span>
          </button>

          {visibleSeries !== "both" && (
            <button
              type="button"
              onClick={() => setVisibleSeries("both")}
              className="text-blue-600 hover:underline text-xs font-bold cursor-pointer"
            >
              Show Both
            </button>
          )}
        </div>

        {/* Live Hover Readout Pill */}
        {activePoint ? (
          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-900 text-white px-3.5 py-1.5 rounded-xl shadow-sm">
            <span className="font-bold text-slate-300">
              {activePoint.label} ({activePoint.date})
            </span>
            <span className="text-emerald-400 font-bold">
              In: Rs. {activePoint.incoming.toLocaleString()}
            </span>
            <span className="text-rose-400 font-bold">
              Exp: Rs. {activePoint.expenses.toLocaleString()}
            </span>
            <span className="text-blue-300 font-bold">
              Net: {activePoint.net < 0 ? "-" : ""}Rs. {Math.abs(activePoint.net).toLocaleString()}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">
            Hover over the graph to inspect daily incoming & expense figures
          </span>
        )}
      </div>

      {/* SVG Line Graph Canvas */}
      <div className="relative w-full overflow-x-auto">
        {loading ? (
          <div className="h-[290px] flex items-center justify-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Loading 1-month incoming & expense trend...
            </div>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[620px] select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="incomingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((tick, idx) => {
              const y = getY(tick);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={chartWidth - padRight}
                    y2={y}
                    stroke={idx === 0 ? "#cbd5e1" : "#f1f5f9"}
                    strokeWidth={idx === 0 ? 1.5 : 1}
                    strokeDasharray={idx === 0 ? undefined : "4 4"}
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[11px] font-semibold"
                  >
                    {formatCompactCurrency(tick)}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Date Labels */}
            {dailyData.map((d, idx) => {
              const showLabel =
                idx === 0 || idx === dailyData.length - 1 || idx % 5 === 0;
              if (!showLabel) return null;
              const x = getX(idx);
              return (
                <text
                  key={d.date}
                  x={x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px] font-semibold"
                >
                  {d.label}
                </text>
              );
            })}

            {/* Area & Line: Expenses */}
            {visibleSeries !== "incoming" && dailyData.length > 0 && (
              <g>
                <path d={expenseAreaPath} fill="url(#expenseAreaGrad)" />
                <path
                  d={expenseLinePath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth={2.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Area & Line: Incoming */}
            {visibleSeries !== "expenses" && dailyData.length > 0 && (
              <g>
                <path d={incomingAreaPath} fill="url(#incomingAreaGrad)" />
                <path
                  d={incomingLinePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Data Dots for Non-Zero Days or Active Hover Day */}
            {dailyData.map((d, idx) => {
              const x = getX(idx);
              const yIn = getY(d.incoming);
              const yExp = getY(d.expenses);
              const isHovered = hoverIndex === idx;

              return (
                <g key={d.date}>
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotHeight}
                      stroke="#94a3b8"
                      strokeWidth={1.2}
                      strokeDasharray="3 3"
                    />
                  )}

                  {visibleSeries !== "expenses" && (d.incoming > 0 || isHovered) && (
                    <circle
                      cx={x}
                      cy={yIn}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  )}

                  {visibleSeries !== "incoming" && (d.expenses > 0 || isHovered) && (
                    <circle
                      cx={x}
                      cy={yExp}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}

            {/* Invisible Interactive Hover Columns */}
            {dailyData.map((d, idx) => {
              const x = getX(idx);
              const colWidth = plotWidth / Math.max(dailyData.length, 1);
              return (
                <rect
                  key={`hit-${d.date}`}
                  x={x - colWidth / 2}
                  y={padTop}
                  width={colWidth}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
