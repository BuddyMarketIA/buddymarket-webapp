import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={16}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--width": "360px",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          borderRadius: "14px",
          fontSize: "15px",
          fontWeight: 600,
          padding: "14px 18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
