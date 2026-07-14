import Order from '../models/Order.js';
<<<<<<< HEAD
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import DailyCost from '../models/DailyCost.js';
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

function round2(n) {
  return Math.round(n * 100) / 100;
}

// UTC day boundaries — a placeholder until real timezone handling (Europe/Dublin)
// is confirmed before go-live, same caveat as the VAT rates in PRD.md §11.
function dayRangeUTC(dateStr) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

<<<<<<< HEAD
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TREND_DAY_OPTIONS = [7, 30, 90];

=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
// End-of-day summary (FR5.1) — total sales, order count, tax collected, tender
// breakdown. Scoped to orders closed (paid) within the given day; voided orders
// never reach 'paid' so they're excluded automatically.
export async function getDailySummary(req, res, next) {
  try {
    const { start, end } = dayRangeUTC(req.query.date);

    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: start, $lt: end },
    });

    const orderCount = orders.length;
    const totalSales = round2(orders.reduce((sum, o) => sum + o.total, 0));
    const taxCollected = round2(orders.reduce((sum, o) => sum + o.vatTotal, 0));

    const tenderBreakdown = {};
    for (const order of orders) {
      for (const payment of order.payments) {
        tenderBreakdown[payment.method] = round2(
          (tenderBreakdown[payment.method] || 0) + payment.amount
        );
      }
    }

    res.json({ date: start.toISOString().slice(0, 10), orderCount, totalSales, taxCollected, tenderBreakdown });
  } catch (err) {
    next(err);
  }
}
<<<<<<< HEAD

