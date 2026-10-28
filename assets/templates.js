// Starter templates for new sections. Once a section is created its columns live in the
// Google Sheet and are edited in the app (Customize), so changing this file only affects
// sections created afterwards. `target` on a link column names another template id; it is
// matched to the section created from that template, so a template must come after the
// ones it links to.
(function () {
  'use strict';
  const o = (value, label, color, extra) => Object.assign({ value, label, color }, extra || {});
  const title = (label) => ({ key: 'title', label, type: 'text', required: true, system: true, onCard: true });

  const priority = () => ({ key: 'priority', label: 'Priority', type: 'select', onCard: true, options: [o('normal', 'Normal', 'gray'), o('high', 'High', 'amber'), o('urgent', 'Urgent', 'red')] });
  const rfq = () => ({ key: 'rfq', label: 'Client RFQ', type: 'link', target: 'rfqs', onCard: true });
  const proposal = () => ({ key: 'proposal', label: 'Proposal', type: 'link', target: 'proposals' });

  window.TEMPLATES = [
    {
      id: 'rfqs',
      name: 'Client RFQ Register',
      blurb: 'Every RFQ / tender received, from Go / No-Go to submission and result.',
      stageField: 'stage',
      fields: [
        title('RFQ title / scope'),
        { key: 'rfqNo', label: 'Client RFQ / tender no.', type: 'text', required: true, onCard: true },
        { key: 'client', label: 'Client', type: 'text', onCard: true },
        { key: 'category', label: 'Category', type: 'select', onCard: true, options: [o('supply', 'Supply', 'blue'), o('project', 'Project / EPCC', 'purple'), o('service', 'Service / Maintenance', 'teal')] },
        { key: 'owner', label: 'Tender PIC', type: 'person', onCard: true },
        { key: 'stage', label: 'Stage', type: 'select', options: [
          o('received', 'Received', 'gray', { alertDays: 2 }),
          o('reviewing', 'Go / No-Go Review', 'amber', { alertDays: 3 }),
          o('sourcing', 'Sourcing Supplier Quotes', 'blue', { alertDays: 7 }),
          o('preparing', 'Preparing CP & TP', 'purple', { alertDays: 5 }),
          o('submitted', 'Submitted — awaiting result', 'teal', { alertDays: 30, met: true }),
          o('clarification', 'Under Clarification (TC)', 'amber', { alertDays: 7, met: true }),
          o('awarded', 'Awarded', 'green', { done: true }),
          o('lost', 'Lost', 'red', { done: true }),
          o('nobid', 'Regret / No Bid', 'gray', { done: true }),
          o('cancelled', 'Cancelled by Client', 'gray', { done: true }),
        ] },
        priority(),
        { key: 'submissionMode', label: 'Submission mode', type: 'select', options: [o('portal', 'E-tender portal', 'blue'), o('email', 'Email', 'teal'), o('hardcopy', 'Hardcopy / tender box', 'amber')] },
        { key: 'estValue', label: 'Estimated value', type: 'currency', total: true, onCard: true },
        { key: 'receivedDate', label: 'Received on', type: 'date' },
        { key: 'siteVisit', label: 'Site visit / briefing', type: 'date' },
        { key: 'closingDate', label: 'Closing date', type: 'date', due: true, onCard: true },
        { key: 'docsLink', label: 'Tender portal / documents link', type: 'url' },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'suppliers',
      name: 'Supplier Register',
      blurb: 'Suppliers and subcontractors we source from, with category, rating and approval expiry.',
      stageField: 'status',
      fields: [
        title('Supplier name'),
        { key: 'supplierCode', label: 'Supplier code', type: 'text', onCard: true },
        { key: 'category', label: 'Category', type: 'select', onCard: true, options: [o('valves', 'Valves & Piping', 'blue'), o('electrical', 'Electrical & Instrument', 'amber'), o('mechanical', 'Mechanical / HVAC', 'teal'), o('fabrication', 'Fabrication', 'purple'), o('safety', 'Safety & Fire', 'red'), o('services', 'Services / Subcon', 'green'), o('other', 'Others', 'gray')] },
        { key: 'contact', label: 'Contact person', type: 'text' },
        { key: 'phone', label: 'Phone / email', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('evaluation', 'Under Evaluation', 'amber', { alertDays: 14 }),
          o('approved', 'Approved (AVL)', 'green'),
          o('conditional', 'Conditional', 'blue'),
          o('inactive', 'Inactive', 'gray', { done: true }),
          o('blacklisted', 'Blacklisted', 'red', { done: true }),
        ] },
        { key: 'rating', label: 'Rating', type: 'select', onCard: true, options: [o('a', 'A — preferred', 'green'), o('b', 'B — acceptable', 'blue'), o('c', 'C — use with care', 'amber')] },
        { key: 'brands', label: 'Brands / products', type: 'text' },
        { key: 'expiryDate', label: 'Approval / licence expiry', type: 'date', due: true, onCard: true },
        { key: 'website', label: 'Website', type: 'url' },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'quotes',
      name: 'Supplier RFQ / Quotations',
      blurb: 'Enquiries we send to suppliers for each client RFQ, and the quotations that come back.',
      stageField: 'status',
      fields: [
        title('Items / scope requested'),
        { key: 'enquiryNo', label: 'Our enquiry no.', type: 'text', required: true, onCard: true },
        rfq(),
        { key: 'supplier', label: 'Supplier', type: 'link', target: 'suppliers', onCard: true },
        { key: 'buyer', label: 'Buyer', type: 'person' },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('to_send', 'To Send', 'gray', { alertDays: 1 }),
          o('sent', 'Sent — waiting quote', 'amber', { alertDays: 3 }),
          o('received', 'Quote Received', 'blue', { met: true }),
          o('clarifying', 'Clarifying with Supplier', 'purple', { alertDays: 3, met: true }),
          o('selected', 'Selected', 'green', { done: true }),
          o('not_selected', 'Not Selected', 'gray', { done: true }),
          o('declined', 'Supplier Declined', 'red', { done: true }),
        ] },
        { key: 'quotedAmount', label: 'Quoted amount', type: 'currency', total: true, onCard: true },
        { key: 'leadTime', label: 'Delivery / lead time', type: 'text' },
        { key: 'quoteRef', label: 'Supplier quote ref.', type: 'text' },
        { key: 'validUntil', label: 'Quote valid until', type: 'date' },
        { key: 'quoteDue', label: 'Quote due from supplier', type: 'date', due: true, onCard: true },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'comparison',
      name: 'Quotation Comparison',
      blurb: 'Cost sheets and bid evaluations: compare suppliers, set the mark-up and approve the selling price.',
      stageField: 'status',
      fields: [
        title('Comparison / cost sheet'),
        rfq(),
        { key: 'preparedBy', label: 'Prepared by (estimator)', type: 'person', onCard: true },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('preparing', 'Preparing', 'gray', { alertDays: 3 }),
          o('tech_review', 'Technical Evaluation', 'blue', { alertDays: 3 }),
          o('pricing', 'Pricing / Mark-up', 'purple', { alertDays: 3 }),
          o('approval', 'Pending Approval', 'amber', { alertDays: 2 }),
          o('revise', 'Revise', 'red', { alertDays: 2 }),
          o('approved', 'Approved', 'green', { done: true }),
        ] },
        { key: 'recommended', label: 'Recommended supplier', type: 'link', target: 'suppliers', onCard: true },
        { key: 'quotesCount', label: 'Quotes compared', type: 'text' },
        { key: 'costTotal', label: 'Total cost', type: 'currency', total: true },
        { key: 'markup', label: 'Mark-up', type: 'percent' },
        { key: 'sellingPrice', label: 'Proposed selling price', type: 'currency', total: true, onCard: true },
        { key: 'dueDate', label: 'Needed by', type: 'date', due: true, onCard: true },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'proposals',
      name: 'Proposal Submission (CP & TP)',
      blurb: 'Commercial and technical proposals, from drafting and internal review to submission.',
      stageField: 'status',
      fields: [
        title('Proposal'),
        { key: 'proposalNo', label: 'Proposal / quotation no.', type: 'text', required: true, onCard: true },
        rfq(),
        { key: 'proposalType', label: 'Type', type: 'select', onCard: true, options: [o('cp_tp', 'CP & TP', 'purple'), o('cp', 'Commercial (CP) only', 'blue'), o('tp', 'Technical (TP) only', 'teal')] },
        { key: 'owner', label: 'Proposal owner', type: 'person', onCard: true },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('drafting', 'Drafting', 'gray', { alertDays: 3 }),
          o('review', 'Internal Review', 'amber', { alertDays: 2 }),
          o('ready', 'Approved — ready to submit', 'blue', { alertDays: 1 }),
          o('submitted', 'Submitted', 'teal', { met: true }),
          o('revised', 'Revised / Resubmitted', 'purple', { met: true }),
          o('closed', 'Closed', 'green', { done: true }),
        ] },
        { key: 'submittedValue', label: 'Submitted value', type: 'currency', total: true, onCard: true },
        { key: 'revision', label: 'Revision', type: 'text' },
        { key: 'submittedDate', label: 'Submitted on', type: 'date' },
        { key: 'validUntil', label: 'Bid validity until', type: 'date' },
        { key: 'deadline', label: 'Submission deadline', type: 'date', due: true, onCard: true },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'clarifications',
      name: 'Technical Clarifications (TC)',
      blurb: 'Pre-bid queries and the client’s technical / commercial clarifications, with response deadlines.',
      stageField: 'status',
      fields: [
        title('Clarification / query'),
        { key: 'tcNo', label: 'TC / query no.', type: 'text', onCard: true },
        rfq(),
        proposal(),
        { key: 'tcType', label: 'Type', type: 'select', onCard: true, options: [o('prebid', 'Pre-bid query (ours)', 'gray'), o('technical', 'Technical clarification', 'blue'), o('commercial', 'Commercial clarification', 'amber'), o('postbid', 'Post-bid / negotiation', 'purple')] },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('received', 'Received', 'gray', { alertDays: 1 }),
          o('preparing', 'Preparing Reply', 'amber', { alertDays: 2 }),
          o('submitted', 'Reply Submitted', 'blue', { alertDays: 7, met: true }),
          o('closed', 'Closed', 'green', { done: true }),
        ] },
        priority(),
        { key: 'receivedDate', label: 'Received on', type: 'date' },
        { key: 'responseDue', label: 'Reply due', type: 'date', due: true, onCard: true },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'awards',
      name: 'Award / Result',
      blurb: 'The outcome of every submission: awarded (LOA / PO) and handed over, or lost and why.',
      stageField: 'result',
      fields: [
        title('Result'),
        rfq(),
        proposal(),
        { key: 'result', label: 'Result', type: 'select', options: [
          o('awaiting', 'Awaiting Result', 'gray', { alertDays: 30 }),
          o('negotiation', 'Negotiation', 'amber', { alertDays: 7 }),
          o('awarded', 'Awarded — to hand over', 'blue', { alertDays: 5 }),
          o('handed', 'Handed over to Contracts', 'green', { done: true }),
          o('lost', 'Lost', 'red', { done: true }),
          o('cancelled', 'Cancelled', 'gray', { done: true }),
        ] },
        { key: 'awardedValue', label: 'Awarded value', type: 'currency', total: true, onCard: true },
        { key: 'poNo', label: 'LOA / PO no.', type: 'text', onCard: true },
        { key: 'lossReason', label: 'Reason lost', type: 'select', options: [o('price', 'Price', 'red'), o('technical', 'Technical', 'amber'), o('delivery', 'Delivery / schedule', 'blue'), o('registration', 'Not registered / not qualified', 'purple'), o('other', 'Other', 'gray')] },
        { key: 'winner', label: 'Winning bidder / price', type: 'text' },
        { key: 'resultDate', label: 'Result received on', type: 'date' },
        { key: 'dueDate', label: 'Follow up / hand over by', type: 'date', due: true, onCard: true },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
  ];

  /** A new section's settings from a template, with link columns pointed at existing sections. */
  window.sectionFromTemplate = function (tpl, sections) {
    const fields = JSON.parse(JSON.stringify(tpl.fields)).map((f) => {
      if (f.type === 'link') {
        const t = sections.find((s) => s.template === f.target && !s.archived);
        f.target = t ? t.id : '';
      }
      return f;
    });
    return { name: tpl.name, template: tpl.id, fields, stageField: tpl.stageField };
  };
})();
