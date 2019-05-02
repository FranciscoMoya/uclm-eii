const docencia = document.getElementById('docencia');
const uid = document.getElementById('chooserid');
const actualizar = document.getElementById('actualizar');
uid.onchange = function() {
    getAsignaturasProfe(uid.options[uid.selectedIndex].value);
};

function pending(v) {
    const img = document.getElementById('pending');
    img.style.display = (v ? "block": "none");
    actualizar.disabled = v;
}

function getProfesor(userid) {
    var req = new XMLHttpRequest();
    req.onload  = function() {
        if (req.status >= 300) {
            showError(req.responseText);
            return;
        }
        const profes = JSON.parse(req.responseText);
        if (profes.length < 1) {
            showError('Profesor ' + userid + ' no encontrado.');
            return;
        }
        const profe = profes[0];
        fillValues(profe);
        actualizar.style.display = (profe.head ? 'block': 'none');
        getProfesoresArea(profe);
        getAsignaturasArea(profe);
        docencia.disabled = !profe.head;
    };
    req.open('GET', '/v2/profesores.expandidos/por_userid/' + userid, true);
    req.send();
}

function getProfesoresArea(profe) {
    var req = new XMLHttpRequest();
    req.onload  = function() {
        if (req.status >= 300) {
            showError(req.responseText);
            return;
        }
        var resp = JSON.parse(req.responseText);
        for (var i = 0; i < resp.length; ++i) {
            const p = resp[i];
            uid.options.add(new Option(p.sn + ', ' + p.givenName, p.userid));
            if (p.userid == profe.userid)
                uid.options[i].selected = true;
        }
    };
    req.open('GET', '/v2/profesores.expandidos/por_areaid/' + profe.areaid, true);
    req.send();
}

function getAsignaturasArea(profe) {
    pending(true);
    var req = new XMLHttpRequest();
    req.onload  = function() {
        var resp = JSON.parse(req.responseText);
        for (var i = 0; i < resp.length; ++i) {
            const p = resp[i];
            docencia.options.add(new Option(
                Math.floor(p.semestre/2 + 0.5) + 'º. ' 
                    + p.titulo + '. ' + p.asignatura, 
                p.asigid));
        }
        sortSelect(docencia);
        getAsignaturasProfe(profe.userid);
        pending(false);
    };
    req.open('GET', '/v2/docencia.por_area/por_areaid/' + profe.areaid, true);
    req.send();
}

function getAsignaturasProfe(userid) {
    pending(true);
    var req = new XMLHttpRequest();
    req.onload  = function() {
        var asignaturas = JSON.parse(req.responseText);
        for (var i = 0; i < docencia.options.length; ++i) {
            const p = docencia.options[i];
            p.selected = valueInArray(p.value, asignaturas, function(x) {return x.asigid;});
        }
        sortSelect(docencia); // fixes Edge rendering issue
        pending(false);
    };
    req.open('GET', '/v2/docencia.por_profesor/por_userid/' + userid, true);
    req.send();
}

function sortSelect(sel) {
    var arr = new Array();
    Array.prototype.forEach.call(sel.options, function(op) {
        arr.push([op.text, op.value, op.selected]);
    });
    arr.sort(function (a,b){
        return a[0].localeCompare(b[0]);
    });
    while (sel.options.length > 0) {
        sel.options[0] = null;
    }
    arr.forEach(function(e) {
        sel.options.add(new Option(e[0], e[1], false, e[2]));
    });
}

function fillValues(data) {
    for (var key in data) {
        fillValue(key, data[key]);
    }
}

function fillValue(name, val) {
    const input = document.getElementById(name);
    if (!input) return;
    if (input.tagName == 'INPUT') {
        if (input.type == 'checkbox') {
        input.checked = val != 0;
        }
        else {
            input.value = val;
        }
    }
    else if (input.tagName == 'SELECT' && input.multiple) {
        Array.prototype.forEach.call(input.options, function(op) {
            op.selected = valueInArray(op.value, val);
        });
    }
    else if (input.tagName == 'SELECT') {
        for (var i = 0; i < input.length; ++i) {
            if (input.options[i].value == val)
                input.selectedIndex = i;
        }
    }
    else  {
        input.innerHTML = val;
    }
}

function postUI() {
    const userid = uid.options[uid.selectedIndex].value;
    pending(true);
    var req = new XMLHttpRequest();
    req.onload  = function() { 
        Array.prototype.forEach.call(docencia.selectedOptions, function(asig) {
            var req = new XMLHttpRequest();
            req.open('POST', '/v2/docencia.profesores_asignaturas/por_userid/', true);
            req.setRequestHeader("Content-Type", "application/json");
            req.send(JSON.stringify({ 'userid': userid, 'asigid': parseInt(asig.value) }));
        });        
        pending(false);
    };
    req.open('DELETE', '/v2/docencia.profesores_asignaturas/por_userid/' + userid, true);
    req.send();
}

function valueInArray(v, arr, accessor) {
    if (!arr)
        return false;
    if (!accessor)
        accessor = function(x){return x;}
    for (var vv = 0; vv < arr.length; ++vv)
        if (v == accessor(arr[vv]))
            return true;
    return false;
}