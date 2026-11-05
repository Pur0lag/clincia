// Superclasse que representa um paciente da clínica.
class Paciente {
    #nome;
    #altura;
    #peso;
    #cidade;

    constructor(nome = "Sem nome", altura = 0, peso = 0, cidade = "Não informada") {
        this.#nome = String(nome).trim();
        this.#altura = Number(altura);
        this.#peso = Number(peso);
        this.#cidade = String(cidade).trim();
    }

    getNome() { return this.#nome; }
    getAltura() { return this.#altura; }
    getPeso() { return this.#peso; }
    getCidade() { return this.#cidade; }

    setNome(nome) { this.#nome = String(nome).trim(); }
    setAltura(altura) { this.#altura = Number(altura); }
    setPeso(peso) { this.#peso = Number(peso); }
    setCidade(cidade) { this.#cidade = String(cidade).trim(); }

    calcularIMC() {
        if (!Number.isFinite(this.#altura) || !Number.isFinite(this.#peso) ||
            this.#altura <= 0 || this.#peso <= 0) return NaN;
        return this.#peso / (this.#altura * this.#altura);
    }

    definirClassificacao() {
        const imc = this.calcularIMC();
        if (!Number.isFinite(imc)) return "Valor inválido";
        if (imc < 18.5) return "Abaixo do peso";
        if (imc < 25) return "Peso normal";
        if (imc < 30) return "Sobrepeso";
        return "Obesidade";
    }
}
