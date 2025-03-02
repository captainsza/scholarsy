// If you have a common FilterDropdown component, ensure all options have non-empty values:

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";

interface FilterOption {
  id?: string | number;
  value?: string;
  label?: string;
}

interface FilterDropdownProps {
  options: FilterOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function FilterDropdown({ options, value, onChange, placeholder }: FilterDropdownProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_all">All {placeholder}</SelectItem> {/* Changed from empty string */}
        {options.map((option) => (
          <SelectItem 
            key={typeof option === 'object' ? (option.id || option.value) : option} 
            value={typeof option === 'object' ? (option.value || "_undefined") : option} // Ensure non-empty value
          >
            {typeof option === 'object' ? option.label : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
