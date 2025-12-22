export default function TestPage() {
  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1 style={{ fontSize: "48px", color: "green" }}>✅ TESTE FUNCIONOU!</h1>
      <p style={{ fontSize: "24px" }}>
        Se você está vendo isso, o Wouter está funcionando.
      </p>

      <div style={{ marginTop: "30px" }}>
        <a
          href="/app"
          style={{
            display: "inline-block",
            padding: "15px 30px",
            background: "blue",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "18px",
          }}
        >
          Voltar para Home
        </a>
      </div>

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => (window.location.href = "/app/checkout")}
          style={{
            padding: "15px 30px",
            background: "purple",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Ir para Checkout com JS
        </button>
      </div>
    </div>
  );
}
