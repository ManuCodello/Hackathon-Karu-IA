from flask import Flask
from models.models import db
from routes.routes import routes


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")

    # DB config (same as original)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///mi_base_datos.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(routes)

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
