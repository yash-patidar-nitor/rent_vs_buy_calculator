export function PMT(rate, nper, pv) {
    if (rate === 0) return -pv / nper;
    const pvif = Math.pow(1 + rate, nper);
    return rate / (pvif - 1) * -(pv * pvif);
}

export function calculateIRR(cashflows) {
    let low = -0.99; // Minimum limit
    let high = 1.0;  // Maximum limit (100% per month)
    const precision = 1e-7;
    
    // Quick bounds check based on total sum
    let sum = cashflows.reduce((a,b)=>a+b, 0);
    if (sum < 0) high = 0.0;
    else low = 0.0;

    for (let i = 0; i < 1000; i++) {
        let rate = (low + high) / 2;
        let npv = 0;
        for (let t = 0; t < cashflows.length; t++) {
            npv += cashflows[t] / Math.pow(1 + rate, t);
        }
        
        if (Math.abs(npv) < precision || (high - low) < precision) {
            return rate;
        }
        
        if (npv > 0) low = rate;
        else high = rate;
    }
    return (low + high) / 2;
}

// Typical 48-month CLP milestones. Total weight = 90 (since 10% is the agreement down payment).
export const defaultClpMilestones = [
  { id: 1, name: 'Excavation', time: 1/48, weight: 15 },
  { id: 2, name: 'Foundation for Plinth', time: 3/48, weight: 5 },
  { id: 3, name: 'Ground Floor', time: 5/48, weight: 5 },
  { id: 4, name: '15% of floors made', time: 8/48, weight: 4 },
  { id: 5, name: '30% of floors made', time: 10/48, weight: 4 },
  { id: 6, name: '45% of floors made', time: 13/48, weight: 4 },
  { id: 7, name: '60% of floors made', time: 16/48, weight: 4 },
  { id: 8, name: '75% of floors made', time: 19/48, weight: 4 },
  { id: 9, name: '90% of floors made', time: 22/48, weight: 4 },
  { id: 10, name: '100% of floors made', time: 25/48, weight: 4 },
  { id: 11, name: 'Top Terrace', time: 28/48, weight: 4 },
  { id: 12, name: 'Internal Plaster', time: 31/48, weight: 6 },
  { id: 13, name: 'Kitchen Otta', time: 34/48, weight: 6 },
  { id: 14, name: 'Flooring', time: 37/48, weight: 6 },
  { id: 15, name: 'Windows', time: 40/48, weight: 6 },
  { id: 16, name: 'Internal Painting', time: 43/48, weight: 6 },
  { id: 17, name: 'Arch & Civil', time: 46/48, weight: 2 },
  { id: 18, name: 'Occupancy Certificate', time: 48/48, weight: 1 }
];

