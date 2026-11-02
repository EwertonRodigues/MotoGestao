/* Regras de negócio independentes da interface, usadas também nos testes. */
(function (root) {
  'use strict';
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const clone = value => JSON.parse(JSON.stringify(value));
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function id() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  function text(value, label, max = 100) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`Preencha ${label} corretamente.`);
    return value.trim();
  }
  function number(value, label, min = 0, integer = false) {
    if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > 9999999 || (integer && !Number.isInteger(Number(value)))) throw new Error(`Informe ${label} válido${integer ? ', em unidades inteiras' : ''}.`);
    return integer ? Number(value) : round(Number(value));
  }
  function empty() { return { version: 1, demo: false, customers: [], products: [], sales: [] }; }
  function seed() {
    const state = empty(); state.demo = true;
    state.customers = [
      { id: 'c1', name: 'Rafael Martins', phone: '(21) 99999-0101', email: 'rafael@example.com' },
      { id: 'c2', name: 'Camila Oliveira', phone: '(21) 99999-0102', email: 'camila@example.com' },
      { id: 'c3', name: 'Lucas Ferreira', phone: '(21) 99999-0103', email: 'lucas@example.com' },
      { id: 'c4', name: 'Beatriz Santos', phone: '(21) 99999-0104', email: 'beatriz@example.com' },
      { id: 'c5', name: 'André Souza', phone: '(21) 99999-0105', email: 'andre@example.com' }
    ];
    state.products = [
      { id: 'p1', name: 'Óleo Motul 10W-40', sku: 'LUB-001', category: 'Lubrificantes', cost: 32, price: 59.9, stock: 24, minStock: 8 },
      { id: 'p2', name: 'Kit relação CG 160', sku: 'TRA-001', category: 'Transmissão', cost: 85, price: 159.9, stock: 4, minStock: 5 },
      { id: 'p3', name: 'Pastilha de freio dianteira', sku: 'FRE-001', category: 'Freios', cost: 22, price: 49.9, stock: 3, minStock: 5 },
      { id: 'p4', name: 'Capacete fechado Pro Tork', sku: 'ACE-001', category: 'Acessórios', cost: 120, price: 219.9, stock: 12, minStock: 3 },
      { id: 'p5', name: 'Vela de ignição NGK', sku: 'ELE-001', category: 'Elétrica', cost: 15, price: 34.9, stock: 18, minStock: 6 },
      { id: 'p6', name: 'Filtro de ar Fazer 250', sku: 'MOT-001', category: 'Motor', cost: 28, price: 64.9, stock: 2, minStock: 4 }
    ];
    // As vendas fictícias são criadas a partir de estoque inicial maior.
    const specs = [ ['p1', 4, 'c1', 0.08], ['p2', 2, 'c3', 0.15], ['p4', 1, 'c2', 0.24], ['p1', 6, 'c4', 0.35], ['p3', 4, 'c5', 0.43], ['p5', 5, 'c1', 0.55], ['p2', 3, 'c2', 0.63], ['p4', 2, 'c3', 0.72], ['p1', 5, 'c5', 0.83], ['p6', 2, 'c4', 1] ];
    const dateNow = today(), day = Number(dateNow.slice(8));
    specs.forEach(([productId, qty, customerId, fraction], i) => {
      const p = state.products.find(p => p.id === productId);
      state.sales.push({ id: `s${i + 1}`, number: String(i + 1).padStart(4, '0'), customerId, productId, productName: p.name, sku: p.sku, qty, price: p.price, cost: p.cost, total: round(p.price * qty), date: `${dateNow.slice(0, 8)}${String(Math.max(1, Math.floor(day * fraction))).padStart(2, '0')}`, status: 'completed' });
    });
    return state;
  }
  function saveCustomer(state, draft) {
    const name = text(draft.name, 'o nome');
    const phone = String(draft.phone || '').trim();
    const email = String(draft.email || '').trim();
    if (phone.length > 25) throw new Error('O telefone deve ter até 25 caracteres.');
    if (email && (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Informe um e-mail válido.');
    if (email && state.customers.some(c => c.id !== draft.id && c.email.toLowerCase() === email.toLowerCase())) throw new Error('Este e-mail já está cadastrado.');
    const customer = { id: draft.id || id(), name, phone, email };
    const index = state.customers.findIndex(c => c.id === customer.id);
    if (draft.id && index < 0) throw new Error('Cliente não encontrado.');
    if (index >= 0) state.customers[index] = customer; else state.customers.push(customer);
  }
  function saveProduct(state, draft) {
    const p = { id: draft.id || id(), name: text(draft.name, 'o nome'), sku: text(draft.sku, 'o código', 30).toUpperCase(), category: text(draft.category, 'a categoria', 50), cost: number(draft.cost, 'um custo'), price: number(draft.price, 'um preço', .01), stock: number(draft.stock, 'um estoque', 0, true), minStock: number(draft.minStock, 'um estoque mínimo', 0, true) };
    if (state.products.some(item => item.id !== p.id && item.sku.toUpperCase() === p.sku)) throw new Error('Já existe uma peça com este código.');
    const index = state.products.findIndex(item => item.id === p.id);
    if (draft.id && index < 0) throw new Error('Peça não encontrada.');
    if (index >= 0) state.products[index] = p; else state.products.push(p);
  }
  function registerSale(state, draft) {
    const product = state.products.find(p => p.id === draft.productId);
    if (!product) throw new Error('Selecione uma peça cadastrada.');
    if (!state.customers.some(c => c.id === draft.customerId)) throw new Error('Selecione um cliente cadastrado.');
    const qty = number(draft.qty, 'uma quantidade', 1, true);
    if (qty > product.stock) throw new Error(`Estoque insuficiente. Disponível: ${product.stock} unidade(s).`);
    const dateValue = String(draft.date || '');
    const parsed = new Date(dateValue + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dateValue || dateValue > today() || dateValue < '2000-01-01') throw new Error('Informe uma data válida até hoje.');
    const next = state.sales.reduce((max, s) => Math.max(max, Number(s.number) || 0), 0) + 1;
    state.sales.push({ id: id(), number: String(next).padStart(4, '0'), customerId: draft.customerId, productId: product.id, productName: product.name, sku: product.sku, qty, price: product.price, cost: product.cost, total: round(product.price * qty), date: dateValue, status: 'completed' });
    product.stock -= qty;
  }
  function cancelSale(state, saleId) {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale || sale.status !== 'completed') throw new Error('Esta venda já foi cancelada ou não existe.');
    const product = state.products.find(p => p.id === sale.productId);
    if (!product) throw new Error('Peça não encontrada; não foi possível devolver o estoque.');
    if (product.stock + sale.qty > 9999999) throw new Error('O estoque excederia o limite permitido.');
    product.stock += sale.qty; sale.status = 'cancelled';
  }
  function remove(state, type, recordId) {
    const field = type === 'customer' ? 'customerId' : 'productId';
    if (state.sales.some(s => s[field] === recordId)) throw new Error('Este cadastro possui histórico de vendas e não pode ser excluído.');
    const list = type === 'customer' ? state.customers : state.products;
    const index = list.findIndex(item => item.id === recordId);
    if (index < 0) throw new Error('Cadastro não encontrado.');
    list.splice(index, 1);
  }
  function validateStored(state) {
    if (!state || state.version !== 1 || typeof state.demo !== 'boolean' || !['customers', 'products', 'sales'].every(key => Array.isArray(state[key]))) throw new Error('Formato dos registros locais inválido.');
    for (const key of ['customers', 'products', 'sales']) {
      if (new Set(state[key].map(x => x.id)).size !== state[key].length) throw new Error('Registros duplicados no armazenamento.');
      if (state[key].some(x => !x || typeof x.id !== 'string')) throw new Error('Identificação de registro inválida.');
    }
    state.customers.forEach(c => { text(c.name, 'o nome'); if (typeof c.email !== 'string' || typeof c.phone !== 'string') throw new Error('Cliente inválido.'); });
    state.products.forEach(p => { text(p.name, 'o nome'); text(p.sku, 'o código', 30); text(p.category, 'a categoria', 50); number(p.price, 'um preço', .01); number(p.cost, 'um custo'); number(p.stock, 'um estoque', 0, true); number(p.minStock, 'um mínimo', 0, true); });
    state.sales.forEach(s => {
      if (!state.customers.some(c => c.id === s.customerId) || !state.products.some(p => p.id === s.productId) || !['completed', 'cancelled'].includes(s.status)) throw new Error('Histórico de vendas inconsistente.');
      text(s.productName, 'o nome da peça'); number(s.qty, 'uma quantidade', 1, true); number(s.price, 'um preço', .01); number(s.cost, 'um custo');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date) || s.total !== round(s.qty * s.price)) throw new Error('Valor ou data de venda inválido.');
    });
    return state;
  }
  root.MotoDomain = { round, clone, today, empty, seed, saveCustomer, saveProduct, registerSale, cancelSale, remove, validateStored };
  if (typeof module !== 'undefined') module.exports = root.MotoDomain;
})(globalThis);
