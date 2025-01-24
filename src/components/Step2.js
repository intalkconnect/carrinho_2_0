import React, { useState } from 'react';
import {
    Box,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    TextField,
    Button,
    MenuItem,
    Typography,
} from '@mui/material';
import { consultarCEP } from '../services/api';
import { Snackbar, Alert } from '@mui/material';

const locaisRetirada = [
    {
        id: 'Centro',
        nome: 'Centro',
        endereco: 'Av. Amazonas, nº 467 - 3º Andar, Centro, Belo Horizonte - Minas Gerais',
        horarios: {
            semana: '09:00 às 18:00',
            sabado: '09:00 às 13:00',
            feriados: 'Exceto Feriados',
        },
        coordenadas: { lat: -19.9196249, lng: -43.9414644 },
        loja: 'Lantana',
    },
    {
        id: 'Locker Mundo Verde',
        nome: 'Locker Mundo Verde',
        endereco: 'Rua Francisco Deslandes, nº 855 - Loja 01, Anchieta, Belo Horizonte - Minas Gerais',
        horarios: {
            semana: '09:00 às 19:00',
            sabado: '09:00 às 14:00',
            feriados: 'Exceto Feriados',
        },
        coordenadas: { lat: -19.9509969, lng: -43.9302836 },
        loja: 'Mundo Verde',
    },
    {
        id: 'Santa Efigênia',
        nome: 'Santa Efigênia',
        endereco: 'Rua Domingos Vieira, nº 319 - Loja 01, Santa Efigênia, Belo Horizonte - Minas Gerais',
        horarios: {
            semana: '08:00 às 18:00',
            sabado: '08:00 às 12:00',
            feriados: 'Exceto Feriados',
        },
        coordenadas: { lat: -19.922898, lng: -43.9332712 },
        loja: 'Lantana',
    },
];

