import { useState, useEffect } from "react";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1-Td1UT7x9aKyCf_PHr9WZ7D3ZJNFxpMZ/gviz/tq?tqx=out:json";

const inputStyle = { padding: 8, borderRadius: 4, border: "1px solid #ccc", margin: "4px 0", width: "100%" };
const botao = { padding: 12, background: "#0070f3", color: "#fff", fontWeight: "bold", border: "none", borderRadius: 6, width: "100%", cursor: "pointer", marginTop: 14 };

function calcularDiasAtraso(vencimento) {
  const hoje = new Date();
  const d = new Date(vencimento);
  const dias = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
}

export default function AppFaturasLTSL() {
  // Estados gerais
  const [usuario, setUsuario] = useState("");
  const [logado, setLogado] = useState(false);
  const [faturas, setFaturas] = useState([]);
  const [filtros, setFiltros] = useState({ cliente: "", vendedor: "", status: "", dominio: "" });

  // Tela de cálculo
  const [telaCalculo, setTelaCalculo] = useState(false);
  const [faturaAtual, setFaturaAtual] = useState(null);
  const [pagamento, setPagamento] = useState("");
  const [protestado, setProtestado] = useState("nao");
  const [dominio, setDominio] = useState("SBA");
  const [mensagem, setMensagem] = useState("");
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");

  // Carregar dados do Google Sheets
  useEffect(() => {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(txt => {
        const json = JSON.parse(txt.substring(47).slice(0, -2));
        const cols = json.table.cols.map(c => c.label);
        const rows = json.table.rows.map(row =>
          Object.fromEntries(row.c.map((v, i) => [cols[i], v ? v.v : ""]))
        );
        setFaturas(rows);
      })
      .catch(() => alert("Erro ao carregar faturas do Google Sheets!"));
  }, []);

  // Autorização (Vivian vê tudo, outros só seus clientes)
  const nomesPermitidos = [
    "VIVIAN MAGALHAES",
    ...Array.from(new Set(faturas.map(f => (f.VENDEDOR || "").toUpperCase())))
  ];
  const handleLogin = () => {
    if (!usuario) return alert("Digite seu nome!");
    if (!nomesPermitidos.includes(usuario.toUpperCase())) return alert("Usuário sem permissão!");
    setLogado(true);
  };

  // Aplicar filtros
  const faturasFiltradas = faturas.filter(f => {
    const vendedorIgual = usuario.toUpperCase() === "VIVIAN MAGALHAES" || (f.VENDEDOR || "").toUpperCase() === usuario.toUpperCase();
    const clienteOk = !filtros.cliente || (f.CLIENTE || "").toLowerCase().includes(filtros.cliente.toLowerCase());
    const vendedorOk = !filtros.vendedor || (f.VENDEDOR || "") === filtros.vendedor;
    const statusOk = !filtros.status || (f.STATUS || "") === filtros.status;
    const dominioOk = !filtros.dominio || (f.DOMINIO || "") === filtros.dominio;
    return vendedorIgual && clienteOk && vendedorOk && statusOk && dominioOk;
  });

  // Dados de filtros dinâmicos
  const vendedores = Array.from(new Set(faturas.map(f => f.VENDEDOR || "").filter(Boolean)));
  const dominios = Array.from(new Set(faturas.map(f => f.DOMINIO || "").filter(Boolean)));
  const statusList = Array.from(new Set(faturas.map(f => f.STATUS || "").filter(Boolean)));

  // Gráficos e Resumos
  const topAtrasadas = faturasFiltradas
    .filter(f => f.STATUS === "ATRASADA")
    .sort((a, b) => parseFloat(b.SALDO || "0") - parseFloat(a.SALDO || "0"))
    .slice(0, 5);
  const totalAtrasado = faturasFiltradas.filter(f => f.STATUS === "ATRASADA").reduce((acc, f) => acc + (parseFloat(f.SALDO || "0") || 0), 0);
  const totalVencer = faturasFiltradas.filter(f => f.STATUS === "A VENCER").reduce((acc, f) => acc + (parseFloat(f.SALDO || "0") || 0), 0);

  // Funções de cálculo e WhatsApp
  function calcularValorAtualizado() {
    if (!faturaAtual || !pagamento) {
      alert("Informe a data de pagamento!");
      return;
    }
    const valor = parseFloat(faturaAtual.SALDO || "0");
    const dataVenc = new Date(faturaAtual.VENCIMENTO);
    const dataPag = new Date(pagamento);
    let diasAtraso = Math.floor((dataPag - dataVenc) / (1000 * 60 * 60 * 24));
    diasAtraso = diasAtraso > 0 ? diasAtraso : 0;
    const multa = valor * 0.05;
    const juros = (valor * 0.05 / 30) * diasAtraso;
    let valorAtual = valor + multa + juros;
    if (protestado === "sim") valorAtual *= 1.05;
    const valorFormatado = valorAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const vencFormatado = new Date(faturaAtual.VENCIMENTO).toLocaleDateString("pt-BR");
    const dadosBancarios = dominio === "SBA"
      ? `PIX: 30.527.869/0001-50\nOu\nBradesco\nAgência 6638\nConta 0089775-2\nCNPJ 30.527.869/0001-50`
      : `PIX: 15.053.254/0001-45\nOu\nTranspocred\nAgência 108\nConta 20351-3\nCNPJ 15.053.254/0001-45`;
    const msg = `Prezado cliente,\n\nVerificamos que a fatura nº ${faturaAtual.FATURA}, com vencimento em ${vencFormatado}, encontra-se em aberto até a presente data.\n\nInformamos que o valor atualizado para quitação é de ${valorFormatado}, já com a incidência de multa e juros conforme previsto contratualmente.\n\nSegue abaixo os dados bancários para pagamento:\n\n${dadosBancarios}\n\nCaso o pagamento já tenha sido realizado, por gentileza, desconsidere esta mensagem.\n\nAtenciosamente,\nDepartamento Financeiro – LTSL`;
    setMensagem(msg);
  }
  function enviarWhatsApp() {
    if (!numeroWhatsApp || !mensagem) return alert("Informe o número e gere a mensagem.");
    const numero = numeroWhatsApp.replace(/\D/g, "");
    const texto = encodeURIComponent(mensagem);
    window.open(`https://wa.me/55${numero}?text=${texto}`, "_blank");
  }

  // --- RENDER ---
  if (!logado) {
    return (
      <div style={{ maxWidth: 350, margin: "100px auto", background: "#fff", borderRadius: 8, boxShadow: "0 0 16px #eee", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <img src="https://i.imgur.com/sgO3fqf.png" alt="Logo LTSL" style={{ height: 80, marginBottom: 20 }} />
        </div>
        <h2>Login</h2>
        <input
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          placeholder="Digite seu nome"
          style={inputStyle}
        />
        <button onClick={handleLogin} style={botao}>Entrar</button>
      </div>
    );
  }

  if (telaCalculo && faturaAtual) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", background: "#fff", borderRadius: 8, boxShadow: "0 0 16px #eee", padding: 28 }}>
        <div style={{ textAlign: "center" }}>
          <img src="https://i.imgur.com/sgO3fqf.png" alt="Logo LTSL" style={{ height: 70, marginBottom: 18 }} />
        </div>
        <button onClick={() => setTelaCalculo(false)} style={{ ...botao, background: "#bbb", marginBottom: 24 }}>← Voltar</button>
        <h2>Fatura: <b>{faturaAtual.FATURA}</b></h2>
        <div><b>Cliente:</b> {faturaAtual.CLIENTE}</div>
        <div><b>Valor original:</b> R$ {Number(faturaAtual.SALDO || 0).toFixed(2)}</div>
        <div><b>Vencimento:</b> {faturaAtual.VENCIMENTO}</div>
        <div style={{ marginTop: 12 }}>
          <label>Data de Pagamento:</label>
          <input type="date" value={pagamento} onChange={e => setPagamento(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label>Protestado?</label>
          <select value={protestado} onChange={e => setProtestado(e.target.value)} style={inputStyle}>
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
        <div>
          <label>Domínio:</label>
          <select value={dominio} onChange={e => setDominio(e.target.value)} style={inputStyle}>
            <option value="SBA">SBA</option>
            <option value="SLU">SLU</option>
          </select>
        </div>
        <button onClick={calcularValorAtualizado} style={botao}>Gerar Mensagem</button>
        {mensagem && (
          <div style={{ marginTop: 24 }}>
            <label>Número WhatsApp:</label>
            <input value={numeroWhatsApp} onChange={e => setNumeroWhatsApp(e.target.value)} placeholder="Ex: 41999998888" style={inputStyle} />
            <textarea readOnly value={mensagem} style={{ width: "100%", height: 100, marginTop: 12 }} />
            <button onClick={enviarWhatsApp} style={{ ...botao, background: "#25D366", marginTop: 10 }}>Enviar via WhatsApp</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#f9f9fb", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", paddingTop: 30 }}>
        <img src="https://i.imgur.com/sgO3fqf.png" alt="Logo LTSL" style={{ height: 95, marginBottom: 15 }} />
      </div>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
        <h2>Faturas - <span style={{ color: "#222" }}>{usuario.toUpperCase()}</span></h2>
        <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 18, minHeight: 180 }}>
            <b>Top 5 Faturas Atrasadas</b>
            <ul>
              {topAtrasadas.map(f => (
                <li key={f.FATURA}>{f.CLIENTE} | R$ {Number(f.SALDO || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</li>
              ))}
              {topAtrasadas.length === 0 && <li>Nenhuma fatura atrasada</li>}
            </ul>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 18, minHeight: 180 }}>
            <b>Resumo Total</b>
            <div style={{ marginTop: 24 }}>
              <span style={{ color: "#b00" }}>Atrasado: R$ {totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              {" | "}
              <span style={{ color: "#009" }}>A Vencer: R$ {totalVencer.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            placeholder="Filtrar Cliente"
            value={filtros.cliente}
            onChange={e => setFiltros(f => ({ ...f, cliente: e.target.value }))}
            style={{ ...inputStyle, width: 200 }}
          />
          <select value={filtros.vendedor} onChange={e => setFiltros(f => ({ ...f, vendedor: e.target.value }))} style={inputStyle}>
            <option value="">Todos Vendedores</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
            <option value="">Todos Status</option>
            {statusList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtros.dominio} onChange={e => setFiltros(f => ({ ...f, dominio: e.target.value }))} style={inputStyle}>
            <option value="">Todos Domínios</option>
            {dominios.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Tabela */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", background: "#fff", borderRadius: 8, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#ececec", fontWeight: 700 }}>
                <td>Cliente</td>
                <td>CNPJ</td>
                <td>Fatura</td>
                <td>Vencimento</td>
                <td>Valor</td>
                <td>Dias Atraso</td>
                <td>Status</td>
                <td>Vendedor</td>
                <td>Ação</td>
              </tr>
            </thead>
            <tbody>
              {faturasFiltradas.map(f => (
                <tr key={f.FATURA}>
                  <td>{f.CLIENTE}</td>
                  <td>{f.CNPJ}</td>
                  <td>{f.FATURA}</td>
                  <td>{f.VENCIMENTO}</td>
                  <td>R$ {Number(f.SALDO || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td>{calcularDiasAtraso(f.VENCIMENTO)}</td>
                  <td>{f.STATUS}</td>
                  <td>{f.VENDEDOR}</td>
                  <td>
                    <button
                      style={{ padding: "6px 12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                      onClick={() => {
                        setFaturaAtual(f);
                        setTelaCalculo(true);
                        setMensagem("");
                        setPagamento("");
                        setNumeroWhatsApp("");
                        setProtestado("nao");
                        setDominio(f.DOMINIO || "SBA");
                      }}>
                      Calcular
                    </button>
                  </td>
                </tr>
              ))}
              {faturasFiltradas.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 24 }}>Nenhuma fatura encontrada!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
