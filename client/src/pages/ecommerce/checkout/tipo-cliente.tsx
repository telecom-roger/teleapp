import { useLocation } from "wouter";
import { User, Building2, ArrowRight, ShoppingCart, AlertCircle } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

export default function CheckoutTipoCliente() {
  console.log("🟢🟢🟢 TIPO CLIENTE RENDERIZOU!!!");
  console.log("📍 URL atual:", window.location.href);
  const [, setLocation] = useLocation();
  const { items } = useCartStore();
  console.log("🛒 Items do carrinho:", items);
  
  const escolherTipo = (tipo: "PF" | "PJ") => {
    console.log("🔵 Escolheu tipo:", tipo);
    setLocation(`/ecommerce/checkout/dados?tipo=${tipo}`);
  };
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4"
      style={{ position: "relative", zIndex: 9999 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Finalizar Compra</h1>
          <p className="text-slate-600">Etapa 1 de 5 • Tipo de Cliente</p>
        </div>
        
        {/* Alert se carrinho vazio */}
        {(!items || items.length === 0) && (
          <div className="mb-6 p-4 border border-orange-200 bg-orange-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-orange-800">
              Seu carrinho está vazio. <a href="/ecommerce/planos" className="underline font-semibold">Escolha um plano primeiro</a>.
            </div>
          </div>
        )}
        
        {/* Resumo do carrinho */}
        {items && items.length > 0 && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-semibold">{items.length} {items.length === 1 ? 'plano' : 'planos'} no carrinho</p>
                <p className="text-sm text-slate-600">
                  {items.map(item => item.product.nome).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div 
            className="p-8 text-center bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-purple-500"
            onClick={() => escolherTipo("PF")}
          >
            <User className="h-16 w-16 mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold mb-2">Pessoa Física</h2>
            <p className="text-slate-600 mb-6">Para uso pessoal e residencial</p>
            <button className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2">
              Continuar como PF
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div 
            className="p-8 text-center bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-500"
            onClick={() => escolherTipo("PJ")}
          >
            <Building2 className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold mb-2">Pessoa Jurídica</h2>
            <p className="text-slate-600 mb-6">Para empresas e corporações</p>
            <button className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2">
              Continuar como PJ
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Opção de login para clientes existentes */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 mb-3">Já é nosso cliente?</p>
          <a
            href="/ecommerce/login"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors gap-2 font-medium"
          >
            <User className="h-4 w-4" />
            Fazer Login
          </a>
        </div>
      </div>
    </div>
  );
}