// One-page operational snapshot for the admin Dashboard: today's headline
// numbers, a sales trend, today's order-status mix (queue health), best
// sellers, recent sales, a "typical week" pattern, and headcount. Everything
// revenue-shaped is scoped by closedAt like the daily summary above, except
// statusBreakdown which needs open/held orders too (they have no closedAt yet)
// so it's scoped by createdAt instead.
export async function getDashboardSummary(req, res, next) {
  try {
    const { start: todayStart, end: todayEnd } = dayRangeUTC(req.query.date);
    const trendDays = TREND_DAY_OPTIONS.includes(Number(req.query.trendDays))
      ? Number(req.query.trendDays)
      : 7;

    const todayOrders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: todayStart, $lt: todayEnd },
    });

    const orderCount = todayOrders.length;
    const totalSales = round2(todayOrders.reduce((sum, o) => sum + o.total, 0));
    const taxCollected = round2(todayOrders.reduce((sum, o) => sum + o.vatTotal, 0));
    const avgOrderValue = orderCount > 0 ? round2(totalSales / orderCount) : 0;

    const tenderBreakdown = {};
    for (const order of todayOrders) {
      for (const payment of order.payments) {
        tenderBreakdown[payment.method] = round2(
          (tenderBreakdown[payment.method] || 0) + payment.amount
        );
      }
    }

    const trendStart = new Date(todayStart.getTime() - (trendDays - 1) * 24 * 60 * 60 * 1000);
    const trendOrders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: trendStart, $lt: todayEnd },
    });

    // Admin-entered daily cost, joined onto the trend by date string — 0 for
    // any day with no entry yet, never fabricated.
    const trendStartDate = trendStart.toISOString().slice(0, 10);
    const trendEndDate = new Date(todayEnd.getTime() - 1).toISOString().slice(0, 10);
    const dailyCosts = await DailyCost.find({ date: { $gte: trendStartDate, $lte: trendEndDate } });
    const costByDate = new Map(dailyCosts.map((c) => [c.date, c.amount]));

    const trend = [];
    for (let i = trendDays - 1; i >= 0; i -= 1) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = trendOrders.filter((o) => o.closedAt >= dayStart && o.closedAt < dayEnd);
      const dateStr = dayStart.toISOString().slice(0, 10);
      trend.push({
        date: dateStr,
        orderCount: dayOrders.length,
        totalSales: round2(dayOrders.reduce((sum, o) => sum + o.total, 0)),
        cost: costByDate.get(dateStr) || 0,
      });
    }

    // Previous period revenue — the trendDays window immediately before the
    // current one, aligned index-for-index with `trend` (previousTrend[i] is
    // "trendDays days before trend[i]"), so the Revenue chart can plot a real
    // "this period vs last period" comparison instead of a fabricated metric.
    const previousEnd = trendStart;
    const previousStart = new Date(previousEnd.getTime() - trendDays * 24 * 60 * 60 * 1000);
    const previousOrders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: previousStart, $lt: previousEnd },
    });
    const previousTrend = [];
    for (let i = trendDays - 1; i >= 0; i -= 1) {
      const dayStart = new Date(previousEnd.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = previousOrders.filter((o) => o.closedAt >= dayStart && o.closedAt < dayEnd);
      previousTrend.push({
        date: dayStart.toISOString().slice(0, 10),
        orderCount: dayOrders.length,
        totalSales: round2(dayOrders.reduce((sum, o) => sum + o.total, 0)),
      });
    }

    // "Typical week" shape — order count per weekday over the same trend
    // window, folded onto 7 buckets regardless of how many weeks that spans.
    const weeklyPattern = WEEKDAY_NAMES.map((day) => ({ day, orderCount: 0 }));
    for (const order of trendOrders) {
      weeklyPattern[order.closedAt.getUTCDay()].orderCount += 1;
    }

    const todaysAllOrders = await Order.find({ createdAt: { $gte: todayStart, $lt: todayEnd } });
    const statusBreakdown = { open: 0, held: 0, paid: 0, completed: 0, voided: 0 };
    for (const order of todaysAllOrders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    // Yesterday's same status mix — powers the Completed/Canceled KPI cards'
    // day-over-day delta, the same comparison basis as the order-count/revenue deltas.
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdaysAllOrders = await Order.find({ createdAt: { $gte: yesterdayStart, $lt: todayStart } });
    const statusBreakdownYesterday = { open: 0, held: 0, paid: 0, completed: 0, voided: 0 };
    for (const order of yesterdaysAllOrders) {
      statusBreakdownYesterday[order.status] = (statusBreakdownYesterday[order.status] || 0) + 1;
    }

    const itemTotals = new Map();
    for (const order of todayOrders) {
      for (const line of order.lines) {
        const key = line.menuItemId?.toString() || line.nameSnapshot;
        const entry = itemTotals.get(key) || {
          menuItemId: line.menuItemId,
          name: line.nameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += line.quantity;
        entry.revenue = round2(entry.revenue + line.lineTotal);
        itemTotals.set(key, entry);
      }
    }
    const topItemsRaw = [...itemTotals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topItemMenuIds = topItemsRaw.map((i) => i.menuItemId).filter(Boolean);
    const topItemMenuDocs = await MenuItem.find({ _id: { $in: topItemMenuIds } }, { imageUrl: 1 });
    const imageByMenuId = new Map(topItemMenuDocs.map((m) => [m._id.toString(), m.imageUrl]));
    const topItems = topItemsRaw.map(({ menuItemId, ...rest }) => ({
      ...rest,
      imageUrl: (menuItemId && imageByMenuId.get(menuItemId.toString())) || null,
    }));

    // Top categories by today's revenue — same shape as topItems, grouped one
    // level up via each line's menu item. Items whose MenuItem doc no longer
    // exists (deleted since the sale) are simply excluded, not crashed on.
    const lineMenuItemIds = [...new Set(todayOrders.flatMap((o) => o.lines.map((l) => l.menuItemId?.toString()).filter(Boolean)))];
    const lineMenuDocs = await MenuItem.find({ _id: { $in: lineMenuItemIds } }, { categoryId: 1 });
    const categoryIdByMenuItemId = new Map(lineMenuDocs.map((m) => [m._id.toString(), m.categoryId?.toString()]));
    const categoryTotals = new Map();
    for (const order of todayOrders) {
      for (const line of order.lines) {
        const categoryId = line.menuItemId && categoryIdByMenuItemId.get(line.menuItemId.toString());
        if (!categoryId) continue;
        const entry = categoryTotals.get(categoryId) || { categoryId, revenue: 0 };
        entry.revenue = round2(entry.revenue + line.lineTotal);
        categoryTotals.set(categoryId, entry);
      }
    }
    const topCategoriesRaw = [...categoryTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
    const categoryDocs = await Category.find(
      { _id: { $in: topCategoriesRaw.map((c) => c.categoryId) } },
      { name: 1, imageUrl: 1 }
    );
    const categoryById = new Map(categoryDocs.map((c) => [c._id.toString(), c]));
    const topCategories = topCategoriesRaw.map((c) => ({
      name: categoryById.get(c.categoryId)?.name || 'Other',
      imageUrl: categoryById.get(c.categoryId)?.imageUrl || null,
      revenue: c.revenue,
    }));

    const [totalEmployees, inactiveEmployees] = await Promise.all([
      User.countDocuments({ active: true }),
      User.countDocuments({ active: false }),
    ]);

    // Order Activity / Sales History both read off the last 5 closed orders
    // regardless of date — a live activity feed, not a "today" metric.
    const recentOrders = await Order.find({ status: { $in: ['paid', 'completed'] } })
      .sort('-closedAt')
      .limit(5)
      .populate('tableId', 'name');

    const recentMenuIds = recentOrders.map((o) => o.lines[0]?.menuItemId).filter(Boolean);
    const recentMenuDocs = await MenuItem.find({ _id: { $in: recentMenuIds } }, { imageUrl: 1 });
    const recentImageByMenuId = new Map(recentMenuDocs.map((m) => [m._id.toString(), m.imageUrl]));

    const recentSales = recentOrders.map((order) => ({
      orderId: order._id,
      tokenNumber: order.tokenNumber,
      label: order.lines[0] ? order.lines[0].nameSnapshot : `Order #${order.tokenNumber}`,
      imageUrl: (order.lines[0]?.menuItemId && recentImageByMenuId.get(order.lines[0].menuItemId.toString())) || null,
      status: order.status,
      location: order.tableId?.name || (order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'),
      amount: order.total,
      closedAt: order.closedAt,
    }));

    // Busiest hour of the day so far, by order count — shown as "Peak Hour" on
    // the POS Overview card.
    const hourCounts = new Array(24).fill(0);
    for (const order of todayOrders) {
      hourCounts[order.closedAt.getUTCHours()] += 1;
    }
    const peakHourIndex = hourCounts.every((c) => c === 0) ? null : hourCounts.indexOf(Math.max(...hourCounts));
    const peakHour =
      peakHourIndex === null
        ? '—'
        : new Date(Date.UTC(2000, 0, 1, peakHourIndex)).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'UTC',
          });

    // Today's revenue split by order type — powers the Sales Breakdown card.
    const typeBreakdown = { dine_in: 0, takeaway: 0 };
    for (const order of todayOrders) {
      typeBreakdown[order.type] = round2((typeBreakdown[order.type] || 0) + order.total);
    }

    res.json({
      date: todayStart.toISOString().slice(0, 10),
      today: { orderCount, totalSales, taxCollected, avgOrderValue, peakHour },
      trend,
      previousTrend,
      trendDays,
      statusBreakdown,
      statusBreakdownYesterday,
      tenderBreakdown,
      typeBreakdown,
      topCategories,
      topItems,
      totalEmployees,
      inactiveEmployees,
      recentSales,
      weeklyPattern,
    });
  } catch (err) {
    next(err);
  }
}

function parseDateParam(value, fallback) {
  if (!value) return fallback;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

// Daily Sales Report (Reports & Analytics) — real per-day totals across an
// arbitrary [from, to] range, admin-entered cost joined in the same way the
// Dashboard's Revenue chart does it, so "profit" here is never fabricated.
export async function getSalesByDay(req, res, next) {
  try {
    const today = dayRangeUTC().start;
    const to = parseDateParam(req.query.to, today);
    const from = parseDateParam(req.query.from, new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000));
    const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: from, $lt: toExclusive },
    });

    const costDocs = await DailyCost.find({ date: { $gte: dateStr(from), $lte: dateStr(to) } });
    const costByDate = new Map(costDocs.map((c) => [c.date, c.amount]));

    const days = [];
    let cursor = from;
    while (cursor < toExclusive) {
      const dayStart = cursor;
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = orders.filter((o) => o.closedAt >= dayStart && o.closedAt < dayEnd);
      const totalSales = round2(dayOrders.reduce((sum, o) => sum + o.total, 0));
      const cost = costByDate.get(dateStr(dayStart)) || 0;
      days.push({
        date: dateStr(dayStart),
        orderCount: dayOrders.length,
        totalSales,
        cost,
        profit: round2(totalSales - cost),
      });
      cursor = dayEnd;
    }

    const totals = days.reduce(
      (acc, d) => ({
        orderCount: acc.orderCount + d.orderCount,
        totalSales: round2(acc.totalSales + d.totalSales),
        cost: round2(acc.cost + d.cost),
        profit: round2(acc.profit + d.profit),
      }),
      { orderCount: 0, totalSales: 0, cost: 0, profit: 0 }
    );

    res.json({ from: dateStr(from), to: dateStr(to), days, totals });
  } catch (err) {
    next(err);
  }
}

