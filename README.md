# Blackjack Game

Um jogo de Blackjack multiplayer desenvolvido com Node.js, Socket.IO e MongoDB.

## Requisitos

- Node.js (v14 ou superior)
- MongoDB (v7.0 ou superior)
- NPM (v6 ou superior)

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd blackjack-game
```

2. Instale as dependências:
```bash
npm install
```

3. Instale o MongoDB (Linux/Ubuntu):
```bash
# Importar a chave pública do MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Criar arquivo de lista de fontes
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Atualizar lista de pacotes
sudo apt-get update

# Instalar MongoDB
sudo apt-get install -y mongodb-org

# Iniciar o serviço do MongoDB
sudo systemctl start mongod

# Habilitar inicialização automática
sudo systemctl enable mongod
```

4. Configure o arquivo .env:
```env
MONGODB_URI=mongodb://localhost:27017/blackjack-game
PORT=3000
```

## Executando o Projeto

1. Inicie o servidor:
```bash
npm start
```

2. Acesse o jogo em seu navegador:
```
http://localhost:3000
```

## Funcionalidades

- Jogo de Blackjack multiplayer (2-4 jogadores)
- Sistema de mesas com senha opcional
- Chat em tempo real
- Sistema de pontuação
- Animações de cartas
- Interface responsiva
- Perfil de usuário com estatísticas
- Histórico de partidas

## Tecnologias Utilizadas

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript (Vanilla)
  - Socket.IO Client

- **Backend**:
  - Node.js
  - Express
  - Socket.IO
  - MongoDB

## Estrutura do Projeto

```
blackjack-game/
├── assets/          # Imagens e recursos estáticos
├── config/          # Arquivos de configuração
├── css/            # Estilos CSS
├── js/             # Scripts JavaScript
├── models/         # Modelos do MongoDB
├── .env            # Variáveis de ambiente
├── server.js       # Servidor principal
└── package.json    # Dependências do projeto
```

## Comandos Úteis

- Iniciar MongoDB: `sudo systemctl start mongod`
- Parar MongoDB: `sudo systemctl stop mongod`
- Status MongoDB: `sudo systemctl status mongod`
- Reiniciar MongoDB: `sudo systemctl restart mongod`

## Desenvolvimento

Para desenvolvimento com reinicialização automática:
```bash
npm run dev
```

## Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Conectando-se ao Jogo

### Para o Host (computador que está executando o servidor):

1. Abra um navegador
2. Acesse `http://localhost:3000`
3. Faça login ou jogue como convidado

### Para outros jogadores na mesma rede LAN:

1. Abra um navegador
2. Acesse o endereço IP mostrado no console do servidor (ex: `http://192.168.1.100:3000`)
3. Faça login ou jogue como convidado

## Como Jogar

1. **Lobby**: No lobby, você pode criar uma nova mesa ou entrar em uma mesa existente
2. **Criar Mesa**: Defina o nome da mesa, número máximo de jogadores, número de rodadas e nível
3. **Jogar**: Quando todos os jogadores estiverem prontos, o host pode iniciar o jogo
4. **Regras do Blackjack**:
   - O objetivo é ter uma mão com valor mais próximo de 21 do que o dealer, sem ultrapassar 21
   - Cartas numéricas valem seu valor nominal
   - Cartas de figura (J, Q, K) valem 10
   - Ás vale 11 ou 1, o que for melhor para a mão

## Solução de Problemas

- **Não consigo me conectar ao servidor**: Verifique se o servidor está rodando e se você está na mesma rede local
- **Firewall**: Certifique-se de que a porta 3000 não está bloqueada pelo firewall
- **Endereço IP**: Se o endereço IP mostrado no console não funcionar, tente descobrir o IP correto do host usando `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)