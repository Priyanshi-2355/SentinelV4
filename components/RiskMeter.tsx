
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const getStatusColors = () => {
    if (level === RiskLevel.LOW) return { text: 'text-emerald-500', stroke: '#10b981', bg: 'bg-emerald-500/10' };
    if (level === RiskLevel.MEDIUM) return { text: 'text-brand-orange', stroke: '#fca311', bg: 'bg-brand-orange/10' };
    return { text: 'text-rose-500', stroke: '#f43f5e', bg: 'bg-rose-500/10' };
  };

  const colors = getStatusColors();
  
  // Dashboard Arc Math (240 degree arc)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 240) / 360;
  const offset = arcLength - (arcLength * score) / 100;

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div className="relative w-64 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform rotate-[150deg] overflow-visible" viewBox="0 0 200 200">
          {/* Background Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#e5e5e5"
            strokeWidth="14"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          {/* Active Progress Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="14"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Score Indicator Tick */}
          <g transform={`rotate(${(score * 2.4)}, 100, 100)`}>
             <line x1="100" y1="12" x2="100" y2="28" stroke="white" strokeWidth="2" />
          </g>
        </svg>
        
        {/* Central Display */}
        <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black text-brand-black leading-none">{score}</span>
            <span className="text-brand-navy/30 font-black text-sm uppercase tracking-tighter">/100</span>
          </div>
          <span className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] text-brand-navy/30">Threat Index</span>
        </div>
      </div>

      {/* Level Badge */}
      <div className={`mt-2 flex items-center gap-3 px-6 py-3 rounded-2xl ${colors.bg} border border-brand-gray/50 transition-all duration-500 group cursor-default hover:scale-105`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${colors.text.replace('text-', 'bg-')}`}></div>
        <span className={`text-xs font-black uppercase tracking-[0.2em] ${colors.text}`}>
          {level}
        </span>
      </div>
    </div>
  );
};

export default RiskMeter;
