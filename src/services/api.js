export const consultarAPI = async (id) => {
    // Verifica se o ID não foi fornecido
    if (!id) {
        return []; // Retorna um array vazio ou qualquer outro valor adequado
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
        return [];
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
