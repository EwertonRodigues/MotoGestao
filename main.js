/* Vue 3 via CDN, sem compilação. A página prática preserva o contador do guia. */
if (window.Vue && document.querySelector('#app[data-pratica]')) {
  Vue.createApp({ data: () => ({ contador: 0 }) }).mount('#app');
} else if (window.Vue && window.MotoDomain) {
  const D = MotoDomain, STORAGE_KEY = 'motogestao-v1';
  const titles = { dashboard: 'Dashboard', vendas: 'Vendas', clientes: 'Clientes', pecas: 'Peças e estoque', sobre: 'Sobre o projeto' };
  let initialState, storageError = '';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    initialState = raw ? D.validateStored(JSON.parse(raw)) : D.seed();
    if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  } catch (error) {
    initialState = D.empty();
    storageError = 'Não foi possível ler ou gravar os registros locais. Os dados existentes foram preservados. Verifique as permissões de armazenamento do navegador antes de continuar.';
    console.error('Falha no armazenamento MotoGestão:', error);
  }
  const app = Vue.createApp({
    data: () => ({ state: initialState, storageError, tab: titles[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard', search: '', month: D.today().slice(0, 7), today: D.today(), toast: '', toastTimer: null, modal: null, draft: {}, formError: '', returnFocus: null, swStatus: 'verificando…', navigation: [{ id: 'dashboard', label: 'Dashboard', icon: '▦' }, { id: 'vendas', label: 'Vendas', icon: '↗' }, { id: 'clientes', label: 'Clientes', icon: '♧' }, { id: 'pecas', label: 'Peças e estoque', icon: '▤' }, { id: 'sobre', label: 'Projeto', icon: 'ⓘ' }], subtitles: { dashboard: 'Tudo o que importa para sua loja, em um só lugar.', vendas: 'Acompanhe cada venda e mantenha seu estoque em dia.', clientes: 'Boas relações começam com clientes bem organizados.', pecas: 'Cada peça no lugar certo. Cada oportunidade à vista.', sobre: 'Um projeto para transformar números em boas decisões.' } }),
    computed: {
      title() { return titles[this.tab]; },
      monthLabel() { return this.month ? new Date(`${this.month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'selecione um mês'; },
      monthSales() { return this.state.sales.filter(s => s.status === 'completed' && s.date.startsWith(this.month || 'invalid')).slice().sort((a, b) => b.date.localeCompare(a.date) || Number(b.number) - Number(a.number)); },
      revenue() { return D.round(this.monthSales.reduce((n, s) => n + s.total, 0)); },
      grossProfit() { return D.round(this.monthSales.reduce((n, s) => n + s.total - s.cost * s.qty, 0)); },
      metrics() { return [{ label: 'Faturamento do mês', value: this.money(this.revenue), detail: 'Total das vendas concluídas', icon: '↗', accent: true }, { label: 'Vendas realizadas', value: String(this.monthSales.length).padStart(2, '0'), detail: `${this.monthSales.reduce((n, s) => n + s.qty, 0)} peças vendidas no período`, icon: '▧' }, { label: 'Ticket médio', value: this.money(this.monthSales.length ? this.revenue / this.monthSales.length : 0), detail: 'Valor médio por venda', icon: '◈' }, { label: 'Lucro bruto estimado', value: this.money(this.grossProfit), detail: 'Vendas − custo das peças', icon: '∿' }]; },
      lowStock() { return this.state.products.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock); },
      topProducts() {
        const groups = {};
        this.monthSales.forEach(s => { if (!groups[s.productId]) groups[s.productId] = { name: s.productName, qty: 0 }; groups[s.productId].qty += s.qty; });
        return Object.values(groups).sort((a, b) => b.qty - a.qty).slice(0, 4);
      },
      daysInMonth() { if (!this.month) return 31; const [year, month] = this.month.split('-').map(Number); return new Date(year, month, 0).getDate(); },
      dailyTotals() { const totals = Array(this.daysInMonth).fill(0); this.monthSales.forEach(s => { totals[Number(s.date.slice(8)) - 1] += s.total; }); return totals; },
      chartMax() { return Math.max(100, Math.ceil(Math.max(...this.dailyTotals) / 100) * 100); },
      chartPoints() { return this.dailyTotals.map((value, i) => `${i / (this.daysInMonth - 1) * 600},${160 - value / this.chartMax * 150}`).join(' '); },
      areaPath() { return `M0 160 L${this.chartPoints.split(' ').join(' L')} L600 160 Z`; },
      rows() {
        const normalized = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const query = normalized(this.search);
        if (this.tab === 'clientes') return this.state.customers.filter(c => normalized(`${c.name} ${c.phone} ${c.email}`).includes(query));
        if (this.tab === 'pecas') return this.state.products.filter(p => normalized(`${p.name} ${p.sku} ${p.category}`).includes(query));
        return this.state.sales.filter(s => normalized(`${this.customerName(s.customerId)} ${s.productName} ${s.number}`).includes(query)).slice().sort((a, b) => b.date.localeCompare(a.date) || Number(b.number) - Number(a.number));
      },
      selectedProduct() { return this.state.products.find(p => p.id === this.draft.productId); }
    },
    watch: {
      tab() { this.search = ''; history.replaceState(null, '', `#${this.tab}`); document.title = `MotoGestão | ${this.title}`; },
      modal: { async handler(value) { await this.$nextTick(); if (value && !this.$refs.dialog.open) this.$refs.dialog.showModal(); if (!value && this.$refs.dialog.open) this.$refs.dialog.close(); } }
    },
    methods: {
      money(n) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n); },
      date(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR'); },
      initials(name) { return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase(); },
      customerName(customerId) { return this.state.customers.find(c => c.id === customerId)?.name || 'Cliente não encontrado'; },
      notify(message) { this.toast = message; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toast = '', 5000); },
      commit(operation) {
        if (this.storageError) throw new Error(this.storageError);
        const updated = D.clone(this.state);
        operation(updated);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { throw new Error('Não foi possível salvar. Libere espaço ou permita o armazenamento no navegador. Nenhuma alteração foi aplicada.'); }
        this.state = updated;
      },
      openModal(type, record) {
        this.formError = ''; this.returnFocus = document.activeElement;
        this.draft = record ? D.clone(record) : type === 'customer' ? { name: '', phone: '', email: '' } : type === 'product' ? { name: '', sku: '', category: '', cost: '', price: '', stock: 0, minStock: 3 } : { customerId: '', productId: '', qty: 1, date: D.today() };
        this.modal = { type, title: type === 'customer' ? record ? 'Editar cliente' : 'Novo cliente' : type === 'product' ? record ? 'Editar peça' : 'Nova peça' : 'Registrar venda' };
      },
      closeModal() { this.$refs.dialog.close(); this.modal = null; this.returnFocus?.focus(); },
      dialogBackdrop(event) { if (event.target === this.$refs.dialog) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.closeModal(); } },
      requestDelete(type, record) { this.formError = ''; this.returnFocus = document.activeElement; this.modal = { type: 'delete', record, recordType: type, title: 'Excluir cadastro' }; },
      requestCancel(record) { this.formError = ''; this.returnFocus = document.activeElement; this.modal = { type: 'cancel', record, title: 'Cancelar venda' }; },
      submit() {
        try {
          const type = this.modal.type;
          this.commit(state => {
            if (type === 'customer') D.saveCustomer(state, this.draft);
            if (type === 'product') D.saveProduct(state, this.draft);
            if (type === 'sale') D.registerSale(state, this.draft);
            if (type === 'delete') D.remove(state, this.modal.recordType, this.modal.record.id);
            if (type === 'cancel') D.cancelSale(state, this.modal.record.id);
            if (type === 'clear') { if (!state.demo) throw new Error('A demonstração já foi removida.'); Object.assign(state, D.empty()); }
          });
          this.closeModal(); this.notify(type === 'sale' ? 'Venda registrada. Estoque e dashboard atualizados.' : type === 'cancel' ? 'Venda cancelada. Quantidade devolvida ao estoque.' : type === 'delete' ? 'Cadastro excluído.' : type === 'clear' ? 'Demonstração removida. Sua loja está pronta para os primeiros cadastros.' : 'Cadastro salvo com sucesso.');
        } catch (error) { this.formError = error.message; }
      },
      download(content, filename, mime) {
        const url = URL.createObjectURL(new Blob([content], { type: mime }));
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      backup() {
        if (this.storageError) { this.notify('O armazenamento está indisponível; o backup não foi gerado para evitar exportar dados incompletos.'); return; }
        this.download(JSON.stringify(this.state, null, 2), `motogestao-backup-${D.today()}.json`, 'application/json');
        this.notify('Backup baixado. Guarde-o em um local seguro.');
      },
      exportSales() {
        const csvCell = value => '"' + String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
        const rows = [['Venda', 'Data', 'Cliente', 'Peça', 'Quantidade', 'Preço unitário', 'Total', 'Situação'], ...this.rows.map(s => [s.number, s.date, this.customerName(s.customerId), s.productName, s.qty, s.price.toFixed(2).replace('.', ','), s.total.toFixed(2).replace('.', ','), s.status === 'completed' ? 'Concluída' : 'Cancelada'])];
        this.download('\ufeff' + rows.map(row => row.map(csvCell).join(';')).join('\r\n'), `motogestao-vendas-${D.today()}.csv`, 'text/csv;charset=utf-8');
        this.notify('Planilha CSV das vendas filtradas exportada.');
      }
    },
    mounted() {
      window.addEventListener('hashchange', () => { const tab = location.hash.slice(1); if (titles[tab]) this.tab = tab; });
      // Evita sobrescrever mudanças feitas em outra aba do mesmo navegador.
      window.addEventListener('storage', event => {
        if (event.key === STORAGE_KEY || event.key === null) { this.storageError = 'Os registros foram alterados em outra aba. Recarregue esta página antes de continuar para usar os dados mais recentes.'; }
      });
      window.addEventListener('motogestao-sw', event => { this.swStatus = event.detail; });
      if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(r => { if (r?.active) this.swStatus = 'registrado e ativo'; }); else this.swStatus = 'indisponível neste navegador';
    }
  });
  app.mount('#app');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const statusElement = document.getElementById('sw-status');
    function status(message) { if (statusElement) statusElement.textContent = message; window.dispatchEvent(new CustomEvent('motogestao-sw', { detail: message })); }
    try {
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      status('registrado e ativo');
    } catch (error) { status('não registrado; execute pelo Live Server em localhost'); console.error(error); }
  });
}
