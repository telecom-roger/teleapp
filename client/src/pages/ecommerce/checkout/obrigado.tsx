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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-green-200">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <CheckCircle className="h-20 w-20 mx-auto text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-3">Pedido Confirmado!</h1>
            <p className="text-lg text-slate-600 mb-6">
              Seu pedido foi recebido com sucesso
            </p>

            {pedidoId && (
              <div className="bg-slate-100 p-4 rounded-lg mb-8">
                <span className="text-sm text-slate-600">
                  Número do pedido:
                </span>
                <p className="text-2xl font-bold text-purple-600">
                  #{pedidoId}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-start text-left">
                <Mail className="h-6 w-6 mr-3 mt-1 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Acesso ao Sistema</h3>
                  <p className="text-sm text-slate-600">
                    Você receberá um e-mail com suas credenciais de acesso ao
                    sistema em alguns instantes.
                  </p>
                </div>
              </div>

              <div className="flex items-start text-left">
                <Package className="h-6 w-6 mr-3 mt-1 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Próximos Passos</h3>
                  <p className="text-sm text-slate-600">
                    Nossa equipe entrará em contato para agendar a instalação
                    dos seus serviços.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/ecommerce">Voltar à Loja</Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-500"
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
