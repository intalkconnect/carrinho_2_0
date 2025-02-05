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
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Step3 = ({ handleInputChange, finalizeCheckout, totalValue, formData }) => {
    const [formaPagamento, setFormaPagamento] = useState('');
    const formaPagamentoRef = useRef(formaPagamento);
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
    const [disabledFields, setDisabledFields] = useState({
    nomeCartao: false,
    numeroCartao: false,
    validade: false,
    cvv: false,
    });

    const [cardBrand, setCardBrand] = useState('');
    const [showCVV, setShowCVV] = useState(false);
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

    useEffect(() => {
        return () => {
            if (paymentIntervalRef.current) {
                clearInterval(paymentIntervalRef.current);
                paymentIntervalRef.current = null;
            }
        };
    }, []);

    const ASaasToken = '$aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjljNjY3NzAzLWVlMzMtNDNlZS1iMDc4LTBhNzc1YjNmM2EwMDo6JGFhY2hfNDRjYzJlNDAtMmM4MC00MmJjLWEwN2MtOWJlNDE5MmEwYTQ5';
    const baseURL = 'https://endpoints-checkout.rzyewu.easypanel.host';

    const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(pixCopyCode);
            setSnackbar({ open: true, message: 'Código Pix copiado!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao copiar código', severity: 'error' });
        }
    };

    const fetchCustomer = async () => {
        try {
            const response = await fetch(`${baseURL}/customers?cpfCnpj=${formData.cpf}`, {
                headers: {
                    accept: 'application/json',
                    access_token: ASaasToken,
                },
            });
            const data = await response.json();
            return data.data?.[0] || null;
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            throw new Error('Falha ao buscar cliente');
        }
    };

    const createCustomer = async () => {
        try {
            const response = await fetch(`${baseURL}/customers`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    access_token: ASaasToken,
                },
                body: JSON.stringify({
                    name: formData.nomeCompleto,
                    cpfCnpj: formData.cpf,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw new Error('Falha ao criar cliente');
        }
    };

    const maskPhone = (value) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    };

    const maskCardNumber = (number) => {
        const visibleDigits = 4;
        const maskedPortion = number.slice(0, -visibleDigits).replace(/\d/g, '•');
        return maskedPortion + number.slice(-visibleDigits);
    };

    const clearSensitiveData = () => {
        setCardDetails({
            nomeCartao: '',
            numeroCartao: '',
            validade: '',
            cvv: '',
        });
        // // Limpar dados do form após uso
        // if (document.getElementById('cardForm')) {
        //     document.getElementById('cardForm').reset();
        // }
    };

    const toggleCardFields = (disabled) => {
        setDisabledFields({
            nomeCartao: disabled,
            numeroCartao: disabled,
            validade: disabled,
            cvv: disabled,
        });
    };


    const sanitizeCardData = (cardData) => {
        return {
            ...cardData,
            numeroCartao: cardData.numeroCartao.replace(/\s/g, ''),
            nomeCartao: cardData.nomeCartao.trim().toUpperCase(),
            cvv: cardData.cvv.trim(),
            validade: cardData.validade.trim()
        };
    };

    // Função melhorada para validação PCI DSS
    const validateCardPCI = (cardNumber) => {
        // Implementar algoritmo de Luhn
        let sum = 0;
        let isEven = false;

        // Loop de trás para frente
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i), 10);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    };

    const detectCardBrand = (number) => {
        const cleanNumber = number.replace(/\D/g, '');
        if (!cleanNumber) return '';

        // Padrões de identificação das bandeiras
        const patterns = {
            visa: /^4/,
            mastercard: /^5[1-5]/,
            amex: /^3[47]/,
            elo: /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|636369|(506699|5067[0-6]\d|50677[0-8])|(50900\d|5090[1-9]\d|509[1-9]\d{2})|65003[1-3]|(65003[5-9]|65004\d|65005[0-1])|(65040[5-9]|6504[1-3]\d)|(65048[5-9]|65049\d|6505[0-2]\d|65053[0-8])|(65054[1-9]|6505[5-8]\d|65059[0-8])|(65070\d|65071[0-8])|65072[0-7]|(6509[0-9])|(6516[5-7])|(6550[0-5])|655021)/,
            hipercard: /^(384100|384140|384160|606282|637095|637568|60(?!11))/,
            diners: /^3(?:0[0-5]|[68][0-9])[0-9]/
        };

        // Verifica cada padrão
        for (const [brand, pattern] of Object.entries(patterns)) {
            if (pattern.test(cleanNumber)) {
                return brand;
            }
        }

        return '';
    };

    const getCardBrandIcon = (brand) => {
        // Retorna o caminho do ícone baseado na bandeira
        switch (brand) {
            case 'visa':
                return '💳 Visa';
            case 'mastercard':
                return '💳 Mastercard';
            case 'amex':
                return '💳 American Express';
            case 'elo':
                return '💳 Elo';
            case 'hipercard':
                return '💳 Hipercard';
            case 'diners':
                return '💳 Diners Club';
            default:
                return '';
        }
    };

    const createPixCharge = async (customerId) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(dueDate.getHours() - 3);

        try {
            const response = await fetch(`${baseURL}/payments`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    access_token: ASaasToken,
                },
                body: JSON.stringify({
                    billingType: 'PIX',
                    customer: customerId,
                    value: parseFloat(totalValue).toFixed(2),
                    dueDate: dueDate.toISOString().split('T')[0],
                }),
            });
            const data = await response.json();
            activePixId.current = data.id;
            return data;
        } catch (error) {
            console.error('Erro ao criar cobrança PIX:', error);
            throw new Error('Falha ao criar cobrança PIX');
        }
    };

    const deletePixCharge = async (pixId) => {
        try {
            await fetch(`${baseURL}/payments/${pixId}`, {
                method: 'DELETE',
                headers: {
                    accept: 'application/json',
                    access_token: ASaasToken,
                },
            });
        } catch (error) {
            console.error("Erro ao excluir cobrança Pix:", error);
        }
    };

    const fetchPixQrCode = async (paymentId) => {
        try {
            const response = await fetch(`${baseURL}/payments/byPixQrCode?pixQrCode=${paymentId}`, {
                headers: {
                    accept: 'application/json',
                    access_token: ASaasToken,
                },
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar QR Code:', error);
            throw new Error('Falha ao buscar QR Code');
        }
    };

    const checkPaymentStatus = async (paymentId) => {
        if (formaPagamentoRef.current !== 'pix') {
            if (activePixId.current) {
                await deletePixCharge(activePixId.current);
                activePixId.current = null;
            }
            return;
        }

        try {
            const response = await fetch(`${baseURL}/payments/byStatus?status=${paymentId}`, {
                headers: {
                    accept: 'application/json',
                    access_token: ASaasToken,
                },
            });
            return await response.json();
        } catch (error) {
            console.error("Erro ao verificar status do pagamento:", error);
            throw error;
        }
    };

    const handleRedirect = () => {
        const countdown = setInterval(() => {
            setRedirectCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    window.location.href = 'https://wa.me/553192250059';
                }
                return prev - 1;
            });
        }, 1000);
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
                    if (status?.status === 'RECEIVED') {
                        clearInterval(paymentIntervalRef.current);
                        setPaymentStatus('PAID');
                        finalizeCheckout();
                        handleRedirect();
                        setLoading(false);
                    }
                } catch (error) {
                    console.error("Erro na verificação:", error);
                }
            }, 30000);
        } catch (error) {
            console.error("Erro no processo PIX:", error);
            setSnackbar({ open: true, message: 'Erro ao processar PIX.', severity: 'error' });
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

        const handlers = {
            nomeCartao: (val) => ({
                value: val.replace(/[^a-zA-Z\s]/g, '').toUpperCase(),
                error: val.length < 3 ? 'Nome inválido' : null
            }),
            numeroCartao: (val) => {
                const numericValue = val.replace(/\D/g, '');
                const isValid = numericValue.length <= 16 && validateCardPCI(numericValue);
                // Detecta a bandeira quando os primeiros dígitos são digitados
                const brand = detectCardBrand(numericValue);
                setCardBrand(brand);

                return {
                    value: numericValue.length <= 16 ? numericValue.replace(/(.{4})/g, '$1 ').trim() : cardDetails.numeroCartao,
                    error: !isValid ? 'Número de cartão inválido' : null
                };
            },
            validade: (val) => {
                // Remove caracteres não numéricos
                const cleaned = val.replace(/\D/g, '');

                // Limita a 4 dígitos (MMAA)
                const limited = cleaned.slice(0, 4);

                let formatted = limited;
                let error = null;

                // Se temos pelo menos 1 dígito
                if (limited.length >= 1) {
                    const month = parseInt(limited.substring(0, 2), 10);

                    // Se temos 2 ou mais dígitos, valida o mês
                    if (limited.length >= 2) {
                        if (month < 1 || month > 12) {
                            error = 'Mês inválido';
                        }
                        formatted = month.toString().padStart(2, '0');

                        // Adiciona a barra e os dígitos do ano se existirem
                        if (limited.length > 2) {
                            formatted += '/' + limited.substring(2);

                            // Validação completa quando temos mês e ano
                            if (limited.length === 4) {
                                const year = parseInt(limited.substring(2), 10);
                                const currentDate = new Date();
                                const currentYear = currentDate.getFullYear() % 100;
                                const currentMonth = currentDate.getMonth() + 1;

                                if (year < currentYear || (year === currentYear && month < currentMonth)) {
                                    error = 'Cartão vencido';
                                }
                            }
                        }
                    } else {
                        formatted = limited;
                    }
                }

                return {
                    value: formatted,
                    error
                };
            },
            cvv: (val) => ({
                value: val.replace(/\D/g, '').substring(0, 3),
                error: val.length !== 3 ? 'CVV deve ter 3 dígitos' : null
            })
        };

        if (handlers[name]) {
            const { value: newValue, error } = handlers[name](value);
            setCardDetails(prev => ({ ...prev, [name]: newValue }));
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleCardHolderInfoChange = (e) => {
        const { name, value } = e.target;
        const handlers = {
            postalCode: (val) => val.replace(/\D/g, ''),
            addressNumber: (val) => val.replace(/\D/g, ''),
            mobilePhone: maskPhone,
        };

        setCardHolderInfo(prev => ({
            ...prev,
            [name]: handlers[name] ? handlers[name](value) : value,
        }));
    };

    const validateCardDetails = () => {
        const validations = {
            nomeCartao: (v) => !!v || 'O nome no cartão é obrigatório.',
            numeroCartao: (v) => v.replace(/\s/g, '').length === 16 || 'O número do cartão deve ter 16 dígitos.',
            validade: (v) => /^\d{2}\/\d{2}$/.test(v) || 'A validade deve estar no formato MM/AA.',
            cvv: (v) => v.length === 3 || 'O CVV deve ter 3 dígitos.',
            email: (v) => !!v || 'O email é obrigatório.',
            postalCode: (v) => v.length === 8 || 'O CEP deve conter 8 dígitos.',
            addressNumber: (v) => !!v || 'O número do endereço é obrigatório.',
            mobilePhone: (v) => /^(\(\d{2}\) \d{4,5}-\d{4})$/.test(v) || 'O telefone deve estar no formato (XX) XXXXX-XXXX.',
        };

        const newErrors = {};
        Object.entries(validations).forEach(([field, validator]) => {
            const value = field in cardDetails ? cardDetails[field] : cardHolderInfo[field];
            const validationResult = validator(value);
            if (validationResult !== true) {
                newErrors[field] = validationResult;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Modificar handleCardPayment para incluir segurança adicional
    const handleCardPayment = async () => {
    if (!validateCardDetails()) {
        console.log("Erro: Detalhes do cartão inválidos.");
        return;
    }

    setLoading(true);
    toggleCardFields(true);
    try {
        console.log("Iniciando o processo de pagamento...");

        // Converter totalValue para número e garantir 2 casas decimais
        const totalValueParsed = parseFloat(totalValue);
        console.log("Valor total após conversão:", totalValueParsed);

        if (isNaN(totalValueParsed)) {
            console.log("Erro: Valor total inválido.");
            throw new Error("Valor total inválido");
        }

        // Sanitizar dados antes do envio
        const sanitizedCardDetails = sanitizeCardData(cardDetails);
        console.log("Dados do cartão sanitizados:", sanitizedCardDetails);

        // Validar número do cartão usando algoritmo de Luhn
        if (!validateCardPCI(sanitizedCardDetails.numeroCartao)) {
            console.log("Erro: Número de cartão inválido.");
            throw new Error("Número de cartão inválido");
        }

        let customer = await fetchCustomer();
        console.log("Cliente recuperado:", customer);

        if (!customer) {
            console.log("Cliente não encontrado. Criando um novo cliente...");
            customer = await createCustomer();
        }

        if (!customer.id) {
            console.log("Erro: Falha ao obter o ID do cliente.");
            throw new Error("Falha ao obter o ID do cliente.");
        }

        const [expiryMonth, expiryYear] = sanitizedCardDetails.validade.split('/');
        console.log(`Mês de validade: ${expiryMonth}, Ano de validade: ${expiryYear}`);

        // Validar data de expiração
        const currentDate = new Date();
        const cardDate = new Date(2000 + parseInt(expiryYear), parseInt(expiryMonth) - 1);

        if (cardDate < currentDate) {
            console.log("Erro: Cartão expirado.");
            throw new Error("Cartão expirado");
        }

        const remoteIp = await fetch('https://api.ipify.org?format=json')
            .then((res) => res.json())
            .then((data) => data.ip);
        console.log("IP remoto obtido:", remoteIp);

        const payload = {
            customer: customer.id,
            billingType: 'CREDIT_CARD',
            dueDate: new Date().toISOString().split('T')[0],
            value: installments === 1 ? totalValueParsed.toFixed(2) : undefined,
            installmentCount: installments > 1 ? installments : undefined,
            totalValue: installments > 1 ? totalValueParsed.toFixed(2) : undefined,
            creditCard: {
                holderName: sanitizedCardDetails.nomeCartao,
                number: sanitizedCardDetails.numeroCartao,
                expiryMonth,
                expiryYear: `20${expiryYear}`,
                ccv: sanitizedCardDetails.cvv,
            },
            creditCardHolderInfo: {
                name: cardHolderInfo.name,
                email: cardHolderInfo.email,
                cpfCnpj: formData.cpf,
                postalCode: cardHolderInfo.postalCode,
                addressNumber: cardHolderInfo.addressNumber,
                mobilePhone: cardHolderInfo.mobilePhone,
            },
            remoteIp,
        };

        console.log("Payload enviado para o servidor:", JSON.stringify(payload, null, 2));

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
        console.log("Resposta da API de pagamento:", data);

        if (response.ok && data.status === 'CONFIRMED') {
            console.log("Pagamento confirmado!");
            setPaymentStatus('PAID');
            setSnackbar({ open: true, message: 'Pagamento confirmado!', severity: 'success' });
            finalizeCheckout();
            // Limpar dados sensíveis após confirmação
            clearSensitiveData();
            handleRedirect();
        } else {
            const errorMessage = data.errors?.[0]?.description || 'Erro ao processar pagamento. Tente novamente.';
            console.log("Erro ao processar pagamento:", errorMessage);
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
            toggleCardFields(false);
        }
    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        setSnackbar({
            open: true,
            message: `Erro ao processar pagamento: ${error.message || 'Erro desconhecido'}`,
            severity: 'error'
        });
        toggleCardFields(false);
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

            <Typography variant="h6" sx={{ mb: 2 }}>Escolha a forma de pagamento:</Typography>

            <Box
                component="form"
                key={formaPagamento}
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
                    } else if (formaPagamento === 'pix') {
                        handlePixPayment();
                    }
                }}
            >
                <FormControl component="fieldset">
                    <RadioGroup
                        name="formaPagamento"
                        value={formaPagamento}
                        onChange={handleFormChange}
                        sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'center',
                            gap: 2,
                        }}
                    >
                        <FormControlLabel
                            value="cartaoCredito"
                            control={
                                <Radio
                                    sx={{
                                        color: '#00695c',
                                        '&.Mui-checked': { color: '#00695c' }
                                    }}
                                    disabled={disableOptions}
                                />
                            }
                            label="Cartão de Crédito"
                        />
                        <FormControlLabel
                            value="pix"
                            control={
                                <Radio
                                    sx={{
                                        color: '#00695c',
                                        '&.Mui-checked': { color: '#00695c' }
                                    }}
                                />
                            }
                            label="Pix"
                        />
                    </RadioGroup>
                </FormControl>

                {formaPagamento === 'cartaoCredito' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nome no Cartão"
                            name="nomeCartao"
                            value={cardDetails.nomeCartao}
                            onChange={handleCardDetailChange}
                            disabled={disabledFields.nomeCartao}
                            error={!!errors.nomeCartao}
                            helperText={errors.nomeCartao}
                            fullWidth
                            size="small"
                        />
                        <Box sx={{ position: 'relative' }}>
                            <TextField
                                label="Número do Cartão"
                                name="numeroCartao"
                                value={cardDetails.numeroCartao}
                                onChange={handleCardDetailChange}
                                disabled={disabledFields.numeroCartao}
                                error={!!errors.numeroCartao}
                                helperText={errors.numeroCartao || (cardBrand && getCardBrandIcon(cardBrand))}
                                fullWidth
                                size="small"
                                inputProps={{
                                    maxLength: 19,
                                    autoComplete: 'cc-number',
                                    'data-mask': '#### #### #### ####'
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Validade (MM/AA)"
                                name="validade"
                                value={cardDetails.validade}
                                onChange={handleCardDetailChange}
                                disabled={disabledFields.validade}
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
                                disabled={disabledFields.cvv}
                                error={!!errors.cvv}
                                helperText={errors.cvv}
                                type={showCVV ? 'text' : 'password'}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            aria-label="toggle cvv visibility"
                                            onClick={() => setShowCVV(!showCVV)}
                                            edge="end"
                                        >
                                            {showCVV ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    ),
                                }}
                                fullWidth
                                size="small"
                                inputProps={{
                                    maxLength: 3,
                                    autoComplete: 'cc-csc'
                                }}
                            />
                        </Box>
                        <TextField
                            select
                            label="Número de Parcelas"
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                            fullWidth
                            size="small"
                        >
                            {[1, 2, 3, 4].map((parcel) => (
                                <MenuItem key={parcel} value={parcel}>
                                    {parcel}x {parcel === 1 ? 'à vista' : 'sem juros'}
                                </MenuItem>
                            ))}
                        </TextField>
                        {[
                            { label: 'CEP', name: 'postalCode' },
                            { label: 'Número do Endereço', name: 'addressNumber' },
                            { label: 'Email', name: 'email' },
                            { label: 'Telefone', name: 'mobilePhone' },
                        ].map((field) => (
                            <TextField
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                value={cardHolderInfo[field.name]}
                                onChange={handleCardHolderInfoChange}
                                error={!!errors[field.name]}
                                helperText={errors[field.name]}
                                fullWidth
                                size="small"
                            />
                        ))}
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={loading}
                            sx={{
                                bgcolor: '#00695c',
                                ':hover': { bgcolor: '#004d40' },
                                height: 48
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Finalizar Pagamento'}
                        </Button>
                    </Box>
                )}

                {formaPagamento === 'pix' && (
                    <Box sx={{ mt: 2 }}>
                        {loading && !qrcode && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {!loading && !qrcode && !isQrCodeUpdated && (
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    O QR Code expirou. Clique abaixo para gerar um novo.
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={handlePixPayment}
                                    sx={{
                                        bgcolor: '#00695c',
                                        ':hover': { bgcolor: '#004d40' }
                                    }}
                                >
                                    Novo QR Code
                                </Button>
                            </Box>
                        )}

                        {!loading && qrcode && paymentStatus !== 'PAID' && (
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    border: '1px solid #00695c',
                                    borderRadius: 2,
                                    p: 3,
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Escaneie o QR Code para pagar:
                                </Typography>
                                <img
                                    src={`data:image/png;base64,${qrcode}`}
                                    alt="QR Code PIX"
                                    style={{
                                        width: '100%',
                                        maxWidth: 300,
                                        height: 'auto',
                                        margin: '0 auto'
                                    }}
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
                                        maxWidth: 300
                                    }}
                                >
                                    Copiar código PIX
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

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
    );
};

export default Step3;
