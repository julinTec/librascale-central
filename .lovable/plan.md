

## Exibir BI fixo no Dashboard Gerencial

Alterar a página `src/pages/DashboardGerencial.tsx` para exibir automaticamente o relatório Power BI na URL fornecida, removendo o campo de input manual.

### Mudanças
- Remover o estado `embedUrl`, `showEmbed` e o formulário de input
- Renderizar o `<iframe>` diretamente com a URL fixa: `https://app.powerbi.com/view?r=eyJrIjoiYTQ4YzUxY2QtMjA3ZS00YjZhLWI0MTMtYTYzY2M0MTI5MDZmIiwidCI6ImViYzMxZTJiLWE5OTYtNGQ4MS04NzIwLWRjNWNkYWQ4YzNmYyJ9`
- Ocupar a altura máxima disponível (`calc(100vh - 120px)`) para melhor visualização
- Manter o Card com título e descrição simplificados

