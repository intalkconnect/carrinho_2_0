import { useState, useEffect } from 'react';
import { consultarAPI } from '../services/api'; // Certifique-se de ajustar o caminho

const useOrcamentos = () => {
    const [orcamentos, setOrcamentos] = useState([]);
    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
        const fetchOrcamentos = async () => {
            const id = window.location.pathname.replace('/', '');
            const data = await consultarAPI(id);
            setOrcamentos(data.orcamento || []);
            updateTotalValue(data.orcamento || []);
        };

        fetchOrcamentos();
    }, []);

    const updateTotalValue = (updatedOrcamentos) => {
        const total = updatedOrcamentos.reduce((sum, item) => {
            const valorUnitario = parseFloat(item.orc_valor_liquido || 0);
            const quantidade = parseInt(item.orc_qt_potes || 0, 10);
            return sum + valorUnitario * quantidade;
        }, 0);

        setTotalValue(total);
    };

    return { orcamentos, setOrcamentos, totalValue, updateTotalValue };
};

export default useOrcamentos;
