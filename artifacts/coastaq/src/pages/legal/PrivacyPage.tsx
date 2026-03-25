import { LegalPage, Section, SubSection, Para, BulletList, ContactRow, InfoBox } from "@/components/legal/LegalPage";

const SECTIONS = [
  { id: "collect", label: "Information We Collect" },
  { id: "use", label: "How We Use It" },
  { id: "sharing", label: "Information Sharing" },
  { id: "rights", label: "Your Rights & Choices" },
  { id: "security", label: "Data Security" },
  { id: "retention", label: "Data Retention" },
  { id: "international", label: "International Transfers" },
  { id: "children", label: "Children's Privacy" },
  { id: "third-party", label: "Third-Party Links" },
  { id: "changes", label: "Policy Changes" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="We are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information."
      effectiveDate="March 26, 2026"
      sections={SECTIONS}
    >
      <InfoBox color="blue">
        Your privacy matters to us. Coastaq ("we", "our", "us") is committed to being transparent about the data we hold and how we use it.
      </InfoBox>

      <div className="mt-8">
        <Section id="collect" title="1. Information We Collect">
          <SubSection title="1.1 Information You Provide">
            <Para>When you register, buy, or sell on Coastaq, we collect:</Para>
            <BulletList items={[
              "Account information — name, email address, password",
              "Profile information — profile photo, bio, shop details",
              "Contact information — shipping address, phone number (optional)",
              "Payment information — processed through Stripe and PayPal (we do not store full card details)",
              "Identity verification — for sellers, we may collect business information or tax ID",
            ]} />
          </SubSection>
          <SubSection title="1.2 Information Collected Automatically">
            <Para>When you use Coastaq, we automatically collect:</Para>
            <BulletList items={[
              "Device information — IP address, browser type, operating system",
              "Usage data — pages visited, time spent, search queries",
              "Location data — approximate location based on IP address",
              "Transaction data — purchase history, listing activity",
            ]} />
          </SubSection>
          <SubSection title="1.3 Information from Third Parties">
            <BulletList items={[
              "Google — if you sign up with Google",
              "Stripe / PayPal — payment confirmation and transaction status",
              "Cloudinary — image processing information",
            ]} />
          </SubSection>
        </Section>

        <Section id="use" title="2. How We Use Your Information">
          <BulletList items={[
            "Provide services — create accounts, process transactions, facilitate communication",
            "Improve the platform — analyse usage, fix bugs, enhance user experience",
            "Communicate — send order updates, promotional offers (opt-out available), policy changes",
            "Ensure safety — detect fraud, prevent abuse, enforce our terms",
            "Legal compliance — fulfil legal obligations, respond to lawful requests",
          ]} />
        </Section>

        <Section id="sharing" title="3. Information Sharing">
          <SubSection title="3.1 Between Buyers and Sellers">
            <BulletList items={[
              "Buyers see — seller's shop name, response time, and shop policies",
              "Sellers see — buyer's shipping address and order details (not payment information)",
              "Messages — direct communication through our platform",
            ]} />
          </SubSection>
          <SubSection title="3.2 Service Providers">
            <Para>We share information with:</Para>
            <BulletList items={[
              "Stripe and PayPal — to process payments",
              "Cloudinary — to host product images",
              "Analytics providers — to understand platform usage",
              "Hosting services — to maintain our infrastructure",
            ]} />
          </SubSection>
          <SubSection title="3.3 Legal Requirements">
            <Para>We may disclose information to comply with legal processes, protect the rights and safety of Coastaq and users, or respond to lawful government requests.</Para>
          </SubSection>
          <SubSection title="3.4 Business Transfers">
            <Para>If Coastaq is acquired or merged, your information may be transferred with appropriate notice.</Para>
          </SubSection>
        </Section>

        <Section id="rights" title="4. Your Rights and Choices">
          <SubSection title="4.1 Account Settings">
            <Para>You can update your profile at any time, close your account by contacting support, and set your communication preferences in account settings.</Para>
          </SubSection>
          <SubSection title="4.2 Privacy Rights (GDPR & CCPA)">
            <Para>Depending on your location, you may have the right to:</Para>
            <BulletList items={[
              "Access — request a copy of your personal data",
              "Correction — correct inaccurate information we hold",
              "Deletion — request deletion of your data",
              "Portability — receive your data in a machine-readable format",
              "Opt-out — decline marketing communications at any time",
            ]} />
            <Para>To exercise any of these rights, contact us at privacy@coastaq.com.</Para>
          </SubSection>
          <SubSection title="4.3 Cookies">
            <Para>We use cookies to keep you logged in, remember your preferences, analyse site traffic, and personalise content. You can disable cookies in your browser settings, but some features may not function properly.</Para>
          </SubSection>
        </Section>

        <Section id="security" title="5. Data Security">
          <Para>We implement security measures including encryption in transit (SSL/TLS), secure storage of sensitive information, regular security assessments, and access controls and monitoring.</Para>
          <InfoBox color="amber">
            No method of internet transmission is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </InfoBox>
        </Section>

        <Section id="retention" title="6. Data Retention">
          <BulletList items={[
            "Data is retained for as long as your account is active",
            "Transaction records are kept for up to 7 years to meet legal obligations",
            "You may request deletion of inactive accounts",
          ]} />
        </Section>

        <Section id="international" title="7. International Data Transfers">
          <Para>Coastaq operates globally. Your information may be transferred to and processed in countries outside your residence. We ensure appropriate safeguards through standard contractual clauses, data processing agreements, and compliance with applicable laws.</Para>
        </Section>

        <Section id="children" title="8. Children's Privacy">
          <Para>Coastaq is not intended for users under 18. We do not knowingly collect information from minors. If you believe a minor has provided information to us, please contact us immediately so we can remove it.</Para>
        </Section>

        <Section id="third-party" title="9. Third-Party Links">
          <Para>Our platform may contain links to external websites. We are not responsible for their privacy practices. We encourage you to review the privacy policies of any site you visit before providing personal information.</Para>
        </Section>

        <Section id="changes" title="10. Changes to This Policy">
          <Para>We may update this Privacy Policy periodically. Changes become effective when posted on this page, with email notice for material changes. We encourage you to review this policy regularly.</Para>
        </Section>

        <Section id="contact" title="11. Contact Us">
          <Para>For privacy questions or to exercise your rights:</Para>
          <div className="bg-card border border-border/50 rounded-2xl p-5 mt-3">
            <ContactRow label="Privacy enquiries" value="privacy@coastaq.com" />
          </div>
          <Para>Please use the subject line "Privacy Inquiry". We aim to respond within 30 days.</Para>
        </Section>
      </div>
    </LegalPage>
  );
}
