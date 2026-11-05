"use strict";

class PainelApp {
    constructor() {
        this.formulario = document.getElementById("form-paciente");
        this.corpoTabela = document.getElementById("tabela-resultados");
        this.nomeInput = document.getElementById("nome");
        this.alturaInput = document.getElementById("altura");
        this.pesoInput = document.getElementById("peso");
        this.tipoInput = document.getElementById("tipo-paciente");
        this.carteirinhaInput = document.getElementById("carteirinha");
        this.cepInput = document.getElementById("cep");
        this.cidadeInput = document.getElementById("cidade");
        this.mensagem = document.getElementById("mensagem");
        this.botaoLimpar = document.getElementById("limpar-todos");
        this.chaveStorage = "painelSaudePacientes";
        this.pacientes = this.carregarPacientes();

        this.registrarEventos();
        this.atualizarCampoCarteirinha();
        this.atualizarTabela();
    }

    registrarEventos() {
        this.formulario.addEventListener("submit", (event) => this.adicionarPaciente(event));
        this.tipoInput.addEventListener("change", () => this.atualizarCampoCarteirinha());
        this.cepInput.addEventListener("blur", () => this.buscarCEP());
        this.cepInput.addEventListener("input", () => {
            const numeros = this.cepInput.value.replace(/\D/g, "").slice(0, 8);
            this.cepInput.value = numeros.length > 5
                ? numeros.slice(0, 5) + "-" + numeros.slice(5)
                : numeros;
            this.cidadeInput.value = "";
        });
        this.botaoLimpar.addEventListener("click", () => this.limparTodos());
    }

    mostrarMensagem(texto, tipo = "info") {
        this.mensagem.textContent = texto;
        this.mensagem.className = "mensagem " + tipo;
    }

    atualizarCampoCarteirinha() {
        const usaConvenio = this.tipoInput.value === "convenio";
        this.carteirinhaInput.disabled = !usaConvenio;
        this.carteirinhaInput.required = usaConvenio;
        if (!usaConvenio) this.carteirinhaInput.value = "";
    }

    async buscarCEP() {
        const cep = this.cepInput.value.replace(/\D/g, "");
        if (!cep) {
            this.cidadeInput.value = "";
            return;
        }
        if (!/^\d{8}$/.test(cep)) {
            this.cidadeInput.value = "";
            this.mostrarMensagem("CEP inválido. Digite os 8 números.", "erro");
            return;
        }

        this.mostrarMensagem("Consultando CEP...", "info");
        this.cepInput.disabled = true;
        try {
            const resposta = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
            if (!resposta.ok) throw new Error("Falha na consulta");
            const dados = await resposta.json();
            if (dados.erro) {
                this.cidadeInput.value = "";
                this.mostrarMensagem("CEP não encontrado. Confira o número digitado.", "erro");
                return;
            }
            this.cidadeInput.value = dados.localidade + " / " + dados.uf;
            this.mostrarMensagem("CEP localizado com sucesso.", "sucesso");
        } catch (erro) {
            console.error(erro);
            this.cidadeInput.value = "";
            this.mostrarMensagem("Não foi possível consultar o CEP. Verifique sua conexão com a internet.", "erro");
        } finally {
            this.cepInput.disabled = false;
        }
    }

    capturarDados() {
        return {
            nome: this.nomeInput.value.trim(),
            altura: Number(this.alturaInput.value),
            peso: Number(this.pesoInput.value),
            tipo: this.tipoInput.value,
            carteirinha: this.carteirinhaInput.value.trim(),
            cidade: this.cidadeInput.value.trim()
        };
    }

    validarDados(dados) {
        if (!dados.nome || !Number.isFinite(dados.altura) || !Number.isFinite(dados.peso) ||
            dados.altura <= 0 || dados.altura > 2.8 || dados.peso <= 0 || dados.peso > 500) {
            this.mostrarMensagem("Preencha nome, altura e peso com valores válidos.", "erro");
            return false;
        }
        if (!dados.cidade) {
            this.mostrarMensagem("Consulte um CEP válido antes de cadastrar o paciente.", "erro");
            this.cepInput.focus();
            return false;
        }
        if (dados.tipo === "convenio" && !dados.carteirinha) {
            this.mostrarMensagem("Informe o número da carteirinha do convênio.", "erro");
            this.carteirinhaInput.focus();
            return false;
        }
        return true;
    }

