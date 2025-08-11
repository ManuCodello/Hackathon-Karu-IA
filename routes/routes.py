from flask import Blueprint, render_template, request, redirect, jsonify
from models.models import db, Ingredientes, Recetas
from utils.utils import obtener_nombres_ingredientes, obtener_nombres_recetas, armar_prompt, receta_similar, llamar_api
import json

routes = Blueprint('routes', __name__)

@routes.route("/", methods=["GET"])
def home():
    ingredientes = Ingredientes.query.all()
    recetas = Recetas.query.all()
    return render_template("index.html", recetas=recetas, ingredientes=ingredientes)

@routes.route("/agregar-ingredientes", methods=["POST"])
def agregar_ingrediente():
    data = request.get_json()
    for item in data:
        nombre = item["ingrediente"].strip().lower()
        cantidad = int(item["cantidad"])
        unidad = item["unidad"]
        tipo = item["tipo"]
        guardado = item["guardado"]
        vencimiento = item["vencimiento"]

        existente = Ingredientes.query.filter_by(ingrediente=nombre).first()
        if existente:
            existente.cantidad += cantidad
        else:
            nuevo = Ingredientes(
                ingrediente=nombre,
                cantidad=cantidad,
                unidad=unidad,
                tipo=tipo,
                guardado=guardado,
                vencimiento=vencimiento
            )
            db.session.add(nuevo)

    db.session.commit()
    return redirect("/")

@routes.route("/eliminar-ingrediente/<int:id>", methods=["POST"])
def eliminar_ingrediente(id):
    ingrediente = Ingredientes.query.filter_by(id=id).first()
    if ingrediente:
        db.session.delete(ingrediente)
        db.session.commit()
    return redirect("/")

@routes.route("/eliminar-receta/<int:id>", methods=["POST"])
def eliminar_receta(id):
    receta = Recetas.query.filter_by(id=id).first()
    if receta:
        db.session.delete(receta)
        db.session.commit()
    return redirect("/")

@routes.route("/consumir-ingrediente/<int:id>", methods=["POST"])
def consumir_ingrediente(id):
    ingrediente = Ingredientes.query.filter_by(id=id).first()
    if not ingrediente:
        return redirect("/")
    if ingrediente.cantidad == 1:
        db.session.delete(ingrediente)
    elif ingrediente.cantidad > 1:
        ingrediente.cantidad -= 1
    db.session.commit()
    return redirect("/")

@routes.route("/receta/<int:id>")
def obtener_receta(id):
    receta = Recetas.query.get(id)
    if receta:
        return jsonify({
            "id": receta.id,
            "nombre_receta": receta.nombre_receta,
            "descripcion": receta.descripcion,
            "ingredientes": receta.ingredientes,
            "pasos": receta.pasos,
            "tiempo": receta.tiempo,
            "categoria": receta.categoria,
            "dieta": receta.dieta,
            "porciones": receta.porciones,
            "calorias": receta.calorias,
            "proteina": receta.proteina,
            "grasa": receta.grasa,
            "carbohidratos": receta.carbohidratos
        })
    return jsonify({"error": "Receta no encontrada"}), 404

@routes.route("/todas-las-recetas")
def todas_las_recetas():
    recetas = Recetas.query.all()
    recetas_lista = [
        {
            "id": receta.id,
            "nombre_receta": receta.nombre_receta,
            "descripcion": receta.descripcion,
            "ingredientes": receta.ingredientes,
            "pasos": receta.pasos,
            "tiempo": receta.tiempo,
            "categoria": receta.categoria,
            "dieta": receta.dieta,
            "porciones": receta.porciones,
            "calorias": receta.calorias,
            "proteina": receta.proteina,
            "grasa": receta.grasa,
            "carbohidratos": receta.carbohidratos
        } for receta in recetas
    ]
    return jsonify(recetas_lista)

@routes.route("/crear-receta", methods=["POST"])
def crear_receta():
    nueva_receta = request.get_json()
    receta = Recetas(
        nombre_receta=nueva_receta["nombre_receta"],
        descripcion=nueva_receta["descripcion"],
        ingredientes=nueva_receta["ingredientes"],
        pasos=nueva_receta["pasos"],
        tiempo=nueva_receta["tiempo"],
        categoria=nueva_receta["categoria"],
        dieta=nueva_receta["dieta"],
        porciones=nueva_receta["porciones"],
        calorias=nueva_receta["calorias"],
        proteina=nueva_receta["proteina"],
        grasa=nueva_receta["grasa"],
        carbohidratos=nueva_receta["carbohidratos"]
    )
    db.session.add(receta)
    db.session.commit()
    return jsonify({"message": "Receta creada exitosamente", "id": receta.id})

@routes.route("/generar-receta-inteligente", methods=["POST"])
def generar_receta_ia():
    ingredientes = obtener_nombres_ingredientes()
    recetas_previas = obtener_nombres_recetas()

    for _ in range(5):
        prompt = armar_prompt(ingredientes, recetas_previas)
        response = llamar_api(prompt)

        if response.status_code != 200:
            return jsonify({"error": "Error al conectar con Magic Loops"}), 500

        try:
            receta_data = json.loads(response.text.strip())
        except json.JSONDecodeError:
            return jsonify({"error": "Respuesta no es JSON válido"}), 500

        nombre_generado = receta_data.get("nombre_receta", "").strip().lower()

        if receta_similar(nombre_generado, recetas_previas):
            continue

        return jsonify({"receta": receta_data})

    return jsonify({"error": "No se pudo generar una receta nueva tras varios intentos"}), 400

@routes.route("/guardar-receta", methods=["POST"])
def guardar_receta():
    receta_data = request.json
    try:
        nueva = Recetas(
            nombre_receta=receta_data["nombre_receta"],
            descripcion=receta_data["descripcion"],
            ingredientes="; ".join([f"{k}: {v}" for k, v in receta_data["ingredientes"].items()]),
            pasos=" | ".join([f"{k}. {v}" for k, v in receta_data["pasos"].items()]),
            tiempo=receta_data["tiempo"],
            categoria=receta_data["categoria"],
            dieta=receta_data["dieta"],
            porciones=receta_data["porciones"],
            calorias=receta_data["calorias"],
            proteina=receta_data["proteina"],
            grasa=receta_data["grasa"],
            carbohidratos=receta_data["carbohidratos"]
        )
        db.session.add(nueva)
        db.session.commit()
        return jsonify({"mensaje": "Receta guardada exitosamente"})
    except Exception as e:
        return jsonify({"error": f"No se pudo guardar la receta: {str(e)}"}), 500