const Step2 = ({ formData, handleInputChange, nextStep }) => {
    const [tipoEntrega, setTipoEntrega] = useState(formData.tipoEntrega || '');
    const [selectedLocal, setSelectedLocal] = useState('');
    const [loadingCep, setLoadingCep] = useState(false);
    const [frete, setFrete] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [metodosFrete, setMetodosFrete] = useState({ pac: null, sedex: null });
    const [disabledFields, setDisabledFields] = useState({
        endereco: true,
        bairro: true,
        cidade: true,
        estado: true,
    });
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info', // 'success', 'error', 'warning', 'info'
    });


    const handleSnackbarClose = () => {
        const clearedFields = {
            cep: '',
            endereco: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
        };

        Object.keys(clearedFields).forEach((key) => {
            handleInputChange({ target: { name: key, value: clearedFields[key] } });
        });

        setSnackbar((prev) => ({ ...prev, open: false }));

    };

    const handleOptionChange = (e) => {
        const value = e.target.value;
        setTipoEntrega(value);
        handleInputChange(e);

        if (value === 'retirada') {
            // Zera o frete e limpa o formulário de entrega
            setFrete(0);
            handleInputChange({ target: { name: 'frete', value: '0.00' } }); // Atualiza no formData
            setErrors((prevErrors) => ({ ...prevErrors, localRetirada: null }));

            // Limpa os campos de endereço
            const clearedFields = {
                cep: '',
                endereco: '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                estado: '',
            };
            Object.keys(clearedFields).forEach((key) => {
                handleInputChange({ target: { name: key, value: clearedFields[key] } });
            });

            // Redefine os campos como editáveis
            setDisabledFields({
                endereco: true,
                bairro: true,
                cidade: true,
                estado: true,
            });

        }
        if (value === 'entrega') {
            setSelectedLocal('')
        }
    };

    const handleLocalChange = (event) => {
        const selectedId = event.target.value;
        setSelectedLocal(selectedId);
        handleInputChange({ target: { name: 'localRetirada', value: selectedId } });

        if (errors.localRetirada) {
            setErrors((prevErrors) => ({ ...prevErrors, localRetirada: null }));
        }
    };

    const handleCepBlur = async () => {
    // Verifica se o CEP tem 8 dígitos
    if (!formData.cep || formData.cep.length !== 8) {
        setSnackbar({ open: true, message: 'CEP inválido. Certifique-se de que possui 8 dígitos.', severity: 'error' });
        return;
    }

    // Cancela requisições ou atualizações anteriores
    let isCancelled = false;

    try {
        // Define o estado de carregamento
        setLoadingCep(true);

        // Faz a busca do CEP
        const data = await consultarCEP(formData.cep);

        // Cancela a atualização se o componente ou efeito foi desmontado
        if (isCancelled) return;

        // Atualiza os campos com os dados do CEP
        handleInputChange({ target: { name: 'endereco', value: data.logradouro || '' } });
        handleInputChange({ target: { name: 'bairro', value: data.bairro || '' } });
        handleInputChange({ target: { name: 'cidade', value: data.localidade || '' } });
        handleInputChange({ target: { name: 'estado', value: data.estado || '' } });

        // Atualiza os campos desabilitados
        setDisabledFields({
            endereco: !!data.logradouro,
            bairro: !!data.bairro,
            cidade: !!data.localidade,
            estado: !!data.estado,
        });

        // Define o frete com base no valor de "local"
        if (data.local) {
            const localFrete = parseFloat(data.local); // Valor do frete do local
            setFrete(localFrete); // Reseta o frete para o valor do "local"
        } else if (data.pac || data.sedex) {
            setMetodosFrete({
                pac: data.pac ? parseFloat(data.pac) : null,
                sedex: data.sedex ? parseFloat(data.sedex) : null,
            });
            handleInputChange({ target: { name: 'metodosFrete', value: metodosFrete || '' } });
        } else {
            setFrete(0); // Reseta para 0 se nenhum frete estiver disponível
        }
    } catch (error) {
        // Exibe mensagem de erro
        setSnackbar({ open: true, message: 'Erro ao buscar o CEP. Verifique e tente novamente.', severity: 'warning' });

        // Libera os campos para edição
        setDisabledFields({
            endereco: false,
            bairro: false,
            cidade: false,
            estado: false,
        });
    } finally {
        // Garante que o estado de carregamento seja desativado
        setLoadingCep(false);

        // Cancela atualizações futuras
        return () => {
            isCancelled = true;
        };
    }
};


    const handleCepChange = (e) => {
        const { value } = e.target;

        // Atualiza o valor do CEP no estado global (formData)
        handleInputChange({ target: { name: 'cep', value } });

        // Redefine o frete e esconde o modal de escolha de frete
        if (value.length === 8) {
            setFrete(0);
            setModalVisible(false);
        }

        // Cancela quaisquer erros de validação de CEP
        if (errors.cep) {
            setErrors((prev) => ({ ...prev, cep: null }));
        }
    };


    const estadosBrasil = [
        'Acre',
        'Alagoas',
        'Amapá',
        'Amazonas',
        'Bahia',
        'Ceará',
        'Distrito Federal',
        'Espírito Santo',
        'Goiás',
        'Maranhão',
        'Mato Grosso',
        'Mato Grosso do Sul',
        'Minas Gerais',
        'Pará',
        'Paraíba',
        'Paraná',
        'Pernambuco',
        'Piauí',
        'Rio de Janeiro',
        'Rio Grande do Norte',
        'Rio Grande do Sul',
        'Rondônia',
        'Roraima',
        'Santa Catarina',
        'São Paulo',
        'Sergipe',
        'Tocantins',
    ];

    const handleNext = () => {
        const newErrors = {};

        // Validação para entrega
        if (tipoEntrega === 'entrega') {
            if (!formData.cep || formData.cep.length !== 8) {
                newErrors.cep = 'CEP é obrigatório e deve conter 8 dígitos.';
            }
            if (!formData.endereco) newErrors.endereco = 'Endereço é obrigatório.';
            if (!formData.numero) newErrors.numero = 'Número é obrigatório.';
            if (!formData.bairro) newErrors.bairro = 'Bairro é obrigatório.';
            if (!formData.cidade) newErrors.cidade = 'Cidade é obrigatória.';
            if (!formData.estado) newErrors.estado = 'Estado é obrigatório.';
        }

        // Validação para retirada
        if (tipoEntrega === 'retirada') {
            if (!selectedLocal) {
                newErrors.localRetirada = 'Por favor, selecione um local para retirada.';
            }
        }

        // Validação caso nenhuma opção tenha sido escolhida
        if (!tipoEntrega) {
            newErrors.tipoEntrega = 'Por favor, selecione uma opção: Entrega ou Retirada.';
        }

        // Exibe os erros se houver algum
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Zera os erros se tudo estiver correto
        setErrors({});

        // Verifica se deve abrir o modal para escolha do método de entrega
        if (tipoEntrega === 'entrega' && frete === 0) {
            if (metodosFrete.pac || metodosFrete.sedex) {
                setModalVisible(true);
                return;
            } else {
                setSnackbar({ open: true, message: 'Nenhum método de entrega disponível para o CEP informado.', severity: 'warning' });
                return;
            }
        }

        // Salva o frete no formData e avança para o próximo passo
        handleInputChange({ target: { name: 'frete', value: frete.toFixed(2) } });
        nextStep();
    };



    const selectedInfo = locaisRetirada.find((local) => local.id === selectedLocal);

    return (
        <Box sx={{ p: 3 }}>
            <Box
                component="form"
                noValidate
                autoComplete="off"
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '600px' }}
            >
                Escolha a melhor opção para receber ou retirar o seu produto.
                <FormControl component="fieldset" sx={{ mb: 3 }} error={!!errors.tipoEntrega}>
                    <RadioGroup
                        name="tipoEntrega"
                        value={tipoEntrega}
                        onChange={handleOptionChange}
                        sx={{ flexDirection: 'row', gap: 2, mt: 1 }}
                    >
                        <FormControlLabel
                            value="entrega"
                            control={<Radio />}
                            label="Entrega"
                        />
                        <FormControlLabel
                            value="retirada"
                            control={<Radio />}
                            label="Retirada"
                        />
                    </RadioGroup>
                    {errors.tipoEntrega && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            {errors.tipoEntrega}
                        </Typography>
                    )}
                </FormControl>


                {tipoEntrega === 'entrega' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="CEP"
                            name="cep"
                            value={formData.cep || ''}
                            onChange={(e) => {
                                handleCepChange(e);

                                // Limpa o erro de CEP se o usuário começar a corrigir
                                if (errors.cep) {
                                    setErrors((prev) => ({ ...prev, cep: null }));
                                }
                            }}
                            onBlur={handleCepBlur}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            error={!!errors.cep}
                            helperText={errors.cep || (loadingCep ? 'Buscando CEP...' : '')}
                        />
                        <TextField
                            label="Endereço"
                            name="endereco"
                            value={formData.endereco || ''}
                            onChange={handleInputChange}
                            disabled={disabledFields.endereco}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <TextField
                            label="Número"
                            name="numero"
                            value={formData.numero || ''}
                            onChange={(e) => {
                                handleInputChange(e);

                                // Limpa o erro de CEP se o usuário começar a corrigir
                                if (errors.numero) {
                                    setErrors((prev) => ({ ...prev, numero: null }));
                                }
                            }}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            error={!!errors.numero}
                            helperText={errors.numero}
                        />
                        <TextField
                            label="Complemento (opcional)"
                            name="complemento"
                            value={formData.complemento || ''}
                            onChange={handleInputChange}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <TextField
                            label="Bairro"
                            name="bairro"
                            value={formData.bairro || ''}
                            onChange={handleInputChange}
                            disabled={disabledFields.bairro}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <TextField
                            label="Cidade"
                            name="cidade"
                            value={formData.cidade || ''}
                            onChange={handleInputChange}
                            disabled={disabledFields.cidade}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <TextField
                            label="Estado"
                            name="estado"
                            select
                            value={formData.estado || ''}
                            onChange={handleInputChange}
                            disabled={disabledFields.estado}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        >
                            <MenuItem value="" disabled>
                                Selecione o Estado
                            </MenuItem>
                            {estadosBrasil.map((estado) => (
                                <MenuItem key={estado} value={estado}>
                                    {estado}
                                </MenuItem>
                            ))}
                        </TextField>

                    </Box>
                )}

                {modalVisible && (
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1300,
                        }}
                    >
                        <Box
                            sx={{
                                width: '300px',
                                bgcolor: 'white',
                                borderRadius: '8px',
                                padding: '16px',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Escolha o tipo de entrega
                            </Typography>
                            {metodosFrete.pac !== null && (
                                <Button
                                    variant="contained"
                                    sx={{ mb: 1, width: '100%' }}
                                    onClick={() => {
                                        setFrete(metodosFrete.pac);
                                        handleInputChange({
                                            target: { name: 'frete', value: metodosFrete.pac.toFixed(2) },
                                        });
                                        handleInputChange({
                                            target: { name: 'tipoFrete', value: 'PAC' }, // Define o tipo de frete como 'PAC'
                                        });
                                        setModalVisible(false);
                                        nextStep(); // Avança ao selecionar PAC
                                    }}
                                >
                                    PAC - R$ {metodosFrete.pac.toFixed(2)}
                                </Button>
                            )}
                            {metodosFrete.sedex !== null && (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    sx={{ width: '100%' }}
                                    onClick={() => {
                                        setFrete(metodosFrete.sedex);
                                        handleInputChange({
                                            target: { name: 'frete', value: metodosFrete.sedex.toFixed(2) },
                                        });
                                        handleInputChange({
                                            target: { name: 'tipoFrete', value: 'SEDEX' }, // Define o tipo de frete como 'SEDEX'
                                        });
                                        setModalVisible(false);
                                        nextStep(); // Avança ao selecionar SEDEX
                                    }}
                                >
                                    SEDEX - R$ {metodosFrete.sedex.toFixed(2)}
                                </Button>
                            )}

                        </Box>
                    </Box>
                )}

                {tipoEntrega === 'retirada' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Local para Retirada"
                            name="localRetirada"
                            select
                            value={selectedLocal}
                            onChange={handleLocalChange}
                            fullWidth
                            size="small"
                            error={!!errors.localRetirada}
                            helperText={errors.localRetirada}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        >
                            <MenuItem value="">Selecione um Local</MenuItem>
                            {locaisRetirada.map((local) => (
                                <MenuItem key={local.id} value={local.id}>
                                    {local.nome}
                                </MenuItem>
                            ))}
                        </TextField>
                        {selectedInfo && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f8e9', borderRadius: 2 }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    📍 {selectedInfo.nome}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    {selectedInfo.endereco}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    🗓️ <b>Segunda à Sexta:</b> {selectedInfo.horarios.semana}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    🗓️ <b>Sábado:</b> {selectedInfo.horarios.sabado}
                                </Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    {selectedInfo.horarios.feriados}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    sx={{
                                        mt: 2,
                                        color: '#00695c',
                                        borderColor: '#00695c',
                                        textTransform: 'none',
                                        ':hover': { bgcolor: '#004d40', color: '#fff' },
                                    }}
                                    onClick={() =>
                                        window.open(
                                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                `${selectedInfo.loja}, ${selectedInfo.endereco}`
                                            )}&query_place_id=${selectedInfo.coordenadas.lat},${selectedInfo.endereco}`
                                        )
                                    }
                                >
                                    Ver no Google Maps
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        sx={{
                            minWidth: 120,
                            bgcolor: '#00695c',
                            ':hover': { bgcolor: '#004d40' },
                        }}
                    >
                        Salvar e avançar
                    </Button>
                </Box>
            </Box>
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

export default Step2;