    adicionarPaciente(event) {
        event.preventDefault();
        const dados = this.capturarDados();
        if (!this.validarDados(dados)) return;

        const id = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random().toString(16).slice(2);

        const paciente = dados.tipo === "convenio"
            ? new PacienteConvenio(dados.nome, dados.altura, dados.peso, dados.cidade, dados.carteirinha)
            : new Paciente(dados.nome, dados.altura, dados.peso, dados.cidade);

        this.pacientes.push({
            id,
            nome: paciente.getNome(),
            altura: paciente.getAltura(),
            peso: paciente.getPeso(),
            cidade: paciente.getCidade(),
            tipo: dados.tipo,
            carteirinha: dados.tipo === "convenio" ? paciente.getCarteirinha() : ""
        });

        this.salvarPacientes();
        this.atualizarTabela();
        this.formulario.reset();
        this.atualizarCampoCarteirinha();
        this.cidadeInput.value = "";
        this.mostrarMensagem("Paciente cadastrado com sucesso.", "sucesso");
        this.nomeInput.focus();
    }

    salvarPacientes() {
        try {
            localStorage.setItem(this.chaveStorage, JSON.stringify(this.pacientes));
        } catch (erro) {
            console.error(erro);
            this.mostrarMensagem("Não foi possível salvar os dados neste navegador.", "erro");
        }
    }

    carregarPacientes() {
        try {
            const dados = JSON.parse(localStorage.getItem(this.chaveStorage) || "[]");
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            console.error(erro);
            return [];
        }
    }

    criarCelula(linha, valor) {
        const celula = document.createElement("td");
        celula.textContent = valor;
        linha.appendChild(celula);
    }

    atualizarTabela() {
        this.corpoTabela.innerHTML = "";
        if (this.pacientes.length === 0) {
            const linha = document.createElement("tr");
            const celula = document.createElement("td");
            celula.colSpan = 9;
            celula.className = "vazio";
            celula.textContent = "Nenhum paciente cadastrado.";
            linha.appendChild(celula);
            this.corpoTabela.appendChild(linha);
            return;
        }

        this.pacientes.forEach((dados) => {
            const paciente = dados.tipo === "convenio"
                ? new PacienteConvenio(dados.nome, dados.altura, dados.peso, dados.cidade, dados.carteirinha)
                : new Paciente(dados.nome, dados.altura, dados.peso, dados.cidade);

            const linha = document.createElement("tr");
            const valores = [
                paciente.getNome(),
                dados.tipo === "convenio" ? "Convênio" : "Particular",
                dados.carteirinha || "—",
                paciente.getCidade(),
                paciente.getAltura().toFixed(2),
                paciente.getPeso().toFixed(1),
                paciente.calcularIMC().toFixed(2),
                paciente.definirClassificacao()
            ];
            valores.forEach((valor) => this.criarCelula(linha, valor));

            const celulaAcao = document.createElement("td");
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "botao-excluir";
            botao.textContent = "Excluir";
            botao.setAttribute("aria-label", "Excluir " + paciente.getNome());
            botao.addEventListener("click", () => this.excluirPaciente(dados.id));
            celulaAcao.appendChild(botao);
            linha.appendChild(celulaAcao);
            this.corpoTabela.appendChild(linha);
        });
    }

    excluirPaciente(id) {
        this.pacientes = this.pacientes.filter((paciente) => paciente.id !== id);
        this.salvarPacientes();
        this.atualizarTabela();
        this.mostrarMensagem("Paciente excluído.", "sucesso");
    }

    limparTodos() {
        if (this.pacientes.length === 0) {
            this.mostrarMensagem("Não há pacientes para excluir.", "info");
            return;
        }
        if (!window.confirm("Tem certeza de que deseja excluir todos os pacientes salvos?")) return;
        this.pacientes = [];
        this.salvarPacientes();
        this.atualizarTabela();
        this.mostrarMensagem("Todos os cadastros foram removidos.", "sucesso");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new PainelApp();
});
