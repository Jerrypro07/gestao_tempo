let tarefaEditando = null;
let tempoFocoTotal = 0;

console.log("Tempo de foco iniciado:", tempoFocoTotal);


function atualizarRelogio() {

    const agora = new Date();


    const horas =
        String(agora.getHours()).padStart(2, "0");


    const minutos =
        String(agora.getMinutes()).padStart(2, "0");


    const segundos =
        String(agora.getSeconds()).padStart(2, "0");


    const horario =
        `${horas}:${minutos}:${segundos}`;


    document.getElementById("relogio").textContent =
        horario;
}


setInterval(atualizarRelogio, 1000);

atualizarRelogio();

atualizarSaudacao();

// ========================================
// MODAL DE NOVA TAREFA
// ========================================

const botaoNovaTarefa =
    document.getElementById("novaTarefa");

const modalTarefa =
    document.getElementById("modalTarefa");

const botaoFechar =
    document.getElementById("fecharModal");

const botaoCancelar =
    document.getElementById("cancelarTarefa");


// ABRIR MODAL

botaoNovaTarefa.addEventListener(
    "click",
    function () {

        modalTarefa.style.display = "flex";

    }
);


// FECHAR MODAL

botaoFechar.addEventListener(
    "click",
    function () {

        modalTarefa.style.display = "none";

    }
);


// CANCELAR

botaoCancelar.addEventListener(
    "click",
    function () {

        modalTarefa.style.display = "none";

    }
);

// ========================================
// SALVAR TAREFA
// ========================================

const botaoSalvar =
    document.getElementById("salvarTarefa");

botaoSalvar.addEventListener(
    "click",
    function (evento) {

        evento.preventDefault();

        const nome =
            document.getElementById("nomeTarefa").value;

        const horario =
            document.getElementById("horarioTarefa").value;

        const duracao =
            document.getElementById("duracaoTarefa").value;

        const categoria =
            document.getElementById("categoriaTarefa").value;

        const prioridade =
            document.getElementById("prioridadeTarefa").value;
if (tarefaEditando !== null) {

    const titulo =
        tarefaEditando.querySelector("strong");

    titulo.textContent =
        `${horario} — ${nome}`;


    const informacoes =
        tarefaEditando.querySelector(
            "p:not(.tempo-real)"
        );

    informacoes.textContent =
        `⏱️ Planejado: ${duracao} | 📂 ${categoria} | 🔥 ${prioridade}`;


    tarefaEditando = null;


    document.getElementById(
        "modalTarefa"
    ).style.display = "none";


    return;
}

mostrarTarefa(
    nome,
    horario,
    duracao,
    categoria,
    prioridade
);


atualizarDashboard();


// enviar para o banco

document.getElementById(
    "formTarefa"
).submit();


        console.log("Nome:", nome);

        console.log("Horário:", horario);

        console.log("Duração:", duracao);

        console.log("Categoria:", categoria);

        console.log("Prioridade:", prioridade);

    }
);

