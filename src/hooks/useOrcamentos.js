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

                const data = await consultarAPI(id);

                setOrcamentos(data.orcamento || []);
                setStatus(data.status || '');
                updateTotalValue(data.orcamento || []);

                if (data.status === 'pending') {

                    const paciente = data.orcamento?.[0]?.orc_paciente;

                    if (paciente) {
                        const pacienteAjustado = paciente.replace('B', '');

                        const identity = `${pacienteAjustado}@wa.gw.msging.net`;
                        await sendClickCta(identity);                        
                    } 
                }

            } catch (error) {
                console.error('Erro ao buscar orçamentos:', error);
            }
        };

        fetchOrcamentos();
    }, []); // useEffect será executado apenas uma vez ao montar o componente

    const updateTotalValue = (updatedOrcamentos) => {

        const total = updatedOrcamentos.reduce((sum, item) => {
            const valorUnitario = parseFloat(item.orc_valor_liquido || 0);
            const quantidade = parseInt(item.orc_qt_potes || 0, 10);
            return sum + valorUnitario * quantidade;
        }, 0);

        setTotalValue(total);
    };

    return { orcamentos, setOrcamentos, totalValue, updateTotalValue, status };
};

export default useOrcamentos;
