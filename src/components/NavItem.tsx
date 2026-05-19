// NavItem component
import React from 'react';

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: 'accent' | 'warning' | 'secondary' | 'blue';
}

export const NavItem = React.memo(
  ({ icon, label, active = false, onClick, color = 'accent' }: NavItemProps) => {
    const colorClasses =
      color === 'warning'
        ? 'bg-cyber-warning/15 text-cyber-warning'
        : color === 'secondary' || color === 'blue'
          ? 'bg-cyber-elevated text-cyber-text'
          : 'bg-cyber-elevated text-cyber-text';
    return (
      <div
        className={`flex items-center gap-3 p-2 cursor-pointer transition-colors rounded-lg font-medium ${
          active
            ? colorClasses
            : 'hover:bg-cyber-elevated/50 text-cyber-text-secondary hover:text-cyber-text'
        }`}
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </div>
    );
  }
);
