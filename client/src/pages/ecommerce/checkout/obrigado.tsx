import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function CheckoutObrigado() {
  const [pedidoId, setPedidoId] = useState<string>("");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("pedido");
    if (id) setPedidoId(id);
  }, []);

  // Determine the correct URL for "Acessar Painel do Cliente" button
  const painelUrl =
    user?.role === "customer" ? "/ecommerce/painel" : "/ecommerce/login";

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#FAFAFA" }}>
      <div className="max-w-2xl mx-auto">
        <Card
          className="overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <CheckCircle
                className="h-20 w-20 mx-auto"
                style={{ color: "#1AD1C1" }}
              />
            </div>

            <h1
              className="text-3xl font-bold mb-3"
              style={{ color: "#111111" }}
            >
              Pedido Confirmado!
            </h1>
            <p className="text-lg mb-6" style={{ color: "#555555" }}>
              Seu pedido foi recebido com sucesso
            </p>

            {pedidoId && (
              <div
                className="p-4 mb-8"
                style={{
                  background: "rgba(30, 144, 255, 0.05)",
                  border: "1px solid #E0E0E0",
                  borderRadius: "12px",
                }}
              >
                <span className="text-sm" style={{ color: "#555555" }}>
                  Número do pedido:
                </span>
                <p className="text-2xl font-bold" style={{ color: "#1E90FF" }}>
                  #{pedidoId}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-start text-left">
                <Mail
                  className="h-6 w-6 mr-3 mt-1 flex-shrink-0"
                  style={{ color: "#1E90FF" }}
                />
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: "#111111" }}
                  >
                    Acesso ao Sistema
                  </h3>
                  <p className="text-sm" style={{ color: "#555555" }}>
                    Você receberá um e-mail com suas credenciais de acesso ao
                    sistema em alguns instantes.
                  </p>
                </div>
              </div>

              <div className="flex items-start text-left">
                <Package
                  className="h-6 w-6 mr-3 mt-1 flex-shrink-0"
                  style={{ color: "#1E90FF" }}
                />
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: "#111111" }}
                  >
                    Próximos Passos
                  </h3>
                  <p className="text-sm" style={{ color: "#555555" }}>
                    Nossa equipe entrará em contato para agendar a instalação
                    dos seus serviços.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                asChild
                style={{
                  borderColor: "#E0E0E0",
                  color: "#555555",
                  borderRadius: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1E90FF";
                  e.currentTarget.style.color = "#1E90FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E0E0E0";
                  e.currentTarget.style.color = "#555555";
                }}
              >
                <Link href="/ecommerce">Voltar à Loja</Link>
              </Button>
              <Button
                style={{
                  background: "#1E90FF",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#00CFFF";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1E90FF";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onClick={() => {
                  // Invalidar queries para atualização instantânea do dashboard
                  queryClient.invalidateQueries({
                    queryKey: ["/api/ecommerce/customer/orders"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["/api/ecommerce/customer/order-updates"],
                  });
                  navigate(painelUrl);
                }}
              >
                Acessar Painel do Cliente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
