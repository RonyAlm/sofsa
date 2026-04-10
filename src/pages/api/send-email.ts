import { Resend } from 'resend';

const requests = new Map();

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export async function POST({ request, clientAddress } : any) {

    const ip = clientAddress || "unknown";

    const now = Date.now();
    const lastRequest = requests.get(ip) || 0;

    if (now - lastRequest < 10000) {
        return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes" }),
        { status: 429 }
        );
    }

    requests.set(ip, now);

    const origin = request.headers.get('origin');

    if (origin !== import.meta.env.URL_FRONT) {
        return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
            status: 403,
        });
    }

  try {
    const body = await request.json();

    const { name, phone, subject, email, message } = body;

    if (!name || !phone || !subject || !email || !message) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (body.company) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const data = await resend.emails.send({
      from: import.meta.env.FROM_EMAIL, 
      to: import.meta.env.TO_EMAIL,
      subject: subject,
      html: `
        <h2>Nuevo contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${phone}</p>
        <p><strong>Mensaje:</strong> ${message}</p>
      `,
    });

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error : any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}