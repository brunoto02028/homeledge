import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | HomeLedger',
  description: 'Terms and conditions for using the HomeLedger financial management platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: 25 February 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Agreement</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using HomeLedger (&ldquo;the Service&rdquo;), operated at <strong>homeledger.co.uk</strong>,
              you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The Service is operated by Bruno Azenha Tonheta (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
              based in the United Kingdom.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must be at least 18 years old to use the Service.</li>
              <li>You must be a UK resident or operate a UK-registered business.</li>
              <li>You must provide accurate and complete registration information.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. The Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">HomeLedger provides financial management tools including:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Bank statement upload, parsing, and AI-powered transaction categorisation.</li>
              <li>Invoice creation, tracking, and management.</li>
              <li>Bill tracking and payment reminders.</li>
              <li>Document scanning, OCR, and AI classification (Capture &amp; Classify).</li>
              <li>HMRC tax report generation (SA103, CT600).</li>
              <li>Secure credential storage (Vault).</li>
              <li>Open Banking integration via TrueLayer.</li>
              <li>Companies House and HMRC API integration.</li>
              <li>Identity verification via Yoti.</li>
              <li>Financial projections and budgeting tools.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Not Financial or Tax Advice</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>HomeLedger is a tool, not an advisor.</strong> The Service does not provide financial, tax, legal,
              or accounting advice. AI-generated categorisations, tax calculations, and reports are provided for
              informational purposes only. You should always consult a qualified accountant or tax advisor before
              making financial decisions or submitting tax returns.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We do not guarantee the accuracy of AI categorisations, tax calculations, or any automatically
              generated data. You are solely responsible for verifying all information before use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Your Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are responsible for the accuracy of data you upload or enter.</li>
              <li>You must not upload malicious files, malware, or content that infringes third-party rights.</li>
              <li>You must not attempt to access other users&apos; data or accounts.</li>
              <li>You must not use the Service for money laundering, fraud, or any illegal activity.</li>
              <li>You must not reverse-engineer, scrape, or abuse the Service or its APIs.</li>
              <li>You must keep your login credentials secure and notify us immediately of any unauthorised access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Subscription Plans</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The Service offers free and paid subscription plans.</li>
              <li>Paid plans are billed monthly or annually as indicated at the time of purchase.</li>
              <li>You may cancel your subscription at any time. Access continues until the end of the current billing period.</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
              <li>Refunds are handled on a case-by-case basis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The Service integrates with third-party providers. Your use of these integrations is subject to their respective terms:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>TrueLayer</strong> — Open Banking (FCA-regulated). Subject to TrueLayer&apos;s terms.</li>
              <li><strong>Yoti</strong> — Identity verification. Subject to Yoti&apos;s privacy policy.</li>
              <li><strong>HMRC</strong> — Making Tax Digital. Subject to HMRC developer terms.</li>
              <li><strong>Companies House</strong> — Company data and filings. Subject to Crown copyright terms.</li>
              <li><strong>Google Gemini</strong> — AI processing. Data processed under Google&apos;s API terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The HomeLedger brand, logo, interface design, and codebase are our property.</li>
              <li>Your data remains your property. We claim no ownership over your financial data.</li>
              <li>You grant us a limited licence to process your data solely to provide the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by UK law:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The Service is provided &ldquo;as is&rdquo; without warranty of any kind.</li>
              <li>We are not liable for any indirect, incidental, consequential, or punitive damages.</li>
              <li>We are not liable for losses arising from incorrect AI categorisations, tax calculations, or report generation.</li>
              <li>We are not liable for data loss due to circumstances beyond our reasonable control.</li>
              <li>Our total liability is limited to the amount you paid for the Service in the 12 months preceding the claim.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Account Termination</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You may delete your account at any time from Settings.</li>
              <li>We may suspend or terminate accounts that violate these Terms.</li>
              <li>Upon termination, your data will be deleted within 30 days, unless retention is required by law.</li>
              <li>You may request a data export before account deletion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We aim for high availability but do not guarantee uninterrupted access. The Service may be temporarily
              unavailable for maintenance, updates, or due to circumstances beyond our control. We will provide
              reasonable notice of planned downtime where possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. Material changes will be communicated via email or
              in-app notification at least 14 days before taking effect. Continued use of the Service after changes
              take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the
              exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@homeledger.co.uk" className="text-primary hover:underline">legal@homeledger.co.uk</a>.
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
