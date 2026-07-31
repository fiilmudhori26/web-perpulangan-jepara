import { CheckCircleIcon, XCircleIcon, ClockIcon, TruckIcon, HomeIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';

const variants = {
  lunas: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircleIcon,
  },
  'belum bayar': {
    bg: 'bg-red-50 border-red-200 text-red-600',
    icon: XCircleIcon,
  },
  dp: {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: ClockIcon,
  },
  'akan pulang': {
    bg: 'bg-teal-50 border-teal-200 text-teal-700',
    icon: TruckIcon,
  },
  'tidak pulang': {
    bg: 'bg-stone-50 border-stone-200 text-stone-600',
    icon: HomeIcon,
  },
  'pulang pergi': {
    bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    icon: TruckIcon,
  },
  'pulang ke rumah': {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: HomeIcon,
  },
  'pulang ke pondok': {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: HomeIcon,
  },
  aktif: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircleIcon,
  },
  default: {
    bg: 'bg-stone-50 border-stone-200 text-stone-600',
    icon: ExclamationCircleIcon,
  },
};

export default function Badge({ children, variant = 'default' }) {
  const config = variants[variant] || variants.default;
  const Icon = config.icon;

  return (
    <span className={`badge-enhanced ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {children}
    </span>
  );
}