// Monthly Sales Report — same shape as Daily but folded into calendar-month
// buckets over the last N months (default 6, matching the reference layout).
export async function getSalesByMonth(req, res, next) {
  try {
    const monthsBack = Math.min(24, Math.max(1, Number(req.query.months) || 6));
    const today = dayRangeUTC().start;
    const rangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (monthsBack - 1), 1));
    const rangeEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: rangeStart, $lt: rangeEnd },
    });
    const costDocs = await DailyCost.find({ date: { $gte: dateStr(rangeStart), $lte: dateStr(today) } });
    const costByDate = new Map(costDocs.map((c) => [c.date, c.amount]));

    const months = [];
    for (let i = 0; i < monthsBack; i += 1) {
      const monthStart = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth() + i, 1));
      const monthEndExclusive = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
      const cappedEnd = monthEndExclusive < rangeEnd ? monthEndExclusive : rangeEnd;
      const monthOrders = orders.filter((o) => o.closedAt >= monthStart && o.closedAt < cappedEnd);
      const totalSales = round2(monthOrders.reduce((sum, o) => sum + o.total, 0));

      let cost = 0;
      for (let d = new Date(monthStart); d < cappedEnd; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
        cost += costByDate.get(dateStr(d)) || 0;
      }
      cost = round2(cost);

      months.push({
        month: dateStr(monthStart).slice(0, 7),
        label: monthStart.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        from: dateStr(monthStart),
        to: dateStr(new Date(cappedEnd.getTime() - 24 * 60 * 60 * 1000)),
        orderCount: monthOrders.length,
        totalSales,
        cost,
        profit: round2(totalSales - cost),
      });
    }

    const totals = months.reduce(
      (acc, m) => ({
        orderCount: acc.orderCount + m.orderCount,
        totalSales: round2(acc.totalSales + m.totalSales),
        cost: round2(acc.cost + m.cost),
        profit: round2(acc.profit + m.profit),
      }),
      { orderCount: 0, totalSales: 0, cost: 0, profit: 0 }
    );

    res.json({ from: dateStr(rangeStart), to: dateStr(today), months, totals });
  } catch (err) {
    next(err);
  }
}

