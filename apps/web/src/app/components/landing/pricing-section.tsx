const TIERS = [
  {
    name: 'Starter',
    tagline: 'For brands just getting started',
    features: [
      'Up to 10 active suppliers',
      'Document upload and tracking',
      'Expiry alerts',
      'Basic compliance reports',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    tagline: 'For scaling compliance teams',
    features: [
      'Up to 50 active suppliers',
      'Full document control and approval workflows',
      'Digital Product Passport exports',
      'EPR volume declarations',
      'Compliance scoring',
      'Supplier risk classification',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For complex supply chains',
    features: [
      'Unlimited suppliers',
      'Full API access',
      'Dedicated onboarding',
      'Custom document type workflows',
      'SSO and team permissions',
      'Priority support',
    ],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Pricing launches with general availability. Early access brands set their own terms.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                tier.popular
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/30 ring-2 ring-indigo-600'
                  : 'bg-slate-50 border border-slate-200 text-slate-900'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-indigo-600 text-[11px] font-bold px-3 py-1 rounded-full shadow">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-display font-black text-lg mb-1 ${tier.popular ? 'text-white' : 'text-slate-900'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm ${tier.popular ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {tier.tagline}
                </p>
              </div>

              <div className={`text-sm font-semibold mb-1 ${tier.popular ? 'text-indigo-100' : 'text-slate-400'}`}>
                Early access pricing
              </div>
              <div className={`text-xs mb-8 ${tier.popular ? 'text-indigo-200/70' : 'text-slate-400'}`}>
                Apply to learn more
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-indigo-200' : 'text-emerald-500'}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className={`text-sm ${tier.popular ? 'text-indigo-100' : 'text-slate-600'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#early-access"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 ${
                  tier.popular
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Apply for early access →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
