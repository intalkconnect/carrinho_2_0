import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Button,
  Typography,
  Modal,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { LayoutList, Rocket } from "lucide-react";

const CrudPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dataCompra', direction: 'asc' });

  // Novo estado para controlar o modal de confirmação
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [itemToProcess, setItemToProcess] = useState(null);

  useEffect(() => {
    const socket = io('wss://endpoints-checkout.rzyewu.easypanel.host/', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const fetchData = async () => {
      try {
        const response = await fetch('https://endpoints-checkout.rzyewu.easypanel.host/itens');
        const data = await response.json();
        const filteredItems = data.filter((item) => !item.process);
        setItems(filteredItems);
      } catch (error) {
        
      }
    };

    fetchData();

    const updateItemList = (newItem) => {
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item._id === newItem._id);
        if (existingIndex !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[existingIndex] = newItem;
          return updatedItems;
        }
        return [newItem, ...prevItems];
      });
    };

    socket.on('connect', () => {
      setSnackbar({
        open: true,
        message: 'Conexão estabelecida!',
        severity: 'success',
      });
    });

    socket.on('newCheckout', (newCheckout) => {
      updateItemList(newCheckout);
    });

    socket.on('checkoutUpdated', (updatedCheckout) => {
      updateItemList(updatedCheckout);
    });

    socket.on('checkoutRemoved', (removedCheckout) => {
      setItems((prevItems) => prevItems.filter((item) => item._id !== removedCheckout.checkoutId));
    });

    // Ouvindo o evento 'processCompleted' do servidor
    socket.on('processCompleted', (completedItemId) => {
      setItems((prevItems) => prevItems.filter((item) => item._id !== completedItemId));
      setSnackbar({
        open: true,
        message: 'Processo concluído com sucesso!',
        severity: 'success',
      });
    });

    socket.on('disconnect', () => {
      setSnackbar({
        open: true,
        message: 'Desconectado do servidor. Tentando reconectar...',
        severity: 'warning',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleShowDetails = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  // Novo handleComplete para abrir o modal de confirmação
  const handleComplete = (item) => {
    setItemToProcess(item);
    setOpenConfirmModal(true); // Abre o modal de confirmação
  };

  // Função que será chamada quando o usuário confirmar o processo
  const handleConfirmProcess = () => {
    const payload = { _id: itemToProcess._id, process: true };
    fetch('https://endpoints-checkout.rzyewu.easypanel.host/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          setItems((prevItems) => prevItems.filter((i) => i._id !== itemToProcess._id));
          setSnackbar({
            open: true,
            message: 'Processo concluído com sucesso!',
            severity: 'success',
          });
        } else {
          throw new Error('Erro ao concluir o processo.');
        }
      })
      .catch((error) => {
        console.error('Error finishing process:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao concluir o processo.',
          severity: 'error',
        });
      });
    setOpenConfirmModal(false); // Fecha o modal após o processamento
  };

  // Função para fechar o modal sem fazer nada
  const handleCancelProcess = () => {
    setOpenConfirmModal(false); // Fecha o modal sem processar nada
  }


  const handleSnackbarClose = () => setSnackbar({ open: false, message: '', severity: 'info' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredItems = sortedItems.filter((item) =>
    item.orcamentoFinal?.dadosPessoais?.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numero_orcamento.includes(searchTerm) ||
    item.orcamentoFinal?.checkout.includes(searchTerm)
  );

  return (
    <Box sx={{ padding: 4, backgroundColor: '#f4f6f8' }}>
      <Typography 
    variant="h4" 
    sx={{ 
        marginBottom: 3,
        color: '#1E293B',  // Cor mais neutra e moderna
        fontWeight: 600,
        fontSize: '1.75rem',
        letterSpacing: '-0.02em'
    }}
>
    Gerenciador
</Typography>

      {/* Card com o contador de itens */}
      <Card sx={{ marginBottom: 3, maxWidth: 300, margin: '0 auto' }}>
        <CardContent>
          <Typography variant="h6" align="center">
            {`Orçamentos na fila: ${items.length}`}
          </Typography>
        </CardContent>
      </Card>
      <Box sx={{ marginBottom: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          label="Buscar"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell align="center" sx={{ color: '#fff' }}>
                Pagamento
              </TableCell>
              <TableCell align="center" onClick={() => handleSort('dataCompra')} sx={{ cursor: 'pointer', color: '#fff' }}>
                Data da Compra
                {sortConfig.key === 'dataCompra' && (
                  sortConfig.direction === 'asc' ? (
                    <ExpandMore sx={{ marginLeft: 1, color: '#fff', fontSize: 20 }} />
                  ) : (
                    <ExpandLess sx={{ marginLeft: 1, color: '#fff', fontSize: 20 }} />
                  )
                )}
              </TableCell>
              <TableCell align="center" sx={{ color: '#fff' }}>
                Checkout
              </TableCell>
              <TableCell align="center" onClick={() => handleSort('orcamentoFinal.dadosPessoais.nomeCompleto')} sx={{ cursor: 'pointer', color: '#fff' }}>
                Nome do Cliente
                {sortConfig.key === 'orcamentoFinal.dadosPessoais.nomeCompleto' && (
                  sortConfig.direction === 'asc' ? (
                    <ExpandMore sx={{ marginLeft: 1, color: '#fff', fontSize: 20 }} />
                  ) : (
                    <ExpandLess sx={{ marginLeft: 1, color: '#fff', fontSize: 20 }} />
                  )
                )}
              </TableCell>
              <TableCell align="center" onClick={() => handleSort('numero_orcamento')} sx={{ cursor: 'pointer', color: '#fff' }}>
                Número do Orçamento
                {sortConfig.key === 'numero_orcamento' && (
                  sortConfig.direction === 'asc' ? (
                    <ExpandMore sx={{ marginLeft: 1, color: '#fff', fontSize: 20 }} />
                  ) : (
                    <ExpandLess sx={{ marginLeft: 1, color: '#fff', fontSize: 20 }} />
                  )
                )}
              </TableCell>
              <TableCell align="center" sx={{ color: '#fff' }}>
                Total
              </TableCell>
              <TableCell align="center" sx={{ color: '#fff' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item._id} sx={{ '&:hover': { backgroundColor: '#f1f1f1' } }}>
                <TableCell align="center">{item.status === 'paid' ? 'Efetuado' : item.status}</TableCell>
                <TableCell align="center">{new Date(item.dataCompra).toLocaleString()}</TableCell>
                <TableCell align="center">{item.orcamentoFinal?.checkout || 'N/A'}</TableCell>
                <TableCell align="center">{item.orcamentoFinal?.dadosPessoais?.nomeCompleto || 'N/A'}</TableCell>
                <TableCell align="center">{item.numero_orcamento || 'N/A'}</TableCell>
                <TableCell align="center">
                  R${item.orcamentoFinal?.total?.toFixed(2).replace('.', ',') || '0,00'}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <IconButton onClick={() => handleShowDetails(item)} color="primary">
                      <LayoutList />
                    </IconButton>
                    <IconButton onClick={() => handleComplete(item)} color="success">
                      <Rocket />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal */}
      {selectedItem && (
        <Modal open={Boolean(selectedItem)} onClose={handleCloseModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 600,
              maxHeight: '90%',
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              overflowY: 'auto',
              p: 4,
            }}
          >
            <Typography variant="h5" sx={{ marginBottom: 2 }}>
              Detalhes da Entrega
            </Typography>
            {selectedItem.orcamentoFinal ? (
              <>
                {selectedItem.orcamentoFinal.enderecoEntrega && (
                  <>
                    {/* Verifica se endereçoEntrega não está vazio e exibe */}
                    {selectedItem.orcamentoFinal.enderecoEntrega.endereco || selectedItem.orcamentoFinal.enderecoEntrega.numero ? (
                      <>
                        <Typography variant="body1" sx={{ marginBottom: 1 }}>
                          <strong>Endereço:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.endereco || 'Não informado'},
                          {selectedItem.orcamentoFinal.enderecoEntrega.numero || 'Sem número'}
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }}>
                          <strong>Complemento:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.complemento || 'Não informado'}
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }}>
                          <strong>Bairro:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.bairro || 'Não informado'}
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }}>
                          <strong>Cidade:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.cidade || 'Não informado'} -
                          {selectedItem.orcamentoFinal.enderecoEntrega.estado || 'Estado não informado'}
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }}>
                          <strong>CEP:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.cep || 'Não informado'}
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }}>
                          <strong>Tipo de Frete:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.tipoFrete || 'Não informado'}
                        </Typography>
                      </>
                    ) : null}
                  </>
                )}

                {selectedItem.orcamentoFinal.localRetirada && (
                  // Verifica se localRetirada não está vazio e exibe
                  <>
                    <Typography variant="body1" sx={{ marginBottom: 1 }}>
                      <strong>Retirada no Local:</strong> {selectedItem.orcamentoFinal.localRetirada || 'Não informado'}
                    </Typography>
                  </>
                )}

                {!selectedItem.orcamentoFinal.enderecoEntrega && !selectedItem.orcamentoFinal.localRetirada && (
                  // Se nenhum dos campos tem valor
                  <Typography variant="body1" sx={{ marginBottom: 1, color: 'red' }}>
                    Nenhuma informação de entrega ou retirada disponível.
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body1" sx={{ marginBottom: 1, color: 'red' }}>
                Dados do orçamento não disponíveis.
              </Typography>
            )}

            <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>
              Itens do Orçamento
            </Typography>
            {selectedItem.orcamentoFinal?.produtos?.map((produto, index) => (
              <Box
                key={index}
                sx={{
                  marginBottom: 2,
                  padding: 2,
                  border: '1px solid #ddd',
                  borderRadius: 2,
                  backgroundColor: '#f9f9f9',
                }}
              >
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Número do Orçamento:</strong> {produto.orc_filial} - {produto.orc_numero} -{' '}
                  {produto.orc_serie}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Quantidade de Potes:</strong> {produto.orc_qt_potes}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Volume:</strong> {produto.orc_volume} {produto.orc_Volume_Unidade}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Forma Farmacêutica:</strong> {produto.orc_forma_farmac}
                </Typography>

                <Typography variant="subtitle1" sx={{ marginTop: 2, marginBottom: 1 }}>
                  Fórmula
                </Typography>
                {produto.orcamentoItens?.map((item, itemIndex) => (
                  <Box key={itemIndex} sx={{ marginLeft: 2, marginBottom: 1 }}>
                    <Typography variant="body2">
                      <strong>Nome:</strong> {item.orc_Produto_Nome}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Quantidade:</strong> {item.orc_Produto_quantidade}{' '}
                      {item.orc_Produto_unidade}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
            <Button
              variant="contained"
              onClick={handleCloseModal}
              sx={{ marginTop: 2, backgroundColor: '#1976d2' }}
            >
              Fechar
            </Button>
          </Box>
        </Modal>
      )}

      {/* Modal de Confirmação */}
      <Modal open={openConfirmModal} onClose={handleCancelProcess}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            maxHeight: '90%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Você tem certeza que deseja processar este item?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleCancelProcess} variant="outlined" color="error">
              Cancelar
            </Button>
            <Button onClick={handleConfirmProcess} variant="contained" color="primary">
              Confirmar
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CrudPage;
