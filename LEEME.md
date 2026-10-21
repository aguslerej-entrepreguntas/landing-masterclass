# Landing "De la corpo a la consultoría"

- `index.html`: la landing con el formulario.
- `gracias.html`: la página que ve la persona después de registrarse.
- `api/registro.js`: guarda el contacto en Resend y manda el mail de confirmación.
- `api/whatsapp.js`: manda al grupo de WhatsApp cargado en `WHATSAPP_LINK`.

## Variables en Vercel

| Variable | Qué va |
|---|---|
| `RESEND_API_KEY` | La API key de Resend (empieza con `re_`) |
| `EMAIL_FROM` | Quién envía, por ejemplo: `Agustín de Entrepreguntas <hola@entrepreguntas.com>` |
| `WHATSAPP_LINK` | El link de invitación del grupo (`https://chat.whatsapp.com/...`) |
| `RESEND_AUDIENCE_ID` | Opcional: el ID de la lista de Resend. Si no lo cargás, los contactos quedan en Contacts igual. |

Si cambiás una variable, hacé Redeploy para que se aplique.
