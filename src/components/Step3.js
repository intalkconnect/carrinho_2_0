import React, { useState } from 'react';
import { Box, Button, FormControl, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';

const Step3 = ({ handleInputChange, finalizeCheckout }) => {
    const [formaPagamento, setFormaPagamento] = useState('');

    const handleFormChange = (event) => {
        const { value } = event.target;
        setFormaPagamento(value);
        handleInputChange({ target: { name: 'formaPagamento', value } });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!formaPagamento) {
            alert('Por favor, selecione uma forma de pagamento.');
            return;
        }
        finalizeCheckout(); // Chama a função para enviar os dados para a API
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Escolha a forma de pagamento:
            </Typography>
            <Box
                component="form"
                noValidate
                autoComplete="off"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '600px' }}
            >
                {/* Formas de pagamento */}
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                    <RadioGroup
                        name="formaPagamento"
                        value={formaPagamento}
                        onChange={handleFormChange}
                        sx={{ mt: 1, flexDirection: 'row', gap: 2 }}
                    >
                        <FormControlLabel
                            value="cartaoCredito"
                            control={
                                <Radio
                                    sx={{
                                        color: '#00695c',
                                        '&.Mui-checked': { color: '#00695c' },
                                    }}
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
                                        '&.Mui-checked': { color: '#00695c' },
                                    }}
                                />
                            }
                            label="Pix"
                        />
                        <FormControlLabel
                            value="boleto"
                            control={
                                <Radio
                                    sx={{
                                        color: '#00695c',
                                        '&.Mui-checked': { color: '#00695c' },
                                    }}
                                />
                            }
                            label="Boleto Bancário"
                        />
                    </RadioGroup>
                </FormControl>

                {/* Botão de Finalizar */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        sx={{
                            minWidth: 120,
                            bgcolor: '#00695c',
                            ':hover': { bgcolor: '#004d40' },
                        }}
                    >
                        Finalizar
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Step3;
