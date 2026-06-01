#!/bin/bash

##############################################################################
# Placar Clube - Setup Script (Linux/macOS)
#
# Este script clona o repositório, instala dependências e inicia o servidor.
# Uso: bash setup.sh
##############################################################################

set -e  # Exit on error

echo "======================================================================"
echo "  🏀 Placar Clube - Setup (Linux/macOS) 🏐"
echo "======================================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Verificar pré-requisitos
print_step "Verificando pré-requisitos..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js não encontrado"
    echo "   Instale de: https://nodejs.org (versão 22+)"
    exit 1
fi
print_success "Node.js $(node --version)"

if ! command -v npm &> /dev/null; then
    print_warning "npm não encontrado"
    exit 1
fi
print_success "npm $(npm --version)"

if ! command -v git &> /dev/null; then
    print_warning "Git não encontrado"
    exit 1
fi
print_success "Git $(git --version | cut -d' ' -f3)"

echo ""

# 2. Clonar repositório (ou pulsar se já existe)
REPO_URL="https://github.com/GustAlvesG/placar-clube.git"
REPO_DIR="placar-clube"

if [ -d "$REPO_DIR" ]; then
    print_warning "Diretório '$REPO_DIR' já existe"
    read -p "   Deseja remover e clonar novamente? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        rm -rf "$REPO_DIR"
        print_step "Clonando repositório..."
        git clone "$REPO_URL" "$REPO_DIR"
    fi
else
    print_step "Clonando repositório..."
    git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
print_success "Repositório pronto: $(pwd)"

echo ""

# 3. Instalar dependências
print_step "Instalando dependências (npm install)..."
npm install --loglevel=warn
print_success "Dependências instaladas"

echo ""

# 4. Rodar testes (opcional)
print_step "Rodando testes..."
if npm test; then
    print_success "Todos os testes passaram ✓"
else
    print_warning "Alguns testes falharam (verifique acima)"
fi

echo ""

# 5. Mostrar informações de acesso
print_step "Setup completo!"
echo ""
echo "=========================================================================="
echo ""
echo -e "  ${GREEN}✓ Placar Clube está pronto!${NC}"
echo ""
echo "  Para iniciar o servidor, execute:"
echo ""
echo -e "    ${BLUE}npm start${NC}          (produção)"
echo -e "    ${BLUE}npm run dev${NC}        (desenvolvimento com nodemon)"
echo ""
echo "  Depois acesse:"
echo ""
echo "    🎮 Configuração: http://localhost:3000/controle/"
echo "    🎮 Controle:     http://localhost:3000/controle/controle.html"
echo "    🎮 Placar:       http://localhost:3000"
echo "    🎮 Anúncios:     http://localhost:3000/controle/controle_anuncios.html"
echo ""
echo "  Em rede local (substitua IP):"
echo ""
echo "    http://<seu-IP>:3000"
echo ""
echo "=========================================================================="
echo ""

# 6. Perguntar se quer iniciar
read -p "Deseja iniciar o servidor agora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_step "Iniciando servidor..."
    npm start
fi
