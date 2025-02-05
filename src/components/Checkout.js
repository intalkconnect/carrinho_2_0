import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
    Snackbar,
    Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

import Logo1 from '../assets/logo.webp';
import LogoCentro from '../assets/logo1.png';

// Schema de validação
const schema = yup.object().shape({
    nomeCompleto: yup.string().required('Nome completo é obrigatório'),
    cpf: yup.string().required('CPF é obrigatório').min(11, 'CPF inválido'),
    rg: yup.string(),
    celular: yup.string().required('Celular é obrigatório'),
    email: yup.string().email('Email inválido').required('Email é obrigatório'),
    tipoEntrega: yup.string().required('Selecione o tipo de entrega'),
    tipoFrete: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('Selecione o tipo de frete')
    }),
    endereco: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('Endereço é obrigatório')
    }),
    numero: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('Número é obrigatório')
    }),
    bairro: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('Bairro é obrigatório')
    }),
    cidade: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('Cidade é obrigatória')
    }),
    estado: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('Estado é obrigatório')
    }),
    cep: yup.string().when('tipoEntrega', {
        is: 'entrega',
        then: yup.string().required('CEP é obrigatório')
    }),
    localRetirada: yup.string().when('tipoEntrega', {
        is: 'retirada',
        then: yup.string().required('Local de retirada é obrigatório')
    }),
    formaPagamento: yup.string().required('Selecione a forma de pagamento')
});

const Checkout = () => {
    const { orcamentos, updateTotalValue, status } = useOrcamentos();
    const [expanded, setExpanded] = useState('step1');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalItems, setModalItems] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [isStep1Completed, setIsStep1Completed] = useState(false);
    const [isStep2Completed, setIsStep2Completed] = useState(false);

    const methods = useForm({
        resolver: yupResolver(schema),
        mode: 'onChange',
        defaultValues: {
            nomeCompleto: '',
            cpf: '',
            rg: '',
            celular: '',
            email: '',
            tipoEntrega: '',
            tipoFrete: '',
            frete: 0,
            formaPagamento: 'pix'
        }
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    useEffect(() => {
        const originalStyles = {
            margin: document.body.style.margin,
            padding: document.body.style.padding,
            overflowX: document.body.style.overflowX
        };
        
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflowX = 'hidden';
        
        return () => {
            document.body.style.margin = originalStyles.margin;
            document.body.style.padding = originalStyles.padding;
            document.body.style.overflowX = originalStyles.overflowX;
        };
    }, []);

    // Cálculo do valor total
    useEffect(() => {
        const calculateTotal = () => {
            const produtosValidos = orcamentos.filter((produto) => produto.orc_qt_potes > 0);
            const total = produtosValidos.reduce(
                (sum, produto) => sum + produto.orc_qt_potes * produto.orc_valor_liquido,
                0
            ) + parseFloat(methods.getValues('frete') || 0);
            setTotalValue(total);
        };

        calculateTotal();
    }, [orcamentos, methods.watch('frete')]);

    const handleSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
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

    const onSubmit = async (data) => {
        try {
            const produtosValidos = orcamentos.filter((produto) => produto.orc_qt_potes > 0);
            if (produtosValidos.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'Adicione produtos antes de finalizar o pedido.',
                    severity: 'warning'
                });
                return;
            }

            const id = window.location.pathname.replace('/', '');
            const orcPaciente = orcamentos[0]?.orc_paciente;

            const payload = {
                checkout: id,
                dataFim: new Date().toISOString(),
                dadosPessoais: {
                    nomeCompleto: data.nomeCompleto,
                    cpf: data.cpf,
                    rg: data.rg,
                    celular: data.celular,
                    email: data.email,
                },
                enderecoEntrega: data.tipoEntrega === 'entrega' ? {
                    endereco: data.endereco,
                    numero: data.numero,
                    complemento: data.complemento,
                    bairro: data.bairro,
                    cidade: data.cidade,
                    estado: data.estado,
                    cep: data.cep,
                    tipoFrete: data.tipoFrete
                } : "Local",
                localRetirada: data.tipoEntrega === 'retirada' ? data.localRetirada : null,
                formaPagamento: data.formaPagamento,
                produtos: produtosValidos,
                frete: parseFloat(data.frete || 0),
                total: totalValue,
                identity: orcPaciente.replace(/^B/, '') + '@wa.gw.msging.net'
            };

            const response = await fetch('https://endpoints-checkout.rzyewu.easypanel.host/finish-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: 'Pedido finalizado com sucesso!',
                    severity: 'success'
                });
            } else {
                throw new Error('Erro ao finalizar pedido');
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Erro ao finalizar pedido. Tente novamente.',
                severity: 'error'
            });
        }
    };

    // Loading state
    if (!status) {
        return (
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#ffffff',
            }}>
                <img
                    src={LogoCentro}
                    alt="Carregando"
                    style={{
                        maxWidth: '300px',
                        maxHeight: '300px',
                        width: '100%',
                        height: 'auto',
                    }}
                />
            </Box>
        );
    }

    // Status checks
    if (status === 'expired' || status === 'confirmed' || (status !== 'pending' && status !== 'confirmed' && status !== 'expired')) {
        return (
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#f8f8f8',
                color: '#555',
            }}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 80, color: '#ff9800', marginBottom: 2 }} />
                <Typography variant="h5" sx={{ textAlign: 'center', marginBottom: 2 }}>
                    {status === 'expired' ? 'Este link expirou. Por favor, solicite um novo orçamento.' :
                     status === 'confirmed' ? 'Essa compra já foi finalizada.' :
                     'Carrinho não encontrado.'}
                </Typography>
            </Box>
        );
    }

    return (
        <FormProvider {...methods}>
            <Box sx={{
                bgcolor: '#f4f8fa',
                minHeight: '100vh',
                margin: 0,
                padding: 0,
                width: '100vw',
                overflowX: 'hidden',
            }}>
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
                        <Grid item xs={12} md={5} sx={{ order: { xs: 1, md: 2 } }}>
                            <Summary
                                orcamentos={orcamentos}
                                updateTotalValue={updateTotalValue}
                                frete={methods.watch('frete')}
                                onOpenModal={setIsModalVisible}
                            />
                        </Grid>

                        <Grid item xs={12} md={7} sx={{ order: { xs: 2, md: 1 } }}>
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
                                        nextStep={() => {
                                            const isValid = methods.trigger(['nomeCompleto', 'cpf', 'celular', 'email']);
                                            if (isValid) {
                                                setIsStep2Completed(true);
                                                setExpanded('step3');
                                            }
                                        }}
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
                                        prevStep={() => setExpanded('step2')}
                                        finalizeCheckout={methods.handleSubmit(onSubmit)}
                                        totalValue={totalValue}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    </Grid>
                </Container>

                {isModalVisible && (
                    <Modal
                        isVisible={isModalVisible}
                        onClose={() => setIsModalVisible(false)}
                        items={modalItems}
                    />
                )}

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={handleSnackbarClose} 
                        severity={snackbar.severity} 
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </FormProvider>
    );
};

export default Checkout
