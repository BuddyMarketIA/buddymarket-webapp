import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
const fromNumber = process.env.TWILIO_PHONE_NUMBER ?? "";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

/**
 * Envía un SMS con el código OTP al número de teléfono indicado.
 * @param to - Número de teléfono en formato E.164 (ej: +34612345678)
 * @param code - Código OTP de 6 dígitos
 */
export async function sendSMSOTP(to: string, code: string): Promise<void> {
  const body = `Tu código de verificación de BuddyOne es: ${code}\n\nExpira en 10 minutos. No lo compartas con nadie.`;
  await getClient().messages.create({
    body,
    from: fromNumber,
    to,
  });
}

/**
 * Normaliza un número de teléfono al formato E.164.
 * Si no tiene prefijo de país, asume +34 (España).
 */
export function normalizePhone(phone: string): string {
  // Eliminar espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-().]/g, "");
  // Si ya empieza con +, está en E.164
  if (cleaned.startsWith("+")) return cleaned;
  // Si empieza con 00, convertir a +
  if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
  // Si es un número español de 9 dígitos, añadir +34
  if (/^\d{9}$/.test(cleaned)) return "+34" + cleaned;
  // En cualquier otro caso, añadir + delante
  return "+" + cleaned;
}

/**
 * Valida que un número de teléfono en formato E.164 tenga una estructura básica válida.
 */
export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}
