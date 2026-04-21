export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600'); // cache 1h no Vercel

  try {
    // API pública do Banco Central do Brasil — cotação USD/BRL
    const hoje = new Date();
    // Tentar os últimos 5 dias úteis (fins de semana não têm cotação)
    for (let i = 1; i <= 5; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      const dataStr = `${mm}-${dd}-${yyyy}`;

      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataStr}'&$top=1&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao`;

      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();

      if (data.value && data.value.length > 0) {
        const cotacao = data.value[data.value.length - 1];
        const medio = (cotacao.cotacaoCompra + cotacao.cotacaoVenda) / 2;
        return res.status(200).json({
          compra: cotacao.cotacaoCompra,
          venda: cotacao.cotacaoVenda,
          medio: Math.round(medio * 10000) / 10000,
          data: cotacao.dataHoraCotacao,
          fonte: 'Banco Central do Brasil'
        });
      }
    }

    // Fallback se BCB não responder
    return res.status(200).json({
      compra: 4.98,
      venda: 5.00,
      medio: 4.99,
      data: new Date().toISOString(),
      fonte: 'fallback',
      aviso: 'Não foi possível buscar cotação em tempo real'
    });

  } catch (err) {
    return res.status(200).json({
      compra: 4.98,
      venda: 5.00,
      medio: 4.99,
      data: new Date().toISOString(),
      fonte: 'fallback',
      erro: err.message
    });
  }
}
