import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

// Fix: Converting JSX to React.createElement because TypeScript does not support JSX syntax in .ts files.
// This resolves "Cannot find name 'div'", "Operator '<' cannot be applied", and associated shorthand property errors.
export const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  icon, 
  colorClass = "text-indigo-600" 
}) => (
  React.createElement(
    "div",
    { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.02]" },
    React.createElement(
      "div",
      { className: `p-3 rounded-xl bg-slate-50 ${colorClass}` },
      icon
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        { className: "text-sm font-medium text-slate-500 uppercase tracking-wider" },
        label
      ),
      React.createElement(
        "h3",
        { className: "text-2xl font-bold text-slate-900" },
        value
      )
    )
  )
);
