export const ajustaValor = (valor) => {
    valor = parseFloat(valor).toFixed(2);
    valor = valor.toString().replace(/\D/g, "");
    valor = valor.toString().replace(/(\d)(\d{8})$/, "$1.$2");
    valor = valor.toString().replace(/(\d)(\d{5})$/, "$1.$2");
    valor = valor.toString().replace(/(\d)(\d{2})$/, "$1,$2");
    return `${valor}`;
};

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


export const openModal = (itens) => {
    // Mostra o modal e exibe os itens
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = ""; // Limpa o conteúdo anterior

    itens.forEach((item) => {
        const itemElement = document.createElement("p");
        itemElement.textContent = `${item.orc_Produto_Nome} - ${item.orc_Produto_quantidade} ${item.orc_Produto_unidade}`;
        modalBody.appendChild(itemElement);
    });

    document.getElementById("modal").style.display = "flex";
};

export const closeModal = () => {
    document.getElementById("modal").style.display = "none";
};

// helpers.js

export const calculateTotalValue = (orcamentos, frete) => {
    const produtosValidos = orcamentos.filter((produto) => produto.orc_qt_potes > 0);
    return produtosValidos.reduce(
        (sum, produto) => sum + produto.orc_qt_potes * produto.orc_valor_liquido,
        0
    ) + parseFloat(frete || 0);
};

export const handleCheckoutSubmission = (orcamentos, formData, setSnackbar) => {
    if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
        setSnackbar({
            open: true,
            message: 'Nenhum produto selecionado. Adicione produtos antes de finalizar o pedido.',
            severity: 'info'
        });
        return;
    }

    const produtosValidos = orcamentos.filter((produto) => produto.orc_qt_potes > 0);
    if (produtosValidos.length === 0) {
        setSnackbar({
            open: true,
            message: 'Nenhum produto com quantidade válida. Ajuste o carrinho antes de finalizar o pedido.',
            severity: 'warning'
        });
        return;
    }

    const payload = {
        checkout: window.location.pathname.replace('/', ''),
        dataFim: new Date().toISOString(),
        dadosPessoais: {
            nomeCompleto: formData.nomeCompleto,
            cpf: formData.cpf,
            rg: formData.rg,
            celular: formData.celular,
            email: formData.email,
        },
        frete: parseFloat(formData.frete),
        total: produtosValidos.reduce((sum, produto) => sum + produto.orc_qt_potes * produto.orc_valor_liquido, 0) + parseFloat(formData.frete),
    };

    fetch('https://endpoints-checkout.rzyewu.easypanel.host/finish-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
        .then((response) => {
            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: 'Pedido finalizado com sucesso!',
                    severity: 'success'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: 'Erro ao finalizar pedido. Tente novamente.',
                    severity: 'error'
                });
            }
        })
        .catch(() => {
            setSnackbar({
                open: true,
                message: 'Erro ao conectar ao servidor.',
                severity: 'error'
            });
        });
};

export const handleSnackbarOpen = (setSnackbar, message, severity) => {
    setSnackbar({ open: true, message, severity });
};
