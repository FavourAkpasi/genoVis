import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

interface BaseProps {
  /** Option values. */
  items: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible label for the control. */
  label?: string;
  /** How many chips to show before collapsing the rest into "+N" (multiple mode). */
  maxVisibleChips?: number;
}

type CustomSelectProps =
  | (BaseProps & { multiple: true; value: string[]; onValueChange: (value: string[]) => void })
  | (BaseProps & { multiple?: false; value: string | null; onValueChange: (value: string | null) => void });

const Options = () => (
  <>
    <ComboboxEmpty>No results.</ComboboxEmpty>
    <ComboboxList>
      {(item: string) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </>
);

type MultiProps = BaseProps & { value: string[]; onValueChange: (value: string[]) => void };

const MultiSelect = ({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  label,
  maxVisibleChips = 2,
}: MultiProps) => {
  const anchorRef = useComboboxAnchor();
  const hasSelection = value.length > 0;

  return (
    <Combobox items={items} multiple value={value} onValueChange={onValueChange} disabled={disabled}>
      <ComboboxChips ref={anchorRef} className={cn('flex-nowrap overflow-hidden', className)} aria-label={label}>
        <ComboboxValue>
          {(selected: string[]) => (
            <>
              {selected.slice(0, maxVisibleChips).map((item) => (
                <ComboboxChip key={item} className="max-w-24">
                  <span className="max-w-24 truncate text-xs">{item}</span>
                </ComboboxChip>
              ))}
              {selected.length > maxVisibleChips && (
                <span className="flex h-[calc(--spacing(5.5))] shrink-0 items-center rounded bg-muted text-xs font-medium text-muted-foreground">
                  +{selected.length - maxVisibleChips}
                </span>
              )}
            </>
          )}
        </ComboboxValue>
        <ComboboxChipsInput placeholder={hasSelection ? '' : placeholder} />
        {hasSelection ? <ComboboxClear /> : <ComboboxTrigger />}
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
};

type SingleProps = BaseProps & { value: string | null; onValueChange: (value: string | null) => void };

const SingleSelect = ({ items, value, onValueChange, placeholder, disabled, className, label }: SingleProps) => {
  const hasSelection = value != null && value !== '';

  return (
    <Combobox items={items} value={value} onValueChange={onValueChange} disabled={disabled}>
      <ComboboxInput
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        showClear={hasSelection}
        showTrigger={!hasSelection}
        aria-label={label}
      />
      <ComboboxContent>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
};

export const CustomSelect = (props: CustomSelectProps) => {
  if (props.multiple) return <MultiSelect {...props} />;
  return <SingleSelect {...props} />;
};

export default CustomSelect;
