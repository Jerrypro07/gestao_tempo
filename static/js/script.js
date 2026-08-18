let tarefaEditando = null;
let tempoFocoTotal = 0;


// =====================================================
// RELÓGIO PRINCIPAL
// =====================================================

function atualizarRelogio() {

    const agora = new Date();

    const horas =
        String(agora.getHours()).padStart(2, "0");

    const minutos =
        String(agora.getMinutes()).padStart(2, "0");

    const segundos =
        String(agora.getSeconds()).padStart(2, "0");

    const relogio =
        document.getElementById("relogio");

    if (relogio) {

        relogio.textContent =
            `${horas}:${minutos}:${segundos}`;

    }
}


setInterval(
    atualizarRelogio,
    1000
);

atualizarRelogio();


// =====================================================
// SAUDAÇÃO
// =====================================================

function atualizarSaudacao() {

    const agora = new Date();

    const hora =
        agora.getHours();

    let saudacao;


    if (hora >= 5 && hora < 12) {

        saudacao = "Bom dia";

    } else if (hora >= 12 && hora < 18) {

        saudacao = "Boa tarde";

    } else {

        saudacao = "Boa noite";

    }


    const elementoNome =
        document.getElementById("nomeUsuario");

    const elementoSaudacao =
        document.getElementById("saudacao");


    if (!elementoNome || !elementoSaudacao) {

        return;

    }

const nomeCompleto =
    elementoNome.textContent.trim();

const primeiroNome =
    nomeCompleto.split(/\s+/)[0];


elementoSaudacao.textContent =
    `${saudacao}, ${primeiroNome} 👋`;

}


atualizarSaudacao();


// =====================================================
// MODAL DE NOVA TAREFA
// =====================================================

const botaoNovaTarefa =
    document.getElementById("novaTarefa");

const modalTarefa =
    document.getElementById("modalTarefa");

const botaoFechar =
    document.getElementById("fecharModal");

const botaoCancelar =
    document.getElementById("cancelarTarefa");


if (botaoNovaTarefa && modalTarefa) {

    botaoNovaTarefa.addEventListener(
        "click",
        function () {

            modalTarefa.style.display = "flex";

        }
    );

}


if (botaoFechar && modalTarefa) {

    botaoFechar.addEventListener(
        "click",
        function () {

            modalTarefa.style.display = "none";

        }
    );

}


if (botaoCancelar && modalTarefa) {

    botaoCancelar.addEventListener(
        "click",
        function () {

            modalTarefa.style.display = "none";

        }
    );

}


// =====================================================
// ATUALIZAR DASHBOARD
// =====================================================

function atualizarDashboard() {

    const totalTarefas =
        document.querySelectorAll(
            ".tarefa"
        ).length;


    const cardTarefas =
        document.getElementById(
            "totalTarefas"
        );


    if (cardTarefas) {

        cardTarefas.textContent =
            totalTarefas;

    }


    const tarefasConcluidas =
        document.querySelectorAll(
            ".tarefa.concluida"
        ).length;


    const cardConcluidas =
        document.getElementById(
            "tarefasConcluidas"
        );


    if (cardConcluidas) {

        cardConcluidas.textContent =
            tarefasConcluidas;

    }


    atualizarTempoFoco();

}


// =====================================================
// ATUALIZAR TEMPO DE FOCO
// =====================================================

function atualizarTempoFoco() {

    const horas =
        Math.floor(
            tempoFocoTotal / 3600
        );

    const minutos =
        Math.floor(
            (tempoFocoTotal % 3600) / 60
        );

    const segundos =
        tempoFocoTotal % 60;


    const h =
        String(horas).padStart(2, "0");

    const m =
        String(minutos).padStart(2, "0");

    const s =
        String(segundos).padStart(2, "0");


    const elementoFoco =
        document.getElementById(
            "tempoFoco"
        );


    if (elementoFoco) {

        elementoFoco.textContent =
            `${h}:${m}:${s}`;

    }

}


// =====================================================
// SALVAR / EDITAR TAREFA
// =====================================================

const botaoSalvar =
    document.getElementById(
        "salvarTarefa"
    );


