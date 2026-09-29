export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_EMAIL;

  if (!apiKey || !to) {
    return res.status(500).json({ ok: false, message: 'Konfigurasi email server belum lengkap.' });
  }

  try {
    const {
      orderNumber,
      category,
      service,
      target,
      quantity,
      price,
      total
    } = req.body || {};

    if (!orderNumber || !category || !service || !target || !quantity || !total) {
      return res.status(400).json({ ok: false, message: 'Data pesanan tidak lengkap.' });
    }

    const safe = (value) => String(value).replace(/[<>]/g, '');

    const subject = `Pesanan Baru — Vercel Followers — ${safe(orderNumber)}`;
    const text = [
      'Pesanan Baru — Vercel Followers',
      '',
      `Nomor Pesanan : ${safe(orderNumber)}`,
      `Kategori      : ${safe(category)}`,
      `Layanan       : ${safe(service)}`,
      `Link/Username : ${safe(target)}`,
      `Jumlah        : ${safe(quantity)}`,
      `Harga         : ${safe(price || '-')}`,
      `Total         : ${safe(total)}`,
      `Waktu         : ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })}`
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Pesanan Baru — Vercel Followers</h2>
        <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
          <tr><td><b>Nomor Pesanan</b></td><td>${safe(orderNumber)}</td></tr>
          <tr><td><b>Kategori</b></td><td>${safe(category)}</td></tr>
          <tr><td><b>Layanan</b></td><td>${safe(service)}</td></tr>
          <tr><td><b>Link/Username</b></td><td>${safe(target)}</td></tr>
          <tr><td><b>Jumlah</b></td><td>${safe(quantity)}</td></tr>
          <tr><td><b>Harga</b></td><td>${safe(price || '-')}</td></tr>
          <tr><td><b>Total</b></td><td><b>${safe(total)}</b></td></tr>
          <tr><td><b>Waktu</b></td><td>${safe(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }))}</td></tr>
        </table>
      </div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Vercel Followers <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        html
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(502).json({
        ok: false,
        message: data?.message || 'Resend gagal mengirim email.'
      });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (error) {
    console.error('send-order error:', error);
    return res.status(500).json({ ok: false, message: 'Terjadi kesalahan saat mengirim pesanan.' });
  }
}
