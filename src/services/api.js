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

export const sendClickCta = async (identity) => {
    try {
        const blipUrl = 'https://farmacialantana.http.msging.net/commands';
        const authKey = 'Y29udGF0b2xhbnRhbmE6NHNyT1JUanJzaVg4cFVxbDhxdlQ=';

        const payload = {
            id: crypto.randomUUID(), // Gera um UUID aleatório
            to: 'postmaster@crm.msging.net',
            method: 'merge',
            uri: '/contacts',
            type: 'application/vnd.lime.contact+json',
            resource: {
                identity: `${identity}`,
                extras: {
                    clickCta: 'true'
                }
            }
        };

        const response = await fetch(blipUrl, {
            method: 'POST',
            headers: {
                Authorization: `Key ${authKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Erro ao enviar o identity para o Blip: ${response.status}`);
        }
        const data = await response.json();
    } catch (error) {
        throw error;
    }
};
