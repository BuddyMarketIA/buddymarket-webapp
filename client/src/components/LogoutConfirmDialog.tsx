import { useTranslation } from "react-i18next";

interface LogoutConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export default function LogoutConfirmDialog({
  open,
  onConfirm,
  onCancel,
  isPending = false,
}: LogoutConfirmDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 99998,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          background: "white",
          borderRadius: "20px",
          padding: "28px 28px 24px",
          width: "min(340px, calc(100vw - 32px))",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "rgba(239,68,68,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "4px",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="logout-dialog-title"
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 800,
            color: "#111827",
            letterSpacing: "-0.02em",
          }}
        >
          {t("auth.logoutConfirmTitle", "¿Cerrar sesión?")}
        </h2>

        {/* Body */}
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {t(
            "auth.logoutConfirmBody",
            "Volverás a la pantalla de inicio. Puedes volver a entrar cuando quieras."
          )}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            width: "100%",
            marginTop: "4px",
          }}
        >
          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: "12px",
              border: "1.5px solid #e5e7eb",
              background: "white",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {t("common.cancel", "Cancelar")}
          </button>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: "12px",
              border: "none",
              background: isPending
                ? "rgba(239,68,68,0.5)"
                : "linear-gradient(135deg, #EF4444, #DC2626)",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              boxShadow: isPending ? "none" : "0 4px 12px rgba(239,68,68,0.3)",
            }}
          >
            {isPending
              ? t("sidebar.loggingOut", "Cerrando...")
              : t("sidebar.logout", "Cerrar sesión")}
          </button>
        </div>
      </div>
    </>
  );
}
