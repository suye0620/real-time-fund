#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'state.db');

function openDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    console.error('Make sure the server has been started at least once.');
    process.exit(1);
  }
  try {
    return new Database(DB_PATH, { readonly: true });
  } catch (err) {
    console.error(`Failed to open database at ${DB_PATH}: ${err.message}`);
    console.error('The database may be corrupted. Try restarting the server to recreate it.');
    process.exit(1);
  }
}

function usage() {
  console.error(`Usage: jigubao <command> [args]

Commands:
  help                  Show this detailed help (also triggered by --help / -h)
  today                 Quick snapshot: market value, total P&L, day change
  list                  List all storage keys with update timestamps
  get <key>             Get raw value for a specific key
  export                Export all data as a parsed JSON object
  funds                 List all funds (name, code, holdings)
  summary               Portfolio summary: totals, profit/loss per fund

All commands output JSON to stdout.`);
  process.exit(1);
}

function help() {
  console.error(`jigubao — 基估宝 CLI（供 AI Agent / OpenClaw 读取基金持仓数据）

================================================================================
DATA SOURCES
================================================================================
  所有数据来自服务端 SQLite 数据库（只读）。
  数据由 WebUI 写入，通过 REST API 持久化到 data/state.db。

  数据库中的 key（可使用 jigubao list 查看）：
    funds             基金列表（含净值、估算涨幅等实时数据）
    holdings          持仓数据（份额、成本价）
    fundDailyEarnings 每日收益记录（含历史确认收益）
    favorites         自选基金
    groups            分组信息
    tags              基金标签
    pendingTrades     待确认交易
    transactions      交易记录
    dcaPlans          定投计划
    customSettings    用户自定义设置

================================================================================
COMMANDS
================================================================================

━━━ today ━━━ 快速查看当日持仓概况
  jigubao today

  输出字段：
    当前持仓市值      sum(估算净值 × 份额) — 实时估算总市值
    持仓总成本        sum(成本价 × 份额)
    持仓总收益        当前持仓市值 − 持仓总成本
    总收益率          (持仓总收益 / 持仓总成本) × 100
    昨日市值          sum(最新单位净值 × 份额)
    今日估算收益      sum((估算净值 − 最新单位净值) × 份额)
    今日估算收益率    (今日估算收益 / 昨日市值) × 100
    最近确认日        最近一个已确认收益的日期（YYYY-MM-DD）
    最近确认日收益    该日所有基金确认收益之和
    items[]           每只基金明细：
      code                  基金代码
      name                  基金名称
      value                 当前市值
      estimatedDayProfit    单基金今日估算收益
      estimatedDayRate      单基金今日估算收益率
      gszzl                 估算涨幅（来自API）
      latestConfirmedDate   该基金最近确认收益日期
      latestConfirmedEarnings  该基金最近确认收益金额
      latestConfirmedRate      该基金最近确认收益率

  使用场景：
    - 盘中：今日估算收益 ≠ 0 → 参考实时估算
    - 开盘前：今日估算收益 = 0 → 参考最近确认日收益

━━━ summary ━━━ 持仓汇总（带每只基金明细）
  jigubao summary

  输出字段：
    totalValue      sum(净值 × 份额)
    totalCost       sum(成本价 × 份额)
    totalProfit     总市值 − 总成本
    totalProfitRate 总收益率
    fundCount       基金总数
    fundsWithHoldings  有持仓的基金数
    breakdown[]     每只基金：
      code            代码
      name            名称
      nav             用于计算的净值（优先gsz，缺则用dwjz）
      share           持有份额
      cost            成本价
      currentValue    当前市值
      costValue       成本金额
      profit          持有收益
      profitRate      持有收益率
      gszzl           估算涨幅

  与 today 的区别：summary 侧重持仓成本收益，today 侧重日内变化。

━━━ funds ━━━ 基金列表（含持仓信息）
  jigubao funds

  输出字段：
    code          代码
    name          名称
    dwjz          最新单位净值
    gsz           实时估算净值（可能为null）
    gszzl         估算涨幅
    jzrq          净值日期
    gztime        估值时间
    holding       持仓对象 { share, cost } 或 null

━━━ list ━━━ 列出数据库中所有 key
  jigubao list

  输出：[{ key, updated_at }] — 按 key 排序

━━━ get ━━━ 获取指定 key 的原始数据
  jigubao get <key>

  示例：
    jigubao get funds        → 基金列表完整JSON
    jigubao get holdings     → 持仓数据
    jigubao get tags         → 标签数据

  输出：{ key, value, updated_at } 或 null（key不存在）

━━━ export ━━━ 导出全部数据为单对象
  jigubao export

  输出：{ [key]: parsedValue } — 每个key的JSON值经过解析

================================================================================
NOTES FOR AI AGENTS (OpenClaw 使用指南)
================================================================================

  EXIT CODES
    0  成功，stdout 包含 JSON 数据
    1  错误，stderr 包含错误描述（数据库不存在、参数错误等）

  RECOMMENDED WORKFLOW
    1. jigubao today     — 快速获取当前市值、估算收益、确认收益
    2. jigubao funds     — 如需单只基金明细
    3. jigubao list      — 如需了解有哪些可用数据 key
    4. jigubao get <key> — 如需特定原始数据（如 tags, transactions 等）

  DATA INTERPRETATION
    - 当前持仓市值    = Σ(gsz × share)，gsz缺失时退用dwjz
    - 今日估算收益    = Σ((gsz − dwjz) × share)，0说明未开盘或无实时估值
    - 最近确认日收益   = 最近一个交易日的实际确认收益（来自fundDailyEarnings）
    - 盘中决策参考    → 今日估算收益
    - 开盘前/收盘后   → 最近确认日收益

  FIELD TYPES
    - 基金代码 code:         string  (6位数字)
    - 净值 dwjz/gsz:        number  (单位净值，人民币元)
    - 份额 share:            number  (份)
    - 成本价 cost:           number  (单位成本，人民币元)
    - 金额 value/profit:     number  (人民币元，保留2位小数)
    - 收益率 rate/profitRate: number (百分比，如1.51表示+1.51%)
    - 日期 date:             string  (YYYY-MM-DD)
    - 估值涨幅 gszzl:        string  (来自API的原始字符串)

  ALL OUTPUT IS JSON ON STDOUT — parse directly, do not grep/extract.
  ALL DIAGNOSTIC MESSAGES ON STDERR — read for error context.
  数据库路径可通过环境变量 DATA_DIR 指定。`);
  process.exit(0);
}

