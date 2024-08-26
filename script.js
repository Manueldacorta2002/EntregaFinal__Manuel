let loanHistory = JSON.parse(localStorage.getItem('loanHistory')) || [];
let historyVisibleCount = 3;
let amortizationChart; // Variable para almacenar la instancia de la gráfica

document.addEventListener('DOMContentLoaded', function() {
    obtenerDatos();
    mostrarHistorial();
    document.getElementById('viewMoreBtn').style.display = loanHistory.length > historyVisibleCount ? 'block' : 'none';
});

document.getElementById('calculateBtn').addEventListener('click', handleCalculateClick);
document.getElementById('resetBtn').addEventListener('click', handleResetClick);
document.getElementById('viewMoreBtn').addEventListener('click', handleViewMoreClick);

async function obtenerDatos() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        loanHistory = data.loans;
        mostrarHistorial();
        document.getElementById('viewMoreBtn').style.display = loanHistory.length > historyVisibleCount ? 'block' : 'none';
    } catch (error) {
        console.error('Error al obtener datos:', error);
    }
}

function handleCalculateClick() {
    let loanAmount = parseFloat(document.getElementById('loanAmount').value);
    let interestRate = parseFloat(document.getElementById('interestRate').value);
    let loanTerm = parseInt(document.getElementById('loanTerm').value);

    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm) || loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
        Swal.fire({
            title: 'Error!',
            text: 'Por favor, ingrese valores numéricos válidos y mayores a cero.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    if (!validarDecimales(loanAmount) || !validarDecimales(interestRate)) {
        Swal.fire({
            title: 'Error!',
            text: 'Por favor, ingrese valores con hasta dos decimales.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    let loanData = { loanAmount, interestRate, loanTerm };
    loanHistory.push(loanData);
    localStorage.setItem('loanHistory', JSON.stringify(loanHistory));

    let monthlyPayment = calcularPagoMensual(loanData);
    mostrarResultado(monthlyPayment);
    mostrarGraficaAmortizacion(loanData, monthlyPayment);
    document.getElementById('viewMoreBtn').style.display = loanHistory.length > historyVisibleCount ? 'block' : 'none';
}

function validarDecimales(valor) {
    return /^-?\d+(\.\d{1,2})?$/.test(valor);
}

function handleResetClick() {
    Swal.fire({
        title: 'Confirmación',
        text: '¿Está seguro que desea reiniciar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'No, cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            resetSimulator();
        }
    });
}

function resetSimulator() {
    resetForm();
    resetResults();
    resetHistory();
}

function resetForm() {
    document.getElementById('loanAmount').value = '';
    document.getElementById('interestRate').value = '';
    document.getElementById('loanTerm').value = '';
}

function resetResults() {
    document.getElementById('result').textContent = '';
    const ctx = document.getElementById('amortizationChart').getContext('2d');
    if (amortizationChart) {
        amortizationChart.destroy(); // Destruye la gráfica existente
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function resetHistory() {
    loanHistory = [];
    localStorage.removeItem('loanHistory');
    historyVisibleCount = 3;
    document.getElementById('viewMoreBtn').style.display = 'none';
    document.getElementById('history').innerHTML = '';
}

function mostrarHistorial() {
    let historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '';

    loanHistory.slice(0, historyVisibleCount).forEach((loan, index) => {
        let historyItem = document.createElement('div');
        historyItem.textContent = `Préstamo ${index + 1}: ${loan.loanAmount} USD, Tasa: ${loan.interestRate}%, Plazo: ${loan.loanTerm} años`;
        historyDiv.appendChild(historyItem);
    });
}

function handleViewMoreClick() {
    historyVisibleCount += 3;
    mostrarHistorial();

    if (loanHistory.length <= historyVisibleCount) {
        document.getElementById('viewMoreBtn').style.display = 'none';
    }
}

function calcularPagoMensual({ loanAmount, interestRate, loanTerm }) {
    let monthlyRate = interestRate / 100 / 12;
    let numberOfPayments = loanTerm * 12;

    return (
        (loanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -numberOfPayments))
    ).toFixed(2);
}

function mostrarResultado(payment) {
    let resultDiv = document.getElementById('result');
    resultDiv.textContent = `Pago mensual: ${payment} USD`;
}

function mostrarGraficaAmortizacion({ loanAmount, interestRate, loanTerm }, monthlyPayment) {
    let labels = [];
    let data = [];
    let balance = loanAmount;
    let monthlyRate = interestRate / 100 / 12;

    for (let i = 1; i <= loanTerm * 12; i++) {
        let interest = balance * monthlyRate;
        let principal = monthlyPayment - interest;
        balance -= principal;

        labels.push(`Mes ${i}`);
        data.push(balance < 0 ? 0 : balance.toFixed(2));
    }

    const ctx = document.getElementById('amortizationChart').getContext('2d');
    amortizationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Saldo del préstamo',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}
