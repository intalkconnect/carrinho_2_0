import React, { useState, useRef } from 'react';
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
    IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Step3 = ({ prevStep, finalizeCheckout, totalValue }) => {
    const { register, formState: { errors }, watch, setValue, getValues } = useFormContext();
    const [loading, setLoading] = useState(false);
    const [qrcode, setQrcode] = useState('');
    const [pixCopyCode, setPixCopyCode] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [verificationCount, setVerificationCount] = useState(0);
    const [isQrCodeUpdated, setIsQrCodeUpdated] = useState(true);
    const [redirectCountdown, setRedirectCountdown] = useState(5);
    const [showCVV, setShowCVV] = useState(false);
    const [installments, setInstallments] = useState(1);
    const [cardBrand, setCardBrand] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    const formaPagamento = watch('formaPagamento');
    const paymentIntervalRef = useRef(null);
    const activePixId = useRef(null);

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

    const maskCardNumber = (number) => {
        const visibleDigits = 4;
        const maskedPortion = number.slice(0, -visibleDigits).replace(/\d/g, '•');
        return maskedPortion + number.slice(-visibleDigits);
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

    const detectCardBrand = (number) => {
        const cleanNumber = number.replace(/\D/g, '');
        if (!cleanNumber) return '';

        const patterns = {
            visa: /^4/,
            mastercard: /^5[1-5]/,
            amex: /^3[47]/,
            elo: /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|636369|(506699|5067[0-6]\d|50677[0-8])|(50900\d|5090[1-9]\d|509[1-9]\d{2})|65003[1-3]|(65003[5-9]|65004\d|65005[0-1])|(65040[5-9]|6504[1-3]\d)|(65048[5-9]|65049\d|6505[0-2]\d|65053[0-8])|(65054[1-9]|6505[5-8]\d|65059[0-8])|(65070\d|65071[0-8])|65072[0-7]|(6509[0-9])|(6516[5-7])|(6550[0-5])|655021)/,
            hipercard: /^(384100|384140|384160|606282|637095|637568|60(?!11))/,
            diners: /^3(?:0[0-5]|[68][0-9])[0-9]/
        };

        for (const [brand, pattern] of Object.entries(patterns)) {
            if (pattern.test(cleanNumber)) {
                return brand;
            }
        }

        return '';
    };

    const getCardBrandIcon = (brand) => {
        const brandIcons = {
            visa: '💳 Visa',
            mastercard: '💳 Mastercard',
            amex: '💳 American Express',
            elo: '💳 Elo',
            hipercard: '💳 Hipercard',
            diners: '💳 Diners Club'
        };
        return brandIcons[brand] || '';
    };

    const handlePixPayment = async () => {
        setLoading(true);
        try {
            // Implementação do pagamento PIX
            // ... (mantido o código existente do PIX)
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Erro ao processar PIX. Tente novamente.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCardPayment = async () => {
        if (!validateCardPCI(getValues('numeroCartao'))) {
            setSnackbar({
                open: true,
                message: 'Número de cartão inválido',
                severity: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // Implementação do pagamento com cartão
            // ... (mantido o código existente do cartão)
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Erro ao processar pagamento. Tente novamente.',
                severity: 'error'
            });
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
                noValidate
                autoComplete="off"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxWidth: { xs: '100%', md: '400px' },
                    mx: 'auto',
                }}
            >
                <FormControl>
                    <RadioGroup
                        {...register('formaPagamento')}
                        sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'center',
                            gap: 2,
                        }}
                    >
                        <FormControlLabel
                            value="cartaoCredito"
                            control={<Radio />}
                            label="Cartão de Crédito"
                        />
                        <FormControlLabel
                            value="pix"
                            control={<Radio />}
                            label="Pix"
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
                            fullWidth
                            size="small"
                        />

                        <TextField
                            label="Número do Cartão"
                            {...register('numeroCartao', {
                                onChange: (e) => {
                                    const brand = detectCardBrand(e.target.value);
                                    setCardBrand(brand);
                                }
                            })}
                            error={!!errors.numeroCartao}
                            helperText={errors.numeroCartao?.message || (cardBrand && getCardBrandIcon(cardBrand))}
                            fullWidth
                            size="small"
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Validade (MM/AA)"
                                {...register('validade')}
                                error={!!errors.validade}
                                helperText={errors.validade?.message}
                                fullWidth
                                size="small"
                            />

                            <TextField
                                label="CVV"
                                {...register('cvv')}
                                type={showCVV ? 'text' : 'password'}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            onClick={() => setShowCVV(!showCVV)}
                                            edge="end"
                                        >
                                            {showCVV ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    ),
                                }}
                                error={!!errors.cvv}
                                helperText={errors.cvv?.message}
                                fullWidth
                                size="small"
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

                        <Button
                            variant="contained"
                            onClick={handleCardPayment}
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

                        {!loading && qrcode && (
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={prevStep}
                        sx={{ color: '#00695c', borderColor: '#00695c' }}
                    >
                        Voltar
                    </Button>
                </Box>
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
