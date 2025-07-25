import { useState, useRef } from "react";

export default function FaturaLTSL() {
  const [numeroFatura, setNumeroFatura] = useState("");
  const [valorFatura, setValorFatura] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [protestado, setProtestado] = useState("nao");
  const [dominio, setDominio] = useState("SBA");
  const [mensagem, setMensagem] = useState("");
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");
  const textareaRef = useRef(null);

  function calcularValorAtualizado() {
    const valor = parseFloat(valorFatura);
    const dataVencimento = new Date(vencimento);
    const dataPagamento = new Date(pagamento);

    if (
      isNaN(valor) ||
      isNaN(dataVencimento) ||
      isNaN(dataPagamento) ||
      !numeroFatura
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    let diasAtraso = Math.floor((dataPagamento - dataVencimento) / (1000 * 60 * 60 * 24));
    diasAtraso = diasAtraso > 0 ? diasAtraso : 0;

    const multa = valor * 0.05;
    const juros = (valor * 0.05 / 30) * diasAtraso;
    let valorAtualizado = valor + multa + juros;

    if (protestado === "sim") {
      valorAtualizado *= 1.05;
    }

    const valorFormatado = valorAtualizado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const vencimentoFormatado = dataVencimento.toLocaleDateString("pt-BR");

    const dadosBancarios = dominio === "SBA"
      ? `PIX: 30.527.869/0001-50\nOu\nBradesco\nAgência 6638\nConta 0089775-2\nCNPJ 30.527.869/0001-50`
      : `PIX: 15.053.254/0001-45\nOu\nTranspocred\nAgência 108\nConta 20351-3\nCNPJ 15.053.254/0001-45`;

    const msg = `Prezado cliente,\n\nVerificamos que a fatura nº ${numeroFatura}, com vencimento em ${vencimentoFormatado}, encontra-se em aberto até a presente data.\n\nInformamos que o valor atualizado para quitação é de ${valorFormatado}, já com a incidência de multa e juros conforme previsto contratualmente.\n\nSegue abaixo os dados bancários para pagamento:\n\n${dadosBancarios}\n\nCaso o pagamento já tenha sido realizado, por gentileza, desconsidere esta mensagem.\n\nAtenciosamente,\nDepartamento Financeiro – LTSL`;

    setMensagem(msg);
  }

  function gerarLinkWhatsApp() {
    if (!numeroWhatsApp || !mensagem) {
      alert("Informe o número do cliente e gere a mensagem antes de enviar.");
      return;
    }
    const numeroFormatado = numeroWhatsApp.replace(/\D/g, "");
    const texto = encodeURIComponent(mensagem);
    const link = `https://wa.me/55${numeroFormatado}?text=${texto}`;
    window.open(link, "_blank");
  }

  return (
    <div style={{
      maxWidth: 600,
      margin: "40px auto",
      padding: 20,
      background: "#fff",
      fontFamily: "sans-serif",
      borderRadius: 8,
      boxShadow: "0 0 10px #ccc"
    }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img
          src="https://i.imgur.com/sgO3fqf.png"
          alt="Logo LTSL"
          style={{ height: 80, marginBottom: 10 }}
        />
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Fatura LTSL</h1>
        <p style={{ color: "#666" }}>Preencha os dados abaixo para gerar a mensagem atualizada.</p>
      </div>

      <label>Número da Fatura</label>
      <input value={numeroFatura} onChange={(e) => setNumeroFatura(e.target.value)} style={estiloInput} />

      <label>Valor da Fatura (R$)</label>
      <input type="number" value={valorFatura} onChange={(e) => setValorFatura(e.target.value)} style={estiloInput} />

      <label>Data de Vencimento</label>
      <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} style={estiloInput} />

      <label>Data de Pagamento</label>
      <input type="date" value={pagamento} onChange={(e) => setPagamento(e.target.value)} style={estiloInput} />

      <label>Protestado?</label>
      <select value={protestado} onChange={(e) => setProtestado(e.target.value)} style={estiloInput}>
        <option value="nao">Não</option>
        <option value="sim">Sim</option>
      </select>

      <label>Domínio</label>
      <select value={dominio} onChange={(e) => setDominio(e.target.value)} style={estiloInput}>
        <option value="SBA">SBA</option>
        <option value="SLU">SLU</option>
      </select>

      <button onClick={calcularValorAtualizado} style={estiloBotao}>Calcular e Gerar Mensagem</button>

      {mensagem && (
        <>
          <label style={{ marginTop: 20, display: "block" }}>Mensagem para o cliente:</label>
          <textarea
            ref={textareaRef}
            value={mensagem}
            rows={10}
            readOnly
            style={{ ...estiloInput, height: 200 }}
          />

          <label>Número do WhatsApp (somente números, com DDD)</label>
          <input
            value={numeroWhatsApp}
            onChange={(e) => setNumeroWhatsApp(e.target.value)}
            placeholder="Ex: 41999998888"
            style={estiloInput}
          />

          <button onClick={gerarLinkWhatsApp} style={estiloBotaoVerde}>Enviar via WhatsApp</button>
        </>
      )}
    </div>
  );
}

const estiloInput = {
  width: "100%",
  padding: 10,
  margin: "8px 0 16px 0",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};

const estiloBotao = {
  width: "100%",
  padding: 12,
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 10
};

const estiloBotaoVerde = {
  ...estiloBotao,
  backgroundColor: "#25D366", // Cor do WhatsApp
  marginTop: 10,
};
