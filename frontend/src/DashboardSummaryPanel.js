import React from 'react';
import './Dashboard.css';

export default function DashboardSummaryPanel() {
  return (
    <div className="compinfo-center-panel">
      <div className="dashboard-summary-grid">
        {/* Table 1: Today's Collection Summary */}
        <div className="dashboard-summary-card dashboard-summary-pie">
          <div className="dashboard-summary-header">Today's Collection Summary</div>
          <div className="dashboard-summary-content">
            {/* Pie chart placeholder */}
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="#fff" />
              <path d="M60,60 L60,10 A50,50 0 0,1 110,60 Z" fill="#8bc34a" />
              <path d="M60,60 L110,60 A50,50 0 0,1 60,110 Z" fill="#ffd54f" />
              <path d="M60,60 L60,110 A50,50 0 0,1 10,60 Z" fill="#f8bbd0" />
              <path d="M60,60 L10,60 A50,50 0 0,1 60,10 Z" fill="#fff" />
              <text x="30" y="45" fontSize="12" fill="#444">40% Cash</text>
              <text x="80" y="45" fontSize="12" fill="#444">28% Credit Card</text>
              <text x="40" y="90" fontSize="12" fill="#444">32% Company</text>
              <text x="25" y="65" fontSize="11" fill="#444">46,200.00</text>
              <text x="80" y="65" fontSize="11" fill="#444">22,000.00</text>
              <text x="55" y="110" fontSize="11" fill="#444">28,000.00</text>
            </svg>
          </div>
          <div className="dashboard-summary-footer" />
        </div>
        {/* Table 2: Men Type Sale */}
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-header">Meny Type Sale</div>
          <div className="dashboard-summary-content dashboard-summary-bar">
            <div className="dashboard-bar" style={{height:'60px',background:'#3f51b5'}} />
            <div className="dashboard-bar" style={{height:'40px',background:'#8bc34a'}} />
            <div className="dashboard-bar" style={{height:'35px',background:'#f8bbd0'}} />
            <div className="dashboard-bar" style={{height:'20px',background:'#ffd54f'}} />
          </div>
          <div className="dashboard-summary-labels">
            <span>Food</span><span>Liq</span><span>Soft</span><span>Tob</span>
          </div>
        </div>
        {/* Table 3: Weekly Collection Summary */}
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-header">Weekly Collection Summary</div>
          <div className="dashboard-summary-content dashboard-summary-bar dashboard-summary-bar-weekly">
            <div className="dashboard-bar" style={{height:'40px',background:'#90caf9'}} />
            <div className="dashboard-bar" style={{height:'55px',background:'#f48fb1'}} />
            <div className="dashboard-bar" style={{height:'35px',background:'#9575cd'}} />
            <div className="dashboard-bar" style={{height:'60px',background:'#ffb74d'}} />
            <div className="dashboard-bar" style={{height:'45px',background:'#a1887f'}} />
          </div>
          <div className="dashboard-summary-labels">
            <span>01/12</span><span>02/12</span><span>03/12</span><span>04/12</span><span>05/12</span>
          </div>
        </div>
        {/* Table 4: Session Summary */}
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-header">Session Summary</div>
          <div className="dashboard-summary-content dashboard-summary-bar dashboard-summary-bar-session">
            <div className="dashboard-bar" style={{height:'35px',background:'#ffd54f'}} />
            <div className="dashboard-bar" style={{height:'55px',background:'#8bc34a'}} />
            <div className="dashboard-bar" style={{height:'45px',background:'#fff'}} />
          </div>
          <div className="dashboard-summary-labels">
            <span>BF</span><span>Lunch</span><span>Dinner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
