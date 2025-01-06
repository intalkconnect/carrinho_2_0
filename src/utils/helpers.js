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
