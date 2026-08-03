const clean = (value) => String(value ?? '').trim();

export const sendContactNotification = async (inquiry) => {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const recipient = clean(process.env.CONTACT_NOTIFICATION_EMAIL);
  const from = clean(process.env.RESEND_FROM_EMAIL);

  if (!apiKey || !recipient || !from) {
    return { sent: false, reason: 'not-configured' };
  }

  const details = [
    `Nombre: ${inquiry.name}`,
    inquiry.organization ? `Organización: ${inquiry.organization}` : '',
    `Correo: ${inquiry.email}`,
    inquiry.phone ? `Teléfono: ${inquiry.phone}` : '',
    inquiry.eventType ? `Tipo de evento: ${inquiry.eventType}` : '',
    inquiry.eventDate ? `Fecha: ${inquiry.eventDate}` : '',
    inquiry.location ? `Lugar: ${inquiry.location}` : '',
    inquiry.duration ? `Duración: ${inquiry.duration}` : '',
    inquiry.requiresAudio ? `Audio: ${inquiry.requiresAudio}` : '',
    '',
    inquiry.message,
  ].filter((line) => line !== '').join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: inquiry.email,
        subject: `Nueva contratación: ${inquiry.name}`,
        text: details,
      }),
    });

    if (!response.ok) return { sent: false, reason: 'provider-error' };
    return { sent: true, reason: '' };
  } catch {
    return { sent: false, reason: 'network-error' };
  }
};
