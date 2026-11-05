// Subclasse para pacientes atendidos por convênio.
class PacienteConvenio extends Paciente {
    #carteirinha;

    constructor(nome, altura, peso, cidade, carteirinha = "") {
        super(nome, altura, peso, cidade);
        this.#carteirinha = String(carteirinha).trim();
    }

    getCarteirinha() { return this.#carteirinha; }
    setCarteirinha(carteirinha) { this.#carteirinha = String(carteirinha).trim(); }
}
