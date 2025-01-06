import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

const validateCpfCnpj = (value) => {
    const cleaned = value.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cleaned.length === 11) {
        // Validação de CPF
        if (/^(\d)\1+$/.test(cleaned)) return false;

        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

        return true;
    } else if (cleaned.length === 14) {
        // Validação de CNPJ
        if (/^(\d)\1+$/.test(cleaned)) return false;

        const calc = (x) => {
            const slice = cleaned.slice(0, x);
            let factor = x - 7;
            let sum = 0;

            for (let i = x; i >= 1; i--) {
                const n = slice[x - i];
                sum += n * factor--;
                if (factor < 2) factor = 9;
            }

            const result = 11 - (sum % 11);
            return result > 9 ? 0 : result;
        };

        const digit1 = calc(12);
        const digit2 = calc(13);

        return digit1 === parseInt(cleaned[12]) && digit2 === parseInt(cleaned[13]);
    }

    return false;
};

const maskCpfCnpj = (value) => {
    const cleaned = value.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cleaned.length === 11) {
        return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'); // Máscara de CPF
    } else if (cleaned.length === 14) {
        return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'); // Máscara de CNPJ
    }

    return value;
};

const maskPhone = (value) => {
    const cleaned = value.replace(/\D/g, ''); // Remove caracteres não numéricos
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/); // Aceita 4 ou 5 dígitos no meio
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
};

const Step1 = ({ formData, handleInputChange, nextStep }) => {
    const [errors, setErrors] = useState({});

    const validateFields = () => {
        const newErrors = {};
        if (!formData.nomeCompleto) newErrors.nomeCompleto = 'Nome completo é obrigatório';
        if (!formData.cpf || !validateCpfCnpj(formData.cpf)) {
            newErrors.cpf = 'CPF ou CNPJ inválido ou obrigatório';
        }
        if (!formData.celular) newErrors.celular = 'Celular é obrigatório';
        return newErrors;
    };

    const handleNext = () => {
        const validationErrors = validateFields();
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
                Por favor, complete seu cadastro.
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
                    InputLabelProps={{
                        shrink: true,
                    }}
                    error={!!errors.nomeCompleto}
                    helperText={errors.nomeCompleto}
                />

                <TextField
                    label="CPF ou CNPJ"
                    name="cpf"
                    value={maskCpfCnpj(formData.cpf || '')} // Aplica a máscara ao exibir
                    onChange={(e) => {
                        handleInputChange({ target: { name: 'cpf', value: e.target.value.replace(/\D/g, '') } });
                        setErrors((prev) => ({ ...prev, cpf: '' }));
                    }}
                    onBlur={() => {
                        const cleaned = formData.cpf?.replace(/\D/g, '') || '';
                        if (cleaned.length === 11 || cleaned.length === 14) {
                            handleInputChange({ target: { name: 'cpf', value: cleaned } });
                        }
                    }}
                    fullWidth
                    size="small"
                    InputLabelProps={{
                        shrink: true,
                    }}
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
                    InputLabelProps={{
                        shrink: true,
                    }}
                />

                <TextField
                    label="Celular"
                    name="celular"
                    value={maskPhone(formData.celular || '')}
                    onChange={(e) => {
                        handleInputChange({ target: { name: 'celular', value: e.target.value.replace(/\D/g, '') } });
                        setErrors((prev) => ({ ...prev, celular: '' }));
                    }}
                    onBlur={() => {
                        const cleaned = formData.celular?.replace(/\D/g, '') || '';
                        if (cleaned.length === 11 || cleaned.length === 10) {
                            handleInputChange({ target: { name: 'celular', value: cleaned } });
                        }
                    }}
                    fullWidth
                    size="small"
                    InputLabelProps={{
                        shrink: true,
                    }}
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
                    InputLabelProps={{
                        shrink: true,
                    }}
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
