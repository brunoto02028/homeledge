import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | HomeLedger',
  description: 'How HomeLedger collects, uses, and protects your personal data under UK GDPR.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: 25 February 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              HomeLedger is a UK-based financial management platform operated by Bruno Azenha Tonheta
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). We are the data controller for the personal data
              processed through <strong>homeledger.co.uk</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Contact: <a href="mailto:privacy@homeledger.co.uk" className="text-primary hover:underline">privacy@homeledger.co.uk</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Data We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We collect the following categories of personal data:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information</strong> — Name, email address, password (hashed), language preference.</li>
              <li><strong>Financial Data</strong> — Bank statements, transaction descriptions, amounts, categories, invoices, bills, receipts.</li>
              <li><strong>Business Data</strong> — Company names, registration numbers, UTR, VAT numbers, registered addresses, officer details (from Companies House public records).</li>
              <li><strong>Identity Verification</strong> — If you use our identity verification service (Yoti), biometric data and identity documents are processed by Yoti Ltd as an independent data processor.</li>
              <li><strong>Uploaded Documents</strong> — Scanned letters, receipts, invoices, and other documents you upload for AI processing.</li>
              <li><strong>Vault Data</strong> — Passwords, API keys, and credentials you store are encrypted with AES-256-GCM. We cannot read vault contents.</li>
              <li><strong>Open Banking Data</strong> — If you connect your bank account via TrueLayer, we receive transaction data, balances, and account details under your explicit consent.</li>
              <li><strong>Usage Data</strong> — Pages visited, features used, browser type, IP address, device information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Provide the Service</strong> — Process bank statements, generate reports, track bills, manage invoices, categorise transactions.</li>
              <li><strong>AI Processing</strong> — We use AI (Google Gemini) to categorise transactions, extract data from scanned documents, and provide financial insights. Your data is sent to Google&apos;s API for processing but is not used to train their models.</li>
              <li><strong>Tax Compliance</strong> — Generate HMRC-compliant reports (SA103, CT600), map categories to tax boxes, and (in future) submit returns via HMRC Making Tax Digital APIs.</li>
              <li><strong>Government API Integration</strong> — Look up company information via Companies House API and (in future) submit filings.</li>
              <li><strong>Security</strong> — Detect and prevent fraud, unauthorised access, and abuse.</li>
              <li><strong>Communications</strong> — Send account notifications, bill reminders, and service updates.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Legal Basis for Processing</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Contract</strong> — Processing necessary to provide the HomeLedger service you signed up for.</li>
              <li><strong>Consent</strong> — Open Banking connections, identity verification, and optional AI features.</li>
              <li><strong>Legitimate Interest</strong> — Service improvement, security monitoring, and fraud prevention.</li>
              <li><strong>Legal Obligation</strong> — Where required by UK law or HMRC regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We share your data only with:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Google (Gemini AI)</strong> — Transaction descriptions and document images for AI categorisation. Data is processed under Google&apos;s API terms and not used for model training.</li>
              <li><strong>TrueLayer</strong> — Open Banking provider, FCA-regulated. Only when you explicitly connect your bank.</li>
              <li><strong>Yoti Ltd</strong> — Identity verification provider. Only when you initiate an ID check.</li>
              <li><strong>HMRC</strong> — Tax submissions, only when you explicitly authorise via OAuth.</li>
              <li><strong>Companies House</strong> — Company filings, only when you explicitly authorise via OAuth.</li>
              <li><strong>Hosting Provider</strong> — Our servers are hosted on Hostinger (Manchester, UK data centre).</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We <strong>never</strong> sell your personal data to third parties. We do not share your data with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Storage &amp; Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All data is stored on UK-based servers (Manchester).</li>
              <li>Data in transit is encrypted with TLS 1.3.</li>
              <li>Vault entries are encrypted with AES-256-GCM — we cannot decrypt your stored passwords.</li>
              <li>Passwords are hashed with bcrypt (cost factor 12).</li>
              <li>Database access is restricted to application-level only with strong credentials.</li>
              <li>Regular automated backups with encryption at rest.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account data</strong> — Retained while your account is active. Deleted within 30 days of account closure.</li>
              <li><strong>Financial data</strong> — Retained while your account is active. You may delete individual records at any time.</li>
              <li><strong>Uploaded documents</strong> — Retained until you delete them. Automatically deleted 30 days after account closure.</li>
              <li><strong>Vault data</strong> — Deleted immediately upon account closure.</li>
              <li><strong>Usage logs</strong> — Retained for 12 months for security and analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Your Rights (UK GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Under UK data protection law, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access</strong> — Request a copy of all personal data we hold about you.</li>
              <li><strong>Rectification</strong> — Correct any inaccurate data.</li>
              <li><strong>Erasure</strong> — Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
              <li><strong>Portability</strong> — Receive your data in a machine-readable format.</li>
              <li><strong>Restriction</strong> — Request we limit how we process your data.</li>
              <li><strong>Objection</strong> — Object to processing based on legitimate interest.</li>
              <li><strong>Withdraw Consent</strong> — Withdraw consent for Open Banking or identity verification at any time.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, email <a href="mailto:privacy@homeledger.co.uk" className="text-primary hover:underline">privacy@homeledger.co.uk</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. For full details, see our{' '}
              <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Children</h2>
            <p className="text-muted-foreground leading-relaxed">
              HomeLedger is not intended for use by anyone under 18 years of age. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or an in-app notification. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Complaints</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are unhappy with how we handle your data, you have the right to lodge a complaint with the
              Information Commissioner&apos;s Office (ICO): <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk/make-a-complaint</a>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to HomeLedger
          </Link>
        </div>
      </div>
    </div>
  );
}
