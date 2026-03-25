import { LegalPage, Section, SubSection, Para, BulletList, ContactRow, InfoBox } from "@/components/legal/LegalPage";

const SECTIONS = [
  { id: "about", label: "About Coastaq" },
  { id: "registration", label: "Account Registration" },
  { id: "seller-terms", label: "Seller Terms" },
  { id: "buyer-terms", label: "Buyer Terms" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping & Delivery" },
  { id: "returns", label: "Returns & Refunds" },
  { id: "ip", label: "Intellectual Property" },
  { id: "conduct", label: "Prohibited Conduct" },
  { id: "termination", label: "Termination" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "changes", label: "Modifications" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      subtitle="These terms govern your use of the Coastaq marketplace. By using our platform, you agree to be bound by them."
      effectiveDate="March 26, 2026"
      sections={SECTIONS}
    >
      <InfoBox color="blue">
        Welcome to Coastaq — a global marketplace connecting buyers and sellers. Please read these terms carefully before using our platform.
      </InfoBox>

      <div className="mt-8">
        <Section id="about" title="1. About Coastaq">
          <Para>
            Coastaq is an online marketplace that allows sellers to create shops, list products, and connect with buyers worldwide. We provide the platform and payment infrastructure but are not a party to the actual transaction between buyers and sellers. Our role is to facilitate safe and secure transactions through Stripe and PayPal payment processing.
          </Para>
        </Section>

        <Section id="registration" title="2. Account Registration">
          <SubSection title="2.1 Eligibility">
            <Para>To use Coastaq, you must:</Para>
            <BulletList items={[
              "Be at least 18 years old",
              "Have the legal capacity to enter into binding contracts",
              "Provide accurate and complete information during registration",
              "Not have previously been suspended or removed from our platform",
            ]} />
          </SubSection>
          <SubSection title="2.2 Account Types">
            <BulletList items={[
              "Buyer Accounts — For individuals purchasing products. Buyers can browse, search, save listings, and contact sellers.",
              "Seller Accounts — For individuals or businesses selling products. Sellers can create shops, list products, manage inventory, and receive buyer enquiries.",
            ]} />
          </SubSection>
          <SubSection title="2.3 Account Responsibility">
            <Para>You are solely responsible for maintaining the confidentiality of your account credentials. You agree to:</Para>
            <BulletList items={[
              "Not share your password with anyone",
              "Notify us immediately of any unauthorised account access",
              "Accept responsibility for all activities under your account",
            ]} />
          </SubSection>
        </Section>

        <Section id="seller-terms" title="3. Seller Terms and Obligations">
          <SubSection title="3.1 Becoming a Seller">
            <Para>To become a seller on Coastaq:</Para>
            <BulletList items={[
              "Complete seller registration with your shop name and description",
              "Wait for shop approval (typically 24–48 hours)",
              "Provide accurate contact and payment information",
              "Agree to our fee structure and payout terms",
            ]} />
          </SubSection>
          <SubSection title="3.2 Product Listings">
            <Para>As a seller, you represent and warrant that:</Para>
            <BulletList items={[
              "All products listed are legal and comply with applicable laws",
              "Product descriptions, images, and prices are accurate and not misleading",
              "You own or have the right to use all content you upload",
              "Products are authentic and not counterfeit",
              "You clearly state product condition (new, used, refurbished)",
            ]} />
          </SubSection>
          <SubSection title="3.3 Prohibited Items">
            <Para>The following items may not be sold on Coastaq:</Para>
            <BulletList items={[
              "Illegal drugs or paraphernalia",
              "Weapons, firearms, or explosives",
              "Counterfeit or unauthorised goods",
              "Stolen goods or hazardous materials",
              "Adult content or services",
              "Live animals or human body parts",
              "Items promoting hate, violence, or discrimination",
            ]} />
          </SubSection>
          <SubSection title="3.4 Order Fulfillment">
            <Para>Sellers must ship orders within the stated processing time (default: 3 business days), provide tracking information when available, respond to buyer inquiries within 24 hours, and maintain sufficient stock of listed items.</Para>
          </SubSection>
          <SubSection title="3.5 Seller Fees">
            <BulletList items={[
              "Coastaq charges a 10% transaction fee on each completed sale",
              "Fees are automatically deducted from your payout — you receive 90% of the transaction amount",
              "Fees are non-refundable except in cases of platform error",
              "We reserve the right to modify fees with 30 days advance notice",
            ]} />
          </SubSection>
          <SubSection title="3.6 Payouts">
            <BulletList items={[
              "Payouts processed through Stripe Connect or PayPal",
              "Funds released after order confirmation (typically 3–7 days after delivery)",
              "Minimum payout amount: $10 USD",
              "Payout frequency: Daily or weekly, depending on your settings",
            ]} />
          </SubSection>
        </Section>

        <Section id="buyer-terms" title="4. Buyer Terms and Obligations">
          <SubSection title="4.1 Making Purchases">
            <Para>When you purchase on Coastaq, you enter into a direct contract with the seller. Coastaq facilitates payment but is not responsible for product quality. You agree to pay the listed price plus applicable taxes and shipping.</Para>
          </SubSection>
          <SubSection title="4.2 Buyer Responsibilities">
            <BulletList items={[
              "Provide accurate and complete information for transactions",
              "Not attempt to circumvent our payment system",
              "Not make false claims or fraudulent chargebacks",
              "Communicate professionally with sellers",
              "Report issues through proper channels (not chargebacks)",
            ]} />
          </SubSection>
          <SubSection title="4.3 Buyer Protection">
            <Para>Coastaq offers buyer protection for: Item Not Received, Significantly Not as Described, Counterfeit Items, and Prohibited Items. To qualify, report issues within 7 days of delivery with clear evidence, attempt to resolve with the seller first, and file a dispute through our platform.</Para>
          </SubSection>
        </Section>

        <Section id="payments" title="5. Payments and Transaction Processing">
          <SubSection title="5.1 Accepted Payment Methods">
            <BulletList items={[
              "Credit and debit cards (Visa, Mastercard, American Express, Discover)",
              "PayPal",
              "Other methods as made available",
            ]} />
          </SubSection>
          <SubSection title="5.2 Payment Processing">
            <Para>All payments are processed through Stripe and PayPal. Coastaq does not store your full payment information. You agree to the terms of service of our payment partners.</Para>
          </SubSection>
          <SubSection title="5.3 Currency">
            <Para>All transactions are in USD by default. Currency conversion fees may apply for international transactions. Your bank or card issuer may charge additional fees.</Para>
          </SubSection>
        </Section>

        <Section id="shipping" title="6. Shipping and Delivery">
          <Para>Sellers are responsible for shipping products to buyers. Shipping costs are displayed before purchase. Estimated delivery times are provided by sellers but are not guaranteed. International shipments may incur customs duties or taxes, which are the buyer's responsibility. Coastaq is not liable for lost or delayed packages.</Para>
        </Section>

        <Section id="returns" title="7. Returns, Refunds, and Cancellations">
          <SubSection title="7.1 Return Policy">
            <BulletList items={[
              "Returns are handled directly between buyer and seller",
              "Sellers must clearly state their return policy in their shop",
              "Default return window: 14 days from delivery",
              "Buyers may be responsible for return shipping costs unless item is defective",
            ]} />
          </SubSection>
          <SubSection title="7.2 Refund Process">
            <Para>Refunds are processed through the original payment method and typically take 5–10 business days. Platform fees are non-refundable after 30 days.</Para>
          </SubSection>
          <SubSection title="7.3 Cancellations">
            <Para>Buyers may cancel within 1 hour of purchase if not yet shipped. Sellers may cancel orders if unable to fulfil but must notify the buyer. Unauthorised cancellations may affect seller status.</Para>
          </SubSection>
        </Section>

        <Section id="ip" title="8. Content and Intellectual Property">
          <SubSection title="8.1 Your Content">
            <Para>You retain ownership of content you post on Coastaq. By posting, you grant Coastaq a non-exclusive, worldwide licence to display, distribute, and promote your content on our platform.</Para>
          </SubSection>
          <SubSection title="8.2 Coastaq Intellectual Property">
            <Para>All platform content — including logos, designs, code, and branding — is owned by Coastaq and protected by copyright and trademark laws. You may not copy, modify, or use our intellectual property without permission.</Para>
          </SubSection>
          <SubSection title="8.3 Copyright Infringement">
            <Para>If you believe content infringes your copyright, contact us at copyright@coastaq.com with a description of the copyrighted work, the location of the infringing content, your contact information, and a statement of good faith belief.</Para>
          </SubSection>
        </Section>

        <Section id="conduct" title="9. Prohibited Conduct">
          <Para>You may not:</Para>
          <BulletList items={[
            "Use Coastaq for illegal purposes",
            "Harass, abuse, or threaten other users",
            "Manipulate prices or reviews",
            "Engage in fraudulent transactions",
            "Use automated systems to scrape data",
            "Interfere with platform operations",
            "Impersonate another person or entity",
            "Post false or misleading information",
          ]} />
        </Section>

        <Section id="termination" title="10. Termination">
          <SubSection title="10.1 Termination by You">
            <Para>You may close your account at any time by contacting support. Outstanding obligations (pending orders, unresolved disputes) must be resolved first.</Para>
          </SubSection>
          <SubSection title="10.2 Termination by Coastaq">
            <Para>We may suspend or terminate accounts for violation of these Terms, fraudulent or illegal activity, excessive chargebacks or disputes, or harm to the platform or community.</Para>
          </SubSection>
          <SubSection title="10.3 Effect of Termination">
            <Para>Upon termination, active listings will be removed, pending payouts will be processed, disputes will be resolved per these Terms, and you remain liable for all outstanding obligations.</Para>
          </SubSection>
        </Section>

        <Section id="liability" title="11. Limitation of Liability">
          <Para>To the maximum extent permitted by law, Coastaq is not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in fees in the past 12 months. We are not responsible for seller product quality or buyer payment issues, and we do not guarantee uninterrupted or error-free service.</Para>
        </Section>

        <Section id="disputes" title="12. Dispute Resolution">
          <SubSection title="12.1 Informal Resolution">
            <Para>Contact us at disputes@coastaq.com to resolve issues informally. Most disputes can be resolved through communication.</Para>
          </SubSection>
          <SubSection title="12.2 Binding Arbitration">
            <Para>If informal resolution fails, disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive the right to participate in class actions.</Para>
          </SubSection>
          <SubSection title="12.3 Governing Law">
            <Para>These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.</Para>
          </SubSection>
        </Section>

        <Section id="changes" title="13. Modifications">
          <Para>We may modify these Terms at any time. Minor changes are effective immediately upon posting. Material changes take effect 30 days after notice. Continued use of Coastaq constitutes acceptance of modified Terms.</Para>
        </Section>

        <Section id="contact" title="14. Contact Information">
          <Para>For questions about these Terms:</Para>
          <div className="bg-card border border-border/50 rounded-2xl p-5 mt-3">
            <ContactRow label="Legal enquiries" value="legal@coastaq.com" />
            <ContactRow label="Disputes" value="disputes@coastaq.com" />
            <ContactRow label="Copyright" value="copyright@coastaq.com" />
          </div>
          <Para>Response time: 2–3 business days.</Para>
        </Section>
      </div>
    </LegalPage>
  );
}
