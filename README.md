# MotoGestão

Portal acadêmico para uma loja de motos e peças. Versão **1.1.0**, revisada em 02/11/2026.

**[Abrir o portal](https://ewertonrodigues.github.io/MotoGestao/)**

## Funcionalidades

- Dashboard mensal com faturamento, quantidade de vendas, ticket médio e lucro bruto estimado.
- Cadastro, edição e busca de clientes e peças.
- Registro de vendas com baixa de estoque e cancelamento com devolução das unidades.
- Exportação de vendas em CSV e backup JSON.
- Dados fictícios iniciais e armazenamento no navegador de cada visitante.

Vue 3 e Tailwind via CDN. Sem backend, login ou cache offline. O lucro estimado desconta apenas o custo das peças, sem despesas ou impostos. Esta é uma demonstração acadêmica, sem transações financeiras reais.

## Revisão visual 1.1

Formulários com margens internas, título e ações sempre visíveis, área central com rolagem em telas baixas e campos de tamanho consistente. Dashboard com cartões adaptáveis e tipografia mais legível. Até 680 px, as tabelas são apresentadas como cartões com os rótulos dos campos e o menu fica organizado em duas linhas.

Foram conferidas as cinco abas em 1440×900, 1024×768, 768×1024, 390×844, 320×568 e 844×390. As janelas de cadastro, edição, venda e confirmação também foram verificadas em computador, tablet, celular e orientação horizontal. Não houve transbordamento da página nem corte dos botões de ação nas verificações.

## Arquivos

`index.html` é o portal. `pratica.html` preserva o exemplo do contador do guia da faculdade. `main.js` controla a interface, `domain.js` contém as regras e `styles.css` define o layout. O manifesto e os ícones fornecem a base PWA; `sw.js` permanece como esqueleto inicial.

## Hospedagem

GitHub Pages publica a branch `main`, pasta `/ (root)`, com HTTPS. Enviar alterações a essa branch inicia uma nova publicação. Mantenha os ícones e todos os arquivos do portal na raiz. O arquivo `.nojekyll` permite servir o conteúdo estático diretamente.

Os registros não são compartilhados entre pessoas, navegadores ou dispositivos. Não cadastre informações sensíveis nesta demonstração.
