# RFQ Hub — RFQ 寻源与投标平台

跟 Project Hub 同一套系统（登录、权限、Section、栏位模板、筛选、日历、导出、封存/还原全部一样），但**数据、用户名单、后端完全独立**：

- 网址：<https://asana-sec.github.io/rfq-hub/>
- **Super admin（3 位）**：`sam.secov@gmail.com`、`szesian.mitosc@gmail.com`、`eileen.secov@gmail.com`（写在 `assets/core.js` 的 SUPER_ADMINS）
- Project Hub 的账号**不会**自动带过来，要在 RFQ Hub 的 Users & access 另外加
- 使用手册：平台左下角 **Help** 直接打开 Project Hub 的手册（操作完全一样）

## 预设 Section（第一次登录按「Create the standard sections」自动建好）

| Section | 流程（Stage / Status） | 截止日期栏 |
|---|---|---|
| **Client RFQ Register** | Received → Go / No-Go Review → Sourcing Supplier Quotes → Preparing CP & TP → Submitted — awaiting result → Under Clarification (TC) → Awarded / Lost / Regret (No Bid) / Cancelled | Closing date |
| **Supplier Register** | Under Evaluation → Approved (AVL) / Conditional → Inactive / Blacklisted | Approval / licence expiry |
| **Supplier RFQ / Quotations** | To Send → Sent — waiting quote → Quote Received → Clarifying → Selected / Not Selected / Supplier Declined | Quote due from supplier |
| **Quotation Comparison** | Preparing → Technical Evaluation → Pricing / Mark-up → Pending Approval → Approved（或 Revise） | Needed by |
| **Proposal Submission (CP & TP)** | Drafting → Internal Review → Approved — ready to submit → Submitted → Revised / Resubmitted → Closed | Submission deadline |
| **Technical Clarifications (TC)** | Received → Preparing Reply → Reply Submitted → Closed | Reply due |
| **Award / Result** | Awaiting Result → Negotiation → Awarded — to hand over → Handed over to Contracts / Lost / Cancelled | Follow up / hand over by |

- 关联：Supplier Quotation、Comparison、Proposal、TC、Award 都连到 Client RFQ；Quotation 和 Comparison 连到 Supplier；TC 和 Award 还可以连到 Proposal
- 金额栏会自动加总（RFQ 预估值、供应商报价、成本 / 售价、提交金额、得标金额）
- 卡太久会自动出现提醒标签（例如供应商询价寄出 3 天没回、Comparison 等批准超过 2 天、TC 收到 1 天还没动、得标 5 天还没交给 Contract Hub）
- **Deadline met（RFQ Hub 新加的）**：阶段可以勾「Deadline met」，表示还没结案但截止日已经不重要（例如 RFQ 已 Submitted、TC 已回复），这样过了 closing date 不会被算成 Late。Project Hub / Procurement / Contract Hub 还没有这个功能
- 栏位、阶段、提醒天数都能在线上 **Customize columns** 修改
- 得标后的合同管理接到 **Contract & Service Hub**（Award / Result 的「Handed over to Contracts」）

## 上线步骤（Sam 做，约 5 分钟）

Google 登录的 Client ID **沿用 Project Hub 那个**（同一个网域 asana-sec.github.io），不用再去 Google Cloud 建。只要建一个新的后端：

1. 打开 <https://script.google.com/>（用 `sam.secov@gmail.com`）→ **New project**，项目名改成 `RFQ Hub API`
2. 把 `apps-script/Code.gs` 的全部内容贴进 `Code.gs`
3. 左侧 Files 旁边按 **+ → Script**，命名为 `Core`，把 `assets/core.js` 的全部内容贴进去
4. 左侧 ⚙️ **Project Settings** → Time zone 选 `(GMT+08:00) Kuala Lumpur`
5. 回到 `Code.gs`，函数选单选 **setup** → **Run** → 授权（未验证的应用 → Advanced → Go to RFQ Hub API）
   - 会新建 **RFQ Hub — Data**（Google Sheet）、**RFQ Hub — Files**（Drive 文件夹）和 **RFQ Hub** 日历
6. **Deploy → New deployment** → Web app，Execute as **Me**，Who has access **Anyone** → 复制 **Web app URL**（结尾 `/exec`）交给小助
7. 小助填进 `config.js`（同时把 index.html 的 `config.js?v=` 加 1）推上线后，打开网址登录 → **Create the standard sections** → Users & access 加同事

> 以后 Code.gs 或 core.js 有更新，两个文件都要重新贴，再 **Deploy → Manage deployments → ✏️ → New version**，网址不变。
> Google Sheet 的分页保持普通范围，**不要**转成 Table。

## 本机测试

```bash
py -3 -m http.server 8768
```

打开 `http://localhost:8768/?demo`：演示模式，示例账号包括 Hafiz（Tender）、Mei Ling（Estimator）、Siti（Buyer）、Daniel（Engineer）、Raj（Doc Control，没有 Section 权限）。

## 跟其他平台的差别

| 项目 | Project Hub | Procurement | Contract & Service Hub | RFQ Hub |
|---|---|---|---|---|
| 网址 | `/project-hub/` | `/procurement/` | `/contract-hub/` | `/rfq-hub/` |
| 后端 / Sheet / Drive / 日历 | Project Hub API | Procurement API | Contract Hub API | RFQ Hub API（独立） |
| 浏览器存档键名 | `projecthub_*` | `procurement_*` | `contracthub_*` | `rfqhub_*`（同网域，互不干扰） |
| 主色 / 标志 | 蓝 / PH | 绿 / PR | 紫 / CS | 橙 / RQ |
| 封存文件 | 四边格式相同，可以互相还原 | | | |

## 文件结构

| 文件 | 用途 |
|---|---|
| `index.html` | 网页入口 |
| `config.js` | 设定（API 网址、Client ID、名称） |
| `assets/core.js` | 权限与数据规则：网页和后端共用（后端贴成 Core.gs） |
| `assets/templates.js` | 7 个 RFQ Section 的预设模板 |
| `assets/app.js` | 全部画面和操作 |
| `assets/api.js` | 数据层（演示模式示例数据 / Google 后端） |
| `assets/archive.js` | 封存 / 备份 / 还原 |
| `assets/style.css` | 样式 |
| `apps-script/Code.gs` | Google 后端 |
