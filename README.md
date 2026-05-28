# 实时基金估值 (Real-time Fund Valuation)

一个基于 Next.js 开发的基金估值与重仓股实时追踪工具。采用玻璃拟态设计（Glassmorphism），支持移动端适配。

## Star History

<a href="https://www.star-history.com/?repos=hzm0321%2Freal-time-fund&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=hzm0321/real-time-fund&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=hzm0321/real-time-fund&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=hzm0321/real-time-fund&type=date&legend=top-left" />
 </picture>
</a>

## 特性

- **实时估值**：通过输入基金编号，实时获取并展示基金的单位净值、估值净值及实时涨跌幅。
- **重仓追踪**：自动获取基金前 10 大重仓股票，并实时追踪重仓股的盘中涨跌情况。支持收起/展开展示。
- **自托管部署**：基于 Express + SQLite 的单用户自托管架构，数据存储在自己的服务器上。
- **服务端持久化**：数据存储于 SQLite 数据库，localStorage 作为本地缓存层，服务端重启不丢失。
- **响应式设计**：完美适配 PC 与移动端。针对移动端优化了文字展示、间距及交互体验。
- **自选功能**：支持将基金添加至"自选"列表，通过 Tab 切换展示全部基金或仅自选基金。自选状态支持持久化及同步清理。
- **分组管理**：支持创建多个基金分组，方便按用途或类别管理基金。
- **持仓管理**：记录每只基金的持有份额和成本价，自动计算持仓收益和累计收益。
- **交易记录**：支持买入/卖出操作，记录交易历史，支持查看单个基金的交易明细。
- **定投计划**：支持设置自动定投计划，可按日/周/月等周期自动生成买入交易。
- **自定义排序**：支持多种排序规则（估值涨跌幅、持仓收益、持有金额等），可自由组合和启用/禁用规则。
- **拖拽排序**：在默认排序模式下可通过拖拽调整基金顺序。
- **明暗主题**：支持亮色/暗色主题切换，一键换肤。
- **导入/导出**：支持将配置导出为 JSON 文件备份，或从文件导入恢复。
- **可自定义频率**：支持设置自动刷新间隔（5秒 - 300秒），并提供手动刷新按钮。

## 技术栈

- **框架**：[Next.js](https://nextjs.org/) (App Router)
- **后端**：Express + SQLite
- **CLI**：jigubao（自托管数据查询工具）
- **样式**：原生 CSS (Global CSS) + 玻璃拟态设计
- **数据源**：
  - 基金估值：天天基金 (JSONP)
  - 重仓数据：东方财富 (HTML Parsing)
  - 股票行情：腾讯财经 (Script Tag Injection)
- **部署**：自托管 Node.js 服务

## 快速开始

### 本地开发

1. 克隆仓库：
   ```bash
   git clone https://github.com/hzm0321/real-time-fund.git
   cd real-time-fund
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   ```bash
   cp env.example .env.local
   ```
   按照 `env.example` 填入以下值：
  - `NEXT_PUBLIC_API_BASE_URL`：API 服务地址。留空表示同源部署（API 与静态文件由同一 Express 服务提供）
  - `NEXT_PUBLIC_GA_ID`：Google Analytics Measurement ID（如 `G-xxxx`，可选）
  - `NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL`：GitHub 最新 Release 接口地址，用于在页面中展示"发现新版本"提示（可选）

  注：如不使用 GA 统计或版本提示功能，可不设置对应变量。

4. 运行开发服务器：
   ```bash
   npm run dev
   ```
   访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 生产部署

```bash
npm run build          # 构建静态文件到 out/
npm run server         # 启动 Express 服务（静态文件 + API + SQLite）
```

服务默认监听 3000 端口，可通过 `PORT` 环境变量修改。

`npm run server` 启动后会自动：
- 在 `data/` 目录创建 SQLite 数据库
- 提供 `/api/state` REST API（GET/PUT 读写用户数据）
- 提供 SPA 路由回退（所有非 `/api` 请求返回 `index.html`）

## 使用说明

1. **添加基金**：在顶部输入框输入 6 位基金代码（如 `110022`），点击"添加"。
2. **查看详情**：卡片将展示实时估值及前 10 重仓股的占比与今日涨跌。
3. **调整频率**：点击右上角"设置"图标，可调整自动刷新的间隔时间。
4. **删除基金**：点击卡片右上角的红色删除图标即可移除。

## 免责声明

本项目所有数据均来自公开接口，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议。

## 开源协议 (License)

本项目采用 **[GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html)**（AGPL-3.0）开源协议。

- **允许**：自由使用、修改、分发本软件；若你通过网络服务向用户提供基于本项目的修改版本，须向该服务的用户提供对应源代码。
- **要求**：基于本项目衍生或修改的作品需以相同协议开源，并保留版权声明与协议全文。
- **无担保**：软件按「原样」提供，不提供任何明示或暗示的担保。

完整协议文本见仓库根目录 [LICENSE](./LICENSE) 文件，或 [GNU AGPL v3 官方说明](https://www.gnu.org/licenses/agpl-3.0.html)。  

---
二开或转载需注明出处。  
Made by [hzm](https://github.com/hzm0321)
