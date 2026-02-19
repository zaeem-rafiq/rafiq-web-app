import type { Variants } from "framer-motion";
import { motion } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function PrivacySection() {
  return (
    <section className="relative px-4 py-20 sm:py-28">
      <div className="container relative mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective Date: February 10, 2026
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          <Section i={1} heading="Introduction">
            <p>Rafiq ("we", "our", "us") is an Islamic personal finance application. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Rafiq mobile application.</p>
          </Section>

          <Section i={2} heading="Information We Collect">
            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Account Information</h4>
            <ul>
              <li><strong>Email address</strong> — for account creation and authentication</li>
              <li><strong>Name</strong> — for personalization</li>
              <li><strong>Date of birth</strong> — optional, for retirement zakat calculations</li>
              <li><strong>Phone number</strong> — optional, for account recovery</li>
            </ul>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Financial Information</h4>
            <ul>
              <li><strong>Account balances and transactions</strong> — when you link bank accounts via Plaid or enter data manually</li>
              <li><strong>Investment holdings</strong> — stock symbols, share counts, and purchase prices you enter</li>
              <li><strong>Zakat, khums, and giving records</strong> — calculations and donation history you create</li>
              <li><strong>Budget and spending data</strong> — categories and amounts you enter</li>
            </ul>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Technical Information</h4>
            <ul>
              <li><strong>Device identifier</strong> — for Firebase Analytics (anonymized)</li>
              <li><strong>Crash data</strong> — via Firebase Crashlytics, to fix bugs</li>
            </ul>
          </Section>

          <Section i={3} heading="How We Use Your Information">
            <p>We use your information solely to:</p>
            <ul>
              <li>Provide Islamic finance calculations (zakat, khums, halal screening, tatheer)</li>
              <li>Display your financial dashboard and net worth</li>
              <li>Power the Ask Rafiq AI assistant with your financial context</li>
              <li>Send notifications you opt into (zakat reminders, budget alerts, price alerts)</li>
              <li>Improve app stability via crash reports</li>
            </ul>
          </Section>

          <Section i={4} heading="Third-Party Services">
            <p>Rafiq uses the following third-party services to provide functionality:</p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Firebase (Google)</h4>
            <p>Authentication, data storage (Firestore), crash reporting (Crashlytics), push notifications (Cloud Messaging), and serverless functions. Data is encrypted in transit via TLS and at rest.{" "}
              <a href="https://firebase.google.com/support/privacy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a>.
            </p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Plaid</h4>
            <p>Bank account linking and transaction syncing. When you connect a bank account, Plaid securely retrieves your account information. <strong>Plaid access tokens are stored exclusively on our server</strong> and are never present on your device.{" "}
              <a href="https://plaid.com/legal/#end-user-privacy-policy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Plaid Privacy Policy</a>.
            </p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Every.org</h4>
            <p>Charitable donation processing. When you donate through Rafiq, you are redirected to Every.org's secure payment page. Rafiq does not process or store payment card information.{" "}
              <a href="https://www.every.org/privacy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Every.org Privacy Policy</a>.
            </p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Anthropic (Claude AI)</h4>
            <p>Powers the Ask Rafiq AI assistant. Your financial context is sent to Anthropic's API via our secure Cloud Function proxy to generate personalized responses. Conversations are stored in your Firestore account.{" "}
              <a href="https://www.anthropic.com/privacy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Anthropic Privacy Policy</a>.
            </p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Alpaca Markets &amp; Financial Modeling Prep</h4>
            <p>Real-time stock prices and AAOIFI halal screening data. Only stock symbols are sent to these services, never your personal or financial information.</p>
          </Section>

          <Section i={5} heading="Data Storage and Security">
            <ul>
              <li>All data is stored in Google Firebase Firestore, encrypted in transit (TLS) and at rest.</li>
              <li>Plaid access tokens are stored server-side only, inaccessible from client devices.</li>
              <li>Biometric authentication (Face ID / Touch ID) and PIN codes are processed locally on your device and never transmitted to our servers.</li>
              <li>We do not use advertising SDKs or sell your data to third parties.</li>
            </ul>
          </Section>

          <Section i={6} heading="Your Rights">
            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Account Deletion</h4>
            <p>You can delete your account at any time from Settings within the app. Account deletion permanently removes all your data from our systems, including:</p>
            <ul>
              <li>All financial records (accounts, transactions, budgets, zakat/khums records, giving history)</li>
              <li>Plaid connections and stored access tokens</li>
              <li>Ask Rafiq conversation history</li>
              <li>Your Firebase Authentication account</li>
            </ul>
            <p>This process is compliant with GDPR, CCPA, and PIPEDA requirements.</p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Data Access and Portability</h4>
            <p>You can export your financial data in CSV or JSON format from the app's Settings screen.</p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Notification Control</h4>
            <p>You can enable or disable all notification types (zakat reminders, budget alerts, price alerts, dividend alerts) from Settings within the app.</p>
          </Section>

          <Section i={7} heading="Children's Privacy">
            <p>Rafiq is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us to have it removed.</p>
          </Section>

          <Section i={8} heading="Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes through the app or via email. Continued use of Rafiq after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section i={9} heading="Contact Us">
            <p>For privacy-related questions or data requests, contact us at:</p>
            <p><strong>Email:</strong>{" "}
              <a href="mailto:salam@rafiq.money" className="text-gold hover:underline">
                salam@rafiq.money
              </a>
            </p>
          </Section>
        </div>
      </div>
    </section>
  );
}

function Section({ i, heading, children }: { i: number; heading: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={i}
      className="prose-sm [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-2 [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:mb-2 [&_ul]:space-y-1 [&_li]:text-sm [&_li]:text-muted-foreground [&_strong]:text-foreground"
    >
      <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl mb-3">
        <span className="text-gold">{i}.</span> {heading}
      </h2>
      {children}
    </motion.div>
  );
}
