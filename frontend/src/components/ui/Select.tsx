import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, fullWidth = true, className, options, placeholder, ...props }, ref) => {
    return (
      <div className={clsx('input-wrapper', fullWidth && 'w-full', className)}>
        {label && <label className="input-label">{label}</label>}
        <select
          ref={ref}
          className={clsx('input-field', error && 'input-error')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="input-error-message">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
