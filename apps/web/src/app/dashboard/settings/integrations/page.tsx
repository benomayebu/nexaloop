const INTEGRATIONS = [
  {
    category: 'Catalog',
    items: [
      { name: 'Shopify', desc: 'Sync products and SKUs from your storefront' },
      { name: 'WooCommerce', desc: 'Import product catalog from WordPress' },
    ],
  },
  {
    category: 'PLM',
    items: [
      { name: 'Centric PLM', desc: 'Pull product specs and bills of materials' },
    ],
  },
  {
    category: 'ERP',
    items: [
      { name: 'SAP', desc: 'Push compliance status to SAP purchasing module' },
      { name: 'Sage X3', desc: 'Sync supplier compliance status with ERP' },
    ],
  },
  {
    category: 'Documents',
    items: [
      { name: 'DocuSign', desc: 'Send onboarding and NDA agreements to suppliers' },
    ],
  },
  {
    category: 'Communications',
    items: [
      { name: 'Slack', desc: 'Post compliance alerts to a channel' },
      { name: 'Microsoft Teams', desc: 'Post compliance alerts to a Teams channel' },
    ],
  },
  {
    category: 'Compliance',
    items: [
      { name: 'amfori BSCI', desc: 'Auto-import BSCI audit results from amfori' },
      { name: 'OEKO-TEX', desc: 'Verify certificates directly with OEKO-TEX' },
    ],
  },
  {
    category: 'Developer',
    items: [
      { name: 'Webhooks', desc: 'Push events to your own endpoint' },
      { name: 'REST API', desc: 'Programmatic access to your N.E.X.A Loop data' },
    ],
  },
];

export default function IntegrationsSettingsPage() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500 mt-0.5">Connect N.E.X.A Loop to the tools your team already uses.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-900">Integrations are coming soon</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              We&apos;re building connectors for the tools below. Interested in a specific integration? Let us know at support@nexaloop.io
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {INTEGRATIONS.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">{group.category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((item) => (
                <div key={item.name} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-slate-600">{item.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
