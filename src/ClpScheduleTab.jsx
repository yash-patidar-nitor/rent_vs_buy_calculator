import React, { useState } from 'react';
import { defaultClpMilestones } from './engine';

export default function ClpScheduleTab({ inputs, setInputs }) {
  const [editingId, setEditingId] = useState(null);
  
  const activeClp = inputs.customClp && inputs.customClp.length > 0 ? inputs.customClp : defaultClpMilestones;
  
  const handleReset = () => {
    setInputs(prev => ({ ...prev, customClp: defaultClpMilestones }));
    setEditingId(null);
  };
  
  const handleChange = (id, field, value) => {
    const newClp = activeClp.map(m => {
      if (m.id === id) {
        return { ...m, [field]: value };
      }
      return m;
    });
    setInputs(prev => ({ ...prev, customClp: newClp }));
  };

  const today = new Date();
  
  const totalWeight = activeClp.reduce((sum, m) => sum + m.weight, 0);

  return (
    <div className="glass-panel" style={{ maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <h2 style={{ color: 'var(--accent-buy)' }}>Custom CLP Schedule</h2>
        <button onClick={handleReset} style={{ background: 'var(--accent-rent)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Reset to Default</button>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', flexShrink: 0 }}>
        Edit the milestones below. The time fraction is used to proportionally compress the schedule into your {inputs.possessionDue}-month possession window. 
        The loan amount is distributed based on the relative weight of each milestone.
      </p>

      <div className="table-container" style={{ flexGrow: 1 }}>
        <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Milestone Name</th>
            <th>Relative Time Fraction</th>
            <th>Weight (%)</th>
            <th>Target Month</th>
            <th>Est. Calendar Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeClp.map(m => {
            const isEditing = editingId === m.id;
            const targetMonth = Math.max(1, Math.round(m.time * inputs.possessionDue));
            const estDate = new Date(today.getFullYear(), today.getMonth() + targetMonth, 1);
            const dateStr = estDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            return (
              <tr key={m.id}>
                <td style={{ textAlign: 'left' }}>
                  {isEditing ? (
                    <input type="text" value={m.name} onChange={(e) => handleChange(m.id, 'name', e.target.value)} style={{ width: '100%', padding: '4px', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--surface-border)' }} />
                  ) : (
                    m.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input type="number" step="0.01" value={m.time} onChange={(e) => handleChange(m.id, 'time', parseFloat(e.target.value))} style={{ width: '80px', padding: '4px', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--surface-border)' }} />
                  ) : (
                    m.time.toFixed(3)
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input type="number" step="1" value={m.weight} onChange={(e) => handleChange(m.id, 'weight', parseFloat(e.target.value))} style={{ width: '60px', padding: '4px', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--surface-border)' }} />
                  ) : (
                    m.weight
                  )}
                </td>
                <td style={{ color: 'var(--accent-buy)' }}>Month {targetMonth}</td>
                <td style={{ color: 'var(--success)' }}>{dateStr}</td>
                <td>
                  {isEditing ? (
                    <button onClick={() => setEditingId(null)} style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                  ) : (
                    <button onClick={() => setEditingId(m.id)} style={{ background: 'transparent', color: 'var(--accent-buy)', border: '1px solid var(--accent-buy)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Weight:</td>
            <td style={{ fontWeight: 'bold', color: totalWeight === 90 ? 'var(--success)' : 'var(--accent-rent)' }}>{totalWeight}</td>
            <td colSpan="3"></td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}
