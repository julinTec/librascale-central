

## Análise

O PDF anexo (Vanzolini/DETRAN) define o template visual padrão que todos os orçamentos devem seguir ao serem exportados. Comparando com o `exportPDF` atual em `src/pages/Quotes.tsx`, hoje gerado é um PDF "cru" (cabeçalho azul, tabela de itens) sem identidade visual.

### Elementos do template a reproduzir

1. **Faixa superior roxa** (cor ~ `#6B3FA0`) ocupando ~3% da altura
2. **Logo "Nosso Mundo - Diversidade e Inclusão"** centralizada no topo (extraída do próprio PDF)
3. **Título "Proposta Comercial"** em roxo, centralizado, fonte grande (~22pt)
4. **Subtítulo "A/C [contato] - [cliente]"** centralizado, cinza
5. **Seções numeradas** com títulos roxos em negrito:
   - 1. Apresentação (texto institucional fixo)
   - 2. Escopo do Serviço (descrição + período/local do orçamento)
   - 3. Cronograma (período/datas)
   - 4. Investimento (valor total por extenso + tabela de itens, se houver)
   - 5. Condições de Pagamento (campo configurável)
   - 6. Validade da Proposta (15 dias por padrão)
   - 7. Informações de Contato (Jefferson Rosa)
6. **Rodapé**: faixa inferior turquesa (~`#3FB8AF`) + linha "Documento otimizado para impressão e acessibilidade"
7. Fonte sans-serif (Helvetica do jsPDF), texto justificado nos parágrafos

### Campos novos necessários no orçamento

Para o "A/C" e "Condições de Pagamento" hoje não há campos dedicados. Solução **sem migração de DB**:
- **A/C (atenção)**: usar um novo campo opcional `attention_to` armazenado no `notes` como prefixo `[AC: ...]`, OU pedir ao usuário no momento do export. **Mais simples**: adicionar input no form de orçamento mapeado ao `source_channel` reaproveitado? Não — vou reusar `notes` parseando `[AC: X]` e adicionar um campo dedicado **na UI** que grava em `notes` formatado. 
  - **Decisão**: adicionar dois inputs visuais no form ("A/C - Pessoa de contato" e "Condições de pagamento") e persistir ambos como JSON dentro de `notes` (`{"ac":"...","payment":"...","obs":"..."}`). Retrocompatível: se `notes` não for JSON válido, tratar como texto livre em `obs`.
- Validade fica fixa em 15 dias (texto padrão), mas exibida como "X dias a partir de DD/MM/AAAA".

### Logo

Extrair `page_1_image_1_v2.jpg` do PDF anexo, salvar como `src/assets/logo-nosso-mundo.png`, importar no Quotes.tsx e embutir no PDF via `doc.addImage()` (base64).

## Implementação

### Arquivos

**1. `src/assets/logo-nosso-mundo.png`** (novo)
- Copiar a logo extraída do PDF anexo

**2. `src/pages/Quotes.tsx`** (editar)
- Adicionar campos no formulário: `attention_to`, `payment_terms` (persistidos via JSON em `notes`)
- Reescrever `exportPDF(q)`:
  - Faixa roxa topo (rect filled `#6B3FA0`)
  - Logo centralizada (~50mm largura)
  - Título "Proposta Comercial" centralizado, roxo, 22pt
  - Subtítulo "A/C ... - [cliente]"
  - 7 seções numeradas com títulos roxos negrito 13pt + corpo 11pt justificado
  - Tabela de itens dentro da seção 4 (autoTable com tema discreto, header roxo)
  - Rodapé turquesa + texto pequeno
  - Suporte a múltiplas páginas (verificar `doc.internal.pageSize.height` antes de cada bloco)
- Helper `addSection(num, title, body)` para padronização
- Texto da seção 1 (Apresentação) fica **fixo** no código
- Seções 2/3/4/5/6/7 derivadas dos campos do orçamento + defaults

### Cores e tipografia
```text
Roxo: #6B3FA0  (faixa topo, títulos)
Turquesa: #3FB8AF  (faixa rodapé)
Cinza texto: #333333
Cinza claro (subtítulo): #666666
Fonte: Helvetica (padrão jsPDF)
```

### Layout da página (A4, 210x297mm)
```text
┌──────────────────────────────┐  faixa roxa 8mm
│  [LOGO 50mm centralizada]     │
│      Proposta Comercial       │  roxo 22pt centralizado
│      A/C Fulano - Cliente     │  cinza 11pt centralizado
│  1. Apresentação              │  roxo 13pt bold
│     texto justificado...      │  preto 11pt
│  2. Escopo do Serviço         │
│     ...                       │
│  ... (3 a 7) ...              │
│                               │
│  Documento otimizado...       │  cinza 9pt centralizado
└──────────────────────────────┘  faixa turquesa 8mm
```

### Sem mudanças no banco
Tudo via UI + reaproveitamento do campo `notes`.