function mostrarTarefa(
    nome,
    horario,
    duracao,
    categoria,
    prioridade
) {

    const lista =
        document.getElementById("listaTarefas");


    const tarefa =
        document.createElement("div");


    tarefa.classList.add("tarefa");


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

            <button class="iniciar">
                ▶ Iniciar
            </button>

            <button class="concluir">
                ✓ Concluir
            </button>

            <button class="editar">
                ✏️ Editar
            </button>

            <button class="excluir">
                🗑️ Excluir
            </button>


        </div>

    `;


    lista.appendChild(tarefa);


    // ========================================
    // EXCLUIR
    // ========================================

    const botaoExcluir =
        tarefa.querySelector(".excluir");

        const botaoEditar =
    tarefa.querySelector(".editar");

    botaoExcluir.addEventListener(
        "click",
        function () {

            tarefa.remove();
            atualizarDashboard();

        }
    );


    // ========================================
    // CRONÔMETRO
    // ========================================

    const botaoIniciar =
        tarefa.querySelector(".iniciar");

const botaoConcluir =
    tarefa.querySelector(".concluir");
    
    const tempoReal =
        tarefa.querySelector(".tempo-real");


    let segundos = 0;

    let intervalo = null;

    let executando = false;



// ========================================
// EDITAR TAREFA
// ========================================
botaoEditar.addEventListener(
    "click",
    function () {

        tarefaEditando = tarefa;


        document.getElementById("nomeTarefa").value =
            nome;

        document.getElementById("horarioTarefa").value =
            horario;

        document.getElementById("duracaoTarefa").value =
            duracao;

        document.getElementById("categoriaTarefa").value =
            categoria;

        document.getElementById("prioridadeTarefa").value =
            prioridade;


        document.getElementById("modalTarefa").style.display =
            "flex";

    }
);

    // ========================================
// CONCLUIR TAREFA
// ========================================
botaoConcluir.addEventListener(
    "click",
    function () {


        // CONCLUIR
        if (!tarefa.classList.contains("concluida")) {


            // PARAR CRONÔMETRO
            if (intervalo) {

                clearInterval(intervalo);

                intervalo = null;

            }


            executando = false;


            tarefa.classList.add("concluida");


            botaoConcluir.textContent =
                "↩️ Reabrir";


            botaoIniciar.textContent =
                "▶ Finalizado";


            botaoIniciar.disabled = true;


        } 


        // REABRIR
        else {


            tarefa.classList.remove("concluida");


            botaoConcluir.textContent =
                "✓ Concluir";


            botaoIniciar.textContent =
                "▶ Continuar";


            botaoIniciar.disabled = false;


        }


        atualizarDashboard();


    }
);



    botaoIniciar.addEventListener(
        "click",
        function () {

            if (!executando) {

                executando = true;


                botaoIniciar.textContent =
                    "⏸️ Pausar";


intervalo = setInterval(
    function () {

        segundos++;

        tempoFocoTotal++;


console.log(
    "Tempo foco:",
    tempoFocoTotal
);
        
        atualizarTempoFoco();
        atualizarDashboard();
       

        const horas =
            Math.floor(
                segundos / 3600
            );


        const minutos =
            Math.floor(
                (segundos % 3600) / 60
            );


        const segundosRestantes =
            segundos % 60;


        const h =
            String(horas)
                .padStart(2, "0");


        const m =
            String(minutos)
                .padStart(2, "0");


        const s =
            String(segundosRestantes)
                .padStart(2, "0");


        tempoReal.textContent =
            `⏱️ Tempo realizado: ${h}:${m}:${s}`;

    },
    1000
);



            } else {

                executando = false;


                clearInterval(intervalo);


                botaoIniciar.textContent =
                    "▶ Continuar";

            }

        }
    );

}



// ========================================
// ATUALIZAR DASHBOARD
// ========================================
function atualizarDashboard() {

    // ========================================
    // TOTAL DE TAREFAS
    // ========================================

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


    // ========================================
    // TAREFAS CONCLUÍDAS
    // ========================================

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


    // Atualizar tempo de foco

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


    const tempoFormatado =
        String(horas).padStart(2,"0")
        + ":" +
        String(minutos).padStart(2,"0")
        + ":" +
        String(segundos).padStart(2,"0");


    const cardTempoFoco =
        document.getElementById(
            "tempoFoco"
        );


    if(cardTempoFoco){

        cardTempoFoco.innerHTML =
            tempoFormatado;

    } else {

        console.log(
            "Elemento tempoFoco não encontrado"
        );

    }

}


function atualizarSaudacao() {

    const agora = new Date();

    const hora = agora.getHours();

    let saudacao;


    if (hora >= 5 && hora < 12) {

        saudacao = "Bom dia";

    } else if (hora >= 12 && hora < 18) {

        saudacao = "Boa tarde";

    } else {

        saudacao = "Boa noite";

    }


    const nomeUsuario =
        document.getElementById(
            "nomeUsuario"
        ).textContent.trim();


    document.getElementById(
        "saudacao"
    ).textContent =
        `${saudacao}, ${nomeUsuario} 👋`;

}


atualizarSaudacao();


// ========================================
// ATIVAR BOTÕES DAS TAREFAS CARREGADAS DO BANCO
// ========================================

document.querySelectorAll(".tarefa").forEach(
    function(tarefa) {


        const botaoExcluir =
            tarefa.querySelector(".excluir");


        const botaoIniciar =
            tarefa.querySelector(".iniciar");


        const botaoConcluir =
            tarefa.querySelector(".concluir");


        const tempoReal =
            tarefa.querySelector(".tempo-real");


        let segundos = 0;

        let intervalo = null;

        let executando = false;



        // EXCLUIR

        if(botaoExcluir){

            botaoExcluir.addEventListener(
                "click",
                function(){

                    tarefa.remove();

                    atualizarDashboard();

                }
            );

        }



        // CRONÔMETRO

        if(botaoIniciar){

            botaoIniciar.addEventListener(
                "click",
                function(){


                    if(!executando){


                        executando = true;


                        botaoIniciar.textContent =
                        "⏸️ Pausar";


                        intervalo =
                        setInterval(function(){


                            segundos++;
                            tempoFocoTotal = tempoFocoTotal + 1;

                             atualizarDashboard();


                            let h =
                            String(
                                Math.floor(segundos / 3600)
                            ).padStart(2,"0");


                            let m =
                            String(
                                Math.floor(
                                    (segundos % 3600) / 60
                                )
                            ).padStart(2,"0");


                            let s =
                            String(
                                segundos % 60
                            ).padStart(2,"0");


                            tempoReal.textContent =
                            `⏱️ Tempo realizado: ${h}:${m}:${s}`;


                        },1000);



                    } else {


                        executando = false;


                        clearInterval(intervalo);


                        botaoIniciar.textContent =
                        "▶ Continuar";

                    }


                }
            );

        }



        // CONCLUIR

        if(botaoConcluir){

            botaoConcluir.addEventListener(
                "click",
                function(){


                    tarefa.classList.toggle(
                        "concluida"
                    );


                    if(
                    tarefa.classList.contains("concluida")
                    ){

                        botaoConcluir.textContent =
                        "↩️ Reabrir";


                    }else{


                        botaoConcluir.textContent =
                        "✓ Concluir";

                    }


                    atualizarDashboard();


                }
            );

        }


    }
);