"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AppFaturasLTSL() {
  // ESTADOS
  const [usuario, setUsuario] = useState("");
  const [logado, setLogado] = useState(false);
  const [faturas, setFaturas] = useState([]);
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [pagamento, setPagamento] = useState("");
  const [protestado, setProtestado] = useState("nao");
  const [dominio, setDominio] = useState("SBA");
  const [mensagem, setMensagem] = useState("");
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");
  const [pagina, setPagina] = useState("painel");

  // FILTROS
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDominio, setFiltroDominio] = useState("");

  // ESTILOS
  const thStyle = { padding: "7px 10px", background: "#e7e7e7", borderBottom: "2px solid #ddd" };
  const tdStyle = { padding: "6px 8px", borderBottom: "1px solid #eee" };
  const inputStyle = { width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4, fontSize: 14, margin: "6px 0" };
  const botao = { width: "100%", padding: 14, backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", marginTop: 8, fontSize: 16 };

  // CARREGA FATURAS
  useEffect(() => {
    fetch("/faturas_ltsl_filtradas.json")
      .then(res => res.json())
      .then(data => setFaturas(data))
      .catch(() => alert("Erro ao carregar faturas!"));
  }, []);

  // LISTAS FILTROS
  const vendedores = [...new Set(faturas.map(f => f.Vendedor).filter(Boolean))];
  const statusLista = [...new Set(faturas.map(f => f.Status).filter(Boolean))];
  const dominiosLista = [...new Set(faturas.map(f => f.Dominio).filter(Boolean))];

  // LOGIN
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
    setPagina("painel");
  };

  // FATURAS FILTRADAS
  const hoje = new Date();
  const faturasDoUsuario = usuario.toUpperCase() === "VIVIAN MAGALHAES"
    ? faturas
    : faturas.filter(f => f.Vendedor?.toUpperCase() === usuario.toUpperCase());
  const faturasFiltradas = faturasDoUsuario
    .filter(f => f.Cliente?.toLowerCase().includes(filtroCliente.toLowerCase()))
    .filter(f => !filtroVendedor || f.Vendedor === filtroVendedor)
    .filter(f => !filtroStatus || f.Status === filtroStatus)
    .filter(f => !filtroDominio || f.Dominio === filtroDominio);

  // COLUNAS CALCULADAS
  const calcularDiasAtraso = venc => {
    const vencimento = new Date(venc);
    const diff = Math.floor((hoje - vencimento) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };
  const calcularStatus = venc => (calcularDiasAtraso(venc) > 0 ? "ATRASADA" : "LIQUIDADA");

  // GRÁFICOS
  const topAtrasadas = [...faturasDoUsuario]
    .filter(f => calcularDiasAtraso(f.Vencimento) > 0)
    .sort((a, b) => parseFloat(String(b.Saldo).replace(',', '.')) - parseFloat(String(a.Saldo).replace(',', '.')))
    .slice(0, 5)
    .map(f => ({ name: f.Cliente, valor: parseFloat(String(f.Saldo).replace(',', '.')) || 0 }));

  const totalAtrasado = faturasDoUsuario.reduce((acc, f) => acc + (calcularDiasAtraso(f.Vencimento) > 0 ? parseFloat(String(f.Saldo).replace(',', '.')) || 0 : 0), 0);
  const totalAVencer = faturasDoUsuario.reduce((acc, f) => acc + (calcularDiasAtraso(f.Vencimento) === 0 ? parseFloat(String(f.Saldo).replace(',', '.')) || 0 : 0), 0);

  // CALCULA MENSAGEM
  const calcularValorAtualizado = () => {
    if (!faturaSelecionada || !pagamento) {
      alert("Informe a data de pagamento e selecione uma fatura.");
      return;
    }
    const valor = parseFloat(String(faturaSelecionada.Saldo).replace(",", ".")) || 0;
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
    const dadosBancarios =
      dominio === "SBA"
        ? `PIX: 30.527.869/0001-50\nOu\nBradesco\nAgência 6638\nConta 0089775-2\nCNPJ 30.527.869/0001-50`
        : `PIX: 15.053.254/0001-45\nOu\nTranspocred\nAgência 108\nConta 20351-3\nCNPJ 15.053.254/0001-45`;

    const msg = `Prezado cliente,\n\nVerificamos que a fatura nº ${faturaSelecionada.Fatura}, com vencimento em ${vencFormatado}, encontra-se em aberto até a presente data.\n\nInformamos que o valor atualizado para quitação é de ${valorFormatado}, já com a incidência de multa e juros conforme previsto contratualmente.\n\nSegue abaixo os dados bancários para pagamento:\n\n${dadosBancarios}\n\nCaso o pagamento já tenha sido realizado, por gentileza, desconsidere esta mensagem.\n\nAtenciosamente,\nDepartamento Financeiro – LTSL`;
    setMensagem(msg);
  };

  // ENVIAR WHATSAPP
  const enviarWhatsApp = () => {
    if (!numeroWhatsApp || !mensagem) return alert("Informe o número e gere a mensagem.");
    const numero = numeroWhatsApp.replace(/\D/g, "");
    const texto = encodeURIComponent(mensagem);
    window.open(`https://wa.me/55${numero}?text=${texto}`, "_blank");
  };

  // ----------------- JSX -----------------
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", background: "#f9f9fb", minHeight: "100vh" }}>
      {/* LOGO */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img
          src="/logo.png"
          alt="Logo LTSL"
          style={{ width: 180, height: "auto", margin: "0 auto", display: "block" }}
          onError={e => e.currentTarget.style.display = 'none'} // oculta se não encontrar
        />
      </div>
      {/* LOGIN */}
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
      ) : pagina === "painel" ? (
        <div>
          <h2 style={{ marginBottom: 0 }}>Faturas - {usuario.toUpperCase()}</h2>
          {/* GRÁFICOS */}
          <div style={{ display: 'flex', gap: 24, margin: "30px 0 16px", flexWrap: "wrap" }}>
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
          {/* FILTROS */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Filtrar Cliente"
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              style={{ ...inputStyle, maxWidth: 200 }}
            />
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}>
              <option value="">Todos Vendedores</option>
              {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 140 }}>
              <option value="">Todos Status</option>
              {statusLista.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filtroDominio} onChange={e => setFiltroDominio(e.target.value)} style={{ ...inputStyle, maxWidth: 120 }}>
              <option value="">Todos Domínios</option>
              {dominiosLista.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* TABELA */}
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Cliente</th>
                  <th style={thStyle}>CNPJ</th>
                  <th style={thStyle}>Fatura</th>
                  <th style={thStyle}>Vencimento</th>
                  <th style={thStyle}>Valor</th>
                  <th style={thStyle}>Dias Atraso</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Vendedor</th>
                  <th style={thStyle}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.map((f, i) => (
                  <tr key={i} style={{ background: calcularStatus(f.Vencimento) === "ATRASADA" ? "#ffeaea" : "#eaffea" }}>
                    <td style={tdStyle}>{f.Cliente}</td>
                    <td style={tdStyle}>{f.CNPJ}</td>
                    <td style={tdStyle}>{f.Fatura}</td>
                    <td style={tdStyle}>{new Date(f.Vencimento).toLocaleDateString("pt-BR")}</td>
                    <td style={tdStyle}>R$ {parseFloat(String(f.Saldo).replace(",", "."))?.toFixed(2)}</td>
                    <td style={tdStyle}>{calcularDiasAtraso(f.Vencimento)}</td>
                    <td style={tdStyle}>{calcularStatus(f.Vencimento)}</td>
                    <td style={tdStyle}>{f.Vendedor}</td>
                    <td style={tdStyle}>
                      <button
                        style={{ padding: "4px 10px", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                        onClick={() => {
                          setFaturaSelecionada(f);
                          setMensagem("");
                          setPagamento("");
                          setProtestado("nao");
                          setDominio(f.Dominio || "SBA");
                          setNumeroWhatsApp("");
                          setPagina("calculo");
                        }}
                      >Calcular</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // TELA DE CÁLCULO BONITA
        <div style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 8px #0001",
          padding: 32,
          margin: "0 auto",
          maxWidth: 520,
          marginTop: 30
        }}>
          <button
            onClick={() => setPagina("painel")}
            style={{
              marginBottom: 16,
              padding: "8px 20px",
              background: "#eee",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600
            }}>
            ← Voltar
          </button>
          {faturaSelecionada && (
            <>
              <h2 style={{ margin: "12px 0 4px", fontWeight: 700 }}>Fatura: {faturaSelecionada.Fatura}</h2>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 17, margin: "5px 0" }}>
                  <strong>Cliente:</strong> {faturaSelecionada.Cliente}
                </div>
                <div style={{ fontSize: 16 }}>
                  <strong>Valor original:</strong> R$ {parseFloat(String(faturaSelecionada.Saldo).replace(",", ".")).toFixed(2)}
                </div>
                <div style={{ fontSize: 16 }}>
                  <strong>Vencimento:</strong> {new Date(faturaSelecionada.Vencimento).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: 500 }}>Data de Pagamento:</label>
                  <input
                    type="date"
                    value={pagamento}
                    onChange={e => setPagamento(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Protestado?</label>
                  <select
                    value={protestado}
                    onChange={e => setProtestado(e.target.value)}
                    style={inputStyle}>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 500 }}>Domínio:</label>
                <select
                  value={dominio}
                  onChange={e => setDominio(e.target.value)}
                  style={inputStyle}>
                  <option value="SBA">SBA</option>
                  <option value="SLU">SLU</option>
                </select>
              </div>
              <button
                onClick={calcularValorAtualizado}
                style={botao}>
                Gerar Mensagem
              </button>
              {mensagem && (
                <>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ fontWeight: 500 }}>Número WhatsApp (com DDD):</label>
                    <input
                      value={numeroWhatsApp}
                      onChange={e => setNumeroWhatsApp(e.target.value)}
                      placeholder="Ex: 41999998888"
                      style={inputStyle}
                    />
                  </div>
                  <textarea
                    readOnly
                    value={mensagem}
                    style={{
                      width: "100%",
                      height: 140,
                      padding: 12,
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      marginTop: 10,
                      fontSize: 14,
                      fontFamily: "inherit"
                    }}
                  />
                  <button
                    onClick={enviarWhatsApp}
                    style={{
                      width: "100%",
                      padding: 14,
                      backgroundColor: "#25D366",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 16,
                      marginTop: 6
                    }}>
                    Enviar via WhatsApp
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
