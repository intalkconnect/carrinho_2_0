import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
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
    Dialog,
    DialogContent,
    LinearProgress,
    Paper,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PaymentIcon from '@mui/icons-material/Payment';
import PixIcon from '@mui/icons-material/QrCode2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Step3 = ({ finalizeCheckout, totalValue, formData }) => {
    const { register, setValue, watch, formState: { errors }, trigger } = useFormContext();
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [qrcode, setQrcode] = useState('');
    const [pixCopyCode, setPixCopyCode] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [verificationCount, setVerificationCount] = useState(0);
    const [isQrCodeUpdated, setIsQrCodeUpdated] = useState(true);
    const [redirectCountdown, setRedirectCountdown] = useState(5);
    const [showCVV, setShowCVV] = useState(false);
    const [installments, setInstallments] = useState(1);
    const [cardBrand, setCardBrand] = useState('');
    const [progressMessage, setProgressMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    const [disableOptions, setDisableOptions] = useState(false);
    const formaPagamento = watch('formaPagamento');
    const formaPagamentoRef = useRef(formaPagamento);
    const paymentIntervalRef = useRef(null);
    const activePixId = useRef(null);

    const ASaasToken = '$aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjljNjY3NzAzLWVlMzMtNDNlZS1iMDc4LTBhNzc1YjNmM2EwMDo6JGFhY2hfNDRjYzJlNDAtMmM4MC00MmJjLWEwN2MtOWJlNDE5MmEwYTQ5';
    const baseURL = 'https://endpoints-checkout.rzyewu.easypanel.host';

    useEffect(() => {
        register('formaPagamento', { required: 'Selecione uma forma de pagamento' });
        register('nomeCartao', { required: 'Nome no cartão é obrigatório' });
        register('numeroCartao', { required: 'Número do cartão é obrigatório' });
        register('validade', { required: 'Validade é obrigatória' });
        register('cvv', { required: 'CVV é obrigatório' });
        register('email', { required: 'Email é obrigatório' });
        register('mobilePhone', { required: 'Telefone é obrigatório' });
    }, [register]);

    useEffect(() => {
        return () => {
            if (paymentIntervalRef.current) {
                clearInterval(paymentIntervalRef.current);
            }
        };
    }, []);

    const handleSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const updateProgress = (message, value) => {
        setProgressMessage(message);
        setProgress(value);
    };

    const validateCardPCI = (cardNumber) => {
        let sum = 0;
        let isEven = false;
        
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

    const handlePixPayment = async () => {
        setProcessingPayment(true);
        setLoading(true);
        
        try {
            updateProgress('Verificando dados do cliente...', 20);
            let customer = await fetchCustomer();
            
            if (!customer) {
                updateProgress('Criando novo cliente...', 40);
                customer = await createCustomer();
            }
            
            updateProgress('Gerando cobrança PIX...', 60);
            const charge = await createPixCharge(customer.id);
            
            updateProgress('Gerando QR Code...', 80);
            const pixData = await fetchPixQrCode(charge.id);
            
            setQrcode(pixData?.encodedImage || '');
            setPixCopyCode(pixData?.payload || '');
            setIsQrCodeUpdated(true);
            
            updateProgress('QR Code pronto!', 100);
            
            // Iniciar verificação
            let verifications = 0;
            paymentIntervalRef.current = setInterval(async () => {
                verifications++;
                setVerificationCount(verifications);
                
                try {
                    const status = await checkPaymentStatus(charge.id);
                    if (status?.status === 'RECEIVED' || verifications >= 5) {
                        clearInterval(paymentIntervalRef.current);
                        if (status?.status === 'RECEIVED') {
                            setPaymentStatus('PAID');
                            finalizeCheckout();
                            handleRedirect();
                        }
                    }
                } catch (error) {
                    console.error('Erro na verificação:', error);
                }
            }, 15000);
            
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Erro ao gerar PIX. Tente novamente.',
                severity: 'error'
            });
        } finally {
            setProcessingPayment(false);
            setLoading(false);
            setProgress(0);
        }
    };

    const handleCardPayment = async (data) => {
        setProcessingPayment(true);
        setLoading(true);
        
        try {
            updateProgress('Validando dados do cartão...', 20);
            const isValid = await trigger([
                'nomeCartao',
                'numeroCartao',
                'validade',
                'cvv',
                'email',
                'mobilePhone'
            ]);
            
            if (!isValid) {
                throw new Error('Por favor, preencha todos os campos corretamente.');
            }
            
            updateProgress('Processando pagamento...', 40);
            const [expiryMonth, expiryYear] = data.validade.split('/');
            
            updateProgress('Verificando cliente...', 60);
            let customer = await fetchCustomer();
            
            if (!customer) {
                updateProgress('Criando cliente...', 70);
                customer = await createCustomer();
            }
            
            updateProgress('Finalizando transação...', 80);
            const payload = {
                customer: customer.id,
                billingType: 'CREDIT_CARD',
                dueDate: new Date().toISOString().split('T')[0],
                value: installments === 1 ? totalValue : undefined,
                installmentCount: installments > 1 ? installments : undefined,
                totalValue: installments > 1 ? totalValue : undefined,
                creditCard: {
                    holderName: data.nomeCartao,
                    number: data.numeroCartao.replace(/\s/g, ''),
                    expiryMonth,
                    expiryYear: `20${expiryYear}`,
                    ccv: data.cvv,
                },
                creditCardHolderInfo: {
                    name: data.nomeCartao,
                    email: data.email,
                    cpfCnpj: formData.cpf,
                    postalCode: formData.cep,
                    addressNumber: formData.numero,
                    mobilePhone: data.mobilePhone,
                }
            };
            
            const response = await fetch(`${baseURL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': ASaasToken
                },
                body: JSON.stringify(payload)
            });
            
            const responseData = await response.json();
            
            if (response.ok && responseData.status === 'CONFIRMED') {
                updateProgress('Pagamento aprovado!', 100);
                setPaymentStatus('PAID');
                finalizeCheckout();
                handleRedirect();
            } else {
                throw new Error(responseData.errors?.[0]?.description || 'Erro ao processar pagamento');
            }
            
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message,
                severity: 'error'
            });
        } finally {
            setProcessingPayment(false);
            setLoading(false);
            setProgress(0);
        }
    };

    const PaymentProcessingDialog = () => (
        <Dialog open={processingPayment} fullWidth maxWidth="sm">
            <DialogContent>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom color="primary">
                        {progressMessage}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            my: 2,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: '#00695c',
                                borderRadius: 4,
                            }
                        }}
                    />
                    <CircularProgress
                        size={30}
                        sx={{ mt: 2, color: '#00695c' }}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );

    const PaymentSuccessModal = () => (
        <Dialog
            open={paymentStatus === 'PAID'}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    p: 3
                }
            }}
        >
            <DialogContent>
                <Box sx={{ textAlign: 'center' }}>
                    <CheckCircleIcon
                        sx={{
                            fontSize: 80,
                            color: '#00695c',
                            mb: 2
                        }}
                    />
                    <Typography variant="h4" gutterBottom>
                        Pagamento Confirmado!
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Redirecionando em {redirectCountdown} segundos...
                    </Typography>
                    <CircularProgress
                        size={30}
                        sx={{
                            mt: 3,
                            color: '#00695c'
                        }}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );

    return (
        <Box sx={{ p: 3 }}>
            <PaymentProcessingDialog />
            <PaymentSuccessModal />

            <Paper elevation={0} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                    Escolha a forma de pagamento
                </Typography>

                <Box
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = watch();
                        formaPagamento === 'cartaoCredito' ? handleCardPayment(data) : handlePixPayment();
                    }}
                    sx={{
                        mt: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                    }}
                >
                    <FormControl>
                        <RadioGroup
                            row
                            value={formaPagamento || ''}
                            onChange={(e) => setValue('formaPagamento', e.target.value)}
                            sx={{ gap: 4 }}
                        >
                            <FormControlLabel
                                value="cartaoCredito"
                                control={<Radio />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PaymentIcon />
                                        <Typography>Cartão de Crédito</Typography>
                                    </Box>
                                }
                                disabled={loading}
                            />
                            <FormControlLabel
                                value="pix"
                                control={<Radio />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PixIcon />
                                        <Typography>PIX</Typography>
                                    </Box>
                                }
                                disabled={loading}
                            />
                        </RadioGroup>
                    </FormControl>

                    {formaPagamento === 'cartaoCredito' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Nome no Cartão"
                                {...register('nomeCartao')}
                                error={!!errors.nomeCartao}
                                helperText={errors.nomeCartao?.message}
                                disabled={loading}
                                fullWidth
                                size="small"
                            />

                            <TextField
                                label="Número do Cartão"
                                {...register('numeroCartao')}
                                error={!!errors.numeroCartao}
                                helperText={errors.numeroCartao?.message}
                                disabled={loading}
                                fullWidth
                                size="small"
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Validade (MM/AA)"
                                    {...register('validade')}
                                    error={!!errors.validade}
                                    helperText={errors.validade?.message}
                                    disabled={loading}
                                    fullWidth
                                    size="small"
                                />
                            </Box>

                            <TextField
                                select
                                label="Número de Parcelas"
                                value={installments}
                                onChange={(e) => setInstallments(Number(e.target.value))}
                                disabled={loading}
                                fullWidth
                                size="small"
                            >
                                {[1, 2, 3, 4].map((parcel) => (
                                    <MenuItem key={parcel} value={parcel}>
                                        {parcel}x {parcel === 1 ? 'à vista' : 'sem juros'}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Email"
                                {...register('email')}
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                disabled={loading}
                                fullWidth
                                size="small"
                                type="email"
                            />

                            <TextField
                                label="Telefone"
                                {...register('mobilePhone')}
                                error={!!errors.mobilePhone}
                                helperText={errors.mobilePhone?.message}
                                disabled={loading}
                                fullWidth
                                size="small"
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    mt: 2,
                                    bgcolor: '#00695c',
                                    '&:hover': { bgcolor: '#004d40' },
                                    height: 48
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} sx={{ color: 'white' }} />
                                ) : (
                                    'Finalizar Pagamento'
                                )}
                            </Button>
                        </Box>
                    )}

                    {formaPagamento === 'pix' && (
                        <Box sx={{ mt: 2 }}>
                            {loading && !qrcode && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 4 
                                }}>
                                    <CircularProgress size={40} sx={{ color: '#00695c' }} />
                                    <Typography>
                                        Gerando QR Code PIX...
                                    </Typography>
                                </Box>
                            )}

                            {!loading && !qrcode && !isQrCodeUpdated && (
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: '#f8f8f8',
                                        border: '1px dashed #00695c'
                                    }}
                                >
                                    <Typography variant="h6" gutterBottom color="primary">
                                        QR Code Expirado
                                    </Typography>
                                    <Typography sx={{ mb: 3 }}>
                                        O QR Code expirou. Clique abaixo para gerar um novo.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={handlePixPayment}
                                        sx={{
                                            bgcolor: '#00695c',
                                            '&:hover': { bgcolor: '#004d40' }
                                        }}
                                    >
                                        Gerar Novo QR Code
                                    </Button>
                                </Paper>
                            )}

                            {!loading && qrcode && paymentStatus !== 'PAID' && (
                                <Paper 
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: '#f8f8f8',
                                        border: '1px solid #00695c'
                                    }}
                                >
                                    <Typography variant="h6" gutterBottom color="primary">
                                        Pague com PIX
                                    </Typography>
                                    
                                    <Box sx={{ 
                                        bgcolor: 'white',
                                        p: 3,
                                        borderRadius: 1,
                                        mb: 3,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}>
                                        <img
                                            src={`data:image/png;base64,${qrcode}`}
                                            alt="QR Code PIX"
                                            style={{
                                                width: '100%',
                                                maxWidth: 250,
                                                height: 'auto'
                                            }}
                                        />
                                    </Box>

                                    <Button
                                        variant="contained"
                                        onClick={copyToClipboard}
                                        disabled={!qrcode}
                                        sx={{
                                            bgcolor: '#00695c',
                                            '&:hover': { bgcolor: '#004d40' },
                                            width: '100%',
                                            maxWidth: 300,
                                            mb: 2
                                        }}
                                    >
                                        Copiar código PIX
                                    </Button>

                                    <Typography variant="body2" color="textSecondary">
                                        Aguardando pagamento... 
                                        {verificationCount > 0 && ` (Verificação ${verificationCount}/5)`}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

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
