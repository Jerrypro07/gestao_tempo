/* =====================================================
   GESTÃO DE TEMPO — script.js
   Relógio, cronômetro real (persistido no backend),
   notificações de início/fim de tarefa.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------
    // RELÓGIO
    // -------------------------------------------------
    const relogioEl = document.getElementById("relogio");
    const saudacaoEl = document.getElementById("saudacao");

    function saudacaoPorHorario(hora) {
        if (hora < 12) return "Bom dia";
        if (hora < 18) return "Boa tarde";
        return "Boa noite";
    }

    function atualizarSaudacao() {
        if (!saudacaoEl) return;
        const nome = saudacaoEl.dataset.nome || "";
        const agora = new Date();
        const texto = saudacaoPorHorario(agora.getHours());
        saudacaoEl.textContent = nome ? `${texto}, ${nome} 👋` : `${texto} 👋`;
    }

    function atualizarRelogio() {
        const agora = new Date();
        const hh = String(agora.getHours()).padStart(2, "0");
        const mm = String(agora.getMinutes()).padStart(2, "0");
        const ss = String(agora.getSeconds()).padStart(2, "0");
        if (relogioEl) {
            relogioEl.textContent = `${hh}:${mm}:${ss}`;
        }
    }
    atualizarRelogio();
    atualizarSaudacao();
    setInterval(atualizarRelogio, 1000);
    // A saudação só precisa recalcular a cada minuto (troca de período)
    setInterval(atualizarSaudacao, 60000);

    // -------------------------------------------------
    // TEMPO DE FOCO TOTAL (card do topo)
    // -------------------------------------------------
    const tempoFocoEl = document.getElementById("tempoFoco");
    if (tempoFocoEl) {
        const segundosBase = parseInt(tempoFocoEl.dataset.segundos || "0", 10);
        tempoFocoEl.textContent = formatarDuracao(segundosBase);
    }

    // -------------------------------------------------
    // NOTIFICAÇÕES (Notification API + fallback toast)
    // -------------------------------------------------
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    function notificar(titulo, corpo) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(titulo, { body: corpo, icon: "" });
        } else {
            mostrarToast(titulo, corpo);
        }
    }

    function mostrarToast(titulo, corpo) {
        let container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<strong>${titulo}</strong>${corpo}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    }

    // -------------------------------------------------
    // UTILITÁRIOS DE TEMPO
    // -------------------------------------------------
    function formatarDuracao(totalSegundos) {
        const s = Math.max(0, Math.floor(totalSegundos));
        const hh = String(Math.floor(s / 3600)).padStart(2, "0");
        const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
    }

    function horaParaData(horaTexto) {
        // "HH:MM" -> Date de hoje com essa hora
        if (!horaTexto) return null;
        const [h, m] = horaTexto.split(":").map(Number);
        const d = new Date();
        d.setHours(h || 0, m || 0, 0, 0);
        return d;
    }

    function horaRealParaData(horaTexto) {
        // "HH:MM:SS" -> Date de hoje com essa hora
        if (!horaTexto) return null;
        const [h, m, s] = horaTexto.split(":").map(Number);
        const d = new Date();
        d.setHours(h || 0, m || 0, s || 0, 0);
        return d;
    }

    // -------------------------------------------------
    // CONTROLE DE CADA TAREFA
    // -------------------------------------------------
    const timersAtivos = {}; // tarefaId -> intervalId
    const avisosEnviados = {}; // tarefaId -> { antes: bool, inicio: bool }

    function inicializarTarefaDOM(tarefaEl) {
        const tarefaId = tarefaEl.dataset.id;
        const status = tarefaEl.dataset.status;
        const tempoRealEl = tarefaEl.querySelector(".tempo-real-valor");

        avisosEnviados[tarefaId] = avisosEnviados[tarefaId] || {};

        if (status === "em_andamento") {
            const inicioReal = horaRealParaData(tarefaEl.dataset.inicioReal);
            iniciarCronometro(tarefaId, tarefaEl, inicioReal);
        } else if (status === "concluida") {
            const segundos = parseInt(tarefaEl.dataset.tempoRealSegundos || "0", 10);
            if (tempoRealEl) tempoRealEl.textContent = formatarDuracao(segundos);
        } else {
            if (tempoRealEl) tempoRealEl.textContent = "00:00:00";
        }
    }

    function iniciarCronometro(tarefaId, tarefaEl, inicioReal) {
        pararCronometro(tarefaId);
        const tempoRealEl = tarefaEl.querySelector(".tempo-real-valor");

        timersAtivos[tarefaId] = setInterval(() => {
            const agora = new Date();
            const decorridoSegundos = Math.floor((agora - inicioReal) / 1000);
            if (tempoRealEl) {
                tempoRealEl.textContent = formatarDuracao(decorridoSegundos);
            }
        }, 1000);
    }

    function pararCronometro(tarefaId) {
        if (timersAtivos[tarefaId]) {
            clearInterval(timersAtivos[tarefaId]);
            delete timersAtivos[tarefaId];
        }
    }

    // -------------------------------------------------
    // AÇÕES: INICIAR / CONCLUIR (persistem no backend)
    // -------------------------------------------------
    async function iniciarTarefa(tarefaEl) {
        const tarefaId = tarefaEl.dataset.id;
        try {
            const resp = await fetch(`/iniciar_tarefa/${tarefaId}`, { method: "POST" });
            if (!resp.ok) throw new Error("Falha ao iniciar tarefa");
            const dados = await resp.json();

            tarefaEl.dataset.status = dados.status;
            tarefaEl.dataset.inicioReal = dados.inicio_real || "";
            tarefaEl.dataset.fimReal = "";

            const inicioEl = tarefaEl.querySelector(".inicio-real");
            const fimEl = tarefaEl.querySelector(".fim-real");
            if (inicioEl) inicioEl.textContent = dados.inicio_real || "—";
            if (fimEl) fimEl.textContent = "—";

            const btnIniciar = tarefaEl.querySelector(".iniciar");
            const btnConcluir = tarefaEl.querySelector(".concluir");
            if (btnIniciar) btnIniciar.disabled = true;
            if (btnConcluir) btnConcluir.disabled = false;

            iniciarCronometro(tarefaId, tarefaEl, horaRealParaData(dados.inicio_real));

            notificar("🔔 Tarefa iniciada!", `Você começou: ${tarefaEl.dataset.nome}`);
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível iniciar a tarefa. Tente novamente.");
        }
    }

    async function concluirTarefa(tarefaEl) {
        const tarefaId = tarefaEl.dataset.id;
        try {
            const resp = await fetch(`/concluir_tarefa/${tarefaId}`, { method: "POST" });
            if (!resp.ok) throw new Error("Falha ao concluir tarefa");
            const dados = await resp.json();

            pararCronometro(tarefaId);

            tarefaEl.dataset.status = dados.status;
            tarefaEl.dataset.fimReal = dados.fim_real || "";
            tarefaEl.dataset.tempoRealSegundos = dados.tempo_real_segundos || 0;
            tarefaEl.classList.add("concluida");

            const fimEl = tarefaEl.querySelector(".fim-real");
            const tempoRealEl = tarefaEl.querySelector(".tempo-real-valor");
            if (fimEl) fimEl.textContent = dados.fim_real || "—";
            if (tempoRealEl) tempoRealEl.textContent = formatarDuracao(dados.tempo_real_segundos || 0);

            const btnIniciar = tarefaEl.querySelector(".iniciar");
            const btnConcluir = tarefaEl.querySelector(".concluir");
            if (btnIniciar) btnIniciar.disabled = true;
            if (btnConcluir) btnConcluir.disabled = true;

            notificar("✅ Tarefa concluída!", `Você finalizou: ${tarefaEl.dataset.nome}`);
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível concluir a tarefa. Tente novamente.");
        }
    }

    // -------------------------------------------------
    // LIGAR OS BOTÕES DE CADA TAREFA
    // -------------------------------------------------
    document.querySelectorAll(".tarefa").forEach((tarefaEl) => {
        inicializarTarefaDOM(tarefaEl);

        const btnIniciar = tarefaEl.querySelector(".iniciar");
        const btnConcluir = tarefaEl.querySelector(".concluir");

        if (btnIniciar) {
            btnIniciar.addEventListener("click", () => iniciarTarefa(tarefaEl));
        }
        if (btnConcluir) {
            btnConcluir.addEventListener("click", () => concluirTarefa(tarefaEl));
        }
    });

    // -------------------------------------------------
    // AVISO 5 MINUTOS ANTES + NA HORA DA TAREFA
    // (verifica a cada 30s comparando com o horário planejado)
    // -------------------------------------------------
    function verificarAvisosDeHorario() {
        const agora = new Date();

        document.querySelectorAll(".tarefa").forEach((tarefaEl) => {
            const tarefaId = tarefaEl.dataset.id;
            const status = tarefaEl.dataset.status;
            if (status !== "pendente") return;

            const horarioPlanejado = horaParaData(tarefaEl.dataset.horario);
            if (!horarioPlanejado) return;

            const diffMinutos = (horarioPlanejado - agora) / 60000;
            avisosEnviados[tarefaId] = avisosEnviados[tarefaId] || {};

            // aviso 5 minutos antes
            if (diffMinutos <= 5 && diffMinutos > 4 && !avisosEnviados[tarefaId].antes) {
                notificar(
                    "🔔 Sua tarefa está chegando",
                    `${tarefaEl.dataset.nome} começará em 5 minutos.`
                );
                avisosEnviados[tarefaId].antes = true;
            }

            // aviso na hora exata (janela de 1 minuto)
            if (diffMinutos <= 0 && diffMinutos > -1 && !avisosEnviados[tarefaId].inicio) {
                notificar(
                    "🔔 Hora da tarefa!",
                    `Está na hora de iniciar: ${tarefaEl.dataset.nome}.`
                );
                avisosEnviados[tarefaId].inicio = true;
            }
        });
    }

    verificarAvisosDeHorario();
    setInterval(verificarAvisosDeHorario, 30000);

    // -------------------------------------------------
    // MODAL NOVA TAREFA / EDITAR TAREFA
    // -------------------------------------------------
    const modal = document.getElementById("modalTarefa");
    const btnNovaTarefa = document.getElementById("novaTarefa");
    const btnFecharModal = document.getElementById("fecharModal");
    const btnCancelarTarefa = document.getElementById("cancelarTarefa");
    const formTarefa = document.getElementById("formTarefa");
    const modalTitulo = document.getElementById("modalTitulo");
    const btnSalvarTarefa = document.getElementById("salvarTarefa");

    const urlCriar = (modal && modal.dataset.urlCriar) || "/criar_tarefa";

    function abrirModal() {
        if (modal) modal.style.display = "flex";
    }
    function fecharModal() {
        if (modal) modal.style.display = "none";
    }
    function limparFormulario() {
        if (formTarefa) formTarefa.reset();
    }

    // Abrir modal em modo "Nova tarefa"
    function abrirModalCriacao() {
        limparFormulario();
        if (formTarefa) formTarefa.action = urlCriar;
        if (modalTitulo) modalTitulo.textContent = "Nova tarefa";
        if (btnSalvarTarefa) btnSalvarTarefa.textContent = "Salvar tarefa";
        abrirModal();
    }

    // Abrir modal em modo "Editar tarefa", pré-preenchido
    function abrirModalEdicao(tarefaEl) {
        const tarefaId = tarefaEl.dataset.id;

        document.getElementById("nomeTarefa").value = tarefaEl.dataset.nome || "";
        document.getElementById("horarioTarefa").value = tarefaEl.dataset.horario || "";
        document.getElementById("duracaoTarefa").value = tarefaEl.dataset.duracao || "";
        document.getElementById("categoriaTarefa").value = tarefaEl.dataset.categoria || "";
        document.getElementById("prioridadeTarefa").value = tarefaEl.dataset.prioridade || "";

        if (formTarefa) formTarefa.action = `/editar_tarefa/${tarefaId}`;
        if (modalTitulo) modalTitulo.textContent = "Editar tarefa";
        if (btnSalvarTarefa) btnSalvarTarefa.textContent = "Salvar alterações";

        abrirModal();
    }

    if (btnNovaTarefa) btnNovaTarefa.addEventListener("click", abrirModalCriacao);
    if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModal);
    if (btnCancelarTarefa) btnCancelarTarefa.addEventListener("click", fecharModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharModal();
        });
    }

    document.querySelectorAll(".editar").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tarefaEl = btn.closest(".tarefa");
            if (tarefaEl) abrirModalEdicao(tarefaEl);
        });
    });

    // -------------------------------------------------
    // CENTRAL DE AJUDA — accordion de perguntas
    // -------------------------------------------------
    document.querySelectorAll(".faq-item .faq-pergunta").forEach((btn) => {
        btn.addEventListener("click", () => {
            const item = btn.closest(".faq-item");
            if (!item) return;

            const jaAberto = item.classList.contains("aberto");

            // fecha os outros itens abertos (accordion exclusivo)
            document.querySelectorAll(".faq-item.aberto").forEach((outro) => {
                if (outro !== item) outro.classList.remove("aberto");
            });

            item.classList.toggle("aberto", !jaAberto);
        });
    });
});