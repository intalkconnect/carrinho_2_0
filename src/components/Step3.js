import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Typography,
    CircularProgress,
    Snackbar,
    Alert,
    TextField,
    MenuItem,
} from '@mui/material';

const Step3 = ({ handleInputChange, finalizeCheckout, totalValue, formData }) => {
    const [formaPagamento, setFormaPagamento] = useState('');
    const formaPagamentoRef = useRef(formaPagamento);

    useEffect(() => {
        formaPagamentoRef.current = formaPagamento;
    }, [formaPagamento]);

    const [loading, setLoading] = useState(false);
    const [qrcode, setQrcode] = useState('');
    const [pixCopyCode, setPixCopyCode] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [verificationCount, setVerificationCount] = useState(0);
    const [isQrCodeUpdated, setIsQrCodeUpdated] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [redirectCountdown, setRedirectCountdown] = useState(5);
    const [disableOptions, setDisableOptions] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        nomeCartao: '',
        numeroCartao: '',
        validade: '',
        cvv: '',
    });

    const [installments, setInstallments] = useState(1);
    const [cardHolderInfo, setCardHolderInfo] = useState({
        name: formData.nomeCompleto || '',
        email: '',
        postalCode: formData.cep || '',
        addressNumber: formData.numero || '',
        mobilePhone: '',
    });

    const [errors, setErrors] = useState({});
    const activePixId = useRef(null);
    const paymentIntervalRef = useRef(null);

    const ASaasToken = '$aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjljNjY3NzAzLWVlMzMtNDNlZS1iMDc4LTBhNzc1YjNmM2EwMDo6JGFhY2hfNDRjYzJlNDAtMmM4MC00MmJjLWEwN2MtOWJlNDE5MmEwYTQ5';
    const baseURL = 'https://endpoints-checkout.rzyewu.easypanel.host';

    useEffect(() => {
        return () => {
            // Limpeza de intervalos ao desmontar o componente
            if (paymentIntervalRef.current) {
                clearInterval(paymentIntervalRef.current);
                paymentIntervalRef.current = null;
            }
        };
    }, []);

    const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pixCopyCode);
        setSnackbar({ open: true, message: 'Código Pix copiado!', severity: 'success' });
    };

    const fetchCustomer = async () => {
        const response = await fetch(`${baseURL}/customers?cpfCnpj=${formData.cpf}`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                access_token: ASaasToken,
            },
        });
        const data = await response.json();
        return data.data?.[0] || null;
    };

    const createCustomer = async () => {
        const payload = {
            name: formData.nomeCompleto,
            cpfCnpj: formData.cpf,
        };
        const response = await fetch(`${baseURL}/customers`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                access_token: ASaasToken,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        return data;
    };

    const maskPhone = (value) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    };

    const createPixCharge = async (customerId) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(dueDate.getHours() - 3);
        const formattedDueDate = dueDate.toISOString().split('T')[0];

        const payload = {
            billingType: 'PIX',
            customer: customerId,
            value: parseFloat(totalValue).toFixed(2),
            dueDate: formattedDueDate,
        };

        const response = await fetch(`${baseURL}/payments`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                access_token: ASaasToken,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        activePixId.current = data.id;
        return data;
    };

    const deletePixCharge = async (pixId) => {
        try {
            const response = await fetch(`${baseURL}/payments/${pixId}`, {
                method: 'DELETE',
                headers: {
                    accept: 'application/json',
                    access_token: ASaasToken,
                },
            });
            if (response.ok) {

            } else {
                console.error("Erro ao excluir cobrança Pix.");
            }
        } catch (error) {
            console.error("Erro ao excluir cobrança Pix:", error);
        }
    };

    const fetchPixQrCode = async (paymentId) => {
        const response = await fetch(`${baseURL}/payments/byPixQrCode?pixQrCode=${paymentId}`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                access_token: ASaasToken,
            },
        });
        const data = await response.json();
        return data;
    };

    const checkPaymentStatus = async (paymentId) => {
        try {
            if (formaPagamentoRef.current !== 'pix') {
                if (activePixId.current) {
                    await deletePixCharge(activePixId.current);
                    activePixId.current = null;
                }
                return;
            }

            const response = await fetch(`${baseURL}/payments/byStatus?status=${paymentId}`, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    access_token: ASaasToken,
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro ao verificar o status do pagamento:", error);
            throw error;
        }
    };

    const handlePixPayment = async () => {
        setLoading(true);
        setVerificationCount(0);
        setDisableOptions(true);

        try {
            let customer = await fetchCustomer();
            if (!customer) {
                customer = await createCustomer();
            }

            const charge = await createPixCharge(customer.id);
            const pixData = await fetchPixQrCode(charge.id);

            setQrcode(pixData?.encodedImage || '');
            setPixCopyCode(pixData?.payload || '');
            setIsQrCodeUpdated(true);

            let currentVerificationCount = 0;

            paymentIntervalRef.current = setInterval(async () => {
                currentVerificationCount++;
                setVerificationCount(currentVerificationCount);

                if (currentVerificationCount > 4) {
                    clearInterval(paymentIntervalRef.current);
                    paymentIntervalRef.current = null;

                    if (activePixId.current) {
                        await deletePixCharge(activePixId.current);
                        activePixId.current = null;
                    }

                    setQrcode('');
                    setPixCopyCode('');
                    setIsQrCodeUpdated(false);
                    setSnackbar({
                        open: true,
                        message: 'Limite de verificações atingido. Atualize o QR Code.',
                        severity: 'warning',
                    });
                    setLoading(false);
                    return;
                }

                try {
                    const status = await checkPaymentStatus(charge.id);
                    if (status && status.status === 'RECEIVED') {
                        clearInterval(paymentIntervalRef.current);
                        paymentIntervalRef.current = null;
                        setPaymentStatus('PAID');
                        finalizeCheckout();
                        
                        const countdown = setInterval(() => {
                            setRedirectCountdown((prev) => {
                                if (prev <= 1) {
                                    clearInterval(countdown);
                                    
                                    window.location.href = 'https://wa.me/5521990286724';
                                }
                                return prev - 1;
                            });
                        }, 1000)
                        setLoading(false);
                    }
                } catch (error) {
                    console.error("Erro ao verificar o status do pagamento no intervalo:", error);
                }
            }, 30000);
        } catch (error) {
            console.error("Erro no processo de pagamento PIX:", error);
            setSnackbar({ open: true, message: 'Erro ao processar pagamento PIX.', severity: 'error' });
        } finally {
            setLoading(false);
            setDisableOptions(false);
        }
    };

    const handleFormChange = (event) => {
        const { value } = event.target;

        setFormaPagamento(value);
        handleInputChange({ target: { name: 'formaPagamento', value } });

        if (formaPagamento === 'pix' && value === 'cartaoCredito') {
            if (paymentIntervalRef.current) {
                clearInterval(paymentIntervalRef.current);
                paymentIntervalRef.current = null;
            }

            if (activePixId.current) {
                deletePixCharge(activePixId.current);
                activePixId.current = null;
            }

            setQrcode('');
            setPixCopyCode('');
            setIsQrCodeUpdated(false);
            setPaymentStatus('');
            setVerificationCount(0);
        }

        if (value === 'pix') {
            setQrcode('');
            setPixCopyCode('');
            setIsQrCodeUpdated(true);
            setPaymentStatus('');
            setLoading(true);
            handlePixPayment();
        }
    };

    const handleCardDetailChange = (e) => {
        const { name, value } = e.target;

        if (name === 'nomeCartao') {
            setCardDetails((prev) => ({
                ...prev,
                [name]: value.replace(/[^a-zA-Z\s]/g, '').toUpperCase(),
            }));
        } else if (name === 'numeroCartao') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 16) {
                setCardDetails((prev) => ({
                    ...prev,
                    [name]: numericValue.replace(/(.{4})/g, '$1 ').trim(),
                }));
            }
        } else if (name === 'validade') {
            setCardDetails((prev) => ({
                ...prev,
                [name]: value.replace(/\D/g, '').replace(/^(\d{2})(\d{0,2})$/, '$1/$2').substring(0, 5),
            }));
        } else if (name === 'cvv') {
            setCardDetails((prev) => ({
                ...prev,
                [name]: value.replace(/\D/g, '').substring(0, 3),
            }));
        } else {
            setCardDetails((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleCardHolderInfoChange = (e) => {
        const { name, value } = e.target;

        if (name === 'postalCode') {
            setCardHolderInfo((prev) => ({
                ...prev,
                [name]: value.replace(/\D/g, ''),
            }));
        } else if (name === 'addressNumber') {
            setCardHolderInfo((prev) => ({
                ...prev,
                [name]: value.replace(/\D/g, ''),
            }));
        } else if (name === 'mobilePhone') {
            setCardHolderInfo((prev) => ({
                ...prev,
                [name]: maskPhone(value),
            }));
        } else {
            setCardHolderInfo((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validateCardDetails = () => {
        const newErrors = {};
        if (!cardDetails.nomeCartao) newErrors.nomeCartao = 'O nome no cartão é obrigatório.';
        if (!cardDetails.numeroCartao || cardDetails.numeroCartao.replace(/\s/g, '').length !== 16)
            newErrors.numeroCartao = 'O número do cartão deve ter 16 dígitos.';
        if (!cardDetails.validade || !/^\d{2}\/\d{2}$/.test(cardDetails.validade))
            newErrors.validade = 'A validade deve estar no formato MM/AA.';
        if (!cardDetails.cvv || cardDetails.cvv.length !== 3) newErrors.cvv = 'O CVV deve ter 3 dígitos.';
        if (!cardHolderInfo.email) newErrors.email = 'O email é obrigatório.';
        if (!cardHolderInfo.postalCode || cardHolderInfo.postalCode.length !== 8)
            newErrors.postalCode = 'O CEP deve conter 8 dígitos.';
        if (!cardHolderInfo.addressNumber) newErrors.addressNumber = 'O número do endereço é obrigatório.';
        if (!cardHolderInfo.mobilePhone || !/^(\(\d{2}\) \d{4,5}-\d{4})$/.test(cardHolderInfo.mobilePhone))
            newErrors.mobilePhone = 'O telefone deve estar no formato (XX) XXXXX-XXXX.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCardPayment = async () => {
    if (!validateCardDetails()) return;

    setLoading(true);

    try {
        let customer = await fetchCustomer();
        if (!customer) {
            customer = await createCustomer();
        }

        if (!customer.id) {
            throw new Error("Falha ao obter o ID do cliente.");
        }

        const customerId = customer.id;
        const remoteIp = await fetch('https://api.ipify.org?format=json')
            .then((res) => res.json())
            .then((data) => data.ip);

        const dueDate = new Date().toISOString().split('T')[0];

        // Validação e tratamento dos dados do cartão
        const [expiryMonth, expiryYear] = cardDetails.validade.split('/');
        if (!expiryMonth || !expiryYear) {
            setSnackbar({ open: true, message: 'Formato de validade inválido.', severity: 'error' });
            return;
        }

        const payload = {
            customer: customerId,
            billingType: 'CREDIT_CARD',
            dueDate,
            creditCard: {
                holderName: cardDetails.nomeCartao,
                number: cardDetails.numeroCartao.replace(/\s/g, ''),
                expiryMonth,
                expiryYear: `20${expiryYear}`, // Garantindo que o ano seja no formato correto
                ccv: cardDetails.cvv,
            },
            creditCardHolderInfo: {
                name: cardHolderInfo.name, // Corrigido para o campo 'nome' que deve ser enviado
                email: cardHolderInfo.email,
                cpfCnpj: formData.cpf,
                postalCode: cardHolderInfo.postalCode,
                addressNumber: cardHolderInfo.addressNumber,
                mobilePhone: cardHolderInfo.mobilePhone,
            },
            remoteIp,
        };

        // Validação e definição do valor total e parcelas
        const totalValueParsed = parseFloat(totalValue);
        if (isNaN(totalValueParsed)) {
            setSnackbar({ open: true, message: 'Valor inválido.', severity: 'error' });
            return;
        }

        if (installments === 1) {
            payload.value = totalValueParsed.toFixed(2);
        } else {
            payload.installmentCount = installments;
            payload.totalValue = totalValueParsed.toFixed(2);
        }

        // Enviar o pedido de pagamento
        const response = await fetch(`${baseURL}/payments`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                access_token: ASaasToken,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.status === 'CONFIRMED') {
            setPaymentStatus('PAID');
            setSnackbar({ open: true, message: 'Pagamento confirmado!', severity: 'success' });
            finalizeCheckout();

            const countdown = setInterval(() => {
                setRedirectCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdown);
                        window.location.href = 'https://wa.me/553192250059';
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessage = data.errors[0]?.description || 'Erro ao processar pagamento. Tente novamente.';
                setSnackbar({ open: true, message: errorMessage, severity: 'error' });
            } else {
                setSnackbar({ open: true, message: 'Erro ao processar pagamento. Tente novamente.', severity: 'error' });
            }
        }
    } catch (error) {
        // Trata erros inesperados
        if (error instanceof Error) {
            setSnackbar({ open: true, message: `Erro ao processar pagamento: ${error.message}`, severity: 'error' });
        } else {
            setSnackbar({ open: true, message: 'Erro desconhecido ao processar pagamento.', severity: 'error' });
        }
    } finally {
        setLoading(false);
    }
};


    return (
        <Box sx={{ p: 3 }}>
            {paymentStatus === 'PAID' && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#fff',
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ mb: 2 }}>
                            Pagamento confirmado com sucesso!
                        </Typography>
                        <Typography variant="h6">
                            Você será redirecionado em {redirectCountdown} segundos...
                        </Typography>
                    </Box>
                </Box>
            )}

            Escolha a forma de pagamento:
            <Box
                component="form"
                noValidate
                autoComplete="off"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxWidth: { xs: '100%', md: '400px' },
                    mx: 'auto',
                }}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (formaPagamento === 'cartaoCredito') {
                        handleCardPayment();
                    }
                    if (formaPagamento === 'pix') {
                        handlePixPayment();
                    }
                }}
            >
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                    <RadioGroup
                        name="formaPagamento"
                        value={formaPagamento}
                        onChange={handleFormChange}
                        sx={{
                            mt: 1,
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'center',
                            gap: 2,
                        }}
                    >
                        <FormControlLabel
                            value="cartaoCredito"
                            control={
                                <Radio
                                    sx={{ color: '#00695c', '&.Mui-checked': { color: '#00695c' } }}
                                    disabled={disableOptions}
                                />
                            }
                            label="Cartão de Crédito"
                        />
                        <FormControlLabel
                            value="pix"
                            control={
                                <Radio
                                    sx={{ color: '#00695c', '&.Mui-checked': { color: '#00695c' } }}
                                />
                            }
                            label="Pix"
                        />
                    </RadioGroup>
                </FormControl>

                {formaPagamento === 'cartaoCredito' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mx: 'auto' }}>
                        <TextField
                            label="Nome no Cartão"
                            name="nomeCartao"
                            value={cardDetails.nomeCartao}
                            onChange={handleCardDetailChange}
                            error={!!errors.nomeCartao}
                            helperText={errors.nomeCartao}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Número do Cartão"
                            name="numeroCartao"
                            value={cardDetails.numeroCartao}
                            onChange={handleCardDetailChange}
                            error={!!errors.numeroCartao}
                            helperText={errors.numeroCartao}
                            fullWidth
                            size="small"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Validade (MM/AA)"
                                name="validade"
                                value={cardDetails.validade}
                                onChange={handleCardDetailChange}
                                error={!!errors.validade}
                                helperText={errors.validade}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="CVV"
                                name="cvv"
                                value={cardDetails.cvv}
                                onChange={handleCardDetailChange}
                                error={!!errors.cvv}
                                helperText={errors.cvv}
                                fullWidth
                                size="small"
                            />
                        </Box>
                        <TextField
                            label="Número de Parcelas"
                            name="installments"
                            select
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                            fullWidth
                            size="small"
                        >
                            {[1, 2, 3, 4].map((parcel) => (
                                <MenuItem key={parcel} value={parcel}>
                                    {parcel}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="CEP do Endereço do Cartão"
                            name="postalCode"
                            value={cardHolderInfo.postalCode}
                            onChange={handleCardHolderInfoChange}
                            error={!!errors.postalCode}
                            helperText={errors.postalCode}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Número do Endereço"
                            name="addressNumber"
                            value={cardHolderInfo.addressNumber}
                            onChange={handleCardHolderInfoChange}
                            error={!!errors.addressNumber}
                            helperText={errors.addressNumber}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Email do Portador"
                            name="email"
                            value={cardHolderInfo.email}
                            onChange={handleCardHolderInfoChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="DDD + Telefone"
                            name="mobilePhone"
                            value={cardHolderInfo.mobilePhone}
                            onChange={handleCardHolderInfoChange}
                            error={!!errors.mobilePhone}
                            helperText={errors.mobilePhone}
                            fullWidth
                            size="small"
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={loading}
                            sx={{ bgcolor: '#00695c', ':hover': { bgcolor: '#004d40' } }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Finalizar Pagamento'}
                        </Button>
                    </Box>
                )}

                {formaPagamento === 'pix' && (
                    <>
                        {loading && !qrcode && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {!loading && !qrcode && !isQrCodeUpdated && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mt: 3,
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    O QR Code expirou. Clique abaixo para gerar um novo.
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => handlePixPayment()}
                                    sx={{
                                        bgcolor: '#00695c',
                                        ':hover': { bgcolor: '#004d40' },
                                    }}
                                >
                                    Novo QR Code
                                </Button>
                            </Box>
                        )}

                        {!loading && qrcode && paymentStatus !== 'PAID' && (
                            <Box
                                sx={{
                                    mt: 3,
                                    textAlign: 'center',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    p: 2,
                                    border: '1px solid #00695c',
                                    borderRadius: 2,
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Escaneie o QR Code abaixo para realizar o pagamento:
                                </Typography>
                                <img
                                    src={`data:image/png;base64,${qrcode}`}
                                    alt="QR Code PIX"
                                    style={{ width: '100%', maxWidth: 300, height: 'auto' }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={copyToClipboard}
                                    disabled={!qrcode}
                                    sx={{
                                        mt: 2,
                                        bgcolor: '#00695c',
                                        ':hover': { bgcolor: '#004d40' },
                                        width: '100%',
                                        maxWidth: 300,
                                    }}
                                >
                                    Copiar código PIX
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Step3;
