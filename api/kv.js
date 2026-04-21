export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Upstash não configurado. Verifique as variáveis de ambiente no Vercel.' });
  }

  const upstash = async (cmd) => {
    const r = await fetch(`${url}/${cmd.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return r.json();
  };

  try {
    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key obrigatório' });
      const result = await upstash(['GET', key]);
      const value = result.result ? JSON.parse(result.result) : null;
      return res.status(200).json({ value });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key || value === undefined) return res.status(400).json({ error: 'key e value obrigatórios' });
      await upstash(['SET', key, JSON.stringify(value)]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
