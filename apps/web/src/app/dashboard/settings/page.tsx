import Link from 'next/link';

const settingsCards = [
  {
    href: '/dashboard/settings/document-types',
    title: 'Document Types',
    description: 'Manage the types of compliance documents required from suppliers (e.g. GOTS Certificate, Audit Report).',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your organisation configuration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-100 transition-colors">
              {card.icon}
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">{card.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
