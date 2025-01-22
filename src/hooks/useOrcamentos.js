import { useState, useEffect } from 'react';
import { consultarAPI, sendClickCta } from '../services/api'; // Certifique-se de ajustar o caminho
const useOrcamentos = () => {
    const [orcamentos, setOrcamentos] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchOrcamentos = async () => {
            try {
                const id = window.location.pathname.replace('/', '');
                console.log(`ID extraído da URL: ${id}`);

                const data = await consultarAPI(id);
                console.log('Dados recebidos da API:', data);

                setOrcamentos(data.orcamento || []);
                setStatus(data.status || '');
                updateTotalValue(data.orcamento || []);

                if (data.status === 'pending') {
                    console.log('Status é "pending". Verificando orçamentos...');

                    const paciente = data.orcamento?.[0]?.orc_paciente;
                    console.log('Paciente encontrado no orçamento:', paciente);

                    if (paciente) {
                        const pacienteAjustado = paciente.replace('B', '');
                        console.log('Paciente ajustado:', pacienteAjustado);

                        const identity = `${pacienteAjustado}@wa.gw.msging.net`;
                        console.log('Identity construído:', identity);

                        try {
                            await sendClickCta(identity);
                            console.log('Chamada ao sendClickCta concluída com sucesso.');
                        } catch (clickError) {
                            console.error('Erro ao enviar ClickCta:', clickError);
                        }
                    } else {
                        console.warn('Nenhum paciente encontrado nos orçamentos.');
                    }
                } else {
                    console.log('Status não é "pending". Nenhuma ação necessária.');
                }
            } catch (error) {
                console.error('Erro ao buscar orçamentos:', error);
            }
        };

        fetchOrcamentos();
    }, []); // useEffect será executado apenas uma vez ao montar o componente

    const updateTotalValue = (updatedOrcamentos) => {
        console.log('Atualizando valor total com os orçamentos:', updatedOrcamentos);

        const total = updatedOrcamentos.reduce((sum, item) => {
            const valorUnitario = parseFloat(item.orc_valor_liquido || 0);
            const quantidade = parseInt(item.orc_qt_potes || 0, 10);
            return sum + valorUnitario * quantidade;
        }, 0);

        console.log('Valor total calculado:', total);
        setTotalValue(total);
    };

    return { orcamentos, setOrcamentos, totalValue, updateTotalValue, status };
};

export default useOrcamentos;
