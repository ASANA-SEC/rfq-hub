// Data layer. Both backends answer the same actions through call(action, payload):
//   Remote — Google Apps Script web app (Sheets + Drive), used when API_URL is set
//   Demo   — this browser's localStorage with example data; runs the same rules (core.js)
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const DEMO_KEY = 'rfqhub_demo_v1';
  const DEMO_USER = 'rfqhub_demo_user';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* blocked */ } }

  function readBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () => reject(new Error('Could not read the file.'));
      r.readAsDataURL(file);
    });
  }

  // ------------------------------------------------------------ Remote

  const Remote = {
    mode: 'remote',
    token: null,

    async call(action, payload) {
      let res;
      try {
        res = await fetch(CFG.API_URL, {
          method: 'POST',
          // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, token: this.token, payload: payload || {} }),
        });
      } catch (e) {
        throw Object.assign(new Error('Cannot reach the server. Check your internet connection.'), { code: 'NETWORK' });
      }
      let out;
      try { out = await res.json(); } catch (e) {
        throw Object.assign(new Error('The server sent an unexpected reply. Check API_URL in config.js.'), { code: 'BAD_REPLY' });
      }
      if (!out.ok) throw Object.assign(new Error(out.error || 'Request failed'), { code: out.code });
      return out.data;
    },

    async upload(id, file) {
      return this.call('item.upload', { id, fileName: file.name, mimeType: file.type, base64: await readBase64(file) });
    },
  };

  // ------------------------------------------------------------ Demo

  function day(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  const stamp = (offsetDays) => new Date(Date.now() + offsetDays * 864e5).toISOString();

  const DEMO_ACCOUNTS = {
    'sam.secov@gmail.com': 'Super admin — everything, including accounts, access and sections',
    'szesian.mitosc@gmail.com': 'Super admin',
    'eileen.secov@gmail.com': 'Super admin',
    'hafiz@example.com': 'Client RFQ Register, Proposals, TC, Award / Result: Manager · Quotation Comparison: Viewer',
    'mei@example.com': 'Quotation Comparison: Manager · Proposals, Supplier RFQ / Quotations: Editor · Client RFQ Register, Supplier Register: Viewer',
    'siti@example.com': 'Supplier Register, Supplier RFQ / Quotations: Manager · Client RFQ Register: Viewer',
    'daniel@example.com': 'Technical Clarifications, Quotation Comparison: Contributor (technical input)',
    'raj@example.com': 'No section access — sees only the RFQs and proposals he follows',
  };

  function seed() {
    const SAM = 'sam.secov@gmail.com';
    const users = [
      ['sam.secov@gmail.com', 'Sam'], ['szesian.mitosc@gmail.com', 'Sze Sian'], ['eileen.secov@gmail.com', 'Eileen'], ['hafiz@example.com', 'Hafiz (Tender)'],
      ['mei@example.com', 'Mei Ling (Estimator)'], ['siti@example.com', 'Siti (Buyer)'], ['daniel@example.com', 'Daniel (Engineer)'], ['raj@example.com', 'Raj (Doc Control)'],
    ].map(([id, name]) => ({ id, name, active: true, createdBy: SAM, createdAt: stamp(-60), updatedAt: stamp(-60) }));

    const ids = { rfqs: 's_rfqs', suppliers: 's_sups', quotes: 's_quotes', comparison: 's_cmp', proposals: 's_props', clarifications: 's_tcs', awards: 's_awards' };
    const sections = window.TEMPLATES.map((t, i) => {
      const fields = clone(t.fields).map((f) => { if (f.type === 'link') f.target = ids[f.target] || ''; return f; });
      return { id: ids[t.id], name: t.name, template: t.id, order: i + 1, fields, stageField: t.stageField, archived: false, createdBy: SAM, createdAt: stamp(-60), updatedAt: stamp(-60) };
    });

    const access = [
      ['hafiz@example.com', 's_rfqs', 'manager'], ['hafiz@example.com', 's_props', 'manager'], ['hafiz@example.com', 's_tcs', 'manager'], ['hafiz@example.com', 's_awards', 'manager'], ['hafiz@example.com', 's_cmp', 'viewer'],
      ['mei@example.com', 's_cmp', 'manager'], ['mei@example.com', 's_props', 'editor'], ['mei@example.com', 's_quotes', 'editor'], ['mei@example.com', 's_rfqs', 'viewer'], ['mei@example.com', 's_sups', 'viewer'],
      ['siti@example.com', 's_sups', 'manager'], ['siti@example.com', 's_quotes', 'manager'], ['siti@example.com', 's_rfqs', 'viewer'],
      ['daniel@example.com', 's_tcs', 'contributor'], ['daniel@example.com', 's_cmp', 'contributor'],
    ].map(([userId, sectionId, level], i) => ({ id: 'a' + i, sectionId, userId, level, createdBy: SAM, createdAt: stamp(-60), updatedAt: stamp(-60) }));

    const item = (id, sectionId, title, data, editors, collaborators, ageDays) => ({
      id, sectionId, title, data, editors: [...new Set(editors || [])], collaborators: [...new Set(collaborators || [])], files: [],
      stageChangedAt: stamp(-(ageDays || 0)), createdBy: SAM, createdAt: stamp(-(ageDays || 0) - 2), updatedAt: stamp(-(ageDays || 0)),
    });
    const H = 'hafiz@example.com', M = 'mei@example.com', T = 'siti@example.com', D = 'daniel@example.com', R = 'raj@example.com';
    const pad = (n) => String(n).padStart(3, '0');
    const opt = (n) => (n === null ? '' : day(n));

    const rfq = (n, title, client, category, owner, stage, priority, mode, value, received, closing, age, cols) =>
      item('i_rq' + n, 's_rfqs', title, { rfqNo: 'RFQ-DEMO-' + pad(n), client, category, owner, stage, priority, submissionMode: mode, estValue: value, receivedDate: day(received), siteVisit: '', closingDate: day(closing), docsLink: '', notes: '' }, [owner, H], cols || [], age);
    const items = [
      rfq(1, 'Supply of ball valves & gate valves — 2027 requirement', 'Client A (example)', 'supply', H, 'sourcing', 'high', 'portal', 850000, -4, 9, 4),
      rfq(2, 'Maintenance of HVAC systems — 3 years', 'Client B (example)', 'service', H, 'preparing', 'urgent', 'portal', 2400000, -14, 5, 6, [M, R]),
      rfq(3, 'Supply of power cables & cable glands', 'Client C (example)', 'supply', M, 'submitted', 'normal', 'email', 320000, -30, -12, 12),
      rfq(4, 'Fabrication of pipe spools — Phase 2', 'Client A (example)', 'project', H, 'clarification', 'high', 'hardcopy', 1650000, -45, -20, 8),
      rfq(5, 'Calibration services 2027–2029', 'Client B (example)', 'service', M, 'received', 'normal', 'portal', 480000, -1, 18, 1),
      rfq(6, 'Supply of fire extinguishers & FM200 refill', 'Client D (example)', 'supply', H, 'awarded', 'normal', 'email', 210000, -60, -40, 6),
      rfq(7, 'Scaffolding services — turnaround 2027', 'Client C (example)', 'service', M, 'lost', 'normal', 'portal', 900000, -80, -55, 20),
      rfq(8, 'Supply of instrument tubing & fittings', 'Client E (example)', 'supply', H, 'reviewing', 'normal', 'email', 150000, -3, 12, 3),
    ];

    const sup = (n, title, category, contact, status, rating, brands, expiry, age) =>
      item('i_sp' + n, 's_sups', title, { supplierCode: 'SUP-' + pad(n), category, contact, phone: '', status, rating, brands, expiryDate: opt(expiry), website: '', notes: '' }, [T], [], age);
    items.push(
      sup(1, 'Supplier A Valves (example)', 'valves', 'Mr Tan', 'approved', 'a', 'Ball, gate & globe valves', 200, 90),
      sup(2, 'Supplier B Engineering (example)', 'fabrication', 'Mr Wong', 'approved', 'b', 'Pipe spools, structural steel', 30, 90),
      sup(3, 'Supplier C Electrical (example)', 'electrical', 'Ms Nurul', 'approved', 'a', 'Power cables, cable glands', 300, 60),
      sup(4, 'Supplier D HVAC (example)', 'mechanical', 'Mr Kumar', 'evaluation', '', 'AHU, chillers — maintenance', null, 20),
      sup(5, 'Supplier E Safety (example)', 'safety', 'Ms Lee', 'approved', 'b', 'Extinguishers, FM200 systems', 15, 90),
      sup(6, 'Supplier F Trading (example)', 'valves', 'Mr Lim', 'blacklisted', 'c', 'Late deliveries 2025', null, 120),
    );

    const quote = (n, title, rfqId, supId, buyer, status, amount, lead, ref, valid, due, age) =>
      item('i_qt' + n, 's_quotes', title, { enquiryNo: 'ENQ-DEMO-' + pad(n), rfq: rfqId, supplier: supId, buyer, status, quotedAmount: amount, leadTime: lead, quoteRef: ref, validUntil: opt(valid), quoteDue: day(due), notes: '' }, [T], [M], age);
    items.push(
      quote(1, 'Ball & gate valves — 46 line items', 'i_rq1', 'i_sp1', T, 'received', 520000, '8–10 weeks', 'Q-A-2291', 30, -2, 1),
      quote(2, 'Ball & gate valves — 46 line items', 'i_rq1', 'i_sp2', T, 'sent', 0, '', '', null, -1, 4),
      quote(3, 'HVAC maintenance — manpower & spares', 'i_rq2', 'i_sp4', T, 'clarifying', 1480000, 'Mobilise 2 weeks', 'Q-D-0817', 45, -1, 4),
      quote(4, 'HVAC maintenance — manpower & spares', 'i_rq2', 'i_sp2', T, 'received', 1560000, 'Mobilise 3 weeks', 'Q-B-1120', 40, -3, 3),
      quote(5, 'Power cables & glands', 'i_rq3', 'i_sp3', T, 'selected', 236000, '6 weeks', 'Q-C-0455', 20, -18, 15),
      quote(6, 'Pipe spools Phase 2 — fabrication', 'i_rq4', 'i_sp2', T, 'selected', 1120000, '14 weeks', 'Q-B-1093', 10, -30, 25),
      quote(7, 'Calibration 2027–2029 — 3-year rates', 'i_rq5', 'i_sp3', T, 'to_send', 0, '', '', null, 6, 0.5),
      quote(8, 'Extinguishers & FM200 refill', 'i_rq6', 'i_sp5', T, 'selected', 148000, '3 weeks', 'Q-E-0302', -20, -50, 45),
      quote(9, 'Ball & gate valves — 46 line items', 'i_rq1', 'i_sp6', T, 'declined', 0, '', '', null, -1, 2),
    );

    const cmp = (n, title, rfqId, status, recId, count, cost, markup, selling, due, age) =>
      item('i_cp' + n, 's_cmp', title, { rfq: rfqId, preparedBy: M, status, recommended: recId, quotesCount: count, costTotal: cost, markup, sellingPrice: selling, dueDate: day(due), notes: '' }, [M], [H, D], age);
    items.push(
      cmp(1, 'Valves cost sheet — RFQ-DEMO-001', 'i_rq1', 'pricing', 'i_sp1', '2 of 3', 520000, 18, 613600, 5, 1),
      cmp(2, 'HVAC maintenance cost build-up', 'i_rq2', 'approval', 'i_sp4', '2 of 2', 1480000, 15, 1702000, 2, 3),
      cmp(3, 'Power cable comparison', 'i_rq3', 'approved', 'i_sp3', '3 of 3', 236000, 20, 283200, -14, 16),
      cmp(4, 'Pipe spools Phase 2 cost sheet', 'i_rq4', 'approved', 'i_sp2', '2 of 2', 1120000, 22, 1366400, -24, 26),
      cmp(5, 'Extinguishers & FM200 comparison', 'i_rq6', 'approved', 'i_sp5', '2 of 2', 148000, 25, 185000, -45, 45),
    );

    const prop = (n, title, rfqId, type, owner, status, value, rev, submitted, valid, deadline, age, cols) =>
      item('i_pp' + n, 's_props', title, { proposalNo: 'QT-DEMO-' + pad(n), rfq: rfqId, proposalType: type, owner, status, submittedValue: value, revision: rev, submittedDate: opt(submitted), validUntil: opt(valid), deadline: day(deadline), notes: '' }, [owner, M], cols || [], age);
    items.push(
      prop(1, 'CP & TP — HVAC maintenance 3 years', 'i_rq2', 'cp_tp', H, 'review', 1702000, 'Rev 0', null, null, 5, 3, [R]),
      prop(2, 'CP & TP — power cables & glands', 'i_rq3', 'cp_tp', M, 'submitted', 283200, 'Rev 0', -12, 78, -12, 12),
      prop(3, 'CP & TP — pipe spools Phase 2', 'i_rq4', 'cp_tp', H, 'revised', 1340000, 'Rev 1 (after TC)', -6, 84, -20, 6),
      prop(4, 'CP — extinguishers & FM200 refill', 'i_rq6', 'cp', H, 'closed', 185000, 'Rev 0', -40, 50, -40, 40),
      prop(5, 'CP & TP — scaffolding turnaround 2027', 'i_rq7', 'cp_tp', M, 'closed', 960000, 'Rev 0', -55, 35, -55, 50),
      prop(6, 'CP & TP — valves 2027 requirement', 'i_rq1', 'cp_tp', H, 'drafting', 613600, 'Rev 0', null, null, 9, 1),
    );

    const tc = (n, title, rfqId, propId, type, status, priority, received, due, age) =>
      item('i_tc' + n, 's_tcs', title, { tcNo: 'TC-DEMO-' + pad(n), rfq: rfqId, proposal: propId, tcType: type, status, priority, receivedDate: day(received), responseDue: day(due), notes: '' }, [H, D], [M], age);
    items.push(
      tc(1, 'Confirm hydrotest pressure for spools', 'i_rq4', 'i_pp3', 'technical', 'received', 'high', -2, 2, 2),
      tc(2, 'Clarify NDT extent — RT 10% vs 100%', 'i_rq4', 'i_pp3', 'technical', 'preparing', 'urgent', -4, 0, 3),
      tc(3, 'Confirm payment terms and LD cap', 'i_rq4', 'i_pp3', 'commercial', 'submitted', 'normal', -8, -3, 3),
      tc(4, 'Number of AHUs and chillers in scope', 'i_rq2', 'i_pp1', 'prebid', 'submitted', 'normal', -10, -6, 9),
      tc(5, 'Delivery schedule breakdown by lot', 'i_rq3', 'i_pp2', 'postbid', 'closed', 'normal', -7, -4, 4),
    );

    const award = (n, title, rfqId, propId, result, value, po, reason, winner, resultDate, due, age) =>
      item('i_aw' + n, 's_awards', title, { rfq: rfqId, proposal: propId, result, awardedValue: value, poNo: po, lossReason: reason, winner, resultDate: opt(resultDate), dueDate: day(due), notes: '' }, [H], [T], age);
    items.push(
      award(1, 'Extinguishers & FM200 — awarded', 'i_rq6', 'i_pp4', 'awarded', 185000, 'PO-DEMO-5521', '', '', -6, 1, 6),
      award(2, 'Scaffolding TA 2027 — lost', 'i_rq7', 'i_pp5', 'lost', 0, '', 'price', 'Competitor X at RM 845,000', -20, -20, 20),
      award(3, 'Power cables — awaiting result', 'i_rq3', 'i_pp2', 'awaiting', 0, '', '', '', null, 18, 12),
      award(4, 'Pipe spools Phase 2 — negotiation', 'i_rq4', 'i_pp3', 'negotiation', 0, '', '', '', null, 7, 3),
    );
    return { users, sections, access, items, comments: [] };
  }

  function demoStore() {
    let db = null;
    function load() {
      if (db) return db;
      try { db = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { db = null; }
      if (!db || !Array.isArray(db.sections)) db = seed();
      ['users', 'sections', 'access', 'items', 'comments'].forEach((t) => { if (!Array.isArray(db[t])) db[t] = []; });
      persist();
      return db;
    }
    function persist() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch (e) { /* blocked */ } }
    const noDrive = () => Core.fail('DEMO', 'Attachments are saved to Google Drive. They start working after the Google setup in README.md.');
    return {
      all: (t) => clone(load()[t]),
      insert: (t, rec) => { load()[t].push(clone(rec)); persist(); },
      insertMany: (t, recs) => { load()[t].push(...clone(recs)); persist(); },
      save: (t, rec) => {
        const rows = load()[t];
        const i = rows.findIndex((r) => r.id === rec.id);
        if (i < 0) throw Core.fail('NOT_FOUND', 'This record no longer exists.');
        rows[i] = clone(rec);
        persist();
      },
      del: (t, id) => { db[t] = load()[t].filter((r) => r.id !== id); persist(); },
      delWhere: (t, fn) => { db[t] = load()[t].filter((r) => !fn(r)); persist(); },
      now: () => new Date().toISOString(),
      uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      saveFile: () => { throw noDrive(); },
      readFile: () => { throw noDrive(); },
      reset: () => { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* blocked */ } db = null; },
    };
  }

  const store = demoStore();

  const Demo = {
    mode: 'demo',
    me: null,

    restore() {
      const email = ssGet(DEMO_USER);
      if (!email) return false;
      try { this.me = Core.identify(store, email, ''); } catch (e) { this.me = null; ssSet(DEMO_USER, null); }
      return !!this.me;
    },
    login(email) {
      this.me = Core.identify(store, email, '');
      ssSet(DEMO_USER, email);
    },
    logout() { this.me = null; ssSet(DEMO_USER, null); },
    accounts() {
      return store.all('users').filter((u) => u.active !== false)
        .map((u) => ({ id: u.id, name: u.name, note: DEMO_ACCOUNTS[u.id] || 'Added in this demo' }));
    },
    async call(action, payload) {
      if (!this.me) throw Core.fail('AUTH_REQUIRED', 'Please sign in.');
      // Re-check the account each call, like the server does
      this.me = Core.identify(store, this.me.id, '');
      return clone(Core.handle(store, this.me, action, payload || {}));
    },
    async upload(id, file) {
      return this.call('item.upload', { id, fileName: file.name, mimeType: file.type, base64: '' });
    },
    reset() { store.reset(); this.logout(); },
  };

  // On this computer, http://localhost:8765/?demo forces demo mode for testing.
  // &reset starts from fresh example data; &as=<email> signs in as that example account (used to record the user guide).
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const params = new URLSearchParams(location.search);
  const forceDemo = local && params.has('demo');
  if (forceDemo && params.has('reset')) store.reset();
  if (forceDemo && params.get('as')) { try { Demo.login(params.get('as')); } catch (e) { /* unknown example account */ } }
  Demo.clean = forceDemo && params.has('clean'); // hide the demo banner for user-guide screenshots
  window.API = CFG.API_URL && !forceDemo ? Remote : Demo;
})();
