// App completo com login, painel filtrado e cálculo de fatura atualizado com envio via WhatsApp

"use client";

import { useState } from "react";
import faturas from "../data/faturas_ltsl_filtradas.json";

export default function AppFaturasLTSL() {
  const [usuario, setUsuario] = useState("");
  const [logado, setLogado] = useState(false);
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [pagamento, setPagamento] = useState("");
  const [protestado, setProtestado] = useState("nao");
  const [dominio, setDominio] = useState("SBA");
  const [mensagem, setMensagem] = useState("");
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");

  const handleLogin = () => {
    if (!usuario) return alert("Informe seu nome");
    setLogado(true);
  };

  const faturasFiltradas = usuario.toUpperCase() === "VIVIAN MAGALHAES"
    ? faturas
    : faturas.filter(f => f.Vendedor.toUpperCase() === usuario.toUpperCase());

  const calcularValorAtualizado = () => {
    if (!faturaSelecionada || !pagamento) {
      alert("Informe a data de pagamento e selecione uma fatura.");
      return;
    }
    const valor = parseFloat(faturaSelecionada.Saldo);
    const dataVencimento = new Date(faturaSelecionada.Vencimento);
    const dataPagamento = new Date(pagamento);
    let diasAtraso = Math.floor((dataPagamento - dataVencimento) / (1000 * 60 * 60 * 24));
    diasAtraso = diasAtraso > 0 ? diasAtraso : 0;

    const multa = valor * 0.05;
    const juros = (valor * 0.05 / 30) * diasAtraso;
    let valorAtualizado = valor + multa + juros;
    if (protestado === "sim") valorAtualizado *= 1.05;

    const valorFormatado = valorAtualizado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const vencFormatado = new Date(faturaSelecionada.Vencimento).toLocaleDateString("pt-BR");

    const dadosBancarios = dominio === "SBA"
      ? `PIX: 30.527.869/0001-50\nOu\nBradesco\nAgência 6638\nConta 0089775-2\nCNPJ 30.527.869/0001-50`
      : `PIX: 15.053.254/0001-45\nOu\nTranspocred\nAgência 108\nConta 20351-3\nCNPJ 15.053.254/0001-45`;

    const msg = `Prezado cliente,\n\nVerificamos que a fatura nº ${faturaSelecionada.Fatura}, com vencimento em ${vencFormatado}, encontra-se em aberto até a presente data.\n\nInformamos que o valor atualizado para quitação é de ${valorFormatado}, já com a incidência de multa e juros conforme previsto contratualmente.\n\nSegue abaixo os dados bancários para pagamento:\n\n${dadosBancarios}\n\nCaso o pagamento já tenha sido realizado, por gentileza, desconsidere esta mensagem.\n\nAtenciosamente,\nDepartamento Financeiro – LTSL`;

    setMensagem(msg);
  };

  const enviarWhatsApp = () => {
    if (!numeroWhatsApp || !mensagem) return alert("Informe o número e gere a mensagem.");
    const numero = numeroWhatsApp.replace(/\D/g, "");
    const texto = encodeURIComponent(mensagem);
    window.open(`https://wa.me/55${numero}?text=${texto}`, "_blank");
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      {!logado ? (
        <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
          <h2>Login LTSL</h2>
          <input
            placeholder="Digite seu nome"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: 16 }}
          />
          <button onClick={handleLogin} style={{ marginTop: 12, padding: 10, width: "100%", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4 }}>
            Entrar
          </button>
        </div>
      ) : (
        <div>
          <h2>Faturas - {usuario}</h2>
          {faturaSelecionada ? (
            <div style={{ background: "#f9f9f9", padding: 16, marginBottom: 24, borderRadius: 8 }}>
              <h3>Fatura: {faturaSelecionada.Fatura}</h3>
              <p>Cliente: {faturaSelecionada.Cliente}</p>
              <p>Valor original: R$ {parseFloat(faturaSelecionada.Saldo).toFixed(2)}</p>
              <p>Vencimento: {new Date(faturaSelecionada.Vencimento).toLocaleDateString("pt-BR")}</p>

              <label>Data de Pagamento:</label>
              <input type="date" value={pagamento} onChange={(e) => setPagamento(e.target.value)} style={inputStyle} />

              <label>Protestado?</label>
              <select value={protestado} onChange={(e) => setProtestado(e.target.value)} style={inputStyle}>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>

              <label>Domínio:</label>
              <select value={dominio} onChange={(e) => setDominio(e.target.value)} style={inputStyle}>
                <option value="SBA">SBA</option>
                <option value="SLU">SLU</option>
              </select>

              <button onClick={calcularValorAtualizado} style={botao}>Gerar Mensagem</button>

              {mensagem && (
                <>
                  <label style={{ marginTop: 20 }}>Número WhatsApp (com DDD):</label>
                  <input
                    value={numeroWhatsApp}
                    onChange={(e) => setNumeroWhatsApp(e.target.value)}
                    placeholder="Ex: 41999998888"
                    style={inputStyle}
                  />
                  <textarea readOnly value={mensagem} style={{ ...inputStyle, height: 160 }} />
                  <button onClick={enviarWhatsApp} style={{ ...botao, backgroundColor: "#25D366" }}>Enviar via WhatsApp</button>
                </>
              )}
            </div>
          ) : null}

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <th style={th}>Cliente</th>
                <th style={th}>CNPJ</th>
                <th style={th}>Fatura</th>
                <th style={th}>Vencimento</th>
                <th style={th}>Valor</th>
                <th style={th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {faturasFiltradas.map((f, i) => (
                <tr key={i}>
                  <td style={td}>{f.Cliente}</td>
                  <td style={td}>{f.CNPJ}</td>
                  <td style={td}>{f.Fatura}</td>
                  <td style={td}>{new Date(f.Vencimento).toLocaleDateString("pt-BR")}</td>
                  <td style={td}>R$ {parseFloat(f.Saldo).toFixed(2)}</td>
                  <td style={td}>
                    <button
                      style={{ padding: "4px 8px", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4 }}
                      onClick={() => {
                        setFaturaSelecionada(f);
                        setMensagem("");
                      }}
                    >Calcular</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 8,
  margin: "8px 0",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};

const botao = {
  width: "100%",
  padding: 10,
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontWeight: "bold",
  marginTop: 10,
};

const th = { border: "1px solid #ccc", padding: 8, background: "#f0f0f0" };
const td = { border: "1px solid #ccc", padding: 8 };
