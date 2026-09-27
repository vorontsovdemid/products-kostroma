// ──────────────────────────────────────────────
//  НАСТРОЙКИ — меняй здесь
// ──────────────────────────────────────────────

// Список товаров (можно добавлять/удалять)
const PRODUCTS = [
  'Картофель',
  'Морковь',
  'Лук репчатый',
  'Капуста белокочанная',
  'Свёкла',
  'Помидоры',
  'Огурцы',
  'Яблоки',
  'Груши',
  'Мука пшеничная',
];

// Пользователи: имя → { password, role }
// role: 'admin' или 'user'
const USERS = {
  admin:    { password: 'admin123',  role: 'admin' },
  ivan:     { password: 'ivan456',   role: 'user'  },
  maria:    { password: 'maria789',  role: 'user'  },
};

// ──────────────────────────────────────────────
//  Логика
// ──────────────────────────────────────────────

const loginScreen   = document.getElementById('login-screen');
const appScreen      = document.getElementById('app-screen');
const loginName      = document.getElementById('login-name');
const loginPass      = document.getElementById('login-pass');
const loginBtn       = document.getElementById('login-btn');
const loginError     = document.getElementById('login-error');
const productSelect  = document.getElementById('product');
const kgInput        = document.getElementById('kg');
const addBtn          = document.getElementById('add-order');
const ordersBody     = document.getElementById('orders-body');
const exportBtn      = document.getElementById('export-excel');
const clearBtn       = document.getElementById('clear-orders');
const adminPanel     = document.getElementById('admin-panel');
const currentUserEl  = document.getElementById('current-user');
const logoutBtn      = document.getElementById('logout-btn');

let currentUser = null;
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// Заполняем выпадающий список товарами
function fillProducts() {
  productSelect.innerHTML = '';
  PRODUCTS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    productSelect.appendChild(opt);
  });
}

// Отрисовка таблицы заказов
function renderOrders() {
  ordersBody.innerHTML = '';
  orders.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.product}</td>
      <td>${o.kg}</td>
      <td>${o.user}</td>
      <td>${o.date}</td>
    `;
    ordersBody.appendChild(tr);
  });
}

// Авторизация
loginBtn.addEventListener('click', () => {
  const name = loginName.value.trim();
  const pass = loginPass.value;

  const user = USERS[name];
  if (!user || user.password !== pass) {
    loginError.textContent = 'Неверное имя или пароль';
    return;
  }

  currentUser = { name, role: user.role };
  loginError.textContent = '';
  loginName.value = '';
  loginPass.value = '';

  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  currentUserEl.textContent = `👤 ${name} (${user.role === 'admin' ? 'админ' : 'пользователь'})`;

  // Кнопку экспорта видим только админу
  if (user.role === 'admin') {
    adminPanel.classList.remove('hidden');
  } else {
    adminPanel.classList.add('hidden');
  }

  renderOrders();
});

// Выход
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

// Добавление заказа
addBtn.addEventListener('click', () => {
  const product = productSelect.value;
  const kg = parseFloat(kgInput.value);

  if (!product || isNaN(kg) || kg <= 0) {
    alert('Выберите товар и укажите количество больше 0');
    return;
  }

  orders.push({
    product,
    kg,
    user: currentUser.name,
    date: new Date().toLocaleString('ru-RU'),
  });

  localStorage.setItem('orders', JSON.stringify(orders));
  kgInput.value = '';
  renderOrders();
});

// Экспорт в Excel (только админ)
exportBtn.addEventListener('click', () => {
  if (orders.length === 0) {
    alert('Нет заказов для выгрузки');
    return;
  }

  // Группируем по товару и суммируем кг
  const summary = {};
  orders.forEach(o => {
    if (!summary[o.product]) {
      summary[o.product] = { product: o.product, totalKg: 0, orders: [] };
    }
    summary[o.product].totalKg += o.kg;
    summary[o.product].orders.push(o);
  });

  // Лист 1: все заказы
  const allOrdersData = orders.map(o => ({
    'Товар': o.product,
    'Кг': o.kg,
    'Заказчик': o.user,
    'Дата': o.date,
  }));

  // Лист 2: сводка по товарам
  const summaryData = Object.values(summary).map(s => ({
    'Товар': s.product,
    'Всего, кг': s.totalKg.toFixed(2),
    'Кол-во заказов': s.orders.length,
  }));

  const wb = XLSX.utils.book_new();

  const wsAll = XLSX.utils.json_to_sheet(allOrdersData);
  XLSX.utils.book_append_sheet(wb, wsAll, 'Все заказы');

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

  const fileName = `itogi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
});

// Очистка заказов (только админ)
clearBtn.addEventListener('click', () => {
  if (!confirm('Удалить все заказы? Это действие нельзя отменить.')) return;
  orders = [];
  localStorage.setItem('orders', JSON.stringify(orders));
  renderOrders();
});

// Инициализация
fillProducts();