// Item-based Sales Report — per-menu-item quantity/revenue across an
// arbitrary [from, to] range, same aggregation the Dashboard's topItems uses,
// just over a caller-chosen window instead of always "today".
export async function getSalesByItem(req, res, next) {
  try {
    const today = dayRangeUTC().start;
    const to = parseDateParam(req.query.to, today);
    const from = parseDateParam(req.query.from, new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000));
    const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: from, $lt: toExclusive },
    });

    const itemTotals = new Map();
    for (const order of orders) {
      for (const line of order.lines) {
        const key = line.menuItemId?.toString() || line.nameSnapshot;
        const entry = itemTotals.get(key) || {
          menuItemId: line.menuItemId,
          name: line.nameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += line.quantity;
        entry.revenue = round2(entry.revenue + line.lineTotal);
        itemTotals.set(key, entry);
      }
    }

    const itemsRaw = [...itemTotals.values()].sort((a, b) => b.revenue - a.revenue);
    const menuIds = itemsRaw.map((i) => i.menuItemId).filter(Boolean);
    const menuDocs = await MenuItem.find({ _id: { $in: menuIds } }, { imageUrl: 1 });
    const imageByMenuId = new Map(menuDocs.map((m) => [m._id.toString(), m.imageUrl]));

    const totalRevenue = round2(itemsRaw.reduce((sum, i) => sum + i.revenue, 0));
    const items = itemsRaw.map(({ menuItemId, ...rest }) => ({
      ...rest,
      imageUrl: (menuItemId && imageByMenuId.get(menuItemId.toString())) || null,
      share: totalRevenue > 0 ? Math.round((rest.revenue / totalRevenue) * 100) : 0,
    }));

    const totals = {
      quantity: items.reduce((sum, i) => sum + i.quantity, 0),
      revenue: totalRevenue,
    };

    res.json({ from: dateStr(from), to: dateStr(to), items, totals });
  } catch (err) {
    next(err);
  }
}

const GRANULARITIES = ['day', 'week', 'month', 'year'];
// Month defaults to a full 12-month pool — the frontend only ever shows 5 of
// them at a time (2 either side of whichever month is focused), paging back
// through the rest via the timeline's prev/next arrows.
const DEFAULT_BUCKET_COUNT = { day: 7, week: 8, month: 12, year: 5 };

function startOfWeekUTC(date) {
  return new Date(date.getTime() - date.getUTCDay() * 24 * 60 * 60 * 1000);
}

