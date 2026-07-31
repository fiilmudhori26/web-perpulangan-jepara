import { useState, useCallback } from 'react';

function formatRupiahDisplay(value) {
  if (!value || value === '') return '';
  // Hapus semua non-digit
  const num = value.toString().replace(/\D/g, '');
  if (!num) return '';
  const formatted = parseInt(num, 10).toLocaleString('id-ID');
  return formatted;
}

/** 
 * Input khusus nominal rupiah. 
 * - User ngetik angka, otomatis dikasih titik (1.500.000)
 * - onChange dapet raw number (1500000)
 * - Props: value (number), onChange (fn), className, placeholder, required, disabled
 */
export default function RupiahInput({ value, onChange, className = '', placeholder = 'Rp 0', required, disabled }) {
  const [display, setDisplay] = useState(() => value ? formatRupiahDisplay(String(value)) : '');

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setDisplay(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
    onChange(num);
  }, [onChange]);

  // Sync from outside (form reset)
  // Kita override display jika value berubah dari luar
  // Pakai effect sederhana via key atau langsung

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 pointer-events-none">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full pl-9 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition bg-stone-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
