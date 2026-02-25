import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | HomeLedger',
  description: 'How HomeLedger uses cookies and similar technologies.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: 25 February 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help the website
              remember your preferences and provide essential functionality. HomeLedger uses cookies to keep you
              signed in and provide a secure experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Cookies We Use</h2>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-semibold">Cookie Name</th>
                    <th className="text-left py-3 pr-4 font-semibold">Type</th>
                    <th className="text-left py-3 pr-4 font-semibold">Purpose</th>
                    <th className="text-left py-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-mono text-xs">next-auth.session-token</td>
                    <td className="py-3 pr-4">Essential</td>
                    <td className="py-3 pr-4">Keeps you signed in to your account</td>
                    <td className="py-3">30 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-mono text-xs">next-auth.csrf-token</td>
                    <td className="py-3 pr-4">Essential</td>
                    <td className="py-3 pr-4">Protects against cross-site request forgery attacks</td>
                    <td className="py-3">Session</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-mono text-xs">next-auth.callback-url</td>
                    <td className="py-3 pr-4">Essential</td>
                    <td className="py-3 pr-4">Remembers where to redirect after login</td>
                    <td className="py-3">Session</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-mono text-xs">hl-cookie-consent</td>
                    <td className="py-3 pr-4">Essential</td>
                    <td className="py-3 pr-4">Stores your cookie consent preference</td>
                    <td className="py-3">1 year</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-mono text-xs">hl-language</td>
                    <td className="py-3 pr-4">Functional</td>
                    <td className="py-3 pr-4">Remembers your language preference (English/Portuguese)</td>
                    <td className="py-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Cookie Categories</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">Essential Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              These cookies are strictly necessary for the Service to function. They enable authentication,
              security, and basic navigation. You cannot opt out of essential cookies as the Service would
              not work without them.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Functional Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              These cookies remember your preferences (such as language) to provide a better experience.
              They are not strictly necessary but improve usability.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Analytics Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not currently use any third-party analytics cookies (e.g., Google Analytics).
              If we add analytics in the future, we will update this policy and request your consent.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Advertising Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not use any advertising or tracking cookies. HomeLedger does not serve ads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You can manage cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Chrome</strong>: Settings &gt; Privacy and Security &gt; Cookies</li>
              <li><strong>Firefox</strong>: Settings &gt; Privacy &amp; Security &gt; Cookies</li>
              <li><strong>Safari</strong>: Preferences &gt; Privacy &gt; Manage Website Data</li>
              <li><strong>Edge</strong>: Settings &gt; Cookies and Site Permissions</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Please note that disabling essential cookies will prevent you from signing in to HomeLedger.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              In addition to cookies, HomeLedger uses browser local storage to cache UI preferences
              (e.g., sidebar state, theme preference, financial projections data). This data never leaves
              your browser and is not sent to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy if we add new cookie types. Changes will be reflected
              in the &ldquo;Last updated&rdquo; date above. If we introduce analytics or advertising cookies,
              we will notify you and request explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about cookies? Email{' '}
              <a href="mailto:privacy@homeledger.co.uk" className="text-primary hover:underline">privacy@homeledger.co.uk</a>.
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
