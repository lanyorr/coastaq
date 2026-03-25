import { LegalPage, Section, SubSection, Para, BulletList, ContactRow, InfoBox } from "@/components/legal/LegalPage";

const SECTIONS = [
  { id: "transaction", label: "Your Transaction" },
  { id: "buyer-rights", label: "Buyer Rights" },
  { id: "process", label: "Return Process" },
  { id: "amounts", label: "Refund Amounts" },
  { id: "shipping", label: "Return Shipping" },
  { id: "timing", label: "Processing Time" },
  { id: "seller-obligations", label: "Seller Obligations" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "chargebacks", label: "Chargebacks" },
  { id: "protection", label: "Buyer Protection" },
  { id: "exceptions", label: "Exceptions" },
  { id: "contact", label: "Contact" },
];

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      subtitle="We want you to shop with confidence. This policy explains how refunds and returns work on Coastaq."
      effectiveDate="March 26, 2026"
      sections={SECTIONS}
    >
      <InfoBox color="green">
        At Coastaq, our goal is a fair experience for both buyers and sellers. When issues arise, we're here to help resolve them quickly.
      </InfoBox>

      <div className="mt-8">
        <Section id="transaction" title="1. Understanding Your Transaction">
          <Para>
            When you buy on Coastaq, you enter into a direct agreement with the seller. Coastaq facilitates payment but sellers are responsible for product quality and description accuracy, shipping and delivery, and processing returns and refunds.
          </Para>
        </Section>

        <Section id="buyer-rights" title="2. Buyer Rights">
          <SubSection title="2.1 14-Day Satisfaction Guarantee">
            <Para>Buyers have 14 days from delivery to request a return if:</Para>
            <BulletList items={[
              "Product doesn't match the description",
              "Product is defective or damaged",
              "Wrong item was shipped",
            ]} />
          </SubSection>
          <SubSection title="2.2 Non-Returnable Items">
            <Para>Returns are not accepted for:</Para>
            <BulletList items={[
              "Digital products after download",
              "Perishable goods",
              "Custom or personalised items",
              "Intimate items for hygiene reasons",
              "Items clearly marked \"final sale\"",
            ]} />
          </SubSection>
        </Section>

        <Section id="process" title="3. Return Process">
          <div className="space-y-4">
            {[
              {
                step: "Step 1",
                title: "Contact the Seller",
                desc: "Message the seller through Coastaq within 14 days of delivery. Provide your order number, reason for return, and photos showing the issue if applicable.",
              },
              {
                step: "Step 2",
                title: "Seller Response",
                desc: "Sellers must respond within 3 business days with one of the following: full refund with return, partial refund without return, replacement item, or a decline with reason.",
              },
              {
                step: "Step 3",
                title: "Escalate if Needed",
                desc: "If the seller doesn't respond or declines unreasonably, escalate to Coastaq support within 7 days. We'll review and make a final decision.",
              },
            ].map(({ step, title, desc }, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  {i < 2 && <div className="w-px flex-1 bg-border mt-2" />}
                </div>
                <div className="pb-6">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{step}</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5 mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="amounts" title="4. Refund Amounts">
          <SubSection title="4.1 Full Refund">
            <Para>You receive the full product price, original shipping cost (if item was defective), and return shipping (if item was defective).</Para>
          </SubSection>
          <SubSection title="4.2 Partial Refund">
            <Para>A partial refund may be issued for: item not as described but you choose to keep it, slight damage or wear not mentioned in the listing, or delayed shipping.</Para>
          </SubSection>
          <SubSection title="4.3 No Refund">
            <Para>Refunds are not issued if:</Para>
            <BulletList items={[
              "You changed your mind on non-returnable items",
              "Item was damaged after delivery",
              "You provided an incorrect shipping address",
              "Item was lost due to courier error (file a claim with the courier directly)",
            ]} />
          </SubSection>
        </Section>

        <Section id="shipping" title="5. Return Shipping">
          <SubSection title="5.1 Who Pays?">
            <BulletList items={[
              "Seller's fault (wrong item, damaged, not as described) — seller pays return shipping",
              "Buyer's fault (changed mind, ordered wrong size) — buyer pays return shipping",
              "Free returns — some sellers offer this as a shop policy",
            ]} />
          </SubSection>
          <SubSection title="5.2 Return Instructions">
            <BulletList items={[
              "Use tracked shipping for all returns",
              "Keep the tracking number until your refund is processed",
              "Pack items securely to prevent damage in transit",
            ]} />
          </SubSection>
        </Section>

        <Section id="timing" title="6. Refund Processing Time">
          <Para>After the seller approves your return:</Para>
          <div className="bg-secondary/50 rounded-xl overflow-hidden mt-2">
            {[
              { phase: "Buyer ships item back", time: "5–10 days" },
              { phase: "Seller receives and inspects", time: "3–5 days" },
              { phase: "Seller issues refund", time: "1–3 days" },
              { phase: "Payment processor returns funds", time: "3–10 days" },
            ].map((row, i, arr) => (
              <div key={row.phase} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                <span className="text-sm text-foreground">{row.phase}</span>
                <span className="text-sm text-primary font-semibold">{row.time}</span>
              </div>
            ))}
          </div>
          <InfoBox color="amber">
            Total expected timeline: 2–4 weeks from return request to refund received.
          </InfoBox>
        </Section>

        <Section id="seller-obligations" title="7. Seller Refund Obligations">
          <Para>As a seller on Coastaq, you must:</Para>
          <BulletList items={[
            "Process refund requests within 3 business days",
            "Accept returns for items not as described",
            "Issue refunds within 5 business days of receiving the returned item",
            "Maintain a clear return policy in your shop",
          ]} />
          <InfoBox color="amber">
            Failure to comply with refund obligations may result in account suspension.
          </InfoBox>
        </Section>

        <Section id="disputes" title="8. Dispute Resolution">
          <Para>If you and the seller cannot reach an agreement:</Para>
          <BulletList items={[
            "Escalate to Coastaq support with all supporting evidence",
            "We'll review messages, photos, and tracking information",
            "A decision will be made within 5–7 business days",
            "The decision is final and binding",
          ]} />
          <SubSection title="Evidence We Need">
            <BulletList items={[
              "Order number",
              "Photos clearly showing the issue",
              "Messages exchanged with the seller",
              "Tracking information",
              "Any other relevant documentation",
            ]} />
          </SubSection>
        </Section>

        <Section id="chargebacks" title="9. Chargebacks">
          <Para>A chargeback is when a buyer disputes a charge directly with their bank or card company. Before filing a chargeback:</Para>
          <BulletList items={[
            "Contact the seller through Coastaq first",
            "Give us a chance to help resolve the issue",
            "Filing a chargeback without contacting us may result in account suspension",
          ]} />
          <InfoBox color="red">
            If you file a chargeback, your Coastaq account may be temporarily suspended while the case is investigated. If the chargeback is found to be unfounded, you may be responsible for associated fees.
          </InfoBox>
        </Section>

        <Section id="protection" title="10. Coastaq Buyer Protection">
          <Para>We automatically cover eligible purchases up to $2,000 USD when:</Para>
          <BulletList items={[
            "Item never arrives",
            "Item is significantly not as described",
            "Seller doesn't respond to a return request",
          ]} />
          <SubSection title="To Qualify">
            <BulletList items={[
              "Purchase made through Coastaq checkout",
              "Payment processed via Stripe or PayPal",
              "Issue reported within the stated timeframe",
              "All communication conducted through the Coastaq platform",
            ]} />
          </SubSection>
        </Section>

        <Section id="exceptions" title="11. Exceptions">
          <SubSection title="Pre-orders">
            <Para>Cancellations are accepted before shipping. Returns are accepted after delivery per standard policy.</Para>
          </SubSection>
          <SubSection title="International Orders">
            <Para>Customs delays do not qualify for non-delivery claims. Return shipping costs may be higher for international orders. Duties and taxes are generally non-refundable.</Para>
          </SubSection>
          <SubSection title="Bulk Orders">
            <Para>Special return terms may apply to bulk orders. Contact the seller before purchasing large quantities.</Para>
          </SubSection>
        </Section>

        <Section id="contact" title="12. Contact for Refund Issues">
          <Para>If you need help with a refund:</Para>
          <div className="bg-card border border-border/50 rounded-2xl p-5 mt-3">
            <ContactRow label="Refund issues" value="refunds@coastaq.com" />
          </div>
          <Para>Please use the subject line "Refund Issue - Order #[your order number]" and attach screenshots of the issue and your messages with the seller.</Para>
        </Section>
      </div>
    </LegalPage>
  );
}
