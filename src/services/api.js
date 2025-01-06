export const consultarAPI = async (id) => {
    const url = `https://devops.dkdevs.com.br/webhook/orcamento?id=${id}`;

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao consultar a API:', error);
        return [];
    }
};

export const consultarCEP = async (cep) => {
    const url = `https://devops.dkdevs.com.br/webhook/endereco?cep=${cep}`;

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
        console.error('Erro ao consultar a API de CEP:', error);
        throw error;
    }
};
