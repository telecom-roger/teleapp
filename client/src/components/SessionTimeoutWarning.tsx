import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";

interface SessionTimeoutWarningProps {
  open: boolean;
  timeRemaining: string;
  onContinue: () => void;
}

export function SessionTimeoutWarning({
  open,
  timeRemaining,
  onContinue,
}: SessionTimeoutWarningProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md border-2 border-gray-200 shadow-2xl bg-white"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle className="text-xl text-gray-900">Sessão Expirando</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-4">
            <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex-1 text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Sua sessão vai expirar por inatividade
                </p>
                <p className="text-5xl font-bold text-blue-600 font-mono tracking-wider">
                  {timeRemaining}
                </p>
              </div>
            </div>

            <Button
              onClick={onContinue}
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-md text-base font-semibold"
              size="lg"
            >
              Continuar Sessão
            </Button>

            <p className="text-xs text-center text-gray-500">
              Clique para manter sua sessão ativa
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