const command = process.argv[2];
if (!command || command === '--help' || command === '-h' || command === 'help') {
  command === 'help' ? help() : (command ? help() : usage());
}

const db = openDb();

function getParsed(key) {
  const row = db.prepare('SELECT value FROM state WHERE key = ?').get(key);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

try {
  switch (command) {
    case 'list': {
      const rows = db.prepare('SELECT key, updated_at FROM state ORDER BY key').all();
      console.log(JSON.stringify(rows, null, 2));
      break;
    }

    case 'get': {
      const key = process.argv[3];
      if (!key) { console.error('Usage: jigubao get <key>'); process.exit(1); }
      const row = db.prepare('SELECT key, value, updated_at FROM state WHERE key = ?').get(key);
      if (!row) { console.log(JSON.stringify(null)); break; }
      try { row.value = JSON.parse(row.value); } catch { /* raw string */ }
      console.log(JSON.stringify(row, null, 2));
      break;
    }

    case 'export': {
      const rows = db.prepare('SELECT key, value FROM state ORDER BY key').all();
      const result = {};
      for (const r of rows) {
        try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; }
      }
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'funds': {
      const funds = getParsed('funds') || [];
      const holdings = getParsed('holdings') || {};
      const output = funds.map((f) => ({
        code: f.code,
        name: f.name,
        dwjz: f.dwjz,
        gsz: f.gsz,
        gszzl: f.gszzl,
        jzrq: f.jzrq,
        gztime: f.gztime,
        holding: holdings[f.code] || null,
      }));
      console.log(JSON.stringify(output, null, 2));
      break;
    }

    case 'today': {
      const tFunds = getParsed('funds') || [];
      const tHoldings = getParsed('holdings') || {};
      const tEarnings = getParsed('fundDailyEarnings') || {};
      const scope = tEarnings.all || tEarnings;

      let todayValue = 0;
      let yesterdayValue = 0;
      let totalCost = 0;
      const items = [];

      for (const f of tFunds) {
        const h = tHoldings[f.code];
        const share = h && h.share ? parseFloat(h.share) : 0;
        const cost = h && h.cost ? parseFloat(h.cost) : 0;
        if (!share) continue;

        const gsz = parseFloat(f.gsz) || parseFloat(f.dwjz) || 0;
        const dwjz = parseFloat(f.dwjz) || gsz;
        const codeTodayValue = gsz * share;
        const codeYesterdayValue = dwjz * share;
        const codeCostValue = cost * share;
        const codeDayProfit = codeTodayValue - codeYesterdayValue;

        todayValue += codeTodayValue;
        yesterdayValue += codeYesterdayValue;
        totalCost += codeCostValue;

        // 从 fundDailyEarnings 提取该基金最近一日的确认收益
        const codeRecords = Array.isArray(scope[f.code]) ? scope[f.code] : [];
        let latestConfirmed = null;
        if (codeRecords.length) {
          const sorted = [...codeRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          latestConfirmed = sorted[0];
        }

        items.push({
          code: f.code,
          name: f.name,
          value: Math.round(codeTodayValue * 100) / 100,
          estimatedDayProfit: Math.round(codeDayProfit * 100) / 100,
          estimatedDayRate: codeYesterdayValue > 0 ? Math.round((codeDayProfit / codeYesterdayValue) * 10000) / 100 : 0,
          gszzl: f.gszzl,
          latestConfirmedDate: latestConfirmed?.date || null,
          latestConfirmedEarnings: latestConfirmed?.earnings ?? null,
          latestConfirmedRate: latestConfirmed?.rate ?? null,
        });
      }

      // 汇总 fundDailyEarnings 中所有基金最新日期的确认收益
      let confirmedDate = null;
      let confirmedEarnings = 0;
      const dateEarnings = new Map();
      for (const code of Object.keys(scope)) {
        const records = Array.isArray(scope[code]) ? scope[code] : [];
        for (const r of records) {
          if (!r.date || typeof r.earnings !== 'number') continue;
          dateEarnings.set(r.date, (dateEarnings.get(r.date) || 0) + r.earnings);
        }
      }
      if (dateEarnings.size > 0) {
        const sortedDates = [...dateEarnings.keys()].sort().reverse();
        confirmedDate = sortedDates[0];
        confirmedEarnings = Math.round(dateEarnings.get(confirmedDate) * 100) / 100;
      }

      const dayProfit = todayValue - yesterdayValue;
      console.log(JSON.stringify({
        当前持仓市值: Math.round(todayValue * 100) / 100,
        持仓总成本: Math.round(totalCost * 100) / 100,
        持仓总收益: Math.round((todayValue - totalCost) * 100) / 100,
        总收益率: totalCost > 0 ? Math.round(((todayValue - totalCost) / totalCost) * 10000) / 100 : 0,
        昨日市值: Math.round(yesterdayValue * 100) / 100,
        今日估算收益: Math.round(dayProfit * 100) / 100,
        今日估算收益率: yesterdayValue > 0 ? Math.round((dayProfit / yesterdayValue) * 10000) / 100 : 0,
        最近确认日: confirmedDate,
        最近确认日收益: confirmedEarnings,
        基金数量: tFunds.length,
        持仓基金数: items.length,
        items,
      }, null, 2));
      break;
    }

    case 'summary': {
      const funds = getParsed('funds') || [];
      const holdings = getParsed('holdings') || {};
      let totalValue = 0;
      let totalCost = 0;
      const breakdown = [];

      for (const f of funds) {
        const h = holdings[f.code];
        if (!h || !h.share || !h.cost) continue;
        const nav = parseFloat(f.gsz) || parseFloat(f.dwjz) || 0;
        const share = parseFloat(h.share) || 0;
        const cost = parseFloat(h.cost) || 0;
        const currentValue = nav * share;
        const costValue = cost * share;
        const profit = currentValue - costValue;
        const profitRate = costValue > 0 ? (profit / costValue) * 100 : 0;

        totalValue += currentValue;
        totalCost += costValue;

        breakdown.push({
          code: f.code,
          name: f.name,
          nav,
          share,
          cost,
          currentValue: Math.round(currentValue * 100) / 100,
          costValue: Math.round(costValue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          profitRate: Math.round(profitRate * 100) / 100,
          gszzl: f.gszzl,
        });
      }

      console.log(JSON.stringify({
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round((totalValue - totalCost) * 100) / 100,
        totalProfitRate: totalCost > 0 ? Math.round(((totalValue - totalCost) / totalCost) * 10000) / 100 : 0,
        fundCount: funds.length,
        fundsWithHoldings: breakdown.filter((b) => b.share > 0).length,
        breakdown,
      }, null, 2));
      break;
    }

    default:
      usage();
  }
} finally {
  db.close();
}
