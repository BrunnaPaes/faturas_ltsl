"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AppFaturasLTSL() {
  const [usuario, setUsuario] = useState("");
  const [logado, setLogado] = useState(false);
  const [faturas, setFaturas] = useState([]);
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [pagamento, setPagamento] = useState("");
  const [protestado, setProtestado] = useState("nao");
  const [dominio, setDominio] = useState("SBA");
  const [mensagem, setMensagem] = useState("");
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  // Carrega faturas da public
  useEffect(() => {
    fetch("/faturas_ltsl_filtradas.json")
      .then(res => res.json())
      .then(data => setFaturas(data))
      .catch(() => alert("Erro ao carregar faturas!"));
  }, []);

  const nomesPermitidos = [
    "VIVIAN MAGALHAES",
    ...new Set(faturas.map(f => f.Vendedor?.toUpperCase()))
  ];

  const handleLogin = () => {
    if (!usuario) return alert("Informe seu nome");
    if (!nomesPermitidos.includes(usuario.toUpperCase())) {
      alert("Usuário sem permissão de acesso.");
      return;
    }
    setLogado(true);
  };

  const hoje = new Date();

  const faturasFiltradas = usuario.toUpperCase() === "VIVIAN MAGALHAES"
    ? faturas
    : faturas.filter(f => f.Vendedor?.toUpperCase() === usuario.toUpperCase());

  const faturasExibidas = faturasFiltradas.filter(f =>
    f.Cliente.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  // Novas colunas calculadas
  const calcularDiasAtraso = (venc) => {
    const vencimento = new Date(venc);
    const diff = Math.floor((hoje - vencimento) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const calcularStatus = (venc) => {
    return calcularDiasAtraso(venc) > 0 ? "ATRASADA" : "LIQUIDADA";
  };

  const calcularValorAtualizado = () => {
    if (!faturaSelecionada || !pagamento) {
      alert("Informe a data de pagamento e selecione uma fatura.");
      return;
    }
    const valor = parseFloat(
      String(faturaSelecionada.Saldo).replace(",", ".")
    ) || 0;
    const dataVencimento = new Date(faturaSelecionada.Vencimento);
    const dataPagamento = new Date(pagamento);
    let diasAtraso = Math.floor(
      (dataPagamento - dataVencimento) / (1000 * 60 * 60 * 24)
    );
    diasAtraso = diasAtraso > 0 ? diasAtraso : 0;

    const multa = valor * 0.05;
    const juros = (valor * 0.05 / 30) * diasAtraso;
    let valorAtualizado = valor + multa + juros;
    if (protestado === "sim") valorAtualizado *= 1.05;

    const valorFormatado = valorAtualizado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const vencFormatado = new Date(
      faturaSelecionada.Vencimento
    ).toLocaleDateString("pt-BR");

    const dadosBancarios =
      dominio === "SBA"
        ? `PIX: 30.527.869/0001-50\nOu\nBradesco\nAgência 6638\nConta 0089775-2\nCNPJ 30.527.869/0001-50`
        : `PIX: 15.053.254/0001-45\nOu\nTranspocred\nAgência 108\nConta 20351-3\nCNPJ 15.053.254/0001-45`;

    const msg = `Prezado cliente,\n\nVerificamos que a fatura nº ${faturaSelecionada.Fatura}, com vencimento em ${vencFormatado}, encontra-se em aberto até a presente data.\n\nInformamos que o valor atualizado para quitação é de ${valorFormatado}, já com a incidência de multa e juros conforme previsto contratualmente.\n\nSegue abaixo os dados bancários para pagamento:\n\n${dadosBancarios}\n\nCaso o pagamento já tenha sido realizado, por gentileza, desconsidere esta mensagem.\n\nAtenciosamente,\nDepartamento Financeiro – LTSL`;

    setMensagem(msg);
  };

  const enviarWhatsApp = () => {
    if (!numeroWhatsApp || !mensagem)
      return alert("Informe o número e gere a mensagem.");
    const numero = numeroWhatsApp.replace(/\D/g, "");
    const texto = encodeURIComponent(mensagem);
    window.open(`https://wa.me/55${numero}?text=${texto}`, "_blank");
  };

  // Gráficos
  const topAtrasadas = [...faturasFiltradas]
    .filter(f => calcularDiasAtraso(f.Vencimento) > 0)
    .sort((a, b) => parseFloat(String(b.Saldo).replace(',', '.')) - parseFloat(String(a.Saldo).replace(',', '.')))
    .slice(0, 5)
    .map(f => ({ name: f.Cliente, valor: parseFloat(String(f.Saldo).replace(',', '.')) || 0 }));

  const totalAtrasado = faturasFiltradas.reduce((acc, f) => acc + (calcularDiasAtraso(f.Vencimento) > 0 ? parseFloat(String(f.Saldo).replace(',', '.')) || 0 : 0), 0);
  const totalAVencer = faturasFiltradas.reduce((acc, f) => acc + (calcularDiasAtraso(f.Vencimento) === 0 ? parseFloat(String(f.Saldo).replace(',', '.')) || 0 : 0), 0);

  // Renderização JSX
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", background: "#f9f9fb", minHeight: "100vh" }}>
      <img src="/logo.png" alt="Logo LTSL" style={{ width: 180, marginBottom: 24, display: "block", marginLeft: "auto", marginRight: "auto" }} />

      {!logado ? (
        <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center", background: "#fff", padding: 24, borderRadius: 10, boxShadow: "0 2px 8px #0001" }}>
          <h2>Login LTSL</h2>
          <input
            placeholder="Digite seu nome"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: 16, marginBottom: 14 }}
          />
          <button onClick={handleLogin} style={{ width: "100%", padding: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", fontSize: 16 }}>
            Entrar
          </button>
        </div>
      ) : (
        <div>
          <button onClick={() => setLogado(false)} style={{ marginBottom: 20, padding: 8, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>← Voltar</button>
          <h2 style={{ marginBottom: 0 }}>Faturas - {usuario.toUpperCase()}</h2>

          {/* Gráficos */}
          <div style={{ display: 'flex', gap: 24, margin: "30px 0 16px" }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #0001" }}>
              <h4 style={{ marginBottom: 8 }}>Top 5 Faturas Atrasadas</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={topAtrasadas}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#d42b1a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #0001" }}>
              <h4 style={{ marginBottom: 8 }}>Resumo Total</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { tipo: "Atrasado", valor: totalAtrasado },
                  { tipo: "A Vencer", valor: totalAVencer }
                ]}>
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#0070f3" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ color: "#d42b1a" }}>Atrasado: {totalAtrasado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> &nbsp;|&nbsp;
                <span style={{ color: "#0070f3" }}>A Vencer: {totalAVencer.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            </div>
          </div>

          {/* Filtro de clientes */}
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              placeholder="Filtrar por cliente..."
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              style={{ width: 300, padding: 8, fontSize: 15, borderRadius: 4, border: "1px solid #ccc" }}
            />
          </div>

          {/* Tabela de faturas */}
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
              <thead>
                <tr>
                  <th style={th}>Cliente</th>
                  <th style={th}>CNPJ</th>
                  <th style={th}>Fatura</th>
                  <th style={th}>Vencimento</th>
                  <th style={th}>Valor</th>
                  <th style={th}>Dias Atraso</th>
                  <th style={th}>Status</th>
                  <th style={th}>Vendedor</th>
                  <th style={th}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturasExibidas.map((f, i) => (
                  <tr key={i} style={{ background: calcularStatus(f.Vencimento) === "ATRASADA" ? "#ffeaea" : "#eaffea" }}>
                    <td style={td}>{f.Cliente}</td>
                    <td style={td}>{f.CNPJ}</td>
                    <td style={td}>{f.Fatura}</td>
                    <td style={td}>{new Date(f.Vencimento).toLocaleDateString("pt-BR")}</td>
                    <td style={td}>R$ {parseFloat(String(f.Saldo).replace(",", "."))?.toFixed(2)}</td>
                    <td style={td}>{calcularDiasAtraso(f.Vencimento)}</td>
                    <td style={td}>{calcularStatus(f.Vencimento)}</td>
                    <td style={td}>{f.Vendedor}</td>
                    <td style={td}>
                      <button
                        style={{ padding: "4px 10px", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                        onClick={() => {
                          setFaturaSelecionada(f);
                          setMensagem("");
                          setPagamento("");
                          setProtestado("nao");
                          setDominio(f.Dominio || "SBA");
                          setNumeroWhatsApp("");
                        }}
                      >Calcular</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalhe/calculadora da fatura */}
          {faturaSelecionada && (
            <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: 18, marginBottom: 30 }}>
              <h3>Fatura: {faturaSelecionada.Fatura}</h3>
              <p>Cliente: {faturaSelecionada.Cliente}</p>
              <p>Valor original: R$ {parseFloat(String(faturaSelecionada.Saldo).replace(",", "."))?.toFixed(2)}</p>
              <p>Vencimento: {new Date(faturaSelecionada.Vencimento).toLocaleDateString("pt-BR")}</p>
              <label>Data de Pagamento:</label>
              <input type="date" value={pagamento} onChange={e => setPagamento(e.target.value)} style={inputStyle} />

              <label>Protestado?</label>
              <select value={protestado} onChange={e => setProtestado(e.target.value)} style={inputStyle}>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>

              <label>Domínio:</label>
              <select value={dominio} onChange={e => setDominio(e.target.value)} style={inputStyle}>
                <option value="SBA">SBA</option>
                <option value="SLU">SLU</option>
              </select>

              <button onClick={calcularValorAtualizado} style={botao}>Gerar Mensagem</button>

              {mensagem && (
                <>
                  <label style={{ marginTop: 16 }}>Número WhatsApp (com DDD):</label>
                  <input
                    value={numeroWhatsApp}
                    onChange={e => setNumeroWhatsApp(e.target.value)}
                    placeholder="Ex: 41999998888"
                    style={inputStyle}
                  />
                  <textarea readOnly value={mensagem} style={{ ...inputStyle, height: 160 }} />
                  <button onClick={enviarWhatsApp} style={{ ...botao, backgroundColor: "#25D366", marginTop: 4 }}>Enviar via WhatsApp</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// estilos auxiliares
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