export function generateModelData(inputs) {
    const {
        purchasePrice,
        downPayment,
        loanRate,
        loanYears,
        possessionDue,
        appreciationPhase1,
        appreciationPhase2,
        appreciationPhase3,
        appreciationPhase4,
        rentalYield,
        altCagr,
        horizonYears,
        customClp,
        loanRateType = 'fixed',
        bankSpread = 0.0225,
        repoPhases = [],
        appreciationRateType = 'floating',
        appreciationRate = 0.07,
        appreciationPhases = []
    } = inputs;

    const activeClp = customClp && customClp.length > 0 ? customClp : defaultClpMilestones;
    const totalWeight = activeClp.reduce((sum, m) => sum + m.weight, 0) || 1; // Prevent division by zero

    const loanAmountBase = purchasePrice - downPayment;
    const activeLoanMonths = possessionDue + (loanYears * 12);
    // Keep calculating data until either the loan is fully paid or the horizon is reached
    const maxMonth = Math.max(activeLoanMonths, horizonYears * 12);
    const targetMonth = horizonYears * 12;
    
    let loanBalance = 0;
    let cumulativeDisbursals = 0;
    let propValue = purchasePrice;
    let marketRent = 0;
    let rentInvestment = downPayment;
    let data = [];
    
    // Pre-calculate the compressed schedule based on the user's possessionDue timeframe
    const clpSchedule = activeClp.map(m => ({
        targetMonth: Math.max(1, Math.round(m.time * possessionDue)),
        fraction: m.weight / totalWeight
    }));

    let totalInterestPaid = 0;
    let totalRentPaid = 0;
    let totalSipInvested = 0;
    
    let cumulativeCashInvested = downPayment;
    let buyCashflowStream = [-downPayment];
    let rentCashflowStream = [-downPayment];

    let currentEmi = 0;
    let lastLoanRate = -1;

    for (let month = 1; month <= maxMonth; month++) {
        // --- Floating Loan Rate Logic ---
        let currentLoanRate = loanRate;
        if (loanRateType === 'floating' && repoPhases && repoPhases.length > 0) {
            let yearsElapsed = month / 12;
            let activeRepo = repoPhases[repoPhases.length - 1].rate; // Default to last phase
            let cumulativeYears = 0;
            for (let phase of repoPhases) {
                cumulativeYears += phase.durationYears;
                if (yearsElapsed <= cumulativeYears) {
                    activeRepo = phase.rate;
                    break;
                }
            }
            currentLoanRate = bankSpread + activeRepo;
        }

        // --- Loan Disbursal Logic ---
        let disbursal = 0;
        if (possessionDue === 0) {
            if (month === 1) disbursal = loanAmountBase;
        } else {
            const monthlyDisbursalFraction = clpSchedule
                .filter(m => m.targetMonth === month)
                .reduce((sum, m) => sum + m.fraction, 0);
            disbursal = loanAmountBase * monthlyDisbursalFraction;
        }
        cumulativeDisbursals += disbursal;
        
        const interestAccrued = (loanBalance + disbursal) * (currentLoanRate / 12);
        
        let totalPayment = 0;
        if (month <= possessionDue) {
            totalPayment = interestAccrued;
        } else if (month <= activeLoanMonths) {
            if (currentEmi === 0 || (currentLoanRate !== lastLoanRate && lastLoanRate !== -1)) {
                // If it's the first EMI month or the interest rate has changed, recalculate EMI
                // to ensure the loan finishes on the exact remaining schedule
                const remainingMonths = activeLoanMonths - month + 1;
                const principalToAmortize = loanBalance + disbursal;
                currentEmi = PMT(currentLoanRate/12, remainingMonths, -principalToAmortize);
                lastLoanRate = currentLoanRate;
            }
            totalPayment = currentEmi;
        } else {
            totalPayment = 0;
        }
        
        const principalPaid = Math.max(0, totalPayment - interestAccrued);
        // Ensure loan balance doesn't drop below 0 due to rounding
        loanBalance = Math.max(0, loanBalance + disbursal - principalPaid);

        totalInterestPaid += interestAccrued;

        // --- Property Logic ---
        // Compound property value smoothly every month, but using the specific annual phase rate
        const currentYear = Math.ceil(month / 12);
        let currentAppreciation = appreciationPhase4; // Default fallback
        
        if (appreciationRateType === 'floating' && appreciationPhases && appreciationPhases.length > 0) {
            let yearsElapsed = month / 12;
            let cumulativeYears = 0;
            currentAppreciation = appreciationPhases[appreciationPhases.length - 1].rate; // Default to terminal phase
            for (let phase of appreciationPhases) {
                cumulativeYears += phase.durationYears;
                if (yearsElapsed <= cumulativeYears) {
                    currentAppreciation = phase.rate;
                    break;
                }
            }
        } else if (appreciationRateType === 'fixed') {
            currentAppreciation = appreciationRate;
        } else {
            // Legacy fallback
            if (currentYear <= 5) currentAppreciation = appreciationPhase1;
            else if (currentYear <= 12) currentAppreciation = appreciationPhase2;
            else if (currentYear <= 18) currentAppreciation = appreciationPhase3;
            else currentAppreciation = appreciationPhase4;
        }
        
        if (month > 1) {
            // Apply 1/12th of the annual compounding formula
            propValue = propValue * Math.pow(1 + currentAppreciation, 1/12);
        }

        if (month === 1) {
            marketRent = purchasePrice * (rentalYield/12);
        } else if ((month - 1) % 12 === 0) {
            // Rent steps up once a year based on the new property value (matching real life)
            marketRent = propValue * (rentalYield/12);
        }

        // Before possession, you still owe the un-disbursed amount to the builder. 
        // This must be tracked as a liability to accurately reflect Net Worth.
        const unDisbursedAmount = loanAmountBase - cumulativeDisbursals;
        const ownerEquity = propValue - (loanBalance + unDisbursedAmount);

        // --- Renting Scenario Logic ---
        const rentingExpenses = marketRent;
        totalRentPaid += rentingExpenses;
        
        let buyingOutflow = 0;
        if (month <= possessionDue) {
            buyingOutflow = totalPayment + marketRent;
        } else if (month <= activeLoanMonths) {
            buyingOutflow = totalPayment;
        } else {
            // After loan is paid off, out-of-pocket is 0 (except maintenance, which we don't track)
            buyingOutflow = 0;
        }
        
        const sipDifference = buyingOutflow - rentingExpenses;
        
        // Track the SIP contribution or withdrawal
        const actualSip = sipDifference;
        totalSipInvested += sipDifference;
        
        const effectiveMonthlyCagr = Math.pow(1 + altCagr, 1/12) - 1;
        const investmentReturn = month === 1 ? (downPayment * effectiveMonthlyCagr) : (rentInvestment * effectiveMonthlyCagr);
        rentInvestment = rentInvestment + investmentReturn + sipDifference;

        cumulativeCashInvested += buyingOutflow;
        
        // Asset-level cashflows for XIRR.
        // We use -sipDifference for BOTH to measure the "Return on Differential Capital".
        // For the Renter, this represents money put into the market.
        // For the Buyer, this represents the EMI minus the "Imputed Rent" they saved by living there.
        // This makes the cashflow inputs mathematically identical, making the XIRRs perfectly comparable.
        buyCashflowStream.push(-sipDifference);
        rentCashflowStream.push(-sipDifference);

        let buyXirr = 0;
        let rentXirr = 0;
        
        // Calculate IRR only at annual intervals or at the very end to save CPU
        if (month % 12 === 0 || month === maxMonth || month === targetMonth) {
            const currentBuyStream = [...buyCashflowStream];
            currentBuyStream[currentBuyStream.length - 1] += ownerEquity; // Terminal value
            const monthlyBuyIrr = calculateIRR(currentBuyStream);
            buyXirr = isNaN(monthlyBuyIrr) ? 0 : Math.pow(1 + monthlyBuyIrr, 12) - 1;

            const currentRentStream = [...rentCashflowStream];
            currentRentStream[currentRentStream.length - 1] += Math.max(0, rentInvestment); // Terminal value
            const monthlyRentIrr = calculateIRR(currentRentStream);
            rentXirr = isNaN(monthlyRentIrr) ? 0 : Math.pow(1 + monthlyRentIrr, 12) - 1;
        }

        data.push({
            month,
            year: Math.ceil(month/12),
            buyNetWorth: ownerEquity,
            rentNetWorth: Math.max(0, rentInvestment),
            buyCashflow: buyingOutflow,
            rentCashflow: rentingExpenses,
            cumulativeCashInvested,
            buyXirr,
            rentXirr,
            loanBalance,
            propValue,
            sipPrincipal: downPayment + totalSipInvested,
            sipContribution: actualSip,
            investmentReturn,
            disbursal,
            interestAccrued,
            totalPayment,
            principalPaid
        });
    }
    
    // Extract exactly at the selected horizon
    const snapshotRow = data.find(d => d.month === targetMonth) || data[data.length - 1];
    
    const finalBuy = snapshotRow ? snapshotRow.buyNetWorth : 0;
    const finalRent = snapshotRow ? snapshotRow.rentNetWorth : 0;
    
    return {
        data,
        summary: {
            finalBuy,
            finalRent,
            buyXirr: snapshotRow ? snapshotRow.buyXirr : 0,
            rentXirr: snapshotRow ? snapshotRow.rentXirr : 0,
            cumulativeCashInvested: snapshotRow ? snapshotRow.cumulativeCashInvested : 0,
            wealthDiff: finalBuy - finalRent,
            advantage: finalRent > 0 ? ((finalBuy - finalRent) / finalRent) * 100 : 0,
            totalInterestPaid,
            totalRentPaid,
            totalSipInvested
        }
    };
}
