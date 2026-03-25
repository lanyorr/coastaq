import { LegalPage, Section, SubSection, Para, BulletList, ContactRow, InfoBox } from "@/components/legal/LegalPage";

const SECTIONS = [
  { id: "becoming", label: "Becoming a Seller" },
  { id: "fees", label: "Fees and Payouts" },
  { id: "listings", label: "Listing Products" },
  { id: "fulfillment", label: "Order Fulfillment" },
  { id: "returns", label: "Returns & Refunds" },
  { id: "performance", label: "Performance Standards" },
  { id: "ip", label: "Intellectual Property" },
  { id: "conduct", label: "Prohibited Conduct" },
  { id: "suspension", label: "Suspension & Termination" },
  { id: "taxes", label: "Taxes" },
  { id: "liability", label: "Liability & Insurance" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "modifications", label: "Modifications" },
  { id: "contact", label: "Seller Contact" },
];

export default function SellerAgreementPage() {
  return (
    <LegalPage
      title="Seller Agreement"
      subtitle="This agreement governs your rights and obligations as a seller on Coastaq. Please read it carefully before listing any products."
      effectiveDate="March 26, 2026"
      sections={SECTIONS}
    >
      <InfoBox color="blue">
        This Seller Agreement ("Agreement") is between Coastaq ("we", "us", "platform") and you ("Seller") when you register to sell on Coastaq. By selling on our platform, you accept these terms.
      </InfoBox>

      <div className="mt-8">
        <Section id="becoming" title="1. Becoming a Seller">
          <SubSection title="1.1 Eligibility">
            <Para>To sell on Coastaq, you must:</Para>
            <BulletList items={[
              "Be at least 18 years old",
              "Provide accurate personal and business information",
              "Complete identity verification when required",
              "Maintain a valid payment account (Stripe or PayPal)",
              "Agree to this Agreement and our Terms & Conditions",
            ]} />
          </SubSection>
          <SubSection title="1.2 Shop Approval">
            <Para>All shops require approval before listing products. Approval criteria include:</Para>
            <BulletList items={[
              "Legitimate business or individual seller status",
              "Complete shop profile with accurate information",
              "No history of fraud or policy violations",
              "Compliance with the prohibited items policy",
            ]} />
            <Para>Approval typically takes 24–48 hours.</Para>
          </SubSection>
        </Section>

        <Section id="fees" title="2. Fees and Payouts">
          <SubSection title="2.1 Transaction Fees">
            <BulletList items={[
              "Coastaq charges 10% of each completed sale",
              "Fee calculated on product price (excluding shipping and taxes)",
              "Automatically deducted before payout",
            ]} />
          </SubSection>
          <SubSection title="2.2 Payment Processing Fees">
            <Para>Payment processing fees are included in our 10% fee. There are no additional processing charges for sellers.</Para>
          </SubSection>
          <SubSection title="2.3 Payout Schedule">
            <BulletList items={[
              "Standard — weekly payouts (every Monday)",
              "Express — daily payouts (available after 10 successful sales)",
              "Hold period — first payout held 14 days for fraud prevention",
            ]} />
          </SubSection>
          <SubSection title="2.4 Payout Details">
            <BulletList items={[
              "Minimum payout: $10 USD",
              "Maximum payout: no limit",
              "Currency: USD (conversion fees may apply for non-US accounts)",
              "Methods: Stripe Connect (bank transfer) or PayPal",
            ]} />
          </SubSection>

          {/* Tier table */}
          <div className="bg-secondary/40 rounded-2xl overflow-hidden mt-2">
            <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/80 px-4 py-2.5">
              <span>Tier</span>
              <span>Requirements</span>
              <span>Transaction Fee</span>
            </div>
            {[
              { tier: "🥉 Bronze", req: "New sellers", fee: "10%" },
              { tier: "🥈 Silver", req: "50+ sales, 4.5+ rating", fee: "9%" },
              { tier: "🥇 Gold", req: "200+ sales, 4.8+ rating", fee: "8%" },
            ].map(row => (
              <div key={row.tier} className="grid grid-cols-3 px-4 py-3 border-t border-border/40 text-sm">
                <span className="font-semibold text-foreground">{row.tier}</span>
                <span className="text-muted-foreground">{row.req}</span>
                <span className="text-primary font-bold">{row.fee}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="listings" title="3. Listing Products">
          <SubSection title="3.1 Product Standards">
            <Para>All listings must:</Para>
            <BulletList items={[
              "Accurately describe the product",
              "Include clear, original photos",
              "Specify condition (new, used, refurbished)",
              "State processing time",
              "Set a reasonable, transparent price",
              "Include an accurate inventory count",
            ]} />
          </SubSection>
          <SubSection title="3.2 Prohibited Items">
            <Para>You may not sell:</Para>
            <BulletList items={[
              "Illegal products or services",
              "Counterfeit or unauthorised goods",
              "Weapons or explosives",
              "Hazardous materials",
              "Adult content",
              "Stolen property",
              "Items promoting hate or violence",
            ]} />
          </SubSection>
          <SubSection title="3.3 Image Guidelines">
            <BulletList items={[
              "Use your own photos — no stock images",
              "Minimum resolution: 800×800 pixels",
              "Show the actual product, not just packaging",
              "No watermarks, promotional text, or offensive content",
            ]} />
          </SubSection>
          <SubSection title="3.4 Pricing">
            <Para>Set your price in USD. Clearly state shipping costs. There must be no hidden fees. You are responsible for understanding your sales tax obligations.</Para>
          </SubSection>
        </Section>

        <Section id="fulfillment" title="4. Order Fulfillment">
          <SubSection title="4.1 Processing Time">
            <Para>The default processing time is 3 business days. You may set a custom processing time, but you must honour it. Consistent failure to meet processing times may affect your seller status.</Para>
          </SubSection>
          <SubSection title="4.2 Shipping">
            <BulletList items={[
              "Ship to the address provided by the buyer",
              "Provide a tracking number when available",
              "Mark orders as shipped within 24 hours of dispatching",
              "For international shipments, the buyer is responsible for customs duties",
            ]} />
          </SubSection>
          <SubSection title="4.3 Communication">
            <Para>Respond to buyer messages within 24 hours. Provide proactive order updates. Professional communication is required at all times.</Para>
          </SubSection>
          <SubSection title="4.4 Cancellations">
            <Para>You may cancel orders only if the item is out of stock (buyer must be notified), you are unable to ship within processing time, or suspicious activity is detected. Excessive cancellations will affect your seller status.</Para>
          </SubSection>
        </Section>

        <Section id="returns" title="5. Returns and Refunds">
          <SubSection title="5.1 Return Policy">
            <Para>As a seller, you must:</Para>
            <BulletList items={[
              "Accept returns for items not as described",
              "Clearly state your return policy in your shop",
              "Process refunds within 5 business days of receiving the returned item",
              "Respond to return requests within 3 business days",
            ]} />
          </SubSection>
          <SubSection title="5.2 Seller-Paid Returns">
            <Para>You are responsible for return shipping costs when:</Para>
            <BulletList items={[
              "Item was not as described",
              "Wrong item was shipped",
              "Item arrived damaged or defective",
            ]} />
          </SubSection>
          <SubSection title="5.3 Refund Processing">
            <Para>Refunds must be issued through the original payment method. Platform fees are refunded if within 30 days. Keep documentation of all refunds for your records.</Para>
          </SubSection>
        </Section>

        <Section id="performance" title="6. Seller Performance Standards">
          <SubSection title="6.1 Minimum Requirements">
            <div className="bg-secondary/40 rounded-xl overflow-hidden">
              {[
                { metric: "Response Rate", standard: "≥ 95% within 24 hours" },
                { metric: "Fulfilment Rate", standard: "≥ 98% on time" },
                { metric: "Cancellation Rate", standard: "≤ 2% (seller-initiated)" },
                { metric: "Return Rate", standard: "≤ 10% (defect-related)" },
              ].map((row, i) => (
                <div key={row.metric} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border/40" : ""}`}>
                  <span className="text-foreground font-medium">{row.metric}</span>
                  <span className="text-primary font-semibold">{row.standard}</span>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="6.2 Performance Reviews">
            <Para>Performance is reviewed monthly based on the previous 90 days of activity. Tier adjustments and non-compliance consequences are communicated by email. Chronic non-compliance may result in fees or suspension.</Para>
          </SubSection>
        </Section>

        <Section id="ip" title="7. Content and Intellectual Property">
          <SubSection title="7.1 Your Content">
            <Para>You retain ownership of your product photos, shop branding, and product descriptions. By listing on Coastaq, you grant us a licence to display and promote your content on our platform.</Para>
          </SubSection>
          <SubSection title="7.2 Prohibited Content">
            <Para>You may not use copyrighted material without permission, trademarks you don't own, false or misleading claims, or contact information embedded within listings.</Para>
          </SubSection>
        </Section>

        <Section id="conduct" title="8. Prohibited Seller Conduct">
          <BulletList items={[
            "Creating multiple seller accounts",
            "Manipulating reviews or ratings",
            "Offering incentives for positive reviews",
            "Completing transactions outside Coastaq",
            "Listing items not in stock",
            "Engaging in price gouging",
            "Selling counterfeit products",
            "Sharing customer information with third parties",
          ]} />
        </Section>

        <Section id="suspension" title="9. Account Suspension and Termination">
          <SubSection title="9.1 Grounds for Suspension or Termination">
            <BulletList items={[
              "Violation of this Agreement",
              "Excessive negative feedback or disputes",
              "Fraudulent activity",
              "Selling prohibited items",
              "Failure to fulfil orders",
              "Abuse of support or other users",
              "Legal or regulatory requirements",
            ]} />
          </SubSection>
          <SubSection title="9.2 Process">
            <Para>Written notice will be provided where possible. Minor violations will have an opportunity for correction. You may appeal within 14 days. Coastaq's final decision is binding.</Para>
          </SubSection>
          <SubSection title="9.3 Effect of Termination">
            <BulletList items={[
              "Active listings will be removed immediately",
              "Outstanding payouts will be processed (less applicable fees)",
              "Disputes will be resolved per platform policies",
              "You may not create a new seller account",
            ]} />
          </SubSection>
        </Section>

        <Section id="taxes" title="10. Taxes">
          <SubSection title="10.1 Seller Responsibility">
            <Para>You are responsible for collecting and remitting applicable sales tax, reporting income to tax authorities, and providing accurate tax information to Coastaq when required.</Para>
          </SubSection>
          <SubSection title="10.2 Tax Documents">
            <Para>Coastaq may issue 1099-K forms for qualifying sellers. Ensure your tax information is accurate and kept up to date.</Para>
          </SubSection>
        </Section>

        <Section id="liability" title="11. Liability and Insurance">
          <SubSection title="11.1 Seller Liability">
            <Para>You are liable for product quality and safety, shipping issues, returns and refunds, compliance with all applicable laws, and resolving customer disputes.</Para>
          </SubSection>
          <SubSection title="11.2 Recommended Insurance">
            <Para>High-volume sellers should consider product liability insurance, general business liability coverage, and errors and omissions coverage.</Para>
          </SubSection>
        </Section>

        <Section id="disputes" title="12. Dispute Resolution">
          <SubSection title="12.1 Internal Resolution">
            <Para>Attempt to resolve disputes with buyers directly first. Escalate to Coastaq if needed with full documentation. Coastaq's decision is final and binding.</Para>
          </SubSection>
          <SubSection title="12.2 Seller Protection">
            <Para>Coastaq may cover costs in cases of fraudulent buyer claims, chargebacks without valid reason, or platform errors.</Para>
          </SubSection>
          <SubSection title="12.3 Arbitration">
            <Para>Disputes with Coastaq are resolved through binding arbitration. A class action waiver applies.</Para>
          </SubSection>
        </Section>

        <Section id="modifications" title="13. Modifications">
          <Para>We may modify this Agreement with 30 days' notice. Continued selling on Coastaq after the notice period constitutes acceptance of the updated terms.</Para>
        </Section>

        <Section id="contact" title="14. Seller Contact">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <ContactRow label="Seller support" value="sellers@coastaq.com" />
            <ContactRow label="Account issues" value="seller-accounts@coastaq.com" />
            <ContactRow label="Appeals" value="seller-appeals@coastaq.com" />
          </div>
        </Section>

        <InfoBox color="blue">
          By selling on Coastaq, you acknowledge that you have read, understood, and agree to be bound by this Seller Agreement.
        </InfoBox>
      </div>
    </LegalPage>
  );
}