if (botaoSalvar) {

    botaoSalvar.addEventListener(
        "click",
        function (evento) {

            evento.preventDefault();


            const nome =
                document.getElementById(
                    "nomeTarefa"
                ).value;

            const horario =
                document.getElementById(
                    "horarioTarefa"
                ).value;

            const duracao =
                document.getElementById(
                    "duracaoTarefa"
                ).value;

            const categoria =
                document.getElementById(
                    "categoriaTarefa"
                ).value;

            const prioridade =
                document.getElementById(
                    "prioridadeTarefa"
                ).value;


            // =========================================
            // EDITAR TAREFA EXISTENTE
            // =========================================

            if (tarefaEditando !== null) {

                const titulo =
                    tarefaEditando.querySelector(
                        "strong"
                    );


                if (titulo) {

                    titulo.textContent =
                        `${horario} — ${nome}`;

                }


                const informacoes =
                    tarefaEditando.querySelector(
                        "p:not(.tempo-real)"
                    );


                if (informacoes) {

                    informacoes.textContent =
                        `⏱️ Planejado: ${duracao} | 📂 ${categoria} | 🔥 ${prioridade}`;

                }


                tarefaEditando =
                    null;


                if (modalTarefa) {

                    modalTarefa.style.display =
                        "none";

                }


                return;

            }


            // =========================================
            // NOVA TAREFA
            // =========================================

            mostrarTarefa(
                nome,
                horario,
                duracao,
                categoria,
                prioridade
            );


            atualizarDashboard();


            // =========================================
            // ENVIAR PARA O BANCO
            // =========================================

            const formTarefa =
                document.getElementById(
                    "formTarefa"
                );


            if (formTarefa) {

                formTarefa.submit();

            }

        }
    );

}


// =====================================================
// MOSTRAR NOVA TAREFA
// =====================================================

function mostrarTarefa(
    nome,
    horario,
    duracao,
    categoria,
    prioridade
) {

    const lista =
        document.getElementById(
            "listaTarefas"
        );


    if (!lista) {

        return;

    }


    const tarefa =
        document.createElement("div");


    tarefa.classList.add(
        "tarefa"
    );


    /*
     * A tarefa nova ainda não possui ID,
     * pois o ID será criado pelo banco.
     *
     * Depois que o formulário for enviado,
     * o Flask recarrega o dashboard com o ID correto.
     */


    tarefa.innerHTML = `

        <div>

            <strong>
                ${horario} — ${nome}
            </strong>

            <p>
                ⏱️ Planejado: ${duracao}
                |
                📂 ${categoria}
                |
                🔥 ${prioridade}
            </p>

            <p class="tempo-real">
                ⏱️ Tempo realizado: 00:00:00
            </p>

        </div>


        <div>

            <button
                class="iniciar"
                type="button"
            >
                ▶ Iniciar
            </button>

            <button
                class="concluir"
                type="button"
            >
                ✓ Concluir
            </button>

            <button
                class="editar"
                type="button"
            >
                ✏️ Editar
            </button>

            <button
                class="excluir"
                type="button"
            >
                🗑️ Excluir
            </button>

        </div>

    `;


    lista.appendChild(
        tarefa
    );


    configurarTarefa(
        tarefa,
        {
            nome,
            horario,
            duracao,
            categoria,
            prioridade
        }
    );

}


// =====================================================
// CONFIGURAR TAREFA
// =====================================================

