import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function EcommerceFooter() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">Telenext</h3>
            <p className="text-sm text-slate-600 mb-4">
              Compare e contrate os melhores planos de telecom do mercado.
              Transparência e facilidade para você.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-sm mb-4">Navegação</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/app">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    Início
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/app/planos">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    Ver Todos os Planos
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/app/comparador">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    Comparador
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/app/sobre">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    Sobre Nós
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-sm mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/app/termos">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    Termos de Uso
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/app/privacidade">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    Política de Privacidade
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/app/lgpd">
                  <a className="text-slate-600 hover:text-purple-600 transition-colors">
                    LGPD
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2 text-slate-600">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>contato@teleplanos.com.br</span>
              </li>
              <li className="flex items-start space-x-2 text-slate-600">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>(11) 9999-9999</span>
              </li>
              <li className="flex items-start space-x-2 text-slate-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>São Paulo, SP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <div className="text-xs text-slate-500 leading-relaxed mb-3 space-y-1">
            <p>Esta plataforma atua como consultor independente.</p>
            <p>As marcas Vivo, Claro e TIM pertencem aos seus respectivos titulares.</p>
            <p>A contratação dos serviços é feita exclusivamente através de parceiros autorizados.</p>
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Telenext. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
