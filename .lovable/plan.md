
## Mover documentação da API para a página Configurações

### Alterações

1. **`src/pages/DashboardGerencial.tsx`** — Remover o card "API Pública de Dados" e todo o código relacionado (estados `copied`, lista `TABLES`, função `copyToClipboard`). A página ficará apenas com o embed do Power BI.

2. **`src/pages/SettingsPage.tsx`** — Adicionar um novo card "API Pública de Dados" com a mesma funcionalidade removida do Dashboard Gerencial: lista de tabelas com botões de copiar URL, documentação dos parâmetros e URL base.

### Detalhes técnicos
- Mover as constantes `API_BASE` e `TABLES` para o SettingsPage
- Mover o estado `copied` e a função `copyToClipboard` para o SettingsPage
- Importar os ícones `Database`, `Copy`, `Check` no SettingsPage
