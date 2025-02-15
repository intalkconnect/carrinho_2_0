import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Divider,
    Grid,
    Paper,
} from '@mui/material';
import { AddCircle, Delete } from '@mui/icons-material';
import { Pill, FlaskConical, Package, Milk, Archive, FileSearch, SprayCan, Cookie, ShoppingCart } from "lucide-react";

import { ajustaValor, capitalizeFirstLetter } from '../utils/helpers';
import Modal from './Modal';

const primary = process.env.REACT_APP_PRIMARY_COLOR

const Summary = ({ orcamentos, updateTotalValue, frete = 0 }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalItems, setModalItems] = useState([]);

    const handleIncrement = (orcamento) => {
        orcamento.orc_qt_potes++;
        updateTotalValue(orcamentos);
    };

    const handleDecrement = (orcamento) => {
        if (orcamento.orc_qt_potes > 0) {
            orcamento.orc_qt_potes--;
            updateTotalValue(orcamentos);
        }
    };

    const handleOpenModal = (items) => {
        setModalItems(items);
        setIsModalVisible(true);
        document.activeElement.blur();
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        document.activeElement.blur();
    };

    const getIconByType = (tipo) => {
        // Função para normalizar string (remover acentos e transformar em maiúsculas)
        const normalizeText = (text) =>
            text?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

        const normalizedType = normalizeText(tipo || '');

        if (normalizedType === "CAPSULA") return <Pill color= {primary} />;
        if (["CREME", "LOCAO", "XAMPU", "GEL", "POMADA"].includes(normalizedType)) {
            return <Milk color= {primary} />;
        }
        if (["XAROPE", "SOLUCAO ORAL"].includes(normalizedType)) {
            return <FlaskConical color= {primary} />;
        }
        if (normalizedType === "FILTRO SOLAR") return <SprayCan color= {primary} />;
        if (normalizedType === "BISCOITO MEDICAMENTOSO") return <Cookie color= {primary} />;
        if (normalizedType === "ENVELOPE") return <Package color= {primary} />;

        return <Archive color="disabled" />;
    };

    const totalValue =
        orcamentos.reduce(
            (sum, item) =>
                sum + parseFloat((item.orc_valor_liquido * item.orc_qt_potes).toFixed(2)),
            0
        ) + parseFloat(frete);

    return (
        <>
            <Paper
                id="summary"
                elevation={3}
                sx={{
                    padding: 3,
                    borderRadius: 2,
                    backgroundColor: '#ffffff',
                    color: '#333333',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2  // Adicionando margem bottom
                    }}
                >
                    <ShoppingCart
                        size={24}
                        color= {primary}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            color: primary,
                            fontWeight: 600,
                            fontSize: '1.1rem'
                        }}
                    >
                        Seu Pedido
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2, borderColor: '#e0e0e0' }} />
                <Box>
                    {orcamentos.map((item, index) => (
                        <Grid
                            container
                            key={index}
                            spacing={1}
                            sx={{
                                alignItems: 'center',
                                mb: 2,
                                pb: 2,
                                borderBottom: '1px solid #e0e0e0',
                            }}
                        >
                            {/* Ícone e Nome do Produto */}
                            <Grid item xs={1}>
                                {getIconByType(item.orc_forma_farmac)}
                            </Grid>
                            <Grid item xs={8}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        fontWeight="bold"
                                        noWrap
                                        sx={{ color: '#333333', fontSize: '0.9rem' }}
                                    >
                                        {capitalizeFirstLetter(
                                            item.orcamentoItens[0]?.orc_Produto_Nome.trim() ||
                                            'Produto desconhecido'
                                        )}
                                        <Typography
                                            component="span"
                                            sx={{ fontSize: '0.85rem', color: '#666666', ml: 1 }}
                                        >
                                            ({item.orcamentoItens[0]?.orc_Produto_quantidade || 0}{' '}
                                            {item.orcamentoItens[0]?.orc_Produto_unidade.trim() || ''})
                                        </Typography>
                                    </Typography>
                                    {item.orcamentoItens.length > 1 && (
                                        <IconButton
                                            size="small"
                                            sx={{ color: primary }}
                                            onClick={() => handleOpenModal(item.orcamentoItens)}
                                        >
                                            <FileSearch />
                                        </IconButton>
                                    )}
                                </Box>
                                {item.orcamentoItens.length > 1 && (
                                    <Typography variant="body2" sx={{ color: '#666666' }}>
                                        e demais componentes
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ color: '#666666', mt: 0.5 }}>
                                    {item.orc_volume} {item.orc_Volume_Unidade}
                                </Typography>
                            </Grid>

                            {/* Controle de Quantidade */}
                            <Grid item xs={6}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        gap: 1,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        sx={{ color: primary }}
                                        onClick={() => handleDecrement(item)}
                                    >
                                        <Delete />
                                    </IconButton>
                                    <Typography sx={{ color: '#333333' }}>
                                        {item.orc_qt_potes}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ color: primary }}
                                        onClick={() => handleIncrement(item)}
                                    >
                                        <AddCircle />
                                    </IconButton>
                                </Box>
                            </Grid>

                            {/* Preço */}
                            <Grid item xs={6} textAlign="right">
                                <Typography
                                    variant="body1"
                                    fontWeight="bold"
                                    sx={{ color: primary }}
                                >
                                    R$ {ajustaValor(item.orc_valor_liquido * item.orc_qt_potes)}
                                </Typography>
                            </Grid>
                        </Grid>
                    ))}
                </Box>
                <Box sx={{ textAlign: 'right', mt: 2 }}>
                    {/* Exibição do Frete */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="#666666">
                            Frete:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: primary }}>
                            R$ {ajustaValor(parseFloat(frete))}
                        </Typography>
                    </Box>

                    {/* Exibição do Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="#666666">
                            Total:
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: primary }}>
                            R$ {ajustaValor(parseFloat(totalValue))}
                        </Typography>
                    </Box>

                    {/* Exibição do Parcelamento */}
                    <Typography variant="body2" color="#666666">
                        {(parseFloat(totalValue) + parseFloat(frete)) > 0
                            ? `ou 4x de R$ ${ajustaValor(parseFloat(totalValue) / 4)} sem juros`
                            : 'Adicione itens ao carrinho para calcular o parcelamento'}
                    </Typography>
                </Box>
            </Paper>

            {/* Modal */}
            <Modal isVisible={isModalVisible} onClose={handleCloseModal} items={modalItems} />
        </>
    );
};

export default Summary;
