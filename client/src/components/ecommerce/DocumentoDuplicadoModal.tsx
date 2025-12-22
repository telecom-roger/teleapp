import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentoDuplicadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoPessoa: "PF" | "PJ";
}

export function DocumentoDuplicadoModal({
  open,
  onOpenChange,
  tipoPessoa,
}: DocumentoDuplicadoModalProps) {
  const { toast } = useToast();
  const [etapa, setEtapa] = useState<"aviso" | "recuperacao" | "enviado">("aviso");
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleFechar = () => {
    setEtapa("aviso");
    setEmail("");
    onOpenChange(false);
  };

  const handleEntrar = () => {
    window.location.href = "/app/login?returnTo=checkout";
  };

  const handleRecuperar = () => {
    setEtapa("recuperacao");
  };

  const handleEnviarRecuperacao = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu e-mail para recuperar o acesso",
        variant: "destructive",
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um e-mail válido",
        variant: "destructive",
      });
      return;
    }

    setCarregando(true);

    try {
      // Mock - por enquanto sempre retorna sucesso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implementar chamada real à API
      // await apiRequest("POST", "/api/app/auth/request-access", { email });
      
      setEtapa("enviado");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar link de recuperação",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleVoltar = () => {
    if (etapa === "recuperacao") {
      setEtapa("aviso");
    } else if (etapa === "enviado") {
      handleFechar();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {etapa === "aviso" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <DialogTitle className="text-xl">
                  Cadastro Já Existe
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed pt-2">
                Identificamos que já existe um cadastro com este {tipoPessoa === "PF" ? "CPF" : "CNPJ"}.
                <br />
                Para sua segurança, siga uma das opções abaixo:
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={handleEntrar}
                size="lg"
                className="w-full h-12 text-base font-semibold rounded-lg"
              >
                Entrar na Conta
              </Button>
              <Button
                onClick={handleRecuperar}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-semibold rounded-lg"
              >
                Recuperar Acesso
              </Button>
              <Button
                onClick={handleFechar}
                variant="ghost"
                size="sm"
                className="mt-2 rounded-lg"
              >
                Cancelar
              </Button>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Importante:</strong> Por segurança, não revelamos informações
                pessoais. Se você não reconhece este cadastro, entre em contato
                conosco.
              </p>
            </div>
          </>
        )}

        {etapa === "recuperacao" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <DialogTitle className="text-xl">
                  Recuperar Acesso
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed pt-2">
                Informe seu e-mail cadastrado para receber um link de acesso seguro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                  E-mail Cadastrado
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg px-4 font-semibold border-gray-300 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleEnviarRecuperacao}
                  disabled={carregando}
                  size="lg"
                  className="w-full h-12 text-base font-semibold rounded-lg"
                >
                  {carregando ? "Enviando..." : "Enviar Link de Acesso"}
                </Button>
                <Button
                  onClick={handleVoltar}
                  variant="ghost"
                  size="sm"
                  disabled={carregando}
                  className="rounded-lg"
                >
                  Voltar
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                O link será válido por 15 minutos e só pode ser usado uma vez.
                Se não receber o e-mail, verifique sua caixa de spam.
              </p>
            </div>
          </>
        )}

        {etapa === "enviado" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <DialogTitle className="text-xl">
                  Link Enviado!
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed pt-2">
                Enviamos um link de acesso seguro para:
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-mono text-gray-700 break-all">
                  {email}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Verifique sua caixa de entrada (e spam)
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Clique no link enviado (válido por 15 minutos)
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Acesse sua conta com segurança
                  </p>
                </div>
              </div>

              <Button
                onClick={handleFechar}
                className="w-full mt-6 rounded-lg h-12 text-base font-semibold"
                size="lg"
              >
                Entendido
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
