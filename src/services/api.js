export const consultarAPI = async (id) => {
    // Verifica se o id é inválido ou vazio
    if (!id || id.trim() === "") {
        return []; // Retorna um array vazio sem fazer a requisição
    }

    const url = `https://endpoints-checkout.rzyewu.easypanel.host/orcamento?id=${id}`;

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erro ao chamar a API:", error); // Adicionando log de erro
        return []; // Retorna um array vazio em caso de erro
    }
};


export const consultarCEP = async (cep) => {
    const url = `https://endpoints-checkout.rzyewu.easypanel.host/frete?cep=${cep}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        if (data.erro) {
            throw new Error('CEP não encontrado.');
        }

        return data;
    } catch (error) {
        throw error;
    }
};
