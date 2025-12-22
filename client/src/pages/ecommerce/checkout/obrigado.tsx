import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { UpsellCard } from "@/components/ecommerce/UpsellCard";

export default function CheckoutObrigado() {
  const [pedidoId, setPedidoId] = useState<string>("");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("pedido");
    if (id) setPedidoId(id);
    
    // Scroll to top imediatamente quando a página carrega
    window.scrollTo(0, 0);
  }, []);

  // Buscar dados do pedido para obter o orderCode
  const { data: orderData } = useQuery({
    queryKey: ["/api/app/customer/orders", pedidoId],
    enabled: !!pedidoId && !!user,
  });

  const orderCode = orderData?.orderCode || pedidoId.slice(0, 8);

  // Determine the correct URL for "Acessar Painel do Cliente" button
  const painelUrl =
    user?.role === "customer" ? "/app/painel" : "/app/login";

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Card de upsell - PRIMEIRO, bem destacado */}
        {pedidoId && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <UpsellCard orderId={pedidoId} momento="pos-checkout" />
          </div>
        )}

        {/* Card de confirmação */}
        <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="p-12 text-center">
            <div className="mb-6">
              <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
            </div>

            <h1 className="text-3xl font-bold mb-3 text-gray-900">
              Pedido Confirmado!
            </h1>
            <p className="text-lg mb-6 text-gray-600">
              Seu pedido foi recebido com sucesso
            </p>

            {pedidoId && (
              <div className="p-4 mb-8 rounded-xl bg-blue-50 border border-gray-200">
                <span className="text-sm text-gray-600">
                  Número do pedido:
                </span>
                <p className="text-xl font-bold font-mono text-blue-600">
                  #{orderCode}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-start text-left">
                <Mail className="h-6 w-6 mr-3 mt-1 flex-shrink-0 text-blue-600" />
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">
                    Acesso ao Sistema
                  </h3>
                  <p className="text-sm text-gray-600">
                    Você receberá um e-mail com suas credenciais de acesso ao
                    sistema em alguns instantes.
                  </p>
                </div>
              </div>

              <div className="flex items-start text-left">
                <Package className="h-6 w-6 mr-3 mt-1 flex-shrink-0 text-blue-600" />
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">
                    Próximos Passos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Nossa equipe entrará em contato para agendar a instalação
                    dos seus serviços.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/app"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold transition-colors border-2 border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600"
              >
                Voltar à Loja
              </a>
              <button
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={() => {
                  // Invalidar queries para atualização instantânea do dashboard
                  queryClient.invalidateQueries({
                    queryKey: ["/api/app/customer/orders"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["/api/app/customer/order-updates"],
                  });
                  navigate(painelUrl);
                }}
              >
                Acessar Painel do Cliente
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
