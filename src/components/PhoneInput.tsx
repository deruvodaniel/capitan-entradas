"use client";

import { PhoneInput as ReactPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function PhoneInput({ value, onChange, className }: PhoneInputProps) {
  return (
    <ReactPhoneInput
      defaultCountry="ar"
      value={value}
      onChange={onChange}
      inputClassName={className}
      inputStyle={{
        width: "100%",
        height: "48px",
        fontSize: "16px",
        backgroundColor: "var(--color-card)",
        color: "var(--color-foreground)",
        border: "1px solid var(--color-card-border)",
        borderRadius: "0 8px 8px 0",
        paddingLeft: "12px",
      }}
      countrySelectorStyleProps={{
        buttonStyle: {
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-card-border)",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          height: "48px",
          paddingLeft: "12px",
          paddingRight: "8px",
        },
      }}
    />
  );
}
