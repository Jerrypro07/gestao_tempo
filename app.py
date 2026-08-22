from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user
)
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime
import os

# =====================================================
# APLICAÇÃO
# =====================================================
app = Flask(__name__)

# =====================================================
# CONFIGURAÇÕES
# =====================================================
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")

if not app.config["SECRET_KEY"]:
    raise RuntimeError(
        "SECRET_KEY não configurada. "
        "No PowerShell use: "
        '$env:SECRET_KEY="uma-chave-secreta-grande-e-segura"'
    )

serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# =====================================================
# BANCO DE DADOS
# =====================================================
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_DIR = os.path.join(BASE_DIR, "database")
os.makedirs(DATABASE_DIR, exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///" + os.path.join(DATABASE_DIR, "usuarios.db")
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# =====================================================
# LOGIN MANAGER
# =====================================================
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# =====================================================
# MODELO USUÁRIO
# =====================================================
class Usuario(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)

    tarefas = db.relationship(
        "Tarefa",
        backref="usuario",
        lazy=True,
        cascade="all, delete-orphan"
    )

# =====================================================
# MODELO TAREFA
# =====================================================
class Tarefa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    horario = db.Column(db.String(20), nullable=False)       # horário planejado (HH:MM)
    duracao = db.Column(db.String(50), nullable=False)       # duração planejada (texto, ex: "1h 30min")
    categoria = db.Column(db.String(100), nullable=False)
    prioridade = db.Column(db.String(50), nullable=False)

    # status: pendente / em_andamento / concluida
    status = db.Column(db.String(50), default="pendente")

    # controle real de tempo (persistido no banco)
    inicio_real = db.Column(db.DateTime, nullable=True)
    fim_real = db.Column(db.DateTime, nullable=True)
    tempo_real_segundos = db.Column(db.Integer, default=0)

    usuario_id = db.Column(
        db.Integer,
        db.ForeignKey("usuario.id"),
        nullable=False
    )

    def to_dict(self):
        """Serializa a tarefa para uso em JSON (fetch do script.js)."""
        return {
            "id": self.id,
            "nome": self.nome,
            "horario": self.horario,
            "duracao": self.duracao,
            "categoria": self.categoria,
            "prioridade": self.prioridade,
            "status": self.status,
            "inicio_real": self.inicio_real.strftime("%H:%M:%S") if self.inicio_real else None,
            "fim_real": self.fim_real.strftime("%H:%M:%S") if self.fim_real else None,
            "tempo_real_segundos": self.tempo_real_segundos or 0,
        }

# =====================================================
# CARREGAR USUÁRIO
# =====================================================
@login_manager.user_loader
def carregar_usuario(id_usuario):
    return db.session.get(Usuario, int(id_usuario))

# =====================================================
# LOGIN
# =====================================================
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        senha = request.form.get("senha", "")

        if not email or not senha:
            return "Preencha o e-mail e a senha."

        usuario = Usuario.query.filter_by(email=email).first()

        if usuario and check_password_hash(usuario.senha, senha):
            login_user(usuario)
            return redirect(url_for("dashboard"))

        return "E-mail ou senha incorretos."

    return render_template("login.html")

# =====================================================
# ESQUECI MINHA SENHA
# =====================================================
@app.route("/esqueci-senha", methods=["GET", "POST"])
def esqueci_senha():
    if request.method == "POST":
        email = request.form.get("email", "").strip()

        if not email:
            return "Digite seu e-mail."

        usuario = Usuario.query.filter_by(email=email).first()

        if not usuario:
            return "E-mail não encontrado."

        token = serializer.dumps(usuario.email, salt="recuperacao-senha")

        return redirect(url_for("redefinir_senha", token=token))

    return render_template("esqueci_senha.html")

# =====================================================
# REDEFINIR SENHA
# =====================================================
@app.route("/redefinir-senha/<token>", methods=["GET", "POST"])
def redefinir_senha(token):
    try:
        email = serializer.loads(token, salt="recuperacao-senha", max_age=900)
    except Exception:
        return "O link de recuperação expirou ou é inválido."

    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario:
        return "Usuário não encontrado."

    if request.method == "POST":
        nova_senha = request.form.get("senha", "")
        confirmar_senha = request.form.get("confirmar_senha", "")

        if not nova_senha:
            return "Digite uma nova senha."

        if nova_senha != confirmar_senha:
            return "As senhas não são iguais."

        if len(nova_senha) < 6:
            return "A senha deve ter pelo menos 6 caracteres."

        usuario.senha = generate_password_hash(nova_senha)
        db.session.commit()

        return redirect(url_for("login"))

    return render_template("redefinir_senha.html", token=token)

# =====================================================
# CADASTRO
# =====================================================
@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if request.method == "POST":
        nome = request.form.get("nome", "").strip()
        email = request.form.get("email", "").strip()
        senha = request.form.get("senha", "")
        confirmar_senha = request.form.get("confirmar_senha", "")

        if not nome or not email or not senha:
            return "Preencha todos os campos obrigatórios."

        if senha != confirmar_senha:
            return "As senhas não são iguais."

        if len(senha) < 6:
            return "A senha deve ter pelo menos 6 caracteres."

        usuario_existente = Usuario.query.filter_by(email=email).first()

        if usuario_existente:
            return "Este e-mail já está cadastrado."

        novo_usuario = Usuario(
            nome=nome,
            email=email,
            senha=generate_password_hash(senha)
        )

        db.session.add(novo_usuario)
        db.session.commit()

        return redirect(url_for("login"))

    return render_template("cadastro.html")

# =====================================================
# DASHBOARD
# =====================================================
@app.route("/dashboard")
@login_required
def dashboard():
    tarefas = Tarefa.query.filter_by(usuario_id=current_user.id).all()

    total_tarefas = len(tarefas)

    tarefas_concluidas = len([t for t in tarefas if t.status == "concluida"])
    tarefas_pendentes = len([t for t in tarefas if t.status == "pendente"])
    tarefas_em_andamento = len([t for t in tarefas if t.status == "em_andamento"])

    tempo_foco_segundos = sum(t.tempo_real_segundos or 0 for t in tarefas)

    return render_template(
        "index.html",
        usuario=current_user,
        tarefas=tarefas,
        total_tarefas=total_tarefas,
        tarefas_concluidas=tarefas_concluidas,
        tarefas_pendentes=tarefas_pendentes,
        tarefas_em_andamento=tarefas_em_andamento,
        tempo_foco_segundos=tempo_foco_segundos
    )

# =====================================================
# LOGOUT
# =====================================================
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# =====================================================
# CENTRAL DE AJUDA
# =====================================================
@app.route("/ajuda")
@login_required
def ajuda():
    return render_template("ajuda.html", usuario=current_user)

# =====================================================
# CRIAR TAREFA
# =====================================================
@app.route("/criar_tarefa", methods=["POST"])
@login_required
def criar_tarefa():
    nova_tarefa = Tarefa(
        nome=request.form.get("nome", ""),
        horario=request.form.get("horario", ""),
        duracao=request.form.get("duracao", ""),
        categoria=request.form.get("categoria", ""),
        prioridade=request.form.get("prioridade", ""),
        status="pendente",
        usuario_id=current_user.id
    )

    db.session.add(nova_tarefa)
    db.session.commit()

    return redirect(url_for("dashboard"))

# =====================================================
# EXCLUIR TAREFA
# =====================================================
@app.route("/excluir_tarefa/<int:tarefa_id>", methods=["POST"])
@login_required
def excluir_tarefa(tarefa_id):
    tarefa = Tarefa.query.filter_by(
        id=tarefa_id,
        usuario_id=current_user.id
    ).first_or_404()

    db.session.delete(tarefa)
    db.session.commit()

    return redirect(url_for("dashboard"))

# =====================================================
# EDITAR TAREFA
# =====================================================
@app.route("/editar_tarefa/<int:tarefa_id>", methods=["POST"])
@login_required
def editar_tarefa(tarefa_id):
    tarefa = Tarefa.query.filter_by(
        id=tarefa_id,
        usuario_id=current_user.id
    ).first_or_404()

    tarefa.nome = request.form.get("nome", tarefa.nome)
    tarefa.horario = request.form.get("horario", tarefa.horario)
    tarefa.duracao = request.form.get("duracao", tarefa.duracao)
    tarefa.categoria = request.form.get("categoria", tarefa.categoria)
    tarefa.prioridade = request.form.get("prioridade", tarefa.prioridade)

    db.session.commit()

    return redirect(url_for("dashboard"))

# =====================================================
# INICIAR TAREFA  (persiste início real no banco)
# =====================================================
@app.route("/iniciar_tarefa/<int:tarefa_id>", methods=["POST"])
@login_required
def iniciar_tarefa(tarefa_id):
    tarefa = Tarefa.query.filter_by(
        id=tarefa_id,
        usuario_id=current_user.id
    ).first_or_404()

    tarefa.status = "em_andamento"
    tarefa.inicio_real = datetime.now()
    tarefa.fim_real = None

    db.session.commit()

    return jsonify(tarefa.to_dict())

# =====================================================
# CONCLUIR TAREFA  (persiste fim real e tempo total no banco)
# =====================================================
@app.route("/concluir_tarefa/<int:tarefa_id>", methods=["POST"])
@login_required
def concluir_tarefa(tarefa_id):
    tarefa = Tarefa.query.filter_by(
        id=tarefa_id,
        usuario_id=current_user.id
    ).first_or_404()

    tarefa.status = "concluida"
    tarefa.fim_real = datetime.now()

    if tarefa.inicio_real:
        delta = tarefa.fim_real - tarefa.inicio_real
        tarefa.tempo_real_segundos = int(delta.total_seconds())
    else:
        # Concluída sem ter sido iniciada -> tempo real 0
        tarefa.tempo_real_segundos = tarefa.tempo_real_segundos or 0

    db.session.commit()

    return jsonify(tarefa.to_dict())

# =====================================================
# CRIAR BANCO DE DADOS
# =====================================================
with app.app_context():
    db.create_all()

# =====================================================
# EXECUTAR APLICAÇÃO
# =====================================================
if __name__ == "__main__":
    app.run(debug=True)