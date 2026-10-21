// Redirige al grupo de WhatsApp configurado en la variable WHATSAPP_LINK.
// Así, para cambiar el grupo solo hay que cambiar la variable en Vercel.
module.exports = (req, res) => {
  const link = process.env.WHATSAPP_LINK;
  if (!link) {
    res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('El link del grupo todavía no está cargado. Volvé a intentar en un rato.');
    return;
  }
  res.writeHead(302, { Location: link });
  res.end();
};
