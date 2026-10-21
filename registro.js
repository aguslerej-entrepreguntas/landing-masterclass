api/
// Recibe el formulario de la landing: guarda el contacto en Resend
// y le manda el mail de confirmación.
const RESEND = 'https://api.resend.com';
const ASUNTO = 'Tu lugar en la clase: De la corpo a la consultoría';
const FIRMA = 'Agustín, de Entrepreguntas';

function escapar(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function mailHtml(nombre, whatsapp) {
  const boton = whatsapp
    ? `<p style="margin:28px 0;"><a href="${escapar(whatsapp)}" style="display:inline-block;padding:14px 24px;background:#2E3BEA;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">Unirme al grupo de WhatsApp</a></p>`
    : '';
  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#F7F7F4;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#17181C;">
    <p style="margin:0 0 28px;font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:22px;letter-spacing:-0.5px;color:#17181C;">entrepreguntas<span style="color:#FF6A2B;">.</span></p>
    <p style="margin:0 0 16px;">Hola ${escapar(nombre)},</p>
    <p style="margin:0 0 16px;">Ya tenés tu lugar en la clase en vivo <strong style="color:#17181C;">De la corpo a la consultoría: cómo convertir tu experiencia en un negocio de consultoría sin ser influencer</strong>.</p>
    <p style="margin:0 0 16px;">La fecha y el link de Zoom los vamos a compartir en el grupo de WhatsApp de la clase. Si todavía no te sumaste, entrá desde acá:</p>
    ${boton}
    <p style="margin:0 0 4px;">Nos vemos,</p>
    <p style="margin:0;">${FIRMA}</p>
  </div></body></html>`;
}

function mailTexto(nombre, whatsapp) {
  return [
    `Hola ${nombre},`,
    '',
    'Ya tenés tu lugar en la clase en vivo "De la corpo a la consultoría: cómo convertir tu experiencia en un negocio de consultoría sin ser influencer".',
    '',
    'La fecha y el link de Zoom los vamos a compartir en el grupo de WhatsApp de la clase.' + (whatsapp ? ` Si todavía no te sumaste, entrá desde acá: ${whatsapp}` : ''),
    '',
    'Nos vemos,',
    FIRMA,
  ].join('\n');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Método no permitido.' });
    return;
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  // Campo trampa: si un robot lo completa, respondemos ok y no hacemos nada.
  if (body.empresa) {
    res.status(200).json({ ok: true });
    return;
  }

  const nombre = String(body.nombre || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 160);

  if (!nombre) {
    res.status(400).json({ ok: false, error: 'Escribí tu nombre.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ ok: false, error: 'Revisá el email: parece que le falta algo.' });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const audiencia = process.env.RESEND_AUDIENCE_ID;
  // El mail siempre apunta a /grupo, que redirige al grupo vigente.
  // Así, aunque cambies de grupo, los mails viejos llevan al grupo nuevo.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const whatsapp = process.env.WHATSAPP_LINK && host ? `https://${host}/grupo` : '';

  if (!key || !from) {
    console.error('Faltan variables: RESEND_API_KEY o EMAIL_FROM');
    res.status(500).json({ ok: false, error: 'El registro todavía no está configurado. Probá más tarde.' });
    return;
  }

  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  let guardado = false;
  let enviado = false;

  // 1. Guardar el contacto en la lista de Resend
  try {
    const url = audiencia ? `${RESEND}/audiences/${audiencia}/contacts` : `${RESEND}/contacts`;
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, first_name: nombre, unsubscribed: false }),
    });
    if (r.ok) guardado = true;
    else {
      const detalle = await r.text();
      // Si ya estaba registrado, lo tomamos como guardado
      if (r.status === 409 || /already exists/i.test(detalle)) guardado = true;
      else console.error('Error al guardar contacto', r.status, detalle);
    }
  } catch (e) {
    console.error('Error al guardar contacto', e);
  }

  // 2. Mandar el mail de confirmación
  try {
    const r = await fetch(`${RESEND}/emails`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from,
        to: [email],
        subject: ASUNTO,
        html: mailHtml(nombre, whatsapp),
        text: mailTexto(nombre, whatsapp),
      }),
    });
    if (r.ok) enviado = true;
    else console.error('Error al enviar mail', r.status, await r.text());
  } catch (e) {
    console.error('Error al enviar mail', e);
  }

  if (!guardado && !enviado) {
    res.status(502).json({ ok: false, error: 'No pudimos reservar tu lugar. Probá de nuevo en un minuto.' });
    return;
  }
  res.status(200).json({ ok: true });
};
