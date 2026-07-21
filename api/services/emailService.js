const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

class EmailService {
  async enviar({ para, asunto, texto }) {
    if (!process.env.RESEND_API_KEY) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("No hay proveedor de correo configurado");
      }
      console.info(`[correo de desarrollo] Para: ${para}\nAsunto: ${asunto}\n${texto}`);
      return;
    }
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [para], subject: asunto, text: texto })
    });
    if (!respuesta.ok) throw new Error("No se pudo enviar el correo");
  }

  enlace(ruta, token) { return `${FRONTEND_URL}${ruta}?token=${encodeURIComponent(token)}`; }
}

export default new EmailService();
