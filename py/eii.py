from flask import Flask, url_for, send_from_directory, render_template
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
import json
from crud.data_layer import close_db
from crud.desiderata import Desideratum, DesiderataList
from crud.despachos import Despacho, DespachosList
from crud.tutorias import Tutoria, TutoriasList
from crud.session import get_sp, SAML2_SETUP

import subprocess
subprocess.Popen(["python","idp.py"])

app = Flask(__name__, static_url_path='')
CORS(app)
SAML2_SETUP(app)
api = Api(app, prefix='/v1')

@app.route('/')
def index():
    sp = get_sp()
    if sp.is_user_logged_in():
        return render_template('index.html', auth = sp.get_auth_data_in_session(), logout_url = url_for('flask_saml2_sp.logout'))
    else:
        return render_template('login.html', login_url = url_for('flask_saml2_sp.login'))

@app.route('/app/<path:path>')
def auth_path(path):
    sp = get_sp()
    auth = sp.get_auth_data_in_session() if sp.is_user_logged_in() else None        
    return render_template(path, auth = auth, logout_url = url_for('flask_saml2_sp.logout'))

@app.teardown_appcontext
def close_connection(exception):
    close_db()

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

api.add_resource(DesiderataList, "/desiderata/")
api.add_resource(DespachosList, "/despachos/")
api.add_resource(TutoriasList, "/tutorias/")

api.add_resource(Desideratum, "/desiderata/<string:userid>")
api.add_resource(Despacho, "/despachos/<string:userid>")
api.add_resource(Tutoria, "/tutorias/<string:userid>")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)