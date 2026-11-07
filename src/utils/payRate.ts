export interface PayRateInfo {
  label: 'Excellent' | 'Good' | 'Fair' | 'Standard';
  color: string; // Tailwind bg, text, border classes
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  rateValue: number; // calculated pay per mile or score
}

export function calculatePayRate(estimatedPay: number, estimatedDistance: number): PayRateInfo {
  const distance = estimatedDistance > 0 ? estimatedDistance : 1.5; // fallback
  const payPerMile = estimatedPay / distance;

  if (payPerMile >= 3.5) {
    return {
      label: 'Excellent',
      color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      textColor: 'text-emerald-500 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/20',
      icon: '✨',
      rateValue: payPerMile,
    };
  } else if (payPerMile >= 2.3) {
    return {
      label: 'Good',
      color: 'bg-teal-500/15 text-teal-500 border-teal-500/30',
      textColor: 'text-teal-500 dark:text-teal-400',
      badgeBg: 'bg-teal-500/10',
      badgeBorder: 'border-teal-500/20',
      icon: '👍',
      rateValue: payPerMile,
    };
  } else if (payPerMile >= 1.4) {
    return {
      label: 'Fair',
      color: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      textColor: 'text-amber-500 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/20',
      icon: '⚖️',
      rateValue: payPerMile,
    };
  } else {
    return {
      label: 'Standard',
      color: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      textColor: 'text-blue-500 dark:text-blue-400',
      badgeBg: 'bg-blue-500/10',
      badgeBorder: 'border-blue-500/20',
      icon: '💼',
      rateValue: payPerMile,
    };
  }
}