function addDaysUTC(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Unified Sales Report (Reports & Analytics) — one endpoint for all four
// granularities the "Daily / Weekly / Monthly / Yearly" picker switches
// between, instead of separate day/month endpoints. Real bucketed totals,
// admin-entered cost joined in per day exactly like the other sales reports.
export async function getSalesReport(req, res, next) {
  try {
    const granularity = GRANULARITIES.includes(req.query.granularity) ? req.query.granularity : 'day';
    const today = dayRangeUTC().start;

    let rangeStart;
    let rangeEndExclusive;
    if (req.query.from || req.query.to) {
      const to = parseDateParam(req.query.to, today);
      rangeStart = parseDateParam(req.query.from, to);
      rangeEndExclusive = addDaysUTC(to, 1);
    } else {
      const count = DEFAULT_BUCKET_COUNT[granularity];
      rangeEndExclusive = addDaysUTC(today, 1);
      if (granularity === 'day') rangeStart = addDaysUTC(today, -(count - 1));
      else if (granularity === 'week') rangeStart = startOfWeekUTC(addDaysUTC(today, -(count - 1) * 7));
      else if (granularity === 'month')
        rangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (count - 1), 1));
      else rangeStart = new Date(Date.UTC(today.getUTCFullYear() - (count - 1), 0, 1));
    }

    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: rangeStart, $lt: rangeEndExclusive },
    });
    const lastDayInclusive = addDaysUTC(rangeEndExclusive, -1);
    const costDocs = await DailyCost.find({ date: { $gte: dateStr(rangeStart), $lte: dateStr(lastDayInclusive) } });
    const costByDate = new Map(costDocs.map((c) => [c.date, c.amount]));

    function bucketTotals(bucketStart, bucketEndExclusive) {
      const bucketOrders = orders.filter((o) => o.closedAt >= bucketStart && o.closedAt < bucketEndExclusive);
      const totalSales = round2(bucketOrders.reduce((sum, o) => sum + o.total, 0));
      let cost = 0;
      for (let d = bucketStart; d < bucketEndExclusive; d = addDaysUTC(d, 1)) {
        cost += costByDate.get(dateStr(d)) || 0;
      }
      cost = round2(cost);
      return { orderCount: bucketOrders.length, totalSales, cost, profit: round2(totalSales - cost) };
    }

    const buckets = [];
    if (granularity === 'day') {
      for (let cursor = rangeStart; cursor < rangeEndExclusive; cursor = addDaysUTC(cursor, 1)) {
        const bucketEnd = addDaysUTC(cursor, 1);
        buckets.push({
          key: dateStr(cursor),
          label: dateStr(cursor).slice(5),
          from: dateStr(cursor),
          to: dateStr(cursor),
          ...bucketTotals(cursor, bucketEnd),
        });
      }
    } else if (granularity === 'week') {
      for (let cursor = rangeStart; cursor < rangeEndExclusive; cursor = addDaysUTC(cursor, 7)) {
        const bucketEnd = new Date(Math.min(addDaysUTC(cursor, 7).getTime(), rangeEndExclusive.getTime()));
        buckets.push({
          key: dateStr(cursor),
          label: dateStr(cursor).slice(5),
          from: dateStr(cursor),
          to: dateStr(addDaysUTC(bucketEnd, -1)),
          ...bucketTotals(cursor, bucketEnd),
        });
      }
    } else if (granularity === 'month') {
      let cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1));
      while (cursor < rangeEndExclusive) {
        const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
        const cappedEnd = monthEnd < rangeEndExclusive ? monthEnd : rangeEndExclusive;
        buckets.push({
          key: dateStr(cursor).slice(0, 7),
          label: cursor.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
          from: dateStr(cursor),
          to: dateStr(addDaysUTC(cappedEnd, -1)),
          ...bucketTotals(cursor, cappedEnd),
        });
        cursor = monthEnd;
      }
    } else {
      let cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), 0, 1));
      while (cursor < rangeEndExclusive) {
        const yearEnd = new Date(Date.UTC(cursor.getUTCFullYear() + 1, 0, 1));
        const cappedEnd = yearEnd < rangeEndExclusive ? yearEnd : rangeEndExclusive;
        buckets.push({
          key: String(cursor.getUTCFullYear()),
          label: String(cursor.getUTCFullYear()),
          from: dateStr(cursor),
          to: dateStr(addDaysUTC(cappedEnd, -1)),
          ...bucketTotals(cursor, cappedEnd),
        });
        cursor = yearEnd;
      }
    }

    const totals = buckets.reduce(
      (acc, b) => ({
        orderCount: acc.orderCount + b.orderCount,
        totalSales: round2(acc.totalSales + b.totalSales),
        cost: round2(acc.cost + b.cost),
        profit: round2(acc.profit + b.profit),
      }),
      { orderCount: 0, totalSales: 0, cost: 0, profit: 0 }
    );

    res.json({
      granularity,
      from: dateStr(rangeStart),
      to: dateStr(lastDayInclusive),
      buckets,
      totals,
    });
  } catch (err) {
    next(err);
  }
}
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