function configurarTarefa(
    tarefa,
    dados = {}
) {

    const botaoExcluir =
        tarefa.querySelector(
            ".excluir"
        );

    const botaoEditar =
        tarefa.querySelector(
            ".editar"
        );

    const botaoIniciar =
        tarefa.querySelector(
            ".iniciar"
        );

    const botaoConcluir =
        tarefa.querySelector(
            ".concluir"
        );

    const tempoReal =
        tarefa.querySelector(
            ".tempo-real"
        );


    // =================================================
    // ID DA TAREFA
    // =================================================

    const tarefaId =
        tarefa.dataset.id;


    // =================================================
    // VARIÁVEIS DO CRONÔMETRO
    // =================================================

    let segundos = 0;

    let intervalo = null;

    let executando = false;


    // =================================================
    // FORMATAR TEMPO
    // =================================================

    function formatarTempo(totalSegundos) {

        const horas =
            Math.floor(
                totalSegundos / 3600
            );

        const minutos =
            Math.floor(
                (totalSegundos % 3600) / 60
            );

        const segundosRestantes =
            totalSegundos % 60;


        const h =
            String(horas)
                .padStart(2, "0");

        const m =
            String(minutos)
                .padStart(2, "0");

        const s =
            String(segundosRestantes)
                .padStart(2, "0");


        return `${h}:${m}:${s}`;

    }


    // =================================================
    // ATUALIZAR TEMPO DA TAREFA
    // =================================================

    function atualizarTempoTarefa() {

        if (tempoReal) {

            tempoReal.textContent =
                `⏱️ Tempo realizado: ${formatarTempo(segundos)}`;

        }

    }


    // =================================================
    // PARAR CRONÔMETRO
    // =================================================

    function pararCronometro() {

        if (intervalo !== null) {

            clearInterval(
                intervalo
            );

            intervalo = null;

        }


        executando = false;

    }


    // =================================================
    // INICIAR / PAUSAR
    // =================================================

    if (botaoIniciar) {

        botaoIniciar.addEventListener(
            "click",
            function () {

                if (
                    tarefa.classList.contains(
                        "concluida"
                    )
                ) {

                    return;

                }


                if (executando) {

                    pararCronometro();


                    botaoIniciar.textContent =
                        "▶ Continuar";


                    return;

                }


                executando = true;


                botaoIniciar.textContent =
                    "⏸️ Pausar";


                intervalo =
                    setInterval(
                        function () {

                            segundos++;

                            tempoFocoTotal++;


                            atualizarTempoTarefa();

                            atualizarTempoFoco();

                        },
                        1000
                    );

            }
        );

    }


    // =================================================
    // CONCLUIR / REABRIR
    // =================================================

    if (botaoConcluir) {

        botaoConcluir.addEventListener(
            "click",
            function () {

                if (
                    !tarefa.classList.contains(
                        "concluida"
                    )
                ) {

                    pararCronometro();


                    tarefa.classList.add(
                        "concluida"
                    );


                    botaoConcluir.textContent =
                        "↩️ Reabrir";


                    if (botaoIniciar) {

                        botaoIniciar.textContent =
                            "▶ Finalizado";

                        botaoIniciar.disabled =
                            true;

                    }

                }

                else {

                    tarefa.classList.remove(
                        "concluida"
                    );


                    botaoConcluir.textContent =
                        "✓ Concluir";


                    if (botaoIniciar) {

                        botaoIniciar.disabled =
                            false;

                        botaoIniciar.textContent =
                            "▶ Continuar";

                    }

                }


                atualizarDashboard();

            }
        );

    }


    // =================================================
    // EDITAR
    // =================================================

    if (botaoEditar) {

        botaoEditar.addEventListener(
            "click",
            function () {

                tarefaEditando =
                    tarefa;


                const nomeTarefa =
                    document.getElementById(
                        "nomeTarefa"
                    );

                const horarioTarefa =
                    document.getElementById(
                        "horarioTarefa"
                    );

                const duracaoTarefa =
                    document.getElementById(
                        "duracaoTarefa"
                    );

                const categoriaTarefa =
                    document.getElementById(
                        "categoriaTarefa"
                    );

                const prioridadeTarefa =
                    document.getElementById(
                        "prioridadeTarefa"
                    );


                if (nomeTarefa) {

                    nomeTarefa.value =
                        dados.nome || "";

                }


                if (horarioTarefa) {

                    horarioTarefa.value =
                        dados.horario || "";

                }


                if (duracaoTarefa) {

                    duracaoTarefa.value =
                        dados.duracao || "";

                }


                if (categoriaTarefa) {

                    categoriaTarefa.value =
                        dados.categoria || "";

                }


                if (prioridadeTarefa) {

                    prioridadeTarefa.value =
                        dados.prioridade || "";

                }


                if (modalTarefa) {

                    modalTarefa.style.display =
                        "flex";

                }

            }
        );

    }


    // =================================================
    // EXCLUIR TAREFA
    // =================================================

    if (botaoExcluir) {

        botaoExcluir.addEventListener(
            "click",
            function () {

                // -------------------------------------
                // VERIFICAR ID
                // -------------------------------------

                if (!tarefaId) {

                    console.error(
                        "Não foi possível excluir a tarefa: ID não encontrado."
                    );

                    return;

                }


                // -------------------------------------
                // CONFIRMAÇÃO
                // -------------------------------------

                const confirmar =
                    confirm(
                        "Tem certeza que deseja excluir esta tarefa?"
                    );


                if (!confirmar) {

                    return;

                }


                // -------------------------------------
                // PARAR CRONÔMETRO
                // -------------------------------------

                pararCronometro();


                // -------------------------------------
                // CRIAR FORMULÁRIO
                // -------------------------------------

                const form =
                    document.createElement(
                        "form"
                    );


                form.method =
                    "POST";


                form.action =
                    `/excluir_tarefa/${tarefaId}`;


                // -------------------------------------
                // ENVIAR PARA O FLASK
                // -------------------------------------

                document.body.appendChild(
                    form
                );


                form.submit();

            }
        );

    }


    atualizarTempoTarefa();

}


// =====================================================
// ATIVAR TAREFAS CARREGADAS DO BANCO
// =====================================================

document
    .querySelectorAll(".tarefa")
    .forEach(
        function (tarefa) {

            configurarTarefa(
                tarefa
            );

        }
    );


// =====================================================
// ATUALIZAÇÃO INICIAL
// =====================================================

atualizarDashboard();

atualizarSaudacao();


// =====================================================
// LOG
// =====================================================

console.log(
    "Tempo de foco iniciado:",
    tempoFocoTotal
);