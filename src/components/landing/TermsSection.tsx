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

export default function TermsSection() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective Date: February 10, 2026
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          <Section i={1} heading="Acceptance of Terms">
            <p>By downloading, installing, or using Rafiq ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.</p>
          </Section>

          <Section i={2} heading="Description of Service">
            <p>Rafiq is an Islamic personal finance application that provides tools for:</p>
            <ul>
              <li>Zakat and khums calculation</li>
              <li>Halal stock screening based on AAOIFI criteria</li>
              <li>Net worth tracking and budgeting</li>
              <li>Charitable giving (zakat, sadaqah, tatheer) via third-party processors</li>
              <li>AI-powered Islamic finance guidance (Ask Rafiq)</li>
              <li>Bank account linking via Plaid</li>
            </ul>
          </Section>

          <Section i={3} heading="Subscriptions and Payments">
            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Free Features</h4>
            <p>Basic net worth tracking, manual account management, zakat and khums calculators, and budget tracking are available at no cost.</p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Premium Subscription</h4>
            <p>Rafiq Premium unlocks additional features including bank linking (Plaid), Ask Rafiq AI assistant, PDF export, spending analytics, and price alerts. Premium is available as:</p>
            <ul>
              <li><strong>Monthly:</strong> $7.99 USD per month</li>
              <li><strong>Yearly:</strong> $59.99 USD per year</li>
            </ul>
            <p>Subscriptions are billed through your Apple ID account and auto-renew unless canceled at least 24 hours before the end of the current billing period. You can manage or cancel subscriptions in your device's Settings &gt; Apple ID &gt; Subscriptions.</p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Free Trial</h4>
            <p>New users receive a 3-month free trial of Premium features. You will not be charged during the trial period. After the trial, you may subscribe or continue using free features.</p>

            <h4 className="font-heading text-sm font-semibold text-foreground mt-4 mb-2">Referral Program</h4>
            <p>Users may earn additional free Premium access by referring friends. Each successful referral grants 30 days of Premium access. Referral bonuses are stackable.</p>
          </Section>

          <Section i={4} heading="Charitable Donations">
            <p>Donations made through Rafiq are processed by <strong>Every.org</strong>, a registered 501(c)(3) nonprofit organization. Rafiq facilitates the connection but does not process, hold, or transfer donation funds. Rafiq charges <strong>0% platform fee</strong> on all donations.</p>
            <p>Donation receipts and tax documentation are provided by Every.org. Rafiq is not responsible for the processing, fulfillment, or tax-deductibility of donations.</p>
          </Section>

          <Section i={5} heading="Financial Information Disclaimer">
            <p className="font-semibold text-foreground">Rafiq is not a financial advisor, tax advisor, or religious authority.</p>
            <ul>
              <li><strong>Zakat and khums calculations</strong> are estimates based on the data you provide and the Islamic school of thought (madhab) you select. These calculations are educational tools and do not constitute authoritative religious rulings. For complex situations, consult a qualified Islamic scholar.</li>
              <li><strong>Halal stock screening</strong> is based on publicly available financial data and AAOIFI screening criteria. Screening results are informational and do not guarantee the permissibility of any investment. Scholars may differ on specific rulings.</li>
              <li><strong>Ask Rafiq AI assistant</strong> provides educational information about Islamic finance concepts. Responses are generated by artificial intelligence and may contain errors. AI responses are not fatwas and should not be treated as authoritative religious guidance.</li>
              <li><strong>Investment information</strong> (stock prices, charts, and financial data) is provided for informational purposes only and does not constitute investment advice. Past performance does not guarantee future results.</li>
            </ul>
          </Section>

          <Section i={6} heading="User Responsibilities">
            <ul>
              <li>You are responsible for the accuracy of data you enter into the App.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must not use the App for any unlawful purpose.</li>
              <li>You must not attempt to reverse-engineer, decompile, or exploit the App.</li>
            </ul>
          </Section>

          <Section i={7} heading="Account Termination">
            <p>You may delete your account at any time from the Settings screen within the App. Account deletion permanently removes all your data from our systems. We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </Section>

          <Section i={8} heading="Intellectual Property">
            <p>The Rafiq name, logo, and all content created by Rafiq are protected by intellectual property laws. You may not use our trademarks or content without written permission. The DJIM index data, AAOIFI screening criteria, and third-party financial data remain the property of their respective owners.</p>
          </Section>

          <Section i={9} heading="Limitation of Liability">
            <p>To the maximum extent permitted by law, Rafiq and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including but not limited to:</p>
            <ul>
              <li>Financial losses resulting from calculations or screening results</li>
              <li>Errors in AI-generated responses</li>
              <li>Interruption or unavailability of the service</li>
              <li>Third-party service outages (Plaid, Every.org, stock data providers)</li>
            </ul>
          </Section>

          <Section i={10} heading="Third-Party Services">
            <p>Rafiq integrates with third-party services (Plaid, Every.org, Firebase, Anthropic). Your use of these services is subject to their respective terms and privacy policies. Rafiq is not responsible for the availability, accuracy, or performance of third-party services.</p>
          </Section>

          <Section i={11} heading="Changes to Terms">
            <p>We may update these Terms of Service from time to time. Material changes will be communicated through the App. Continued use after changes constitutes acceptance of the updated terms.</p>
          </Section>

          <Section i={12} heading="Governing Law">
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles.</p>
          </Section>

          <Section i={13} heading="Contact Us">
            <p>For questions about these Terms, contact us at:</p>
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
