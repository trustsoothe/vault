import React from 'react';
import TextField from '@mui/material/TextField';
import { Controller, Control, Path, RegisterOptions } from 'react-hook-form';
import {TransactionFormValues} from "./BaseTransaction";

interface ControlledNumberInputProps {
  name: Path<TransactionFormValues>;
  control: Control<TransactionFormValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'outlined' | 'standard' | 'filled';
  size?: 'small' | 'medium';
  minValue?: number;
  maxValue?: number;
  step?: number;
  required?: boolean;
  helperText?: string;
  rules?: Omit<RegisterOptions<TransactionFormValues, Path<TransactionFormValues>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'pattern'>;
  onChange?: (value: number | null) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  InputProps?: React.ComponentProps<typeof TextField>['InputProps'];
  sx?: React.ComponentProps<typeof TextField>['sx'];
}

function ControlledNumberInput({
                                 name,
                                 control,
                                 label,
                                 placeholder,
                                 disabled = false,
                                 fullWidth = true,
                                 variant = 'outlined',
                                 size = 'small',
                                 minValue,
                                 maxValue,
                                 step,
                                 required = false,
                                 helperText,
                                 rules = {},
                                 onChange,
                                 inputProps = {},
                                 InputProps,
                                 sx,
                               }: ControlledNumberInputProps) {
  const validationRules = {
    ...rules,
    valueAsNumber: true,
  } as RegisterOptions<TransactionFormValues, Path<TransactionFormValues>>;

  if (required && !rules.required) {
    validationRules.required = 'This field is required';
  }

  if (minValue !== undefined && !rules.min) {
    validationRules.min = {
      value: minValue,
      message: `Minimum value is ${minValue}`
    };
  }

  if (maxValue !== undefined && !rules.max) {
    validationRules.max = {
      value: maxValue,
      message: `Maximum value is ${maxValue}`
    };
  }

  const hideSpinnerStyle = {
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
    '& input[type=number]': {
      '-moz-appearance': 'textfield',
    },
  };

  const mergedSx = {
    ...hideSpinnerStyle,
    ...(sx || {}),
  };

  const combinedInputProps = {
    min: minValue,
    max: maxValue,
    step: step,
    ...inputProps,
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={validationRules}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value === null || field.value === undefined ? '' : field.value}
          onChange={(e) => {
            const rawValue = e.target.value;
            const numValue = rawValue === '' ? null : Number(rawValue);

            field.onChange(numValue);
            onChange?.(numValue);
          }}
          type="number"
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          fullWidth={fullWidth}
          variant={variant}
          size={size}
          error={!!error}
          helperText={error ? error.message : helperText}
          inputProps={combinedInputProps}
          InputProps={InputProps}
          sx={mergedSx}
        />
      )}
    />
  );
}

export default ControlledNumberInput;
