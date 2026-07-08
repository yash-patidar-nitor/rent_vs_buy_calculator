import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Share2, FileDown } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { generateModelData } from './engine';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Methodology from './Methodology';
import ClpScheduleTab from './ClpScheduleTab';

function formatCurrency(value) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value || 0).toLocaleString()}`;
}

function formatPlainCur(value) {
  return `₹${Math.round(value || 0).toLocaleString()}`;
}

function App() {
  const [view, setView] = useState('charts'); // 'charts', 'summary', 'loan', 'rent', 'buy'
  const [showFloatingConfig, setShowFloatingConfig] = useState(false);
  const [showAppreciationConfig, setShowAppreciationConfig] = useState(false);
  const componentRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Rent_vs_Buy_Analysis',
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard! Anyone you share this with will see your exact inputs.');
  };

  const [inputs, setInputs] = useState(() => {
    const defaultInputs = {
      purchasePrice: 18000000,
      downPayment: 2500000,
      loanRate: 0.075,
      loanYears: 30,
      possessionDue: 36,
      appreciationPhase1: 0.08,
      appreciationPhase1Years: 5,
      appreciationPhase2: 0.055,
      appreciationPhase2Years: 7,
      appreciationPhase3: 0.04,
      appreciationPhase3Years: 6,
      appreciationPhase4: 0.035,
      appreciationRateType: 'floating',
      appreciationRate: 0.07,
      loanRateType: 'floating',
      bankSpread: 0.0225,
      repoPhase1: 0.05125,
      repoPhase1Years: 10,
      repoPhase2: 0.04375,
      repoPhase2Years: 10,
      repoPhase3: 0.035,
      repoPhase3Years: 10,
      rentalYield: 0.025,
      altCagr: 0.10,
      horizonYears: 15
    };

    const params = new URLSearchParams(window.location.search);
    let hasUrlParams = false;
    const urlInputs = {};
    for (const [key, value] of params.entries()) {
      urlInputs[key] = isNaN(value) ? value : parseFloat(value);
      hasUrlParams = true;
    }

    if (hasUrlParams) {
      return { ...defaultInputs, ...urlInputs };
    }

    const saved = localStorage.getItem('rentVsBuyInputs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved settings", e);
      }
    }
    return defaultInputs;
  });

  useEffect(() => {
    localStorage.setItem('rentVsBuyInputs', JSON.stringify(inputs));
    const params = new URLSearchParams();
    Object.entries(inputs).forEach(([key, val]) => params.set(key, val));
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [inputs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'loanRateType' || name === 'appreciationRateType') {
      setInputs(prev => ({ ...prev, [name]: value }));
    } else {
      setInputs(prev => ({ ...prev, [name]: parseFloat(value) }));
    }
  };

  const { data, summary } = useMemo(() => {
    const modelInputs = { ...inputs };
    modelInputs.repoPhases = [
      { durationYears: inputs.repoPhase1Years, rate: inputs.repoPhase1 },
      { durationYears: inputs.repoPhase2Years, rate: inputs.repoPhase2 },
      { durationYears: inputs.repoPhase3Years, rate: inputs.repoPhase3 }
    ];
    modelInputs.appreciationPhases = [
      { durationYears: inputs.appreciationPhase1Years, rate: inputs.appreciationPhase1 },
      { durationYears: inputs.appreciationPhase2Years, rate: inputs.appreciationPhase2 },
      { durationYears: inputs.appreciationPhase3Years, rate: inputs.appreciationPhase3 }
    ];
    return generateModelData(modelInputs);
  }, [inputs]);

  return (
    <div className="app-container">
      <aside className="glass-panel">
        <div className="header">
          <h1>CLP Financial Model</h1>
          <p>Live Rent vs Buy Analysis</p>
        </div>
        <div className="inputs">
          <InputSlider label="Purchase Price" name="purchasePrice" value={inputs.purchasePrice} min={5000000} max={50000000} step={100000} format={formatCurrency} onChange={handleChange} />
          <InputSlider label="Down Payment" name="downPayment" value={inputs.downPayment} min={500000} max={inputs.purchasePrice} step={100000} format={formatCurrency} onChange={handleChange} />
          <InputSlider label="Possession Due (Months)" name="possessionDue" value={inputs.possessionDue} min={0} max={60} step={1} format={v => `${v} mo`} onChange={handleChange} />
          <InputSlider label="Loan Tenure (Years)" name="loanYears" value={inputs.loanYears} min={10} max={30} step={1} format={v => `${v} yrs`} onChange={handleChange} />
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>HOME LOAN RATE</span>
            <select name="loanRateType" value={inputs.loanRateType} onChange={handleChange} style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}>
                <option value="fixed" style={{background: 'var(--surface-color)'}}>Fixed</option>
                <option value="floating" style={{background: 'var(--surface-color)'}}>Floating</option>
            </select>
          </div>
          
          {inputs.loanRateType === 'fixed' ? (
              <InputSlider label="Fixed Loan Rate" name="loanRate" value={inputs.loanRate} min={0.05} max={0.12} step={0.001} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
          ) : (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>
                  <InputSlider label="Bank Premium (Spread)" name="bankSpread" value={inputs.bankSpread} min={0.01} max={0.05} step={0.001} format={v => `${(v*100).toFixed(2)}%`} onChange={handleChange} />
                  <button onClick={() => setShowFloatingConfig(!showFloatingConfig)} style={{ width: '100%', padding: '6px', marginTop: '8px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}>
                      {showFloatingConfig ? 'Hide Macro Phases' : 'Configure Macro Phases'}
                  </button>
                  {showFloatingConfig && (
                      <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px' }}>Emerging Era</div>
                          <InputSlider label="Repo Rate" name="repoPhase1" value={inputs.repoPhase1} min={0.02} max={0.08} step={0.001} format={v => `${(v*100).toFixed(2)}%`} onChange={handleChange} />
                          <InputSlider label="Duration (Years)" name="repoPhase1Years" value={inputs.repoPhase1Years} min={1} max={20} step={1} format={v => `${v} yrs`} onChange={handleChange} />
                          
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px', marginTop: '12px' }}>Maturing Era</div>
                          <InputSlider label="Repo Rate" name="repoPhase2" value={inputs.repoPhase2} min={0.02} max={0.08} step={0.001} format={v => `${(v*100).toFixed(2)}%`} onChange={handleChange} />
                          <InputSlider label="Duration (Years)" name="repoPhase2Years" value={inputs.repoPhase2Years} min={1} max={20} step={1} format={v => `${v} yrs`} onChange={handleChange} />
                          
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px', marginTop: '12px' }}>Developed Era</div>
                          <InputSlider label="Repo Rate" name="repoPhase3" value={inputs.repoPhase3} min={0.02} max={0.08} step={0.001} format={v => `${(v*100).toFixed(2)}%`} onChange={handleChange} />
                          <InputSlider label="Duration (Years)" name="repoPhase3Years" value={inputs.repoPhase3Years} min={1} max={20} step={1} format={v => `${v} yrs`} onChange={handleChange} />

                          <button onClick={() => setInputs(prev => ({...prev, bankSpread: 0.0225, repoPhase1: 0.05125, repoPhase1Years: 10, repoPhase2: 0.04375, repoPhase2Years: 10, repoPhase3: 0.035, repoPhase3Years: 10}))} style={{ width: '100%', padding: '6px', marginTop: '12px', background: 'var(--surface-color)', border: '1px solid var(--accent-buy)', color: 'var(--accent-buy)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                              Reset to Default Trends
                          </button>
                      </div>
                  )}
              </div>
          )}
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PROPERTY APPRECIATION</span>
            <select name="appreciationRateType" value={inputs.appreciationRateType} onChange={handleChange} style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}>
                <option value="fixed" style={{background: 'var(--surface-color)'}}>Fixed</option>
                <option value="floating" style={{background: 'var(--surface-color)'}}>Phased</option>
            </select>
          </div>
          
          {inputs.appreciationRateType === 'fixed' ? (
              <InputSlider label="Flat Appreciation Rate" name="appreciationRate" value={inputs.appreciationRate} min={0.01} max={0.15} step={0.005} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
          ) : (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>
                  <button onClick={() => setShowAppreciationConfig(!showAppreciationConfig)} style={{ width: '100%', padding: '6px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}>
                      {showAppreciationConfig ? 'Hide Lifecycle Phases' : 'Configure Lifecycle Phases'}
                  </button>
                  {showAppreciationConfig && (
                      <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px' }}>High Growth Phase</div>
                          <InputSlider label="Appreciation Rate" name="appreciationPhase1" value={inputs.appreciationPhase1} min={0.01} max={0.15} step={0.005} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
                          <InputSlider label="Duration (Years)" name="appreciationPhase1Years" value={inputs.appreciationPhase1Years} min={1} max={20} step={1} format={v => `${v} yrs`} onChange={handleChange} />
                          
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px', marginTop: '12px' }}>Normal Growth Phase</div>
                          <InputSlider label="Appreciation Rate" name="appreciationPhase2" value={inputs.appreciationPhase2} min={0.01} max={0.15} step={0.005} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
                          <InputSlider label="Duration (Years)" name="appreciationPhase2Years" value={inputs.appreciationPhase2Years} min={1} max={20} step={1} format={v => `${v} yrs`} onChange={handleChange} />
                          
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px', marginTop: '12px' }}>Mature Phase</div>
                          <InputSlider label="Appreciation Rate" name="appreciationPhase3" value={inputs.appreciationPhase3} min={0.01} max={0.15} step={0.005} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
                          <InputSlider label="Duration (Years)" name="appreciationPhase3Years" value={inputs.appreciationPhase3Years} min={1} max={20} step={1} format={v => `${v} yrs`} onChange={handleChange} />

                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-buy)', marginBottom: '8px', marginTop: '12px' }}>Terminal Phase (Forever)</div>
                          <InputSlider label="Appreciation Rate" name="appreciationPhase4" value={inputs.appreciationPhase4} min={0.01} max={0.15} step={0.005} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />

                          <button onClick={() => setInputs(prev => ({...prev, appreciationPhase1: 0.08, appreciationPhase1Years: 5, appreciationPhase2: 0.055, appreciationPhase2Years: 7, appreciationPhase3: 0.04, appreciationPhase3Years: 6, appreciationPhase4: 0.035}))} style={{ width: '100%', padding: '6px', marginTop: '12px', background: 'var(--surface-color)', border: '1px solid var(--accent-buy)', color: 'var(--accent-buy)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                              Reset to Default Trends
                          </button>
                      </div>
                  )}
              </div>
          )}
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>INVESTMENT & RENT</div>

          <InputSlider label="Rental Yield" name="rentalYield" value={inputs.rentalYield} min={0.01} max={0.06} step={0.001} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
          <InputSlider label="Investment CAGR" name="altCagr" value={inputs.altCagr} min={0.06} max={0.15} step={0.005} format={v => `${(v*100).toFixed(1)}%`} onChange={handleChange} />
          <InputSlider label="Investment Horizon (Years)" name="horizonYears" value={inputs.horizonYears} min={5} max={50} step={1} format={v => `${v} yrs`} onChange={handleChange} />
        </div>
      </aside>

      <main className="dashboard" ref={componentRef}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '4rem 1rem 3rem', background: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button className="icon-btn" onClick={handleCopyLink} title="Copy Link"><Share2 size={18} /></button>
            <button className="icon-btn" onClick={handlePrint} title="Export PDF"><FileDown size={18} /></button>
          </div>
          <h2 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {summary.finalBuy > summary.finalRent ? 'Buying makes you richer by' : 'Renting makes you richer by'}
          </h2>
          <div style={{ color: summary.finalBuy > summary.finalRent ? 'var(--accent-buy)' : 'var(--accent-rent)', fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '2rem', textShadow: summary.finalBuy > summary.finalRent ? '0 0 40px rgba(0, 184, 153, 0.4)' : '0 0 40px rgba(255, 107, 0, 0.4)' }}>
            {formatCurrency(Math.abs(summary.finalBuy - summary.finalRent))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Buying Net Worth</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(summary.finalBuy)}</div>
              <div style={{ color: 'var(--accent-buy)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>XIRR: {(summary.buyXirr * 100).toFixed(2)}%</div>
            </div>
            <div style={{ width: '1px', background: 'var(--surface-border)' }}></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Renting Net Worth</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(summary.finalRent)}</div>
              <div style={{ color: 'var(--accent-rent)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>XIRR: {(summary.rentXirr * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ paddingBottom: 0 }}>
          <div className="tabs-header">
            <button className={`tab-btn ${view === 'charts' ? 'active' : ''}`} onClick={() => setView('charts')}>Visual Dashboard</button>
            <button className={`tab-btn ${view === 'summary' ? 'active' : ''}`} onClick={() => setView('summary')}>Summary Table</button>
            <button className={`tab-btn ${view === 'loan' ? 'active' : ''}`} onClick={() => setView('loan')}>Loan Schedule</button>
            <button className={`tab-btn ${view === 'rent' ? 'active' : ''}`} onClick={() => setView('rent')}>Renting Cashflows</button>
            <button className={`tab-btn ${view === 'buy' ? 'active' : ''}`} onClick={() => setView('buy')}>Buying Cashflows</button>
            <button className={`tab-btn ${view === 'clp' ? 'active' : ''}`} onClick={() => setView('clp')}>CLP Schedule</button>
          </div>
        </div>

        {view === 'charts' && (
          <>
            <div className="glass-panel">
              <div className="chart-header">Net Worth Over Time</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-buy)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent-buy)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-rent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent-rent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `₹${(val/10000000).toFixed(1)}Cr`} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Month ${label}`} contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ fontWeight: 600 }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="buyNetWorth" name="Buying Net Worth" stroke="var(--accent-buy)" fill="url(#colorBuy)" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: 'var(--accent-buy)', stroke: '#000', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="rentNetWorth" name="Renting Net Worth" stroke="var(--accent-rent)" fill="url(#colorRent)" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: 'var(--accent-rent)', stroke: '#000', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel">
              <div className="chart-header">SIP Compounding Growth (Renting Scenario)</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRentNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-buy)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent-buy)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-rent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent-rent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Month ${label}`} contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ fontWeight: 600 }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="rentNetWorth" name="Total Market Value" fill="url(#colorRentNet)" stroke="var(--accent-buy)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="sipPrincipal" name="Total Invested Principal" fill="url(#colorSip)" stroke="var(--accent-rent)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel">
              <div className="chart-header">Monthly Out-of-Pocket Cashflow</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} stroke="#94a3b8" width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Month ${label}`} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Legend />
                    <Line type="stepAfter" dataKey="buyCashflow" name="Buying Outflow (Pre-EMI + Rent -> EMI)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="stepAfter" dataKey="rentCashflow" name="Renting Expenses (Market Rent)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {view !== 'charts' && (
          <div className="glass-panel">
            <div className="table-container" style={{ maxHeight: '800px' }}>
              <table className="data-table">
                {view === 'summary' && (
                  <>
                    <thead>
                      <tr><th>Year</th><th>Month</th><th>Total Invested</th><th>Buying Net Worth</th><th>Buy XIRR</th><th>Renting Net Worth</th><th>Rent XIRR</th><th>Wealth Diff</th></tr>
                    </thead>
                    <tbody>
                      {data.filter(d => d.month % 12 === 0 || d.month === data.length).map(row => (
                        <tr key={row.month}>
                          <td>{row.year}</td><td>{row.month}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{formatPlainCur(row.cumulativeCashInvested)}</td>
                          <td>{formatPlainCur(row.buyNetWorth)}</td>
                          <td style={{ color: 'var(--accent-buy)' }}>{(row.buyXirr * 100).toFixed(1)}%</td>
                          <td>{formatPlainCur(row.rentNetWorth)}</td>
                          <td style={{ color: 'var(--accent-rent)' }}>{(row.rentXirr * 100).toFixed(1)}%</td>
                          <td style={{ color: row.buyNetWorth > row.rentNetWorth ? 'var(--success)' : 'var(--accent-rent)' }}>{formatPlainCur(Math.abs(row.buyNetWorth - row.rentNetWorth))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {view === 'loan' && (
                  <>
                    <thead>
                      <tr><th>Month</th><th>Disbursal</th><th>Interest Accrued</th><th>Total Payment</th><th>Principal Paid</th><th>Closing Balance</th></tr>
                    </thead>
                    <tbody>
                      {data.map(row => (
                        <tr key={row.month}>
                          <td>{row.month}</td><td>{formatPlainCur(row.disbursal)}</td><td>{formatPlainCur(row.interestAccrued)}</td>
                          <td>{formatPlainCur(row.totalPayment)}</td><td>{formatPlainCur(row.principalPaid)}</td><td>{formatPlainCur(row.loanBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {view === 'rent' && (
                  <>
                    <thead>
                      <tr><th>Month</th><th>Rent Expense</th><th>Buy Outflow (Ref)</th><th>SIP Contribution</th><th>Cumulative SIP</th><th>Invest Return</th><th>Market Value</th></tr>
                    </thead>
                    <tbody>
                      {data.map(row => (
                        <tr key={row.month}>
                          <td>{row.month}</td><td>{formatPlainCur(row.rentCashflow)}</td><td>{formatPlainCur(row.buyCashflow)}</td>
                          <td>{formatPlainCur(row.sipContribution)}</td><td>{formatPlainCur(row.sipPrincipal)}</td>
                          <td>{formatPlainCur(row.investmentReturn)}</td><td>{formatPlainCur(row.rentNetWorth)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {view === 'buy' && (
                  <>
                    <thead>
                      <tr><th>Month</th><th>Property Value</th><th>Loan Balance</th><th>Owner Equity</th><th>EMI / Pre-EMI</th><th>Rent (Waiting Period)</th><th>Total Outflow</th></tr>
                    </thead>
                    <tbody>
                      {data.map(row => (
                        <tr key={row.month}>
                          <td>{row.month}</td><td>{formatPlainCur(row.propValue)}</td><td>{formatPlainCur(row.loanBalance)}</td>
                          <td>{formatPlainCur(row.buyNetWorth)}</td>
                          <td>{formatPlainCur(row.totalPayment)}</td>
                          <td style={{ color: (row.buyCashflow - row.totalPayment) > 0 ? 'var(--accent-rent)' : 'inherit' }}>{formatPlainCur(row.buyCashflow - row.totalPayment)}</td>
                          <td>{formatPlainCur(row.buyCashflow)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        )}

        {view === 'clp' && (
          <div className="glass-panel">
            <ClpScheduleTab inputs={inputs} setInputs={setInputs} />
          </div>
        )}
        
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
          <Methodology />
        </div>

        <div className="print-only" style={{ marginTop: '2rem' }}>
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Annual Financial Summary</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Year</th><th>Total Invested</th><th>Buy Net Worth</th><th>Buy XIRR</th><th>Rent Net Worth</th><th>Rent XIRR</th><th>Wealth Diff</th></tr>
                </thead>
                <tbody>
                  {data.filter(d => d.month % 12 === 0 || d.month === data.length).map(row => (
                    <tr key={row.month}>
                      <td>{row.year}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatPlainCur(row.cumulativeCashInvested)}</td>
                      <td>{formatPlainCur(row.buyNetWorth)}</td>
                      <td style={{ color: 'var(--accent-buy)' }}>{(row.buyXirr * 100).toFixed(1)}%</td>
                      <td>{formatPlainCur(row.rentNetWorth)}</td>
                      <td style={{ color: 'var(--accent-rent)' }}>{(row.rentXirr * 100).toFixed(1)}%</td>
                      <td style={{ color: row.buyNetWorth > row.rentNetWorth ? 'var(--success)' : 'var(--accent-rent)' }}>{formatPlainCur(Math.abs(row.buyNetWorth - row.rentNetWorth))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputSlider({ label, name, value, min, max, step, format, onChange }) {
  return (
    <div className="input-group">
      <div className="input-header">
        <span>{label}</span>
        <span className="input-value">{format(value)}</span>
      </div>
      <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  );
}

export default App;
