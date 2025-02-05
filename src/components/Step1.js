import React from 'react';
import { useFormContext } from 'react-hook-form';
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

const Step1 = ({ nextStep }) => {
    const { register, formState: { errors }, getValues, setValue } = useFormContext();

    const handleFieldChange = (name, value, mask) => {
        const maskedValue = mask ? mask(value) : value;
        setValue(name, maskedValue, { shouldValidate: true });
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
                    {...register('nomeCompleto')}
                    error={!!errors.nomeCompleto}
                    helperText={errors.nomeCompleto?.message}
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="CPF ou CNPJ"
                    {...register('cpf')}
                    onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        handleFieldChange('cpf', cleaned, maskCpfCnpj);
                    }}
                    error={!!errors.cpf}
                    helperText={errors.cpf?.message}
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="RG (opcional)"
                    {...register('rg')}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="Celular"
                    {...register('celular')}
                    onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        handleFieldChange('celular', cleaned, maskPhone);
                    }}
                    error={!!errors.celular}
                    helperText={errors.celular?.message}
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="E-mail"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                    size="small"
                    type="email"
                    required
                    InputLabelProps={{ shrink: true }}
                />

                <Button
                    variant="contained"
                    onClick={nextStep}
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
