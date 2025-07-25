// App completo com login, painel filtrado e cálculo de fatura atualizado com envio via WhatsApp, com layout, logo, botão de voltar, filtros, colunas extras e gráficos

"use client";

import { useEffect, useState } from "react";
import faturas from "../data/faturas_ltsl_filtradas.json";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AppFaturasLTSL() {
  const [usuario, setUsuario] = useState("");
  const [logado, setLogado] = useState(false);
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [pagamento, setPagamento] = useState("");
  const [protestado, setProtestado] = useState("nao");
  const [dominio, setDominio] = useState("SBA");
  const [mensagem, setMensagem] = useState("");
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

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
    const valor = parseFloat(faturaSelecionada.Saldo.replace(',', '.')) || 0;
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

  const topAtrasadas = [...faturasFiltradas]
    .filter(f => calcularDiasAtraso(f.Vencimento) > 0)
    .sort((a, b) => parseFloat(b.Saldo.replace(',', '.')) - parseFloat(a.Saldo.replace(',', '.')))
    .slice(0, 5)
    .map(f => ({ name: f.Cliente, valor: parseFloat(f.Saldo.replace(',', '.')) || 0 }));

  const totalAtrasado = faturasFiltradas.reduce((acc, f) => acc + (calcularDiasAtraso(f.Vencimento) > 0 ? parseFloat(f.Saldo.replace(',', '.')) || 0 : 0), 0);
  const totalAVencer = faturasFiltradas.reduce((acc, f) => acc + (calcularDiasAtraso(f.Vencimento) === 0 ? parseFloat(f.Saldo.replace(',', '.')) || 0 : 0), 0);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <img src="/logo.png" alt="Logo LTSL" style={{ width: 180, marginBottom: 24 }} />
      {!logado ? (
        <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
          <h2>Login LTSL</h2>
          <input placeholder="Digite seu nome" value={usuario} onChange={(e) => setUsuario(e.target.value)} style={inputStyle} />
          <button onClick={handleLogin} style={botao}>Entrar</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setLogado(false)} style={{ marginBottom: 20 }}>← Voltar</button>
          <h2>Faturas - {usuario.toUpperCase()}</h2>

          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            <div style={{ flex: 1 }}>
              <h4>Top 5 Faturas Atrasadas</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topAtrasadas}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#f00" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              <h4>Resumo Total</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ tipo: "Atrasado", valor: totalAtrasado }, { tipo: "A Vencer", valor: totalAVencer }]}>
