// ──────────────────────────────────────────────
//  НАСТРОЙКИ — меняй здесь
// ──────────────────────────────────────────────

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
const USERS = {
  admin: { password: 'admin123', role: 'admin' },
  ivan:  { password: 'ivan456',  role: 'user'  },
  maria: { password: 'maria789', role: 'user'  },
};

// ──────────────────────────────────────────────
//  Элементы страницы
// ──────────────────────────────────────────────

const loginScreen  = document.getElementById('login-screen');
const appScreen    = document.getElementById('app-screen');
const loginName    = document.getElementById('login-name');
const loginPass    = document.getElementById('login-pass');
const loginBtn     = document.getElementById('login-btn');
const loginError   = document.getElementById('login-error');
const productSelect = document.getElementById('product');
const kgInput      = document.getElementById('kg');
const saveBtn      = document.getElementById('save-order');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitle    = document.getElementById('form-title');
const formNote     = document.getElementById('form-note');
const ordersBody   = document.getElementById('orders-body');
const ordersTitle  = document.getElementById('orders-title');
const deadlineBox  = document.getElementById('deadline-box');
const deadlineText = document.getElementById('deadline-text');
const deadlineInput = document.getElementById('deadline-input');
const setDeadlineBtn = document.getElementById('set-deadline');
const exportBtn    = document.getElementById('export-excel');
const clearBtn     = document.getElementById('clear-orders');
const adminPanel   = document.getElementById('admin-panel');
const currentUserEl = document.getElementById('current-user');
const logoutBtn    = document.getElementById('logout-btn');

let currentUser = null;
let editingId = null; // id заказа в режиме правки
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let deadline = localStorage.getItem('orderDeadline')
  ? new Date(localStorage.getItem('orderDeadline'))
  : null;

// ──────────────────────────────────────────────
//  Вспомогательные функции
// ──────────────────────────────────────────────

function saveOrders() {
  localStorage.setItem('orders', JSON.stringify(orders));
}

function isEditable() {
  // Правки разрешены, если дедлайн не задан или не наступил
  return !deadline || Date.now() < deadline.getTime();
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return (d > 0 ? d + ' дн ' : '') + `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function renderDeadline() {
  if (!deadline) {
    deadlineText.textContent = '⚠ Дедлайн не задан. Правки заказов разрешены.';
    return;
  }
  if (Date.now() < deadline.getTime()) {
    deadlineText.textContent =
      `⏰ Правки принимаются до ${deadline.toLocaleString('ru-RU')} — осталось: ${formatCountdown(deadline.getTime() - Date.now())}`;
  } else {
    deadlineText.textContent = `⛔ Время истекло (${deadline.toLocaleString('ru-RU')}). Правки закрыты.`;
  }
}

// Раз в секунду обновляем отсчёт и доступность формы
setInterval(() => {
  renderDeadline();
  const editable = isEditable();
  saveBtn.disabled = !editable;
  if (!editable) {
    formNote.textContent = 'Срок истёк — добавление и правка заказов закрыты.';
  } else {
    formNote.textContent = editingId ? 'Режим правки заказа.' : '';
  }
}, 1000);

// ──────────────────────────────────────────────
//  Отрисовка
// ──────────────────────────────────────────────

function fillProducts() {
  productSelect.innerHTML = '';
  PRODUCTS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    productSelect.appendChild(opt);
  });
}

function renderOrders() {
  ordersBody.innerHTML = '';
  const editable = isEditable();

  // Админ видит все заказы, пользователь — только свои
  const visible = currentUser.role === 'admin'
    ? orders
    : orders.filter(o => o.user === currentUser.name);

  ordersTitle.textContent =
    currentUser.role === 'admin' ? 'Все заказы' : 'Мои заказы';

  if (visible.length === 0) {
    ordersBody.innerHTML = '<tr><td colspan="5">Заказов нет</td></tr>';
    return;
  }

  visible.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.product}</td>
      <td>${o.kg}</td>
      <td>${o.user}</td>
      <td>${o.date}</td>
      <td></td>
    `;

    // Кнопки правки/удаления — только автору заказа и до дедлайна
    const isAdmin = currentUser.role === 'admin';
    if (!isAdmin && o.user === currentUser.name && editable) {
      const cell = tr.lastElementChild;

      const editBtn = document.createElement('button');
      editBtn.textContent = '✎';
      editBtn.className = 'small-btn';
      editBtn.title = 'Редактировать';
      editBtn.addEventListener('click', () => startEdit(o.id));

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑';
      delBtn.className = 'small-btn danger-btn';
      delBtn.title = 'Удалить';
      delBtn.addEventListener('click', () => deleteOrder(o.id));

      cell.append(editBtn, delBtn);
    }

    ordersBody.appendChild(tr);
  });
}

