import type { ReactNode } from 'react';
import { Header } from './Header';

/**
 * Layout padrão das telas: cabeçalho fixo + conteúdo centralizado.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="screen">{children}</main>
    </>
  );
}
