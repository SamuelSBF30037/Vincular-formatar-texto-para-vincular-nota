// ==UserScript==
// @name         Preenchedor Automático SICAD - Simulação Nativa de Teclado
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Resolve NumberFormatException enviando entradas simulação de evento nativo de digitação
// @match        *://*sicad*/*
// @match        *://*ssp.go.gov.br/*
// @allFrames    true
// @grant        none
// ==/==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    if (!document.getElementById('btnAutoPreencherSicad')) {
        const btn = document.createElement('button');
        btn.id = 'btnAutoPreencherSicad';
        btn.innerHTML = '📋 Auto Preencher';
        btn.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; z-index: 999999;
            padding: 12px 20px; background-color: #007bff; color: white;
            border: none; border-radius: 25px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            font-weight: bold; cursor: pointer; font-size: 14px; display: none;
        `;
        document.body.appendChild(btn);

        const drawer = document.createElement('div');
        drawer.id = 'drawerAutoPreencherSicad';
        drawer.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 450px; height: 100vh;
            z-index: 1000000; background: #ffffff; box-shadow: 4px 0 15px rgba(0,0,0,0.2);
            padding: 20px; box-sizing: border-box; overflow-y: auto; border-right: 2px solid #007bff;
        `;
        drawer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="margin:0; font-size:16px; color:#333;">Importar Planilha</h3>
                <button id="btnFecharDrawer" style="background:none; border:none; font-size:18px; cursor:pointer; font-weight:bold;">✕</button>
            </div>

            <div style="background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 10px; border-radius: 6px; font-size: 11px; margin-bottom: 12px; line-height: 1.4;">
                <strong style="display:block; margin-bottom:4px; font-size:12px;">⚠️ FORMATO OBRIGATÓRIO DE SAÍDA:</strong>
                O filtro organizará as informações na seguinte ordem (exatamente 1 policial por linha):<br>
                <div style="background:#fff; padding:6px; border:1px dashed #856404; margin-top:6px; font-family:monospace; font-weight:bold; text-align:center;">
                    CLASSIFICAÇÃO / RG / NOME / NOTA
                </div>
                <span style="display:block; margin-top:4px; font-size:10px; color:#6c757d;">Exemplo: 1º / 38579 / YURI ALVES PINHEIRO DOS SANTOS / 9.73</span>
            </div>

            <!-- CAMPO 1: ENTRADA BRUTA -->
            <label style="font-size:12px; font-weight:bold; color:#555; display:block; margin-bottom:4px;">1. Cole a lista/planilha bruta aqui:</label>
            <textarea id="dadosBrutos" style="width:100%; height:130px; box-sizing:border-box; margin-bottom:8px; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:monospace; font-size:11px; resize:none;" placeholder="Cole o texto ou tabela do Excel sem tratamento..."></textarea>
            
            <button id="btnFiltrar" style="width:100%; padding:8px; background:#17a2b8; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer; margin-bottom:12px; font-size:12px;">⚡ Filtrar e Formatar Dados</button>

            <!-- CAMPO 2: DADOS PRONTOS/FORMATADOS -->
            <label style="font-size:12px; font-weight:bold; color:#555; display:block; margin-bottom:4px;">2. Dados formatados e organizados (1 por linha):</label>
            <textarea id="dadosCopiados" wrap="off" style="width:100%; height:180px; box-sizing:border-box; margin-bottom:12px; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:'Courier New', Courier, monospace; font-size:11px; resize:none; background-color:#f8f9fa; white-space:pre; overflow-x:auto;" placeholder="Os dados formatados aparecerão aqui (1 militar por linha)..."></textarea>
            
            <div style="display:flex; gap:10px;">
                <button id="btnProcessar" style="flex:2; padding:10px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">🚀 Processar e Preencher</button>
                <button id="btnLimparTexto" style="flex:1; padding:10px; background:#dc3545; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">🗑️ Limpar</button>
            </div>
        `;
        document.body.appendChild(drawer);

        btn.onclick = () => drawer.style.display = 'block';
        document.getElementById('btnFecharDrawer').onclick = () => drawer.style.display = 'none';

        document.getElementById('btnLimparTexto').onclick = function() {
            document.getElementById('dadosBrutos').value = '';
            document.getElementById('dadosCopiados').value = '';
            document.getElementById('dadosBrutos').focus();
        };

        function obterTodosDocumentos(win = window) {
            let docs = [];
            try {
                docs.push(win.document);
                for (let i = 0; i < win.frames.length; i++) {
                    try {
                        docs = docs.concat(obterTodosDocumentos(win.frames[i]));
                    } catch (e) {}
                }
            } catch (e) {}
            return docs;
        }

        function verificarCondicao() {
            const todosDocs = obterTodosDocumentos();
            let temGeral = false;
            let tem2Parte = false;
            let temEnsino = false;

            todosDocs.forEach(doc => {
                const selects = Array.from(doc.querySelectorAll('select'));
                selects.forEach(select => {
                    const textoSelecionado = select.options[select.selectedIndex]?.text.trim().toUpperCase() || '';
                    if (textoSelecionado === 'GERAL') temGeral = true;
                    if (textoSelecionado === '2ª PARTE' || textoSelecionado === '2A PARTE') tem2Parte = true;
                    if (textoSelecionado === 'ENSINO') temEnsino = true;
                });
            });

            if (temGeral && tem2Parte && temEnsino) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
                drawer.style.display = 'none';
            }
        }

        setInterval(verificarCondicao, 1000);
        document.addEventListener('change', verificarCondicao);

        function normalizar(texto) {
            if (!texto) return '';
            return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[*()[\]\\]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
        }

        // SIMULAÇÃO DE DIGITAÇÃO DIRETA PARA ATIVAR AS MÁSCARAS NATIVAS DO SICAD
        function simularDigitacaoNativa(element, valor) {
            element.focus();
            element.select();
            
            // Tenta usar a API nativa de inserção de texto do navegador
            try {
                element.ownerDocument.execCommand('insertText', false, valor);
            } catch (e) {
                element.value = valor;
            }

            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
        }

        // TRATAMENTO DE NOTA: CONVERTE PARA NÚMERO SIMPLES COM PONTO (EX: 9.73 OU 0.00)
        function tratarNotaCrua(notaRaw) {
            if (!notaRaw) return '0.00';

            let num = parseFloat(notaRaw.toString().replace(',', '.'));
            if (isNaN(num)) return '0.00';

            // Retorna o valor float legível para Java (sem zeros desnecessários à esquerda)
            return num.toFixed(2);
        }

        // LEITURA E FILTRAGEM DE DADOS
        document.getElementById('btnFiltrar').onclick = function() {
            const rawText = document.getElementById('dadosBrutos').value;
            if (!rawText.trim()) {
                alert('Cole primeiro a lista bruta de dados para filtrar.');
                return;
            }

            const linhas = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const registrosExtraidos = [];

            let i = 0;
            while (i < linhas.length) {
                if (linhas[i].match(/^\d+º\/\d+$/)) {
                    let classif = linhas[i].split('º')[0] + 'º';
                    let numIndex = i - 5;
                    
                    if (numIndex >= 0) {
                        let rg = linhas[numIndex + 2].replace(/\./g, '').trim();
                        let nome = normalizar(linhas[numIndex + 3]);
                        let notaStr = linhas[numIndex + 4];

                        registrosExtraidos.push({
                            classif: classif,
                            rg: rg,
                            nome: nome,
                            nota: notaStr
                        });
                    }
                }
                i++;
            }

            if (registrosExtraidos.length === 0) {
                let tempClassif = '';
                let tempRG = '';
                let tempNome = '';
                let tempNota = '';

                linhas.forEach(linha => {
                    if (linha.match(/^\d+º\/\d+$/)) {
                        tempClassif = linha.split('º')[0] + 'º';
                        if (tempRG && tempNome) {
                            registrosExtraidos.push({
                                classif: tempClassif,
                                rg: tempRG,
                                nome: tempNome,
                                nota: tempNota || '0.00'
                            });
                            tempClassif = ''; tempRG = ''; tempNome = ''; tempNota = '';
                        }
                    } else if (linha.match(/^\d{1,3}\.\d{3}$/) || linha.match(/^\d{4,6}$/)) {
                        tempRG = linha.replace(/\./g, '');
                    } else if (linha.match(/^\d{1,2}[.,]\d{1,3}$/)) {
                        tempNota = linha;
                    } else if (!linha.match(/^\d+$/) && !linha.toUpperCase().includes('CABO QPPM') && !linha.toUpperCase().includes('SOLDADO') && !linha.toUpperCase().includes('SGT')) {
                        tempNome = normalizar(linha);
                    }
                });
            }

            if (registrosExtraidos.length > 0) {
                const linhasFormatadas = registrosExtraidos.map(r => {
                    let notaTratada = tratarNotaCrua(r.nota);
                    return `${r.classif} / ${r.rg} / ${r.nome} / ${notaTratada}`;
                });

                document.getElementById('dadosCopiados').value = linhasFormatadas.join('\n');
            } else {
                alert('Não foi possível identificar a estrutura da lista. Tente colar novamente.');
            }
        };

        // PROCESSAMENTO E ENVIO
        document.getElementById('btnProcessar').onclick = function() {
            const rawText = document.getElementById('dadosCopiados').value;
            if (!rawText.trim()) {
                alert('A caixa de dados formatados está vazia. Realize a filtragem primeiro.');
                return;
            }

            const linhasEntrada = rawText.split('\n');
            let preenchidos = 0;
            let ignorados = 0;
            const todosDocs = obterTodosDocumentos();

            linhasEntrada.forEach(linhaTexto => {
                if (!linhaTexto.trim()) return;

                const partes = linhaTexto.split('/').map(p => p.trim());

                if (partes.length >= 4) {
                    const rawClassif = partes[0];
                    const rawRG = partes[1];
                    const rawNome = partes[2];
                    const rawNota = partes[3];

                    const classif = rawClassif.replace(/\D/g, '');
                    const rgColado = rawRG.replace(/\./g, '').trim();
                    const nomeColadoNorm = normalizar(rawNome);

                    todosDocs.forEach(doc => {
                        const trs = doc.querySelectorAll('tr');
                        trs.forEach(tr => {
                            const tds = tr.querySelectorAll('td');
                            if (tds.length >= 6) {
                                const rgTabela = normalizar(tds[0]?.innerText || '').replace(/\./g, '');
                                const nomeTabela = normalizar(tds[2]?.innerText || '');

                                if (rgTabela && nomeTabela) {
                                    const bateuRG = rgColado && rgTabela.includes(rgColado);
                                    const bateuNome = nomeTabela.length > 3 && (nomeTabela.includes(nomeColadoNorm) || nomeColadoNorm.includes(nomeTabela));

                                    if (bateuRG && bateuNome) {
                                        const inputClassif = tr.querySelector('input[name*="classi"], input[name*="CLASSI"], input[id*="classi"]') || tds[3]?.querySelector('input');
                                        const inputNota = tr.querySelector('input[name*="nota"], input[name*="NOTA"], input[id*="nota"]') || tds[6]?.querySelector('input');

                                        if (inputClassif && classif) {
                                            simularDigitacaoNativa(inputClassif, classif);
                                        }

                                        if (inputNota && rawNota) {
                                            const notaTratada = tratarNotaCrua(rawNota);
                                            simularDigitacaoNativa(inputNota, notaTratada);
                                        }

                                        preenchidos++;
                                    } else if (bateuRG || bateuNome) {
                                        ignorados++;
                                    }
                                }
                            }
                        });
                    });
                }
            });

            let msg = `Processamento concluído!\n• ${preenchidos} militar(es) preenchido(s) com sucesso.`;
            if (ignorados > 0) {
                msg += `\n• ${ignorados} registro(s) ignorado(s) por divergência entre RG e Nome.`;
            }
            alert(msg);
            drawer.style.display = 'none';
        };
    }
})();