function startEdit(id) {
  const order = orders.find(o => o.id === id);
  if (!order || !isEditable()) return;

  editingId = id;
  productSelect.value = order.product;
  kgInput.value = order.kg;
  formTitle.textContent = 'Правка заказа';
  saveBtn.textContent = 'Сохранить';
  cancelEditBtn.classList.remove('hidden');
  formNote.textContent = 'Режим правки заказа.';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  kgInput.value = '';
  formTitle.textContent = 'Новый заказ';
  saveBtn.textContent = 'Добавить заказ';
  cancelEditBtn.classList.add('hidden');
  formNote.textContent = '';
}

function deleteOrder(id) {
  if (!isEditable()) return;
  if (!confirm('Удалить этот заказ?')) return;
  orders = orders.filter(o => o.id !== id);
  saveOrders();
  renderOrders();
}

// ──────────────────────────────────────────────
//  События
// ──────────────────────────────────────────────

// Вход
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
  currentUserEl.textContent =
    `👤 ${name} (${user.role === 'admin' ? 'админ' : 'пользователь'})`;

  if (user.role === 'admin') {
    adminPanel.classList.remove('hidden');
    if (deadline) {
      deadlineInput.value = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    }
  } else {
    adminPanel.classList.add('hidden');
  }

  fillProducts();
  renderDeadline();
  renderOrders();
});

// Выход
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  resetForm();
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

// Добавление / сохранение заказа
saveBtn.addEventListener('click', () => {
  if (!isEditable()) {
    alert('Срок приёма правок истёк');
    return;
  }

  const product = productSelect.value;
  const kg = parseFloat(kgInput.value);

  if (!product || isNaN(kg) || kg <= 0) {
    alert('Выберите товар и укажите количество больше 0');
    return;
  }

  if (editingId) {
    const order = orders.find(o => o.id === editingId);
    order.product = product;
    order.kg = kg;
    order.editedAt = new Date().toLocaleString('ru-RU');
    resetForm();
  } else {
    orders.push({
      id: Date.now() + '_' + currentUser.name,
      product,
      kg,
      user: currentUser.name,
      date: new Date().toLocaleString('ru-RU'),
    });
    kgInput.value = '';
  }

  saveOrders();
  renderOrders();
});

// Отмена правки
cancelEditBtn.addEventListener('click', resetForm);

// Дедлайн (админ)
setDeadlineBtn.addEventListener('click', () => {
  if (!deadlineInput.value) {
    alert('Выберите дату и время');
    return;
  }
  deadline = new Date(deadlineInput.value);
  localStorage.setItem('orderDeadline', deadline.toISOString());
  renderDeadline();
  renderOrders();
  alert('Дедлайн установлен: ' + deadline.toLocaleString('ru-RU'));
});

// Экспорт в Excel (только админ)
exportBtn.addEventListener('click', () => {
  if (orders.length === 0) {
    alert('Нет заказов для выгрузки');
    return;
  }

  const allOrdersData = orders.map(o => ({
    'Товар': o.product,
    'Кг': o.kg,
    'Заказчик': o.user,
    'Дата': o.date,
  }));

  const summary = {};
  orders.forEach(o => {
    if (!summary[o.product]) summary[o.product] = { totalKg: 0, count: 0 };
    summary[o.product].totalKg += o.kg;
    summary[o.product].count += 1;
  });

  const summaryData = Object.entries(summary).map(([product, s]) => ({
    'Товар': product,
    'Всего, кг': s.totalKg.toFixed(2),
    'Кол-во заказов': s.count,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allOrdersData), 'Все заказы');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Сводка');

  XLSX.writeFile(wb, `itogi_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

// Очистка (только админ)
clearBtn.addEventListener('click', () => {
  if (!confirm('Удалить все заказы? Действие нельзя отменить.')) return;
  orders = [];
  saveOrders();
  renderOrders();
});

// Дедлайн по умолчанию для примера: можно удалить эти строки
if (!localStorage.getItem('orderDeadline')) {
  // const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  // localStorage.setItem('orderDeadline', tomorrow.toISOString());
  // deadline = tomorrow;
}
