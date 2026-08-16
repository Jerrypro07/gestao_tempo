
from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import (   generate_password_hash, check_password_hash)
from flask_login import (LoginManager, UserMixin, login_user,logout_user, login_required,current_user)
import os


app = Flask(__name__)


app.config['SECRET_KEY'] = 'chave-secreta-gestao-tempo'


# Caminho seguro do banco

BASE_DIR = os.path.abspath(
    os.path.dirname(__file__)
)


app.config['SQLALCHEMY_DATABASE_URI'] = (
    'sqlite:///' +
    os.path.join(
        BASE_DIR,
        'database',
        'usuarios.db'
    )
)


app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db = SQLAlchemy(app)

login_manager = LoginManager()

login_manager.init_app(app)

login_manager.login_view = "login"

# ==========================
# MODELO USUARIO
# ==========================

class Usuario(db.Model, UserMixin):
    
    

    id = db.Column(
        db.Integer,
        primary_key=True
    )


    nome = db.Column(
        db.String(100),
        nullable=False
    )


    email = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )


    senha = db.Column(
        db.String(200),
        nullable=False
    )
    
    tarefas = db.relationship(
    "Tarefa",
    backref="usuario",
    lazy=True
)

# ==========================
# MODELO TAREFA
# ==========================

class Tarefa(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )


    nome = db.Column(
        db.String(200),
        nullable=False
    )


    horario = db.Column(
        db.String(20),
        nullable=False
    )


    duracao = db.Column(
        db.String(50),
        nullable=False
    )


    categoria = db.Column(
        db.String(100),
        nullable=False
    )


    prioridade = db.Column(
        db.String(50),
        nullable=False
    )


    status = db.Column(
        db.String(50),
        default="pendente"
    )


    tempo_foco = db.Column(
        db.Integer,
        default=0
    )


    usuario_id = db.Column(
        db.Integer,
        db.ForeignKey("usuario.id"),
        nullable=False
    )


@login_manager.user_loader
def carregar_usuario(id_usuario):

    return Usuario.query.get(
        int(id_usuario)
    )

# ==========================
# LOGIN
# ==========================

@app.route(
    "/",
    methods=["GET", "POST"]
)
def login():

    if request.method == "POST":

        email = request.form["email"]

        senha = request.form["senha"]


        usuario = Usuario.query.filter_by(
            email=email
        ).first()


        if usuario:

            senha_ok = check_password_hash(
                usuario.senha,
                senha
            )


            if senha_ok:
                
                login_user(usuario)
                
                return redirect(
                    url_for("dashboard")
                )


        return "Email ou senha incorretos"


    return render_template(
        "login.html"
    )



# ==========================
# DASHBOARD
# ==========================

@app.route("/dashboard")
@login_required
def dashboard():

    tarefas = Tarefa.query.filter_by(
        usuario_id=current_user.id
    ).all()


    total_tarefas = len(tarefas)


    return render_template(
        "index.html",
        usuario=current_user,
        tarefas=tarefas,
        total_tarefas=total_tarefas
    )
# ==========================
# CADASTRO
# ==========================

@app.route(
    "/cadastro",
    methods=["GET", "POST"]
)
def cadastro():

    if request.method == "POST":


        nome = request.form["nome"]


        email = request.form["email"]


        senha = request.form["senha"]


        senha_hash = generate_password_hash(
            senha
        )


        novo_usuario = Usuario(
            nome=nome,
            email=email,
            senha=senha_hash
        )


        db.session.add(
            novo_usuario
        )


        db.session.commit()


        return redirect(
            url_for("login")
        )


    return render_template(
        "cadastro.html"
    )



@app.route("/logout")
@login_required
def logout():

    logout_user()

    return redirect(
        url_for("login")
    )

# ==========================
# CRIAR BANCO
# ==========================

with app.app_context():

    db.create_all()


# ==========================
# CRIAR TAREFA
# ==========================

@app.route(
    "/criar_tarefa",
    methods=["POST"]
)
@login_required
def criar_tarefa():


    nova_tarefa = Tarefa(

        nome=request.form["nome"],

        horario=request.form["horario"],

        duracao=request.form["duracao"],

        categoria=request.form["categoria"],

        prioridade=request.form["prioridade"],

        usuario_id=current_user.id

    )


    db.session.add(
        nova_tarefa
    )


    db.session.commit()


    return redirect(
        url_for("dashboard")
    )


if __name__ == "__main__":

    app.run(
        debug=True
    )