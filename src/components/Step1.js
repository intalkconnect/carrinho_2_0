import React, { useState, useMemo } from 'react';
import { Box, TextField, Button } from '@mui/material';

const validateCpfCnpj = (value) => {
    const cleaned = value.replace(/\D/g, '');

    const validateCPF = (cpf) => {
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

        const calculateDigit = (slice, factor) => {
            const sum = slice.split('').reduce((acc, digit, index) => 
                acc + parseInt(digit) * (factor - index), 0);
            const remainder = (sum * 10) % 11;
            return remainder === 10 || remainder === 11 ? 0 : remainder;
        };

        const firstDigit = calculateDigit(cpf.slice(0, 9), 10);
        const secondDigit = calculateDigit(cpf.slice(0, 10), 11);

        return firstDigit === parseInt(cpf[9]) && secondDigit === parseInt(cpf[10]);
    };

    const validateCNPJ = (cnpj) => {
        if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

        const calculateDigit = (slice, weights) => {
            const sum = slice.split('').reduce((acc, digit, index) => 
                acc + parseInt(digit) * weights[index], 0);
            const remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        };

        const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        const firstDigit = calculateDigit(cnpj.slice(0, 12), weights1);
        const secondDigit = calculateDigit(cnpj.slice(0, 13), weights2);

        return firstDigit === parseInt(cnpj[12]) && secondDigit === parseInt(cnpj[13]);
    };

    return cleaned.length === 11 ? validateCPF(cleaned) : 
           cleaned.length === 14 ? validateCNPJ(cleaned) : 
           false;
};

const maskCpfCnpj = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 11 
        ? cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
        : cleaned.length === 14 
        ? cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        : value;
};

const maskPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10 
        ? cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
        : cleaned.length === 11 
        ? cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
        : value;
};

const Step1 = ({ formData, handleInputChange, nextStep }) => {
    const [errors, setErrors] = useState({});

    const validateFields = useMemo(() => {
        const newErrors = {};
        if (!formData.nomeCompleto?.trim()) newErrors.nomeCompleto = 'Nome completo é obrigatório';
        if (!formData.cpf || !validateCpfCnpj(formData.cpf)) {
            newErrors.cpf = 'CPF ou CNPJ inválido ou obrigatório';
        }
        if (!formData.celular) newErrors.celular = 'Celular é obrigatório';
        return newErrors;
    }, [formData]);

    const handleNext = () => {
        const validationErrors = validateFields;
        if (Object.keys(validationErrors).length === 0) {
            nextStep();
        } else {
            setErrors(validationErrors);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box
                component="form"
                noValidate
                autoComplete="off"
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '600px' }}
            >
                <TextField
                    label="Nome completo"
                    name="nomeCompleto"
                    value={formData.nomeCompleto || ''}
                    onChange={(e) => {
                        handleInputChange(e);
                        setErrors((prev) => ({ ...prev, nomeCompleto: '' }));
                    }}
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.nomeCompleto}
                    helperText={errors.nomeCompleto}
                />

                <TextField
                    label="CPF ou CNPJ"
                    name="cpf"
                    value={maskCpfCnpj(formData.cpf || '')}
                    onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        handleInputChange({ target: { name: 'cpf', value: cleaned } });
                        setErrors((prev) => ({ ...prev, cpf: '' }));
                    }}
                    onBlur={() => {
                        const cleaned = formData.cpf?.replace(/\D/g, '') || '';
                        if ([11, 14].includes(cleaned.length)) {
                            handleInputChange({ target: { name: 'cpf', value: cleaned } });
                        }
                    }}
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.cpf}
                    helperText={errors.cpf}
                />

                <TextField
                    label="RG (opcional)"
                    name="rg"
                    value={formData.rg || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="Celular"
                    name="celular"
                    value={maskPhone(formData.celular || '')}
                    onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        handleInputChange({ target: { name: 'celular', value: cleaned } });
                        setErrors((prev) => ({ ...prev, celular: '' }));
                    }}
                    onBlur={() => {
                        const cleaned = formData.celular?.replace(/\D/g, '') || '';
                        if ([10, 11].includes(cleaned.length)) {
                            handleInputChange({ target: { name: 'celular', value: cleaned } });
                        }
                    }}
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.celular}
                    helperText={errors.celular}
                />

                <TextField
                    label="E-mail (opcional)"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    type="email"
                    InputLabelProps={{ shrink: true }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    sx={{
                        alignSelf: 'flex-end',
                        marginTop: 2,
                        bgcolor: '#00695c',
                        ':hover': { bgcolor: '#004d40' },
                    }}
                >
                    Salvar e avançar
                </Button>
            </Box>
        </Box>
    );
};

export default Step1;
