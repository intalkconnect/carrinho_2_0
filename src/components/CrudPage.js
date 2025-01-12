import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; // Importando o socket.io-client
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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SOCKET_URL = 'http://localhost:3000'; // URL do Socket.io do servidor (ajuste conforme sua URL)

const CrudPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch items from API
  useEffect(() => {
    // Conectar ao servidor Socket.io
    const socket = io(SOCKET_URL);

    // Escutar por novos eventos de "newCheckout" (ajuste o nome conforme o evento no backend)
    socket.on('newCheckout', (newCheckout) => {
      console.log('Novo Checkout recebido:', newCheckout);
      setItems((prevItems) => [newCheckout, ...prevItems]); // Adiciona o novo item no topo da lista
    });

    // Buscar itens iniciais da API
    fetch('https://devops.dkdevs.com.br/webhook/crud')
      .then((response) => response.json())
      .then((data) => {
        // Filtra os registros com `processo: true`
        const filteredItems = data.filter((item) => !item.processo);
        setItems(filteredItems);
      })
      .catch((error) => console.error('Error fetching data:', error));

    // Cleanup do socket quando o componente for desmontado
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

  const handleComplete = (item) => {
    const payload = { _id: item._id, processo: true };

    fetch('https://devops.dkdevs.com.br/webhook/finish-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          // Remove o item da tabela
          setItems((prevItems) => prevItems.filter((i) => i._id !== item._id));

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
  };

  const handleSnackbarClose = () => setSnackbar({ open: false, message: '', severity: 'info' });

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3 }}>
        Interface CRUD
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Pagamento</TableCell>
              <TableCell align="center">Data da Compra</TableCell>
              <TableCell align="center">Checkout</TableCell>
              <TableCell align="center">Nome do Cliente</TableCell>
              <TableCell align="center">Número do Orçamento</TableCell>
              <TableCell align="center">Total</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell align="center">
                  {item.status === 'confirmed' ? 'Efetuado' : item.status}
                </TableCell>
                <TableCell align="center">
                  {new Date(item.dataCompra).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  {item.orcamentoFinal?.checkout || 'N/A'}
                </TableCell>
                <TableCell align="center">
                  {item.orcamentoFinal?.dadosPessoais?.nomeCompleto || 'N/A'}
                </TableCell>
                <TableCell align="center">
                  {item.numero_orcamento || 'N/A'}
                </TableCell>
                <TableCell align="center">
                  R${item.orcamentoFinal?.total?.toFixed(2).replace('.', ',') || '0,00'}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleShowDetails(item)}
                      sx={{
                        minWidth: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <VisibilityIcon />
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleComplete(item)}
                      sx={{
                        minWidth: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <CheckCircleIcon />
                    </Button>
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
              Detalhes do Orçamento
            </Typography>
            {selectedItem.orcamentoFinal?.enderecoEntrega ? (
              <>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Endereço:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.endereco},{' '}
                  {selectedItem.orcamentoFinal.enderecoEntrega.numero}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Complemento:</strong>{' '}
                  {selectedItem.orcamentoFinal.enderecoEntrega.complemento || 'Não informado'}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Bairro:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.bairro}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Cidade:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.cidade} -{' '}
                  {selectedItem.orcamentoFinal.enderecoEntrega.estado}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>CEP:</strong> {selectedItem.orcamentoFinal.enderecoEntrega.cep}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <strong>Tipo de Frete:</strong>{' '}
                  {selectedItem.orcamentoFinal.enderecoEntrega.tipoFrete || 'N/A'}
                </Typography>
              </>
            ) : (
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                <strong>Retirada no Local:</strong>{' '}
                {selectedItem.orcamentoFinal?.localRetirada || 'N/A'}
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

      {/* Snackbar */}
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

export default CrudPage;
