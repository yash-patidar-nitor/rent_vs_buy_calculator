import React from 'react';

export default function Methodology() {
  return (
    <div className="glass-panel methodology-content">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-buy)' }}>Detailed Methodology & Assumptions</h2>
      
      <div className="methodology-section">
        <h3>1. The Buying Scenario</h3>
        <p>The "Buy" calculation tracks your wealth buildup through physical asset appreciation and debt paydown.</p>
        <ul>
          <li><strong>Construction Linked Plan (CLP) Disbursals:</strong> When booking an under-construction property, the bank does not give the builder the entire loan amount on Day 1. The loan is disbursed according to a realistic 18-milestone construction schedule (e.g., 15% on Excavation, 5% on Plinth, 4% per slab, down to 1% for OC). 
          <br/><strong>Note:</strong> The schedule automatically and proportionally compresses to match whatever <strong>Possession Due</strong> timeframe you select on the slider. Furthermore, the first major milestone (e.g. Excavation 15%) is modeled to trigger in the very first month.</li>
          <li><strong>Pre-EMI Phase:</strong> Before possession, you only pay "Pre-EMI," which is simple interest calculated solely on the amount that has been disbursed so far. You do not pay back any principal during this phase.</li>
          <li><strong>Full EMI Phase:</strong> Once possession is handed over, the full loan amount has been disbursed. Your payments convert to a standard Full EMI (Principal + Interest) based on your selected Loan Tenure.</li>
          <li><strong>Phased Property Appreciation:</strong> Property value does not compound smoothly every month. It remains flat throughout the year and experiences a step-up appreciation <strong>annually</strong>. Furthermore, real estate typically goes through maturity cycles rather than growing at a flat rate forever. The model breaks this into four configurable phases:
            <ul>
              <li><em>Phase 1 (Years 1-5):</em> High Growth phase.</li>
              <li><em>Phase 2 (Years 6-12):</em> Normal Growth phase.</li>
              <li><em>Phase 3 (Years 13-18):</em> Mature Market phase.</li>
              <li><em>Phase 4 (Years 19+):</em> Late Stage / Inflation-matching phase.</li>
            </ul>
          </li>
          <li><strong>Net Worth (Buy):</strong> Calculated strictly as the current Market Value of the property minus the outstanding Loan Balance.</li>
        </ul>
      </div>

      <div className="methodology-section">
        <h3>2. The Renting Scenario (Opportunity Cost)</h3>
        <p>The "Rent" calculation answers the question: <em>"What if I never bought the house, rented a similar place, and aggressively invested the exact cashflow difference?"</em></p>
        <ul>
          <li><strong>Initial Capital:</strong> Instead of paying the Down Payment to a builder, you invest that entire sum on Day 1 into the market (e.g., Index Funds) where it begins compounding at your <em>Investment CAGR</em>.</li>
          <li><strong>Market Rent:</strong> The rent you pay is determined by multiplying the current Property Value by the <em>Rental Yield</em>. Because the property appreciates annually, your rent also increases annually.</li>
          <li><strong>Dynamic SIP Contributions & Capital Withdrawals:</strong> Every month, the model calculates the exact cashflow difference between the two scenarios:
            <br/><br/>
            <code>Cashflow Difference = (Buying Outflow) - (Market Rent)</code>
            <br/><br/>
            <strong>Scenario A (Buying is more expensive):</strong> In the early years, the cost of paying an EMI (and Pre-EMI + Rent before possession) is usually much higher than just paying rent. You take this positive cashflow difference and invest it as a monthly SIP, adding to your compounding capital.
            <br/><br/>
            <strong>Scenario B (Renting is more expensive):</strong> In the later years, your EMI remains fixed, but inflation causes your Market Rent to skyrocket. Eventually, your rent becomes higher than the EMI. When this happens, the cashflow difference becomes negative. <strong>You must now withdraw capital from your SIP investment portfolio to cover the expensive rent.</strong> The model automatically deducts this from your compounding market balance.
          </li>
          <li><strong>Compounding:</strong> Your rented Net Worth is your market portfolio. It grows via <em>Effective Annual Compounding</em> (mathematically smoothed to apply the exact targeted CAGR proportionately each month without overinflating the returns), and is constantly adjusted by your SIP additions or withdrawals.</li>
        </ul>
      </div>

      <div className="methodology-section">
        <h3>3. XIRR & Financial Leverage</h3>
        <p>The XIRR (Extended Internal Rate of Return) percentages shown in the dashboard are carefully calculated to measure the true <strong>Return on Differential Capital</strong>.</p>
        <ul>
          <li><strong>Excluding Sunk Living Costs:</strong> Because rent is a mandatory living expense that you would have to pay regardless of whether you rent or buy, the model mathematically strips it out of both investment cashflow streams.</li>
          <li><strong>Renting XIRR:</strong> This tracks strictly the discretionary capital you put into the stock market (Down Payment + SIP Contributions). If your rent gets so high that you must withdraw capital, the XIRR correctly logs that as a positive cash withdrawal. As a result, the Renting XIRR will naturally perfectly align with your chosen Stock Market CAGR assumption.</li>
          <li><strong>Buying XIRR (Imputed Rent):</strong> This tracks exactly the discretionary capital you put into the house asset. Because you bought the house, you get to live in it rent-free. This acts as a monthly "dividend" (Imputed Rent) that you consume. Therefore, your true out-of-pocket investment is exactly your EMI minus the Rent you saved.</li>
          <li><strong>The Power of Leverage:</strong> You may notice your Buying XIRR (e.g. 10.1%) is much higher than your chosen Property Appreciation Rate (e.g. 7%). This is the magic of leverage. You capture 100% of the capital appreciation on a massive ₹1.8 Cr asset, while only committing a small fraction of your own capital (your Down Payment). Leverage significantly amplifies your Return on Equity, allowing real estate to beat the stock market even with slower absolute growth!</li>
        </ul>
      </div>

      <div className="methodology-section">
        <h3>4. Macroeconomic Floating Interest Rates</h3>
        <p>The model fully supports dynamic, floating-rate mortgages that adjust to long-term macroeconomic trends.</p>
        <ul>
          <li><strong>Structural Macro Eras:</strong> In developing economies, as they transition to middle-income and fully developed markets, the structural neutral real rate (and thus the central bank repo rate) tends to drop over decades. You can configure these macroeconomic eras in the sidebar.</li>
          <li><strong>Dynamic EMI Recalculation:</strong> When the model detects a shift into a new macroeconomic era with a lower repo rate, it mathematically triggers a "Loan Restructuring" just like a real bank. Instead of shrinking the loan tenure, the model dynamically recalculates and drops your EMI amount based on the remaining principal and remaining months, maintaining the original timeline for a perfect comparison against the Renter's compounding horizon.</li>
        </ul>
      </div>

      <div className="methodology-section">
        <h3>5. Key Assumptions & Constraints</h3>
        <ul>
          <li><strong>Investment Horizon Snapshots:</strong> The top summary tiles act as a snapshot of your wealth at a specific year in the future. The visual charts always calculate the full lifetime curve up to the end of your loan tenure so you can trace the break-even points.</li>
          <li><strong>Tax Implications:</strong> This model computes pure cashflow and opportunity cost. It does <em>not</em> factor in income tax deductions (like Section 80C or 24b) which may slightly favor buying. It also does not factor in Long Term Capital Gains (LTCG) taxes on equity or real estate, which would reduce the final realized wealth of both scenarios upon liquidation.</li>
          <li><strong>Maintenance & Sunk Costs:</strong> It assumes registration costs, stamp duty, and ongoing property maintenance are either baked into the Purchase Price or considered negligible/equivalent to the friction costs of renting (brokerage, moving costs) for this comparison.</li>
        </ul>
      </div>
    </div>
  );
}
