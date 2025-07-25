import './App.css'
import logo from '/logo.png'

function App() {
  return (
    <div className="container">
      <div className="logo-container">
        <img src={logo} alt="Logo da LTSL" className="logo" />
        <h1>Fatura LTSL</h1>
      </div>
      
      <div className="mensagem">
        <p>
          Olá, tudo bem? 👋<br />
          Segue o link da sua fatura referente aos serviços prestados pela LTSL:
        </p>
        <p className="link-fatura">
          👉 <a href="https://www.exemplo.com/fatura/123456" target="_blank" rel="noopener">Clique aqui para visualizar a fat_
