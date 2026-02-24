# Guia de Uso - RPmon Dashboard

Este guia explica passo a passo como usar todas as funcionalidades do RPmon Dashboard.

## 📋 Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Dashboard](#dashboard)
3. [Criar Vídeo](#criar-vídeo)
4. [Histórico](#histórico)
5. [Agendador](#agendador)
6. [Painel de Controle](#painel-de-controle)
7. [Configurações](#configurações)
8. [Teste de Módulos](#teste-de-módulos)

---

## Primeiros Passos

### 1. Acesse o Sistema

Abra o navegador e acesse: `http://localhost:5173`

### 2. Configure as APIs

Antes de começar, você precisa configurar as chaves de API:

1. Clique em **Configurações** no menu lateral
2. Preencha os campos:
   - **GEMINI_API_KEY**: Para gerar roteiros com IA
   - **OPENAI_API_KEY**: Para gerar imagens com DALL-E (opcional)
   - **YOUTUBE_API_KEY**: Para publicar vídeos (opcional)
   - **YOUTUBE_REFRESH_TOKEN**: Para autenticação OAuth2 (opcional)
3. Clique em **"Testar"** para verificar cada conexão
4. Clique em **"Salvar Configurações"**

---

## Dashboard

A página inicial mostra um resumo do sistema:

### Cards de Estatísticas

- **Total de Vídeos**: Quantidade de vídeos criados
- **Publicados**: Vídeos publicados no YouTube
- **Com Erro**: Vídeos que falharam no processamento
- **Taxa de Sucesso**: Porcentagem de vídeos bem-sucedidos

### Ações Rápidas

Quatro botões para acesso rápido:
- **Criar Vídeo**: Iniciar novo projeto
- **Agendador**: Gerenciar agendamentos
- **Histórico**: Ver vídeos criados
- **Painel de Controle**: Monitorar processos

### Gráfico de Tendências

Mostra a quantidade de vídeos criados nos últimos 7 dias.

---

## Criar Vídeo

### Passo 1: Preencha as Informações

1. **Título**: Nome do vídeo (ex: "Charizard - O Dragão de Fogo")
2. **Tema Pokémon**: Selecione um Pokémon da lista
3. **Descrição**: Detalhes sobre o conteúdo do vídeo

### Passo 2: Opções Avançadas

- **Usar IA para gerar imagens**: Ativa o DALL-E (requer OPENAI_API_KEY)
- **Adicionar legendas sincronizadas**: Adiciona legendas ao vídeo
- **Usar efeitos dinâmicos**: Ativa zoom, pan e partículas

### Passo 3: Gerar Vídeo

1. Clique em **"Gerar Vídeo"**
2. Acompanhe o progresso:
   - 📝 Roteiro (Gemini)
   - 🎙️ Narração (Edge TTS)
   - 🖼️ Imagens (DALL-E)
   - 🎬 Vídeo (FFmpeg)
   - 🖼️ Thumbnail (Pillow)

3. Quando concluído, você será redirecionado para o **Histórico**

---

## Histórico

Gerencie todos os seus vídeos:

### Filtros

- **Busca**: Procure por título
- **Status**: Filtre por Pendente, Processando, Concluído, Publicado ou Erro

### Ações por Vídeo

- **👁️ Visualizar**: Ver detalhes completos
  - Roteiro completo
  - Hashtags
  - Player de vídeo
  - Thumbnail
- **🔄 Regenerar**: Recriar o vídeo
- **🗑️ Deletar**: Remover o vídeo

### Status dos Vídeos

| Status | Descrição | Cor |
|--------|-----------|-----|
| Pendente | Aguardando processamento | Cinza |
| Processando | Em execução | Azul |
| Concluído | Pronto para publicar | Verde |
| Publicado | No YouTube | Roxo |
| Erro | Falhou no processamento | Vermelho |

---

## Agendador

Programe a criação automática de vídeos:

### Criar Agendamento

1. Clique em **"Novo Agendamento"**
2. Preencha:
   - **Tema**: Pokémon do vídeo
   - **Descrição**: Conteúdo do vídeo
   - **Recorrência**:
     - Uma vez: Executa uma única vez
     - Diária: Todos os dias
     - Semanal: Toda semana
     - Mensal: Todo mês
   - **Data**: Quando executar
   - **Horário**: Hora de execução
3. Clique em **"Criar Agendamento"**

### Gerenciar Agendamentos

Na tabela de agendamentos:

- **⏸️/▶️ Pausar/Ativar**: Controla execução
- **✏️ Editar**: Modifica configurações
- **🗑️ Deletar**: Remove o agendamento

### Como Funciona

O scheduler verifica a cada 60 segundos:
1. Busca agendamentos ativos
2. Verifica se `próximaExecucao <= agora`
3. Cria vídeo automaticamente
4. Atualiza próxima execução conforme recorrência

---

## Painel de Controle

Monitore o sistema em tempo real:

### Status do Scheduler

Mostra se o agendador automático está ativo:
- **🟢 Ativo**: Scheduler rodando
- **🔴 Pausado**: Scheduler parado

Use o botão **Pausar/Ativar** para controlar.

### Estatísticas

- **Total de Logs**: Quantidade de eventos
- **Sucessos**: Operações concluídas
- **Erros**: Problemas encontrados

### Logs em Tempo Real

Atualiza automaticamente a cada 5 segundos.

#### Filtros

- **Tipo**: Info, Sucesso, Erro, Aviso
- **Etapa**: Roteiro, Narração, Imagem, Vídeo, Thumbnail, Publicação

#### Cores

| Tipo | Cor | Significado |
|------|-----|-------------|
| Sucesso | 🟢 Verde | Operação concluída |
| Info | 🔵 Azul | Informação geral |
| Aviso | 🟡 Amarelo | Atenção necessária |
| Erro | 🔴 Vermelho | Falha na operação |

### Exportar Logs

Clique em **"Exportar CSV"** para baixar todos os logs filtrados.

---

## Configurações

Gerencie suas chaves de API:

### Campos

Cada API tem:
- **Label**: Nome da API
- **Descrição**: Para que serve
- **Input**: Campo para a chave (mascarado)
- **Botão "Testar"**: Verifica conexão
- **Badge**: Status do teste

### Como Configurar

1. Digite a chave no campo
2. Clique no **👁️** para mostrar/ocultar
3. Clique em **"Testar"** para verificar
4. Clique em **"Salvar Configurações"**

### APIs Disponíveis

| API | Obrigatória | Função |
|-----|-------------|--------|
| Gemini | Sim | Gerar roteiros |
| OpenAI | Não | Gerar imagens |
| YouTube | Não | Publicar vídeos |
| YouTube Token | Não | Autenticação OAuth2 |

### Histórico

Mostra alterações recentes nas configurações.

---

## Teste de Módulos

Teste individualmente cada componente:

### Módulos Disponíveis

1. **Gemini (Roteiro)**
   - Input: Tema do vídeo
   - Output: Roteiro completo

2. **Edge TTS (Narração)**
   - Input: Texto para narração
   - Output: Arquivo MP3

3. **DALL-E (Imagem)**
   - Input: Prompt descrição
   - Output: URL da imagem

4. **FFmpeg (Vídeo)**
   - Input: URL do áudio
   - Output: Vídeo montado

5. **Pillow (Thumbnail)**
   - Input: Título do vídeo
   - Output: Imagem thumbnail

### Como Testar

1. Escolha o módulo
2. Preencha o campo de entrada
3. Clique em **"Testar"**
4. Aguarde o processamento
5. Veja o resultado e tempo de execução

---

## 💡 Dicas

### Performance

1. **Use o Agendador**: Programe vídeos para horários de menor uso
2. **Filtre Logs**: Use filtros para encontrar problemas rapidamente
3. **Exporte Regularmente**: Faça backup dos logs periodicamente

### Solução de Problemas

| Problema | Solução |
|----------|---------|
| Erro no roteiro | Verifique GEMINI_API_KEY |
| Sem imagens | Configure OPENAI_API_KEY |
| Vídeo não gera | Instale FFmpeg |
| Não publica | Verifique YouTube API keys |
| Scheduler parado | Reinicie no Painel de Controle |

### Boas Práticas

1. **Teste antes**: Use "Teste de Módulos" para verificar APIs
2. **Monitore logs**: Acompanhe o Painel de Controle
3. **Configure agendamentos**: Automatize criação regular
4. **Faça backup**: Exporte logs periodicamente

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs no **Painel de Controle**
2. Teste as APIs em **Configurações**
3. Consulte a [Documentação Técnica](DOCUMENTACAO_COMPLETA.md)

---

**Versão**: 1.0.0  
**Atualizado**: Fevereiro 2026
