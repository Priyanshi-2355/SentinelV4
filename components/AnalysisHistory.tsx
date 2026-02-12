
import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';

interface AnalysisHistoryProps {
  history: AnalysisResult[];
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ history }) => {
  if (history.length === 0) return null;

  const getLevelBadge = (level: RiskLevel) => {
    if (level === RiskLevel.LOW) return 'bg-emerald-50 text-emerald-600';
    if (level === RiskLevel.MEDIUM) return 'bg-brand-orange/10 text-brand-orange';
    return 'bg-rose-50 text-rose-600';
  };

  return (
    <div className="mt-16 overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-xs font-black text-brand-black uppercase tracking-[0.3em]">Audit Log</h3>
        <div className="flex-grow h-px bg-brand-gray"></div>
      </div>
      <div className="bg-white rounded-[2rem] border border-brand-gray shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-navy text-white">
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Target URL</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-center">Threat Level</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Processed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray">
            {history.map((item, index) => (
              <tr key={index} className="hover:bg-brand-gray/30 transition-colors group">
                <td className="px-8 py-5">
                  <div className="font-mono text-xs text-brand-navy font-bold truncate max-w-md group-hover:text-brand-orange transition-colors">
                    {item.url}
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getLevelBadge(item.level)}`}>
                    {item.level.split(' ')[0]}
                  </span>
                </td>
                <td className="px-8 py-5 text-right text-[10px] font-bold text-brand-navy/40 tabular-nums">
                  {item.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalysisHistory;
