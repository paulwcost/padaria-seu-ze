// Variáveis globais para armazenar os dados
        let clientes = [];
        let compras = [];
        let pagamentos = [];
        let clienteEditandoId = null;

        // Inicializar o sistema carregando dados do localStorage
        function inicializar() {
            // Carregar dados do localStorage
            if (localStorage.getItem('padaria_clientes')) {
                clientes = JSON.parse(localStorage.getItem('padaria_clientes'));
            }
            if (localStorage.getItem('padaria_compras')) {
                compras = JSON.parse(localStorage.getItem('padaria_compras'));
            }
            if (localStorage.getItem('padaria_pagamentos')) {
                pagamentos = JSON.parse(localStorage.getItem('padaria_pagamentos'));
            }
            
            // Atualizar a data atual
            const hoje = new Date();
            document.getElementById('data-atual').innerText = `Data: ${formatarData(hoje)}`;
            
            // Preencher data atual nos campos de data
            document.getElementById('data-compra').valueAsDate = hoje;
            document.getElementById('data-pagamento').valueAsDate = hoje;
            
            // Atualizar as tabelas e listas
            atualizarTabelaClientes();
            atualizarListaClientesSelect();
            atualizarRelatorios();
        }

        // Formatar data como DD/MM/AAAA
        function formatarData(data) {
            if (!(data instanceof Date)) {
                data = new Date(data);
            }
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            return `${dia}/${mes}/${ano}`;
        }

        // Formatar valor como R$ XX,XX
        function formatarMoeda(valor) {
            return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
        }

        // Mudar entre as abas
        function mudarAba(aba) {
            // Esconder todas as abas
            document.querySelectorAll('.content').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(el => {
                el.classList.remove('active');
            });
            
            // Mostrar a aba selecionada
            document.getElementById(aba).classList.add('active');
            document.querySelector(`.tab[onclick="mudarAba('${aba}')"]`).classList.add('active');
            
            // Atualizar dados específicos da aba
            if (aba === 'relatorios') {
                atualizarRelatorios();
            }
        }

        // Salvar cliente
        function salvarCliente() {
            const nome = document.getElementById('nome').value;
            const telefone = document.getElementById('telefone').value;
            const endereco = document.getElementById('endereco').value;
            const limite = parseFloat(document.getElementById('limite').value) || 0;
            
            if (!nome) {
                mostrarMensagem('Por favor, informe o nome do cliente.', 'error');
                return;
            }
            
            if (clienteEditandoId !== null) {
                // Editando cliente existente
                const index = clientes.findIndex(c => c.id === clienteEditandoId);
                if (index !== -1) {
                    clientes[index].nome = nome;
                    clientes[index].telefone = telefone;
                    clientes[index].endereco = endereco;
                    clientes[index].limite = limite;
                }
                clienteEditandoId = null;
            } else {
                // Novo cliente
                const novoCliente = {
                    id: Date.now(),
                    nome,
                    telefone,
                    endereco,
                    limite
                };
                clientes.push(novoCliente);
            }
            
            // Salvar no localStorage
            localStorage.setItem('padaria_clientes', JSON.stringify(clientes));
            
            // Limpar formulário
            document.getElementById('nome').value = '';
            document.getElementById('telefone').value = '';
            document.getElementById('endereco').value = '';
            document.getElementById('limite').value = '';
            
            // Atualizar tabela e selects
            atualizarTabelaClientes();
            atualizarListaClientesSelect();
            mostrarMensagem('Cliente salvo com sucesso!', 'success');
        }

        // Editar cliente
        function editarCliente(id) {
            const cliente = clientes.find(c => c.id === id);
            if (cliente) {
                document.getElementById('nome').value = cliente.nome;
                document.getElementById('telefone').value = cliente.telefone;
                document.getElementById('endereco').value = cliente.endereco;
                document.getElementById('limite').value = cliente.limite;
                clienteEditandoId = id;
                // Rolar para o formulário
                document.getElementById('form-cliente').scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Excluir cliente
        function excluirCliente(id) {
            if (confirm('Tem certeza que deseja excluir este cliente?')) {
                // Verificar se o cliente tem movimentações
                const temCompras = compras.some(c => c.clienteId === id);
                const temPagamentos = pagamentos.some(p => p.clienteId === id);
                
                if (temCompras || temPagamentos) {
                    alert('Este cliente possui movimentações e não pode ser excluído!');
                    return;
                }
                
                clientes = clientes.filter(c => c.id !== id);
                
                // Salvar no localStorage
                localStorage.setItem('padaria_clientes', JSON.stringify(clientes));
                
                // Atualizar tabela e selects
                atualizarTabelaClientes();
                atualizarListaClientesSelect();
                mostrarMensagem('Cliente excluído com sucesso!', 'success');
            }
        }

        // Calcular saldo devedor de um cliente
        function calcularSaldoDevedor(clienteId) {
            const comprasCliente = compras.filter(c => c.clienteId === clienteId);
            const pagamentosCliente = pagamentos.filter(p => p.clienteId === clienteId);
            
            const totalCompras = comprasCliente.reduce((total, compra) => total + compra.valor, 0);
            const totalPagamentos = pagamentosCliente.reduce((total, pagamento) => total + pagamento.valor, 0);
            
            return totalCompras - totalPagamentos;
        }

        // Buscar clientes
        function buscarClientes() {
            const termo = document.getElementById('busca-cliente').value.toLowerCase();
            const clientesFiltrados = termo ? 
                clientes.filter(c => c.nome.toLowerCase().includes(termo)) : 
                clientes;
            
            atualizarTabelaClientes(clientesFiltrados);
        }

        // Atualizar tabela de clientes
        function atualizarTabelaClientes(listaClientes = clientes) {
            const tabela = document.getElementById('tabela-clientes').getElementsByTagName('tbody')[0];
            tabela.innerHTML = '';
            
            if (listaClientes.length === 0) {
                const row = tabela.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5;
                cell.textAlign = 'center';
                cell.innerText = 'Nenhum cliente cadastrado';
                return;
            }
            
            listaClientes.forEach(cliente => {
                const saldoDevedor = calcularSaldoDevedor(cliente.id);
                
                const row = tabela.insertRow();
                row.insertCell().innerText = cliente.nome;
                row.insertCell().innerText = cliente.telefone;
                row.insertCell().innerText = cliente.endereco;
                
                const cellSaldo = row.insertCell();
                cellSaldo.innerText = formatarMoeda(saldoDevedor);
                if (saldoDevedor > 0) {
                    cellSaldo.classList.add('status-pendente');
                }
                
                const cellAcoes = row.insertCell();
                cellAcoes.innerHTML = `<button onclick="editarCliente(${cliente.id})">Editar</button> 
                                       <button class="btn-perigo" onclick="excluirCliente(${cliente.id})">Excluir</button>`;
            });
        }

        // Atualizar listas de clientes nos selects
        function atualizarListaClientesSelect() {
            const selectCompra = document.getElementById('cliente-compra');
            const selectPagamento = document.getElementById('cliente-pagamento');
            const selectMovimentacoes = document.getElementById('cliente-movimentacoes');
            
            // Limpar selects
            selectCompra.innerHTML = '<option value="">Selecione um cliente</option>';
            selectPagamento.innerHTML = '<option value="">Selecione um cliente</option>';
            selectMovimentacoes.innerHTML = '<option value="">Selecione um cliente</option>';
            
            // Adicionar opções
            clientes.forEach(cliente => {
                const saldoDevedor = calcularSaldoDevedor(cliente.id);
                
                const optionCompra = document.createElement('option');
                optionCompra.value = cliente.id;
                optionCompra.text = cliente.nome;
                selectCompra.appendChild(optionCompra);
                
                const optionPagamento = document.createElement('option');
                optionPagamento.value = cliente.id;
                optionPagamento.text = `${cliente.nome} - Deve: ${formatarMoeda(saldoDevedor)}`;
                selectPagamento.appendChild(optionPagamento);
                
                const optionMovimentacoes = document.createElement('option');
                optionMovimentacoes.value = cliente.id;
                optionMovimentacoes.text = cliente.nome;
                selectMovimentacoes.appendChild(optionMovimentacoes);
            });
        }

        // Registrar compra fiado
        function registrarCompra() {
            const clienteId = parseInt(document.getElementById('cliente-compra').value);
            const descricao = document.getElementById('descricao').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const data = document.getElementById('data-compra').value;
            
            if (!clienteId || !descricao || isNaN(valor) || valor <= 0 || !data) {
                mostrarMensagem('Por favor, preencha todos os campos.', 'error');
                return;
            }
            
            // Verificar limite do cliente
            const cliente = clientes.find(c => c.id === clienteId);
            const saldoAtual = calcularSaldoDevedor(clienteId);
            
            if (cliente.limite > 0 && (saldoAtual + valor) > cliente.limite) {
                if (!confirm(`Esta compra ultrapassa o limite de crédito do cliente (${formatarMoeda(cliente.limite)}). Deseja continuar mesmo assim?`)) {
                    return;
                }
            }
            
            const compra = {
                id: Date.now(),
                clienteId,
                descricao,
                valor,
                data
            };
            
            compras.push(compra);
            
            // Salvar no localStorage
            localStorage.setItem('padaria_compras', JSON.stringify(compras));
            
            // Limpar formulário
            document.getElementById('descricao').value = '';
            document.getElementById('valor').value = '';
            
            // Atualizar movimentações
            if (parseInt(document.getElementById('cliente-movimentacoes').value) === clienteId) {
                carregarMovimentacoes();
            }
            
            mostrarMensagem('Compra registrada com sucesso!', 'success');
        }

        // Registrar pagamento
        function registrarPagamento() {
            const clienteId = parseInt(document.getElementById('cliente-pagamento').value);
            const valor = parseFloat(document.getElementById('valor-pagamento').value);
            const data = document.getElementById('data-pagamento').value;
            
            if (!clienteId || isNaN(valor) || valor <= 0 || !data) {
                mostrarMensagem('Por favor, preencha todos os campos.', 'error');
                return;
            }
            
            const saldoDevedor = calcularSaldoDevedor(clienteId);
            
            if (valor > saldoDevedor) {
                if (!confirm(`O valor do pagamento (${formatarMoeda(valor)}) é maior que o saldo devedor (${formatarMoeda(saldoDevedor)}). Deseja continuar mesmo assim?`)) {
                    return;
                }
            }
            
            const pagamento = {
                id: Date.now(),
                clienteId,
                valor,
                data
            };
            
            pagamentos.push(pagamento);
            
            // Salvar no localStorage
            localStorage.setItem('padaria_pagamentos', JSON.stringify(pagamentos));
            
            // Limpar formulário
            document.getElementById('valor-pagamento').value = '';
            
            // Atualizar movimentações
            if (parseInt(document.getElementById('cliente-movimentacoes').value) === clienteId) {
                carregarMovimentacoes();
            }
            
            mostrarMensagem('Pagamento registrado com sucesso!', 'success');
        }

        // Carregar movimentações de um cliente
        function carregarMovimentacoes() {
            const clienteId = parseInt(document.getElementById('cliente-movimentacoes').value);
            const tabela = document.getElementById('tabela-movimentacoes').getElementsByTagName('tbody')[0];
            const saldoCliente = document.getElementById('saldo-cliente');
            
            tabela.innerHTML = '';
            
            if (!clienteId) {
                saldoCliente.classList.add('hidden');
                return;
            }
            
            // Buscar movimentações do cliente
            const comprasCliente = compras.filter(c => c.clienteId === clienteId);
            const pagamentosCliente = pagamentos.filter(p => p.clienteId === clienteId);
            
            // Combinar e ordenar por data
            const movimentacoes = [
                ...comprasCliente.map(c => ({ 
                    data: c.data, 
                    tipo: 'Compra', 
                    descricao: c.descricao, 
                    valor: c.valor 
                })),
                ...pagamentosCliente.map(p => ({ 
                    data: p.data, 
                    tipo: 'Pagamento', 
                    descricao: 'Pagamento em dinheiro', 
                    valor: -p.valor 
                }))
            ].sort((a, b) => new Date(b.data) - new Date(a.data));
            
            if (movimentacoes.length === 0) {
                const row = tabela.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 4;
                cell.textAlign = 'center';
                cell.innerText = 'Nenhuma movimentação encontrada';
            } else {
                movimentacoes.forEach(mov => {
                    const row = tabela.insertRow();
                    row.insertCell().innerText = formatarData(mov.data);
                    row.insertCell().innerText = mov.tipo;
                    row.insertCell().innerText = mov.descricao;
                    
                    const cellValor = row.insertCell();
                    cellValor.innerText = formatarMoeda(Math.abs(mov.valor));
                    if (mov.valor > 0) {
                        cellValor.classList.add('status-pendente');
                    } else {
                        cellValor.classList.add('status-pago');
                    }
                });
            }
            
            // Mostrar resumo do cliente
            const cliente = clientes.find(c => c.id === clienteId);
            if (cliente) {
                const saldoDevedor = calcularSaldoDevedor(clienteId);
                const limiteDisponivel = cliente.limite > 0 ? 
                    Math.max(0, cliente.limite - saldoDevedor) : 
                    'Sem limite definido';
                
                document.getElementById('nome-cliente-resumo').innerText = cliente.nome;
                document.getElementById('saldo-devedor').innerText = formatarMoeda(saldoDevedor);
                document.getElementById('limite-disponivel').innerText = 
                    typeof limiteDisponivel === 'string' ? 
                    limiteDisponivel : 
                    formatarMoeda(limiteDisponivel);
                
                saldoCliente.classList.remove('hidden');
            }
        }

        // Mostrar formulário de compra
        function mostrarFormCompra() {
            document.getElementById('form-compra').classList.remove('hidden');
            document.getElementById('form-pagamento').classList.add('hidden');
            document.getElementById('btn-mostrar-compra').classList.add('active');
            document.getElementById('btn-mostrar-pagamento').classList.remove('active');
        }

        // Mostrar formulário de pagamento
        function mostrarFormPagamento() {
            document.getElementById('form-compra').classList.add('hidden');
            document.getElementById('form-pagamento').classList.remove('hidden');
            document.getElementById('btn-mostrar-compra').classList.remove('active');
            document.getElementById('btn-mostrar-pagamento').classList.add('active');
        }

        // Buscar na caderneta
        function buscarCaderneta() {
            const termo = document.getElementById('busca-caderneta').value.toLowerCase();
            
            if (termo) {
                const clienteEncontrado = clientes.find(c => c.nome.toLowerCase().includes(termo));
                if (clienteEncontrado) {
                    document.getElementById('cliente-movimentacoes').value = clienteEncontrado.id;
                    carregarMovimentacoes();
                }
            }
        }

        // Atualizar relatórios
        function atualizarRelatorios() {
            // Calcular totais
            const totalClientes = clientes.length;
            let totalReceber = 0;
            
            clientes.forEach(cliente => {
                const saldo = calcularSaldoDevedor(cliente.id);
                if (saldo > 0) {
                    totalReceber += saldo;
                }
            });
            
            // Atualizar resumo
            document.getElementById('total-clientes').innerText = totalClientes;
            document.getElementById('total-receber').innerText = formatarMoeda(totalReceber);
            
            // Listar inadimplentes
            const tabelaInadimplentes = document.getElementById('tabela-inadimplentes').getElementsByTagName('tbody')[0];
            tabelaInadimplentes.innerHTML = '';
            
            // Filtrar clientes com saldo devedor
            const clientesDevedores = clientes.filter(cliente => {
                const saldo = calcularSaldoDevedor(cliente.id);
                return saldo > 0;
            });
            
            if (clientesDevedores.length === 0) {
                const row = tabelaInadimplentes.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 4;
                cell.textAlign = 'center';
                cell.innerText = 'Nenhum cliente com pagamentos pendentes';
                return;
            }
            
            // Ordenar por valor (do maior para o menor)
            clientesDevedores.sort((a, b) => {
                const saldoA = calcularSaldoDevedor(a.id);
                const saldoB = calcularSaldoDevedor(b.id);
                return saldoB - saldoA;
            });
            
            clientesDevedores.forEach(cliente => {
                const saldo = calcularSaldoDevedor(cliente.id);
                
                // Encontrar a data da última compra
                const comprasCliente = compras.filter(c => c.clienteId === cliente.id);
                let ultimaCompra = 'Nunca';
                
                if (comprasCliente.length > 0) {
                    comprasCliente.sort((a, b) => new Date(b.data) - new Date(a.data));
                    ultimaCompra = formatarData(comprasCliente[0].data);
                }
                
                const row = tabelaInadimplentes.insertRow();
                row.insertCell().innerText = cliente.nome;
                row.insertCell().innerText = cliente.telefone;
                
                const cellSaldo = row.insertCell();
                cellSaldo.innerText = formatarMoeda(saldo);
                cellSaldo.classList.add('status-pendente');
                
                row.insertCell().innerText = ultimaCompra;
            });
        }

        // Imprimir relatório
        function imprimirRelatorio() {
            window.print();
        }

        // Exportar dados
        function exportarDados() {
            const dados = {
                clientes,
                compras,
                pagamentos,
                dataExportacao: new Date().toISOString()
            };
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dados));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "padaria_dados.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        // Mostrar mensagem
        function mostrarMensagem(texto, tipo) {
            const mensagem = document.getElementById('mensagem');
            mensagem.innerText = texto;
            mensagem.className = 'alert ' + tipo;
            mensagem.classList.remove('hidden');
            
            // Esconder após 3 segundos
            setTimeout(() => {
                mensagem.classList.add('hidden');
            }, 3000);
        }

        // Funções para reconhecimento de voz
        let recognition;
        let reconhecendoVoz = false;
        let campoAtual = null;

        function iniciarReconhecimentoVoz(campo) {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Seu navegador não suporta reconhecimento de voz. Use um navegador mais recente como Chrome ou Edge.');
                return;
            }
            
            campoAtual = campo;
            
            // Inicializar reconhecimento de voz
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = function() {
                reconhecendoVoz = true;
                document.getElementById('btn-audio-' + campo).classList.add('gravando');
                document.getElementById('btn-audio-' + campo).innerHTML = '🔴 Gravando...';
            };
            
            recognition.onresult = function(event) {
                const textoReconhecido = event.results[0][0].transcript;
                
                // Tratar o texto reconhecido de acordo com o campo
                if (campo === 'cliente') {
                    document.getElementById('nome').value = textoReconhecido;
                } else if (campo === 'descricao') {
                    document.getElementById('descricao').value = textoReconhecido;
                } else if (campo === 'busca') {
                    document.getElementById('busca-cliente').value = textoReconhecido;
                    buscarClientes();
                } else if (campo === 'busca-caderneta') {
                    document.getElementById('busca-caderneta').value = textoReconhecido;
                    buscarCaderneta();
                } else if (campo === 'valor') {
                    // Tentar extrair um número do texto
                    const valorTexto = textoReconhecido.replace(/[^0-9,\.]/g, '').replace(',', '.');
                    const valor = parseFloat(valorTexto);
                    if (!isNaN(valor)) {
                        document.getElementById('valor').value = valor;
                    } else {
                        alert('Não consegui entender um valor. Por favor, diga apenas o número.');
                    }
                } else if (campo === 'valor-pagamento') {
                    const valorTexto = textoReconhecido.replace(/[^0-9,\.]/g, '').replace(',', '.');
                    const valor = parseFloat(valorTexto);
                    if (!isNaN(valor)) {
                        document.getElementById('valor-pagamento').value = valor;
                    } else {
                        alert('Não consegui entender um valor. Por favor, diga apenas o número.');
                    }
                }
            };
            
            recognition.onerror = function(event) {
                console.error('Erro no reconhecimento de voz: ', event.error);
                finalizarReconhecimentoVoz();
            };
            
            recognition.onend = function() {
                finalizarReconhecimentoVoz();
            };
            
            // Iniciar reconhecimento
            recognition.start();
        }

        function finalizarReconhecimentoVoz() {
            reconhecendoVoz = false;
            if (campoAtual) {
                document.getElementById('btn-audio-' + campoAtual).classList.remove('gravando');
                document.getElementById('btn-audio-' + campoAtual).innerHTML = '🎤';
            }
            campoAtual = null;
        }

        // Gerar relatório semanal
        function gerarRelatorioSemanal() {
            // Calcular datas da semana atual
            const hoje = new Date();
            const primeiroDiaDaSemana = new Date(hoje);
            primeiroDiaDaSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
            
            const ultimoDiaDaSemana = new Date(primeiroDiaDaSemana);
            ultimoDiaDaSemana.setDate(primeiroDiaDaSemana.getDate() + 6); // Sábado
            
            // Filtrar compras e pagamentos da semana
            const comprasDaSemana = compras.filter(c => {
                const dataCompra = new Date(c.data);
                return dataCompra >= primeiroDiaDaSemana && dataCompra <= ultimoDiaDaSemana;
            });
            
            const pagamentosDaSemana = pagamentos.filter(p => {
                const dataPagamento = new Date(p.data);
                return dataPagamento >= primeiroDiaDaSemana && dataPagamento <= ultimoDiaDaSemana;
            });
            
            // Calcular totais
            const totalCompras = comprasDaSemana.reduce((total, c) => total + c.valor, 0);
            const totalPagamentos = pagamentosDaSemana.reduce((total, p) => total + p.valor, 0);
            
            // Agrupar por cliente
            const vendasPorCliente = {};
            comprasDaSemana.forEach(c => {
                if (!vendasPorCliente[c.clienteId]) {
                    vendasPorCliente[c.clienteId] = 0;
                }
                vendasPorCliente[c.clienteId] += c.valor;
            });
            
            const pagamentosPorCliente = {};
            pagamentosDaSemana.forEach(p => {
                if (!pagamentosPorCliente[p.clienteId]) {
                    pagamentosPorCliente[p.clienteId] = 0;
                }
                pagamentosPorCliente[p.clienteId] += p.valor;
            });
            
            // Criar relatório
            let relatorio = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <h1 style="text-align: center;">Relatório Semanal da Padaria</h1>
                <h2 style="text-align: center;">Período: ${formatarData(primeiroDiaDaSemana)} a ${formatarData(ultimoDiaDaSemana)}</h2>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9;">
                    <h3 style="margin-top: 0;">Resumo Financeiro</h3>
                    <p><strong>Total de Vendas Fiado:</strong> ${formatarMoeda(totalCompras)}</p>
                    <p><strong>Total de Pagamentos Recebidos:</strong> ${formatarMoeda(totalPagamentos)}</p>
                    <p><strong>Balanço da Semana:</strong> ${formatarMoeda(totalPagamentos - totalCompras)}</p>
                </div>
                
                <h3>Clientes com Mais Compras na Semana</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cliente</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total Comprado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Classificar clientes por total de compras
            const clientesOrdenadosPorCompras = Object.keys(vendasPorCliente)
                .sort((a, b) => vendasPorCliente[b] - vendasPorCliente[a])
                .slice(0, 5); // Top 5
            
            if (clientesOrdenadosPorCompras.length === 0) {
                relatorio += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" colspan="2">Nenhuma compra registrada esta semana</td>
                    </tr>
                `;
            } else {
                clientesOrdenadosPorCompras.forEach(clienteId => {
                    const cliente = clientes.find(c => c.id === parseInt(clienteId));
                    if (cliente) {
                        relatorio += `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${cliente.nome}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${formatarMoeda(vendasPorCliente[clienteId])}</td>
                        </tr>
                        `;
                    }
                });
            }
            
            relatorio += `
                    </tbody>
                </table>
                
                <h3>Clientes que Mais Pagaram na Semana</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cliente</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total Pago</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Classificar clientes por total de pagamentos
            const clientesOrdenadosPorPagamentos = Object.keys(pagamentosPorCliente)
                .sort((a, b) => pagamentosPorCliente[b] - pagamentosPorCliente[a])
                .slice(0, 5); // Top 5
            
            if (clientesOrdenadosPorPagamentos.length === 0) {
                relatorio += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" colspan="2">Nenhum pagamento registrado esta semana</td>
                    </tr>
                `;
            } else {
                clientesOrdenadosPorPagamentos.forEach(clienteId => {
                    const cliente = clientes.find(c => c.id === parseInt(clienteId));
                    if (cliente) {
                        relatorio += `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${cliente.nome}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${formatarMoeda(pagamentosPorCliente[clienteId])}</td>
                        </tr>
                        `;
                    }
                });
            }
            
            relatorio += `
                    </tbody>
                </table>
                
                <h3>Clientes com Maiores Débitos</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cliente</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Telefone</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Valor Devido</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Classificar todos os clientes por saldo devedor
            const clientesComDebito = clientes
                .map(cliente => ({
                    ...cliente,
                    saldo: calcularSaldoDevedor(cliente.id)
                }))
                .filter(cliente => cliente.saldo > 0)
                .sort((a, b) => b.saldo - a.saldo)
                .slice(0, 10); // Top 10
            
            if (clientesComDebito.length === 0) {
                relatorio += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" colspan="3">Nenhum cliente com débitos pendentes</td>
                    </tr>
                `;
            } else {
                clientesComDebito.forEach(cliente => {
                    relatorio += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${cliente.nome}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${cliente.telefone}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; color: red;">${formatarMoeda(cliente.saldo)}</td>
                    </tr>
                    `;
                });
            }
            
            relatorio += `
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: center; color: #777;">
                    <p>Relatório gerado em ${formatarData(new Date())} às ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
            `;
            
            // Abrir em nova janela para impressão
            const janelaImpressao = window.open('', '_blank');
            janelaImpressao.document.write(relatorio);
            janelaImpressao.document.close();
            janelaImpressao.print();
        }

        // Ler relatório semanal em voz alta
        function lerRelatorioEmVozAlta() {
            if (!('speechSynthesis' in window)) {
                alert('Seu navegador não suporta síntese de voz. Use um navegador mais recente como Chrome ou Edge.');
                return;
            }
            
            // Calcular totais para o relatório
            let totalClientes = clientes.length;
            let totalReceber = 0;
            let clientesDevedores = 0;
            
            clientes.forEach(cliente => {
                const saldo = calcularSaldoDevedor(cliente.id);
                if (saldo > 0) {
                    totalReceber += saldo;
                    clientesDevedores++;
                }
            });
            
            // Criar texto para ser lido
            const textoParaLer = `
                Relatório Semanal da Padaria.
                Olá Seu João, aqui está o resumo da sua padaria.
                Total de clientes cadastrados: ${totalClientes}.
                Clientes com compras pendentes: ${clientesDevedores}.
                Total a receber: ${formatarMoeda(totalReceber)}.
                Os principais clientes com débitos são: ${
                    clientes
                        .map(cliente => ({
                            ...cliente,
                            saldo: calcularSaldoDevedor(cliente.id)
                        }))
                        .filter(cliente => cliente.saldo > 0)
                        .sort((a, b) => b.saldo - a.saldo)
                        .slice(0, 3)
                        .map(cliente => `${cliente.nome}, devendo ${formatarMoeda(cliente.saldo)}`)
                        .join('; ')
                }
            `;
            
            // Configurar e iniciar a síntese de voz
            const utterance = new SpeechSynthesisUtterance(textoParaLer);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9; // Um pouco mais lento para facilitar o entendimento
            utterance.pitch = 1;
            
            window.speechSynthesis.speak(utterance);
        }

        // Inicializar o sistema quando a página for carregada
        window.onload = function() {
            inicializar();
        };