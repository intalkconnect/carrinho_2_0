import React, { useState, useEffect } from 'react';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Summary from './Summary';
import Modal from './Modal';
import useOrcamentos from '../hooks/useOrcamentos';
import {
    Box,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    AppBar,
    Toolbar,
    Container,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Snackbar, Alert } from '@mui/material';
// Importe as imagens
import Logo1 from '../assets/logo.webp';

const Checkout = () => {
    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflowX = 'hidden';
    }, []);

    const { orcamentos, updateTotalValue } = useOrcamentos();
    const [expanded, setExpanded] = useState('step1');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalItems, setModalItems] = useState([]);

    const [formData, setFormData] = useState({
        nomeCompleto: '',
        cpf: '',
        rg: '',
        celular: '',
        email: '',
        tipoEntrega: '',
        frete: 0,
    });

    const [isStep1Completed, setIsStep1Completed] = useState(false);
    const [isStep2Completed, setIsStep2Completed] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info', // 'success', 'error', 'warning', 'info'
    });

    const handleSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // Função para coletar dados e enviar para a API
    const handleCheckoutSubmission = () => {
        // Verifica se `orcamentos` é válido e é uma array
        if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
            setSnackbar({
                open: true, message: 'Nenhum produto selecionado. Adicione produtos antes de finalizar o pedido.', severity: 'info'
            });
            return;
        }

        // Filtra os produtos válidos (quantidade maior que 0)
        const produtosValidos = orcamentos.filter((produto) => produto.orc_qt_potes > 0);

        if (produtosValidos.length === 0) {
            setSnackbar({
                open: true, message: 'Nenhum produto com quantidade válida. Ajuste o carrinho antes de finalizar o pedido.', severity: 'warning'
            });
            return;
        }
        const id = window.location.pathname.replace('/', '');

        // Monta o payload
        const payload = {
            checkout: id,
            dataFim: new Date().toISOString(),
            dadosPessoais: {
                nomeCompleto: formData.nomeCompleto,
                cpf: formData.cpf,
                rg: formData.rg,
                celular: formData.celular,
                email: formData.email,
            },
            enderecoEntrega: formData.tipoEntrega === 'entrega' ? {
                endereco: formData.endereco,
                numero: formData.numero,
                complemento: formData.complemento,
                bairro: formData.bairro,
                cidade: formData.cidade,
                estado: formData.estado,
                cep: formData.cep,
            } : null,
            localRetirada: formData.tipoEntrega === 'retirada' ? formData.localRetirada : null,
            formaPagamento: formData.formaPagamento,
            produtos: produtosValidos.map((produto) => ({
                nome: produto.orcamentoItens[0]?.orc_Produto_Nome || 'Produto desconhecido',
                quantidade: produto.orc_qt_potes,
                preco: produto.orc_valor_liquido,
            })),
            frete: parseFloat(formData.frete),
            total: produtosValidos.reduce((sum, produto) => sum + produto.orc_qt_potes * produto.orc_valor_liquido, 0) + parseFloat(formData.frete),
        };

        // Envia o payload para a API
        fetch('https://devops.dkdevs.com.br/webhook/finish-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (response.ok) {
                    setSnackbar({
                        open: true, message: 'Pedido finalizado com sucesso!', severity: 'success'
                    });
                } else {
                    setSnackbar({ open: true, message: 'Erro ao finalizar pedido. Tente novamente.', severity: 'error' });
                }
            })
            .catch(() => {
                setSnackbar({ open: true, message: 'Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.', severity: 'error' });
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        if (
            (panel === 'step2' && !isStep1Completed) ||
            (panel === 'step3' && !isStep2Completed)
        ) {
            return;
        }
        setExpanded(isExpanded ? panel : false);
    };

    const handleStep1Complete = () => {
        if (formData.nomeCompleto && formData.cpf && formData.celular) {
            setIsStep1Completed(true);
            setExpanded('step2');
        } else {
            setSnackbar({
                open: true, message: 'Por favor, preencha todos os campos obrigatórios.', severity: 'warning'
            });
        }
    };

    const handleStep2Complete = () => {
        setIsStep2Completed(true);
        setExpanded('step3');
    };

    const handleOpenModal = (items) => {
        setModalItems(items);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    return (
        <Box
            sx={{
                bgcolor: '#f4f8fa',
                minHeight: '100vh',
                margin: 0,
                padding: 0,
                width: '100vw',
                overflowX: 'hidden',
            }}
        >
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    bgcolor: '#00BFBE',
                    margin: 0,
                    padding: 0,
                }}
            >
                <Toolbar>
                    <Container sx={{
                        padding: 0,
                        maxWidth: '100%',
                    }}>
                        <img src={Logo1} alt="Logo 1" style={{ height: 80 }} />
                    </Container>
                </Toolbar>
            </AppBar>
            <Container sx={{ marginTop: 3, marginBottom: 3 }}>
                <Grid container spacing={3}>
                    <Grid
                        item
                        xs={12}
                        md={5}
                        sx={{
                            order: { xs: 1, md: 2 },
                        }}
                    >
                        <Summary
                            orcamentos={orcamentos}
                            updateTotalValue={updateTotalValue}
                            frete={formData.frete}
                            onOpenModal={handleOpenModal}
                        />
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        md={7}
                        sx={{
                            order: { xs: 2, md: 1 },
                        }}
                    >
                        <Accordion
                            expanded={expanded === 'step1'}
                            onChange={handleAccordionChange('step1')}
                            sx={{
                                marginBottom: 2,
                                border: '1px solid #ddd',
                                borderRadius: 2,
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: '#00695c' }} />}
                                sx={{ bgcolor: expanded === 'step1' ? '#e8f5e9' : '#ffffff' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isStep1Completed ? (
                                        <CheckCircleIcon sx={{ color: '#81c784' }} />
                                    ) : (
                                        <RadioButtonUncheckedIcon sx={{ color: '#00695c' }} />
                                    )}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00695c' }}>
                                        Dados Pessoais
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Step1
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    nextStep={handleStep1Complete}
                                />
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === 'step2'}
                            onChange={handleAccordionChange('step2')}
                            disabled={!isStep1Completed}
                            sx={{
                                marginBottom: 2,
                                border: '1px solid #ddd',
                                borderRadius: 2,
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: '#00695c' }} />}
                                sx={{ bgcolor: expanded === 'step2' ? '#e8f5e9' : '#ffffff' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isStep2Completed ? (
                                        <CheckCircleIcon sx={{ color: '#81c784' }} />
                                    ) : (
                                        <RadioButtonUncheckedIcon sx={{ color: '#00695c' }} />
                                    )}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00695c' }}>
                                        Entrega ou Retirada
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Step2
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    nextStep={handleStep2Complete}
                                    prevStep={() => setExpanded('step1')}
                                />
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === 'step3'}
                            onChange={handleAccordionChange('step3')}
                            disabled={!isStep2Completed}
                            sx={{
                                marginBottom: 2,
                                border: '1px solid #ddd',
                                borderRadius: 2,
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: '#00695c' }} />}
                                sx={{ bgcolor: expanded === 'step3' ? '#e8f5e9' : '#ffffff' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RadioButtonUncheckedIcon sx={{ color: '#00695c' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00695c' }}>
                                        Formas de Pagamento
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Step3
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    prevStep={() => setExpanded('step2')}
                                    finalizeCheckout={handleCheckoutSubmission} // Passa a função
                                />
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                </Grid>
            </Container>

            {isModalVisible && (
                <Modal
                    isVisible={isModalVisible}
                    onClose={handleCloseModal}
                    items={modalItems}
                />
            )}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000} // Fecha automaticamente após 6 segundos
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Posição no topo central
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>

    );
};

export default Checkout;
