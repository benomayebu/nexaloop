import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — N.E.X.A Loop',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-8 inline-block"
        >
          &larr; Back to N.E.X.A Loop
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: May 2026</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Data Controller</h2>
            <p className="text-slate-600 leading-relaxed">
              N.E.X.A Loop (&quot;we&quot;, &quot;us&quot;) is the data controller for personal data
              collected through the Service. We are committed to protecting your privacy in
              compliance with the General Data Protection Regulation (GDPR) and applicable EU data
              protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Data We Collect</h2>
            <p className="text-slate-600 leading-relaxed">
              We collect the following categories of personal data:
            </p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 mt-2">
              <li>Account information (name, email address, organisation name)</li>
              <li>Organisation data (country, VAT/Tax ID, industry)</li>
              <li>Supply chain data (supplier names, contacts, compliance documents)</li>
              <li>Usage data (login activity, feature usage for product improvement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
            <p className="text-slate-600 leading-relaxed">
              We process your data to provide the Service, including supplier management, compliance
              tracking, and regulatory output generation. We do not sell your data to third parties.
              Data processing is based on contractual necessity (Art. 6(1)(b) GDPR) and legitimate
              interest (Art. 6(1)(f) GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Data Storage and Security</h2>
            <p className="text-slate-600 leading-relaxed">
              All data is stored on EU-hosted infrastructure. We implement industry-standard
              security measures including encryption at rest and in transit, access controls,
              and regular security audits. Passwords are hashed using bcrypt and never stored in
              plain text.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Your Rights</h2>
            <p className="text-slate-600 leading-relaxed">
              Under GDPR, you have the right to access, rectify, erase, restrict processing,
              and port your personal data. You may also object to processing and withdraw consent
              at any time. To exercise these rights, contact us at{' '}
              <span className="text-slate-900 font-medium">privacy@nexaloop.eu</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Data Retention</h2>
            <p className="text-slate-600 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the
              Service. When you delete your account, we remove your personal data within 30 days,
              except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For privacy enquiries, contact our Data Protection Officer at{' '}
              <span className="text-slate-900 font-medium">privacy@nexaloop.eu</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
