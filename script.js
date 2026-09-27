const productInput = document.getElementById('product');
const kgInput = document.getElementById('kg');
const addBtn = document.getElementById('add-order');
const ordersList = document.getElementById('orders-list');
const exportBtn = document.getElementById('export-excel');

// Хранилище заказов
let orders = JSON.parse(localStorage.getItem('orders')) || [];

function renderOrders() {
  ordersList.innerHTML = '';
  orders.forEach((o, i) => {
    const li = document.createElement('li');
    li.textContent = `${o.product} — ${o.kg} кг`;
    ordersList.appendChild(li);
  });
}

addBtn.addEventListener('click', () => {
  const product = productInput.value.trim();
  const kg = parseFloat(kgInput.value);

  if (!product || isNaN(kg) || kg <= 0) {
    alert('Укажите корректный товар и количество в кг');
    return;
  }

  const order = { product, kg, date: new Date().toLocaleString() };
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  productInput.value = '';
  kgInput.value = '';
  renderOrders();
});

exportBtn.addEventListener('click', () => {
  if (orders.length === 0) {
    alert('Нет заказов для выгрузки');
    return;
  }

  // Данные для Excel: массив объектов
  const data = orders.map(o => ({
    'Товар': o.product,
    'Количество, кг': o.kg,
    'Дата': o.date
  }));

  // Создаём workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Заказы');

  // Генерируем и скачиваем файл
  const fileName = `zakazy_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
});

renderOrders();
