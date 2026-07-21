const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

export class ConfiguracionCorreoError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ConfiguracionCorreoError";
    this.statusCode = 503;
  }
}

class EmailService {
  async enviar({ para, asunto, texto }) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      if (process.env.NODE_ENV === "production") {
        throw new ConfiguracionCorreoError("El envío de correos todavía no está configurado. Contactá al administrador.");
      }
      console.info(`[correo de desarrollo] Para: ${para}\nAsunto: ${asunto}\n${texto}`);
      return;
    }
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [para], subject: asunto, text: texto })
    });
    if (!respuesta.ok) throw new ConfiguracionCorreoError("No se pudo enviar el correo de invitación. Intentá nuevamente.");
  }

  enlace(ruta, token) { return `${FRONTEND_URL}${ruta}?token=${encodeURIComponent(token)}`; }
}

export default new EmailService();
