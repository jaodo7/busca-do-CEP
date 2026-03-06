// Aguardar o carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos do DOM
    const cepInput = document.getElementById('cep');
    const btnBuscar = document.getElementById('btnBuscar');
    const loadingDiv = document.getElementById('loading');
    const enderecoInfo = document.getElementById('enderecoInfo');
    const erroSpan = document.getElementById('erro');
    
    // Elementos de exibição do endereço
    const logradouroSpan = document.getElementById('logradouro');
    const bairroSpan = document.getElementById('bairro');
    const cidadeSpan = document.getElementById('cidade');
    const estadoSpan = document.getElementById('estado');
    const cepResultadoSpan = document.getElementById('cepResultado');
    
    // Histórico de buscas
    let historico = JSON.parse(localStorage.getItem('historicoCep')) || [];

    // Máscara para o input do CEP
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });

    // Evento de clique no botão
    btnBuscar.addEventListener('click', function() {
        buscarEndereco();
    });

    // Evento de Enter no input
    cepInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarEndereco();
        }
    });

    // Função de busca
    function buscarEndereco() {
        // Limpar mensagens anteriores
        erroSpan.textContent = '';
        
        // Obter e validar CEP
        let cep = cepInput.value.replace(/\D/g, '');
        
        if (!validarCEP(cep)) {
            return;
        }

        // Mostrar loading
        mostrarLoading(true);
        
        // Buscar endereço na API ViaCEP
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    throw new Error('CEP não encontrado');
                }
                
                // Exibir resultado
                logradouroSpan.textContent = data.logradouro || 'Não informado';
                bairroSpan.textContent = data.bairro || 'Não informado';
                cidadeSpan.textContent = data.localidade || 'Não informado';
                estadoSpan.textContent = data.uf || 'Não informado';
                cepResultadoSpan.textContent = data.cep || 'Não informado';
                
                // Adicionar ao histórico
                adicionarAoHistorico(data.cep, data);
                
                // Esconder loading
                mostrarLoading(false);
            })
            .catch(error => {
                // Mostrar erro
                erroSpan.textContent = error.message;
                limparEndereco();
                
                // Esconder loading
                mostrarLoading(false);
            });
    }

    function validarCEP(cep) {
        if (!cep) {
            erroSpan.textContent = 'Por favor, digite um CEP';
            return false;
        }
        
        if (cep.length !== 8) {
            erroSpan.textContent = 'CEP deve conter 8 dígitos';
            return false;
        }
        
        if (!/^\d+$/.test(cep)) {
            erroSpan.textContent = 'CEP deve conter apenas números';
            return false;
        }
        
        return true;
    }

    function mostrarLoading(mostrar) {
        if (mostrar) {
            loadingDiv.style.display = 'block';
            enderecoInfo.style.display = 'none';
            btnBuscar.disabled = true;
        } else {
            loadingDiv.style.display = 'none';
            enderecoInfo.style.display = 'flex';
            btnBuscar.disabled = false;
        }
    }
    
    function limparEndereco() {
        logradouroSpan.textContent = '---';
        bairroSpan.textContent = '---';
        cidadeSpan.textContent = '---';
        estadoSpan.textContent = '---';
        cepResultadoSpan.textContent = '---';
    }

    function adicionarAoHistorico(cep, endereco) {
        const busca = {
            cep: cep,
            logradouro: endereco.logradouro,
            bairro: endereco.bairro,
            localidade: endereco.localidade,
            uf: endereco.uf,
            timestamp: new Date().toLocaleString()
        };
        
        // Adicionar ao início do array
        historico.unshift(busca);
        
        // Manter apenas as últimas 10 buscas
        if (historico.length > 10) {
            historico.pop();
        }
        
        // Salvar no localStorage
        localStorage.setItem('historicoCep', JSON.stringify(historico));
        
        // Atualizar exibição do histórico
        exibirHistorico();
    }

    function exibirHistorico() {
        const listaHistorico = document.getElementById('listaHistorico');
        if (!listaHistorico) return;
        
        listaHistorico.innerHTML = '';
        
        if (historico.length === 0) {
            listaHistorico.innerHTML = '<li style="color: #718096;">Nenhuma busca realizada</li>';
            return;
        }
        
        historico.forEach((busca) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${busca.cep}</strong> - 
                ${busca.logradouro ? busca.logradouro.split(',')[0] : 'Endereço não informado'}<br>
                <small>${busca.localidade || ''}/${busca.uf || ''} - ${busca.timestamp}</small>
            `;
            
            // Ao clicar no histórico, preencher o CEP e buscar
            li.addEventListener('click', () => {
                cepInput.value = busca.cep;
                buscarEndereco();
            });
            
            listaHistorico.appendChild(li);
        });
    }

    // Função para limpar histórico
    function limparHistorico() {
        if (confirm('Deseja limpar todo o histórico?')) {
            historico = [];
            localStorage.removeItem('historicoCep');
            exibirHistorico();
        }
    }

    // Inicializar histórico
    exibirHistorico();
    
    // Adicionar botão de limpar histórico
    const historyBox = document.querySelector('.history-box');
    if (historyBox) {
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Limpar Histórico';
        clearButton.style.cssText = `
            margin-top: 10px;
            padding: 8px 15px;
            background: #e53e3e;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
        `;
        clearButton.addEventListener('click', limparHistorico);
        historyBox.appendChild(clearButton);
    }
});