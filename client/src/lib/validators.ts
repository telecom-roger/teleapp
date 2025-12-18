/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cleaned.charAt(10));
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  let tamanho = cleaned.length - 2;
  let numeros = cleaned.substring(0, tamanho);
  const digitos = cleaned.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cleaned.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

/**
 * Valida telefone brasileiro (10 ou 11 dígitos)
 */
export function validarTelefone(telefone: string): boolean {
  const cleaned = telefone.replace(/\D/g, "");
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formata CPF
 */
export function formatarCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/**
 * Formata telefone
 */
export function formatarTelefone(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}
