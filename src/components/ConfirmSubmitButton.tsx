"use client";

/**
 * Botón de submit que pide confirmación antes de enviar el form.
 * Pensado para acciones destructivas dentro de Server Components.
 */
export default function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
