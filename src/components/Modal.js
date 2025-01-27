import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Fade, // Importe o Fade
} from '@mui/material';
import { Circle } from '@mui/icons-material';

const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

const Modal = ({ isVisible, onClose, items }) => {
    // Adicione um useEffect para lidar com o cleanup
    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isVisible, onClose]);

    // Use o componente Fade do MUI para animações suaves
    return (
        <Fade in={isVisible}>
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    display: isVisible ? 'flex' : 'none', // Controle de visibilidade mais suave
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1300,
                }}
                onClick={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'white',
                        borderRadius: 3,
                        p: 3,
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: 4,
                        position: 'relative',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                <Typography
                    variant="h6"
                    sx={{
                        mb: 2,
                        color: '#00695c',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                    }}
                >
                    Detalhes do Produto
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            <ListItem>
                                <ListItemIcon>
                                    <Circle sx={{ color: '#00695c', fontSize: 10 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: 'medium',
                                                color: '#333',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {capitalizeFirstLetter(item.orc_Produto_Nome)}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#666',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            {item.orc_Produto_quantidade}{' '}
                                            {item.orc_Produto_unidade}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            {index < items.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
                <Button
                    variant="contained"
                    color="success"
                    sx={{
                        mt: 3,
                        display: 'block',
                        mx: 'auto',
                        bgcolor: '#00695c',
                        fontSize: '0.9rem',
                        ':hover': { bgcolor: '#004d40' },
                    }}
                    onClick={onClose}
                >
                    Fechar
                </Button>
            </Box>
            </Box>
        </Fade>
    );
};

export default Modal;
