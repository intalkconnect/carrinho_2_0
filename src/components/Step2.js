import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
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
    Snackbar,
    Alert,
    FormLabel,
    FormHelperText
} from '@mui/material';
import { consultarCEP } from '../services/api';

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

const estadosBrasil = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

const Step2 = ({ nextStep, prevStep }) => {
    const { register, formState: { errors }, watch, setValue, getValues } = useFormContext();
    const [loadingCep, setLoadingCep] = useState(false);
    const [disabledFields, setDisabledFields] = useState({
        endereco: true,
        bairro: true,
        cidade: true,
        estado: true,
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [metodosFrete, setMetodosFrete] = useState({ pac: null, sedex: null });

    const tipoEntrega = watch('tipoEntrega');
    const selectedLocal = watch('localRetirada');

    const handleCepBlur = async () => {
        const cep = getValues('cep');
        if (!cep || cep.length !== 8) {
            setSnackbar({
                open: true,
                message: 'CEP inválido. Certifique-se de que possui 8 dígitos.',
                severity: 'error'
            });
            return;
        }

        setLoadingCep(true);
        try {
            const data = await consultarCEP(cep);
            
            setValue('endereco', data.logradouro || '');
            setValue('bairro', data.bairro || '');
            setValue('cidade', data.localidade || '');
            setValue('estado', data.estado || '');

            setDisabledFields({
                endereco: !!data.logradouro,
                bairro: !!data.bairro,
                cidade: !!data.localidade,
                estado: !!data.estado,
            });

            if (data.local) {
                setValue('frete', parseFloat(data.local));
            } else if (data.pac || data.sedex) {
                setMetodosFrete({
                    pac: data.pac ? parseFloat(data.pac) : null,
                    sedex: data.sedex ? parseFloat(data.sedex) : null,
                });
                setModalVisible(true);
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Erro ao buscar o CEP. Verifique e tente novamente.',
                severity: 'warning'
            });
            setDisabledFields({
                endereco: false,
                bairro: false,
                cidade: false,
                estado: false,
            });
        } finally {
            setLoadingCep(false);
        }
    };

    const selectedInfo = locaisRetirada.find(local => local.id === selectedLocal);

    return (
        <Box sx={{ p: 3 }}>
            <Box 
                component="form" 
                noValidate 
                autoComplete="off" 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2, 
                    maxWidth: '600px' 
                }}
            >
                <FormControl error={!!errors.tipoEntrega}>
                    <FormLabel>Tipo de Entrega</FormLabel>
                    <RadioGroup row {...register('tipoEntrega')}>
                        <FormControlLabel value="entrega" control={<Radio />} label="Entrega" />
                        <FormControlLabel value="retirada" control={<Radio />} label="Retirada" />
                    </RadioGroup>
                    <FormHelperText>{errors.tipoEntrega?.message}</FormHelperText>
                </FormControl>

                {tipoEntrega === 'entrega' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="CEP"
                            {...register('cep')}
                            onBlur={handleCepBlur}
                            error={!!errors.cep}
                            helperText={errors.cep?.message || (loadingCep ? 'Buscando CEP...' : '')}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Endereço"
                            {...register('endereco')}
                            disabled={disabledFields.endereco}
                            error={!!errors.endereco}
                            helperText={errors.endereco?.message}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Número"
                            {...register('numero')}
                            error={!!errors.numero}
                            helperText={errors.numero?.message}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Complemento (opcional)"
                            {...register('complemento')}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Bairro"
                            {...register('bairro')}
                            disabled={disabledFields.bairro}
                            error={!!errors.bairro}
                            helperText={errors.bairro?.message}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Cidade"
                            {...register('cidade')}
                            disabled={disabledFields.cidade}
                            error={!!errors.cidade}
                            helperText={errors.cidade?.message}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Estado"
                            {...register('estado')}
                            select
                            disabled={disabledFields.estado}
                            error={!!errors.estado}
                            helperText={errors.estado?.message}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        >
                            {estadosBrasil.map((estado) => (
                                <MenuItem key={estado} value={estado}>
                                    {estado}
                                </MenuItem>
                            ))}
                        </TextField>

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
                                                setValue('frete', metodosFrete.pac);
                                                setValue('tipoFrete', 'PAC');
                                                setModalVisible(false);
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
                                                setValue('frete', metodosFrete.sedex);
                                                setValue('tipoFrete', 'SEDEX');
                                                setModalVisible(false);
                                            }}
                                        >
                                            SEDEX - R$ {metodosFrete.sedex.toFixed(2)}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {tipoEntrega === 'retirada' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Local para Retirada"
                            {...register('localRetirada')}
                            select
                            error={!!errors.localRetirada}
                            helperText={errors.localRetirada?.message}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
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
                                            )}&query_place_id=${selectedInfo.coordenadas.lat},${selectedInfo.coordenadas.lng}`
                                        )
                                    }
                                >
                                    Ver no Google Maps
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
                    <Button
                        variant="contained"
                        onClick={nextStep}
                        sx={{
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
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Step2;
