(() => {
  "use strict";
  const STORAGE_KEY = "fluxedu-demo-data-v2";
  const $ = id => document.getElementById(id);
  const moeda = value => Number(value || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }) + " MT";
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  let state = { alunos: [], pagamentos: [] };
  let toastTimeout;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.alunos) && Array.isArray(saved.pagamentos)) state = saved;
  } catch { /* Se os dados estiverem inválidos, inicia uma demonstração vazia. */ }

  function guardar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { mostrarToast("Não foi possível guardar os dados neste navegador."); }
  }
  function mostrarToast(message) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function pendencia(aluno) {
    const pago = state.pagamentos.filter(p => p.alunoId === aluno.id)
      .reduce((sum, payment) => sum + Number(payment.valor), 0);
    return Math.max(0, Number(aluno.mensalidade) - pago);
  }
  function mudarPagina(pageId) {
    document.querySelectorAll(".dash-page").forEach(page => page.classList.toggle("hidden", page.id !== pageId));
    document.querySelectorAll(".dash-link").forEach(button => button.classList.toggle("active", button.dataset.page === pageId));
    const titles = { dashboard: "Painel principal", alunos: "Gestão de alunos", pagamentos: "Pagamentos", relatorios: "Relatórios" };
    $("page-title").textContent = titles[pageId] || "Painel principal";
  }
  document.querySelectorAll(".dash-link").forEach(button => button.addEventListener("click", () => mudarPagina(button.dataset.page)));
  document.querySelectorAll("[data-goto]").forEach(button => button.addEventListener("click", () => mudarPagina(button.dataset.goto)));

  $("form-aluno").addEventListener("submit", event => {
    event.preventDefault();
    const nome = $("nome").value.trim();
    const encarregado = $("encarregado").value.trim();
    const mensalidade = Number($("mensalidade").value);
    if (!nome || !encarregado || !Number.isFinite(mensalidade) || mensalidade < 0) {
      mostrarToast("Verifique os dados introduzidos."); return;
    }
    state.alunos.push({ id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())), nome, encarregado, mensalidade });
    guardar(); event.target.reset(); renderizar(); mostrarToast("Aluno adicionado com sucesso.");
  });

  $("form-pagamento").addEventListener("submit", event => {
    event.preventDefault();
    const alunoId = $("aluno-pagamento").value;
    const valor = Number($("valor-pagamento").value);
    const mes = $("mes-pagamento").value;
    if (!state.alunos.some(aluno => aluno.id === alunoId) || !mes || !Number.isFinite(valor) || valor <= 0) {
      mostrarToast("Selecione um aluno e introduza um valor válido."); return;
    }
    state.pagamentos.unshift({ id: String(Date.now()), alunoId, mes, valor, data: new Date().toLocaleDateString("pt-MZ") });
    guardar(); event.target.reset(); renderizar(); mostrarToast("Pagamento registado com sucesso.");
  });

  $("pesquisa").addEventListener("input", renderizar);
  $("lista-alunos").addEventListener("click", event => {
    const button = event.target.closest("[data-remover]");
    if (!button) return;
    const aluno = state.alunos.find(item => item.id === button.dataset.remover);
    if (!aluno || !confirm(`Remover ${aluno.nome} e os respetivos pagamentos?`)) return;
    state.alunos = state.alunos.filter(item => item.id !== aluno.id);
    state.pagamentos = state.pagamentos.filter(payment => payment.alunoId !== aluno.id);
    guardar(); renderizar(); mostrarToast("Aluno removido.");
  });

  function renderizar() {
    const termo = $("pesquisa").value.trim().toLocaleLowerCase("pt");
    const filtrados = state.alunos.filter(aluno => `${aluno.nome} ${aluno.encarregado}`.toLocaleLowerCase("pt").includes(termo));
    $("lista-alunos").innerHTML = filtrados.map(aluno => {
      const saldo = pendencia(aluno);
      return `<tr><td><strong>${escapeHTML(aluno.nome)}</strong></td><td>${escapeHTML(aluno.encarregado)}</td><td>${moeda(aluno.mensalidade)}</td><td><span class="status-pill ${saldo > 0 ? "status-pending" : "status-ok"}">${saldo > 0 ? "Pendente" : "Regular"}</span></td><td><button class="danger" data-remover="${escapeHTML(aluno.id)}">Remover</button></td></tr>`;
    }).join("") || `<tr><td class="table-empty" colspan="5">${state.alunos.length ? "Nenhum aluno corresponde à pesquisa." : "Ainda não existem alunos registados."}</td></tr>`;

    $("aluno-pagamento").innerHTML = `<option value="">Selecionar aluno</option>` + state.alunos.map(aluno => `<option value="${escapeHTML(aluno.id)}">${escapeHTML(aluno.nome)}</option>`).join("");
    $("lista-pagamentos").innerHTML = state.pagamentos.map(payment => {
      const aluno = state.alunos.find(item => item.id === payment.alunoId);
      return `<tr><td>${escapeHTML(aluno ? aluno.nome : "Aluno removido")}</td><td>${escapeHTML(payment.mes)}</td><td><strong>${moeda(payment.valor)}</strong></td><td>${escapeHTML(payment.data)}</td></tr>`;
    }).join("") || `<tr><td class="table-empty" colspan="4">Ainda não existem pagamentos registados.</td></tr>`;

    const receitas = state.pagamentos.reduce((sum, payment) => sum + Number(payment.valor), 0);
    $("total-alunos").textContent = state.alunos.length;
    $("total-receitas").textContent = moeda(receitas);
    $("total-pendentes").textContent = state.alunos.filter(aluno => pendencia(aluno) > 0).length;
    $("relatorio-receitas").textContent = moeda(receitas);
    $("relatorio-contagem").textContent = state.pagamentos.length;
    const atividade = $("atividade");
    if (!state.pagamentos.length) {
      atividade.className = "activity-empty";
      atividade.innerHTML = `<span>▤</span><strong>Ainda não existem registos</strong><p>Quando registar pagamentos, a atividade aparecerá aqui.</p>`;
    } else {
      atividade.className = "table-wrap";
      atividade.innerHTML = `<table><thead><tr><th>Aluno</th><th>Mês</th><th>Valor</th><th>Data</th></tr></thead><tbody>${state.pagamentos.slice(0, 5).map(payment => {
        const aluno = state.alunos.find(item => item.id === payment.alunoId);
        return `<tr><td>${escapeHTML(aluno ? aluno.nome : "Aluno removido")}</td><td>${escapeHTML(payment.mes)}</td><td><strong>${moeda(payment.valor)}</strong></td><td>${escapeHTML(payment.data)}</td></tr>`;
      }).join("")}</tbody></table>`;
    }
  }

  $("exportar").addEventListener("click", () => {
    const rows = [["Aluno", "Encarregado", "Mensalidade MT", "Mês pago", "Valor pago MT", "Data"]];
    state.alunos.forEach(aluno => {
      const payments = state.pagamentos.filter(payment => payment.alunoId === aluno.id);
      if (!payments.length) rows.push([aluno.nome, aluno.encarregado, aluno.mensalidade, "Sem pagamento", 0, ""]);
      else payments.forEach(payment => rows.push([aluno.nome, aluno.encarregado, aluno.mensalidade, payment.mes, payment.valor, payment.data]));
    });
    const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = "relatorio-fluxedu.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    mostrarToast("Relatório CSV exportado.");
  });

  renderizar();
})();